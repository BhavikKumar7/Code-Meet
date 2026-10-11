import { Router } from "express";

import {
  createProjectFile,
  getProjectFiles,
  getProjectFileById,
  updateProjectFile,
  deleteProjectFile,
} from "../controllers/file.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { requireProjectMember } from "../middleware/project.middleware.js";

const router = Router();

router.post(
  "/projects/:projectId/files",
  authenticate,
  requireProjectMember,
  createProjectFile
);

router.get(
  "/projects/:projectId/files",
  authenticate,
  requireProjectMember,
  getProjectFiles
);

router.get(
  "/projects/:projectId/files/:fileId",
  authenticate,
  requireProjectMember,
  getProjectFileById
);

router.put(
  "/projects/:projectId/files/:fileId",
  authenticate,
  requireProjectMember,
  updateProjectFile
);

router.delete(
  "/projects/:projectId/files/:fileId",
  authenticate,
  requireProjectMember,
  deleteProjectFile
);

export default router;