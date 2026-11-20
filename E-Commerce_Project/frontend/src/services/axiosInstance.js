import axios from "axios";

const BASE_URL = import.meta.env.PROD
  ? import.meta.env.VITE_API_URL
  : "/api";

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // 60s timeout to allow cold-starting containers to boot
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const auth = JSON.parse(localStorage.getItem("auth") || "null");
  if (auth?.accessToken) {
    config.headers.Authorization = `Bearer ${auth.accessToken}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue = [];
let isColdStartActive = false;

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    // If a request succeeds after we showed the cold-start modal, dismiss it gracefully
    if (isColdStartActive) {
      isColdStartActive = false;
      window.dispatchEvent(
        new CustomEvent("server:cold-start", {
          detail: { isWarmingUp: false, success: true },
        })
      );
    }
    return response;
  },
  async (error) => {
    const original = error.config;
    if (!original) return Promise.reject(error);

    // ── 1. Cold Start / Server Sleep Detection & Auto-Retry ──
    const isColdStart =
      !error.response || // Network Error / container sleeping / connection dropped
      error.code === "ECONNABORTED" || // Request Timeout
      error.response?.status === 502 ||
      error.response?.status === 503 ||
      error.response?.status === 504;

    const MAX_RETRIES = 12; // 12 retries * 4s = ~48s (typical Spring Boot container wake-up time)

    if (
      isColdStart &&
      !original._skipColdStartNotification &&
      (original._coldStartRetries || 0) < MAX_RETRIES
    ) {
      original._coldStartRetries = (original._coldStartRetries || 0) + 1;
      isColdStartActive = true;

      // Notify the UI to show the ServerWakeupModal
      window.dispatchEvent(
        new CustomEvent("server:cold-start", {
          detail: {
            isWarmingUp: true,
            retries: original._coldStartRetries,
            maxRetries: MAX_RETRIES,
          },
        })
      );

      // Wait 4 seconds between retry attempts
      await new Promise((resolve) => setTimeout(resolve, 4000));
      return api(original);
    }

    // Dismiss modal if we hit maximum retries so the user isn't stuck forever
    if (isColdStartActive && (original._coldStartRetries || 0) >= MAX_RETRIES) {
      isColdStartActive = false;
      window.dispatchEvent(
        new CustomEvent("server:cold-start", {
          detail: { isWarmingUp: false, success: false },
        })
      );
    }

    // ── 2. Auto-refresh token on 403 (permissions updated) ──
    if (error.response?.status === 403 && !original._retryPerm && !original._skipAuthRefresh) {
      original._retryPerm = true;
      const auth = JSON.parse(localStorage.getItem("auth") || "null");
      if (auth?.refreshToken) {
        try {
          const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
            refreshToken: auth.refreshToken,
          });
          const newAuth = { ...auth, ...data };
          localStorage.setItem("auth", JSON.stringify(newAuth));
          window.dispatchEvent(new CustomEvent("auth:updated", { detail: newAuth }));
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(original);
        } catch {
          // Continue to reject
        }
      }
    }

    // ── 3. Token refresh on 401 Unauthorized ──
    if (error.response?.status === 401 && !original._retry && !original._skipAuthRefresh) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }

      original._retry = true;
      isRefreshing = true;

      const auth = JSON.parse(localStorage.getItem("auth") || "null");

      try {
        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken: auth?.refreshToken,
        });

        const newAuth = { ...auth, ...data };
        localStorage.setItem("auth", JSON.stringify(newAuth));
        window.dispatchEvent(new CustomEvent("auth:updated", { detail: newAuth }));

        processQueue(null, data.accessToken);

        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem("auth");

        window.dispatchEvent(new CustomEvent("auth:logout"));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default api;
