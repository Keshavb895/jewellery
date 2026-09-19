import React, { useState, useEffect, useCallback } from "react";
import { Tag, Plus, Trash2, CheckCircle2, Clock, AlertCircle, RefreshCw, X, Percent, DollarSign, Calendar } from "lucide-react";
import { getCouponsApi, createCouponApi, deleteCouponApi } from "../../services/api.js";

export function CouponsManager({ onToast }) {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    code: "",
    discountType: "percentage",
    discountValue: 15,
    minOrderAmount: 1999,
    maxDiscount: 2500,
    expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  });

  const loadCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getCouponsApi();
      if (Array.isArray(data)) {
        setCoupons(data);
      }
    } catch (e) {
      console.warn("Error loading coupons:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "code" ? value.toUpperCase().trim() : value,
    }));
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!form.code.trim()) {
      setError("Please specify a promo coupon code.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const payload = {
        code: form.code.toUpperCase().trim(),
        discountType: form.discountType,
        discountValue: Number(form.discountValue) || 10,
        minOrderAmount: Number(form.minOrderAmount) || 0,
        maxDiscount: form.discountType === "percentage" ? Number(form.maxDiscount) || 0 : undefined,
        expiryDate: form.expiryDate ? new Date(form.expiryDate).toISOString() : undefined,
        isActive: true,
      };

      const created = await createCouponApi(payload);
      setCoupons((prev) => [created, ...prev.filter((c) => c.code !== created.code)]);
      setIsCreateOpen(false);
      setForm({
        code: "",
        discountType: "percentage",
        discountValue: 15,
        minOrderAmount: 1999,
        maxDiscount: 2500,
        expiryDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      });
      if (onToast) onToast(`Coupon code "${created.code}" created successfully!`);
    } catch (err) {
      setError(err.message || "Failed to create coupon");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (coupon) => {
    const couponId = coupon._id || coupon.id;
    if (!window.confirm(`Are you sure you want to deactivate and remove coupon "${coupon.code}"?`)) return;

    try {
      await deleteCouponApi(couponId);
      setCoupons((prev) => prev.filter((c) => (c._id || c.id) !== couponId));
      if (onToast) onToast(`Coupon "${coupon.code}" removed.`);
    } catch (err) {
      alert(err.message || "Could not delete coupon");
    }
  };

  return (
    <div className="coupons-manager-container">
      {/* Controls Header */}
      <div className="table-controls" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "18px", color: "var(--ink)" }}>Promotional Discount Codes</h3>
          <small style={{ color: "var(--muted)" }}>
            Configure client promo codes with spend thresholds, percentage/fixed discounts, and usage limits.
          </small>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            className="outline"
            onClick={loadCoupons}
            disabled={loading}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", padding: "8px 14px" }}
          >
            <RefreshCw size={13} className={loading ? "spin-icon" : ""} />
            {loading ? "Syncing..." : "Refresh"}
          </button>
          <button
            type="button"
            className="button dark"
            onClick={() => {
              setIsCreateOpen(true);
              setError("");
            }}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", padding: "8px 16px" }}
          >
            <Plus size={15} /> CREATE PROMO CODE
          </button>
        </div>
      </div>

      {/* Coupons Table */}
      <div className="table-responsive">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Coupon Code</th>
              <th>Discount Type</th>
              <th>Benefit Value</th>
              <th>Min. Bag Spend</th>
              <th>Max Cap</th>
              <th>Times Redeemed</th>
              <th>Expiry Date</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {coupons.length > 0 ? (
              coupons.map((c) => {
                const isExpired = c.expiryDate && new Date(c.expiryDate) < new Date();
                const couponId = c._id || c.id;

                return (
                  <tr key={couponId || c.code}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ background: "#fcf8ee", border: "1px dashed #d5c091", padding: "4px 8px", borderRadius: "3px", fontWeight: 700, letterSpacing: "1px", color: "#8a6d2b", fontSize: "13px" }}>
                          {c.code}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="mini-badge" style={{ background: c.discountType === "percentage" ? "#e6fffa" : "#f0fdf4", color: "#234e52" }}>
                        {c.discountType === "percentage" ? "Percentage (%)" : "Fixed Amount (₹)"}
                      </span>
                    </td>
                    <td>
                      <strong style={{ fontSize: "14px", color: "var(--ink)" }}>
                        {c.discountType === "percentage" ? `${c.discountValue}% OFF` : `₹${Number(c.discountValue).toLocaleString("en-IN")} OFF`}
                      </strong>
                    </td>
                    <td>
                      <span>₹{Number(c.minOrderAmount || 0).toLocaleString("en-IN")}</span>
                    </td>
                    <td>
                      <span>{c.maxDiscount ? `₹${Number(c.maxDiscount).toLocaleString("en-IN")}` : "No Limit"}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{c.usageCount || 0} orders</span>
                    </td>
                    <td>
                      <small style={{ color: isExpired ? "#e53e3e" : "var(--muted)" }}>
                        {c.expiryDate ? new Date(c.expiryDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Indefinite"}
                      </small>
                    </td>
                    <td>
                      {isExpired ? (
                        <span className="mini-badge" style={{ background: "#fed7d7", color: "#9b2c2c" }}>EXPIRED</span>
                      ) : c.isActive ? (
                        <span className="mini-badge feat">ACTIVE</span>
                      ) : (
                        <span className="mini-badge">PAUSED</span>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        type="button"
                        className="action-icon-btn delete"
                        title="Delete promo code"
                        onClick={() => handleDelete(c)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="9" className="empty-table-cell">
                  {loading ? "Loading coupons from MongoDB..." : "No promotional discount codes found. Click 'Create Promo Code' to add one."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE PROMO CODE MODAL */}
      {isCreateOpen && (
        <div className="modal-backdrop" onClick={() => setIsCreateOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
            <div className="modal-header">
              <div>
                <small>ADMINISTRATIVE PROMOTIONS</small>
                <h2>Create Discount Coupon</h2>
              </div>
              <button type="button" className="close-btn" onClick={() => setIsCreateOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {error && (
              <div className="form-error-alert" style={{ margin: "16px 24px 0" }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateCoupon} className="admin-form" style={{ padding: "20px 24px" }}>
              <div className="form-group">
                <label>Coupon Promo Code *</label>
                <input
                  type="text"
                  name="code"
                  placeholder="e.g. DIWALI20, ROYAL500"
                  value={form.code}
                  onChange={handleChange}
                  required
                  style={{ textTransform: "uppercase", letterSpacing: "1px", fontWeight: 700 }}
                />
                <small style={{ color: "var(--muted)", fontSize: "11px", marginTop: "3px" }}>
                  Customers will type this exact code into their bag or checkout summary.
                </small>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Discount Type *</label>
                  <select name="discountType" value={form.discountType} onChange={handleChange}>
                    <option value="percentage">Percentage (%) Discount</option>
                    <option value="fixed">Fixed Rupee (₹) Discount</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Discount Value *</label>
                  <input
                    type="number"
                    name="discountValue"
                    min="1"
                    value={form.discountValue}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Minimum Order Value (₹)</label>
                  <input
                    type="number"
                    name="minOrderAmount"
                    min="0"
                    placeholder="1499"
                    value={form.minOrderAmount}
                    onChange={handleChange}
                  />
                </div>
                {form.discountType === "percentage" && (
                  <div className="form-group">
                    <label>Max Discount Cap (₹)</label>
                    <input
                      type="number"
                      name="maxDiscount"
                      min="0"
                      placeholder="2500"
                      value={form.maxDiscount}
                      onChange={handleChange}
                    />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Expiration Date</label>
                <input
                  type="date"
                  name="expiryDate"
                  value={form.expiryDate}
                  onChange={handleChange}
                />
              </div>

              <div className="modal-actions" style={{ marginTop: "16px" }}>
                <button type="button" className="outline" onClick={() => setIsCreateOpen(false)} disabled={saving}>
                  CANCEL
                </button>
                <button type="submit" className="button dark" disabled={saving}>
                  {saving ? "SAVING..." : "PUBLISH PROMO CODE"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
