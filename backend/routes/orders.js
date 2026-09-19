import express from "express";
import {
  createOrder,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  getOrderById,
  customerCancelOrder,
} from "../controllers/orderController.js";
import { protect, adminOnly } from "../middleware/auth.js";

const router = express.Router();

router.post("/", protect, createOrder);
router.get("/mine", protect, getMyOrders);
router.get("/", protect, adminOnly, getAllOrders);
router.get("/:id", protect, getOrderById);
router.post("/:id/customer-cancel", protect, customerCancelOrder);
router.put("/:id/status", protect, adminOnly, updateOrderStatus);

export default router;
