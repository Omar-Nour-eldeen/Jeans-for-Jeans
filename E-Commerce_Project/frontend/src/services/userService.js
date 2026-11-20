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
const PROFILE_TTL_MS = 5 * 60 * 1000; // 5 minutes fresh cache

/**
 * Synchronously retrieves cached profile if available for 0ms initial render.
 */
export const getCachedProfile = () => {
  const cached = cacheService.get(PROFILE_CACHE_KEY, PROFILE_TTL_MS * 2);
  if (cached?.data) return cached.data;
  try {
    const legacy = JSON.parse(localStorage.getItem("user_profile") || "null");
    return legacy;
  } catch {
    return null;
  }
};

let inFlightProfilePromise = null;

/**
 * Gets user profile.
 * - Cache-first: if cached profile is fresh and force is false, returns cached without network request.
 * - Deduplicates concurrent in-flight requests so multiple components mounting simultaneously only trigger 1 network call.
 * - Stale-while-revalidate fallback: on error, returns existing cached profile.
 */
export const getProfile = async ({ force = false, maxAgeMs = PROFILE_TTL_MS } = {}) => {
  const cached = cacheService.get(PROFILE_CACHE_KEY, maxAgeMs);

  if (!force && cached && !cached.isExpired && cached.data) {
    return cached.data;
  }

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
      if (cached?.data) {
        console.warn("[userService] Backend error; serving cached profile as fallback:", err?.message);
        return cached.data;
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
