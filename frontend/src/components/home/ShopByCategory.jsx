import React from "react";
import CircularGallery from "./CircularGallery.jsx";

const CATEGORY_ITEMS = [
  {
    image: "/images/categories/earrings.jpg",
    text: "EARRINGS",
    filterCategory: "Earrings",
  },
  {
    image: "/images/categories/pendants.jpg",
    text: "PENDANTS",
    filterCategory: "Necklaces",
  },
  {
    image: "/images/categories/jewellery-sets.jpg",
    text: "SETS",
    filterCategory: "Necklaces",
  },
  {
    image: "/images/categories/bangles.jpg",
    text: "BANGLES",
    filterCategory: "Bracelets",
  },
  {
    image: "/images/categories/rings.jpg",
    text: "RINGS",
    filterCategory: "Rings",
  },
  {
    image: "/images/categories/mangalsutra.jpg",
    text: "MANGALSUTRA",
    filterCategory: "Necklaces",
  },
];

export function ShopByCategory({ onSelectCategory }) {
  const handleItemClick = (item) => {
    if (onSelectCategory && item) {
      onSelectCategory(item.filterCategory || item.text);
    }
  };

  return (
    <section className="shop-by-category-section full-screen-category">
      {/* Editorial Luxury Header Overlay */}
      <div className="category-section-header full-screen-header">
        <div className="category-ornament-wrap">
          <span className="ornament-line gold-line-left"></span>
          <div className="ornament-diamond-badge">
            <svg
              className="ornament-diamond-icon"
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
              stroke="#d4af37"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 3h12l4 6-10 12L2 9l4-6z" />
              <path d="M2 9h20" />
              <path d="M10 3l-2 6 4 12 4-12-2-6" />
            </svg>
          </div>
          <span className="ornament-line gold-line-right"></span>
        </div>

        <h2 className="category-section-title dark-title">SHOP BY CATEGORY</h2>
        <p className="category-section-subtitle dark-subtitle">
          Explore our diverse selections. Find your style
        </p>
      </div>

      {/* Whole-Screen 3D WebGL Circular Gallery */}
      <div className="circular-gallery-fullscreen-wrap">
        <CircularGallery
          items={CATEGORY_ITEMS}
          bend={1}
          textColor="#181614"
          borderRadius={0.08}
          scrollEase={0.05}
          fontUrl="https://fonts.googleapis.com/css2?family=Orbitron:wght@700&display=swap"
          font="bold 30px Orbitron"
          scrollSpeed={2.5}
          onItemClick={handleItemClick}
        />
      </div>

      {/* Floating subtle navigation guidance badge */}
      <div className="circular-gallery-guide-badge">
        <span>Drag or Scroll to Rotate</span>
        <span className="dot-divider">•</span>
        <span>Click to Explore Category</span>
      </div>
    </section>
  );
}
