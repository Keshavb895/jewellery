import { demoProducts } from "../data/demoProducts.js";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/**
 * Check backend and database health status
 */
export async function checkHealthApi() {
  try {
    const res = await fetch(`${API_BASE_URL}/health`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    // backend unreachable
  }
  return { ok: false, database: "offline", databaseConnected: false };
}

/**
 * Normalize product object to handle both MongoDB schema and mock schema
 */
export function normalizeProduct(p) {
  return {
    id: p.id || p._id,
    _id: p._id || p.id,
    name: p.name,
    slug: p.slug || (p.name ? p.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-") : "piece"),
    price: Number(p.price) || 0,
    mrp: Number(p.mrp) || Math.round((Number(p.price) || 0) * 1.3),
    category: typeof p.category === "object" ? p.category?.name : (p.category || "Jewelry"),
    image: p.image || (Array.isArray(p.images) && p.images[0]) || "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=900&q=85",
    images: Array.isArray(p.images) && p.images.length ? p.images : [p.image || "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=900&q=85"],
    description: p.description || "Crafted for everyday elegance with a refined, lightweight feel. Pair it with your favorites or wear it solo.",
    material: p.material || "18k Gold Vermeil",
    finish: p.finish || "High Polish",
    color: p.color || "Gold",
    size: p.size || "Standard",
    stock: (p.stock !== undefined && p.stock !== null && !isNaN(Number(p.stock))) ? Math.max(0, Number(p.stock)) : 25,
    isFeatured: Boolean(p.isFeatured),
    isTrending: Boolean(p.isTrending),
    isNewArrival: Boolean(p.isNewArrival),
    rating: p.rating || 5.0,
    reviewCount: p.reviewCount || 0,
    createdAt: p.createdAt || new Date().toISOString(),
  };
}

/**
 * Fetch all active products
 */
export async function getProducts(params = {}) {
  try {
    const query = new URLSearchParams();
    if (params.category && params.category !== "All") query.append("category", params.category);
    if (params.q) query.append("q", params.q);
    if (params.sort) query.append("sort", params.sort);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const url = `${API_BASE_URL}/products${query.toString() ? `?${query.toString()}` : ""}`;
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();

    if (Array.isArray(data) && data.length > 0) {
      return data.map(normalizeProduct);
    }
    return demoProducts.map(normalizeProduct);
  } catch (err) {
    return demoProducts.map(normalizeProduct);
  }
}

/**
 * Fetch product details by slug or id
 */
export async function getProductBySlug(slug) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const response = await fetch(`${API_BASE_URL}/products/${slug}`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data && (data._id || data.id)) return normalizeProduct(data);
    }
  } catch {
    // Ignore error, check demo
  }

  const match = demoProducts.find(p => p.slug === slug || p.id === slug || p._id === slug);
  return match ? normalizeProduct(match) : null;
}

/**
 * Create a new product listing (Admin)
 */
export async function createProductApi(productData) {
  try {
    const token = localStorage.getItem("aurelia_auth_token");
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/products`, {
      method: "POST",
      headers,
      body: JSON.stringify(productData),
    });

    if (response.ok) {
      const created = await response.json();
      return normalizeProduct(created);
    }
  } catch (err) {
    console.warn("Backend API error, creating locally:", err.message);
  }

  // Local fallback creation
  const fallbackId = "prod_" + Date.now();
  return normalizeProduct({
    ...productData,
    _id: fallbackId,
    id: fallbackId,
  });
}

/**
 * Update an existing product listing (Admin)
 */
export async function updateProductApi(id, productData) {
  try {
    const token = localStorage.getItem("aurelia_auth_token");
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(productData),
    });

    if (response.ok) {
      const updated = await response.json();
      return normalizeProduct(updated);
    }
  } catch (err) {
    console.warn("Backend API error, updating locally:", err.message);
  }

  return normalizeProduct({ ...productData, id, _id: id });
}

/**
 * Delete / deactivate a product listing (Admin)
 */
export async function deleteProductApi(id) {
  try {
    const token = localStorage.getItem("aurelia_auth_token");
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: "DELETE",
      headers,
    });

    if (response.ok) {
      return true;
    }
  } catch (err) {
    console.warn("Backend API error, deleting locally:", err.message);
  }

  return true;
}

/**
 * Log in existing user
 */
export async function loginUserApi(email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to log in");
  }

  return data;
}

/**
 * Fetch current user profile
 */
export async function getMeApi() {
  try {
    const token = localStorage.getItem("aurelia_auth_token");
    if (!token) return null;
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.warn("Could not sync user profile:", e);
  }
  return null;
}

/**
 * Update user profile (name, phone, default payment method)
 */
export async function updateProfileApi(profileData) {
  const token = localStorage.getItem("aurelia_auth_token");
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}/auth/profile`, {
    method: "PUT",
    headers,
    body: JSON.stringify(profileData),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update profile");
  }
  return data;
}

/**
 * Get all saved delivery addresses
 */
export async function getAddressesApi() {
  try {
    const token = localStorage.getItem("aurelia_auth_token");
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/auth/addresses`, { headers });
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn("Failed to fetch addresses:", err.message);
  }
  return [];
}

/**
 * Add a new delivery address
 */
export async function addAddressApi(addressData) {
  const token = localStorage.getItem("aurelia_auth_token");
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}/auth/addresses`, {
    method: "POST",
    headers,
    body: JSON.stringify(addressData),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to add address");
  }
  return data;
}

/**
 * Update an existing delivery address
 */
export async function updateAddressApi(addressId, addressData) {
  const token = localStorage.getItem("aurelia_auth_token");
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}/auth/addresses/${addressId}`, {
    method: "PUT",
    headers,
    body: JSON.stringify(addressData),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update address");
  }
  return data;
}

/**
 * Delete an address
 */
export async function deleteAddressApi(addressId) {
  const token = localStorage.getItem("aurelia_auth_token");
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}/auth/addresses/${addressId}`, {
    method: "DELETE",
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to delete address");
  }
  return data;
}

/**
 * Set an address as default
 */
export async function setDefaultAddressApi(addressId) {
  const token = localStorage.getItem("aurelia_auth_token");
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}/auth/addresses/${addressId}/default`, {
    method: "PUT",
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to set default address");
  }
  return data;
}

/**
 * Register a new user
 */
export async function registerUserApi(name, email, password) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to create account");
  }

  return data;
}

/**
 * Place a new order with shipping address
 */
export async function createOrderApi(orderData) {
  const token = localStorage.getItem("aurelia_auth_token");
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}/orders`, {
    method: "POST",
    headers,
    body: JSON.stringify(orderData),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to place order");
  }

  return data;
}

/**
 * Get all orders from backend/Atlas (Admin)
 */
export async function getAllOrdersApi() {
  try {
    const token = localStorage.getItem("aurelia_auth_token");
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`${API_BASE_URL}/orders`, {
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        return data;
      }
    }
  } catch (err) {
    console.warn("Failed to fetch all orders from server:", err.message);
  }
  return [];
}

/**
 * Update order status (Admin)
 */
export async function updateOrderStatusApi(orderId, orderStatus) {
  try {
    const token = localStorage.getItem("aurelia_auth_token");
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
      method: "PUT",
      headers,
      body: JSON.stringify({ orderStatus }),
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn("Failed to update order status on server:", err.message);
  }
  return null;
}

/**
 * Cancel an order (Admin or User)
 */
export async function cancelOrderApi(orderId) {
  return await updateOrderStatusApi(orderId, "CANCELLED");
}

/**
 * Fetch orders for the logged-in customer
 */
export async function getMyOrdersApi() {
  try {
    const token = localStorage.getItem("aurelia_auth_token");
    if (!token) return [];

    const response = await fetch(`${API_BASE_URL}/orders/mine`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        return data;
      }
    }
  } catch (err) {
    console.warn("Failed to fetch my orders:", err.message);
  }
  return [];
}

/**
 * Lookup order by order number or ID (Public / Guest)
 */
export async function getOrderByIdApi(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/orders/${id}`);
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn("Failed to fetch order by id:", err.message);
  }
  return null;
}

/**
 * Customer self-cancel order (if status is PLACED)
 */
export async function customerCancelOrderApi(orderId) {
  const token = localStorage.getItem("aurelia_auth_token");
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}/orders/${orderId}/customer-cancel`, {
    method: "POST",
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Unable to cancel order");
  }
  return data;
}

/**
 * Validate a discount coupon against subtotal
 */
export async function validateCouponApi(code, subtotal) {
  const response = await fetch(`${API_BASE_URL}/coupons/validate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, subtotal }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Invalid coupon code");
  }
  return data;
}

/**
 * Get all coupons (Admin)
 */
export async function getCouponsApi() {
  try {
    const token = localStorage.getItem("aurelia_auth_token");
    const headers = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${API_BASE_URL}/coupons`, { headers });
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn("Failed to fetch coupons:", err.message);
  }
  return [];
}

/**
 * Create new coupon (Admin)
 */
export async function createCouponApi(couponData) {
  const token = localStorage.getItem("aurelia_auth_token");
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}/coupons`, {
    method: "POST",
    headers,
    body: JSON.stringify(couponData),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to create coupon");
  }
  return data;
}

/**
 * Delete coupon (Admin)
 */
export async function deleteCouponApi(id) {
  const token = localStorage.getItem("aurelia_auth_token");
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE_URL}/coupons/${id}`, {
    method: "DELETE",
    headers,
  });

  if (!response.ok) {
    throw new Error("Failed to delete coupon");
  }
  return true;
}

/**
 * Get cloud-synced cart from MongoDB Atlas
 */
export async function getCartApi() {
  try {
    const token = localStorage.getItem("aurelia_auth_token");
    if (!token) return { items: [] };

    const response = await fetch(`${API_BASE_URL}/cart`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn("Failed to fetch cloud cart:", err.message);
  }
  return { items: [] };
}

/**
 * Sync entire cart to MongoDB Atlas in background
 */
export async function syncCartApi(items) {
  try {
    const token = localStorage.getItem("aurelia_auth_token");
    if (!token) return { items };

    const response = await fetch(`${API_BASE_URL}/cart`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ items }),
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn("Failed to sync cart to cloud:", err.message);
  }
  return { items };
}

/**
 * Merge local guest cart into MongoDB Atlas cloud cart upon login
 */
export async function mergeCartApi(guestItems) {
  try {
    const token = localStorage.getItem("aurelia_auth_token");
    if (!token) return { items: guestItems };

    const response = await fetch(`${API_BASE_URL}/cart/merge`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ guestItems }),
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn("Failed to merge cart in cloud:", err.message);
  }
  return { items: guestItems };
}
