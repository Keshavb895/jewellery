import Category from "../models/Category.js";
import { isDbConnected } from "../config/db.js";

const fallbackCategories = [
  { _id: "c1", name: "Necklaces", slug: "necklaces", order: 1, isActive: true },
  { _id: "c2", name: "Earrings", slug: "earrings", order: 2, isActive: true },
  { _id: "c3", name: "Bracelets", slug: "bracelets", order: 3, isActive: true },
  { _id: "c4", name: "Rings", slug: "rings", order: 4, isActive: true }
];

/**
 * @desc   Get all active categories
 * @route  GET /api/categories
 * @access Public
 */
export async function getCategories(req, res) {
  try {
    if (!isDbConnected()) {
      return res.json(fallbackCategories);
    }
    const categories = await Category.find({ isActive: true }).sort({ order: 1, name: 1 });
    if (!categories || categories.length === 0) {
      return res.json(fallbackCategories);
    }
    return res.json(categories);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/**
 * @desc   Create new category
 * @route  POST /api/categories
 * @access Admin
 */
export async function createCategory(req, res) {
  try {
    const category = await Category.create(req.body);
    return res.status(201).json(category);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

/**
 * @desc   Update category
 * @route  PUT /api/categories/:id
 * @access Admin
 */
export async function updateCategory(req, res) {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    return res.json(category);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

/**
 * @desc   Deactivate category
 * @route  DELETE /api/categories/:id
 * @access Admin
 */
export async function deleteCategory(req, res) {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    return res.json({ message: "Category deactivated", category });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
