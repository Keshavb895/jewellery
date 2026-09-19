import React, { useRef } from "react";
import { Printer, X, Download, ShieldCheck, Gift, CheckCircle } from "lucide-react";

export function InvoiceModal({ order, isOpen, onClose }) {
  const invoiceRef = useRef(null);

  if (!isOpen || !order) return null;

  const orderNumber = order.orderNumber || order.id || "AJ-000000";
  const invoiceNumber = `INV-${orderNumber}`;
  const orderDate = order.date || (order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN") : "Today");
  const customerName = order.customer || order.customerName || order.shippingAddress?.fullName || "Valued Client";
  const phone = order.phone || order.customerPhone || order.shippingAddress?.phone || "";
  const destination = order.destination || (order.shippingAddress ? `${order.shippingAddress.address || ""}, ${order.shippingAddress.city || ""}, ${order.shippingAddress.state || ""} - ${order.shippingAddress.pincode || ""}` : "Direct");

  const subtotal = Number(order.subtotal || order.total || 0);
  const discount = Number(order.discount || 0);
  const shipping = Number(order.shipping || 0);
  const total = Number(order.total || 0);

  // 3% Indian GST breakdown on jewelry: 1.5% CGST + 1.5% SGST
  const gstRate = 0.03;
  const taxableAmount = Math.round(subtotal / (1 + gstRate));
  const totalGst = subtotal - taxableAmount;
  const cgst = Math.round(totalGst / 2);
  const sgst = totalGst - cgst;

  let items = [];
  if (Array.isArray(order.items)) {
    items = order.items.map((it) => ({
      name: it.name || "Aurelia Fine Jewelry Piece",
      quantity: Number(it.quantity) || 1,
      price: Number(it.price) || 0,
    }));
  } else if (typeof order.items === "string") {
    items = [{ name: order.items, quantity: 1, price: subtotal }];
  } else {
    items = [{ name: "Bespoke Jewelry Piece", quantity: 1, price: subtotal }];
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop invoice-modal-backdrop" onClick={onClose}>
      <div
        className="modal-container invoice-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Action Header (hidden in print) */}
        <div className="invoice-modal-actions no-print">
          <div>
            <span className="invoice-preview-tag">OFFICIAL TAX INVOICE PREVIEW</span>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button type="button" className="button dark" onClick={handlePrint}>
              <Printer size={15} /> PRINT / SAVE AS PDF
            </button>
            <button type="button" className="close-btn" onClick={onClose} aria-label="Close invoice">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div className="printable-invoice" ref={invoiceRef}>
          {/* Top Brand Header */}
          <div className="invoice-header">
            <div>
              <div className="invoice-logo">
                AURELIA <span>JEWELS</span>
              </div>
              <p className="invoice-subhead">ATELIER & HIGH JEWELLERY GUILD</p>
              <div className="invoice-seller-info">
                <span>Aurelia Jewels Luxury Retail Private Limited</span>
                <span>GSTIN: 27AABCA1234F1Z8 | HSN Code: 7113</span>
                <span>402, High Street Heritage Arcade, Bandra West, Mumbai, MH 400050</span>
                <span>concierge@aureliajewels.com | +91 1800-209-8899</span>
              </div>
            </div>

            <div className="invoice-doc-meta">
              <div className="invoice-title-pill">TAX INVOICE / CASH RECEIPT</div>
              <div className="doc-meta-row">
                <span>Invoice No:</span>
                <strong>{invoiceNumber}</strong>
              </div>
              <div className="doc-meta-row">
                <span>Order No:</span>
                <strong>{orderNumber}</strong>
              </div>
              <div className="doc-meta-row">
                <span>Invoice Date:</span>
                <strong>{orderDate}</strong>
              </div>
              <div className="doc-meta-row">
                <span>Payment Method:</span>
                <strong>{order.paymentMethod === "COD" ? "Cash on Delivery" : "UPI / Prepaid"}</strong>
              </div>
            </div>
          </div>

          <div className="invoice-divider"></div>

          {/* Client & Shipping Information */}
          <div className="invoice-parties-grid">
            <div className="party-box">
              <small>BILLED & DELIVERED TO:</small>
              <strong className="party-name">{customerName}</strong>
              <p className="party-address">{destination}</p>
              {phone && <span className="party-contact">Tel: {phone}</span>}
            </div>

            <div className="party-box fulfillment-box">
              <small>FULFILLMENT & DISPATCH:</small>
              <strong>Insured Artisanal Courier Delivery</strong>
              <p>Tracking Ref: <code>EXP-{orderNumber.replace(/[^0-9]/g, "") || "982341"}</code></p>
              <div className="verified-badge">
                <ShieldCheck size={14} /> 100% Certified Authentic Jewelry
              </div>
            </div>
          </div>

          {/* Optional Gift Message Card */}
          {order.isGift && (
            <div className="invoice-gift-note-card">
              <div className="gift-note-header">
                <Gift size={16} />
                <strong>Complimentary Luxury Velvet Box & Personal Gift Card</strong>
              </div>
              {order.giftMessage && (
                <p className="gift-note-message">
                  &ldquo;{order.giftMessage}&rdquo;
                </p>
              )}
            </div>
          )}

          {/* Line Items Table */}
          <table className="invoice-table">
            <thead>
              <tr>
                <th style={{ width: "38px" }}>#</th>
                <th>Artisanal Piece Description</th>
                <th>HSN</th>
                <th style={{ textAlign: "center" }}>Qty</th>
                <th style={{ textAlign: "right" }}>Rate (₹)</th>
                <th style={{ textAlign: "right" }}>Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>
                    <strong>{item.name}</strong>
                    <div className="item-meta">18K Vermeil / Hallmarked Fine Craftsmanship</div>
                  </td>
                  <td>7113</td>
                  <td style={{ textAlign: "center" }}>{item.quantity}</td>
                  <td style={{ textAlign: "right" }}>{item.price.toLocaleString("en-IN")}</td>
                  <td style={{ textAlign: "right" }}>
                    <strong>{(item.price * item.quantity).toLocaleString("en-IN")}</strong>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Calculation & Tax Breakdown */}
          <div className="invoice-calculation-grid">
            <div className="invoice-terms-col">
              <small>TERMS & CRAFTSMANSHIP GUARANTEE:</small>
              <ul>
                <li>Every piece carries Aurelia's 1-Year Anti-Tarnish & Polish Warranty.</li>
                <li>Includes Certificate of Authenticity & Hallmarking Assay Verification.</li>
                <li>Complimentary 15-day return and exchange policy from delivery date.</li>
              </ul>
            </div>

            <div className="invoice-totals-col">
              <div className="calc-row">
                <span>Taxable Value:</span>
                <strong>₹{taxableAmount.toLocaleString("en-IN")}</strong>
              </div>
              <div className="calc-row tax">
                <span>CGST (1.5%):</span>
                <span>₹{cgst.toLocaleString("en-IN")}</span>
              </div>
              <div className="calc-row tax">
                <span>SGST (1.5%):</span>
                <span>₹{sgst.toLocaleString("en-IN")}</span>
              </div>
              {discount > 0 && (
                <div className="calc-row discount">
                  <span>Coupon Discount:</span>
                  <span>-₹{discount.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="calc-row">
                <span>Insured Courier Delivery:</span>
                <span>{shipping === 0 ? "Complimentary" : `₹${shipping}`}</span>
              </div>
              <div className="calc-divider"></div>
              <div className="calc-row total-row">
                <span>Total Invoice Amount:</span>
                <strong>₹{total.toLocaleString("en-IN")}</strong>
              </div>
            </div>
          </div>

          {/* Bottom Seal & Signature */}
          <div className="invoice-footer">
            <div className="seal-col">
              <div className="gold-seal-crest">
                <span>AURELIA</span>
                <small>CERTIFIED</small>
              </div>
              <small className="system-gen-text">
                This is a certified digital tax invoice issued by Aurelia Jewels Atelier.
              </small>
            </div>

            <div className="signature-col">
              <div className="signature-line"></div>
              <strong>Authorized Signatory</strong>
              <small>Aurelia Jewels Guild Master</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
