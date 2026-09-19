import React, { createContext, useContext, useState, useEffect } from "react";
import { loginUserApi, registerUserApi, getMeApi } from "../services/api.js";

const AuthContext = createContext();

const USER_STORAGE_KEY = "aurelia_auth_user";
const TOKEN_STORAGE_KEY = "aurelia_auth_token";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem(USER_STORAGE_KEY);
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY) || null;
    } catch {
      return null;
    }
  });

  const [loading, setLoading] = useState(false);

  // Sync fresh profile & role from MongoDB Atlas
  useEffect(() => {
    if (token) {
      getMeApi().then((freshUser) => {
        if (freshUser && freshUser.role) {
          setUser((prev) => ({
            ...(prev || {}),
            ...freshUser,
            id: freshUser._id || freshUser.id || prev?.id,
          }));
        }
      });
    }
  }, [token]);

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    } catch {
      // Ignore storage errors
    }
  }, [user]);

  useEffect(() => {
    try {
      if (token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        // Clear user-specific cached orders when not logged in
        localStorage.removeItem("aurelia_user_orders");
        localStorage.removeItem("aurelia_saved_addresses");
      }
    } catch {
      // Ignore
    }
  }, [token]);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await loginUserApi(email, password);
      setUser(data.user);
      setToken(data.token);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    setLoading(true);
    try {
      const data = await registerUserApi(name, email, password);
      setUser(data.user);
      setToken(data.token);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem("aurelia_user_orders");
      localStorage.removeItem("aurelia_saved_addresses");
    } catch {
      // Ignore
    }
  };

  const updateUser = (updatedFields) => {
    setUser((prev) => ({
      ...(prev || {}),
      ...updatedFields,
    }));
  };

  const refreshProfile = async () => {
    if (!token) return null;
    try {
      const freshUser = await getMeApi();
      if (freshUser) {
        setUser((prev) => ({
          ...(prev || {}),
          ...freshUser,
          id: freshUser._id || freshUser.id || prev?.id,
        }));
        return freshUser;
      }
    } catch (e) {
      console.warn("Could not refresh profile:", e);
    }
    return null;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === "admin",
        login,
        register,
        logout,
        updateUser,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
