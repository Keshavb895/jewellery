import express from "express";
import {
  validateCoupon,
  getCoupons,
  createCoupon,
  deleteCoupon,
} from "../controllers/couponController.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();

router.post("/validate", validateCoupon);
router.get("/", protect, adminOnly, getCoupons);
router.post("/", protect, adminOnly, createCoupon);
router.delete("/:id", protect, adminOnly, deleteCoupon);

export default router;
