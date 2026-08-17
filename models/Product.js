import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    productName:{
      type: String,
      required: true,
      trim: true,
    },
    description:{
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    discountPrice:{
      type: Number,
    },
    image:{
      type: String,
    },

    category:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    brand:{
      type: String,
    },

    stock:{
      type: Number,
      required: true,
      default: 0,
    },

    rating:{
      type: Number,
      default: 0,
    },
    isActive:{
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, }
);

const Product = mongoose.model("Product", productSchema);
export default Product;
