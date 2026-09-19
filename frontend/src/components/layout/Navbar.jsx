import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Heart,
  Search,
  ShoppingBag,
  Menu,
  X,
  Shield,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Package
} from "lucide-react";
import { useCart } from "../../context/CartContext.jsx";
import { useWishlist } from "../../context/WishlistContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef(null);

  const { totalItems } = useCart();
  const { totalWishlist } = useWishlist();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const closeMenu = () => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
    navigate("/");
  };

  // Close user dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNavClick = () => {
    closeMenu();
    if (location.pathname === "/") {
      setTimeout(() => {
        const el = document.getElementById("collection");
        if (el) el.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
  };

  return (
    <header className="nav">
      <button
        type="button"
        aria-label="Toggle navigation menu"
        className="icon mobile"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      <Link className="logo" to="/" onClick={closeMenu}>
        AURELIA <span>JEWELS</span>
      </Link>

      <nav className={`navlinks ${mobileMenuOpen ? "show" : ""}`}>
        <Link
          to="/shop"
          onClick={closeMenu}
          className={location.pathname === "/shop" && !location.search ? "active-nav" : ""}
        >
          Shop All
        </Link>
        <Link
          to="/shop?category=Necklaces"
          onClick={closeMenu}
          className={location.pathname === "/shop" && location.search.includes("Necklaces") ? "active-nav" : ""}
        >
          Necklaces
        </Link>
        <Link
          to="/shop?category=Earrings"
          onClick={closeMenu}
          className={location.pathname === "/shop" && location.search.includes("Earrings") ? "active-nav" : ""}
        >
          Earrings
        </Link>
        <Link
          to="/shop?category=Bracelets"
          onClick={closeMenu}
          className={location.pathname === "/shop" && location.search.includes("Bracelets") ? "active-nav" : ""}
        >
          Bracelets
        </Link>
        <Link
          to="/shop?category=Rings"
          onClick={closeMenu}
          className={location.pathname === "/shop" && location.search.includes("Rings") ? "active-nav" : ""}
        >
          Rings
        </Link>
        <Link
          to="/about"
          onClick={closeMenu}
          className={location.pathname === "/about" ? "active-nav" : ""}
        >
          Our Story
        </Link>
        {isAuthenticated && (
          <Link
            to="/my-orders"
            onClick={closeMenu}
            className={location.pathname === "/my-orders" || location.pathname === "/orders" ? "active-nav" : ""}
          >
            My Orders
          </Link>
        )}

        {/* Show Admin Link in Mobile Menu if Admin */}
        {isAdmin && (
          <Link
            to="/admin"
            onClick={closeMenu}
            className={`admin-nav-badge ${location.pathname === "/admin" ? "active-nav" : ""}`}
          >
            <Shield size={13} /> Admin Portal
          </Link>
        )}
      </nav>

      <div className="actions">
        <Link to="/shop" aria-label="Search jewelry" onClick={closeMenu}>
          <Search size={19} />
        </Link>

        <Link to="/wishlist" aria-label="Wishlist" onClick={closeMenu}>
          <Heart size={19} />
          {totalWishlist > 0 && <b>{totalWishlist}</b>}
        </Link>

        <Link to="/cart" aria-label="Shopping Bag" onClick={closeMenu}>
          <ShoppingBag size={19} />
          {totalItems > 0 && <b>{totalItems}</b>}
        </Link>

        {/* User Profile / Auth Action */}
        {isAuthenticated ? (
          <div className="user-dropdown-container" ref={userDropdownRef}>
            <button
              type="button"
              className="user-nav-btn"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              aria-label="User account menu"
            >
              <div className="user-avatar-circle">
                {user.name ? user.name.charAt(0).toUpperCase() : "U"}
              </div>
              <span className="user-nav-name">{user.name?.split(" ")[0]}</span>
              <ChevronDown size={14} />
            </button>

            {userDropdownOpen && (
              <div className="user-dropdown-menu">
                <div className="dropdown-user-header">
                  <strong>{user.name}</strong>
                  <small>{user.email}</small>
                  {isAdmin && <span className="dropdown-role-tag">Admin</span>}
                </div>

                <div className="dropdown-divider"></div>

                <Link to="/profile" onClick={closeMenu} className="dropdown-item">
                  <UserIcon size={15} /> My Profile & Address Book
                </Link>

                <Link to="/my-orders" onClick={closeMenu} className="dropdown-item">
                  <Package size={15} /> My Orders
                </Link>

                <Link to="/wishlist" onClick={closeMenu} className="dropdown-item">
                  <Heart size={15} /> My Wishlist ({totalWishlist})
                </Link>

                {isAdmin && (
                  <Link to="/admin" onClick={closeMenu} className="dropdown-item">
                    <Shield size={15} /> Admin Portal
                  </Link>
                )}

                <div className="dropdown-divider"></div>

                <button type="button" onClick={handleLogout} className="dropdown-item logout">
                  <LogOut size={15} /> Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link to="/login" className="login-nav-link" onClick={closeMenu}>
            <UserIcon size={18} />
            <span>Sign In</span>
          </Link>
        )}
      </div>
    </header>
  );
}
