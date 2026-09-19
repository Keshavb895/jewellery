import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  XCircle,
  AlertCircle,
  MapPin,
  Phone,
  Search,
  RefreshCw,
  ShoppingBag,
  ExternalLink,
  ChevronRight,
  Gift,
  Printer
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { getMyOrdersApi, getOrderByIdApi, customerCancelOrderApi } from "../services/api.js";
import { InvoiceModal } from "../components/orders/InvoiceModal.jsx";

function normalizeCustomerOrder(o) {
  const orderNumber = o.orderNumber || o.id || o._id;
  const status = (o.orderStatus || o.status || "PLACED").toUpperCase();

  let items = [];
  if (Array.isArray(o.items)) {
    items = o.items.map((it) => ({
      name: it.name || "Aurelia Jewelry Piece",
      quantity: Number(it.quantity) || 1,
      price: Number(it.price) || 0,
      image:
        it.image ||
        (it.product && it.product.image) ||
        "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=85",
      slug: it.slug || (it.product && it.product.slug) || "",
    }));
  }

  let dateStr = "Recent";
  if (o.createdAt) {
    try {
      dateStr = new Date(o.createdAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      dateStr = String(o.createdAt);
    }
  }

  return {
    id: orderNumber,
    orderNumber,
    status,
    total: Number(o.total) || 0,
    subtotal: Number(o.subtotal) || Number(o.total) || 0,
    discount: Number(o.discount) || 0,
    shipping: Number(o.shipping) || 0,
    paymentMethod: o.paymentMethod || "COD",
    shippingAddress: o.shippingAddress || {},
    customerName: o.customerName || o.shippingAddress?.fullName || "",
    customerPhone: o.customerPhone || o.shippingAddress?.phone || "",
    customerEmail: o.customerEmail || "",
    isGift: Boolean(o.isGift),
    giftMessage: o.giftMessage || "",
    couponCode: o.couponCode || "",
    items,
    date: dateStr,
    createdAt: o.createdAt,
  };
}

export function OrdersPage() {
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lookupQuery, setLookupQuery] = useState("");
  const [lookupError, setLookupError] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);

  // Handle self-cancellation by customer when order is PLACED
  const handleCancelOrder = async (orderNumber) => {
    const confirmed = window.confirm(
      `Are you sure you wish to cancel Order #${orderNumber}?\n\nThis will immediately return reserved jewelry items back to the catalog inventory and mark the order as CANCELLED.`
    );
    if (!confirmed) return;

    setCancellingId(orderNumber);
    try {
      await customerCancelOrderApi(orderNumber);
      setOrders((prev) => {
        const updated = prev.map((o) =>
          o.orderNumber === orderNumber ? { ...o, status: "CANCELLED" } : o
        );
        localStorage.setItem("aurelia_user_orders", JSON.stringify(updated));
        return updated;
      });
      alert(`Order #${orderNumber} has been successfully cancelled. Your inventory items have been released.`);
    } catch (err) {
      alert(err.message || "Failed to cancel order. Please check order status.");
    } finally {
      setCancellingId(null);
    }
  };

  // Load orders from API if authenticated; clear when logged out
  const loadOrders = useCallback(async () => {
    // If logged out, do not display private order history
    if (!isAuthenticated) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const myOrders = await getMyOrdersApi();
      if (Array.isArray(myOrders)) {
        const orderList = myOrders.map(normalizeCustomerOrder);
        orderList.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        setOrders(orderList);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.warn("Failed loading orders:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  // Handle manual tracking lookup
  const handleLookup = async (e) => {
    e.preventDefault();
    if (!lookupQuery.trim()) return;

    setLookupLoading(true);
    setLookupError("");
    try {
      const trimmed = lookupQuery.trim();
      const fetched = await getOrderByIdApi(trimmed);
      if (fetched && (fetched.orderNumber || fetched._id)) {
        const norm = normalizeCustomerOrder(fetched);
        setOrders((prev) => {
          const filtered = prev.filter((o) => o.orderNumber !== norm.orderNumber);
          const updated = [norm, ...filtered];
          localStorage.setItem("aurelia_user_orders", JSON.stringify(updated));
          return updated;
        });
        setLookupQuery("");
      } else {
        setLookupError(`No order found matching "${trimmed}". Please check your order ID.`);
      }
    } catch (err) {
      setLookupError("Failed to look up order. Please check the order number.");
    } finally {
      setLookupLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "CANCELLED":
        return (
          <span className="order-status-badge cancelled">
            <XCircle size={14} /> CANCELLED
          </span>
        );
      case "DELIVERED":
        return (
          <span className="order-status-badge delivered">
            <CheckCircle2 size={14} /> DELIVERED
          </span>
        );
      case "SHIPPED":
        return (
          <span className="order-status-badge shipped">
            <Truck size={14} /> IN TRANSIT / SHIPPED
          </span>
        );
      case "CONFIRMED":
        return (
          <span className="order-status-badge confirmed">
            <CheckCircle2 size={14} /> CONFIRMED
          </span>
        );
      default:
        return (
          <span className="order-status-badge placed">
            <Clock size={14} /> ORDER PLACED
          </span>
        );
    }
  };

  return (
    <main className="orders-page-wrapper">
      {/* Header */}
      <section className="orders-hero">
        <div className="orders-hero-content">
          <small>CLIENT SERVICES</small>
          <h1>My Orders & Tracking</h1>
          <p>
            Track your bespoke jewelry acquisitions, view live delivery progress, and review fulfillment status.
          </p>
        </div>
      </section>

      <div className="orders-container">
        {/* Account Info Banner */}
        {isAuthenticated && user ? (
          <div style={{ background: "#f9f6f0", border: "1px solid var(--line)", padding: "14px 20px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <span style={{ fontSize: "11px", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "1px" }}>ACCOUNT ORDERS</span>
              <div style={{ fontSize: "15px", fontWeight: 600, color: "var(--ink)" }}>{user.name} &bull; {user.email}</div>
            </div>
            <span className="order-payment-pill" style={{ background: "#edf2f7", color: "#2d3748", padding: "4px 10px" }}>
              {orders.length} {orders.length === 1 ? "order" : "orders"} on record
            </span>
          </div>
        ) : (
          <div style={{ background: "#fffdfa", border: "1px solid #e2d9cd", padding: "14px 20px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <strong style={{ fontSize: "14px", display: "block", color: "var(--ink)" }}>Have an Aurelia Jewels account?</strong>
              <p style={{ margin: "2px 0 0", fontSize: "12.5px", color: "var(--muted)" }}>
                Sign in to view all orders linked to your email, or search using your Order ID below.
              </p>
            </div>
            <Link to="/login" className="button dark" style={{ padding: "6px 14px", fontSize: "12px" }}>
              SIGN IN
            </Link>
          </div>
        )}

        {/* Quick Order Lookup Bar */}
        <div className="orders-lookup-bar">
          <form onSubmit={handleLookup} className="orders-lookup-form">
            <Search size={18} className="lookup-icon" />
            <input
              type="text"
              placeholder="Track by Order # (e.g. AJ-980566)..."
              value={lookupQuery}
              onChange={(e) => setLookupQuery(e.target.value)}
            />
            <button type="submit" className="button dark" disabled={lookupLoading}>
              {lookupLoading ? "Locating..." : "TRACK ORDER"}
            </button>
          </form>

          <button
            type="button"
            className="outline orders-refresh-btn"
            onClick={loadOrders}
            disabled={loading}
            title="Sync latest live statuses"
          >
            <RefreshCw size={14} className={loading ? "spin-icon" : ""} />
            {loading ? "Syncing..." : "Refresh"}
          </button>
        </div>

        {lookupError && (
          <div className="lookup-error-msg">
            <AlertCircle size={16} />
            <span>{lookupError}</span>
          </div>
        )}

        {/* Orders Listing */}
        {loading && orders.length === 0 ? (
          <div className="orders-loading-box">
            <RefreshCw size={28} className="spin-icon" />
            <p>Retrieving your order records from Aurelia Vault...</p>
          </div>
        ) : orders.length > 0 ? (
          <div className="orders-list">
            {orders.map((order) => {
              const isCancelled = order.status === "CANCELLED";

              return (
                <article key={order.orderNumber} className={`order-card ${isCancelled ? "is-cancelled" : ""}`}>
                  {/* Card Header */}
                  <div className="order-card-header">
                    <div>
                      <div className="order-num-row">
                        <strong>Order #{order.orderNumber}</strong>
                        <span className="order-payment-pill">
                          {order.paymentMethod === "COD" ? "Cash on Delivery" : "Prepaid (Online)"}
                        </span>
                      </div>
                      <span className="order-date-text">Placed on {order.date}</span>
                    </div>

                    <div className="order-badge-col">
                      {getStatusBadge(order.status)}
                      <span className="order-total-amount">
                        ₹{order.total.toLocaleString("en-IN")}
                      </span>
                    </div>
                  </div>

                  {/* CANCELLED BANNER */}
                  {isCancelled && (
                    <div className="order-cancelled-alert">
                      <div className="cancelled-alert-icon">
                        <XCircle size={22} />
                      </div>
                      <div>
                        <strong>Order Cancelled by Administration</strong>
                        <p>
                          This order has been cancelled. Any reserved jewelry items have been returned to our catalog, and no charges will be collected upon delivery.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ACTIVE STATUS TIMELINE (Only if not cancelled) */}
                  {!isCancelled && (
                    <div className="order-progress-timeline">
                      <div className={`step-item ${["PLACED", "CONFIRMED", "SHIPPED", "DELIVERED"].includes(order.status) ? "active" : ""}`}>
                        <div className="step-circle">1</div>
                        <span>Placed</span>
                      </div>
                      <div className={`step-line ${["CONFIRMED", "SHIPPED", "DELIVERED"].includes(order.status) ? "active" : ""}`}></div>
                      <div className={`step-item ${["CONFIRMED", "SHIPPED", "DELIVERED"].includes(order.status) ? "active" : ""}`}>
                        <div className="step-circle">2</div>
                        <span>Confirmed</span>
                      </div>
                      <div className={`step-line ${["SHIPPED", "DELIVERED"].includes(order.status) ? "active" : ""}`}></div>
                      <div className={`step-item ${["SHIPPED", "DELIVERED"].includes(order.status) ? "active" : ""}`}>
                        <div className="step-circle">3</div>
                        <span>Shipped</span>
                      </div>
                      <div className={`step-line ${order.status === "DELIVERED" ? "active" : ""}`}></div>
                      <div className={`step-item ${order.status === "DELIVERED" ? "active" : ""}`}>
                        <div className="step-circle">4</div>
                        <span>Delivered</span>
                      </div>
                    </div>
                  )}

                  {/* ORDER ITEMS & DETAILS */}
                  <div className="order-card-body">
                    <div className="order-items-column">
                      <h4 className="section-subhead">Items Ordered ({order.items.length})</h4>
                      <div className="order-items-list">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="order-item-row">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="order-item-thumb"
                              onError={(e) => {
                                e.target.src =
                                  "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=85";
                              }}
                            />
                            <div className="order-item-details">
                              {item.slug ? (
                                <Link to={`/product/${item.slug}`} className="order-item-name">
                                  {item.name}
                                </Link>
                              ) : (
                                <strong className="order-item-name">{item.name}</strong>
                              )}
                              <span className="order-item-qty">
                                Quantity: {item.quantity} × ₹{item.price.toLocaleString("en-IN")}
                              </span>
                            </div>
                            <strong className="order-item-price">
                              ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                            </strong>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="order-meta-column">
                      <h4 className="section-subhead">Delivery Address</h4>
                      <div className="order-address-box">
                        <MapPin size={16} className="address-icon" />
                        <div>
                          <strong>{order.shippingAddress?.fullName || user?.name || "Valued Customer"}</strong>
                          <p>
                            {order.shippingAddress?.address || "Address on file"},{" "}
                            {order.shippingAddress?.city || ""} {order.shippingAddress?.state || ""}{" "}
                            {order.shippingAddress?.pincode ? `- ${order.shippingAddress?.pincode}` : ""}
                          </p>
                          {order.shippingAddress?.phone && (
                            <div className="order-phone-row">
                              <Phone size={13} />
                              <span>{order.shippingAddress?.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="order-summary-box">
                        <div className="summary-line">
                          <span>Subtotal</span>
                          <strong>₹{order.subtotal.toLocaleString("en-IN")}</strong>
                        </div>
                        {order.discount > 0 && (
                          <div className="summary-line" style={{ color: "#2d5436" }}>
                            <span>Coupon Discount ({order.couponCode || "PROMO"})</span>
                            <strong>- ₹{order.discount.toLocaleString("en-IN")}</strong>
                          </div>
                        )}
                        <div className="summary-line">
                          <span>Insured Shipping</span>
                          <strong>{order.shipping === 0 ? "Complimentary" : `₹${order.shipping}`}</strong>
                        </div>
                        <div className="summary-divider"></div>
                        <div className="summary-line total">
                          <span>Order Total</span>
                          <strong>₹{order.total.toLocaleString("en-IN")}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Gift Packaging & Personalized Note */}
                  {order.isGift && (
                    <div className="order-gift-banner" style={{ margin: "16px 24px 0", background: "#fcf8f2", border: "1px dashed #cbb279", padding: "12px 16px", borderRadius: "6px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#8a6d2b", fontWeight: 600, fontSize: "13px" }}>
                        <Gift size={16} /> Complimentary Artisanal Velvet Box & Ribbon Included
                      </div>
                      {order.giftMessage && (
                        <p style={{ margin: "6px 0 0 24px", fontStyle: "italic", fontSize: "12.5px", color: "#444" }}>
                          "{order.giftMessage}"
                        </p>
                      )}
                    </div>
                  )}

                  {/* Order Actions Footer */}
                  <div className="order-card-actions" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 24px", borderTop: "1px solid var(--line)", background: "#faf8f5", marginTop: "16px", flexWrap: "wrap", gap: "10px" }}>
                    <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                      <button
                        type="button"
                        className="button outline"
                        onClick={() => setSelectedInvoiceOrder(order)}
                        style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", padding: "7px 14px", background: "#fff" }}
                      >
                        <Printer size={14} /> DOWNLOAD TAX INVOICE
                      </button>
                    </div>

                    {order.status === "PLACED" && (
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                        <small style={{ color: "#777", fontSize: "11px" }}>Self-cancellation is open while in Placed status.</small>
                        <button
                          type="button"
                          className="button outline"
                          onClick={() => handleCancelOrder(order.orderNumber)}
                          disabled={cancellingId === order.orderNumber}
                          style={{ color: "#b91c1c", borderColor: "#fca5a5", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", padding: "7px 14px", background: "#fff" }}
                        >
                          <XCircle size={14} />
                          {cancellingId === order.orderNumber ? "Cancelling..." : "Cancel Order"}
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : !isAuthenticated ? (
          <div className="orders-empty-state" style={{ padding: "60px 20px" }}>
            <div className="empty-icon-circle">
              <Package size={44} />
            </div>
            <h2>Sign In to View Your Orders</h2>
            <p style={{ maxWidth: "460px", margin: "10px auto 24px" }}>
              Log in to your Aurelia Jewels account to access your personal order history, live dispatch updates, and luxury tax invoices.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <Link to="/login" className="button dark">
                SIGN IN TO ACCOUNT
              </Link>
              <Link to="/shop" className="button outline">
                CONTINUE SHOPPING
              </Link>
            </div>
          </div>
        ) : (
          <div className="orders-empty-state">
            <div className="empty-icon-circle">
              <ShoppingBag size={48} />
            </div>
            <h2>No Orders Found</h2>
            <p>
              You haven't placed any jewelry orders yet, or you may track an order using your Order ID above.
            </p>
            <Link to="/shop" className="button dark">
              EXPLORE OUR COLLECTION
            </Link>
          </div>
        )}

        {/* High-Resolution Luxury Tax Invoice Modal */}
        <InvoiceModal
          order={selectedInvoiceOrder}
          isOpen={Boolean(selectedInvoiceOrder)}
          onClose={() => setSelectedInvoiceOrder(null)}
        />
      </div>
    </main>
  );
}
