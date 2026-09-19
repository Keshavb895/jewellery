import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { useCart } from "../../context/CartContext.jsx";
import { useWishlist } from "../../context/WishlistContext.jsx";

export function ProductCard({ product, index = 0 }) {
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [added, setAdded] = useState(false);

  const prodId = product.id || product._id;
  const isLiked = isInWishlist(prodId);
  const stock = Number(product.stock ?? 20);
  const isOutOfStock = stock <= 0;
  const isLowStock = stock > 0 && stock <= 4;

  const handleAdd = (e) => {
    e.preventDefault();
    if (isOutOfStock) return;
    addToCart(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  const handleToggleWishlist = (e) => {
    e.preventDefault();
    toggleWishlist(product);
  };

  return (
    <article className={`card ${isOutOfStock ? "out-of-stock" : ""}`} style={{ "--card-index": index }}>
      <div className="cardimg">
        <Link to={`/product/${product.slug || prodId}`}>
          <img src={product.image} alt={product.name} loading="lazy" />
        </Link>
        <button
          type="button"
          aria-label={isLiked ? "Remove from wishlist" : "Add to wishlist"}
          className={isLiked ? "liked" : ""}
          onClick={handleToggleWishlist}
        >
          <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
        </button>

        {isOutOfStock ? (
          <span className="sold-out-badge">SOLD OUT</span>
        ) : product.isNewArrival !== false ? (
          <span>NEW</span>
        ) : null}
      </div>

      <Link to={`/product/${product.slug || prodId}`}>
        <h3>{product.name}</h3>
      </Link>

      <div className="card-price-row">
        <p className="card-price">₹{Number(product.price).toLocaleString("en-IN")}</p>
        {isLowStock && <span className="low-stock-hint">Only {stock} left!</span>}
      </div>

      <button
        type="button"
        className={`add ${isOutOfStock ? "sold-out" : added ? "added" : ""}`}
        onClick={handleAdd}
        disabled={isOutOfStock}
      >
        {isOutOfStock ? "SOLD OUT" : added ? "ADDED TO BAG" : "ADD TO BAG"}
      </button>
    </article>
  );
}
