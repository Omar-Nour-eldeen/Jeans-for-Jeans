import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { getProfile } from "../services/userService";
import { useContext } from "react";
import { ShopContext } from "../context/ShopContext";

/**
 * DataPrefetcher:
 * Automatically prefetches and caches core data in the background as soon as
 * the user opens the frontend application.
 *
 * Ensures instant page transitions to /profile, /collection, /product/:id, /cart,
 * preventing repeated HTTP calls on every navigation.
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

    // Prefetch once per session / auth change
    if (hasPrefetchedRef.current) return;
    hasPrefetchedRef.current = true;

    // Run parallel background prefetching with low-priority idle callback or timeout
    const prefetchTimer = setTimeout(() => {
      // 1. Prefetch user profile
      getProfile().catch((err) => {
        console.debug("[DataPrefetcher] Profile background prefetch:", err?.message);
      });

      // 2. Prefetch products & categories if user has permission
      if (canLoadProducts && canLoadProducts()) {
        refreshProducts?.().catch((err) => {
          console.debug("[DataPrefetcher] Products background prefetch:", err?.message);
        });
        refreshCategories?.().catch((err) => {
          console.debug("[DataPrefetcher] Categories background prefetch:", err?.message);
        });
      }

      // 3. Prefetch Cart and Reserved Stock for standard users
      if (auth?.role === "USER") {
        fetchCart?.().catch((err) => {
          console.debug("[DataPrefetcher] Cart background prefetch:", err?.message);
        });
      }

      fetchReservedStock?.().catch((err) => {
        console.debug("[DataPrefetcher] Reserved stock background prefetch:", err?.message);
      });
    }, 150); // slight delay to avoid competing with initial paint

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
