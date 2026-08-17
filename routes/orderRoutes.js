import express from "express";

import {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  cancelOrder,
} from "../controllers/orderController.js";

const router = express.Router();

// Create order
router.post("/", createOrder);

// Get user's orders
router.get("/user/:userId", getUserOrders);

// Get single order
router.get("/:id", getOrderById);

// Update order status
router.put("/:id/status", updateOrderStatus);

// Update payment status
router.put("/:id/payment", updatePaymentStatus);

// Cancel order
router.delete("/:id/cancel", cancelOrder);

export default router;