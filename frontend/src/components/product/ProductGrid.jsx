import React from "react";
import { ProductCard } from "./ProductCard.jsx";

export function ProductGrid({ products = [] }) {
  if (!products.length) {
    return null;
  }

  return (
    <div className="grid reveal-stagger">
      {products.map((p, index) => (
        <ProductCard key={p.id || p._id || index} product={p} index={index} />
      ))}
    </div>
  );
}
