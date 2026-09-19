import React from "react";
import { Link } from "react-router-dom";
import { Shield } from "lucide-react";

export function Footer() {
  return (
    <footer>
      <div>
        <strong>AURELIA JEWELS</strong>
        <p>Everyday elegance, made yours. Timeless craftsmanship, modern silhouettes.</p>
      </div>
      <div className="footer-links">
        <Link to="/about">Our Story</Link>
        <span className="footer-dot">•</span>
        <Link to="/shop">Shop Collection</Link>
        <span className="footer-dot">•</span>
        <Link to="/admin" className="footer-admin-link">
          <Shield size={12} /> Admin Portal
        </Link>
      </div>
      <div>
        <p>© {new Date().getFullYear()} Aurelia Jewels. All rights reserved.</p>
      </div>
    </footer>
  );
}
