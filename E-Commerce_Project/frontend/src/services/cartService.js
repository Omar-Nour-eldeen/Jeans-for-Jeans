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

const getHeaders = (extraHeaders = {}) => {
  const userId = getUserId();
  return {
    ...(userId ? { "User-Id": userId } : {}),
    ...extraHeaders,
  };
};

export const cartApi = {
  /** GET /cart */
  getCart: () =>
    api
      .get("/cart", { headers: getHeaders(), _skipRetry: true })
      .then((res) => res.data?.data ?? res.data),

  /** GET /cart/count */
  getCartCount: () =>
    api
      .get("/cart/count", { headers: getHeaders(), _skipRetry: true })
      .then((res) => res.data?.data?.count ?? 0),

  /**
   * POST /cart/items
   * body: { productId, variantId, quantity }
   */
  addItem: (productId, variantId, quantity = 1) =>
    api
      .post(
        "/cart/items",
        {
          productId: String(productId),
          variantId: String(variantId),
          quantity: parseInt(quantity, 10),
        },
        { headers: getHeaders() }
      )
      .then((res) => res.data?.data ?? res.data),

  /**
   * PUT /cart/items/{itemId}
   * body: { quantity }
   */
  updateItem: (itemId, quantity) =>
    api
      .put(
        `/cart/items/${itemId}`,
        { quantity: parseInt(quantity, 10) },
        { headers: getHeaders() }
      )
      .then((res) => res.data?.data ?? res.data),

  /**
   * DELETE /cart/items/{itemId}
   */
  removeItem: (itemId) =>
    api
      .delete(`/cart/items/${itemId}`, { headers: getHeaders() })
      .then((res) => res.data?.data ?? null),

  /** DELETE /cart */
  clearCart: () =>
    api
      .delete("/cart", { headers: getHeaders() })
      .then((res) => res.data?.data ?? null),
};

export default cartApi;
