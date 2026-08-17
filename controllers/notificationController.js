import Notification from "../models/Notification.js";

// ========================================
// CREATE NOTIFICATION
// ========================================

// CREATE NOTIFICATION
export const createNotification = async (req, res) => {
  try {
    const {
      userId,
      orderId,
      title,
      message,
      type,
    } = req.body;

    if (!userId || !title || !message || !type) {
      return res.status(400).json({
        success: false,
        message:
          "userId, title, message and type are required",
      });
    }

    const notification = await Notification.create({
      user: userId,
      order: orderId || null,
      title,
      message,
      type,
    });

    res.status(201).json({
      success: true,
      message: "Notification created successfully",
      data: notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// ========================================
// GET USER NOTIFICATIONS
// ========================================

export const getUserNotifications = async (
  req,
  res
) => {
  try {
    const { userId } = req.params;

    const notifications =
      await Notification.find({
        user: userId,
      })
        .populate("order")
        .sort({
          createdAt: -1,
        });

    const unreadCount =
      await Notification.countDocuments({
        user: userId,
        isRead: false,
      });

    res.status(200).json({
      success: true,
      count: notifications.length,
      unreadCount,
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ========================================
// MARK ONE NOTIFICATION AS READ
// ========================================

export const markNotificationAsRead = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const notification =
      await Notification.findByIdAndUpdate(
        id,
        {
          isRead: true,
        },
        {
          new: true,
        }
      );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// ========================================
// MARK ALL AS READ
// ========================================

export const markAllNotificationsAsRead =
  async (req, res) => {
    try {
      const { userId } = req.params;

      await Notification.updateMany(
        {
          user: userId,
          isRead: false,
        },
        {
          $set: {
            isRead: true,
          },
        }
      );

      res.status(200).json({
        success: true,
        message:
          "All notifications marked as read",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };


// ========================================
// DELETE NOTIFICATION
// ========================================

export const deleteNotification = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    const notification =
      await Notification.findByIdAndDelete(id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};