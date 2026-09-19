import Product from "../models/Product.js";
import { isDbConnected } from "../config/db.js";

// Built-in mutable fallback products when MongoDB is offline
let fallbackProducts = [
  {
    _id: "1",
    id: "1",
    name: "Celeste Tennis Bracelet",
    slug: "celeste-tennis-bracelet",
    price: 2499,
    mrp: 3499,
    category: { name: "Bracelets" },
    image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=900&q=85",
    description: "An iconic tennis silhouette adorned with precision-cut cubic zirconia, set in lustrous 18k gold-dipped vermeil.",
    material: "18k Gold Plated Brass",
    finish: "High Polish",
    color: "Gold",
    size: "17 cm + 3 cm extender",
    stock: 50,
    isActive: true,
    isFeatured: true,
    isTrending: true,
    isNewArrival: true,
    rating: 4.9,
    reviewCount: 38
  },
  {
    _id: "2",
    id: "2",
    name: "Luna Pearl Drop Earrings",
    slug: "luna-pearl-drop-earrings",
    price: 1899,
    mrp: 2699,
    category: { name: "Earrings" },
    image: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=85",
    description: "Naturally organic freshwater pearls suspended from sculpted minimal hoops.",
    material: "Cultured Freshwater Pearl & 925 Sterling Silver",
    finish: "Satin Sheen",
    color: "Pearl / Silver",
    size: "3.2 cm drop",
    stock: 40,
    isActive: true,
    isFeatured: true,
    isTrending: true,
    isNewArrival: false,
    rating: 4.8,
    reviewCount: 45
  },
  {
    _id: "3",
    id: "3",
    name: "Solara Layered Necklace",
    slug: "solara-layered-necklace",
    price: 2999,
    mrp: 4199,
    category: { name: "Necklaces" },
    image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=85",
    description: "Two delicately harmonized chains anchored by a radiant sunburst coin medallion.",
    material: "18k Gold Vermeil",
    finish: "Brushed Glow",
    color: "Warm Gold",
    size: "40 cm & 45 cm lengths",
    stock: 35,
    isActive: true,
    isFeatured: true,
    isTrending: true,
    isNewArrival: true,
    rating: 5.0,
    reviewCount: 62
  },
  {
    _id: "4",
    id: "4",
    name: "Astra Stack Ring",
    slug: "astra-stack-ring",
    price: 1599,
    mrp: 2299,
    category: { name: "Rings" },
    image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=900&q=85",
    description: "A geometric celestial band paved with delicate micropavé accents.",
    material: "18k Solid Vermeil & CZ",
    finish: "High Gloss",
    color: "Gold",
    size: "Adjustable 6-8",
    stock: 60,
    isActive: true,
    isFeatured: true,
    isTrending: false,
    isNewArrival: true,
    rating: 4.7,
    reviewCount: 29
  }
];

/**
 * @desc   Get all active products with filters and sorting
 * @route  GET /api/products
 * @access Public
 */
export async function getProducts(req, res) {
  try {
    if (!isDbConnected()) {
      const activeFallback = fallbackProducts.filter(p => p.isActive !== false);
      return res.json(activeFallback);
    }

    const { category, q, minPrice, maxPrice, sort, featured, trending, newArrival } = req.query;
    const filter = { isActive: true };

    if (q) {
      filter.$text = { $search: q };
    }
    if (minPrice || maxPrice) {
      filter.price = {
        ...(minPrice && { $gte: Number(minPrice) }),
        ...(maxPrice && { $lte: Number(maxPrice) }),
      };
    }
    if (featured === "true") filter.isFeatured = true;
    if (trending === "true") filter.isTrending = true;
    if (newArrival === "true") filter.isNewArrival = true;
    if (category) filter.category = category;

    let sortOption = "-createdAt";
    if (sort === "priceAsc" || sort === "low") sortOption = "price";
    if (sort === "priceDesc" || sort === "high") sortOption = "-price";

    const products = await Product.find(filter).populate("category").sort(sortOption);

    if (!products || products.length === 0) {
      return res.json(fallbackProducts.filter(p => p.isActive !== false));
    }

    return res.json(products);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/**
 * @desc   Get single product by slug or id
 * @route  GET /api/products/:slug
 * @access Public
 */
export async function getProductBySlug(req, res) {
  try {
    const { slug } = req.params;

    if (!isDbConnected()) {
      const match = fallbackProducts.find(
        (p) => (p.slug === slug || p._id === slug || p.id === slug) && p.isActive !== false
      );
      if (match) return res.json(match);
      return res.status(404).json({ message: "Product not found" });
    }

    const query = slug.match(/^[0-9a-fA-F]{24}$/)
      ? { $or: [{ slug }, { _id: slug }] }
      : { slug };

    const product = await Product.findOne(query).populate("category");

    if (!product || !product.isActive) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.json(product);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/**
 * @desc   Create a new product listing
 * @route  POST /api/products
 * @access Admin / Public in Dev
 */
export async function createProduct(req, res) {
  try {
    const body = req.body;
    if (!body.name || !body.price) {
      return res.status(400).json({ message: "Product name and price are required" });
    }

    const slug = body.slug || body.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
    const mrp = Number(body.mrp) || Math.round(Number(body.price) * 1.3);

    if (!isDbConnected()) {
      const newId = "prod_" + Date.now();
      const newProduct = {
        _id: newId,
        id: newId,
        ...body,
        slug,
        price: Number(body.price),
        mrp,
        stock: Number(body.stock) || 10,
        category: typeof body.category === "string" ? { name: body.category } : body.category,
        image: body.image || "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=85",
        isActive: true,
        rating: 5.0,
        reviewCount: 0,
        createdAt: new Date().toISOString()
      };
      fallbackProducts.unshift(newProduct);
      return res.status(201).json(newProduct);
    }

    let categoryId = body.category;
    if (typeof body.category === "string" && !body.category.match(/^[0-9a-fA-F]{24}$/)) {
      const Category = (await import("../models/Category.js")).default;
      const cat = await Category.findOneAndUpdate(
        { name: body.category },
        { name: body.category, slug: body.category.toLowerCase().replace(/[^a-z0-9]+/g, "-") },
        { upsert: true, new: true }
      );
      categoryId = cat._id;
    }

    const product = await Product.create({
      ...body,
      category: categoryId,
      mrp,
      slug,
      stock: Number(body.stock) || 15
    });
    return res.status(201).json(product);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

/**
 * @desc   Update product details
 * @route  PUT /api/products/:id
 * @access Admin / Public in Dev
 */
export async function updateProduct(req, res) {
  try {
    const { id } = req.params;

    if (!isDbConnected()) {
      const index = fallbackProducts.findIndex((p) => p._id === id || p.id === id || p.slug === id);
      if (index === -1) {
        return res.status(404).json({ message: "Product not found" });
      }
      fallbackProducts[index] = { ...fallbackProducts[index], ...req.body };
      return res.json(fallbackProducts[index]);
    }

    const product = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    return res.json(product);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

/**
 * @desc   Soft-delete or remove product listing
 * @route  DELETE /api/products/:id
 * @access Admin / Public in Dev
 */
export async function deleteProduct(req, res) {
  try {
    const { id } = req.params;

    if (!isDbConnected()) {
      const initialLen = fallbackProducts.length;
      fallbackProducts = fallbackProducts.filter((p) => p._id !== id && p.id !== id && p.slug !== id);
      if (fallbackProducts.length === initialLen) {
        return res.status(404).json({ message: "Product not found" });
      }
      return res.json({ success: true, message: "Listing deleted successfully", id });
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    return res.json({ success: true, message: "Product deactivated", product });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
