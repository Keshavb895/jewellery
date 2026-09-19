import React, { createContext, useContext, useState, useEffect } from "react";

const WishlistContext = createContext();

const WISHLIST_STORAGE_KEY = "aurelia_wish";

export function WishlistProvider({ children }) {
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem(WISHLIST_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify(wishlist));
    } catch {
      // Ignore
    }
  }, [wishlist]);

  const isInWishlist = (id) => {
    return wishlist.some(item => (item.id || item._id) === id);
  };

  const toggleWishlist = (product) => {
    const prodId = product.id || product._id;
    setWishlist(prev => {
      const exists = prev.some(item => (item.id || item._id) === prodId);
      if (exists) {
        return prev.filter(item => (item.id || item._id) !== prodId);
      }
      return [...prev, product];
    });
  };

  const removeFromWishlist = (id) => {
    setWishlist(prev => prev.filter(item => (item.id || item._id) !== id));
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        isInWishlist,
        toggleWishlist,
        removeFromWishlist,
        totalWishlist: wishlist.length
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
