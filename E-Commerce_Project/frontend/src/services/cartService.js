import axios from "axios";
import api from "./axiosInstance";

// Helper: get userId from stored auth or create a persistent guest id
const getUserId = () => {
  try {
    const auth = JSON.parse(localStorage.getItem("auth") || "null");
    if (auth?.user?.id) return String(auth.user.id);
    if (auth?.userId) return String(auth.userId);
  } catch {}
  let guestId = localStorage.getItem("guest_cart_uid");
  if (!guestId) {
    guestId = "guest_" + Math.random().toString(36).substring(2, 12);
    localStorage.setItem("guest_cart_uid", guestId);
  }
  return guestId;
};

const getHeaders = (extraHeaders = {}) => {
  const userId = getUserId();
  return {
    ...(userId ? { "User-Id": userId } : {}),
    ...extraHeaders,
  };
};

let preferredTarget = null; // 'gateway' | 'proxy'

const execute = async (method, path, data = null, config = {}) => {
  const headers = getHeaders(config.headers);
  const fullConfig = { ...config, headers };

  const callGateway = () => {
    if (method === "get") return api.get(path, fullConfig);
    if (method === "post") return api.post(path, data, fullConfig);
    if (method === "put") return api.put(path, data, fullConfig);
    if (method === "delete") return api.delete(path, fullConfig);
  };

  const callProxy = () => {
    const proxyUrl = `/api/order-proxy${path}`;
    const auth = JSON.parse(localStorage.getItem("auth") || "null");
    const authHeaders = auth?.accessToken
      ? { Authorization: `Bearer ${auth.accessToken}` }
      : {};
    const proxyConfig = {
      ...fullConfig,
      headers: { ...fullConfig.headers, ...authHeaders },
    };
    if (method === "get") return axios.get(proxyUrl, proxyConfig);
    if (method === "post") return axios.post(proxyUrl, data, proxyConfig);
    if (method === "put") return axios.put(proxyUrl, data, proxyConfig);
    if (method === "delete") return axios.delete(proxyUrl, proxyConfig);
  };

  // If we already know proxy is the working target, use it directly
  if (preferredTarget === "proxy") {
    try {
      const res = await callProxy();
      return res.data;
    } catch {
      // Fallback to gateway if proxy somehow fails
      const res = await callGateway();
      preferredTarget = "gateway";
      return res.data;
    }
  }

  // Otherwise try gateway first
  try {
    const res = await callGateway();
    preferredTarget = "gateway";
    return res.data;
  } catch (err) {
    const status = err?.response?.status;
    const shouldFallback = !status || status === 404 || status >= 500;
    if (shouldFallback) {
      try {
        const res = await callProxy();
        preferredTarget = "proxy";
        return res.data;
      } catch (proxyErr) {
        throw proxyErr;
      }
    }
    throw err;
  }
};

export const cartApi = {
  /** GET /cart */
  getCart: () =>
    execute("get", "/cart", null, { _skipRetry: true })
      .then((body) => body?.data ?? body),

  /** GET /cart/count */
  getCartCount: () =>
    execute("get", "/cart/count", null, { _skipRetry: true })
      .then((body) => body?.data?.count ?? body?.count ?? 0),

  /**
   * POST /cart/items
   * body: { productId, variantId, quantity }
   */
  addItem: (productId, variantId, quantity = 1) =>
    execute("post", "/cart/items", {
      productId: String(productId),
      variantId: String(variantId),
      quantity: parseInt(quantity, 10),
    }).then((body) => body?.data ?? body),

  /**
   * PUT /cart/items/{itemId}
   * body: { quantity }
   */
  updateItem: (itemId, quantity) =>
    execute("put", `/cart/items/${itemId}`, {
      quantity: parseInt(quantity, 10),
    }).then((body) => body?.data ?? body),

  /**
   * DELETE /cart/items/{itemId}
   */
  removeItem: (itemId) =>
    execute("delete", `/cart/items/${itemId}`)
      .then((body) => body?.data ?? null),

  /** DELETE /cart */
  clearCart: () =>
    execute("delete", "/cart")
      .then((body) => body?.data ?? null),
};

export default cartApi;
