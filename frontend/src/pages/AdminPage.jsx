import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Plus,
  Trash2,
  ExternalLink,
  Package,
  ShoppingBag,
  TrendingUp,
  Search,
  CheckCircle,
  Tag,
  Clock,
  Layers,
  RefreshCw,
  Phone,
  MapPin,
  CreditCard,
  XCircle,
  Shield,
  BarChart3,
  Percent,
  Download,
  Gift
} from "lucide-react";
import { useProducts } from "../context/ProductContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { CreateProductModal } from "../components/admin/CreateProductModal.jsx";
import { SalesAnalytics } from "../components/admin/SalesAnalytics.jsx";
import { CouponsManager } from "../components/admin/CouponsManager.jsx";
import { getAllOrdersApi, updateOrderStatusApi } from "../services/api.js";

const SAMPLE_ORDERS = [
  {
    id: "AJ-8921",
    customer: "Aanya Sharma",
    email: "aanya@example.com",
    city: "Mumbai, Maharashtra",
    items: "Celeste Tennis Bracelet (x1)",
    total: 2499,
    status: "CONFIRMED",
    date: "Today, 10:45 AM",
    isGift: true,
    giftMessage: "With heartfelt blessings on your special day!"
  },
  {
    id: "AJ-8920",
    customer: "Rohan Verma",
    email: "rohan@example.com",
    city: "Bengaluru, Karnataka",
    items: "Solara Layered Necklace (x1), Astra Stack Ring (x1)",
    total: 4598,
    status: "SHIPPED",
    date: "Yesterday, 3:20 PM"
  },
  {
    id: "AJ-8919",
    customer: "Priya Nair",
    email: "priya@example.com",
    city: "Delhi NCR",
    items: "Luna Pearl Drop Earrings (x2)",
    total: 3798,
    status: "DELIVERED",
    date: "Sep 17, 2026"
  }
];

function normalizeOrder(o) {
  const id = o.orderNumber || o.id || o._id;
  const rawId = o._id || o.orderNumber || o.id;
  const customer = o.customerName || o.customer || o.user?.name || o.shippingAddress?.fullName || "Guest Customer";
  const email = o.customerEmail || o.email || o.user?.email || "";
  const phone = o.customerPhone || o.shippingAddress?.phone || "";

  let destination = "";
  if (o.shippingAddress && (o.shippingAddress.address || o.shippingAddress.city)) {
    const parts = [
      o.shippingAddress.address,
      o.shippingAddress.city,
      o.shippingAddress.state,
      o.shippingAddress.pincode
    ].filter(Boolean);
    destination = parts.join(", ");
  } else {
    destination = o.city || "Direct Storefront";
  }

  let itemsSummary = "";
  if (typeof o.items === "string") {
    itemsSummary = o.items;
  } else if (Array.isArray(o.items) && o.items.length > 0) {
    itemsSummary = o.items
      .map((it) => `${it.name || "Jewelry Piece"}${it.quantity ? ` (x${it.quantity})` : ""}`)
      .join(", ");
  } else {
    itemsSummary = "1 piece";
  }

  let formattedDate = o.date;
  if (o.createdAt) {
    try {
      const d = new Date(o.createdAt);
      formattedDate = d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      formattedDate = String(o.createdAt);
    }
  }

  return {
    id,
    rawId,
    customer,
    email,
    phone,
    destination,
    items: itemsSummary,
    total: Number(o.total) || 0,
    subtotal: Number(o.subtotal) || Number(o.total) || 0,
    discount: Number(o.discount) || 0,
    status: (o.orderStatus || o.status || "PLACED").toUpperCase(),
    date: formattedDate || "Recent",
    paymentMethod: o.paymentMethod || "COD",
    isGift: Boolean(o.isGift),
    giftMessage: o.giftMessage || "",
    couponCode: o.couponCode || "",
    createdAt: o.createdAt,
    isReal: Boolean(o.orderNumber || o._id)
  };
}

export function AdminPage() {
  const { user } = useAuth();
  const { products, addProduct, updateProduct, deleteProduct, loading } = useProducts();
  const [activeTab, setActiveTab] = useState("products"); // 'products' | 'orders' | 'analytics' | 'coupons'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMessage, setToastMessage] = useState("");
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  // Export orders to CSV (Courier Manifest Sheet)
  const exportOrdersToCSV = () => {
    if (!orders || orders.length === 0) {
      showToast("No customer orders available to export.");
      return;
    }

    const headers = [
      "Courier Reference / Order Number",
      "Order Date",
      "Customer Full Name",
      "Customer Email",
      "Contact Mobile",
      "Complete Shipping Address",
      "Items Manifest",
      "Payment Mode",
      "Subtotal (INR)",
      "Coupon Discount (INR)",
      "Total Receivable (INR)",
      "Delivery Status",
      "Gift Packaging",
      "Personalized Gift Note"
    ];

    const rows = orders.map((o) => [
      `"${o.id || ""}"`,
      `"${o.date || ""}"`,
      `"${(o.customer || "").replace(/"/g, '""')}"`,
      `"${(o.email || "").replace(/"/g, '""')}"`,
      `"${(o.phone || "").replace(/"/g, '""')}"`,
      `"${(o.destination || "").replace(/"/g, '""')}"`,
      `"${(o.items || "").replace(/"/g, '""')}"`,
      `"${o.paymentMethod || "COD"}"`,
      o.subtotal || o.total || 0,
      o.discount || 0,
      o.total || 0,
      `"${o.status || "PLACED"}"`,
      `"${o.isGift ? "YES (Complimentary Velvet Box)" : "NO"}"`,
      `"${(o.giftMessage || "").replace(/"/g, '""')}"`
    ]);

    const csvString = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `aurelia_courier_manifest_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Courier manifest sheet (BlueDart / Delhivery / Shiprocket compatible) downloaded!");
  };

  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true);
    try {
      const liveOrders = await getAllOrdersApi();
      if (Array.isArray(liveOrders) && liveOrders.length > 0) {
        setOrders(liveOrders.map(normalizeOrder));
      } else {
        setOrders(SAMPLE_ORDERS.map(normalizeOrder));
      }
    } catch (err) {
      console.warn("Could not load live orders:", err);
      setOrders(SAMPLE_ORDERS.map(normalizeOrder));
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleRestock = async (prodId, name, currentStock) => {
    const amount = window.prompt(`Enter number of units to add to "${name}":`, "20");
    if (amount !== null && !isNaN(Number(amount)) && Number(amount) > 0) {
      const newStock = Math.max(0, currentStock) + Number(amount);
      await updateProduct(prodId, { stock: newStock });
      showToast(`Restocked "${name}" to ${newStock} units.`);
    }
  };

  const handleCreateProduct = async (productData) => {
    await addProduct(productData);
    showToast(`Published "${productData.name}" successfully!`);
  };

  const handleDeleteProduct = async (id, name) => {
    if (window.confirm(`Are you sure you want to remove "${name}" from the jewelry catalog?`)) {
      await deleteProduct(id);
      showToast(`Removed "${name}" from catalog.`);
    }
  };

  const handleOrderStatusChange = async (targetOrder, newStatus) => {
    const orderId = targetOrder.id;
    const lookupId = targetOrder.rawId || targetOrder.id;

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    showToast(`Order ${orderId} marked as ${newStatus}`);

    await updateOrderStatusApi(lookupId, newStatus);
  };

  const handleCancelOrder = async (targetOrder) => {
    const orderId = targetOrder.id;
    if (
      window.confirm(
        `Are you sure you want to cancel order "${orderId}" for ${targetOrder.customer}? This will mark it as CANCELLED and restore inventory stock to the catalog.`
      )
    ) {
      await handleOrderStatusChange(targetOrder, "CANCELLED");
      showToast(`Order ${orderId} has been cancelled & inventory restored.`);
    }
  };

  // Metrics
  const totalListings = products.length;
  const totalStockUnits = products.reduce((acc, p) => acc + (Number(p.stock) || 0), 0);
  const totalCatalogValue = products.reduce((acc, p) => acc + (Number(p.price) || 0) * (Number(p.stock) || 1), 0);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q)) ||
        (p.slug && p.slug.toLowerCase().includes(q))
      );
    });
  }, [products, searchQuery]);

  return (
    <main className="admin-portal">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="admin-toast">
          <CheckCircle size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Admin Top Header */}
      <div className="admin-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px", flexWrap: "wrap" }}>
            <span className="mini-badge feat" style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 8px", fontSize: "10px" }}>
              <Shield size={12} /> VERIFIED ADMINISTRATOR
            </span>
            {user && (
              <span style={{ fontSize: "12px", color: "var(--muted)" }}>
                Signed in as: <strong style={{ color: "var(--ink)" }}>{user.name}</strong> ({user.email})
              </span>
            )}
          </div>
          <h1>Store Administration</h1>
          <p>Manage jewelry collections, create bespoke listings, and track live order fulfillment.</p>
        </div>

        <div className="admin-header-actions">
          <Link to="/shop" className="outline" target="_blank" rel="noreferrer">
            <ExternalLink size={15} /> View Storefront
          </Link>
          <button
            type="button"
            className="button dark"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus size={16} /> CREATE NEW LISTING
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <section className="admin-metrics-grid">
        <div className="metric-card">
          <div className="metric-icon">
            <Layers size={22} />
          </div>
          <div>
            <span className="metric-label">Active Listings</span>
            <strong className="metric-value">{totalListings}</strong>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <Package size={22} />
          </div>
          <div>
            <span className="metric-label">In-Stock Units</span>
            <strong className="metric-value">{totalStockUnits}</strong>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <TrendingUp size={22} />
          </div>
          <div>
            <span className="metric-label">Catalog Retail Value</span>
            <strong className="metric-value">₹{totalCatalogValue.toLocaleString("en-IN")}</strong>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">
            <ShoppingBag size={22} />
          </div>
          <div>
            <span className="metric-label">Active Orders</span>
            <strong className="metric-value">{orders.length}</strong>
          </div>
        </div>
      </section>

      {/* Tab Navigation */}
      <div className="admin-tabs">
        <button
          type="button"
          className={`tab-btn ${activeTab === "products" ? "active" : ""}`}
          onClick={() => setActiveTab("products")}
        >
          <Tag size={16} /> Jewelry Listings ({totalListings})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === "orders" ? "active" : ""}`}
          onClick={() => setActiveTab("orders")}
        >
          <Clock size={16} /> Customer Orders ({orders.length})
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === "analytics" ? "active" : ""}`}
          onClick={() => setActiveTab("analytics")}
        >
          <BarChart3 size={16} /> Sales Analytics & Revenue
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === "coupons" ? "active" : ""}`}
          onClick={() => setActiveTab("coupons")}
        >
          <Percent size={16} /> Promo Codes & Discounts
        </button>
      </div>

      {/* TAB 1: PRODUCT LISTINGS */}
      {activeTab === "products" && (
        <section className="admin-table-section">
          <div className="table-controls">
            <div className="admin-search-box">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search listings by title, category, or slug..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <span className="results-count">Showing {filteredProducts.length} pieces</span>
          </div>

          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Selling Price</th>
                  <th>Tag (MRP)</th>
                  <th>Stock</th>
                  <th>Merchandising</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((p) => {
                    const prodId = p.id || p._id;
                    const currentStock = Number(p.stock !== undefined && p.stock !== null ? p.stock : 0);
                    return (
                      <tr key={prodId}>
                        <td>
                          <div className="product-table-cell">
                            <img
                              src={p.image}
                              alt={p.name}
                              className="table-thumb"
                              onError={(e) => {
                                e.target.src = "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=85";
                              }}
                            />
                            <div>
                              <strong>{p.name}</strong>
                              <small className="cell-slug">/{p.slug}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="category-pill">{p.category}</span>
                        </td>
                        <td>
                          <strong>₹{Number(p.price).toLocaleString("en-IN")}</strong>
                        </td>
                        <td>
                          <span className="mrp-cell">₹{Number(p.mrp || p.price).toLocaleString("en-IN")}</span>
                        </td>
                        <td>
                          <span className={`stock-cell ${currentStock <= 0 ? "out" : currentStock <= 5 ? "low" : "in"}`}>
                            {currentStock <= 0 ? "0 units (Sold Out)" : `${currentStock} units`}
                          </span>
                        </td>
                        <td>
                          <div className="badges-cell">
                            {p.isNewArrival && <span className="mini-badge new">NEW</span>}
                            {p.isTrending && <span className="mini-badge trend">TRENDING</span>}
                            {p.isFeatured && <span className="mini-badge feat">FEATURED</span>}
                          </div>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <div className="row-actions">
                            <button
                              type="button"
                              className="action-icon-btn restock"
                              title="Restock / adjust inventory"
                              onClick={() => handleRestock(prodId, p.name, currentStock)}
                            >
                              <RefreshCw size={14} />
                            </button>
                            <Link
                              to={`/product/${p.slug || prodId}`}
                              className="action-icon-btn"
                              title="View listing on storefront"
                              target="_blank"
                            >
                              <ExternalLink size={16} />
                            </Link>
                            <button
                              type="button"
                              className="action-icon-btn delete"
                              title="Delete listing"
                              onClick={() => handleDeleteProduct(prodId, p.name)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="empty-table-cell">
                      No listings match your search. Try another query or create a new listing.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 2: ORDERS */}
      {activeTab === "orders" && (
        <section className="admin-table-section">
          <div className="table-controls" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div className="admin-search-box">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search orders by customer, ID, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <span className="results-count">
                {orders.filter(o => {
                  if (!searchQuery) return true;
                  const q = searchQuery.toLowerCase();
                  return (
                    o.id.toLowerCase().includes(q) ||
                    o.customer.toLowerCase().includes(q) ||
                    o.email.toLowerCase().includes(q) ||
                    o.phone.toLowerCase().includes(q) ||
                    o.destination.toLowerCase().includes(q) ||
                    o.items.toLowerCase().includes(q)
                  );
                }).length} orders found
              </span>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button
                type="button"
                className="outline"
                style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 14px", fontSize: "12px", background: "#fff" }}
                onClick={exportOrdersToCSV}
                title="Export orders manifest spreadsheet (compatible with BlueDart, Delhivery, Shiprocket)"
              >
                <Download size={14} /> Export to CSV (Courier Manifest)
              </button>

              <button
                type="button"
                className="outline"
                style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 14px", fontSize: "12px" }}
                onClick={fetchOrders}
                disabled={loadingOrders}
                title="Fetch fresh orders directly from MongoDB Atlas"
              >
                <RefreshCw size={14} className={loadingOrders ? "spin-icon" : ""} />
                {loadingOrders ? "Fetching..." : "Refresh Live Orders"}
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Destination & Phone</th>
                  <th>Items Purchased</th>
                  <th>Total</th>
                  <th>Date</th>
                  <th>Fulfillment Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.filter(o => {
                  if (!searchQuery) return true;
                  const q = searchQuery.toLowerCase();
                  return (
                    o.id.toLowerCase().includes(q) ||
                    o.customer.toLowerCase().includes(q) ||
                    o.email.toLowerCase().includes(q) ||
                    o.phone.toLowerCase().includes(q) ||
                    o.destination.toLowerCase().includes(q) ||
                    o.items.toLowerCase().includes(q)
                  );
                }).length > 0 ? (
                  orders
                    .filter(o => {
                      if (!searchQuery) return true;
                      const q = searchQuery.toLowerCase();
                      return (
                        o.id.toLowerCase().includes(q) ||
                        o.customer.toLowerCase().includes(q) ||
                        o.email.toLowerCase().includes(q) ||
                        o.phone.toLowerCase().includes(q) ||
                        o.destination.toLowerCase().includes(q) ||
                        o.items.toLowerCase().includes(q)
                      );
                    })
                    .map((o) => (
                      <tr key={o.id}>
                        <td>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <strong>{o.id}</strong>
                            <div style={{ display: "flex", gap: "4px" }}>
                              <span className="mini-badge" style={{ background: "#2d3748", color: "#fff" }}>
                                {o.paymentMethod}
                              </span>
                              {o.isReal && (
                                <span className="mini-badge feat" title="Stored in MongoDB Atlas">
                                  LIVE
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div>
                            <strong>{o.customer}</strong>
                            {o.email && <small className="cell-slug">{o.email}</small>}
                            {o.isGift && (
                              <div style={{ marginTop: "4px" }}>
                                <span className="mini-badge" style={{ background: "#fcf8ee", color: "#8a6d2b", border: "1px dashed #d5c091", display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10px" }}>
                                  <Gift size={11} /> VELVET GIFT BOX
                                </span>
                                {o.giftMessage && (
                                  <div style={{ fontSize: "11px", fontStyle: "italic", color: "#666", marginTop: "2px" }} title={o.giftMessage}>
                                    "{o.giftMessage.length > 35 ? o.giftMessage.slice(0, 35) + '...' : o.giftMessage}"
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: "12px", color: "var(--ink)", maxWidth: "240px", lineHeight: 1.4 }}>
                            <div>{o.destination}</div>
                            {o.phone && (
                              <div style={{ marginTop: "4px", fontSize: "11px", color: "var(--muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                                <Phone size={11} /> {o.phone}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: "12px", maxWidth: "260px", lineHeight: 1.4 }}>
                            {o.items}
                          </div>
                        </td>
                        <td>
                          <strong>₹{o.total.toLocaleString("en-IN")}</strong>
                          {o.discount > 0 && (
                            <small style={{ display: "block", color: "#2d5436", fontSize: "10.5px" }}>
                              (-₹{o.discount} {o.couponCode})
                            </small>
                          )}
                        </td>
                        <td>
                          <small style={{ color: "var(--muted)" }}>{o.date}</small>
                        </td>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <select
                              className={`status-select status-${(o.status || "placed").toLowerCase()}`}
                              value={o.status}
                              onChange={(e) => handleOrderStatusChange(o, e.target.value)}
                            >
                              <option value="PLACED">Placed</option>
                              <option value="CONFIRMED">Confirmed</option>
                              <option value="SHIPPED">Shipped</option>
                              <option value="DELIVERED">Delivered</option>
                              <option value="CANCELLED">Cancelled</option>
                            </select>
                            {o.status !== "CANCELLED" ? (
                              <button
                                type="button"
                                className="action-icon-btn delete"
                                title="Cancel order and restore stock"
                                onClick={() => handleCancelOrder(o)}
                              >
                                <XCircle size={15} />
                              </button>
                            ) : (
                              <span
                                className="mini-badge"
                                style={{ background: "#fed7d7", color: "#9b2c2c", border: "1px solid #feb2b2", fontWeight: 700 }}
                                title="Order cancelled. Catalog stock restored."
                              >
                                CANCELLED
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan="7" className="empty-table-cell">
                      {loadingOrders
                        ? "Loading orders from MongoDB Atlas..."
                        : "No customer orders found matching your search."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 3: SALES ANALYTICS & REVENUE DASHBOARD */}
      {activeTab === "analytics" && (
        <section className="admin-table-section">
          <SalesAnalytics orders={orders} products={products} />
        </section>
      )}

      {/* TAB 4: DISCOUNT COUPONS & PROMO MANAGER */}
      {activeTab === "coupons" && (
        <section className="admin-table-section">
          <CouponsManager onToast={showToast} />
        </section>
      )}

      {/* Create Listing Modal */}
      <CreateProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleCreateProduct}
      />
    </main>
  );
}
