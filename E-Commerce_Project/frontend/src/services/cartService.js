import api from "./axiosInstance";

// Helper: get userId from stored auth
const getUserId = () => {
  try {
    const auth = JSON.parse(localStorage.getItem("auth") || "null");
    return auth?.user?.id || auth?.userId || null;
  } catch {
    return null;
  }
};

let activePrefix = null;

const executeCall = async (method, path, data, config) => {
  if (method === "get") return (await api.get(path, config)).data;
  if (method === "post") return (await api.post(path, data, config)).data;
  if (method === "put") return (await api.put(path, data, config)).data;
  if (method === "delete") return (await api.delete(path, config)).data;
};

const isFallbackEligible = (err) => {
  const status = err?.response?.status;
  return status === 404 || status === 502 || status === 503 || status === 504;
};

/**
 * Executes request with automatic adaptive fallback between /cart and /orders/cart
 * to guarantee 100% compatibility across all Gateway and Order-service deployments.
 */
const requestWithFallback = async (method, primaryPath, fallbackPath, data = null, extraConfig = {}) => {
  const userId = getUserId();
  const headers = {
    ...(userId ? { "User-Id": userId } : {}),
    ...(extraConfig.headers || {}),
  };
  const config = { ...extraConfig, headers };

  const firstPath = activePrefix === "/orders/cart" ? fallbackPath : primaryPath;
  const secondPath = firstPath === primaryPath ? fallbackPath : primaryPath;

  try {
    const res = await executeCall(method, firstPath, data, config);
    if (!activePrefix) {
      activePrefix = firstPath.startsWith("/orders/cart") ? "/orders/cart" : "/cart";
    }
    return res;
  } catch (err) {
    if (secondPath && isFallbackEligible(err)) {
      try {
        const res = await executeCall(method, secondPath, data, config);
        activePrefix = secondPath.startsWith("/orders/cart") ? "/orders/cart" : "/cart";
        return res;
      } catch (fallbackErr) {
        throw fallbackErr;
      }
    }
    throw err;
  }
};

export const cartApi = {
  /** GET /cart */
  getCart: () =>
    requestWithFallback("get", "/cart", "/orders/cart", null, { _skipRetry: true })
      .then((body) => body?.data ?? body),

  /** GET /cart/count */
  getCartCount: () =>
    requestWithFallback("get", "/cart/count", "/orders/cart/count", null, { _skipRetry: true })
      .then((body) => body?.data?.count ?? 0),

  /**
   * POST /cart/items
   * body: { productId, variantId, quantity }
   */
  addItem: (productId, variantId, quantity = 1) =>
    requestWithFallback(
      "post",
      "/cart/items",
      "/orders/cart/items",
      {
        productId: String(productId),
        variantId: String(variantId),
        quantity: parseInt(quantity, 10),
      }
    ).then((body) => body?.data ?? body),

  /**
   * PUT /cart/items/{itemId}
   * body: { quantity }
   */
  updateItem: (itemId, quantity) =>
    requestWithFallback(
      "put",
      `/cart/items/${itemId}`,
      `/orders/cart/items/${itemId}`,
      { quantity: parseInt(quantity, 10) }
    ).then((body) => body?.data ?? body),

  /**
   * DELETE /cart/items/{itemId}
   */
  removeItem: (itemId) =>
    requestWithFallback(
      "delete",
      `/cart/items/${itemId}`,
      `/orders/cart/items/${itemId}`
    ).then((body) => body?.data ?? null),

  /** DELETE /cart */
  clearCart: () =>
    requestWithFallback("delete", "/cart", "/orders/cart"),
};
