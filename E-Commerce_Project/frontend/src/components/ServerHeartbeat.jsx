import { useEffect, useRef } from "react";
import api from "../services/axiosInstance";

/**
 * List of known SnapDeploy container endpoints.
 * Can be extended via VITE_CONTAINER_URLS environment variable (comma-separated)
 * or via localStorage.setItem("snapdeploy_container_urls", JSON.stringify([...]))
 */
const DEFAULT_CONTAINERS = [
  "https://jeans-gateway-f7863.containers.snapdeploy.app",
  "https://jeans-eureka-cbd8c.containers.snapdeploy.app",
  "https://jeans-auth-cbd8c.containers.snapdeploy.app",
  "https://jeans-user-abb55.containers.snapdeploy.app",
  "https://jeans-product-abb55.containers.snapdeploy.app",
  "https://jeans-order-cbd8c.containers.snapdeploy.app",
  "https://jeans-cart-cbd8c.containers.snapdeploy.app",
];

const getContainerList = () => {
  try {
    const saved = localStorage.getItem("snapdeploy_container_urls");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return Array.from(new Set([...DEFAULT_CONTAINERS, ...parsed]));
      }
    }
  } catch {}

  const custom = import.meta.env.VITE_CONTAINER_URLS;
  if (custom) {
    const list = custom.split(",").map((s) => s.trim()).filter(Boolean);
    return Array.from(new Set([...DEFAULT_CONTAINERS, ...list]));
  }
  return DEFAULT_CONTAINERS;
};

let lastWakeupTime = 0;
const WAKEUP_THROTTLE_MS = 60000; // Limit wake-up bursts to at most once per 60 seconds

/**
 * Sends a lightweight HTTP ping directly to each container's SnapDeploy public URL.
 * Using mode: 'no-cors' triggers SnapDeploy's ingress to wake up the sleeping container
 * without any CORS restrictions or blocking the browser.
 * Throttled to respect SnapDeploy's Cloudflare rate limits (< 100 req/min).
 */
export const wakeUpAllContainers = () => {
  const now = Date.now();
  if (now - lastWakeupTime < WAKEUP_THROTTLE_MS) return;
  lastWakeupTime = now;

  const urls = getContainerList();
  urls.forEach((url) => {
    try {
      fetch(`${url}/`, { mode: "no-cors", cache: "no-store" }).catch(() => {});
    } catch {}
  });
};

// Fire immediately on module load so containers start booting before components even render
wakeUpAllContainers();

/**
 * Keeps the backend services awake as long as ANY user has the frontend open in their browser.
 * Pings every 4 minutes (240s) which is well before platforms like SnapDeploy sleep (usually 15m).
 */
const ServerHeartbeat = () => {
  const lastPingRef = useRef(Date.now());

  useEffect(() => {
    const PING_INTERVAL_MS = 240000; // 4 minutes

    const sendHeartbeat = async () => {
      lastPingRef.current = Date.now();

      // 1. Ping each SnapDeploy container directly to wake it up / keep it awake
      wakeUpAllContainers();

      // 2. Ping gateway /orders/reserved-stock to verify gateway routing
      try {
        await api.get("/orders/reserved-stock", {
          _skipRetry: true,
          timeout: 8000,
        });
      } catch {
        // Ignore heartbeat failures quietly
      }
    };

    // Periodic heartbeat every 4 minutes (avoid duplicate initial fire since module already fired)
    const interval = setInterval(sendHeartbeat, PING_INTERVAL_MS);

    // Ping immediately when user returns to tab if idle > 3 minutes
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        const timeSinceLastPing = Date.now() - lastPingRef.current;
        if (timeSinceLastPing > PING_INTERVAL_MS) {
          sendHeartbeat();
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return null;
};

export default ServerHeartbeat;
