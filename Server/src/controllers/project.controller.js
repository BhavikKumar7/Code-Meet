import { db } from "../prisma/db.js";

export const createProject = async (req, res) => {
  let project;
  try {
    const { name, description } = req.body;
    const userId = Number(req.user?.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ message: "Authentication required" });
    }
    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Project name is required" });
    }

    project = await db.orm.public.Project.create({
      name: name.trim(),
      description: typeof description === "string" && description.trim() ? description.trim() : null,
      createdBy: userId,
    });

    try {
      await db.orm.public.ProjectMember.create({
        projectId: project.id,
        userId,
        role: "OWNER",
      });
    } catch (error) {
      await db.orm.public.Project.where({ id: project.id }).delete();
      throw error;
    }

    return res.status(201).json({ message: "Project created successfully", project });
  } catch (error) {
    console.error("Create project error:", error);
    return res.status(500).json({ message: "Failed to create project" });
  }
};

export const getMyProjects = async (req, res) => {
  try {
    const userId = Number(req.user?.userId);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const memberships = await db.orm.public.ProjectMember.where({ userId }).all();
    const projectIds = new Set(memberships.map((m) => Number(m.projectId)));
    const allProjects = await db.orm.public.Project.all();
    const projects = allProjects.filter((project) => projectIds.has(Number(project.id)));

    return res.status(200).json({ projects });
  } catch (error) {
    console.error("Get my projects error:", error);
    return res.status(500).json({ message: "Failed to fetch projects" });
  }
};

export const getProjectById = async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    if (!Number.isInteger(projectId) || projectId <= 0) {
      return res.status(400).json({ message: "Invalid project ID" });
    }
    const project = await db.orm.public.Project.where({ id: projectId }).first();
    if (!project) return res.status(404).json({ message: "Project not found" });
    return res.status(200).json({ project });
  } catch (error) {
    console.error("Get project error:", error);
    return res.status(500).json({ message: "Failed to fetch project" });
  }
};

export const updateProject = async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    const { name, description } = req.body;
    if (!Number.isInteger(projectId) || projectId <= 0) {
      return res.status(400).json({ message: "Invalid project ID" });
    }
    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Project name is required" });
    }
    const updatedProject = await db.orm.public.Project.where({ id: projectId }).update({
      name: name.trim(),
      description: typeof description === "string" && description.trim() ? description.trim() : null,
    });
    return res.status(200).json({ message: "Project updated successfully", project: updatedProject });
  } catch (error) {
    console.error("Update project error:", error);
    return res.status(500).json({ message: "Failed to update project" });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);
    if (!Number.isInteger(projectId) || projectId <= 0) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    // Remove project-owned records first because the current schema may not cascade deletes.
    const invitations = await db.orm.public.ProjectInvitation.where({ projectId }).all();
    for (const invitation of invitations) {
      await db.orm.public.ProjectInvitation.where({ id: invitation.id }).delete();
    }
    const files = await db.orm.public.ProjectFile.where({ projectId }).all();
    for (const file of files) await db.orm.public.ProjectFile.where({ id: file.id }).delete();
    const messages = await db.orm.public.ChatMessage.where({ projectId }).all();
    for (const message of messages) await db.orm.public.ChatMessage.where({ id: message.id }).delete();
    const members = await db.orm.public.ProjectMember.where({ projectId }).all();
    for (const member of members) await db.orm.public.ProjectMember.where({ id: member.id }).delete();
    const sessions = await db.orm.public.InterviewSession.where({ projectId }).all();
    for (const session of sessions) {
      const evaluations = await db.orm.public.InterviewEvaluation.where({ interviewId: session.id }).all();
      for (const evaluation of evaluations) await db.orm.public.InterviewEvaluation.where({ id: evaluation.id }).delete();
      await db.orm.public.InterviewSession.where({ id: session.id }).delete();
    }
    await db.orm.public.Project.where({ id: projectId }).delete();
    return res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    console.error("Delete project error:", error);
    return res.status(500).json({ message: "Failed to delete project" });
  }
};

export const getProjectMembers = async (req, res) => {
  try {
    const projectId = Number(req.params.projectId);

    const members = await db.orm.public.ProjectMember
      .where({ projectId })
      .all();

    const membersWithUsers = await Promise.all(
      members.map(async (member) => {
        const user = await db.orm.public.User
          .where({ id: Number(member.userId) })
          .first();

        return {
          ...member,
          user: user
            ? {
                id: user.id,
                username: user.username,
                email: user.email,
                name: user.name,
              }
            : null,
        };
      })
    );

    return res.status(200).json({
      members: membersWithUsers,
    });
  } catch (error) {
    console.error("Failed to fetch project members:", error);

    return res.status(500).json({
      message: "Failed to fetch project members.",
    });
  }
};