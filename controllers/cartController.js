import Cart from "../models/Cart.js";
import CartItem from "../models/CartItem.js";
import Product from "../models/Product.js";

// ADD PRODUCT TO CART
export const addToCart = async (req, res) => {
  try {
    const { userId, productId, quantity = 1 } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({
        success: false,
        message: "userId and productId are required",
      });
    }

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    // Check product
    const product = await Product.findById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Check stock
    if (product.stock < quantity) {
      return res.status(400).json({
        success: false,
        message: "Insufficient stock",
      });
    }

    // Find or create cart
    let cart = await Cart.findOne({
      user: userId,
    });

    if (!cart) {
      cart = await Cart.create({
        user: userId,
      });
    }

    // Check if product already exists
    let cartItem = await CartItem.findOne({
      cart: cart._id,
      product: productId,
    });

    if (cartItem) {
      const newQuantity = cartItem.quantity + quantity;

      if (newQuantity > product.stock) {
        return res.status(400).json({
          success: false,
          message: "Requested quantity exceeds available stock",
        });
      }

      cartItem.quantity = newQuantity;

      await cartItem.save();
    } else {
      cartItem = await CartItem.create({
        cart: cart._id,
        product: productId,
        quantity,
        price: product.discountPrice || product.price,
      });
    }

    const populatedItem = await cartItem.populate({
      path: "product",
      populate: {
        path: "category",
      },
    });

    res.status(200).json({
      success: true,
      message: "Product added to cart",
      data: populatedItem,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET CART
export const getCart = async (req, res) => {
  try {
    const { userId } = req.params;

    const cart = await Cart.findOne({
      user: userId,
    }).populate("user", "-password");

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    const items = await CartItem.find({
      cart: cart._id,
    }).populate({
      path: "product",
      populate: {
        path: "category",
      },
    });

    const totalItems = items.reduce(
      (total, item) => total + item.quantity,
      0
    );

    const totalAmount = items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    res.status(200).json({
      success: true,
      data: {
        cart,
        items,
        totalItems,
        totalAmount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// UPDATE CART ITEM
export const updateCartItem = async (req, res) => {
  try {
    const { cartItemId, quantity } = req.body;

    if (!cartItemId || !quantity) {
      return res.status(400).json({
        success: false,
        message: "cartItemId and quantity are required",
      });
    }

    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    const cartItem = await CartItem.findById(cartItemId)
      .populate("product");

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    if (quantity > cartItem.product.stock) {
      return res.status(400).json({
        success: false,
        message: "Requested quantity exceeds available stock",
      });
    }

    cartItem.quantity = quantity;

    await cartItem.save();

    const updatedItem = await CartItem.findById(cartItemId)
      .populate({
        path: "product",
        populate: {
          path: "category",
        },
      });

    res.status(200).json({
      success: true,
      message: "Cart quantity updated",
      data: updatedItem,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// REMOVE FROM CART
export const removeFromCart = async (req, res) => {
  try {
    const { cartItemId } = req.body;

    const cartItem = await CartItem.findByIdAndDelete(
      cartItemId
    );

    if (!cartItem) {
      return res.status(404).json({
        success: false,
        message: "Cart item not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product removed from cart",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// CLEAR CART
export const clearCart = async (req, res) => {
  try {
    const { userId } = req.params;

    const cart = await Cart.findOne({
      user: userId,
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    await CartItem.deleteMany({
      cart: cart._id,
    });

    res.status(200).json({
      success: true,
      message: "Cart cleared successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};