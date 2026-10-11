import { Router } from "express";

import {
  createInterviewSession,
  getInterviewSession,
  updateInterviewStatus,
  createInterviewEvaluation,
  getInterviewEvaluation,
} from "../controllers/interview.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";

const router = Router();

router.post(
  "/interviews",
  authenticate,
  createInterviewSession
);

router.get(
  "/interviews/:sessionId",
  authenticate,
  getInterviewSession
);

router.put(
  "/interviews/:sessionId/status",
  authenticate,
  updateInterviewStatus
);

router.post(
  "/interviews/:sessionId/evaluation",
  authenticate,
  createInterviewEvaluation
);

router.get(
  "/interviews/:sessionId/evaluation",
  authenticate,
  getInterviewEvaluation
);

export default router;