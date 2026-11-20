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

  useEffect(() => {
    // Prefetch user profile in background if logged in
    if (isLoggedIn?.()) {
      getProfile().catch(() => {});
    }
  }, [auth]);

  return null;
}
