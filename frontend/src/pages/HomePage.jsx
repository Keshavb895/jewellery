import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { ProductGrid } from "../components/product/ProductGrid.jsx";
import { ShopByCategory } from "../components/home/ShopByCategory.jsx";
import { TrustFeatures } from "../components/home/TrustFeatures.jsx";
import ScrollStack, { ScrollStackItem } from "../components/home/ScrollStack.jsx";
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
        <div className="heroimg">
          <img
            src="/images/hero-banner.jpg"
            alt="Flash Haute Joaillerie Edit"
            className="hero-media-img"
            loading="eager"
            onError={(e) => {
              e.currentTarget.src = "/images/categories/jewellery-sets.jpg";
            }}
          />
        </div>
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

      {/* Shop By Category Section (Reference Image Match) */}
      <ShopByCategory onSelectCategory={handleCategoryClick} />

      {/* Luxury Trust & Value Propositions Bar */}
      <TrustFeatures />

      {/* Curated Signature Creations */}
      <section
        className="section signature-creations-section"
        style={{
          paddingTop: "60px",
          paddingBottom: "80px",
          background: "#faf7f2",
          borderTop: "1px solid rgba(212, 175, 55, 0.15)",
        }}
      >
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

      {/* Editorial Lookbook ScrollStack Section */}
      <section
        className="scroll-stack-showcase-section"
        style={{
          width: "100%",
          padding: "50px 0 30px",
          margin: 0,
          background: "#faf7f2",
          borderTop: "1px solid rgba(229, 223, 214, 0.6)",
        }}
      >
        <div className="heading reveal-up" style={{ textAlign: "center", maxWidth: "680px", margin: "0 auto 36px", padding: "0 20px" }}>
          <div>
            <small style={{ letterSpacing: "2.8px", textTransform: "uppercase", color: "#8a6d2b", fontWeight: 600, fontSize: "11px" }}>
              EDITORIAL SHOWCASE
            </small>
            <h2 style={{ margin: "8px 0 10px" }}>The Flash Lookbook</h2>
            <p style={{ color: "var(--muted)", fontSize: "14px", margin: 0 }}>
              Scroll through our signature seasonal edits, sculpted with solid gold vermeil and natural gemstones.
            </p>
          </div>
        </div>

        <div style={{ width: "100%", position: "relative" }}>
          <ScrollStack
            useWindowScroll={true}
            itemDistance={90}
            itemScale={0.035}
            itemStackDistance={28}
            baseScale={0.88}
            stackPosition="120px"
            scaleEndPosition="60px"
          >
            {/* Card 1 */}
            <ScrollStackItem>
              <img
                src="https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=1600&q=85"
                alt="The Solstice & Celestial Edit"
                className="stack-card-media"
                loading="lazy"
              />
              <div className="stack-card-overlay" />
              <div className="stack-card-content">
                <span className="stack-card-tag">HAUTE JOAILLERIE EDIT</span>
                <h3 className="stack-card-title">
                  The Solstice &<br /><i>Celestial Edit</i>
                </h3>
                <p className="stack-card-desc">
                  Flawlessly cut stones set in 18k solid gold vermeil, engineered to catch every beam of natural light.
                </p>
                <Link to="/shop?category=Necklaces" className="stack-card-btn">
                  EXPLORE THE EDIT <ArrowRight size={14} />
                </Link>
              </div>
            </ScrollStackItem>

            {/* Card 2 */}
            <ScrollStackItem>
              <img
                src="https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=1600&q=85"
                alt="Lustrous Baroque Pearls"
                className="stack-card-media"
                loading="lazy"
              />
              <div className="stack-card-overlay" />
              <div className="stack-card-content">
                <span className="stack-card-tag">HAND-KNOTTED HEIRLOOMS</span>
                <h3 className="stack-card-title">
                  Lustrous Organic<br /><i>Baroque Pearls</i>
                </h3>
                <p className="stack-card-desc">
                  Hand-selected freshwater pearls with iridescent natural nacre, individually knotted on pure silk cord.
                </p>
                <Link to="/shop?category=Earrings" className="stack-card-btn">
                  DISCOVER PEARLS <ArrowRight size={14} />
                </Link>
              </div>
            </ScrollStackItem>

            {/* Card 3 */}
            <ScrollStackItem>
              <img
                src="https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=1600&q=85"
                alt="Architectural Statement Bands"
                className="stack-card-media"
                loading="lazy"
              />
              <div className="stack-card-overlay" />
              <div className="stack-card-content">
                <span className="stack-card-tag">CONTEMPORARY SCULPTING</span>
                <h3 className="stack-card-title">
                  Architectural<br /><i>Statement Bands</i>
                </h3>
                <p className="stack-card-desc">
                  Weighty signets and geometric pavé bands contoured for effortless stacking from sunrise to dusk.
                </p>
                <Link to="/shop?category=Rings" className="stack-card-btn">
                  SHOP RINGS <ArrowRight size={14} />
                </Link>
              </div>
            </ScrollStackItem>

            {/* Card 4 */}
            <ScrollStackItem>
              <img
                src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=1600&q=85"
                alt="Liquid Gold Herringbone Chains"
                className="stack-card-media"
                loading="lazy"
              />
              <div className="stack-card-overlay" />
              <div className="stack-card-content">
                <span className="stack-card-tag">ARTISANAL HERITAGE</span>
                <h3 className="stack-card-title">
                  Liquid Gold<br /><i>Herringbone Chains</i>
                </h3>
                <p className="stack-card-desc">
                  Silky fluid links crafted to sit flush against the collarbone with effortless drape and liquid sheen.
                </p>
                <Link to="/shop?category=Necklaces" className="stack-card-btn">
                  VIEW COLLECTION <ArrowRight size={14} />
                </Link>
              </div>
            </ScrollStackItem>
          </ScrollStack>
        </div>
      </section>

      {/* Story Banner */}
      <section className="story">
        <div className="story-grid">
          <div className="story-content reveal-left">
            <small>THE FLASH STORY</small>
            <h2>
              Jewelry that
              <br />
              <i>lives with you.</i>
            </h2>
            <p>
              From quiet mornings to unforgettable evenings, Flash Jewels creates modern heirlooms that feel personal, polished, and effortless to wear.
            </p>
            <div className="story-badges">
              <div className="story-badge">
                <strong>100%</strong>
                <span>Recycled 18k Vermeil</span>
              </div>
              <div className="story-badge">
                <strong>Handcrafted</strong>
                <span>Master Atelier Finish</span>
              </div>
            </div>
            <Link className="button dark" to="/about" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "8px" }}>
              DISCOVER OUR STORY <ArrowRight size={14} />
            </Link>
          </div>

          <div className="story-media reveal-right">
            <div className="story-img-frame">
              <img
                src="https://images.unsplash.com/photo-1531995811006-35cb42e1a022?auto=format&fit=crop&w=1200&q=85"
                alt="Flash Artisanal Jewelry Craftsmanship"
                className="story-img"
                loading="lazy"
              />
              <div className="story-img-tag">
                <span>ATELIER HERITAGE • HANDCRAFTED</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
