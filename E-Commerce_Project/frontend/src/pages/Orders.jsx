import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "../components/Title";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { orderApi } from "../services/orderService";

const STATUS_CONFIG = {
  PENDING: {
    label: "Pending Confirmation",
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-700 border border-amber-200",
  },
  CONFIRMED: {
    label: "Confirmed",
    dot: "bg-blue-500",
    badge: "bg-blue-50 text-blue-700 border border-blue-200",
  },
  PROCESSING: {
    label: "Processing",
    dot: "bg-indigo-500",
    badge: "bg-indigo-50 text-indigo-700 border border-indigo-200",
  },
  SHIPPED: {
    label: "Shipped",
    dot: "bg-purple-500",
    badge: "bg-purple-50 text-purple-700 border border-purple-200",
  },
  DELIVERED: {
    label: "Delivered",
    dot: "bg-green-500",
    badge: "bg-green-50 text-green-700 border border-green-200",
  },
  CANCELLED: {
    label: "Cancelled",
    dot: "bg-red-400",
    badge: "bg-red-50 text-red-600 border border-red-200",
  },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status,
    dot: "bg-gray-400",
    badge: "bg-gray-50 text-gray-600 border border-gray-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${cfg.badge}`}
    >
      <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

const formatPaymentMethod = (method) => {
  if (!method) return "Cash on Delivery";
  if (method === "CASH_ON_DELIVERY") return "Cash on Delivery";
  if (method === "CREDIT_CARD") return "Credit Card (Stripe)";
  if (method === "UPI") return "Online Payment (Razorpay)";
  return method;
};

// Build a maximally informative error message from any axios/network error
function describeError(err) {
  if (err?.code === "NO_TOKEN") return err.message;

  const status = err?.response?.status;
  const url = err?.config?.url;
  const method = (err?.config?.method || "GET").toUpperCase();
  const backendMsg =
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    (typeof err?.response?.data === "string" ? err.response.data : null);

  if (status) {
    if (status === 401)
      return `401 Unauthorized on ${method} ${url} — token missing/expired or refresh failed. ${backendMsg ?? ""}`;
    if (status === 403)
      return `403 Forbidden on ${method} ${url} — your account is missing permission "order:read". ${backendMsg ?? ""}`;
    if (status === 404)
      return `404 Not Found on ${method} ${url} — endpoint path wrong or gateway route missing.`;
    if (status >= 500)
      return `${status} Server error on ${method} ${url}. ${backendMsg ?? ""}`;
    return `${status} on ${method} ${url}. ${backendMsg ?? ""}`;
  }
  if (err?.request)
    return `Network error — no response from ${method} ${url}. Backend down, CORS blocked, or wrong baseURL.`;
  return err?.message || "Unknown error";
}

export default function Orders() {
  const { currency } = useContext(ShopContext);
  const [orders, setOrders] = useState([]);
  const [orderDetailsMap, setOrderDetailsMap] = useState({});
  const [expandedOrders, setExpandedOrders] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const loadOrders = async (p = 0) => {
    setLoading(true);
    setError(null);
    try {
      const data = await orderApi.getMyOrders(p, 10);
      setOrders(data.items);
      setTotalPages(data.totalPages || 1);
      setPage(p);
    } catch (err) {
      console.error("[Orders] FAILED", err);
      setError(describeError(err));
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleOrderDetails = async (orderId) => {
    const isExpanding = !expandedOrders[orderId];
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: isExpanding,
    }));

    if (isExpanding && !orderDetailsMap[orderId]) {
      try {
        const detail = await orderApi.getMyOrderDetail(orderId);
        if (detail) {
          setOrderDetailsMap((prev) => ({
            ...prev,
            [orderId]: detail,
          }));
        }
      } catch (err) {
        console.warn("Could not fetch order detail:", err);
      }
    }
  };

  useEffect(() => {
    loadOrders(0);
  }, []);

  return (
    <>
      <Navbar />
      <div className="border-t pt-14 pb-20 max-w-7xl mx-auto px-4">
        <div className="text-2xl mb-8">
          <Title text1={"MY"} text2={"ORDERS"} />
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">Loading orders…</div>
        ) : error ? (
          <div className="mx-auto max-w-2xl my-10 p-5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
            <p className="font-semibold mb-1">Could not load orders</p>
            <p className="whitespace-pre-wrap wrap-break-word">{error}</p>
            <button
              onClick={() => loadOrders(0)}
              className="mt-3 px-4 py-1.5 text-xs rounded-full bg-red-600 text-white hover:bg-red-700 cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg">No orders found.</p>
          </div>
        ) : (
          <>
            <div className="space-y-6">
              {orders.map((order) => {
                const detailed = orderDetailsMap[order.orderId] || order;
                const items = detailed.items || [];
                const address = detailed.shippingAddress;
                const isExpanded = !!expandedOrders[order.orderId];

                return (
                  <div
                    key={order.orderId}
                    className="border border-gray-200 rounded-2xl shadow-xs hover:shadow-md transition-shadow duration-200 overflow-hidden bg-white"
                  >
                    {/* Header bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 py-4 bg-gray-50/80 border-b border-gray-200">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-mono text-xs text-gray-600 font-bold bg-white px-2 py-1 rounded border border-gray-200">
                          Order #{order.orderId?.slice(0, 8)}…
                        </span>
                        {order.placedAt && (
                          <span className="text-xs text-gray-500 font-medium">
                            {new Date(order.placedAt).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}{" "}
                            at{" "}
                            {new Date(order.placedAt).toLocaleTimeString(undefined, {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {formatPaymentMethod(order.paymentMethod)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={order.status} />
                        <button
                          onClick={() => toggleOrderDetails(order.orderId)}
                          className="text-xs font-medium text-black hover:underline cursor-pointer bg-white border border-gray-200 px-3 py-1 rounded-full shadow-2xs"
                        >
                          {isExpanded ? "Hide Details ▲" : "View Details ▼"}
                        </button>
                      </div>
                    </div>

                    {/* Items List */}
                    <div className="px-6 py-4 divide-y divide-gray-100">
                      {items.length > 0 ? (
                        items.map((item, idx) => (
                          <div
                            key={item.itemId || idx}
                            className="py-3 flex items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden border border-gray-100">
                                {item.imageUrl ? (
                                  <img
                                    src={item.imageUrl}
                                    alt={item.productName}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.src =
                                        "https://placehold.co/56x56/e5e7eb/9ca3af?text=?";
                                    }}
                                  />
                                ) : (
                                  <span className="text-gray-400 text-xl">👕</span>
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900 text-sm">
                                  {item.productName}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  {item.variantLabel && (
                                    <span className="text-xs px-2 py-0.5 bg-gray-100 rounded text-gray-700 font-medium">
                                      {item.variantLabel}
                                    </span>
                                  )}
                                  <span className="text-xs text-gray-500">
                                    {currency}
                                    {Number(item.unitPrice).toFixed(2)} × {item.quantity}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-gray-900 text-sm">
                                {currency}
                                {Number(
                                  item.lineTotal ?? item.unitPrice * item.quantity,
                                ).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-3 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 overflow-hidden border border-gray-100">
                              {order.firstItemImage ? (
                                <img
                                  src={order.firstItemImage}
                                  alt={order.firstItemName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-gray-400 text-xl">👕</span>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-gray-900 text-sm">
                                {order.firstItemName}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {order.itemCount} item(s) in this order
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900 text-sm">
                              {currency}
                              {Number(order.totalAmount ?? 0).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Detailed expandable section: Address and price breakdown */}
                    {isExpanded && (
                      <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                        {/* Shipping Address */}
                        <div className="bg-white p-4 rounded-xl border border-gray-200">
                          <p className="font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                            <span>📍</span> Shipping Address
                          </p>
                          {address ? (
                            <div className="space-y-1 text-gray-600">
                              <p className="font-semibold text-gray-800">
                                {address.recipientName}
                              </p>
                              <p>📞 {address.phone}</p>
                              <p>{address.street}</p>
                              <p>
                                {[address.city, address.country, address.zipCode]
                                  .filter(Boolean)
                                  .join(", ")}
                              </p>
                            </div>
                          ) : (
                            <p className="text-gray-400">Address details unavailable</p>
                          )}
                        </div>

                        {/* Payment & Order Summary */}
                        <div className="bg-white p-4 rounded-xl border border-gray-200">
                          <p className="font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                            <span>🧾</span> Order Summary
                          </p>
                          <div className="space-y-1.5 text-gray-600">
                            <div className="flex justify-between">
                              <span>Subtotal</span>
                              <span>
                                {currency}
                                {Number(
                                  detailed.subtotal ??
                                    Number(order.totalAmount) -
                                      Number(detailed.shippingFee ?? 0),
                                ).toFixed(2)}
                              </span>
                            </div>
                            {Number(detailed.shippingFee ?? 0) > 0 && (
                              <div className="flex justify-between">
                                <span>Shipping Fee</span>
                                <span>
                                  {currency}
                                  {Number(detailed.shippingFee ?? 0).toFixed(2)}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-100 text-sm">
                              <span>Total Amount</span>
                              <span>
                                {currency}
                                {Number(order.totalAmount ?? 0).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Total Summary Footer */}
                    <div className="flex items-center justify-between px-6 py-3 bg-gray-50/60 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        {order.itemCount} {order.itemCount === 1 ? "item" : "items"} total
                      </p>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs text-gray-500">Total:</span>
                        <span className="text-lg font-bold text-gray-900">
                          {currency}
                          {Number(order.totalAmount ?? 0).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-3 mt-10">
                <button
                  onClick={() => loadOrders(page - 1)}
                  disabled={page === 0}
                  className="px-4 py-2 text-sm border rounded-full disabled:opacity-40 hover:bg-gray-50 cursor-pointer"
                >
                  ← Prev
                </button>
                <span className="px-4 py-2 text-sm text-gray-500">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => loadOrders(page + 1)}
                  disabled={page >= totalPages - 1}
                  className="px-4 py-2 text-sm border rounded-full disabled:opacity-40 hover:bg-gray-50 cursor-pointer"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <Footer />
    </>
  );
}
