import React, { useContext } from "react";
import {
  IconDashboard,
  IconPackage,
  IconOrders,
  IconUsers,
  IconLogout,
  IconX,
  IconTag,
} from "../../admin/components/Icons";
import { useAuth } from "../../../context/AuthContext";
import { ShopContext } from "../../../context/ShopContext";
import { useNavigate } from "react-router-dom";

export default function EmployeeSidebar({
  activeTab,
  setActiveTab,
  isOpen,
  onClose,
}) {
  const { auth, logout, hasPermission, hasAnyPermission } = useAuth();
  const { PRODUCT_PERMISSIONS, ORDER_PERMISSIONS } = useContext(ShopContext);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const displayName = auth?.user?.name || "Employee";
  const displayEmail = auth?.user?.email || "";
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0] || "")
    .join("")
    .toUpperCase();

  // ── Derive sidebar tabs from permissions ──────────────────────────────────
  const canViewDashboard = hasPermission("admin:dashboard");
  const canViewProducts  = hasAnyPermission(...PRODUCT_PERMISSIONS);
  const canViewCategories = hasAnyPermission("category:read", "category:create", "category:update", "category:delete");
  const canViewOrders    = hasAnyPermission(...ORDER_PERMISSIONS);
  const canViewEmployees = hasAnyPermission("employee:read", "employee:create", "employee:update", "employee:delete");

  const NAV = [
    { id: "overview",   label: "Dashboard",  Icon: IconDashboard, show: canViewDashboard },
    { id: "products",   label: "Products",   Icon: IconPackage,   show: canViewProducts },
    { id: "categories", label: "Categories", Icon: IconTag,       show: canViewCategories },
    { id: "orders",     label: "Orders",     Icon: IconOrders,    show: canViewOrders },
    { id: "employees",  label: "Employees",  Icon: IconUsers,     show: canViewEmployees },
  ].filter((item) => item.show);

  return (
    <>
      <aside
        className={`
          fixed inset-y-0 left-0 z-30 w-64 flex flex-col bg-slate-900 text-white
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          sm:relative sm:translate-x-0 sm:flex
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="font-black text-lg">E</span>
            </div>
            <div>
              <p className="font-bold text-sm leading-tight">JeansForJeans</p>
              <p className="text-xs text-slate-400">Employee Panel</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="sm:hidden text-slate-400 hover:text-white"
          >
            <IconX className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest px-2 mb-4">
            Menu
          </p>
          {NAV.map(({ id, label, Icon }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                  transition-all duration-200
                  ${
                    active
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-900/40"
                      : "text-slate-400 hover:text-white hover:bg-slate-800"
                  }
                `}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{label}</span>
                {active && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </button>
            );
          })}
        </nav>

        {/* User + logout */}
        <div className="px-4 pb-6 border-t border-slate-700 pt-4">
          <div className="flex items-center gap-3 px-3 py-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {displayName}
              </p>
              <p className="text-xs text-slate-400 truncate">{displayEmail}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-950/40 transition-all duration-200"
          >
            <IconLogout className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
