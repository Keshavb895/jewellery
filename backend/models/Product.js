import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    sku: { type: String, unique: true, sparse: true },
    description: String,
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    collectionTag: { type: String }, // Renamed from reserved 'collection'
    price: { type: Number, required: true, min: 0 },
    mrp: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    material: String,
    finish: String,
    color: String,
    size: String,
    weight: String,
    images: [String],
    tags: [String],
    stock: { type: Number, default: 0, min: 0 },
    isNewArrival: { type: Boolean, default: false },
    isTrending: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    suppressReservedKeysWarning: true,
  }
);

productSchema.index({ name: "text", description: "text", tags: "text", sku: "text" });

export default mongoose.model("Product", productSchema);
