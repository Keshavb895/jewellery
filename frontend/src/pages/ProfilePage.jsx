import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  MapPin,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Home,
  Briefcase,
  Gift,
  Phone,
  CreditCard,
  Banknote,
  Shield,
  ShoppingBag,
  Heart,
  Package,
  X,
  Star
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import {
  updateProfileApi,
  getAddressesApi,
  addAddressApi,
  updateAddressApi,
  deleteAddressApi,
  setDefaultAddressApi
} from "../services/api.js";

const INDIAN_STATES = [
  "Delhi NCR",
  "Maharashtra",
  "Karnataka",
  "Tamil Nadu",
  "Telangana",
  "Gujarat",
  "Uttar Pradesh",
  "Rajasthan",
  "West Bengal",
  "Punjab",
  "Haryana",
  "Kerala",
  "Madhya Pradesh",
  "Goa",
  "Other"
];

export function ProfilePage() {
  const { user, isAuthenticated, updateUser, refreshProfile } = useAuth();
  const navigate = useNavigate();

  // Profile Form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    defaultPaymentMethod: user?.defaultPaymentMethod || "COD",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  // Address Book state
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [addressForm, setAddressForm] = useState({
    tag: "Home",
    fullName: user?.name || "",
    phone: user?.phone || "",
    address: "",
    city: "",
    state: "Delhi NCR",
    pincode: "",
    country: "India",
    isDefault: false,
  });
  const [savingAddress, setSavingAddress] = useState(false);
  const [addressError, setAddressError] = useState("");
  const [addressSuccess, setAddressSuccess] = useState("");

  // Sync profile form when user context updates
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || "",
        phone: user.phone || "",
        defaultPaymentMethod: user.defaultPaymentMethod || "COD",
      });
    }
  }, [user]);

  // Load saved addresses
  const loadAddresses = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoadingAddresses(true);
    try {
      const data = await getAddressesApi();
      if (Array.isArray(data)) {
        setAddresses(data);
      }
    } catch (err) {
      console.warn("Could not load addresses:", err);
    } finally {
      setLoadingAddresses(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadAddresses();
  }, [loadAddresses]);

  // Profile update handler
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      setProfileError("Full name is required");
      return;
    }

    setSavingProfile(true);
    setProfileError("");
    setProfileSuccess("");

    try {
      const updated = await updateProfileApi(profileForm);
      updateUser(updated);
      setProfileSuccess("Your profile details have been saved successfully!");
      setTimeout(() => setProfileSuccess(""), 4000);
    } catch (err) {
      setProfileError(err.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  // Open address modal for add or edit
  const handleOpenAddressModal = (addr = null) => {
    setAddressError("");
    if (addr) {
      setEditingAddressId(addr._id || addr.id);
      setAddressForm({
        tag: addr.tag || "Home",
        fullName: addr.fullName || "",
        phone: addr.phone || "",
        address: addr.address || "",
        city: addr.city || "",
        state: addr.state || "Delhi NCR",
        pincode: addr.pincode || "",
        country: "India",
        isDefault: Boolean(addr.isDefault),
      });
    } else {
      setEditingAddressId(null);
      setAddressForm({
        tag: "Home",
        fullName: user?.name || "",
        phone: user?.phone || "",
        address: "",
        city: "",
        state: "Delhi NCR",
        pincode: "",
        country: "India",
        isDefault: addresses.length === 0,
      });
    }
    setIsAddressModalOpen(true);
  };

  // Address submit handler
  const handleAddressSubmit = async (e) => {
    e.preventDefault();
    if (!addressForm.fullName.trim()) {
      setAddressError("Recipient full name is required");
      return;
    }
    if (!addressForm.phone.trim() || addressForm.phone.length < 10) {
      setAddressError("Please enter a valid 10-digit mobile number");
      return;
    }
    if (!addressForm.address.trim()) {
      setAddressError("Please enter street address");
      return;
    }
    if (!addressForm.city.trim() || !addressForm.pincode.trim()) {
      setAddressError("City and Postal PIN code are required");
      return;
    }

    setSavingAddress(true);
    setAddressError("");

    try {
      if (editingAddressId) {
        const updatedList = await updateAddressApi(editingAddressId, addressForm);
        setAddresses(updatedList);
        setAddressSuccess("Delivery address updated!");
      } else {
        const updatedList = await addAddressApi(addressForm);
        setAddresses(updatedList);
        setAddressSuccess("New address added to your address book!");
      }
      setIsAddressModalOpen(false);
      refreshProfile();
      setTimeout(() => setAddressSuccess(""), 4000);
    } catch (err) {
      setAddressError(err.message || "Failed to save address");
    } finally {
      setSavingAddress(false);
    }
  };

  // Delete address handler
  const handleDeleteAddress = async (id, tag) => {
    if (!window.confirm(`Are you sure you want to remove your ${tag} address?`)) return;
    try {
      const updatedList = await deleteAddressApi(id);
      setAddresses(updatedList);
      refreshProfile();
      setAddressSuccess("Address removed from your address book.");
      setTimeout(() => setAddressSuccess(""), 3500);
    } catch (err) {
      alert(err.message || "Could not delete address");
    }
  };

  // Set default address handler
  const handleSetDefault = async (id) => {
    try {
      const updatedList = await setDefaultAddressApi(id);
      setAddresses(updatedList);
      refreshProfile();
      setAddressSuccess("Default delivery address updated for 1-click checkout!");
      setTimeout(() => setAddressSuccess(""), 3500);
    } catch (err) {
      alert(err.message || "Could not set default address");
    }
  };

  const getTagIcon = (tag) => {
    switch (tag) {
      case "Office":
        return <Briefcase size={14} />;
      case "Gifting":
        return <Gift size={14} />;
      default:
        return <Home size={14} />;
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="profile-page-wrapper">
        <section className="profile-hero">
          <small>CLIENT PRIVILEGES</small>
          <h1>Account & Address Book</h1>
          <p>Sign in to manage your saved delivery addresses, profile preferences, and 1-click checkout.</p>
        </section>

        <div className="profile-unauth-card">
          <div className="unauth-icon-circle">
            <User size={36} />
          </div>
          <h2>Sign In to Access Your Client Profile</h2>
          <p>Access your saved address book for expedited checkout and review your bespoke acquisitions.</p>
          <div style={{ display: "flex", gap: "12px", justifyContent: "center", marginTop: "20px" }}>
            <Link to="/login" className="button dark">
              SIGN IN TO MY ACCOUNT
            </Link>
            <Link to="/shop" className="button outline">
              BROWSE STOREFRONT
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="profile-page-wrapper">
      {/* Hero Header */}
      <section className="profile-hero">
        <div className="profile-hero-content">
          <small>CLIENT PRIVILEGES</small>
          <h1>Client Profile & Address Book</h1>
          <p>
            Manage your personal credentials, configure saved addresses for 1-click checkout, and review account settings.
          </p>
        </div>
      </section>

      <div className="profile-container">
        {/* Top Patron Banner */}
        <div className="patron-banner">
          <div className="patron-info">
            <div className="patron-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : "A"}
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <h2>{user?.name}</h2>
                <span className="patron-badge">
                  <Shield size={12} /> {user?.role === "admin" ? "Storefront Administrator" : "Verified Client"}
                </span>
              </div>
              <p className="patron-email">{user?.email}</p>
            </div>
          </div>

          <div className="patron-quick-actions">
            <Link to="/my-orders" className="button outline" style={{ fontSize: "12px", padding: "8px 14px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Package size={14} /> My Orders
            </Link>
            <Link to="/wishlist" className="button outline" style={{ fontSize: "12px", padding: "8px 14px", display: "flex", alignItems: "center", gap: "6px" }}>
              <Heart size={14} /> Wishlist
            </Link>
          </div>
        </div>

        {/* Feedback Messages */}
        {profileSuccess && (
          <div className="profile-alert success">
            <CheckCircle2 size={16} />
            <span>{profileSuccess}</span>
          </div>
        )}
        {addressSuccess && (
          <div className="profile-alert success">
            <CheckCircle2 size={16} />
            <span>{addressSuccess}</span>
          </div>
        )}
        {profileError && (
          <div className="profile-alert error">
            <AlertCircle size={16} />
            <span>{profileError}</span>
          </div>
        )}

        {/* 2-Column Layout */}
        <div className="profile-grid">
          {/* Column 1: Personal Profile & 1-Click Checkout Preferences */}
          <div className="profile-card">
            <div className="profile-card-header">
              <User size={18} />
              <div>
                <h3>Personal Information</h3>
                <small>Update your primary credentials and default payment method</small>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit} className="profile-form">
              <div className="form-group">
                <label>Full Name *</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  placeholder="Your full name"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  style={{ background: "#f5f3ef", cursor: "not-allowed", color: "#666" }}
                />
                <small style={{ color: "var(--muted)", fontSize: "11px", marginTop: "3px" }}>
                  Email is locked as your Flash Jewels account identifier.
                </small>
              </div>

              <div className="form-group">
                <label>Mobile Number (For Courier Updates)</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    placeholder="e.g. 9876543210"
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: "16px", borderTop: "1px solid var(--line)", paddingTop: "14px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Star size={14} color="#8a6d2b" />
                  <span>Default 1-Click Payment Preference</span>
                </label>
                <small style={{ color: "var(--muted)", fontSize: "11px", display: "block", marginBottom: "8px" }}>
                  Pre-selects this method automatically during checkout.
                </small>

                <div className="payment-preference-options">
                  <label className={`pref-option ${profileForm.defaultPaymentMethod === "COD" ? "active" : ""}`}>
                    <input
                      type="radio"
                      name="paymentPref"
                      value="COD"
                      checked={profileForm.defaultPaymentMethod === "COD"}
                      onChange={() => setProfileForm({ ...profileForm, defaultPaymentMethod: "COD" })}
                    />
                    <Banknote size={16} />
                    <span>Cash on Delivery (COD)</span>
                  </label>

                  <label className={`pref-option ${profileForm.defaultPaymentMethod === "UPI" ? "active" : ""}`}>
                    <input
                      type="radio"
                      name="paymentPref"
                      value="UPI"
                      checked={profileForm.defaultPaymentMethod === "UPI"}
                      onChange={() => setProfileForm({ ...profileForm, defaultPaymentMethod: "UPI" })}
                    />
                    <CreditCard size={16} />
                    <span>UPI / Online Banking</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="button dark"
                disabled={savingProfile}
                style={{ marginTop: "20px", width: "100%" }}
              >
                {savingProfile ? "SAVING..." : "SAVE PROFILE DETAILS"}
              </button>
            </form>
          </div>

          {/* Column 2: Saved Address Book */}
          <div className="profile-card">
            <div className="profile-card-header" style={{ justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <MapPin size={18} />
                <div>
                  <h3>Address Book ({addresses.length})</h3>
                  <small>Saved destinations for expedited 1-click fulfillment</small>
                </div>
              </div>

              <button
                type="button"
                className="button dark"
                onClick={() => handleOpenAddressModal()}
                style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 12px", fontSize: "11.5px" }}
              >
                <Plus size={14} /> ADD ADDRESS
              </button>
            </div>

            <div className="addresses-list">
              {loadingAddresses ? (
                <div style={{ padding: "30px", textAlign: "center", color: "var(--muted)" }}>
                  Loading your address book...
                </div>
              ) : addresses.length > 0 ? (
                addresses.map((addr) => {
                  const addrId = addr._id || addr.id;
                  return (
                    <div
                      key={addrId}
                      className={`saved-address-card ${addr.isDefault ? "is-default" : ""}`}
                    >
                      <div className="address-card-top">
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span className={`address-tag-pill ${addr.tag?.toLowerCase()}`}>
                            {getTagIcon(addr.tag)} {addr.tag || "Home"}
                          </span>
                          {addr.isDefault && (
                            <span className="default-address-badge">
                              <Star size={11} /> DEFAULT 1-CLICK
                            </span>
                          )}
                        </div>

                        <div className="address-card-actions">
                          <button
                            type="button"
                            className="address-action-btn"
                            title="Edit Address"
                            onClick={() => handleOpenAddressModal(addr)}
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            className="address-action-btn delete"
                            title="Delete Address"
                            onClick={() => handleDeleteAddress(addrId, addr.tag)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>

                      <div className="address-recipient-info">
                        <strong>{addr.fullName}</strong>
                        <p>{addr.address}</p>
                        <p>
                          {addr.city}, {addr.state} - <strong>{addr.pincode}</strong>
                        </p>
                        <div className="address-phone">
                          <Phone size={11} /> Phone: {addr.phone}
                        </div>
                      </div>

                      {!addr.isDefault && (
                        <button
                          type="button"
                          className="set-default-btn"
                          onClick={() => handleSetDefault(addrId)}
                        >
                          Make Default Address
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="empty-addresses-box">
                  <MapPin size={32} color="#cbb279" />
                  <h4>No Addresses Saved Yet</h4>
                  <p>Save your Home, Office, or Gifting addresses for instant 1-click checkout.</p>
                  <button
                    type="button"
                    className="button outline"
                    onClick={() => handleOpenAddressModal()}
                    style={{ marginTop: "10px", fontSize: "12px", padding: "6px 14px" }}
                  >
                    + ADD YOUR FIRST ADDRESS
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ADD / EDIT ADDRESS MODAL */}
      {isAddressModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddressModalOpen(false)}>
          <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "520px" }}>
            <div className="modal-header">
              <div>
                <small>ADDRESS BOOK MANAGEMENT</small>
                <h2>{editingAddressId ? "Edit Delivery Address" : "Add Delivery Address"}</h2>
              </div>
              <button type="button" className="close-btn" onClick={() => setIsAddressModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            {addressError && (
              <div className="form-error-alert" style={{ margin: "16px 24px 0" }}>
                <AlertCircle size={16} />
                <span>{addressError}</span>
              </div>
            )}

            <form onSubmit={handleAddressSubmit} className="admin-form" style={{ padding: "20px 24px" }}>
              {/* Address Tag Selector */}
              <div className="form-group">
                <label>Address Tag / Destination Type</label>
                <div className="tag-selector-row">
                  {["Home", "Office", "Gifting", "Other"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      className={`tag-choice-btn ${addressForm.tag === t ? "active" : ""}`}
                      onClick={() => setAddressForm({ ...addressForm, tag: t })}
                    >
                      {getTagIcon(t)} {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Recipient Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Radhika Roy"
                    value={addressForm.fullName}
                    onChange={(e) => setAddressForm({ ...addressForm, fullName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Mobile Number *</label>
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={addressForm.phone}
                    onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Street Address / Apartment / Landmark *</label>
                <input
                  type="text"
                  placeholder="e.g. 402, Golden Heights, Bandra West"
                  value={addressForm.address}
                  onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                  required
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>City *</label>
                  <input
                    type="text"
                    placeholder="e.g. Mumbai"
                    value={addressForm.city}
                    onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Postal PIN Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. 400050"
                    value={addressForm.pincode}
                    onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>State *</label>
                <select
                  value={addressForm.state}
                  onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                >
                  {INDIAN_STATES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginTop: "12px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={addressForm.isDefault}
                    onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                    style={{ width: "16px", height: "16px", accentColor: "#8a6d2b" }}
                  />
                  <span style={{ fontSize: "12.5px" }}>Set as my default 1-click delivery address</span>
                </label>
              </div>

              <div className="modal-actions" style={{ marginTop: "18px" }}>
                <button
                  type="button"
                  className="outline"
                  onClick={() => setIsAddressModalOpen(false)}
                  disabled={savingAddress}
                >
                  CANCEL
                </button>
                <button type="submit" className="button dark" disabled={savingAddress}>
                  {savingAddress ? "SAVING..." : editingAddressId ? "UPDATE ADDRESS" : "SAVE ADDRESS"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
