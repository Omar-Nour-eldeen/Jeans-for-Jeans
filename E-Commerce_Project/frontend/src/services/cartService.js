import api from "./axiosInstance";

// Helper: get userId from stored auth
const getUserId = () => {
  const auth = JSON.parse(localStorage.getItem("auth") || "null");
  return auth?.user?.id || auth?.userId || null;
};

export const cartApi = {
  /** GET /cart */
  getCart: () =>
    api
      .get("/cart", { headers: { "User-Id": getUserId() } })
      .then((r) => r.data.data),

  /** GET /cart/count */
  getCartCount: () =>
    api
      .get("/cart/count", { headers: { "User-Id": getUserId() } })
      .then((r) => r.data.data?.count ?? 0),

  /**
   * POST /cart/items
   * body: { productId, variantId, quantity }
   */
  addItem: (productId, variantId, quantity = 1) =>
    api
      .post(
        "/cart/items",
        {
          productId,
          variantId,
          quantity: parseInt(quantity, 10),
        },
        { headers: { "User-Id": getUserId() } },
      )
      .then((r) => r.data.data),

  /**
   * PUT /cart/items/{itemId}
   * body: { quantity }
   * FIX: returns updated cart from response body
   */
  updateItem: (itemId, quantity) =>
    api
      .put(
        `/cart/items/${itemId}`,
        { quantity: parseInt(quantity, 10) },
        { headers: { "User-Id": getUserId() } },
      )
      .then((r) => r.data.data),

  /**
   * DELETE /cart/items/{itemId}
   * FIX: returns updated cart from response body so ShopContext
   *      can setCartData(updated) instead of manually filtering.
   *      Falls back gracefully if backend returns no body.
   */
  removeItem: (itemId) =>
    api
      .delete(`/cart/items/${itemId}`, {
        headers: { "User-Id": getUserId() },
      })
      .then((r) => r.data?.data ?? null),

  /** DELETE /cart */
  clearCart: () => api.delete("/cart", { headers: { "User-Id": getUserId() } }),
};
