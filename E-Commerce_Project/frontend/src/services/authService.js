import axios from "axios";
import api from "./axiosInstance";

const BASE_URL = import.meta.env.PROD
  ? import.meta.env.VITE_API_URL
  : "/api";

export const register = async ({ name, email, password }) => {
  const { data } = await api.post(
    "/auth/register",
    { name, email, password },
    { _skipAuthRefresh: true }
  );
  return data;
};

export const login = async ({ email, password }) => {
  const { data } = await api.post(
    "/auth/login",
    { email, password },
    { _skipAuthRefresh: true }
  );
  localStorage.setItem("auth", JSON.stringify(data));
  return data;
};

export const logout = async () => {
  const auth = JSON.parse(localStorage.getItem("auth") || "null");
  if (auth?.refreshToken) {
    try {
      await api.post("/auth/logout", { refreshToken: auth.refreshToken });
    } catch {}
  }
  localStorage.removeItem("auth");
  localStorage.removeItem("user_profile");
};

export const logoutAll = async () => {
  const auth = JSON.parse(localStorage.getItem("auth") || "null");
  if (auth?.user?.id) {
    try {
      await api.post("/auth/logout-all", null, {
        headers: { "User-Id": auth.user.id },
      });
    } catch {}
  }
  localStorage.removeItem("auth");
  localStorage.removeItem("user_profile");
};

let refreshPromise = null;

export const refreshSession = async () => {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const auth = JSON.parse(localStorage.getItem("auth") || "null");
      if (!auth?.refreshToken) return null;

      const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
        refreshToken: auth.refreshToken,
      });
      const newAuth = { ...auth, ...data };
      localStorage.setItem("auth", JSON.stringify(newAuth));
      window.dispatchEvent(new CustomEvent("auth:updated", { detail: newAuth }));
      return newAuth;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

// Helper
export const getStoredAuth = () =>
  JSON.parse(localStorage.getItem("auth") || "null");

export const forgotPassword = async (email) => {
  const { data } = await api.post("/auth/forgot-password", { email });
  return data;
};

export const resetPassword = async ({ token, newPassword, confirmPassword }) => {
  const { data } = await api.post("/auth/reset-password", {
    token,
    newPassword,
    confirmPassword,
  });
  return data;
};

export const verifyEmail = async (token) => {
  const { data } = await api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`);
  return data;
};

export const resendVerification = async (email) => {
  const { data } = await api.post("/auth/resend-verification", { email });
  return data;
};

export const loginWithGoogle = async (idToken) => {
  const { data } = await api.post(
    "/auth/google",
    { idToken },
    { _skipAuthRefresh: true }
  );
  localStorage.setItem("auth", JSON.stringify(data));
  return data;
};
