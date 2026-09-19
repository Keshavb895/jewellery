import React from "react";
import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { useCart } from "../context/CartContext.jsx";
import { CartItem } from "../components/cart/CartItem.jsx";
import { CartSummary } from "../components/cart/CartSummary.jsx";
import { EmptyState } from "../components/ui/EmptyState.jsx";

export function CartPage() {
  const { cart, totalItems } = useCart();

  return (
    <main className="cart-page">
      <div className="shophead">
        <small>YOUR BAG</small>
        <h1>Shopping Bag</h1>
        <p>{totalItems > 0 ? `${totalItems} ${totalItems === 1 ? 'item' : 'items'} selected` : "Your bag is waiting for something beautiful."}</p>
      </div>

      {cart.length > 0 ? (
        <div className="cart-content-grid">
          <div className="cartitems-list">
            {cart.map((item) => (
              <CartItem key={item.id || item._id} item={item} />
            ))}
          </div>
          <div className="cart-summary-wrapper">
            <CartSummary />
          </div>
        </div>
      ) : (
        <EmptyState
          icon={ShoppingBag}
          title="Your bag is empty"
          message="Explore our handcrafted collection to find your next signature piece."
          actionText="Explore Collection"
          actionLink="/shop"
        />
      )}
    </main>
  );
}
