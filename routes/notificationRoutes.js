import express from "express";

import {
  createNotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from "../controllers/notificationController.js";

const router = express.Router();


// Create notification
router.post("/", createNotification);


// Get user notifications
router.get(
  "/user/:userId",
  getUserNotifications
);


// Mark one notification as read
router.put(
  "/:id/read",
  markNotificationAsRead
);


// Mark all notifications as read
router.put(
  "/user/:userId/read-all",
  markAllNotificationsAsRead
);


// Delete notification
router.delete(
  "/:id",
  deleteNotification
);


export default router;