import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    customerName: String,
    customerEmail: String,
    customerPhone: String,
    items: [
      {
        product: { type: mongoose.Schema.Types.Mixed },
        name: String,
        price: Number,
        quantity: Number,
        image: String,
      },
    ],
    shippingAddress: {
      fullName: String,
      phone: String,
      address: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: "India" },
    },
    subtotal: Number,
    discount: { type: Number, default: 0 },
    shipping: { type: Number, default: 0 },
    total: Number,
    paymentMethod: { type: String, default: "COD" },
    paymentStatus: { type: String, default: "PENDING" },
    orderStatus: {
      type: String,
      enum: ["PLACED", "CONFIRMED", "PACKED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"],
      default: "PLACED",
    },
    isGift: { type: Boolean, default: false },
    giftMessage: { type: String, default: "" },
    couponCode: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
