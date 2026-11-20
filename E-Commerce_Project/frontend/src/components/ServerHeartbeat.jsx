import { useEffect, useRef } from "react";
import api from "../services/axiosInstance";

/**
 * Keeps the backend services awake as long as ANY user has the frontend open in their browser.
 * Pings every 3 minutes (180s) which is well before platforms like SnapDeploy/Render/Railway sleep (usually 10-15m).
 * When the browser tab is closed, the pings stop completely, allowing the server to sleep naturally after inactivity.
 */
const ServerHeartbeat = () => {
  const lastPingRef = useRef(Date.now());

  useEffect(() => {
    const PING_INTERVAL_MS = 180000; // 3 minutes

    const sendHeartbeat = async () => {
      lastPingRef.current = Date.now();
      try {
        // Ping gateway health check (lightweight, doesn't hit DB)
        await api.get("/health", {
          _skipColdStartNotification: true,
          _skipAuthRefresh: true,
          timeout: 10000,
        });
      } catch {
        // Fallback: ping root /
        try {
          await api.get("/", {
            _skipColdStartNotification: true,
            _skipAuthRefresh: true,
            timeout: 10000,
          });
        } catch {
          // Ignore heartbeat failures quietly
        }
      }
    };

    // Initial heartbeat after 10 seconds of app load
    const initialTimer = setTimeout(sendHeartbeat, 10000);

    // Periodic heartbeat every 3 minutes
    const interval = setInterval(sendHeartbeat, PING_INTERVAL_MS);

    // Ping immediately when user returns to the tab if it's been idle > 3 minutes
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
      clearTimeout(initialTimer);
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return null; // Invisible component
};

export default ServerHeartbeat;
