import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext.jsx";
import { ArrowRight, ShieldCheck, Truck, Tag, Check, X, Lock } from "lucide-react";
import { CheckoutModal } from "./CheckoutModal.jsx";
import { validateCouponApi } from "../../services/api.js";

export function CartSummary() {
  const navigate = useNavigate();
  const { subtotal, shipping, discount, total, appliedCoupon, applyCoupon, removeCoupon, isSyncing, isAuthenticated } = useCart();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");
  const [couponSuccess, setCouponSuccess] = useState("");
  const [validating, setValidating] = useState(false);

  const freeShippingThreshold = 1499;
  const neededForFreeShipping = Math.max(0, freeShippingThreshold - subtotal);

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponInput.trim()) return;
    setValidating(true);
    setCouponError("");
    setCouponSuccess("");

    try {
      const res = await validateCouponApi(couponInput.trim(), subtotal);
      applyCoupon(res);
      setCouponSuccess(res.message || `Coupon "${res.code}" applied!`);
      setCouponInput("");
    } catch (err) {
      setCouponError(err.message || "Invalid coupon code");
    } finally {
      setValidating(false);
    }
  };

  return (
    <>
      <div className="cart-summary-box">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <h3 style={{ margin: 0 }}>Order Summary</h3>
          {isAuthenticated && (
            <small
              style={{
                fontSize: "11px",
                color: isSyncing ? "#8a6d2b" : "#48634f",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                fontWeight: 500,
                background: isSyncing ? "#fdf8ee" : "#f1f7f2",
                padding: "3px 7px",
                borderRadius: "12px",
                border: isSyncing ? "1px solid #ebd9b9" : "1px solid #cce3d2",
              }}
              title="Your bag is automatically synchronized to your Flash Jewels account across devices"
            >
              <span
                style={{
                  display: "inline-block",
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: isSyncing ? "#d97706" : "#16a34a",
                }}
              />
              {isSyncing ? "Saving..." : "Cloud Synced"}
            </small>
          )}
        </div>

        {neededForFreeShipping > 0 ? (
          <div className="shipping-note">
            <Truck size={16} />
            <span>Add <b>₹{neededForFreeShipping.toLocaleString("en-IN")}</b> more for complimentary shipping!</span>
          </div>
        ) : (
          <div className="shipping-note free">
            <Truck size={16} />
            <span>You have unlocked <b>Complimentary Express Shipping</b>!</span>
          </div>
        )}

        {/* Promo Code Application */}
        <div className="promo-code-section" style={{ marginBottom: "16px" }}>
          {appliedCoupon ? (
            <div style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 12px",
              background: "#edf7ee",
              border: "1px dashed #48634f",
              borderRadius: "4px",
              fontSize: "13px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#2d5436", fontWeight: 600 }}>
                <Tag size={15} />
                <span>Code <strong>{appliedCoupon.code}</strong> Applied</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  removeCoupon();
                  setCouponSuccess("");
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#900",
                  cursor: "pointer",
                  fontSize: "12px",
                  textDecoration: "underline"
                }}
              >
                Remove
              </button>
            </div>
          ) : (
            <form onSubmit={handleApplyCoupon} style={{ display: "flex", gap: "6px" }}>
              <input
                type="text"
                placeholder="PROMO CODE (e.g. FLASH10)"
                value={couponInput}
                onChange={(e) => {
                  setCouponInput(e.target.value.toUpperCase());
                  setCouponError("");
                }}
                style={{
                  flex: 1,
                  padding: "9px 12px",
                  fontSize: "12px",
                  letterSpacing: "0.05em",
                  border: "1px solid #d5c7b3",
                  borderRadius: "2px",
                  textTransform: "uppercase"
                }}
              />
              <button
                type="submit"
                className="button outline"
                disabled={validating || !couponInput.trim()}
                style={{ padding: "0 14px", fontSize: "12px", whiteSpace: "nowrap" }}
              >
                {validating ? "..." : "APPLY"}
              </button>
            </form>
          )}

          {couponError && (
            <div style={{ color: "#b91c1c", fontSize: "11px", marginTop: "5px" }}>
              {couponError}
            </div>
          )}
          {couponSuccess && (
            <div style={{ color: "#15803d", fontSize: "11px", marginTop: "5px" }}>
              {couponSuccess}
            </div>
          )}
        </div>

        <div className="summary-row">
          <span>Subtotal</span>
          <span>₹{subtotal.toLocaleString("en-IN")}</span>
        </div>

        {discount > 0 && (
          <div className="summary-row" style={{ color: "#2d5436" }}>
            <span>Coupon Discount ({appliedCoupon?.code})</span>
            <span>- ₹{discount.toLocaleString("en-IN")}</span>
          </div>
        )}

        <div className="summary-row">
          <span>Estimated Delivery</span>
          <span>{shipping === 0 ? "FREE" : `₹${shipping}`}</span>
        </div>

        <div className="summary-divider"></div>

        <div className="summary-row total-row">
          <strong>Total</strong>
          <strong>₹{total.toLocaleString("en-IN")}</strong>
        </div>

        {isAuthenticated ? (
          <button
            type="button"
            className="button dark full"
            onClick={() => setIsCheckoutOpen(true)}
          >
            PROCEED TO CHECKOUT <ArrowRight size={16} />
          </button>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <button
              type="button"
              className="button dark full"
              onClick={() => navigate("/login?redirect=/cart")}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            >
              <Lock size={15} /> SIGN IN TO CHECKOUT <ArrowRight size={16} />
            </button>
            <span style={{ fontSize: "11px", color: "var(--muted)", textAlign: "center" }}>
              Please sign in or create an account to place your order securely.
            </span>
          </div>
        )}

        <p className="summary-guarantee">
          <ShieldCheck size={14} /> 100% Secure Checkout & 15-Day Free Returns
        </p>
      </div>

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />
    </>
  );
}
