import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
    {
        cart:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Cart",
            required: true,
        },
        product:{
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true,
        },
        quantity:{
            type: Number,
            required: true,
            min: 1,
            default: 1,
        },
        price:{
            type: Number,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

cartItemSchema.index(
  { cart: 1, product: 1 },
  { unique: true }
);
export default mongoose.model("CartItem", cartItemSchema);