import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export const ProtectedRoute = ({
  children,
  requireAdmin = false,
  requireSuper = false,
}) => {
  const { user, isAdmin, isSuper, mustChangePassword, loading } = useAuth();

  if (loading) return null;

  if (!user) return <Navigate to="/login" replace />;

  if (mustChangePassword && window.location.pathname !== "/change-password") {
    return <Navigate to="/change-password" replace />;
  }

  if (requireSuper && !isSuper) return <Navigate to="/oncall/dashboard" />;

  if (requireAdmin && !isAdmin) return <Navigate to="/oncall/dashboard" />;

  return children;
};
