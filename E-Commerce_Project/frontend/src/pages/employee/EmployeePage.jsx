import React, { useState, useContext, useEffect } from "react";
import EmployeeSidebar from "./components/EmployeeSidebar";
import Overview from "../admin/components/Overview";
import ProductList from "../admin/components/ProductList";
import CategoryList from "../admin/components/CategoryList";
import OrderList from "../admin/components/OrderList";
import EmployeeList from "../admin/components/EmployeeList";
import EmployeeForm from "../admin/components/EmployeeForm";
import { IconMenu } from "../admin/components/Icons";
import { useAuth } from "../../context/AuthContext";
import { ShopContext } from "../../context/ShopContext";

export default function EmployeePage() {
  const { hasPermission, hasAnyPermission, syncSession } = useAuth();
  const { refreshProducts, PRODUCT_PERMISSIONS, ORDER_PERMISSIONS } =
    useContext(ShopContext);

  // ── Permission flags ──────────────────────────────────────────────────────
  const canViewDashboard = hasPermission("admin:dashboard");
  const canViewProducts  = hasAnyPermission(...PRODUCT_PERMISSIONS);
  const canViewCategories = hasAnyPermission("category:read", "category:create", "category:update", "category:delete");
  const canViewOrders    = hasAnyPermission(...ORDER_PERMISSIONS);
  const canViewEmployees = hasAnyPermission("employee:read", "employee:create", "employee:update", "employee:delete");

  const getInitialTab = () => {
    if (canViewDashboard) return "overview";
    if (canViewProducts) return "products";
    if (canViewCategories) return "categories";
    if (canViewOrders) return "orders";
    if (canViewEmployees) return "employees";
    return "";
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [empView, setEmpView] = useState("list");

  // Keep active tab valid if permissions change
  useEffect(() => {
    const isCurrentValid =
      (activeTab === "overview" && canViewDashboard) ||
      (activeTab === "products" && canViewProducts) ||
      (activeTab === "categories" && canViewCategories) ||
      (activeTab === "orders" && canViewOrders) ||
      (activeTab === "employees" && canViewEmployees);

    if (!isCurrentValid) {
      const nextTab = canViewDashboard
        ? "overview"
        : canViewProducts
        ? "products"
        : canViewCategories
        ? "categories"
        : canViewOrders
        ? "orders"
        : canViewEmployees
        ? "employees"
        : "";
      if (nextTab && nextTab !== activeTab) {
        setActiveTab(nextTab);
      }
    }
  }, [activeTab, canViewDashboard, canViewProducts, canViewCategories, canViewOrders, canViewEmployees]);

  // ── Refresh data on tab switch ────────────────────────────────────────────
  // When the employee opens a tab, pull fresh data from the database
  // if they have the required permission for that resource.
  useEffect(() => {
    if (activeTab === "products" && canViewProducts) {
      refreshProducts();
    }
  }, [activeTab, canViewProducts, refreshProducts]);

  const handleSetTab = (tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
    if (tab === "employees") setEmpView("list");
  };

  // ── Content renderer ──────────────────────────────────────────────────────
  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return canViewDashboard ? (
          <Overview />
        ) : (
          <div className="p-8 text-center text-gray-500">
            You do not have permission to view the dashboard.
          </div>
        );

      case "products":
        return canViewProducts ? (
          <ProductList />
        ) : (
          <div className="p-8 text-center text-gray-500">
            You do not have permission to view products.
          </div>
        );

      case "categories":
        return canViewCategories ? (
          <CategoryList />
        ) : (
          <div className="p-8 text-center text-gray-500">
            You do not have permission to view categories.
          </div>
        );

      case "orders":
        return canViewOrders ? (
          <OrderList />
        ) : (
          <div className="p-8 text-center text-gray-500">
            You do not have permission to view orders.
          </div>
        );

      case "employees":
        if (!canViewEmployees) {
          return (
            <div className="p-8 text-center text-gray-500">
              You do not have permission to view employees.
            </div>
          );
        }
        if (empView === "add") {
          return (
            <EmployeeForm
              onDone={() => setEmpView("list")}
              onCancel={() => setEmpView("list")}
            />
          );
        }
        if (empView && typeof empView === "object") {
          return (
            <EmployeeForm
              employee={empView}
              onDone={() => setEmpView("list")}
              onCancel={() => setEmpView("list")}
            />
          );
        }
        return (
          <EmployeeList
            onAddNew={() => setEmpView("add")}
            onEdit={(emp) => setEmpView(emp)}
          />
        );

      default:
        return (
          <div className="p-8 text-center text-gray-500">
            You do not have access to any section. Please contact your administrator.
          </div>
        );
    }
  };

  // ── Mobile tab list (only show tabs the employee has access to) ───────────
  const MOBILE_TABS = [
    { id: "overview",   label: "Dashboard",  show: canViewDashboard },
    { id: "products",   label: "Products",   show: canViewProducts },
    { id: "categories", label: "Categories", show: canViewCategories },
    { id: "orders",     label: "Orders",     show: canViewOrders },
    { id: "employees",  label: "Employees",  show: canViewEmployees },
  ].filter((tab) => tab.show);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 sm:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <EmployeeSidebar
        activeTab={activeTab}
        setActiveTab={handleSetTab}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top-bar */}
        <header className="sm:hidden flex items-center gap-3 bg-white border-b border-gray-200 px-4 py-3 shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
          >
            <IconMenu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-emerald-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-black">E</span>
            </div>
            <span className="font-bold text-gray-800 text-sm">
              Employee Panel
            </span>
          </div>
          <div className="ml-auto flex gap-1 overflow-x-auto">
            {MOBILE_TABS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => handleSetTab(id)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition whitespace-nowrap ${
                  activeTab === id
                    ? "bg-emerald-600 text-white"
                    : "text-gray-500 hover:bg-gray-100"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
