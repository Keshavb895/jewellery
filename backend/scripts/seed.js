import dotenv from "dotenv";
import mongoose from "mongoose";
import Category from "../models/Category.js";
import Product from "../models/Product.js";

dotenv.config();

const categoriesData = [
  { name: "Necklaces", slug: "necklaces", description: "Delicate chains, pendants and statement chokers", order: 1, isActive: true },
  { name: "Earrings", slug: "earrings", description: "Hoops, studs, and pearl drop earrings", order: 2, isActive: true },
  { name: "Bracelets", slug: "bracelets", description: "Tennis bracelets, bangles, and dainty chains", order: 3, isActive: true },
  { name: "Rings", slug: "rings", description: "Stackable bands, signets, and solitaire rings", order: 4, isActive: true },
];

const productsData = [
  {
    name: "Celeste Tennis Bracelet",
    slug: "celeste-tennis-bracelet",
    sku: "AJ-BR-001",
    categorySlug: "bracelets",
    price: 2499,
    mrp: 3499,
    discount: 28,
    material: "18k Gold Plated Brass",
    finish: "High Polish",
    color: "Gold",
    size: "17 cm + 3 cm extender",
    images: ["https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=900&q=85"],
    description: "An iconic tennis silhouette adorned with precision-cut cubic zirconia, set in lustrous 18k gold-dipped vermeil. Designed for seamless everyday layering.",
    stock: 50,
    isFeatured: true,
    isTrending: true,
    isNewArrival: true,
    rating: 4.9,
    reviewCount: 38
  },
  {
    name: "Luna Pearl Drop Earrings",
    slug: "luna-pearl-drop-earrings",
    sku: "AJ-ER-002",
    categorySlug: "earrings",
    price: 1899,
    mrp: 2699,
    discount: 29,
    material: "Cultured Freshwater Pearl & 925 Sterling Silver",
    finish: "Satin Sheen",
    color: "Pearl / Silver",
    size: "3.2 cm drop",
    images: ["https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=85"],
    description: "Naturally organic freshwater pearls suspended from sculpted minimal hoops. Each pearl is distinct, lending timeless bespoke charm to your profile.",
    stock: 45,
    isFeatured: true,
    isTrending: true,
    isNewArrival: false,
    rating: 4.8,
    reviewCount: 45
  },
  {
    name: "Solara Layered Necklace",
    slug: "solara-layered-necklace",
    sku: "AJ-NK-003",
    categorySlug: "necklaces",
    price: 2999,
    mrp: 4199,
    discount: 28,
    material: "18k Gold Vermeil",
    finish: "Brushed Glow",
    color: "Warm Gold",
    size: "40 cm & 45 cm lengths",
    images: ["https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=85"],
    description: "Two delicately harmonized chains anchored by a radiant sunburst coin medallion. Perfect standalone statement or cascading centerpiece.",
    stock: 35,
    isFeatured: true,
    isTrending: true,
    isNewArrival: true,
    rating: 5.0,
    reviewCount: 62
  },
  {
    name: "Astra Stack Ring",
    slug: "astra-stack-ring",
    sku: "AJ-RG-004",
    categorySlug: "rings",
    price: 1599,
    mrp: 2299,
    discount: 30,
    material: "18k Solid Vermeil & CZ",
    finish: "High Gloss",
    color: "Gold",
    size: "Adjustable 6-8",
    images: ["https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=900&q=85"],
    description: "A geometric celestial band paved with delicate micropavé accents. Sculpted for comfort and effortless stacking with your heirloom rings.",
    stock: 60,
    isFeatured: true,
    isTrending: false,
    isNewArrival: true,
    rating: 4.7,
    reviewCount: 29
  },
  {
    name: "Seraphina Choker Necklace",
    slug: "seraphina-choker-necklace",
    sku: "AJ-NK-005",
    categorySlug: "necklaces",
    price: 2799,
    mrp: 3899,
    discount: 28,
    material: "Solid Sterling Silver with 14k Gold Dip",
    finish: "Mirror Polish",
    color: "Gold",
    size: "36 cm + 5 cm extension",
    images: ["https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=900&q=85"],
    description: "A liquid herringbone chain crafted to catch light with every movement. Lies flush against the collarbone with supreme fluidity.",
    stock: 30,
    isFeatured: false,
    isTrending: true,
    isNewArrival: false,
    rating: 4.9,
    reviewCount: 51
  },
  {
    name: "Aurelia Signet Ring",
    slug: "aurelia-signet-ring",
    sku: "AJ-RG-006",
    categorySlug: "rings",
    price: 2199,
    mrp: 2999,
    discount: 26,
    material: "18k Gold Plated Brass",
    finish: "Satin Brushed",
    color: "Gold",
    size: "Size 7 (US)",
    images: ["https://images.unsplash.com/photo-1603561591411-07134e71a2a9?auto=format&fit=crop&w=900&q=85"],
    description: "Subtle vintage elegance with a soft oval face and rounded edges. Minimalist, substantial, and effortlessly chic.",
    stock: 40,
    isFeatured: false,
    isTrending: true,
    isNewArrival: true,
    rating: 4.8,
    reviewCount: 33
  }
];

async function seedDatabase() {
  const mongoURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/jewels";

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 5000 });
    console.log("Connected to MongoDB successfully.");

    console.log("Clearing existing categories and products...");
    await Category.deleteMany({});
    await Product.deleteMany({});

    console.log("Inserting categories...");
    const createdCategories = await Category.insertMany(categoriesData);
    const categoryMap = {};
    for (const cat of createdCategories) {
      categoryMap[cat.slug] = cat._id;
    }

    console.log("Inserting products...");
    const preparedProducts = productsData.map((p) => {
      const { categorySlug, ...rest } = p;
      return {
        ...rest,
        category: categoryMap[categorySlug],
        isActive: true,
      };
    });

    await Product.insertMany(preparedProducts);
    console.log(`Successfully seeded ${createdCategories.length} categories and ${preparedProducts.length} products.`);

    console.log("Seeding default admin and customer accounts...");
    const bcrypt = (await import("bcryptjs")).default;
    const User = (await import("../models/User.js")).default;

    await User.deleteMany({ email: { $in: ["admin@aurelia.com", "customer@aurelia.com"] } });

    const adminPassword = await bcrypt.hash("admin123", 10);
    const customerPassword = await bcrypt.hash("customer123", 10);

    await User.create([
      {
        name: "Aurelia Admin",
        email: "admin@aurelia.com",
        password: adminPassword,
        role: "admin",
      },
      {
        name: "Sophia Sterling",
        email: "customer@aurelia.com",
        password: customerPassword,
        role: "customer",
      },
    ]);
    console.log("Seeded default users (admin@aurelia.com and customer@aurelia.com).");

    process.exit(0);
  } catch (error) {
    console.error("Database seed failed:", error.message);
    process.exit(1);
  }
}

seedDatabase();
