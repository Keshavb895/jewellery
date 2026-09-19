import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function protect(req, res, next) {
  try {
    const token = (req.headers.authorization || "").replace("Bearer ", "");
    if (!token) return res.status(401).json({ message: "Authentication required" });

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "aurelia_jewels_super_secret_jwt_key_2026"
    );
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) {
      if (decoded?.role) {
        req.user = { _id: decoded.id, id: decoded.id, role: decoded.role };
      } else {
        return res.status(401).json({ message: "User not found" });
      }
    }

    next();
  } catch (e) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export async function optionalAuth(req, res, next) {
  try {
    const token = (req.headers.authorization || "").replace("Bearer ", "");
    if (token) {
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "aurelia_jewels_super_secret_jwt_key_2026"
      );
      req.user = await User.findById(decoded.id).select("-password");
    }
  } catch {
    // Continue as guest
  }
  next();
}

export function adminOnly(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}
