import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useAuth } from "../../../context/AuthContext";
import { adminOrderApi } from "../../../services/orderService";
import { productApi } from "../../../services/productService";
import api from "../../../services/axiosInstance";
import { IconChevron, IconEye, IconX, IconMail } from "./Icons";
import { toast } from "react-toastify";

// Backend OrderStatus enum values (strictly matches OrderStatus.java)
const STATUSES = [
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

const STATUS_FLOW = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"];

const getAllowedStatuses = (currentStatus, hasStockIssue = false) => {
  if (currentStatus === "CANCELLED") {
    return ["CANCELLED"];
  }
  if (currentStatus === "DELIVERED") {
    return ["DELIVERED"];
  }
  const currentIndex = STATUS_FLOW.indexOf(currentStatus);
  if (currentIndex === -1) {
    return [currentStatus];
  }
  let forwardStatuses = STATUS_FLOW.slice(currentIndex);
  // Block advancing to any active state (CONFIRMED, SHIPPED, DELIVERED) if stock is 0 or insufficient
  if (currentStatus === "PENDING" && hasStockIssue) {
    forwardStatuses = ["PENDING"];
  }
  return [...forwardStatuses, "CANCELLED"];
};

const STATUS_LABELS = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const STATUS_STYLES = {
  PENDING: "bg-blue-50   text-blue-700   border-blue-200",
  CONFIRMED: "bg-indigo-50 text-indigo-700 border-indigo-200",
  SHIPPED: "bg-purple-50 text-purple-700 border-purple-200",
  DELIVERED: "bg-green-50  text-green-700  border-green-200",
  CANCELLED: "bg-red-50    text-red-700    border-red-200",
};

const DOT_STYLES = {
  PENDING: "bg-blue-500",
  CONFIRMED: "bg-indigo-500",
  SHIPPED: "bg-purple-500",
  DELIVERED: "bg-green-500",
  CANCELLED: "bg-red-400",
};

export default function OrderList() {
  const { isAdmin, hasPermission } = useAuth();
  const canFullUpdate = isAdmin() || hasPermission("order:update");
  const canCancelOnly = !canFullUpdate && hasPermission("order:cancel");
  const canUpdate = canFullUpdate || canCancelOnly;

  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const loadOrders = async (p = 0, status = statusFilter) => {
    try {
      setLoading(true);
      setError(null);
      const [orderData, prodsData, usersData] = await Promise.all([
        adminOrderApi.getAllOrders(status || null, p, 20),
        productApi.getAll().catch(() => []),
        api.get("/admin/users?size=200").catch(() => null),
      ]);

      const list = Array.isArray(orderData)
        ? orderData
        : Array.isArray(orderData?.items)
          ? orderData.items
          : Array.isArray(orderData?.content)
            ? orderData.content
            : [];
      setOrders(list);
      setTotalPages(orderData?.totalPages ?? 1);
      setTotalElements(orderData?.totalElements ?? list.length);
      setPage(p);

      if (Array.isArray(prodsData)) {
        setProducts(prodsData);
      }

      if (usersData?.data) {
        const raw = usersData.data?.data ?? usersData.data;
        const uList = Array.isArray(raw?.content)
          ? raw.content
          : Array.isArray(raw)
            ? raw
            : [];
        setUsers(uList);
      }
    } catch (err) {
      setError(err?.response?.data?.message || "Could not load orders.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadOrders(0);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Map user ID to registered email
  const userEmailMap = useMemo(() => {
    const map = {};
    (users || []).forEach((u) => {
      if (u?.id && u?.email) {
        map[String(u.id)] = u.email;
      }
    });
    return map;
  }, [users]);

  // Robust email resolver: order.customerEmail -> shippingAddress.email -> user-service account email
  const getCustomerEmail = useCallback(
    (order) => {
      if (!order) return "";
      return (
        order.customerEmail ||
        order.shippingAddress?.email ||
        (order.userId && userEmailMap[String(order.userId)]) ||
        ""
      );
    },
    [userEmailMap]
  );

  // Build quick stock lookup maps from live products
  const { variantStockMap, productsMap } = useMemo(() => {
    const vStock = {};
    const pMap = {};
    (products || []).forEach((p) => {
      if (p?.id != null) {
        pMap[String(p.id)] = p;
      }
      (p?.variants || []).forEach((v) => {
        if (v?.id != null) {
          vStock[String(v.id)] = v.stockQuantity != null ? Number(v.stockQuantity) : 0;
        }
      });
    });
    return { variantStockMap: vStock, productsMap: pMap };
  }, [products]);

  // Lookup current physical stock for any item in an order
  const getItemStock = useCallback(
    (item) => {
      if (!item) return null;
      const vId = item.variantId ? String(item.variantId) : null;
      if (vId && variantStockMap[vId] !== undefined) {
        return variantStockMap[vId];
      }
      const pId = item.productId ? String(item.productId) : null;
      if (pId && productsMap[pId]?.variants) {
        const v = productsMap[pId].variants.find(
          (varItem) =>
            String(varItem.id) === vId ||
            (item.variantLabel &&
              varItem.size &&
              String(varItem.size).trim().toLowerCase() ===
                String(item.variantLabel).trim().toLowerCase())
        );
        if (v && v.stockQuantity !== undefined) {
          return Number(v.stockQuantity);
        }
      }
      return null;
    },
    [variantStockMap, productsMap]
  );

  // Return any items in the order that have 0 or insufficient stock
  const getOrderStockIssues = useCallback(
    (order) => {
      if (!order?.items || order.items.length === 0) return [];
      const issues = [];
      for (const item of order.items) {
        const stock = getItemStock(item);
        if (stock !== null && stock !== undefined) {
          if (stock <= 0) {
            issues.push({
              item,
              stock,
              isZero: true,
              reason: `Out of stock (Stock is 0, requires ${item.quantity})`,
            });
          } else if (stock < item.quantity) {
            issues.push({
              item,
              stock,
              isZero: false,
              reason: `Insufficient stock (${stock} available, requires ${item.quantity})`,
            });
          }
        }
      }
      return issues;
    },
    [getItemStock]
  );

  const handleStatusFilter = (e) => {
    const val = e.target.value;
    setStatusFilter(val);
    loadOrders(0, val);
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    const order = orderList.find((o) => o.orderId === orderId);
    if (!order) return;

    if (order.status === "CANCELLED") {
      toast.error("Cancelled orders cannot be reopened.");
      return;
    }
    if (order.status === "DELIVERED") {
      toast.error("Delivered orders cannot be modified.");
      return;
    }

    const currentIndex = STATUS_FLOW.indexOf(order.status);
    const newIndex = STATUS_FLOW.indexOf(newStatus);
    if (newStatus !== "CANCELLED" && newIndex !== -1 && currentIndex !== -1 && newIndex < currentIndex) {
      toast.error(`Order status cannot move backwards (${order.status} → ${newStatus}). Flow must be forward only.`);
      return;
    }

    // STRICT STOCK CHECK: Do NOT allow advancing to any active state if starting from PENDING and stock is 0
    if (order.status === "PENDING" && newStatus !== "CANCELLED") {
      const stockIssues = getOrderStockIssues(order);
      if (stockIssues.length > 0) {
        const issue = stockIssues[0];
        toast.error(
          `Cannot proceed: "${issue.item.productName}" is ${issue.reason}. Stock must be available before moving to ${newStatus.toLowerCase()}.`
        );
        return;
      }
    }

    setUpdatingId(orderId);
    try {
      await adminOrderApi.updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        (Array.isArray(prev) ? prev : []).map((o) =>
          o.orderId === orderId ? { ...o, status: newStatus } : o,
        ),
      );
      if (selectedOrder && selectedOrder.orderId === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : prev));
      }
      toast.success("Order status updated successfully");
    } catch (err) {
      const rawMsg = err?.response?.data?.message || err?.response?.data?.error;
      let displayMsg = rawMsg;
      if (!displayMsg || displayMsg.toLowerCase().includes("unexpected error")) {
        if (newStatus !== "CANCELLED") {
          displayMsg = "Out of stock: Cannot proceed with order because the requested item is out of stock (Stock is 0).";
        } else {
          displayMsg = "Could not update order status. Please try again.";
        }
      }
      toast.error(displayMsg, { autoClose: 6000 });
    } finally {
      setUpdatingId(null);
    }
  };

  const orderList = useMemo(() => {
    if (Array.isArray(orders)) return orders;
    if (Array.isArray(orders?.items)) return orders.items;
    if (Array.isArray(orders?.content)) return orders.content;
    return [];
  }, [orders]);

  const totalRevenue = useMemo(() => {
    return orderList.reduce(
      (sum, o) => sum + Number(o?.totalAmount ?? o?.total ?? 0),
      0,
    );
  }, [orderList]);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Orders Management</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {totalElements} orders · Total Revenue:{" "}
            <span className="font-semibold text-gray-800">
              $
              {totalRevenue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </span>
          </p>
        </div>

        {/* Filter and Refresh */}
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={handleStatusFilter}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <button
            onClick={() => loadOrders(page)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white hover:bg-gray-50 text-gray-700 shadow-sm transition"
          >
            ↺ Refresh
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-20 text-gray-400">Loading orders, users & stock data…</div>
      ) : error ? (
        <div className="text-center py-20 text-red-500">{error}</div>
      ) : orderList.length === 0 ? (
        <div className="text-center py-20 text-gray-400">No orders found.</div>
      ) : (
        <>
          <div className="space-y-5">
            {orderList.map((order) => {
              const orderDate = order.placedAt || order.createdAt;
              const hasItems = Array.isArray(order.items) && order.items.length > 0;
              const customerName =
                order.shippingAddress?.recipientName || order.customerName || "Customer";
              const customerPhone = order.shippingAddress?.phone;
              const customerEmail = getCustomerEmail(order);
              const stockIssues = getOrderStockIssues(order);
              const hasStockIssue = stockIssues.length > 0;
              const rawAllowed = getAllowedStatuses(order.status, hasStockIssue);
              const allowedStatuses = canCancelOnly
                ? rawAllowed.filter((s) => s === order.status || s === "CANCELLED")
                : rawAllowed;

              return (
                <div
                  key={order.orderId}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden"
                >
                  {/* Card top */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-50 bg-gray-50/50">
                    <div className="flex items-center flex-wrap gap-2 sm:gap-3">
                      <div
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${DOT_STYLES[order.status] ?? "bg-gray-400"}`}
                      />
                      <span className="font-mono text-sm font-bold text-gray-800">
                        #{order.orderId}
                      </span>
                      <span className="text-gray-300">·</span>
                      <span className="font-semibold text-gray-900 text-sm">
                        {customerName}
                      </span>

                      {/* Customer Email Pill in Header */}
                      {customerEmail && (
                        <a
                          href={`mailto:${customerEmail}`}
                          className="inline-flex items-center gap-1.5 text-xs text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-0.5 rounded-lg font-mono font-medium border border-indigo-100 transition"
                          title="Customer Email"
                        >
                          <IconMail className="w-3.5 h-3.5 text-indigo-500" />
                          <span>{customerEmail}</span>
                        </a>
                      )}

                      {customerPhone && (
                        <span className="text-xs text-gray-500 font-mono">
                          ({customerPhone})
                        </span>
                      )}

                      {order.paymentMethod && (
                        <span className="text-[11px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">
                          {order.paymentMethod === "CASH_ON_DELIVERY"
                            ? "COD"
                            : order.paymentMethod}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {orderDate && (
                        <span className="text-xs text-gray-400">
                          {new Date(orderDate).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      )}
                      <span className="font-bold text-gray-900 text-base">
                        $
                        {Number(order.totalAmount ?? order.total ?? 0).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Stock Warning Banner if order is PENDING and has stock issues */}
                  {order.status === "PENDING" && hasStockIssue && (
                    <div className="bg-amber-50 border-b border-amber-100 px-5 py-2.5 flex items-center justify-between gap-2 text-xs text-amber-800">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">⚠️</span>
                        <span>
                          <strong>Stock Alert:</strong> Cannot confirm order. One or more items have 0 or insufficient stock.
                        </span>
                      </div>
                      <span className="font-semibold text-[11px] bg-amber-200/60 px-2 py-0.5 rounded text-amber-900">
                        Confirmation Blocked
                      </span>
                    </div>
                  )}

                  {/* Card body */}
                  <div className="px-5 py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Items List */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                        Order Items & Inventory Status
                      </p>
                      {hasItems ? (
                        <ul className="space-y-2.5">
                          {order.items.map((item, i) => {
                            const stock = getItemStock(item);
                            const isZeroStock = stock !== null && stock <= 0;
                            const isLowStock = stock !== null && stock > 0 && stock < item.quantity;
                            const variantText = item.variantLabel || item.size || "Standard";

                            return (
                              <li
                                key={i}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-gray-700 bg-gray-50/60 p-2.5 rounded-xl border border-gray-100/80"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-10 h-10 rounded-lg bg-gray-100 shrink-0 overflow-hidden border border-gray-200">
                                    {item.imageUrl ? (
                                      <img
                                        src={item.imageUrl}
                                        alt={item.productName}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          e.target.src =
                                            "https://placehold.co/40x40/e5e7eb/9ca3af?text=?";
                                        }}
                                      />
                                    ) : (
                                      <span className="text-gray-400 text-xs flex items-center justify-center h-full">
                                        👕
                                      </span>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-semibold text-gray-900 truncate">
                                      {item.productName}
                                    </p>
                                    <div className="flex items-center flex-wrap gap-2 text-xs text-gray-500 mt-0.5">
                                      <span className="bg-white px-1.5 py-0.5 rounded border border-gray-200 font-medium">
                                        Size: {variantText}
                                      </span>
                                      <span>·</span>
                                      <span>
                                        Qty: <strong>{item.quantity}</strong>
                                      </span>
                                      {item.unitPrice != null && (
                                        <>
                                          <span>·</span>
                                          <span>
                                            ${Number(item.unitPrice).toFixed(2)} each
                                          </span>
                                        </>
                                      )}
                                      {item.lineTotal != null && (
                                        <>
                                          <span>·</span>
                                          <span className="font-medium text-gray-700">
                                            Total: ${Number(item.lineTotal).toFixed(2)}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* Stock badge */}
                                <div className="shrink-0 flex items-center gap-2">
                                  {stock === null ? (
                                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 font-medium">
                                      Stock: N/A
                                    </span>
                                  ) : isZeroStock ? (
                                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-red-100 text-red-700 font-bold border border-red-200 flex items-center gap-1">
                                      <span>🔴</span> Stock: 0 (Out of stock)
                                    </span>
                                  ) : isLowStock ? (
                                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-semibold border border-amber-200 flex items-center gap-1">
                                      <span>🟡</span> Stock: {stock} (Need {item.quantity})
                                    </span>
                                  ) : (
                                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-medium border border-emerald-200 flex items-center gap-1">
                                      <span>🟢</span> In stock: {stock}
                                    </span>
                                  )}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      ) : (
                        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
                          {order.firstItemName || "General Order"}
                          {order.itemCount > 1 && (
                            <span className="text-xs text-gray-400 ml-2">
                              (+{order.itemCount - 1} more items)
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Actions and Status dropdown */}
                    <div className="shrink-0 w-full lg:w-56 flex flex-col justify-between gap-3 border-t lg:border-t-0 lg:border-l border-gray-100 lg:pl-6 pt-4 lg:pt-0">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                            Order Status
                          </p>
                          {order.status === "CANCELLED" && (
                            <span className="text-[10px] bg-red-100 text-red-700 font-bold px-2 py-0.5 rounded">
                              Locked
                            </span>
                          )}
                          {order.status === "DELIVERED" && (
                            <span className="text-[10px] bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded">
                              Completed
                            </span>
                          )}
                        </div>

                        <div className="relative">
                          <select
                            value={order.status}
                            onChange={(e) =>
                              handleUpdateStatus(order.orderId, e.target.value)
                            }
                            disabled={
                              !canUpdate ||
                              updatingId === order.orderId ||
                              order.status === "CANCELLED" ||
                              order.status === "DELIVERED"
                            }
                            className={`
                              w-full appearance-none border rounded-xl px-4 py-2.5 text-sm font-semibold
                              focus:outline-none focus:ring-2 focus:ring-indigo-500 pr-9 transition shadow-sm
                              ${STATUS_STYLES[order.status] ?? "bg-gray-50 text-gray-700 border-gray-200"}
                              ${
                                !canUpdate ||
                                order.status === "CANCELLED" ||
                                order.status === "DELIVERED"
                                  ? "opacity-75 cursor-not-allowed"
                                  : "cursor-pointer"
                              }
                            `}
                          >
                            {allowedStatuses.map((s) => (
                              <option
                                key={s}
                                value={s}
                                className="bg-white text-gray-900 font-normal"
                              >
                                {STATUS_LABELS[s]}
                              </option>
                            ))}
                          </select>
                          {canUpdate &&
                            order.status !== "CANCELLED" &&
                            order.status !== "DELIVERED" && (
                              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                                <IconChevron className="w-4 h-4 text-current opacity-60" />
                              </span>
                            )}
                        </div>

                        {order.status === "CANCELLED" && (
                          <p className="text-[11px] text-red-500 mt-1.5 font-medium">
                            Cancelled orders cannot be reopened.
                          </p>
                        )}
                        {order.status === "PENDING" && hasStockIssue && (
                          <p className="text-[11px] text-amber-600 mt-1.5 font-medium">
                            Confirmation disabled (Stock is 0).
                          </p>
                        )}
                        {updatingId === order.orderId && (
                          <p className="text-xs text-indigo-600 mt-1.5 animate-pulse">
                            Updating status…
                          </p>
                        )}
                      </div>

                      {/* View Details Button */}
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-xl border border-gray-200 transition"
                      >
                        <IconEye className="w-4 h-4 text-gray-500" />
                        View Full Details
                      </button>
                    </div>
                  </div>

                  {/* Shipping address & email footer */}
                  {order.shippingAddress && (
                    <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-50 flex items-center justify-between text-xs text-gray-500 flex-wrap gap-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-gray-400">📍</span>
                        <span className="font-medium text-gray-700">Delivery Address:</span>
                        <span>
                          {[
                            order.shippingAddress.street,
                            order.shippingAddress.city,
                            order.shippingAddress.state,
                            order.shippingAddress.country,
                          ]
                            .filter(Boolean)
                            .join(", ") || "N/A"}
                        </span>
                      </div>

                      {customerEmail && (
                        <div className="flex items-center gap-1.5 bg-indigo-50/80 px-2.5 py-1 rounded-lg text-indigo-700">
                          <IconMail className="w-3.5 h-3.5 text-indigo-500" />
                          <span className="font-medium">User Email:</span>
                          <a
                            href={`mailto:${customerEmail}`}
                            className="font-mono font-semibold hover:underline"
                          >
                            {customerEmail}
                          </a>
                        </div>
                      )}

                      {order.notes && (
                        <div className="text-gray-500 italic">
                          📝 Notes: "{order.notes}"
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 mt-8">
              <button
                onClick={() => loadOrders(page - 1)}
                disabled={page === 0}
                className="px-4 py-2 text-sm border rounded-full bg-white disabled:opacity-40 hover:bg-gray-50 shadow-sm"
              >
                ← Prev
              </button>
              <span className="px-4 py-2 text-sm text-gray-600 font-medium">
                Page {page + 1} of {totalPages}
              </span>
              <button
                onClick={() => loadOrders(page + 1)}
                disabled={page >= totalPages - 1}
                className="px-4 py-2 text-sm border rounded-full bg-white disabled:opacity-40 hover:bg-gray-50 shadow-sm"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {/* Full Order Details Modal */}
      {selectedOrder && (() => {
        const selectedCustomerEmail = getCustomerEmail(selectedOrder);

        return (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden animate-fadeIn">
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/60">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-900">
                    Order Details
                  </span>
                  <span className="font-mono text-sm font-semibold bg-gray-200 text-gray-700 px-2 py-0.5 rounded">
                    #{selectedOrder.orderId}
                  </span>
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-bold border ${STATUS_STYLES[selectedOrder.status]}`}
                  >
                    {STATUS_LABELS[selectedOrder.status]}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition"
                >
                  <IconX className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto space-y-6">
                {/* Status Flow Indicator */}
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    Order Progression Flow
                  </p>
                  {selectedOrder.status === "CANCELLED" ? (
                    <div className="flex items-center gap-2 text-red-600 font-semibold text-sm bg-red-50 p-3 rounded-xl border border-red-200">
                      <span>🚫 Order is Cancelled and Locked</span>
                      <span className="text-xs text-red-400 font-normal">
                        (No further modifications allowed)
                      </span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      {STATUS_FLOW.map((s, idx) => {
                        const currentIdx = STATUS_FLOW.indexOf(selectedOrder.status);
                        const isDone = currentIdx >= idx;
                        const isCurrent = selectedOrder.status === s;

                        return (
                          <div
                            key={s}
                            className={`py-2 px-1 rounded-xl font-semibold border transition ${
                              isCurrent
                                ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                : isDone
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : "bg-white text-gray-400 border-gray-200"
                            }`}
                          >
                            {STATUS_LABELS[s]}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Stock Warning inside Modal */}
                {selectedOrder.status === "PENDING" && getOrderStockIssues(selectedOrder).length > 0 && (
                  <div className="bg-red-50 border border-red-200 p-4 rounded-2xl text-xs text-red-800 space-y-1">
                    <p className="font-bold text-sm text-red-900 flex items-center gap-1.5">
                      <span>⚠️</span> Cannot Confirm Order (Zero or Insufficient Stock)
                    </p>
                    <p className="text-red-700">
                      One or more items in this order are out of stock. You cannot confirm this order until stock is replenished.
                    </p>
                    <ul className="list-disc list-inside mt-2 space-y-0.5 font-medium">
                      {getOrderStockIssues(selectedOrder).map((issue, idx) => (
                        <li key={idx}>
                          {issue.item.productName} ({issue.item.variantLabel || issue.item.size || "Standard"}): {issue.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Customer & Shipping */}
                  <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-100 text-xs space-y-2.5">
                    <p className="font-bold text-gray-500 uppercase tracking-wide text-[11px] mb-2">
                      Customer & Contact Details
                    </p>
                    <div>
                      <span className="text-gray-400">Recipient Name:</span>{" "}
                      <strong className="text-gray-900 text-sm">
                        {selectedOrder.shippingAddress?.recipientName ||
                          selectedOrder.customerName ||
                          "N/A"}
                      </strong>
                    </div>

                    {/* Customer Email Box with Copy Action */}
                    <div className="bg-white p-2.5 rounded-xl border border-gray-200 flex items-center justify-between gap-2 shadow-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <IconMail className="w-4 h-4 text-indigo-600 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-[10px] text-gray-400 uppercase font-semibold">Customer Account Email</p>
                          <a
                            href={`mailto:${selectedCustomerEmail}`}
                            className="text-xs font-mono font-bold text-indigo-700 hover:underline truncate block"
                          >
                            {selectedCustomerEmail || "Email not found"}
                          </a>
                        </div>
                      </div>
                      {selectedCustomerEmail && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(selectedCustomerEmail);
                            toast.info("Customer email copied to clipboard!");
                          }}
                          className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] rounded font-semibold transition shrink-0"
                        >
                          Copy
                        </button>
                      )}
                    </div>

                    <div>
                      <span className="text-gray-400">Phone:</span>{" "}
                      <strong className="text-gray-900 font-mono">
                        {selectedOrder.shippingAddress?.phone || "N/A"}
                      </strong>
                    </div>
                    <div>
                      <span className="text-gray-400">Address:</span>{" "}
                      <span className="text-gray-800">
                        {[
                          selectedOrder.shippingAddress?.street,
                          selectedOrder.shippingAddress?.city,
                          selectedOrder.shippingAddress?.state,
                          selectedOrder.shippingAddress?.zipCode,
                          selectedOrder.shippingAddress?.country,
                        ]
                          .filter(Boolean)
                          .join(", ") || "N/A"}
                      </span>
                    </div>
                    {selectedOrder.notes && (
                      <div className="pt-2 border-t border-gray-200/60 text-gray-600 italic">
                        Special Notes: "{selectedOrder.notes}"
                      </div>
                    )}
                  </div>

                  {/* Payment & Timestamps */}
                  <div className="bg-gray-50/70 p-4 rounded-2xl border border-gray-100 text-xs space-y-2">
                    <p className="font-bold text-gray-500 uppercase tracking-wide text-[11px] mb-2">
                      Payment & Timestamps
                    </p>
                    <div>
                      <span className="text-gray-400">Payment Method:</span>{" "}
                      <strong className="text-gray-900">
                        {selectedOrder.paymentMethod === "CASH_ON_DELIVERY"
                          ? "Cash On Delivery"
                          : selectedOrder.paymentMethod || "N/A"}
                      </strong>
                    </div>
                    {selectedOrder.paymentStatus && (
                      <div>
                        <span className="text-gray-400">Payment Status:</span>{" "}
                        <span className="font-semibold text-gray-800">
                          {selectedOrder.paymentStatus}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-400">Placed Date:</span>{" "}
                      <span className="text-gray-800">
                        {selectedOrder.placedAt
                          ? new Date(selectedOrder.placedAt).toLocaleString()
                          : "N/A"}
                      </span>
                    </div>
                    {selectedOrder.updatedAt && (
                      <div>
                        <span className="text-gray-400">Last Updated:</span>{" "}
                        <span className="text-gray-800">
                          {new Date(selectedOrder.updatedAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Items Breakdown Table */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">
                    Ordered Products Breakdown
                  </p>
                  <div className="border border-gray-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold uppercase">
                        <tr>
                          <th className="py-3 px-4">Product</th>
                          <th className="py-3 px-3">Size</th>
                          <th className="py-3 px-3">Live Stock</th>
                          <th className="py-3 px-3">Unit Price</th>
                          <th className="py-3 px-3">Qty</th>
                          <th className="py-3 px-4 text-right">Line Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(selectedOrder.items || []).map((item, idx) => {
                          const stock = getItemStock(item);
                          const isZeroStock = stock !== null && stock <= 0;
                          const isLow = stock !== null && stock > 0 && stock < item.quantity;
                          const variantText = item.variantLabel || item.size || "Standard";

                          return (
                            <tr key={idx} className="hover:bg-gray-50/50">
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-lg bg-gray-100 shrink-0 overflow-hidden border border-gray-200">
                                    {item.imageUrl ? (
                                      <img
                                        src={item.imageUrl}
                                        alt={item.productName}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          e.target.src =
                                            "https://placehold.co/36x36/e5e7eb/9ca3af?text=?";
                                        }}
                                      />
                                    ) : (
                                      <span className="text-xs flex items-center justify-center h-full">
                                        👕
                                      </span>
                                    )}
                                  </div>
                                  <span className="font-semibold text-gray-900">
                                    {item.productName}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-3 font-medium text-gray-700">
                                {variantText}
                              </td>
                              <td className="py-3 px-3">
                                {stock === null ? (
                                  <span className="text-gray-400">N/A</span>
                                ) : isZeroStock ? (
                                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">
                                    0 (Out of stock)
                                  </span>
                                ) : isLow ? (
                                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
                                    {stock} (Short)
                                  </span>
                                ) : (
                                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                                    {stock}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-gray-700">
                                ${Number(item.unitPrice || 0).toFixed(2)}
                              </td>
                              <td className="py-3 px-3 font-bold text-gray-900">
                                {item.quantity}
                              </td>
                              <td className="py-3 px-4 text-right font-bold text-gray-900">
                                ${Number(item.lineTotal || (item.unitPrice * item.quantity) || 0).toFixed(2)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Financial Totals */}
                <div className="bg-gray-50/80 p-4 rounded-2xl border border-gray-100 flex flex-col items-end text-xs space-y-1.5">
                  <div className="flex justify-between w-48 text-gray-500">
                    <span>Subtotal:</span>
                    <span className="font-medium text-gray-800">
                      ${Number(selectedOrder.subtotal || 0).toFixed(2)}
                    </span>
                  </div>
                  {Number(selectedOrder.shippingFee || 0) > 0 && (
                    <div className="flex justify-between w-48 text-gray-500">
                      <span>Shipping Fee:</span>
                      <span className="font-medium text-gray-800">
                        ${Number(selectedOrder.shippingFee || 0).toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between w-48 text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
                    <span>Total Amount:</span>
                    <span className="text-indigo-600">
                      ${Number(selectedOrder.totalAmount || selectedOrder.total || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Modal Footer with Status Update Controller */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-gray-500">
                  {selectedOrder.status === "CANCELLED" ? (
                    <span className="text-red-500 font-semibold">
                      🔒 Order status is locked and cannot be updated.
                    </span>
                  ) : selectedOrder.status === "DELIVERED" ? (
                    <span className="text-emerald-600 font-semibold">
                      ✓ Order has been completed and delivered.
                    </span>
                  ) : (
                    <span>Change order status to proceed forward or cancel:</span>
                  )}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {canUpdate &&
                    selectedOrder.status !== "CANCELLED" &&
                    selectedOrder.status !== "DELIVERED" && (
                      <select
                        value={selectedOrder.status}
                        onChange={(e) =>
                          handleUpdateStatus(selectedOrder.orderId, e.target.value)
                        }
                        disabled={updatingId === selectedOrder.orderId}
                        className="border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                      >
                        {(canCancelOnly
                          ? getAllowedStatuses(
                              selectedOrder.status,
                              getOrderStockIssues(selectedOrder).length > 0,
                            ).filter((s) => s === selectedOrder.status || s === "CANCELLED")
                          : getAllowedStatuses(
                              selectedOrder.status,
                              getOrderStockIssues(selectedOrder).length > 0,
                            )
                        ).map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    )}
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold text-xs rounded-xl transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
