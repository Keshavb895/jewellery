import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useAuth } from "./AuthContext.jsx";
import { getCartApi, syncCartApi, mergeCartApi } from "../services/api.js";

const CartContext = createContext();

const GUEST_CART_KEY = "flash_guest_cart";
const AUTH_CART_KEY = "flash_user_cart";

export function CartProvider({ children }) {
  const { token, user, isAuthenticated } = useAuth();
  const activeTokenRef = useRef(token);
  const prevTokenRef = useRef(token);
  const prevEmailRef = useRef(user?.email || null);
  const hasHydratedRef = useRef(false);

  const [cart, setCart] = useState(() => {
    try {
      const currentToken = localStorage.getItem("aurelia_auth_token");
      const storageKey = currentToken ? AUTH_CART_KEY : GUEST_CART_KEY;
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
      // Migrate legacy key if present and not logged in
      if (!currentToken) {
        const legacy = localStorage.getItem("aurelia_cart_v2") || localStorage.getItem("aurelia_cart");
        if (legacy) {
          const parsed = JSON.parse(legacy);
          if (Array.isArray(parsed)) return parsed;
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

  // Synchronously write to localStorage (guest cart when unauthenticated, auth cart when logged in)
  useEffect(() => {
    try {
      const storageKey = token ? AUTH_CART_KEY : GUEST_CART_KEY;
      localStorage.setItem(storageKey, JSON.stringify(cart));
    } catch {
      // Ignore write errors
    }
  }, [cart, token]);

  // Auth / Login / Logout lifecycle handling
  useEffect(() => {
    activeTokenRef.current = token;

    // Clear any pending sync timeout
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }

    const hasTokenChanged = prevTokenRef.current !== token;
    const hasUserChanged = prevEmailRef.current && user?.email && prevEmailRef.current !== user.email;

    prevTokenRef.current = token;
    prevEmailRef.current = user?.email || null;

    if (!token) {
      // User logged out or guest mode
      hasHydratedRef.current = true;
      setCloudSynced(false);

      if (hasTokenChanged) {
        // Clear React state and auth storage so previous user's cart never leaks
        setCart([]);
        try {
          localStorage.removeItem(AUTH_CART_KEY);
        } catch {
          // Ignore
        }
      }
      return;
    }

    // User is logged in: Hydrate cart from MongoDB Atlas
    hasHydratedRef.current = false;
    setCloudSynced(false);

    const sessionToken = token;

    async function hydrateUserCart() {
      setIsSyncing(true);
      try {
        // Check for guest items added prior to login
        let guestItems = [];
        try {
          const savedGuest = localStorage.getItem(GUEST_CART_KEY);
          if (savedGuest) {
            const parsed = JSON.parse(savedGuest);
            if (Array.isArray(parsed) && parsed.length > 0) {
              guestItems = parsed;
            }
          }
        } catch {
          guestItems = [];
        }

        let response;
        if (guestItems.length > 0) {
          // Merge local guest items into the user's cloud cart
          response = await mergeCartApi(guestItems, sessionToken);
          try {
            localStorage.removeItem(GUEST_CART_KEY);
            localStorage.removeItem("aurelia_cart_v2");
            localStorage.removeItem("aurelia_cart");
          } catch {
            // Ignore
          }
        } else {
          // Cleanly retrieve user's cloud cart from MongoDB
          response = await getCartApi(sessionToken);
        }

        // Only update state if this session is still the active one
        if (activeTokenRef.current === sessionToken && response && Array.isArray(response.items)) {
          setCart(response.items);
          try {
            localStorage.setItem(AUTH_CART_KEY, JSON.stringify(response.items));
          } catch {
            // Ignore
          }
          setCloudSynced(true);
          hasHydratedRef.current = true;
        }
      } catch (err) {
        console.warn("Could not load cart from cloud:", err.message);
        if (activeTokenRef.current === sessionToken) {
          hasHydratedRef.current = true;
        }
      } finally {
        if (activeTokenRef.current === sessionToken) {
          setIsSyncing(false);
        }
      }
    }

    hydrateUserCart();
  }, [token, user?.email]);

  // Debounced background sync to MongoDB Atlas when authenticated
  useEffect(() => {
    // CRITICAL: NEVER sync to MongoDB if unauthenticated OR before cart has hydrated from the cloud!
    if (!token || !hasHydratedRef.current) return;

    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    const sessionToken = token;
    syncTimeoutRef.current = setTimeout(async () => {
      if (activeTokenRef.current !== sessionToken) return;
      try {
        setIsSyncing(true);
        await syncCartApi(cart, sessionToken);
        if (activeTokenRef.current === sessionToken) {
          setCloudSynced(true);
        }
      } catch (err) {
        console.warn("Background cart sync failed:", err.message);
      } finally {
        if (activeTokenRef.current === sessionToken) {
          setIsSyncing(false);
        }
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
      localStorage.removeItem(AUTH_CART_KEY);
      localStorage.removeItem(GUEST_CART_KEY);
      localStorage.removeItem("aurelia_cart_v2");
    } catch {
      // Ignore
    }
    if (token) {
      syncCartApi([], token).catch((e) => console.warn("Failed to clear cloud cart:", e));
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
