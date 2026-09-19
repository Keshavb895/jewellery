import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export function AdminRoute({ children }) {
  const { isAdmin, loading } = useAuth();

  if (loading) {
    return null;
  }

  // If user is not authorized as admin, do not show access denied - send them to home page of site
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
