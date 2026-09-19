import React from "react";

export const CATEGORY_ITEMS = [
  {
    id: "jewellery-sets",
    name: "Jewellery Sets",
    filterCategory: "Necklaces",
    image: "/images/categories/jewellery-sets.jpg",
  },
  {
    id: "pendants",
    name: "Pendants",
    filterCategory: "Necklaces",
    image: "/images/categories/pendants.jpg",
  },
  {
    id: "rings",
    name: "Rings",
    filterCategory: "Rings",
    image: "/images/categories/rings.jpg",
  },
  {
    id: "earrings",
    name: "Earrings",
    filterCategory: "Earrings",
    image: "/images/categories/earrings.jpg",
  },
  {
    id: "bangles",
    name: "Bangles",
    filterCategory: "Bracelets",
    image: "/images/categories/bangles.jpg",
  },
  {
    id: "mangalsutra",
    name: "Mangalsutra",
    filterCategory: "Necklaces",
    image: "/images/categories/mangalsutra.jpg",
  },
];

export function ShopByCategory({ onSelectCategory }) {
  return (
    <section className="shop-by-category-section">
      <div className="category-section-header reveal-up">
        {/* Diamond ornament with horizontal lines */}
        <div className="category-ornament-wrap">
          <span className="ornament-line"></span>
          <div className="ornament-diamond-badge reveal-scale">
            <svg
              className="ornament-diamond-icon"
              viewBox="0 0 24 24"
              width="24"
              height="24"
              fill="none"
              stroke="#b58d46"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 3h12l4 6-10 12L2 9l4-6z" />
              <path d="M2 9h20" />
              <path d="M10 3l-2 6 4 12 4-12-2-6" />
            </svg>
          </div>
          <span className="ornament-line"></span>
        </div>

        <h2 className="category-section-title">SHOP BY CATEGORY</h2>
        <p className="category-section-subtitle">Explore our diverse selections. Find your style</p>
      </div>

      <div className="category-grid reveal-stagger">
        {CATEGORY_ITEMS.map((item) => (
          <div
            key={item.id}
            className="category-card"
            onClick={() => onSelectCategory && onSelectCategory(item.filterCategory || item.name)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && onSelectCategory) {
                onSelectCategory(item.filterCategory || item.name);
              }
            }}
          >
            <div className="category-img-wrap">
              <img
                src={item.image}
                alt={item.name}
                loading="lazy"
                onError={(e) => {
                  e.target.src =
                    "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=85";
                }}
              />
            </div>
            <h3 className="category-card-name">{item.name}</h3>
          </div>
        ))}
      </div>
    </section>
  );
}
