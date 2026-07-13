import express from "express";
import {
  createNotification,
  deleteNotification,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  unreadCount,
  updateNotification,
} from "../controllers/notificationController.js";

const router = express.Router();

router.get("/notifications", listNotifications);
router.get("/notifications/unread-count", unreadCount);
router.post("/notifications", createNotification);
router.put("/notifications/:id", updateNotification);
router.patch("/notifications/:id/read", markNotificationRead);
router.patch("/notifications/read-all", markAllNotificationsRead);
router.delete("/notifications/:id", deleteNotification);

export default router;
