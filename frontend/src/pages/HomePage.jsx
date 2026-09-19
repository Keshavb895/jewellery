import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Truck,
  RotateCcw,
  Gift,
  Award,
} from "lucide-react";
import { ProductGrid } from "../components/product/ProductGrid.jsx";
import { ShopByCategory } from "../components/home/ShopByCategory.jsx";
import { useProducts } from "../context/ProductContext.jsx";

export function HomePage() {
  const { products, loading } = useProducts();
  const navigate = useNavigate();

  const handleCategoryClick = (cat) => {
    navigate(`/shop?category=${encodeURIComponent(cat)}`);
  };

  // Curated showcase: featured / trending pieces
  const curatedProducts = React.useMemo(() => {
    return [...products]
      .sort((a, b) => {
        const scoreA = (a.isFeatured ? 2 : 0) + (a.isTrending ? 1 : 0);
        const scoreB = (b.isFeatured ? 2 : 0) + (b.isTrending ? 1 : 0);
        return scoreB - scoreA;
      })
      .slice(0, 8);
  }, [products]);

  return (
    <main>
      {/* Hero Section */}
      <section className="hero">
        <div className="heroimg"></div>
        <div className="heroText">
          <small>THE 2026 JEWELRY EDIT</small>
          <h1>
            Everyday
            <br />
            <i>elegance.</i>
          </h1>
          <p>
            Timeless 18k solid vermeil and freshwater pearl pieces sculpted to become part of your signature story.
          </p>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "6px" }}>
            <Link
              to="/shop"
              className="button"
              style={{ border: "none", textDecoration: "none" }}
            >
              SHOP ALL PIECES <ArrowRight size={16} />
            </Link>
            <Link className="button dark" to="/about" style={{ textDecoration: "none" }}>
              OUR CRAFT
            </Link>
          </div>
        </div>
      </section>

      {/* Trust & Guarantee Banner */}
      <section
        className="intro reveal-stagger"
        style={{
          display: "flex",
          justifyContent: "space-around",
          flexWrap: "wrap",
          gap: "20px",
          padding: "24px 5vw",
          borderBottom: "1px solid var(--line)",
          background: "rgba(251, 250, 247, 0.8)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px", color: "var(--ink)" }}>
          <Truck size={17} color="#48634f" />
          <span>Complimentary Express Delivery on orders ₹1,499+</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px", color: "var(--ink)" }}>
          <Award size={17} color="#8a6d2b" />
          <span>Certified 18k Solid Vermeil & 925 Sterling Silver</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px", color: "var(--ink)" }}>
          <Gift size={17} color="#9b3151" />
          <span>Artisanal Velvet Box Packaging & Gift Card</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12.5px", color: "var(--ink)" }}>
          <RotateCcw size={17} color="#48634f" />
          <span>15-Day Hassle-Free Exchange Guarantee</span>
        </div>
      </section>

      {/* Shop By Category Section (Reference Image Match) */}
      <ShopByCategory onSelectCategory={handleCategoryClick} />

      {/* Curated Signature Creations */}
      <section className="section" style={{ paddingTop: "40px", paddingBottom: "80px" }}>
        <div className="heading reveal-up">
          <div>
            <small style={{ letterSpacing: "2.5px", textTransform: "uppercase", color: "#8a6d2b", fontWeight: 600, fontSize: "11px" }}>
              CURATED COLLECTION
            </small>
            <h2>Signature Creations</h2>
          </div>
          <Link
            to="/shop"
            style={{
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              color: "var(--ink)",
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "1.2px",
            }}
          >
            VIEW ALL PIECES <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="loading-container">Loading handcrafted collection...</div>
        ) : (
          <ProductGrid products={curatedProducts} />
        )}
      </section>

      {/* Story Banner */}
      <section className="story">
        <div className="reveal-up">
          <small>THE AURELIA STORY</small>
          <h2>
            Jewelry that
            <br />
            <i>lives with you.</i>
          </h2>
          <p>
            From quiet mornings to unforgettable evenings, Aurelia creates modern heirlooms that feel personal, polished, and effortless to wear.
          </p>
          <Link className="button dark" to="/about" style={{ textDecoration: "none" }}>
            DISCOVER OUR STORY
          </Link>
        </div>
      </section>
    </main>
  );
}
