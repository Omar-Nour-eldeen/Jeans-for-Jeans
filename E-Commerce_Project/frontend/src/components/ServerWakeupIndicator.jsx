import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const BASE_URL = import.meta.env.PROD
  ? import.meta.env.VITE_API_URL
  : "/api";

/**
 * ServerWakeupIndicator:
 * - Real live health check (no fake countdowns).
 * - Non-blocking floating indicator (bottom-right): never freezes the screen or disables user clicks.
 * - Fault-tolerant: polls real server health until 200 OK, then turns green and dismisses.
 */
export default function ServerWakeupIndicator() {
  const [isWarmingUp, setIsWarmingUp] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const isCheckingRef = useRef(false);

  useEffect(() => {
    // Listen to cold-start event when an API request encounters 502/503
    const handleColdStartEvent = () => {
      setIsWarmingUp(true);
    };

    window.addEventListener("server:cold-start-detected", handleColdStartEvent);

    return () => {
      window.removeEventListener("server:cold-start-detected", handleColdStartEvent);
    };
  }, []);

  // When warming up, poll real health every 8 seconds (to respect Cloudflare rate limits)
  useEffect(() => {
    if (!isWarmingUp || isReady) return;

    const timer = setInterval(() => {
      setSecondsElapsed((prev) => {
        if (prev >= 65) {
          // Auto-dismiss after 65 seconds to avoid infinite polling
          setIsWarmingUp(false);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    const poller = setInterval(async () => {
      try {
        const res = await axios.get(`${BASE_URL}/orders/reserved-stock`, {
          timeout: 5000,
          validateStatus: (s) => s < 500,
        });
        if (res.status < 500) {
          setIsReady(true);
          setTimeout(() => {
            setIsWarmingUp(false);
            setIsReady(false);
            setSecondsElapsed(0);
          }, 2000);
        }
      } catch {
        // Still warming up, continue polling gently
      }
    }, 8000); // 8s polling interval = only ~7 requests per minute max

    return () => {
      clearInterval(timer);
      clearInterval(poller);
    };
  }, [isWarmingUp, isReady]);

  if (!isWarmingUp) return null;

  return (
    <div
      dir="ltr"
      className="fixed bottom-5 right-5 z-[9999] pointer-events-none max-w-sm w-full px-4"
    >
      <div className="pointer-events-auto bg-stone-900/95 text-white backdrop-blur-md px-5 py-3.5 rounded-2xl shadow-2xl border border-stone-700/80 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-5">
        <div className="flex items-center gap-3">
          {isReady ? (
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-sm shrink-0">
              ✓
            </div>
          ) : (
            <div className="relative w-8 h-8 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping absolute" />
              <span className="w-2 h-2 rounded-full bg-amber-400" />
            </div>
          )}

          <div>
            <p className="text-xs font-semibold">
              {isReady ? "Server is Ready! 🎉" : "Cloud Server Waking Up... ⚡"}
            </p>
            <p className="text-[11px] text-stone-400">
              {isReady
                ? "Connected successfully. Data is live."
                : `Booting from sleep mode (${secondsElapsed}s elapsed)...`}
            </p>
          </div>
        </div>

        {!isReady && (
          <span className="text-[10px] bg-stone-800 text-stone-300 px-2 py-0.5 rounded-full font-mono shrink-0">
            Live
          </span>
        )}
      </div>
    </div>
  );
}
