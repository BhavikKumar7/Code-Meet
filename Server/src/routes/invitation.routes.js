import { Router } from "express";
import {
  inviteProjectMember,
  getMyProjectInvitations,
  respondToProjectInvitation,
} from "../controllers/invitation.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireProjectOwner } from "../middleware/project.middleware.js";

const router = Router();

router.post("/projects/:projectId/invitations", authenticate, requireProjectOwner, inviteProjectMember);
router.get("/invitations", authenticate, getMyProjectInvitations);
router.put("/invitations/:invitationId/respond", authenticate, respondToProjectInvitation);

export default router;
