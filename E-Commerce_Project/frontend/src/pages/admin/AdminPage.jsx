import React, { useState } from "react";
import AdminSidebar from "./components/AdminSidebar";
import Overview from "./components/Overview";
import ProductList from "./components/ProductList";
import CategoryList from "./components/CategoryList";
import OrderList from "./components/OrderList";
import EmployeeList from "./components/EmployeeList";
import EmployeeForm from "./components/EmployeeForm";
import { IconMenu } from "./components/Icons";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [empView, setEmpView] = useState("list");

  const handleSetTab = (tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
    if (tab === "employees") setEmpView("list");
  };

  const renderContent = () => {
    switch (activeTab) {
      case "overview":
        return <Overview />;
      case "products":
        return <ProductList />;
      case "categories":
        return <CategoryList />;
      case "orders":
        return <OrderList />;
      case "employees":
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
        return <Overview />;
    }
  };

  const MOBILE_TABS = [
    { id: "overview", label: "Home" },
    { id: "products", label: "Products" },
    { id: "categories", label: "Categories" },
    { id: "orders", label: "Orders" },
    { id: "employees", label: "Employees" },
  ];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 sm:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <AdminSidebar
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
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-black">J</span>
            </div>
            <span className="font-bold text-gray-800 text-sm">Admin Panel</span>
          </div>
          <div className="ml-auto flex gap-1 overflow-x-auto">
            {MOBILE_TABS.map(({ id, label }) => (
              <button
                key={id}
                onClick={() => handleSetTab(id)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition whitespace-nowrap ${
                  activeTab === id
                    ? "bg-indigo-600 text-white"
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
