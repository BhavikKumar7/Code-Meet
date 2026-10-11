import { db } from "../prisma/db.js";

export const requireProjectMember = async (req, res, next) => {
  try {
    const userId = Number(req.user?.userId);
    const projectId = Number(req.params.projectId);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ message: "Authentication required" });
    }
    if (!Number.isInteger(projectId) || projectId <= 0) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    const project = await db.orm.public.Project.where({ id: projectId }).first();
    if (!project) return res.status(404).json({ message: "Project not found" });

    const membership = await db.orm.public.ProjectMember
      .where({ projectId, userId })
      .first();
    if (!membership) {
      return res.status(403).json({ message: "You are not a member of this project" });
    }

    req.project = project;
    req.projectMembership = membership;
    next();
  } catch (error) {
    console.error("Project membership check error:", error);
    return res.status(500).json({ message: "Project access check failed" });
  }
};

export const requireProjectOwner = async (req, res, next) => {
  try {
    const userId = Number(req.user?.userId);
    const projectId = Number(req.params.projectId);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ message: "Authentication required" });
    }
    if (!Number.isInteger(projectId) || projectId <= 0) {
      return res.status(400).json({ message: "Invalid project ID" });
    }

    const project = await db.orm.public.Project.where({ id: projectId }).first();
    if (!project) return res.status(404).json({ message: "Project not found" });

    const membership = await db.orm.public.ProjectMember
      .where({ projectId, userId })
      .first();
    if (!membership || membership.role !== "OWNER") {
      return res.status(403).json({ message: "Only the project owner can perform this action" });
    }

    req.project = project;
    req.projectMembership = membership;
    next();
  } catch (error) {
    console.error("Project owner authorization error:", error);
    return res.status(500).json({ message: "Project authorization check failed" });
  }
};
