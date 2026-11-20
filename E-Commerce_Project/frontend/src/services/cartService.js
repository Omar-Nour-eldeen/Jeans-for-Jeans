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

/**
 * Executes request with automatic fallback between /cart and /orders/cart
 * to guarantee compatibility with all Gateway route configurations.
 */
const requestWithFallback = async (method, primaryPath, fallbackPath, data = null, extraConfig = {}) => {
  const userId = getUserId();
  const headers = {
    ...(userId ? { "User-Id": userId } : {}),
    ...(extraConfig.headers || {}),
  };
  const config = { ...extraConfig, headers };

  try {
    if (method === "get") {
      const res = await api.get(primaryPath, config);
      return res.data;
    }
    if (method === "post") {
      const res = await api.post(primaryPath, data, config);
      return res.data;
    }
    if (method === "put") {
      const res = await api.put(primaryPath, data, config);
      return res.data;
    }
    if (method === "delete") {
      const res = await api.delete(primaryPath, config);
      return res.data;
    }
  } catch (err) {
    if (err?.response?.status === 404 && fallbackPath) {
      if (method === "get") {
        const res = await api.get(fallbackPath, config);
        return res.data;
      }
      if (method === "post") {
        const res = await api.post(fallbackPath, data, config);
        return res.data;
      }
      if (method === "put") {
        const res = await api.put(fallbackPath, data, config);
        return res.data;
      }
      if (method === "delete") {
        const res = await api.delete(fallbackPath, config);
        return res.data;
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
