import express from "express";
import { createProduct, getProductById, getProducts, getProductsByCategory, updateProduct, deleteProduct } from "../controllers/productController.js";

const router = express.Router();

router.post("/", createProduct);

router.get("/", getProducts);

router.get("/:id", getProductById);
router.get("/category/:categoryId", getProductsByCategory);

router.put("/:id", updateProduct);
router.delete("/:id", deleteProduct);

export default router;