import express from "express";

import {
  addToCart,
  getCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from "../controllers/cartController.js";

const router = express.Router();

// Add product
router.post("/add", addToCart);

// Get cart
router.get("/:userId", getCart);

// Update quantity
router.put("/update", updateCartItem);

// Remove item
router.delete("/remove", removeFromCart);

// Clear cart
router.delete("/clear/:userId", clearCart);

export default router;