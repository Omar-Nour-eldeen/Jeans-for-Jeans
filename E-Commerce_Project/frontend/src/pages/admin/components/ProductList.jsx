import React, { useContext, useState, useEffect, useMemo } from "react";
import { ShopContext } from "../../../context/ShopContext";
import { useAuth } from "../../../context/AuthContext";
import { toast } from "react-toastify";
import ProductForm from "./ProductForm";
import { adminProductApi, categoryApi } from "../../../services/productService";
import { IconPlus, IconEdit, IconTrash, IconSearch } from "./Icons";

export default function ProductList() {
  const { products, productsLoading, productsError, refreshProducts } = useContext(ShopContext);
  const { isAdmin, hasPermission, isLoggedIn, syncSession } = useAuth();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    categoryApi
      .getAll()
      .then((res) => {
        const list = res?.data?.data || res?.data || [];
        if (Array.isArray(list)) setCategories(list);
      })
      .catch(() => {});
  }, []);

  const categoryMap = useMemo(() => {
    return Object.fromEntries(categories.map((c) => [c.id, c]));
  }, [categories]);

  const getProductCategoryDisplay = (p) => {
    if (p.categoryParent && p.category) {
      return { main: p.categoryParent, sub: p.category };
    }
    const cat = categoryMap[p.categoryId];
    if (!cat) return { main: p.categoryParent || p.category || "—", sub: null };
    if (cat.parentId) {
      const parent = categoryMap[cat.parentId];
      return { main: parent?.name || "Main", sub: cat.name };
    }
    return { main: cat.name, sub: null };
  };

  // Always fetch fresh on mount (covers Employee opening the tab post-login)
  useEffect(() => {
    if (isLoggedIn()) {
      refreshProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canCreate = isAdmin() || hasPermission("product:create");
  const canUpdate = isAdmin() || hasPermission("product:update");
  const canDelete = isAdmin() || hasPermission("product:delete");

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const filtered = products.filter((p) =>
    (p.name || "").toLowerCase().includes(search.toLowerCase()),
  );

  const handleDelete = async (product) => {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      setDeletingId(product.id);
      await adminProductApi.delete(product.id);
      toast.success(`"${product.name}" deleted.`);
      await refreshProducts();
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (err?.response?.status === 403
          ? "You don't have permission to delete products."
          : "Failed to delete product.");
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSave = async () => {
    setShowForm(false);
    setEditing(null);
    await refreshProducts();
  };

  const openAdd = () => { setEditing(null); setShowForm(true); };
  const openEdit = (p) => { setEditing(p); setShowForm(true); };
  const closeForm = () => { setShowForm(false); setEditing(null); };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Products</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {productsLoading ? "Loading…" : `${products.length} products in catalogue`}
          </p>
        </div>
        {canCreate && (
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition"
          >
            <IconPlus className="w-4 h-4" />
            Add Product
          </button>
        )}
      </div>

      <div className="relative mb-5">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
          <IconSearch className="w-4 h-4" />
        </span>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products by name…"
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-lg leading-none"
          >×</button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-4 py-3 font-semibold text-gray-600 w-16">Image</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Name</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Price</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Sizes</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden sm:table-cell">Status</th>
                <th className="text-right px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {productsLoading ? (
                <tr><td colSpan={7} className="text-center py-16 text-gray-400">Loading products…</td></tr>
              ) : productsError ? (
                <tr>
                  <td colSpan={7} className="text-center py-12">
                    <p className="text-red-600 text-sm font-medium mb-3">{productsError}</p>
                    <button
                      onClick={async () => {
                        await syncSession?.();
                        await refreshProducts();
                      }}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-semibold"
                    >Retry</button>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-gray-400">
                    {search ? `No products matching "${search}"` : "No products yet."}
                  </td>
                </tr>
              ) : (
                filtered.map((p) => {
                  const img = Array.isArray(p.images) ? p.images[0] : null;
                  const sizes = Array.isArray(p.variants)
                    ? p.variants.map((v) => v.size).filter(Boolean)
                    : [];
                  return (
                    <tr key={p.id} className="hover:bg-gray-50/70 transition-colors duration-100">
                      <td className="px-4 py-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                          {img ? (
                            <img
                              src={img}
                              alt={p.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = "https://placehold.co/48x48/e5e7eb/9ca3af?text=?";
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">N/A</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 line-clamp-1">{p.name}</p>
                        {(() => {
                          const catInfo = getProductCategoryDisplay(p);
                          return (
                            <p className="text-xs text-gray-400 md:hidden mt-0.5">
                              {catInfo.main}{catInfo.sub ? ` · ${catInfo.sub}` : ""}
                            </p>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {(() => {
                          const catInfo = getProductCategoryDisplay(p);
                          return (
                            <span className="inline-flex flex-col gap-0.5">
                              <span className="text-gray-800 font-medium">{catInfo.main}</span>
                              {catInfo.sub && (
                                <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  {catInfo.sub}
                                </span>
                              )}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">${p.price}</td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {sizes.map((s) => (
                            <span key={s} className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-md">{s}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          p.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-gray-100 text-gray-500"
                        }`}>{p.status || "—"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          {canUpdate && (
                            <button
                              onClick={() => openEdit(p)}
                              className="flex items-center gap-1.5 text-indigo-600 hover:bg-indigo-50 px-2.5 py-1.5 rounded-lg text-xs font-medium transition"
                            >
                              <IconEdit className="w-3.5 h-3.5" /> Edit
                            </button>
                          )}
                          {canDelete && (
                            <button
                              disabled={deletingId === p.id}
                              onClick={() => handleDelete(p)}
                              className="flex items-center gap-1.5 text-red-500 hover:bg-red-50 px-2.5 py-1.5 rounded-lg text-xs font-medium transition disabled:opacity-50"
                            >
                              <IconTrash className="w-3.5 h-3.5" />
                              {deletingId === p.id ? "Deleting…" : "Delete"}
                            </button>
                          )}
                          {!canUpdate && !canDelete && (
                            <span className="text-xs text-gray-400">View Only</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <ProductForm
          initial={editing}
          onSave={handleSave}
          onCancel={closeForm}
        />
      )}
    </div>
  );
}
