import axios from "axios";
import api from "./axiosInstance";

const BASE_URL = "/api";

export const register = async ({ name, email, password }) => {
  const { data } = await axios.post(`${BASE_URL}/auth/register`, {
    name,
    email,
    password,
  });
  return data;
};

export const login = async ({ email, password }) => {
  const { data } = await axios.post(`${BASE_URL}/auth/login`, {
    email,
    password,
  });
  localStorage.setItem("auth", JSON.stringify(data));
  return data;
};

export const logout = async () => {
  const auth = JSON.parse(localStorage.getItem("auth") || "null");
  if (auth?.refreshToken) {
    await api.post("/auth/logout", { refreshToken: auth.refreshToken });
  }
  localStorage.removeItem("auth");
};

export const logoutAll = async () => {
  const auth = JSON.parse(localStorage.getItem("auth") || "null");
  if (auth?.user?.id) {
    await api.post("/auth/logout-all", null, {
      headers: { "User-Id": auth.user.id },
    });
  }
  localStorage.removeItem("auth");
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
