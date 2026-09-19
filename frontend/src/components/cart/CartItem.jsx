import React from "react";
import { Link } from "react-router-dom";
import { Plus, Minus, Trash2 } from "lucide-react";
import { useCart } from "../../context/CartContext.jsx";

export function CartItem({ item }) {
  const { updateQuantity, removeFromCart } = useCart();
  const prodId = item.id || item._id;
  const quantity = item.quantity || 1;
  const maxStock = Number(item.stock ?? 25);
  const isAtMax = quantity >= maxStock;
  const itemTotal = Number(item.price || 0) * quantity;

  return (
    <div className="cartitem">
      <Link to={`/product/${item.slug || prodId}`}>
        <img src={item.image} alt={item.name} />
      </Link>

      <div className="cartitem-details">
        <Link to={`/product/${item.slug || prodId}`}>
          <h3>{item.name}</h3>
        </Link>
        <p className="unit-price">₹{Number(item.price).toLocaleString("en-IN")}</p>

        <div className="cartitem-quantity">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => updateQuantity(prodId, quantity - 1)}
          >
            <Minus size={14} />
          </button>
          <span>{quantity}</span>
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => updateQuantity(prodId, quantity + 1)}
            disabled={isAtMax}
            style={{ opacity: isAtMax ? 0.4 : 1, cursor: isAtMax ? "not-allowed" : "pointer" }}
            title={isAtMax ? "Maximum inventory reached" : "Increase quantity"}
          >
            <Plus size={14} />
          </button>
        </div>
        {isAtMax && <small className="max-stock-hint">Max available stock ({maxStock}) reached</small>}
      </div>

      <div className="cartitem-actions">
        <strong>₹{itemTotal.toLocaleString("en-IN")}</strong>
        <button
          type="button"
          className="remove-btn"
          onClick={() => removeFromCart(prodId)}
          title="Remove item"
        >
          <Trash2 size={15} />
          <span>Remove</span>
        </button>
      </div>
    </div>
  );
}
