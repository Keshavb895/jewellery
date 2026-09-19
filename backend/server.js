import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB, isDbConnected, getDbError } from "./config/db.js";
import productRoutes from "./routes/products.js";
import authRoutes from "./routes/auth.js";
import categoryRoutes from "./routes/categories.js";
import orderRoutes from "./routes/orders.js";
import couponRoutes from "./routes/coupons.js";
import cartRoutes from "./routes/cart.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

// API Health Check
app.get("/api/health", (req, res) => {
  const connected = isDbConnected();
  res.json({
    ok: true,
    message: "Jewels API is running",
    database: connected ? "connected" : "fallback_mode",
    databaseConnected: connected,
    dbError: connected ? null : getDbError(),
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use("/api/products", productRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/cart", cartRoutes);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Jewels backend running on http://localhost:${PORT}`);
});
