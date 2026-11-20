import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { getProfile } from "../services/userService";
import { useContext } from "react";
import { ShopContext } from "../context/ShopContext";

/**
 * DataPrefetcher:
 * Completely isolated, low-priority background prefetching.
 * Never throws errors, never blocks the UI, and never interferes with other services.
 */
export default function DataPrefetcher() {
  const { auth, isLoggedIn } = useAuth();
  const {
    refreshProducts,
    refreshCategories,
    fetchCart,
    fetchReservedStock,
    canLoadProducts,
  } = useContext(ShopContext) || {};

  const hasPrefetchedRef = useRef(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      hasPrefetchedRef.current = false;
      return;
    }

    if (hasPrefetchedRef.current) return;
    hasPrefetchedRef.current = true;

    // Run parallel background prefetching completely isolated
    const prefetchTimer = setTimeout(() => {
      // 1. Prefetch user profile quietly
      getProfile().catch(() => {});

      // 2. Prefetch products & categories quietly
      if (canLoadProducts && canLoadProducts()) {
        refreshProducts?.().catch(() => {});
        refreshCategories?.().catch(() => {});
      }

      // 3. Prefetch Cart quietly
      if (auth?.role === "USER") {
        fetchCart?.().catch(() => {});
      }

      // 4. Prefetch reserved stock quietly
      fetchReservedStock?.().catch(() => {});
    }, 300);

    return () => clearTimeout(prefetchTimer);
  }, [
    auth,
    isLoggedIn,
    canLoadProducts,
    refreshProducts,
    refreshCategories,
    fetchCart,
    fetchReservedStock,
  ]);

  return null;
}
