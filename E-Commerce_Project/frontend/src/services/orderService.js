import api from "./axiosInstance";

const getAuth = () => {
  try {
    return JSON.parse(localStorage.getItem("auth") || "null");
  } catch {
    return null;
  }
};

const getUserId = () => {
  const auth = getAuth();
  return auth?.user?.id || auth?.userId || null;
};

const requireToken = () => {
  const auth = getAuth();
  if (!auth?.accessToken) {
    const err = new Error(
      "You are not logged in. Please sign in to view your orders.",
    );
    err.code = "NO_TOKEN";
    throw err;
  }
  return auth.accessToken;
};

// Tolerant unwrap: backend may return any of:
//   { success, data: { items, totalPages, ... } }
//   { success, data: { content, totalPages, ... } }
//   { items: [...] } | { content: [...] } | [...]
export const unwrapPaged = (raw) => {
  const root = raw?.data?.data ?? raw?.data ?? raw;
  if (Array.isArray(root)) {
    return {
      items: root,
      totalPages: 1,
      currentPage: 0,
      totalElements: root.length,
    };
  }
  const items = root?.items ?? root?.content ?? [];
  return {
    items: Array.isArray(items) ? items : [],
    totalPages: root?.totalPages ?? 1,
    currentPage: root?.currentPage ?? root?.number ?? 0,
    totalElements: root?.totalElements ?? items.length ?? 0,
  };
};

export const orderApi = {
  placeOrder: (body) => {
    requireToken();
    const auth = getAuth();
    const email = auth?.user?.email || body?.customerEmail || "";
    return api
      .post("/orders", body, {
        headers: {
          "User-Id": getUserId(),
          ...(email ? { "User-Email": email } : {}),
        },
      })
      .then((r) => r.data?.data ?? r.data);
  },

  getMyOrders: async (page = 0, size = 10) => {
    requireToken();
    const r = await api.get("/orders", {
      params: { page, size },
      headers: { "User-Id": getUserId() },
    });
    // Pass the WHOLE response so unwrapPaged can handle every shape
    return unwrapPaged(r);
  },

  getMyOrderDetail: (orderId) => {
    requireToken();
    return api
      .get(`/orders/${orderId}`, { headers: { "User-Id": getUserId() } })
      .then((r) => r.data?.data ?? r.data);
  },

  getReservedStock: () => {
    const userId = getUserId();
    const config = userId ? { headers: { "User-Id": userId } } : {};
    return api
      .get("/orders/reserved-stock", config)
      .then((r) => r.data?.data ?? r.data ?? {})
      .catch(() => ({}));
  },
};

// ── Admin order endpoints (/admin/orders/**) ───────────────────────────────
export const adminOrderApi = {
  getAllOrders: async (status = null, page = 0, size = 20) => {
    const params = { page, size };
    if (status) params.status = status;
    const r = await api.get("/admin/orders", { params });
    return unwrapPaged(r);
  },
  getStats: () =>
    api.get("/admin/orders/stats").then((r) => r.data?.data ?? r.data),
  getOrderDetail: (orderId) =>
    api.get(`/admin/orders/${orderId}`).then((r) => r.data?.data ?? r.data),
  updateOrderStatus: (orderId, status) =>
    api
      .patch(`/admin/orders/${orderId}/status`, { status })
      .then((r) => r.data),
};
