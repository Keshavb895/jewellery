import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, MapPin, Truck, ShieldCheck, CheckCircle2, AlertCircle, CreditCard, Banknote, Gift, Printer, Star, Home, Briefcase, Bookmark, Lock } from "lucide-react";
import { useCart } from "../../context/CartContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { useProducts } from "../../context/ProductContext.jsx";
import { createOrderApi, getAddressesApi, addAddressApi } from "../../services/api.js";
import { InvoiceModal } from "../orders/InvoiceModal.jsx";

export function CheckoutModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { cart, subtotal, shipping, discount, appliedCoupon, total, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { decrementStock } = useProducts();

  const [formData, setFormData] = useState({
    fullName: user?.name || "",
    phone: user?.phone || "",
    address: "",
    city: "",
    state: "Delhi",
    pincode: "",
    paymentMethod: user?.defaultPaymentMethod || "COD",
  });

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [saveNewAddress, setSaveNewAddress] = useState(false);
  const [addressTag, setAddressTag] = useState("Home");

  const [isGift, setIsGift] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [completedOrder, setCompletedOrder] = useState(null);

  // Fetch saved addresses and auto-fill default for 1-click checkout
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      getAddressesApi().then((addrs) => {
        if (Array.isArray(addrs) && addrs.length > 0) {
          setSavedAddresses(addrs);
          const defaultAddr = addrs.find((a) => a.isDefault) || addrs[0];
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr._id || defaultAddr.id);
            setFormData((prev) => ({
              ...prev,
              fullName: defaultAddr.fullName || user?.name || "",
              phone: defaultAddr.phone || user?.phone || "",
              address: defaultAddr.address || "",
              city: defaultAddr.city || "",
              state: defaultAddr.state || "Delhi",
              pincode: defaultAddr.pincode || "",
              paymentMethod: user?.defaultPaymentMethod || prev.paymentMethod || "COD",
            }));
          }
        }
      });
    }
  }, [isOpen, isAuthenticated, user]);

  if (!isOpen) return null;

  if (!isAuthenticated) {
    return (
      <div className="modal-backdrop" onClick={onClose}>
        <div
          className="modal-container checkout-modal-container"
          onClick={(e) => e.stopPropagation()}
          style={{ maxWidth: "450px", textAlign: "center", padding: "40px 30px" }}
        >
          <div
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              background: "#fcf8f2",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              color: "#8a6d2b",
            }}
          >
            <Lock size={24} />
          </div>
          <small
            style={{
              letterSpacing: "1px",
              textTransform: "uppercase",
              color: "var(--muted)",
              fontSize: "11px",
              fontWeight: 600,
            }}
          >
            Account Required
          </small>
          <h2 style={{ fontSize: "22px", margin: "8px 0 12px" }}>Sign In to Complete Order</h2>
          <p style={{ fontSize: "13px", color: "var(--muted)", marginBottom: "24px", lineHeight: "1.5" }}>
            To protect your orders, ensure verified doorstep delivery, and track shipments in real time, please sign in or register an account.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <button
              type="button"
              className="button dark"
              onClick={() => {
                onClose();
                navigate("/login?redirect=/cart");
              }}
            >
              SIGN IN / REGISTER
            </button>
            <button type="button" className="button outline" onClick={onClose}>
              CANCEL
            </button>
          </div>
        </div>
      </div>
    );
  }

  const applySavedAddress = (addr) => {
    const addrId = addr._id || addr.id;
    setSelectedAddressId(addrId);
    setFormData((prev) => ({
      ...prev,
      fullName: addr.fullName,
      phone: addr.phone,
      address: addr.address,
      city: addr.city,
      state: addr.state || "Delhi",
      pincode: addr.pincode,
      paymentMethod: user?.defaultPaymentMethod || prev.paymentMethod || "COD",
    }));
  };

  const handleChange = (e) => {
    setSelectedAddressId(null);
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!formData.phone.trim() || formData.phone.length < 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }
    if (!formData.address.trim()) {
      setError("Please provide your delivery address.");
      return;
    }
    if (!formData.city.trim()) {
      setError("Please enter your city.");
      return;
    }
    if (!formData.pincode.trim() || formData.pincode.length < 5) {
      setError("Please enter a valid postal PIN code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const orderPayload = {
        items: cart.map((item) => ({
          product: item.id || item._id,
          name: item.name,
          price: item.price,
          quantity: item.quantity || 1,
          image: item.image,
        })),
        shippingAddress: {
          fullName: formData.fullName,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          country: "India",
        },
        paymentMethod: formData.paymentMethod,
        customerName: formData.fullName,
        customerPhone: formData.phone,
        customerEmail: user?.email || "",
        isGift: Boolean(isGift),
        giftMessage: isGift ? giftMessage.trim() : "",
        couponCode: appliedCoupon ? appliedCoupon.code : "",
        discount: discount || 0,
      };

      const orderResult = await createOrderApi(orderPayload);
      decrementStock(cart);
      clearCart();

      // Auto-save new address to user's address book if requested
      if (saveNewAddress && isAuthenticated) {
        addAddressApi({
          tag: addressTag || "Home",
          fullName: formData.fullName,
          phone: formData.phone,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          country: "India",
          isDefault: savedAddresses.length === 0,
        }).catch((e) => console.warn("Could not auto-save address:", e));
      }

      // Store locally so guest / user can view on /orders immediately
      try {
        const storedOrders = JSON.parse(localStorage.getItem("aurelia_user_orders") || "[]");
        const orderToSave = {
          ...orderResult,
          id: orderResult.orderNumber,
          orderNumber: orderResult.orderNumber,
          customerName: formData.fullName,
          customerPhone: formData.phone,
          customerEmail: user?.email || "",
          shippingAddress: orderPayload.shippingAddress,
          items: orderPayload.items,
          total: orderResult.total,
          isGift: Boolean(isGift),
          giftMessage: isGift ? giftMessage.trim() : "",
          createdAt: orderResult.createdAt || new Date().toISOString(),
          orderStatus: orderResult.orderStatus || "PLACED"
        };
        const updated = [orderToSave, ...storedOrders.filter(o => (o.orderNumber || o.id) !== orderResult.orderNumber)];
        localStorage.setItem("aurelia_user_orders", JSON.stringify(updated));
      } catch (e) {
        console.warn("Could not save order locally:", e);
      }

      setCompletedOrder(orderResult);
    } catch (err) {
      setError(err.message || "Failed to place order. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container checkout-modal-container" onClick={(e) => e.stopPropagation()}>
        {completedOrder ? (
          /* SUCCESS ORDER CONFIRMATION SCREEN */
          <div className="checkout-confirmed-view">
            <div className="confirmed-header">
              <CheckCircle2 size={56} color="#48634f" />
              <small>ORDER CONFIRMED</small>
              <h2>Thank You For Your Order!</h2>
              <p>Your jewelry order has been received and is being prepared with artisanal care.</p>
            </div>

            <div className="order-receipt-card">
              <div className="receipt-row">
                <span>Order Number</span>
                <strong>{completedOrder.orderNumber}</strong>
              </div>
              <div className="receipt-row">
                <span>Estimated Delivery</span>
                <strong>3 - 5 Business Days</strong>
              </div>
              <div className="receipt-row">
                <span>Payment Method</span>
                <strong>{completedOrder.paymentMethod === "COD" ? "Cash on Delivery (COD)" : "UPI / Online"}</strong>
              </div>
              <div className="receipt-row">
                <span>Total Amount</span>
                <strong>₹{Number(completedOrder.total).toLocaleString("en-IN")}</strong>
              </div>

              {completedOrder.isGift && (
                <div style={{ margin: "12px 0", background: "#fbf6ed", border: "1px dashed #cbb279", padding: "10px 14px", borderRadius: "4px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#8a6d2b", fontWeight: 600, fontSize: "13px" }}>
                    <Gift size={16} /> Complimentary Velvet Box & Ribbon Included
                  </div>
                  {completedOrder.giftMessage && (
                    <p style={{ margin: "6px 0 0", fontStyle: "italic", fontSize: "12px", color: "#555" }}>
                      "{completedOrder.giftMessage}"
                    </p>
                  )}
                </div>
              )}

              <div className="receipt-divider"></div>

              <div className="receipt-delivery-address">
                <small>DELIVERING TO:</small>
                <strong>{completedOrder.shippingAddress?.fullName}</strong>
                <p>
                  {completedOrder.shippingAddress?.address}, {completedOrder.shippingAddress?.city},{" "}
                  {completedOrder.shippingAddress?.state} - {completedOrder.shippingAddress?.pincode}
                </p>
                <span>Phone: {completedOrder.shippingAddress?.phone}</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "16px", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                type="button"
                className="button outline"
                onClick={() => setIsInvoiceOpen(true)}
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Printer size={16} /> DOWNLOAD TAX INVOICE
              </button>
              <button
                type="button"
                className="button dark"
                onClick={() => {
                  onClose();
                  navigate("/orders");
                }}
              >
                MY ORDERS
              </button>
              <button type="button" className="button outline" onClick={onClose}>
                CONTINUE BROWSING
              </button>
            </div>

            {/* Tax Invoice Modal */}
            <InvoiceModal
              order={completedOrder}
              isOpen={isInvoiceOpen}
              onClose={() => setIsInvoiceOpen(false)}
            />
          </div>
        ) : (
          /* CHECKOUT FORM */
          <>
            <div className="modal-header">
              <div>
                <small>SAFE & SECURE CHECKOUT</small>
                <h2>Shipping & Delivery Details</h2>
              </div>
              <button type="button" className="close-btn" onClick={onClose} aria-label="Close modal">
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="form-error-alert" style={{ margin: "18px 30px 0" }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="admin-form checkout-form-body">
              <div className="form-layout-grid">
                {/* Left Column: Address Inputs */}
                <div className="form-column">
                  <div className="checkout-step-title">
                    <MapPin size={16} />
                    <span>1. Delivery Address</span>
                  </div>

                  {/* 1-Click Saved Addresses Picker */}
                  {savedAddresses.length > 0 && (
                    <div style={{ marginBottom: "16px", background: "#fcf9f2", border: "1px solid #ebd9b9", padding: "12px 14px", borderRadius: "6px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <small style={{ fontWeight: 700, color: "#8a6d2b", letterSpacing: "0.5px", fontSize: "11px", display: "flex", alignItems: "center", gap: "5px" }}>
                          <Star size={12} /> 1-CLICK SAVED ADDRESSES ({savedAddresses.length})
                        </small>
                        <small style={{ color: "var(--muted)", fontSize: "10.5px" }}>Tap to autofill</small>
                      </div>

                      <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
                        {savedAddresses.map((addr) => {
                          const addrId = addr._id || addr.id;
                          const isSelected = selectedAddressId === addrId;
                          return (
                            <button
                              key={addrId}
                              type="button"
                              onClick={() => applySavedAddress(addr)}
                              style={{
                                textAlign: "left",
                                minWidth: "160px",
                                flexShrink: 0,
                                padding: "8px 10px",
                                borderRadius: "4px",
                                border: isSelected ? "1.5px solid #8a6d2b" : "1px solid #d5c7b3",
                                background: isSelected ? "#fff" : "#faf7f2",
                                cursor: "pointer",
                                boxShadow: isSelected ? "0 2px 8px rgba(138,109,43,0.15)" : "none",
                                transition: "all 0.15s ease",
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
                                <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: isSelected ? "#8a6d2b" : "#555" }}>
                                  {addr.tag || "Home"}
                                </span>
                                {addr.isDefault && (
                                  <span style={{ fontSize: "9px", background: "#f8ecce", color: "#8a6d2b", padding: "1px 4px", borderRadius: "2px", fontWeight: 700 }}>
                                    DEFAULT
                                  </span>
                                )}
                              </div>
                              <strong style={{ display: "block", fontSize: "12px", color: "#222", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {addr.fullName}
                              </strong>
                              <small style={{ color: "#777", fontSize: "11px", display: "block", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {addr.city}, {addr.pincode}
                              </small>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="form-row-2">
                    <div className="form-group">
                      <label>Full Name *</label>
                      <input
                        type="text"
                        name="fullName"
                        placeholder="e.g. Aryan Kapoor"
                        value={formData.fullName}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Mobile Phone *</label>
                      <input
                        type="tel"
                        name="phone"
                        placeholder="9876543210"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Street Address / Flat / House No. *</label>
                    <input
                      type="text"
                      name="address"
                      placeholder="e.g. Flat 402, Royal Palms, MG Road"
                      value={formData.address}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-row-2">
                    <div className="form-group">
                      <label>City *</label>
                      <input
                        type="text"
                        name="city"
                        placeholder="e.g. Mumbai"
                        value={formData.city}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Postal PIN Code *</label>
                      <input
                        type="text"
                        name="pincode"
                        placeholder="e.g. 400001"
                        value={formData.pincode}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>State *</label>
                    <select name="state" value={formData.state} onChange={handleChange}>
                      <option value="Delhi">Delhi NCR</option>
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Karnataka">Karnataka</option>
                      <option value="Tamil Nadu">Tamil Nadu</option>
                      <option value="Telangana">Telangana</option>
                      <option value="Gujarat">Gujarat</option>
                      <option value="Uttar Pradesh">Uttar Pradesh</option>
                      <option value="Rajasthan">Rajasthan</option>
                      <option value="West Bengal">West Bengal</option>
                      <option value="Punjab">Punjab</option>
                      <option value="Other">Other State</option>
                    </select>
                  </div>

                  {/* Option to save to address book if logged in and entered a new address */}
                  {isAuthenticated && !selectedAddressId && (
                    <div style={{ marginTop: "12px", background: "#fcfbf7", border: "1px dashed #d5c7b3", padding: "10px 12px", borderRadius: "6px" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={saveNewAddress}
                          onChange={(e) => setSaveNewAddress(e.target.checked)}
                          style={{ width: "15px", height: "15px", accentColor: "#8a6d2b" }}
                        />
                        <span style={{ fontSize: "12px", color: "#333", fontWeight: 500 }}>
                          Save this delivery address to my Aurelia Address Book
                        </span>
                      </label>
                      {saveNewAddress && (
                        <div style={{ display: "flex", gap: "6px", marginTop: "8px", alignItems: "center" }}>
                          <small style={{ fontSize: "11px", color: "var(--muted)" }}>Tag as:</small>
                          {["Home", "Office", "Gifting"].map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setAddressTag(t)}
                              style={{
                                padding: "2px 8px",
                                fontSize: "11px",
                                borderRadius: "3px",
                                border: addressTag === t ? "1px solid #8a6d2b" : "1px solid #d5c7b3",
                                background: addressTag === t ? "#8a6d2b" : "#fff",
                                color: addressTag === t ? "#fff" : "#333",
                                cursor: "pointer",
                              }}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="checkout-step-title" style={{ marginTop: "18px" }}>
                    <Banknote size={16} />
                    <span>2. Payment Option</span>
                  </div>

                  <div className="payment-options-grid">
                    <label
                      className={`payment-option-card ${formData.paymentMethod === "COD" ? "selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="COD"
                        checked={formData.paymentMethod === "COD"}
                        onChange={handleChange}
                      />
                      <Banknote size={20} />
                      <div>
                        <strong>Cash on Delivery (COD)</strong>
                        <small>Pay at your doorstep upon arrival</small>
                      </div>
                    </label>

                    <label
                      className={`payment-option-card ${formData.paymentMethod === "UPI" ? "selected" : ""}`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="UPI"
                        checked={formData.paymentMethod === "UPI"}
                        onChange={handleChange}
                      />
                      <CreditCard size={20} />
                      <div>
                        <strong>UPI / Net Banking</strong>
                        <small>Scan QR code or pay securely online</small>
                      </div>
                    </label>
                  </div>

                  {/* Gift Wrapping & Custom Engraved Note */}
                  <div className="checkout-step-title" style={{ marginTop: "24px" }}>
                    <Gift size={16} />
                    <span>3. Artisanal Gift Presentation (Complimentary)</span>
                  </div>

                  <div
                    style={{
                      background: isGift ? "#fcf8f2" : "#fdfbf7",
                      border: isGift ? "1.5px solid #cbb279" : "1px solid #ebd9b9",
                      padding: "14px",
                      borderRadius: "6px",
                      marginTop: "8px",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <label style={{ display: "flex", gap: "12px", cursor: "pointer", alignItems: "flex-start" }}>
                      <input
                        type="checkbox"
                        checked={isGift}
                        onChange={(e) => setIsGift(e.target.checked)}
                        style={{ marginTop: "3px", width: "17px", height: "17px", accentColor: "#8a6d2b", cursor: "pointer" }}
                      />
                      <div>
                        <strong style={{ fontSize: "13px", color: "#1a1a1a", display: "flex", alignItems: "center", gap: "6px" }}>
                          <span>This is a gift</span>
                          <span style={{ color: "#8a6d2b", fontWeight: 700, fontSize: "11px", background: "#f5ebdb", padding: "2px 6px", borderRadius: "10px" }}>
                            + Complimentary Velvet Box & Ribbon
                          </span>
                        </strong>
                        <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#666", lineHeight: 1.4 }}>
                          Hand-packed in Aurelia's royal jewel vault box with satin ribbons and an artisanal deckled-edge stationery card.
                        </p>
                      </div>
                    </label>

                    {isGift && (
                      <div style={{ marginTop: "14px", borderTop: "1px dashed #d5c7b3", paddingTop: "12px" }}>
                        <label style={{ fontSize: "12px", fontWeight: 600, color: "#333", display: "block", marginBottom: "6px" }}>
                          Personalized Gift Note (Printed on Artisanal Card):
                        </label>
                        <textarea
                          rows={3}
                          maxLength={240}
                          placeholder="Type your personal message here... (e.g., Happy 25th Anniversary Mom! Wishing you timeless happiness.)"
                          value={giftMessage}
                          onChange={(e) => setGiftMessage(e.target.value)}
                          style={{
                            width: "100%",
                            padding: "9px 12px",
                            fontSize: "13px",
                            fontFamily: "inherit",
                            border: "1px solid #cbb279",
                            borderRadius: "4px",
                            background: "#fff",
                            boxSizing: "border-box",
                            resize: "vertical"
                          }}
                        />
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#888", marginTop: "4px" }}>
                          <span>Sealed with signature Aurelia gold wax emblem</span>
                          <span>{240 - giftMessage.length} characters remaining</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: Order Summary */}
                <div className="form-column">
                  <div className="checkout-summary-card">
                    <h3>Order Items ({cart.length})</h3>

                    <div className="checkout-items-list">
                      {cart.map((item, idx) => (
                        <div key={idx} className="checkout-item-row">
                          <img src={item.image} alt={item.name} />
                          <div className="item-text">
                            <strong>{item.name}</strong>
                            <small>Qty: {item.quantity || 1}</small>
                          </div>
                          <span className="item-cost">
                            ₹{(Number(item.price) * (item.quantity || 1)).toLocaleString("en-IN")}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="checkout-totals">
                      <div className="totals-line">
                        <span>Bag Subtotal</span>
                        <span>₹{subtotal.toLocaleString("en-IN")}</span>
                      </div>
                      {discount > 0 && (
                        <div className="totals-line" style={{ color: "#2d5436" }}>
                          <span>Coupon Discount ({appliedCoupon?.code})</span>
                          <span>- ₹{discount.toLocaleString("en-IN")}</span>
                        </div>
                      )}
                      <div className="totals-line">
                        <span>Express Delivery</span>
                        <span>{shipping === 0 ? "FREE" : `₹${shipping}`}</span>
                      </div>
                      <div className="totals-divider"></div>
                      <div className="totals-line grand-total">
                        <strong>Grand Total</strong>
                        <strong>₹{total.toLocaleString("en-IN")}</strong>
                      </div>
                    </div>

                    <div className="checkout-perks">
                      <div><Truck size={14} /> Insured tamper-proof packaging</div>
                      <div><ShieldCheck size={14} /> 15-Day effortless exchange guarantee</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="outline" onClick={onClose} disabled={loading}>
                  RETURN TO BAG
                </button>
                <button type="submit" className="button dark" disabled={loading}>
                  {loading ? "CONFIRMING ORDER..." : `PLACE ORDER (₹${total.toLocaleString("en-IN")})`}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
