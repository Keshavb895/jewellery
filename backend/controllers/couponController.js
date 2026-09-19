import Coupon from "../models/Coupon.js";
import { isDbConnected } from "../config/db.js";

// Fallback demo coupons
let fallbackCoupons = [
  {
    _id: "coup_1",
    id: "coup_1",
    code: "FLASH10",
    discountType: "percentage",
    discountValue: 10,
    minOrderAmount: 1499,
    maxDiscount: 2000,
    isActive: true,
    expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
    usageCount: 14,
  },
  {
    _id: "coup_1b",
    id: "coup_1b",
    code: "AURELIA10",
    discountType: "percentage",
    discountValue: 10,
    minOrderAmount: 1499,
    maxDiscount: 2000,
    isActive: true,
    expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
    usageCount: 14,
  },
  {
    _id: "coup_2",
    id: "coup_2",
    code: "WELCOME20",
    discountType: "percentage",
    discountValue: 20,
    minOrderAmount: 2499,
    maxDiscount: 3500,
    isActive: true,
    expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
    usageCount: 8,
  },
  {
    _id: "coup_3",
    id: "coup_3",
    code: "ROYAL500",
    discountType: "fixed",
    discountValue: 500,
    minOrderAmount: 3999,
    maxDiscount: 500,
    isActive: true,
    expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    usageCount: 21,
  },
];

/**
 * @desc   Validate and calculate coupon discount
 * @route  POST /api/coupons/validate
 * @access Public
 */
export async function validateCoupon(req, res) {
  try {
    const { code, subtotal = 0 } = req.body;
    if (!code) {
      return res.status(400).json({ message: "Coupon code is required" });
    }

    const cleanCode = code.toUpperCase().trim();
    let coupon = null;

    if (!isDbConnected()) {
      coupon = fallbackCoupons.find((c) => c.code === cleanCode);
    } else {
      coupon = await Coupon.findOne({ code: cleanCode });
      if (!coupon) {
        // Check fallback list just in case
        coupon = fallbackCoupons.find((c) => c.code === cleanCode);
      }
    }

    if (!coupon) {
      return res.status(404).json({ message: `Coupon code "${cleanCode}" is invalid` });
    }

    if (!coupon.isActive) {
      return res.status(400).json({ message: `Coupon "${cleanCode}" is no longer active` });
    }

    if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
      return res.status(400).json({ message: `Coupon "${cleanCode}" has expired` });
    }

    const minAmount = Number(coupon.minOrderAmount) || 0;
    if (subtotal < minAmount) {
      return res.status(400).json({
        message: `Minimum bag value of ₹${minAmount.toLocaleString("en-IN")} required for this code`,
      });
    }

    let discount = 0;
    if (coupon.discountType === "percentage") {
      discount = Math.round((subtotal * coupon.discountValue) / 100);
      if (coupon.maxDiscount && discount > coupon.maxDiscount) {
        discount = coupon.maxDiscount;
      }
    } else {
      discount = coupon.discountValue;
    }

    discount = Math.min(discount, subtotal);

    return res.json({
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discount,
      discountAmount: discount,
      minOrderAmount: coupon.minOrderAmount,
      maxDiscount: coupon.maxDiscount,
      message: `Coupon "${coupon.code}" applied! You saved ₹${discount.toLocaleString("en-IN")}`,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/**
 * @desc   Get all coupons
 * @route  GET /api/coupons
 * @access Admin
 */
export async function getCoupons(req, res) {
  try {
    if (!isDbConnected()) {
      return res.json(fallbackCoupons);
    }

    let coupons = await Coupon.find().sort("-createdAt");
    if (!coupons || coupons.length === 0) {
      // Seed fallback coupons to Atlas if empty
      try {
        coupons = await Coupon.insertMany(fallbackCoupons.map(({ _id, id, ...c }) => c));
      } catch {
        return res.json(fallbackCoupons);
      }
    }
    return res.json(coupons);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/**
 * @desc   Create new coupon
 * @route  POST /api/coupons
 * @access Admin
 */
export async function createCoupon(req, res) {
  try {
    const {
      code,
      discountType = "percentage",
      discountValue,
      minOrderAmount = 0,
      maxDiscount = 10000,
      expiryDate,
    } = req.body;

    if (!code || !discountValue) {
      return res.status(400).json({ message: "Code and discount value are required" });
    }

    const cleanCode = code.toUpperCase().trim();

    if (!isDbConnected()) {
      const newCoupon = {
        _id: "coup_" + Date.now(),
        id: "coup_" + Date.now(),
        code: cleanCode,
        discountType,
        discountValue: Number(discountValue),
        minOrderAmount: Number(minOrderAmount) || 0,
        maxDiscount: Number(maxDiscount) || 10000,
        isActive: true,
        expiryDate: expiryDate ? new Date(expiryDate).toISOString() : new Date(Date.now() + 90 * 86400000).toISOString(),
        usageCount: 0,
      };
      fallbackCoupons.unshift(newCoupon);
      return res.status(201).json(newCoupon);
    }

    const existing = await Coupon.findOne({ code: cleanCode });
    if (existing) {
      return res.status(409).json({ message: `Coupon "${cleanCode}" already exists` });
    }

    const coupon = await Coupon.create({
      code: cleanCode,
      discountType,
      discountValue: Number(discountValue),
      minOrderAmount: Number(minOrderAmount) || 0,
      maxDiscount: Number(maxDiscount) || 10000,
      isActive: true,
      expiryDate: expiryDate ? new Date(expiryDate) : new Date(Date.now() + 90 * 86400000),
    });

    return res.status(201).json(coupon);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

/**
 * @desc   Delete / Deactivate coupon
 * @route  DELETE /api/coupons/:id
 * @access Admin
 */
export async function deleteCoupon(req, res) {
  try {
    const { id } = req.params;

    if (!isDbConnected()) {
      fallbackCoupons = fallbackCoupons.filter((c) => c._id !== id && c.code !== id);
      return res.json({ message: "Coupon deleted" });
    }

    const isObjectId = typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
    const query = isObjectId ? { _id: id } : { code: id.toUpperCase() };

    await Coupon.findOneAndDelete(query);
    return res.json({ message: "Coupon deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}
