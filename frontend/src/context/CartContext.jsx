import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext.jsx";
import { getCartApi, syncCartApi, mergeCartApi } from "../services/api.js";

const CartContext = createContext();

const CART_STORAGE_KEY = "aurelia_cart_v2";

export function CartProvider({ children }) {
  const { token, isAuthenticated } = useAuth();

  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      // Migrate older aurelia_cart if present
      const old = localStorage.getItem("aurelia_cart");
      if (old) {
        const oldParsed = JSON.parse(old);
        if (Array.isArray(oldParsed)) {
          const grouped = [];
          for (const item of oldParsed) {
            const existing = grouped.find((x) => (x.id || x._id) === (item.id || item._id));
            if (existing) {
              existing.quantity += 1;
            } else {
              grouped.push({ ...item, quantity: 1 });
            }
          }
          return grouped;
        }
      }
    } catch {
      // Fallback
    }
    return [];
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [cloudSynced, setCloudSynced] = useState(false);
  const syncTimeoutRef = useRef(null);
  const lastMergedTokenRef = useRef(null);
  const isMergingRef = useRef(false);

  // Synchronously write to localStorage on any cart state update (0ms latency for UI)
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Ignore write errors
    }
  }, [cart]);

  // Auth / Login change: merge guest cart items with MongoDB cloud cart
  useEffect(() => {
    if (!token) {
      lastMergedTokenRef.current = null;
      setCloudSynced(false);
      return;
    }

    // Only merge once per token session
    if (lastMergedTokenRef.current === token) return;
    lastMergedTokenRef.current = token;

    let isCancelled = false;
    async function performLoginMerge() {
      isMergingRef.current = true;
      setIsSyncing(true);
      try {
        const currentGuestCart = (() => {
          try {
            const saved = localStorage.getItem(CART_STORAGE_KEY);
            return saved ? JSON.parse(saved) : [];
          } catch {
            return [];
          }
        })();

        const response = await mergeCartApi(currentGuestCart);
        if (!isCancelled && response && Array.isArray(response.items)) {
          setCart(response.items);
          localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(response.items));
          setCloudSynced(true);
        }
      } catch (err) {
        console.warn("Could not merge cart with cloud:", err.message);
      } finally {
        if (!isCancelled) {
          setIsSyncing(false);
          // Allow normal background debounced updates after merge settles
          setTimeout(() => {
            isMergingRef.current = false;
          }, 500);
        }
      }
    }

    performLoginMerge();

    return () => {
      isCancelled = true;
    };
  }, [token]);

  // Debounced background sync to MongoDB Atlas when authenticated
  useEffect(() => {
    if (!token || isMergingRef.current) return;

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    syncTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSyncing(true);
        await syncCartApi(cart);
        setCloudSynced(true);
      } catch (err) {
        console.warn("Background cart sync failed:", err.message);
      } finally {
        setIsSyncing(false);
      }
    }, 600);

    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, [cart, token]);

  const addToCart = (product, quantity = 1) => {
    const prodId = product.id || product._id;
    const availableStock = Number(product.stock ?? 25);

    if (availableStock <= 0) {
      alert(`"${product.name}" is currently out of stock.`);
      return false;
    }

    setCart((prev) => {
      const index = prev.findIndex((item) => (item.id || item._id) === prodId);
      if (index > -1) {
        const currentQty = prev[index].quantity || 1;
        const newQty = Math.min(availableStock, currentQty + quantity);
        if (currentQty >= availableStock) {
          alert(`Maximum available stock (${availableStock}) reached for "${product.name}".`);
          return prev;
        }
        const updated = [...prev];
        updated[index] = {
          ...updated[index],
          quantity: newQty,
          stock: availableStock,
        };
        return updated;
      }
      return [
        ...prev,
        {
          ...product,
          id: prodId,
          quantity: Math.min(availableStock, Math.max(1, quantity)),
          stock: availableStock,
        },
      ];
    });
    return true;
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((item) => (item.id || item._id) !== id));
  };

  const updateQuantity = (id, newQty) => {
    if (newQty <= 0) {
      removeFromCart(id);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if ((item.id || item._id) === id) {
          const maxStock = Number(item.stock ?? 25);
          if (newQty > maxStock) {
            alert(`Only ${maxStock} pieces in stock for "${item.name}".`);
            return { ...item, quantity: maxStock };
          }
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const [appliedCoupon, setAppliedCoupon] = useState(null);

  const clearCart = () => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    setCart([]);
    setAppliedCoupon(null);
    try {
      localStorage.removeItem(CART_STORAGE_KEY);
    } catch {
      // Ignore
    }
    if (token) {
      syncCartApi([]).catch((e) => console.warn("Failed to clear cloud cart:", e));
    }
  };

  const applyCoupon = (coupon) => {
    setAppliedCoupon(coupon);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
  const subtotal = cart.reduce((sum, item) => sum + Number(item.price || 0) * (item.quantity || 1), 0);
  const shipping = subtotal === 0 || subtotal >= 1499 ? 0 : 99;

  // Re-verify coupon if subtotal changes
  let discount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.minOrderAmount && subtotal < appliedCoupon.minOrderAmount) {
      discount = 0;
    } else if (appliedCoupon.discountType === "percentage") {
      discount = Math.round((subtotal * appliedCoupon.discountValue) / 100);
      if (appliedCoupon.maxDiscount && discount > appliedCoupon.maxDiscount) {
        discount = appliedCoupon.maxDiscount;
      }
    } else {
      discount = appliedCoupon.discountAmount || appliedCoupon.discountValue || 0;
    }
    discount = Math.min(discount, subtotal);
  }

  const total = Math.max(0, subtotal - discount) + shipping;

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
        shipping,
        discount,
        appliedCoupon,
        applyCoupon,
        removeCoupon,
        total,
        isSyncing,
        cloudSynced,
        isAuthenticated,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
