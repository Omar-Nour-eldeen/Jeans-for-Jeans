import api from "./axiosInstance";
import { cacheService } from "./cacheService";

const getAuth = () => {
  try {
    return JSON.parse(localStorage.getItem("auth") || "null");
  } catch {
    return null;
  }
};

const getUserId = () => getAuth()?.user?.id ?? "";
const getUserEmail = () => getAuth()?.user?.email ?? "";

const PROFILE_CACHE_KEY = "user_profile";
const PROFILE_TTL_MS = 5 * 60 * 1000;

export const getCachedProfile = () => {
  const cached = cacheService.get(PROFILE_CACHE_KEY, PROFILE_TTL_MS * 2);
  if (cached?.data) return cached.data;
  try {
    return JSON.parse(localStorage.getItem("user_profile") || "null");
  } catch {
    return null;
  }
};

let inFlightProfilePromise = null;

/**
 * Gets user profile:
 * - Always calls backend in the background so services stay warm and live data updates.
 * - Deduplicates concurrent calls.
 * - Falls back to cached profile if network fails.
 */
export const getProfile = async () => {
  const cached = getCachedProfile();

  if (inFlightProfilePromise) {
    return inFlightProfilePromise;
  }

  inFlightProfilePromise = (async () => {
    try {
      const { data } = await api.get("/users/me", {
        headers: {
          "User-Id": getUserId(),
          "User-Email": getUserEmail(),
        },
      });

      const profile = data?.data;
      if (profile) {
        cacheService.set(PROFILE_CACHE_KEY, profile);
        localStorage.setItem("user_profile", JSON.stringify(profile));
        window.dispatchEvent(new CustomEvent("profile:updated", { detail: profile }));
      }
      return profile;
    } catch (err) {
      if (cached) {
        return cached;
      }
      throw err;
    } finally {
      inFlightProfilePromise = null;
    }
  })();

  return inFlightProfilePromise;
};

export const updateProfile = async (payload) => {
  const { data } = await api.put("/users/me", payload, {
    headers: {
      "User-Id": getUserId(),
      "User-Email": getUserEmail(),
    },
  });
  const profile = data?.data;
  if (profile) {
    cacheService.set(PROFILE_CACHE_KEY, profile);
    localStorage.setItem("user_profile", JSON.stringify(profile));
    window.dispatchEvent(new CustomEvent("profile:updated", { detail: profile }));
  }
  return profile;
};

export const uploadPhoto = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post("/users/me/photo", formData, {
    headers: {
      "User-Id": getUserId(),
      "Content-Type": "multipart/form-data",
    },
  });
  const profile = data?.data;
  if (profile) {
    cacheService.set(PROFILE_CACHE_KEY, profile);
    localStorage.setItem("user_profile", JSON.stringify(profile));
    window.dispatchEvent(new CustomEvent("profile:updated", { detail: profile }));
  }
  return profile;
};
