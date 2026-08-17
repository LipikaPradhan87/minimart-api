import express from "express";

import {
  addToWishlist,
  removeFromWishlist,
  getWishlist,
  checkWishlist,
} from "../controllers/wishlistController.js";

const router = express.Router();

router.post("/add", addToWishlist);

router.delete("/remove", removeFromWishlist);

router.get("/:userId", getWishlist);

router.get(
  "/check/:userId/:productId",
  checkWishlist
);

export default router;