import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { getProfile } from "../services/userService";
import { useContext } from "react";
import { ShopContext } from "../context/ShopContext";

/**
 * DataPrefetcher:
 * Automatically calls all microservices on frontend load to wake them up
 * and fetch fresh data into the application.
 */
export default function DataPrefetcher() {
  const { auth, isLoggedIn } = useAuth();
  const {
    refreshProducts,
    refreshCategories,
    fetchCart,
    fetchReservedStock,
  } = useContext(ShopContext) || {};

  useEffect(() => {
    // 1. Immediately call Public Services on app startup
    const timer = setTimeout(() => {
      refreshProducts?.().catch(() => {});
      refreshCategories?.().catch(() => {});
      fetchReservedStock?.().catch(() => {});

      // 2. Call User Services if authenticated
      if (isLoggedIn?.()) {
        getProfile().catch(() => {});
        if (auth?.role === "USER") {
          fetchCart?.().catch(() => {});
        }
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [auth]); // Runs on startup and on auth change

  return null;
}
