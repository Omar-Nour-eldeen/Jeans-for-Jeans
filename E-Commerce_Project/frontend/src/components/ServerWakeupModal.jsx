import React, { useState, useEffect } from "react";

const ServerWakeupModal = () => {
  const [isWarmingUp, setIsWarmingUp] = useState(false);
  const [retries, setRetries] = useState(1);
  const [maxRetries, setMaxRetries] = useState(12);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    let hideTimer = null;

    const handleColdStart = (e) => {
      const { isWarmingUp: warming, retries: r = 1, maxRetries: mr = 12, success } = e.detail || {};

      if (success) {
        setIsSuccess(true);
        hideTimer = setTimeout(() => {
          setIsWarmingUp(false);
          setIsSuccess(false);
          setRetries(1);
        }, 1200);
        return;
      }

      if (warming) {
        setIsWarmingUp(true);
        setIsSuccess(false);
        setRetries(r);
        setMaxRetries(mr);
      } else {
        setIsWarmingUp(false);
        setIsSuccess(false);
        setRetries(1);
      }
    };

    window.addEventListener("server:cold-start", handleColdStart);
    return () => {
      window.removeEventListener("server:cold-start", handleColdStart);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, []);

  if (!isWarmingUp) return null;

  // Progress percentage
  const progressPercent = Math.min(95, Math.max(15, Math.round((retries / maxRetries) * 100)));

  return (
    <div
      dir="ltr"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md transition-all duration-300"
    >
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 text-center animate-in fade-in zoom-in duration-200">
        {/* Glow decoration */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-32 h-32 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />

        {/* Status Icon */}
        <div className="relative mx-auto mb-5 w-20 h-20 flex items-center justify-center">
          {isSuccess ? (
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-bounce">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ) : (
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white flex items-center justify-center shadow-lg shadow-amber-500/30">
              <svg className="w-8 h-8 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              {/* Spinning ring */}
              <div className="absolute inset-0 -m-2 rounded-2xl border-2 border-amber-400/60 border-t-transparent animate-spin" />
            </div>
          )}
        </div>

        {/* Title */}
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          {isSuccess ? "Connected Successfully! 🎉" : "Waking Up Cloud Server... ⚡"}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 leading-relaxed mb-6">
          {isSuccess
            ? "Servers are ready! Loading your data now..."
            : "The cloud server was in sleep mode to conserve resources. It's now spinning up automatically. Please wait a moment without closing the page."}
        </p>

        {/* Progress bar */}
        {!isSuccess && (
          <div className="space-y-2 mb-6">
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-amber-500 to-orange-500 h-2.5 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-xs text-gray-400 font-medium px-1">
              <span>Attempt {retries} of {maxRetries}</span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                Connecting...
              </span>
            </div>
          </div>
        )}

        {/* Tip */}
        <div className="text-xs text-gray-400 bg-gray-50 rounded-xl p-3 border border-gray-100 text-left">
          💡 <span className="font-medium text-gray-600">Note:</span> Initial cold start takes ~30–60 seconds on the first visit. Subsequent requests will be instant.
        </div>
      </div>
    </div>
  );
};

export default ServerWakeupModal;
