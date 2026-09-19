import express from "express";
import {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  getOrderById,
  customerCancelOrder,
} from "../controllers/orderController.js";
import { protect, optionalAuth, adminOnly } from "../middleware/auth.js";

const router = express.Router();

router.post("/", optionalAuth, createOrder);
router.get("/mine", protect, getMyOrders);
router.get("/", protect, adminOnly, getAllOrders);
router.get("/:id", optionalAuth, getOrderById);
router.post("/:id/customer-cancel", optionalAuth, customerCancelOrder);
router.put("/:id/status", protect, adminOnly, updateOrderStatus);

export default router;
