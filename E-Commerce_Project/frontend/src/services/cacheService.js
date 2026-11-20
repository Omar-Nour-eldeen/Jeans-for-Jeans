/**
 * Cache utility for client-side storage with Time-To-Live (TTL).
 * Enables instant page loads, zero redundant network calls, and background revalidation.
 */

const PREFIX = "app_cache_";

export const cacheService = {
  /**
   * Get cached item if it exists.
   * @param {string} key
   * @param {number} maxAgeMs - TTL in milliseconds (default: 5 minutes)
   * @returns {{ data: any, isExpired: boolean, timestamp: number } | null}
   */
  get: (key, maxAgeMs = 5 * 60 * 1000) => {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed.timestamp !== "number") return null;

      const age = Date.now() - parsed.timestamp;
      const isExpired = age > maxAgeMs;

      return {
        data: parsed.data,
        isExpired,
        timestamp: parsed.timestamp,
        age,
      };
    } catch {
      return null;
    }
  },

  /**
   * Save item to cache with current timestamp.
   * @param {string} key
   * @param {any} data
   */
  set: (key, data) => {
    try {
      const record = {
        data,
        timestamp: Date.now(),
      };
      localStorage.setItem(PREFIX + key, JSON.stringify(record));
    } catch (err) {
      console.warn(`[cacheService] Failed to cache key "${key}":`, err);
    }
  },

  /**
   * Invalidate / remove specific cache item.
   * @param {string} key
   */
  remove: (key) => {
    try {
      localStorage.removeItem(PREFIX + key);
    } catch {
      // ignore
    }
  },

  /**
   * Clear all user-specific data on logout.
   */
  clearUserData: () => {
    try {
      localStorage.removeItem(PREFIX + "user_profile");
      localStorage.removeItem("user_profile");
      localStorage.removeItem(PREFIX + "user_orders");
      localStorage.removeItem(PREFIX + "cart");
    } catch {
      // ignore
    }
  },

  /**
   * Clear all app caches.
   */
  clearAll: () => {
    try {
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith(PREFIX)) {
          localStorage.removeItem(k);
        }
      });
    } catch {
      // ignore
    }
  },
};
