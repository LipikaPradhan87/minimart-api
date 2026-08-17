import Wishlist from "../models/Wishlist.js";
import Product from "../models/Product.js";

// ADD TO WISHLIST
export const addToWishlist = async (req, res) => {
  try {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({
        success: false,
        message: "userId and productId are required",
      });
    }

    // Check product exists
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check already exists
    const existingWishlist = await Wishlist.findOne({
      user: userId,
      product: productId,
    });

    if (existingWishlist) {
      return res.status(400).json({
        success: false,
        message: "Product already exists in wishlist",
      });
    }

    const wishlist = await Wishlist.create({
      user: userId,
      product: productId,
    });

    const populatedWishlist = await wishlist.populate({
      path: "product",
      populate: {
        path: "category",
      },
    });

    res.status(201).json({
      success: true,
      message: "Product added to wishlist",
      data: populatedWishlist,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// REMOVE FROM WISHLIST
export const removeFromWishlist = async (req, res) => {
  try {
    const { userId, productId } = req.body;

    const wishlist = await Wishlist.findOneAndDelete({
      user: userId,
      product: productId,
    });

    if (!wishlist) {
      return res.status(404).json({
        success: false,
        message: "Product not found in wishlist",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product removed from wishlist",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// GET USER WISHLIST
export const getWishlist = async (req, res) => {
  try {
    const { userId } = req.params;

    const wishlist = await Wishlist.find({
      user: userId,
    })
      .populate({
        path: "product",
        populate: {
          path: "category",
        },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: wishlist.length,
      data: wishlist,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// CHECK PRODUCT IN WISHLIST
export const checkWishlist = async (req, res) => {
  try {
    const { userId, productId } = req.params;

    const wishlist = await Wishlist.findOne({
      user: userId,
      product: productId,
    });

    res.status(200).json({
      success: true,
      isWishlisted: !!wishlist,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};