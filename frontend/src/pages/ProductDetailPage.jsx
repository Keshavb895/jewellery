import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Heart, ShoppingBag, ArrowLeft, Shield, Sparkles, Truck } from "lucide-react";
import { getProductBySlug } from "../services/api.js";
import { useCart } from "../context/CartContext.jsx";
import { useWishlist } from "../context/WishlistContext.jsx";
import { useProducts } from "../context/ProductContext.jsx";

export function ProductDetailPage() {
  const { slug } = useParams();
  const { products } = useProducts();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);

  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();

  useEffect(() => {
    // Check if product is in loaded products
    const match = products.find(p => p.slug === slug || p.id === slug || p._id === slug);
    if (match) {
      setProduct(match);
      setLoading(false);
      return;
    }

    // Otherwise fallback to API lookup
    let isMounted = true;
    setLoading(true);
    getProductBySlug(slug).then((data) => {
      if (isMounted) {
        setProduct(data);
        setLoading(false);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [slug, products]);

  if (loading) {
    return <main className="detail"><div className="loading-container">Loading jewelry piece...</div></main>;
  }

  if (!product) {
    return (
      <main className="detail">
        <div className="empty">
          <h2>Product Not Found</h2>
          <p>We couldn't locate this piece in our collection.</p>
          <Link to="/shop" className="button dark">Return to Collection</Link>
        </div>
      </main>
    );
  }

  const prodId = product.id || product._id;
  const isLiked = isInWishlist(prodId);

  const handleAdd = () => {
    addToCart(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  return (
    <main className="detail">
      <div className="detailimg">
        <img
          src={product.image}
          alt={product.name}
          onError={(e) => {
            e.target.src = "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=85";
          }}
        />
      </div>

      <div className="detailinfo">
        <Link to="/shop" className="back-link">
          <ArrowLeft size={14} /> Back to Collection
        </Link>

        <small className="detail-category">{product.category}</small>
        <h1>{product.name}</h1>

        <div className="detail-price-row">
          <h2 className="current-price">₹{Number(product.price).toLocaleString("en-IN")}</h2>
          {product.mrp && product.mrp > product.price && (
            <span className="mrp-price">MRP ₹{Number(product.mrp).toLocaleString("en-IN")}</span>
          )}
        </div>

        <p className="detail-desc">{product.description}</p>

        {/* Stock Status Indicator */}
        {Number(product.stock ?? 20) <= 0 ? (
          <div className="stock-alert-box out">
            <span className="stock-dot out"></span>
            <div>
              <strong>Currently Sold Out</strong>
              <p>This artisanal piece is out of stock. Save it to your wishlist to be notified when it returns.</p>
            </div>
          </div>
        ) : Number(product.stock ?? 20) <= 5 ? (
          <div className="stock-alert-box low">
            <span className="stock-dot low"></span>
            <div>
              <strong>Hurry! Only {product.stock} pieces left in stock</strong>
              <p>Due to high artisan demand, this piece is likely to sell out soon.</p>
            </div>
          </div>
        ) : (
          <div className="stock-alert-box in-stock">
            <span className="stock-dot in"></span>
            <span>In Stock — Ready for Immediate Complimentary Dispatch</span>
          </div>
        )}

        <div className="detail-specs">
          {product.material && (
            <div className="spec-item">
              <span>Material</span>
              <strong>{product.material}</strong>
            </div>
          )}
          {product.finish && (
            <div className="spec-item">
              <span>Finish</span>
              <strong>{product.finish}</strong>
            </div>
          )}
          {product.color && (
            <div className="spec-item">
              <span>Color</span>
              <strong>{product.color}</strong>
            </div>
          )}
          {product.size && (
            <div className="spec-item">
              <span>Size</span>
              <strong>{product.size}</strong>
            </div>
          )}
        </div>

        <div className="detail-actions">
          <button
            type="button"
            className={Number(product.stock ?? 20) <= 0 ? "button full sold-out" : added ? "button dark full added" : "button dark full"}
            onClick={handleAdd}
            disabled={Number(product.stock ?? 20) <= 0}
          >
            <ShoppingBag size={17} />
            {Number(product.stock ?? 20) <= 0 ? "SOLD OUT" : added ? "ADDED TO BAG" : "ADD TO BAG"}
          </button>

          <button
            type="button"
            className={`outline full ${isLiked ? "liked-btn" : ""}`}
            onClick={() => toggleWishlist(product)}
          >
            <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
            {isLiked ? "SAVED TO WISHLIST" : "ADD TO WISHLIST"}
          </button>
        </div>

        <div className="detail-perks">
          <div><Truck size={16} /> Free insured delivery over ₹1,499</div>
          <div><Shield size={16} /> Certified craftsmanship & 1-year warranty</div>
          <div><Sparkles size={16} /> Hand-finished hypoallergenic materials</div>
        </div>
      </div>
    </main>
  );
}
