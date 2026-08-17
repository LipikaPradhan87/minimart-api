import Order from "../models/Order.js";
import OrderItem from "../models/OrderItem.js";
import Cart from "../models/Cart.js";
import CartItem from "../models/CartItem.js";
import Product from "../models/Product.js";
import { createNotificationService } from "../services/notificationService.js";
import mongoose from "mongoose";

// CREATE ORDER
export const createOrder = async (req, res) => {
  try {
    const {
      userId,
      shippingAddress,
    } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "userId is required",
      });
    }

    if (!shippingAddress) {
      return res.status(400).json({
        success: false,
        message: "Shipping address is required",
      });
    }

    // Find cart
    const cart = await Cart.findOne({
      user: userId,
    });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found",
      });
    }

    // Get cart items
    const cartItems = await CartItem.find({
      cart: cart._id,
    }).populate("product");

    if (cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty",
      });
    }

    // Check stock
    for (const item of cartItems) {
      if (!item.product) {
        return res.status(400).json({
          success: false,
          message: "Product not found",
        });
      }

      if (item.quantity > item.product.stock) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.product.productName}`,
        });
      }
    }

    // Calculate total
    let totalAmount = 0;

    for (const item of cartItems) {
      totalAmount += item.price * item.quantity;
    }

    // Create order
    const order = await Order.create({
      user: userId,
      totalAmount,
      shippingAddress,
    });
    await createNotificationService({
        userId,
        orderId: order._id,
        title: "Order Placed",
        message: `Your order has been placed successfully.`,
        type: "order",
    });
    // Create order items
    const orderItems = cartItems.map((item) => ({
      order: order._id,
      product: item.product._id,
      quantity: item.quantity,
      price: item.price,
      productName: item.product.productName,
    }));

    await OrderItem.insertMany(orderItems);

    // Reduce product stock
    for (const item of cartItems) {
      await Product.findByIdAndUpdate(
        item.product._id,
        {
          $inc: {
            stock: -item.quantity,
          },
        }
      );
    }

    // Clear cart
    await CartItem.deleteMany({
      cart: cart._id,
    });

    // Get complete order
    const completeOrder = await Order.findById(order._id)
      .populate("user");

    const completeOrderItems = await OrderItem.find({
      order: order._id,
    }).populate({
      path: "product",
      populate: {
        path: "category",
      },
    });

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: {
        order: completeOrder,
        items: completeOrderItems,
      },
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET USER ORDERS
export const getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;

    const orders = await Order.find({
      user: userId,
    }).sort({
      createdAt: -1,
    });

    const ordersWithItems = await Promise.all(
      orders.map(async (order) => {
        const items = await OrderItem.find({
          order: order._id,
        }).populate({
          path: "product",
          populate: {
            path: "category",
          },
        });

        return {
          ...order.toObject(),
          items,
        };
      })
    );

    res.status(200).json({
      success: true,
      count: orders.length,
      data: ordersWithItems,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// GET ORDER BY ID
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id).populate(
      "user",
      "-password"
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    const items = await OrderItem.find({
      order: order._id,
    }).populate({
      path: "product",
      populate: {
        path: "category",
      },
    });

    res.status(200).json({
      success: true,
      data: {
        order,
        items,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// UPDATE ORDER STATUS
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order status",
      });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }
    await createNotificationService({
        userId: order.user,
        orderId: order._id,
        title: "Order Status Updated",
        message: `Your order status is now ${status}.`,
        type: "order_status",
    });

    res.status(200).json({
      success: true,
      message: "Order status updated successfully",
      data: order,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// UPDATE PAYMENT STATUS
export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;

    const allowedStatuses = [
      "pending",
      "paid",
      "failed",
      "refunded",
    ];

    if (!allowedStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment status",
      });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { paymentStatus },
      {
        new: true,
        runValidators: true,
      }
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }
    await createNotificationService({
        userId: order.user,
        orderId: order._id,
        title: "Payment Updated",
        message: `Your payment status is now ${paymentStatus}.`,
        type: "payment",
    });
    res.status(200).json({
      success: true,
      message: "Payment status updated successfully",
      data: order,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// CANCEL ORDER
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID",
      });
    }

    // Find order
    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }
        console.log("Cancelling order:", order._id);
    console.log("Current order status:", order.status);

    // Already cancelled
    if (order.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Order is already cancelled",
      });
    }

    // Cannot cancel shipped/delivered orders
    if (["shipped", "delivered"].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled because it is already ${order.status}`,
      });
    }

    // Find order items
    const orderItems = await OrderItem.find({
      order: order._id,
    });
        // Restore stock
    for (const item of orderItems) {
      await Product.findByIdAndUpdate(
        item.product,
        {
          $inc: {
            stock: item.quantity,
          },
        }
      );
    }

    // Update order status
    order.status = "cancelled";

    await order.save();

    // Create notification
       await createNotificationService({
      userId: order.user,
      orderId: order._id,
      title: "Order Cancelled",
      message: "Your order has been cancelled.",
      type: "order_cancelled",
    });

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      data: order,
    });
  } catch (error) {
    console.error("Cancel Order Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};