import Notification from "../models/Notification.js";

export const createNotificationService = async ({
  userId,
  orderId = null,
  title,
  message,
  type,
}) => {
  const notification = await Notification.create({
    user: userId,
    order: orderId,
    title,
    message,
    type,
  });

  return notification;
};