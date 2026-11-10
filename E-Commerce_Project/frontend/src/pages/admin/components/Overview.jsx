import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../../../context/ShopContext";
import { useAuth } from "../../../context/AuthContext";
import { IconPackage, IconOrders, IconRevenue } from "./Icons";
import { adminOrderApi } from "../../../services/orderService";

// eslint-disable-next-line no-unused-vars
function MetricCard({ icon: Icon, label, value, color, bg }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition-shadow duration-200">
      <div
        className={`w-14 h-14 ${bg} rounded-2xl flex items-center justify-center shrink-0`}
      >
        <Icon className={`w-7 h-7 ${color}`} />
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-3xl font-bold text-gray-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}
// eslint-disable-next-line no-unused-vars
function LockedMetricCard({ icon: Icon, label, color, bg }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex items-center gap-5 opacity-50">
      <div
        className={`w-14 h-14 ${bg} rounded-2xl flex items-center justify-center shrink-0`}
      >
        <Icon className={`w-7 h-7 ${color}`} />
      </div>
      <div>
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-sm text-gray-400 mt-1 italic">No permission</p>
      </div>
    </div>
  );
}

export default function Overview() {
  const {
    products,
    productsLoading,
    hasProductPermission,
    hasOrderPermission,
    PRODUCT_PERMISSIONS,
    ORDER_PERMISSIONS,
  } = useContext(ShopContext);

  const { auth, isAdmin } = useAuth();

  const showProducts =
    isAdmin() || hasProductPermission(...PRODUCT_PERMISSIONS);
  const showOrders = isAdmin() || hasOrderPermission(...ORDER_PERMISSIONS);

  // ── Fetch real stats from /admin/orders/stats ─────────────────────────────
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  useEffect(() => {
    if (!showOrders) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatsLoading(true);
    adminOrderApi
      .getStats()
      .then((data) => setStats(data))
      .catch((err) => {
        console.error("Could not load stats:", err);
        setStats(null);
      })
      .finally(() => setStatsLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const totalOrders = stats?.totalOrders ?? stats?.total ?? "–";
  const totalRevenue = stats?.totalRevenue ?? stats?.revenue ?? null;

  const allMetrics = [
    {
      key: "products",
      icon: IconPackage,
      label: "Total Products",
      value: productsLoading ? "…" : products.length,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      permitted: showProducts,
    },
    {
      key: "orders",
      icon: IconOrders,
      label: "Total Orders",
      value: statsLoading ? "…" : totalOrders,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      permitted: showOrders,
    },
    {
      key: "revenue",
      icon: IconRevenue,
      label: "Total Revenue",
      value: statsLoading
        ? "…"
        : totalRevenue !== null
          ? `$${Number(totalRevenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
          : "–",
      color: "text-amber-600",
      bg: "bg-amber-50",
      permitted: showOrders,
    },
  ];

  const quickActions = [
    showProducts && "→ Products: Add, edit, or delete items",
    showOrders && "→ Orders: View & update order statuses",
    isAdmin() && "→ Employees: Manage team members & permissions",
  ].filter(Boolean);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500 text-sm mt-1">
          Welcome back, {auth?.user?.name || "User"} — here&apos;s what&apos;s
          happening today.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
        {allMetrics.map(({ key, ...m }) =>
          m.permitted ? (
            <MetricCard key={key} {...m} />
          ) : (
            <LockedMetricCard key={key} {...m} />
          ),
        )}
      </div>

      {/* Additional stats from backend */}
      {stats && showOrders && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
          {[
            {
              label: "Pending",
              value: stats.pendingOrders ?? stats.pending ?? "–",
              color: "text-blue-600",
            },
            {
              label: "Delivered",
              value: stats.deliveredOrders ?? stats.delivered ?? "–",
              color: "text-green-600",
            },
            {
              label: "Cancelled",
              value: stats.cancelledOrders ?? stats.cancelled ?? "–",
              color: "text-red-500",
            },
            {
              label: "Avg. Order",
              value: stats.averageOrderValue
                ? `$${Number(stats.averageOrderValue).toFixed(0)}`
                : "–",
              color: "text-amber-600",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm text-center"
            >
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-linear-to-r from-indigo-600 to-indigo-800 rounded-2xl p-6 text-white shadow-lg">
        <h2 className="font-bold text-lg mb-1">Quick Actions</h2>
        <p className="text-indigo-200 text-sm mb-4">
          Use the sidebar to manage your store.
        </p>
        {quickActions.length > 0 ? (
          <div className="flex flex-wrap gap-3 text-sm">
            {quickActions.map((t) => (
              <span
                key={t}
                className="bg-white/10 rounded-lg px-3 py-1.5 border border-white/20"
              >
                {t}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-indigo-300 text-sm italic">
            You currently have view-only access. Contact your admin to request
            additional permissions.
          </p>
        )}
      </div>
    </div>
  );
}
