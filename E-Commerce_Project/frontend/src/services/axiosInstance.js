import axios from "axios";

const BASE_URL = "http://localhost:8085";

const api = axios.create({
  baseURL: BASE_URL,
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

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    // Auto-refresh token on 403 (permissions may have just been updated)
    if (error.response?.status === 403 && !original._retryPerm) {
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

    if (error.response?.status === 401 && !original._retry) {
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
