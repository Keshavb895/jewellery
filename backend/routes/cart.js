import express from "express";
import { getCart, syncCart, mergeCart } from "../controllers/cartController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

router.get("/", protect, getCart);
router.put("/", protect, syncCart);
router.post("/merge", protect, mergeCart);

export default router;
