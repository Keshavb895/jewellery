import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, User, Sparkles, Shield, AlertCircle, Database } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { checkHealthApi } from "../services/api.js";

export function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, register, loading } = useAuth();

  const isRegisterInitial = location.pathname === "/register";
  const [isRegister, setIsRegister] = useState(isRegisterInitial);
  const [dbStatus, setDbStatus] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchHealth = () => {
      checkHealthApi().then((health) => {
        if (isMounted) setDbStatus(health);
      });
    };

    fetchHealth();
    const timer = setInterval(fetchHealth, 4000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError("");
  };

  const fillDemo = (email, password) => {
    setIsRegister(false);
    setFormData((prev) => ({
      ...prev,
      email,
      password,
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (isRegister) {
      if (!formData.name.trim()) {
        setError("Please enter your full name.");
        return;
      }
      if (formData.password.length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match.");
        return;
      }

      const searchParams = new URLSearchParams(location.search);
      const redirectTarget = searchParams.get("redirect");

      try {
        const user = await register(formData.name, formData.email, formData.password);
        navigate(redirectTarget || (user.role === "admin" ? "/admin" : "/shop"));
      } catch (err) {
        if (err.message && err.message.toLowerCase().includes("failed to fetch")) {
          setError("Server is waking up on Render (free tier takes ~30-45s). Please wait 10 seconds and try again.");
        } else {
          setError(err.message || "Failed to create account.");
        }
      }
    } else {
      if (!formData.email || !formData.password) {
        setError("Please enter your email and password.");
        return;
      }

      const searchParams = new URLSearchParams(location.search);
      const redirectTarget = searchParams.get("redirect");

      try {
        const user = await login(formData.email, formData.password);
        if (redirectTarget) {
          navigate(redirectTarget);
        } else if (user.role === "admin") {
          navigate("/admin");
        } else {
          navigate("/shop");
        }
      } catch (err) {
        if (err.message && err.message.toLowerCase().includes("failed to fetch")) {
          setError("Server is waking up on Render (free tier takes ~30-45s). Please wait 10 seconds and try again.");
        } else {
          setError(err.message || "Invalid email or password.");
        }
      }
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <small>AURELIA JEWELS</small>
          <h1>{isRegister ? "Create an Account" : "Welcome Back"}</h1>
          <p>
            {isRegister
              ? "Join Aurelia Jewels for personalized curation, wishlists, and order tracking."
              : "Sign in to access your saved pieces, bag, and bespoke orders."}
          </p>
        </div>

        {dbStatus && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "7px 12px",
              borderRadius: "6px",
              fontSize: "12px",
              marginBottom: "16px",
              backgroundColor: dbStatus.databaseConnected ? "rgba(34, 197, 94, 0.08)" : "rgba(239, 68, 68, 0.08)",
              color: dbStatus.databaseConnected ? "#15803d" : "#b91c1c",
              border: `1px solid ${dbStatus.databaseConnected ? "rgba(34, 197, 94, 0.25)" : "rgba(239, 68, 68, 0.25)"}`,
            }}
          >
            <Database size={13} style={{ flexShrink: 0 }} />
            <span>
              {dbStatus.databaseConnected ? (
                <>Database: <strong>MongoDB Atlas Connected</strong> (Saved to cloud)</>
              ) : (
                <>Database: <strong>Demo Fallback Mode</strong> (MongoDB offline / IP not whitelisted)</>
              )}
            </span>
          </div>
        )}

        {/* Mode Switcher Tabs */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${!isRegister ? "active" : ""}`}
            onClick={() => {
              setIsRegister(false);
              setError("");
            }}
          >
            SIGN IN
          </button>
          <button
            type="button"
            className={`auth-tab ${isRegister ? "active" : ""}`}
            onClick={() => {
              setIsRegister(true);
              setError("");
            }}
          >
            CREATE ACCOUNT
          </button>
        </div>

        {/* Demo Quick-Fill Buttons */}
        <div className="demo-credentials-box">
          <div className="demo-label">
            <Sparkles size={14} /> Quick Demo Login:
          </div>
          <div className="demo-buttons-row">
            <button
              type="button"
              className="demo-btn admin"
              onClick={() => fillDemo("admin@aurelia.com", "admin123")}
            >
              <Shield size={12} /> Fill Admin (admin@aurelia.com)
            </button>
            <button
              type="button"
              className="demo-btn customer"
              onClick={() => fillDemo("customer@aurelia.com", "customer123")}
            >
              <User size={12} /> Fill Customer (customer@aurelia.com)
            </button>
          </div>
        </div>

        {error && (
          <div className="form-error-alert auth-alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {isRegister && (
            <div className="form-group">
              <label>Full Name</label>
              <div className="input-with-icon">
                <User size={16} />
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. Eleanor Vance"
                  value={formData.name}
                  onChange={handleChange}
                  required={isRegister}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label>Email Address</label>
            <div className="input-with-icon">
              <Mail size={16} />
              <input
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password</label>
            <div className="input-with-icon">
              <Lock size={16} />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <button
                type="button"
                className="pwd-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {isRegister && (
            <div className="form-group">
              <label>Confirm Password</label>
              <div className="input-with-icon">
                <Lock size={16} />
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required={isRegister}
                />
              </div>
            </div>
          )}

          <button type="submit" className="button dark full" disabled={loading}>
            {loading ? "PROCESSING..." : isRegister ? "CREATE ACCOUNT" : "SIGN IN"}
          </button>
        </form>

        <div className="auth-footer-note">
          {isRegister ? (
            <p>
              Already have an account?{" "}
              <button
                type="button"
                className="text-link"
                onClick={() => {
                  setIsRegister(false);
                  setError("");
                }}
              >
                Sign in here
              </button>
            </p>
          ) : (
            <p>
              Don't have an account yet?{" "}
              <button
                type="button"
                className="text-link"
                onClick={() => {
                  setIsRegister(true);
                  setError("");
                }}
              >
                Create one now
              </button>
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
