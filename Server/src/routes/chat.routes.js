import { Router } from "express";
import {
  getProjectMessages,
  createProjectMessage,
} from "../controllers/chat.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireProjectMember } from "../middleware/project.middleware.js";

const router = Router();

router.get(
  "/projects/:projectId/chat",
  authenticate,
  requireProjectMember,
  getProjectMessages
);

router.post(
  "/projects/:projectId/chat",
  authenticate,
  requireProjectMember,
  createProjectMessage
);

export default router;