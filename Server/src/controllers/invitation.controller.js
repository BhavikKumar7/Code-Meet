import { broadcastNotification } from "../notificationSocket.js";
import { db } from "../prisma/db.js";

export const inviteProjectMember = async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    const inviterId = Number(req.user?.userId);
    const username = typeof req.body?.username === "string" ? req.body.username.trim() : "";

    if (!username) return res.status(400).json({ message: "Username is required" });

    const invitee = await db.orm.public.User.where({ username }).first();
    if (!invitee) return res.status(404).json({ message: "User with this username was not found" });
    if (Number(invitee.id) === inviterId) {
      return res.status(400).json({ message: "You cannot invite yourself" });
    }

    const existingMember = await db.orm.public.ProjectMember
      .where({ projectId, userId: Number(invitee.id) })
      .first();
    if (existingMember) return res.status(409).json({ message: "User is already a project member" });

    const pendingInvitations = await db.orm.public.ProjectInvitation
      .where({ projectId, inviteeId: Number(invitee.id), status: "PENDING" })
      .all();
    if (pendingInvitations.length) {
      return res.status(409).json({ message: "A pending invitation already exists for this user" });
    }

    const invitation = await db.orm.public.ProjectInvitation.create({
      projectId,
      inviterId,
      inviteeId: Number(invitee.id),
      status: "PENDING",
    });

    const projectName = req.project?.name || `Project #${projectId}`;
    const inviter = await db.orm.public.User.where({ id: inviterId }).first();
    const notification = await db.orm.public.Notification.create({
      userId: Number(invitee.id),
      title: "Project invitation",
      message: `${inviter?.username || "A user"} invited you to join ${projectName}. Open your invitations to accept or reject.`,
      type: "PROJECT_INVITATION",
    });

    broadcastNotification(Number(invitee.id), notification);

    return res.status(201).json({ message: "Invitation sent", invitation });
  } catch (error) {
    console.error("Invite project member error:", error);
    return res.status(500).json({ message: "Failed to send project invitation" });
  }
};

export const getMyProjectInvitations = async (req, res) => {
  try {
    const userId = Number(req.user?.userId);
    const invitations = await db.orm.public.ProjectInvitation.where({ inviteeId: userId }).all();
    const pending = invitations.filter((invitation) => invitation.status === "PENDING");
    const enriched = await Promise.all(pending.map(async (invitation) => {
      const [project, inviter] = await Promise.all([
        db.orm.public.Project.where({ id: Number(invitation.projectId) }).first(),
        db.orm.public.User.where({ id: Number(invitation.inviterId) }).first(),
      ]);
      return {
        ...invitation,
        project: project ? { id: project.id, name: project.name, description: project.description } : null,
        inviter: inviter ? { id: inviter.id, username: inviter.username, name: inviter.name } : null,
      };
    }));
    return res.status(200).json({ invitations: enriched });
  } catch (error) {
    console.error("Get project invitations error:", error);
    return res.status(500).json({ message: "Failed to fetch invitations" });
  }
};


export const respondToProjectInvitation = async (req, res) => {
  try {
    const invitationId = Number(req.params.invitationId);
    const userId = Number(req.user?.userId);
    const action = req.body?.action;

    if (!Number.isInteger(invitationId) || invitationId <= 0) {
      return res.status(400).json({ message: "Invalid invitation ID" });
    }

    if (!["ACCEPT", "REJECT"].includes(action)) {
      return res.status(400).json({
        message: "Action must be ACCEPT or REJECT",
      });
    }

    const invitation = await db.orm.public.ProjectInvitation
      .where({ id: invitationId, inviteeId: userId })
      .first();

    if (!invitation) {
      return res.status(404).json({ message: "Invitation not found" });
    }

    if (invitation.status !== "PENDING") {
      return res.status(409).json({
        message: "This invitation has already been responded to",
      });
    }

    const [respondingUser, project] = await Promise.all([
      db.orm.public.User.where({ id: userId }).first(),
      db.orm.public.Project.where({
        id: Number(invitation.projectId),
      }).first(),
    ]);

    const isAccepted = action === "ACCEPT";

    // Add the user to the project only when the invitation is accepted.
    if (isAccepted) {
      const existingMember = await db.orm.public.ProjectMember
        .where({
          projectId: Number(invitation.projectId),
          userId,
        })
        .first();

      if (!existingMember) {
        await db.orm.public.ProjectMember.create({
          projectId: Number(invitation.projectId),
          userId,
          role: "MEMBER",
        });
      }
    }

    // Update the invitation status.
    const updated = await db.orm.public.ProjectInvitation
      .where({ id: invitationId })
      .update({
        status: isAccepted ? "ACCEPTED" : "REJECTED",
        respondedAt: new Date().toISOString(),
      });

    // Notify the person who originally sent the invitation.
    const notification = await db.orm.public.Notification.create({
      userId: Number(invitation.inviterId),
      title: isAccepted
        ? "Invitation Accepted"
        : "Invitation Rejected",
      message: isAccepted
        ? `${respondingUser?.username || "A user"} accepted your invitation to join ${project?.name || `Project #${invitation.projectId}`}.`
        : `${respondingUser?.username || "A user"} rejected your invitation to join ${project?.name || `Project #${invitation.projectId}`}.`,
      type: isAccepted
        ? "INVITATION_ACCEPTED"
        : "INVITATION_REJECTED",
    });

    broadcastNotification(Number(invitation.inviterId), notification);

    return res.status(200).json({
      message: isAccepted
        ? "Invitation accepted"
        : "Invitation rejected",
      invitation: updated,
    });
  } catch (error) {
    console.error("Respond to project invitation error:", error);

    return res.status(500).json({
      message: "Failed to respond to invitation",
    });
  }
};

