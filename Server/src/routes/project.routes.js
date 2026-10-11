import { Router } from "express";
import {
  createProject,
  getMyProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectMembers
} from "../controllers/project.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireProjectMember, requireProjectOwner } from "../middleware/project.middleware.js";

const router = Router();

router.post("/projects", authenticate, createProject);
router.get("/projects", authenticate, getMyProjects);
router.get("/projects/:projectId", authenticate, requireProjectMember, getProjectById);
router.put("/projects/:projectId", authenticate, requireProjectOwner, updateProject);
router.delete("/projects/:projectId", authenticate, requireProjectOwner, deleteProject);

router.get(
  "/projects/:projectId/members",
  authenticate,
  requireProjectMember,
  getProjectMembers
);

export default router;
