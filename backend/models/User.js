import mongoose from "mongoose";

const addressSchema = new mongoose.Schema(
  {
    tag: { type: String, enum: ["Home", "Office", "Gifting", "Other"], default: "Home" },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, default: "Delhi" },
    pincode: { type: String, required: true },
    country: { type: String, default: "India" },
    isDefault: { type: Boolean, default: false },
  },
  { _id: true, timestamps: true }
);

const cartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.Mixed },
    id: String,
    name: { type: String, required: true },
    price: { type: Number, required: true },
    image: String,
    quantity: { type: Number, default: 1, min: 1 },
    stock: { type: Number, default: 25 },
    slug: String,
    category: String,
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    phone: { type: String, default: "" },
    role: { type: String, enum: ["customer", "admin"], default: "customer" },
    defaultPaymentMethod: { type: String, enum: ["COD", "UPI"], default: "COD" },
    addresses: [addressSchema],
    cart: [cartItemSchema],
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
