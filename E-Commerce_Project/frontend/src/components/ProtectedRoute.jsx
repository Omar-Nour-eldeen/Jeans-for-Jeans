// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getStoredAuth } from "../services/authService";

const ProtectedRoute = ({ children, roles = [], permission = null }) => {
  const { auth: contextAuth } = useAuth();
  const location = useLocation();

  // Use latest auth: fallback to localStorage to eliminate state update lag right after login
  const auth = contextAuth?.accessToken ? contextAuth : getStoredAuth();

  if (!auth?.accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userStatus = (auth?.user?.status || "ACTIVE").toUpperCase();
  if (userStatus !== "ACTIVE") {
    return <Navigate to="/login" replace />;
  }

  const rawRole = (auth?.role || auth?.user?.role || "").replace(/^ROLE_/, "").toUpperCase();
  const userPermissions = Array.isArray(auth?.permissions)
    ? auth.permissions
    : Array.from(auth?.permissions || []);

  const hasRole = (...targetRoles) =>
    targetRoles.some((r) => r.replace(/^ROLE_/, "").toUpperCase() === rawRole);

  const hasPermission = (perm) => userPermissions.includes(perm);

  // If specific roles required and user doesn't match
  if (roles.length > 0 && !hasRole(...roles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // If specific permission required and user doesn't match
  if (permission && !hasPermission(permission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Redirect admin/employee to their dashboard if they hit the home root directly
  if (roles.length === 0 && location.pathname === "/") {
    if (hasRole("ADMIN")) return <Navigate to="/admin" replace />;
    if (hasRole("EMPLOYEE")) return <Navigate to="/employee" replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
