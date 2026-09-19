import React, { useState } from "react";
import { X, Image as ImageIcon, Sparkles, AlertCircle } from "lucide-react";
import { CATEGORIES } from "../../data/demoProducts.js";

const DEFAULT_IMAGES = [
  "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=900&q=85",
];

export function CreateProductModal({ isOpen, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: "",
    category: "Necklaces",
    price: "",
    mrp: "",
    image: DEFAULT_IMAGES[0],
    description: "",
    material: "18k Gold Vermeil",
    finish: "High Polish",
    color: "Gold",
    size: "Standard",
    stock: 25,
    isNewArrival: true,
    isTrending: false,
    isFeatured: true,
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (error) setError("");
  };

  const handleSelectPresetImage = (url) => {
    setFormData((prev) => ({ ...prev, image: url }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("Please enter a product title.");
      return;
    }
    if (!formData.price || Number(formData.price) <= 0) {
      setError("Please enter a valid retail price.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        price: Number(formData.price),
        mrp: formData.mrp ? Number(formData.mrp) : Math.round(Number(formData.price) * 1.3),
        stock: Number(formData.stock) || 10,
        slug: formData.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-"),
      };

      await onSave(payload);
      onClose();
    } catch (err) {
      setError("Failed to create product listing. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <small>CATALOG MANAGEMENT</small>
            <h2>Create New Jewelry Listing</h2>
          </div>
          <button type="button" className="close-btn" onClick={onClose} aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="form-error-alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-layout-grid">
            {/* Left Column: Core Details */}
            <div className="form-column">
              <div className="form-group">
                <label>Listing Title *</label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. Royal Opal Choker Necklace"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Category *</label>
                  <select name="category" value={formData.category} onChange={handleChange}>
                    {CATEGORIES.filter((c) => c !== "All").map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>Inventory Stock *</label>
                  <input
                    type="number"
                    name="stock"
                    min="1"
                    placeholder="25"
                    value={formData.stock}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Selling Price (₹) *</label>
                  <input
                    type="number"
                    name="price"
                    min="1"
                    placeholder="2999"
                    value={formData.price}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>MRP / Tag Price (₹)</label>
                  <input
                    type="number"
                    name="mrp"
                    placeholder="3999"
                    value={formData.mrp}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Piece Description</label>
                <textarea
                  name="description"
                  rows="3"
                  placeholder="Describe the craftsmanship, cut, and layering feel..."
                  value={formData.description}
                  onChange={handleChange}
                ></textarea>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Material</label>
                  <input
                    type="text"
                    name="material"
                    placeholder="e.g. 18k Solid Vermeil"
                    value={formData.material}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Finish</label>
                  <input
                    type="text"
                    name="finish"
                    placeholder="e.g. High Mirror Polish"
                    value={formData.finish}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Color</label>
                  <input
                    type="text"
                    name="color"
                    placeholder="e.g. Gold / Emerald"
                    value={formData.color}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Size / Dimensions</label>
                  <input
                    type="text"
                    name="size"
                    placeholder="e.g. 40 cm + 5 cm extension"
                    value={formData.size}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Media Preview & Merchandising Tags */}
            <div className="form-column">
              <div className="form-group">
                <label>Jewelry Image URL</label>
                <input
                  type="url"
                  name="image"
                  placeholder="https://..."
                  value={formData.image}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Preset Image Selector */}
              <div className="image-preset-picker">
                <small>Or pick from luxury showroom imagery:</small>
                <div className="presets-row">
                  {DEFAULT_IMAGES.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt="Preset thumbnail"
                      className={`preset-thumb ${formData.image === url ? "active-preset" : ""}`}
                      onClick={() => handleSelectPresetImage(url)}
                    />
                  ))}
                </div>
              </div>

              {/* Live Preview Card */}
              <div className="image-live-preview">
                <small>Live Card Preview</small>
                <div className="preview-box">
                  {formData.image ? (
                    <img src={formData.image} alt="Live Preview" />
                  ) : (
                    <div className="preview-placeholder">
                      <ImageIcon size={32} />
                      <span>Enter an image URL to preview</span>
                    </div>
                  )}
                  {formData.isNewArrival && <span className="preview-badge">NEW</span>}
                </div>
              </div>

              {/* Badges & Merchandising */}
              <div className="merchandising-toggles">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isNewArrival"
                    checked={formData.isNewArrival}
                    onChange={handleChange}
                  />
                  <span>Mark as New Arrival</span>
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isTrending"
                    checked={formData.isTrending}
                    onChange={handleChange}
                  />
                  <span>Display in Trending Edit</span>
                </label>

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isFeatured"
                    checked={formData.isFeatured}
                    onChange={handleChange}
                  />
                  <span>Feature on Homepage</span>
                </label>
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="outline" onClick={onClose}>
              CANCEL
            </button>
            <button type="submit" className="button dark" disabled={submitting}>
              <Sparkles size={16} />
              {submitting ? "PUBLISHING..." : "PUBLISH LISTING"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
