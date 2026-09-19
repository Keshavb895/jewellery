import React from "react";
import { Heart } from "lucide-react";
import { useWishlist } from "../context/WishlistContext.jsx";
import { ProductGrid } from "../components/product/ProductGrid.jsx";
import { EmptyState } from "../components/ui/EmptyState.jsx";

export function WishlistPage() {
  const { wishlist, totalWishlist } = useWishlist();

  return (
    <main className="section wishlist-page">
      <div className="heading">
        <div>
          <small>SAVED PIECES</small>
          <h2>My Wishlist ({totalWishlist})</h2>
        </div>
      </div>

      {wishlist.length > 0 ? (
        <ProductGrid products={wishlist} />
      ) : (
        <EmptyState
          icon={Heart}
          title="Your wishlist is empty"
          message="Save the pieces that catch your eye so you can easily revisit them anytime."
          actionText="Discover Jewelry"
          actionLink="/shop"
        />
      )}
    </main>
  );
}
