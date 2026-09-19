import User from "../models/User.js";
import { isDbConnected } from "../config/db.js";

// In-memory fallback cart for offline dev mode
const fallbackCarts = new Map();

/**
 * Normalize a cart item object
 */
function normalizeCartItem(item) {
  const identifier = item.id || item._id || item.product;
  return {
    id: identifier,
    product: item.product || identifier,
    name: item.name || "Jewelry Piece",
    price: Number(item.price) || 0,
    image: item.image || "",
    quantity: Math.max(1, Number(item.quantity) || 1),
    stock: Number(item.stock ?? 25),
    slug: item.slug || "",
    category: item.category || "",
  };
}

/**
 * @desc   Get user's synced cart from cloud
 * @route  GET /api/cart
 * @access Private
 */
export async function getCart(req, res) {
  try {
    const userId = (req.user._id || req.user.id).toString();

    if (!isDbConnected()) {
      const items = (fallbackCarts.get(userId) || []).map(normalizeCartItem);
      return res.json({ items });
    }

    const user = await User.findById(req.user._id || req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const items = (user.cart || []).map(normalizeCartItem);
    return res.json({ items });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/**
 * @desc   Sync entire cart to cloud (background save)
 * @route  PUT /api/cart
 * @access Private
 */
export async function syncCart(req, res) {
  try {
    const userId = (req.user._id || req.user.id).toString();
    const { items = [] } = req.body;

    const normalizedItems = Array.isArray(items) ? items.map(normalizeCartItem) : [];

    if (!isDbConnected()) {
      fallbackCarts.set(userId, normalizedItems);
      return res.json({ items: normalizedItems, synced: true });
    }

    const user = await User.findById(req.user._id || req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.cart = normalizedItems;
    await user.save();

    return res.json({ items: user.cart.map(normalizeCartItem), synced: true });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/**
 * @desc   Merge guest local storage cart into cloud user cart upon login
 * @route  POST /api/cart/merge
 * @access Private
 */
export async function mergeCart(req, res) {
  try {
    const userId = (req.user._id || req.user.id).toString();
    const { guestItems = [] } = req.body;

    let existingItems = [];

    if (!isDbConnected()) {
      existingItems = fallbackCarts.get(userId) || [];
    } else {
      const user = await User.findById(req.user._id || req.user.id);
      if (user) {
        existingItems = (user.cart || []).map((it) => (it.toObject ? it.toObject() : it));
      }
    }

    // Merge logic: combine existing and guest items
    const mergedMap = new Map();

    // 1. Seed with existing cloud cart
    existingItems.forEach((item) => {
      const norm = normalizeCartItem(item);
      if (norm.id) {
        mergedMap.set(norm.id, norm);
      }
    });

    // 2. Merge guest items from localStorage
    if (Array.isArray(guestItems)) {
      guestItems.forEach((guestItem) => {
        const norm = normalizeCartItem(guestItem);
        if (norm.id) {
          if (mergedMap.has(norm.id)) {
            const existing = mergedMap.get(norm.id);
            const maxStock = existing.stock || 25;
            existing.quantity = Math.min(maxStock, existing.quantity + norm.quantity);
          } else {
            mergedMap.set(norm.id, norm);
          }
        }
      });
    }

    const mergedList = Array.from(mergedMap.values());

    if (!isDbConnected()) {
      fallbackCarts.set(userId, mergedList);
      return res.json({ items: mergedList, merged: true });
    }

    const user = await User.findById(req.user._id || req.user.id);
    if (user) {
      user.cart = mergedList;
      await user.save();
    }

    return res.json({ items: mergedList, merged: true });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
