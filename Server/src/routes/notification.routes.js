import express from "express";
import {
  getMyNotifications,
  markNotificationRead,
} from "../controllers/notification.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/notifications", authenticate, getMyNotifications);

router.put(
  "/notifications/:id/read",
  authenticate,
  markNotificationRead
);

export default router;