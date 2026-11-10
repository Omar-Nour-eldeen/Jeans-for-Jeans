import React, { useState, useEffect, useCallback, useContext } from "react";
import { categoryApi, adminCategoryApi } from "../../../services/productService";
import { useAuth } from "../../../context/AuthContext";
import { ShopContext } from "../../../context/ShopContext";
import { toast } from "react-toastify";
import { IconPlus, IconEdit, IconTrash, IconSearch, IconTag } from "./Icons";

export default function CategoryList() {
  const { isAdmin, hasPermission } = useAuth();
  const { products, refreshProducts } = useContext(ShopContext);

  const canCreate = isAdmin() || hasPermission("category:create");
  const canUpdate = isAdmin() || hasPermission("category:update");
  const canDelete = isAdmin() || hasPermission("category:delete");

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [viewFilter, setViewFilter] = useState("all"); // 'all', 'main', 'sub'

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryType, setCategoryType] = useState("main"); // 'main' or 'sub'
  const [formName, setFormName] = useState("");
  const [formParentId, setFormParentId] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Delete modal
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      const res = await categoryApi.getAll();
      const raw = res?.data?.data || res?.data || [];
      setCategories(Array.isArray(raw) ? raw : []);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
    refreshProducts?.();
  }, [loadCategories, refreshProducts]);

  // Main categories (parentId is null)
  const mainCategories = categories.filter((c) => !c.parentId);

  // Group subcategories by parentId
  const subCategoriesByParent = categories.reduce((acc, cat) => {
    if (cat.parentId) {
      if (!acc[cat.parentId]) acc[cat.parentId] = [];
      acc[cat.parentId].push(cat);
    }
    return acc;
  }, {});

  // All subcategories list
  const allSubcategories = categories.filter((c) => c.parentId);

  // Map of category ID to linked products count
  const getLinkedProducts = useCallback(
    (cat) => {
      if (!cat || !products) return [];
      const childIds = categories.filter((c) => c.parentId === cat.id).map((c) => c.id);
      const targetIds = new Set([cat.id, ...childIds]);
      return products.filter((p) => targetIds.has(p.categoryId));
    },
    [categories, products],
  );

  const openAdd = () => {
    setEditingCategory(null);
    setCategoryType("main");
    setFormName("");
    setFormParentId("");
    setFormError("");
    setShowModal(true);
  };

  const openAddSubcategory = (parentId) => {
    setEditingCategory(null);
    setCategoryType("sub");
    setFormName("");
    setFormParentId(String(parentId));
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (cat) => {
    setEditingCategory(cat);
    setCategoryType(cat.parentId ? "sub" : "main");
    setFormName(cat.name || "");
    setFormParentId(cat.parentId ? String(cat.parentId) : "");
    setFormError("");
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formName.trim() || formName.trim().length < 3) {
      setFormError("Category name must be at least 3 characters");
      return;
    }
    if (formName.trim().length > 50) {
      setFormError("Category name cannot exceed 50 characters");
      return;
    }
    if (categoryType === "sub" && !formParentId) {
      setFormError("Please select a parent category for this subcategory");
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      const payload = {
        name: formName.trim(),
        parentId: categoryType === "sub" && formParentId ? Number(formParentId) : null,
      };

      if (editingCategory) {
        await adminCategoryApi.update(editingCategory.id, payload);
        toast.success(`Category "${payload.name}" updated successfully`);
      } else {
        await adminCategoryApi.create(payload);
        toast.success(
          categoryType === "sub"
            ? `Subcategory "${payload.name}" created successfully`
            : `Main Category "${payload.name}" created successfully`,
        );
      }
      setShowModal(false);
      loadCategories();
    } catch (err) {
      const msg =
        err?.response?.data?.errors?.[0]?.message ||
        err?.response?.data?.message ||
        "Failed to save category";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const openDeleteModal = (cat) => {
    setToDelete(cat);
    setDeleteError("");
  };

  const handleDelete = async () => {
    if (!toDelete) return;

    // Client-side verification
    const linked = getLinkedProducts(toDelete);
    if (linked.length > 0) {
      setDeleteError(
        `Cannot delete: Category "${toDelete.name}" is linked to ${linked.length} product(s). Please delete or reassign those products first.`,
      );
      return;
    }

    setDeleting(true);
    setDeleteError("");
    try {
      await adminCategoryApi.delete(toDelete.id);
      toast.success(`Category "${toDelete.name}" deleted successfully.`);
      setToDelete(null);
      loadCategories();
    } catch (err) {
      const backendMsg =
        err?.response?.data?.errors?.[0]?.message ||
        err?.response?.data?.message ||
        "Failed to delete category";

      const isConflict =
        err?.response?.status === 409 ||
        backendMsg.toLowerCase().includes("product") ||
        backendMsg.toLowerCase().includes("conflict");

      const userFriendlyMsg = isConflict
        ? `Cannot delete "${toDelete.name}": Category contains existing products. Delete or move the products first.`
        : backendMsg;

      setDeleteError(userFriendlyMsg);
      toast.error(userFriendlyMsg);
    } finally {
      setDeleting(false);
    }
  };

  // Filter categories
  const filteredMain = mainCategories.filter((cat) => {
    const matchMain = cat.name.toLowerCase().includes(search.toLowerCase());
    const subs = subCategoriesByParent[cat.id] || [];
    const matchSub = subs.some((s) => s.name.toLowerCase().includes(search.toLowerCase()));
    return matchMain || matchSub;
  });

  const filteredSubs = allSubcategories.filter((cat) => {
    const parent = categories.find((c) => c.id === cat.parentId);
    const matchName = cat.name.toLowerCase().includes(search.toLowerCase());
    const matchParent = parent?.name.toLowerCase().includes(search.toLowerCase());
    return matchName || matchParent;
  });

  return (
    <div>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories & Subcategories</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {mainCategories.length} Main Categories · {allSubcategories.length} Subcategories
          </p>
        </div>
        {canCreate && (
          <div className="flex items-center gap-2">
            <button
              onClick={openAdd}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-sm transition"
            >
              <IconPlus className="w-4 h-4" />
              Create Category
            </button>
          </div>
        )}
      </div>

      {/* View Filter Tabs + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setViewFilter("all")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewFilter === "all" ? "bg-white text-indigo-600 shadow-xs" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            All (Tree View)
          </button>
          <button
            onClick={() => setViewFilter("main")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewFilter === "main" ? "bg-white text-indigo-600 shadow-xs" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Main Categories ({mainCategories.length})
          </button>
          <button
            onClick={() => setViewFilter("sub")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewFilter === "sub" ? "bg-white text-emerald-600 shadow-xs" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Subcategories ({allSubcategories.length})
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
            <IconSearch className="w-4 h-4" />
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories & subcategories…"
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-base leading-none"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-400 border border-gray-100 shadow-sm animate-pulse">
          Loading categories…
        </div>
      )}

      {/* Empty state */}
      {!loading && categories.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center border border-dashed border-gray-200">
          <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <IconTag className="w-6 h-6" />
          </div>
          <p className="font-semibold text-gray-800 mb-1">No categories found</p>
          <p className="text-sm text-gray-500 mb-4">Create your first main category or subcategory to get started.</p>
          {canCreate && (
            <button
              onClick={openAdd}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-xl hover:bg-indigo-700 transition"
            >
              Create Category
            </button>
          )}
        </div>
      )}

      {/* VIEW 1: Tree View (Default) */}
      {!loading && viewFilter === "all" && filteredMain.length > 0 && (
        <div className="space-y-4">
          {filteredMain.map((parent) => {
            const subs = subCategoriesByParent[parent.id] || [];
            const linkedProductsCount = getLinkedProducts(parent).length;

            return (
              <div
                key={parent.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden transition hover:shadow-md"
              >
                {/* Main Category Header */}
                <div className="flex items-center justify-between px-5 py-4 bg-slate-50 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                      {parent.name.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-gray-900 text-base">{parent.name}</span>
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold tracking-wide uppercase">
                          Main Category
                        </span>
                        {linkedProductsCount > 0 && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-200 text-gray-700 font-medium">
                            {linkedProductsCount} product{linkedProductsCount !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {subs.length} Subcategor{subs.length !== 1 ? "ies" : "y"} attached
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {canCreate && (
                      <button
                        onClick={() => openAddSubcategory(parent.id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
                      >
                        <IconPlus className="w-3.5 h-3.5" />
                        Add Sub
                      </button>
                    )}
                    {canUpdate && (
                      <button
                        onClick={() => openEdit(parent)}
                        title="Edit Main Category"
                        className="p-2 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-white transition"
                      >
                        <IconEdit className="w-4 h-4" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => openDeleteModal(parent)}
                        title="Delete Category"
                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-white transition"
                      >
                        <IconTrash className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Subcategories */}
                <div className="p-4 sm:p-5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    Subcategories ({subs.length})
                  </p>
                  {subs.length === 0 ? (
                    <div className="text-center py-4 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      <p className="text-xs text-gray-400">No subcategories yet under {parent.name}.</p>
                      {canCreate && (
                        <button
                          onClick={() => openAddSubcategory(parent.id)}
                          className="mt-1 text-xs text-indigo-600 font-semibold hover:underline"
                        >
                          + Add first subcategory
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {subs.map((sub) => {
                        const subProducts = getLinkedProducts(sub);
                        return (
                          <div
                            key={sub.id}
                            className="flex items-center justify-between p-3 rounded-xl border border-gray-200/70 bg-white hover:border-emerald-300 hover:shadow-xs transition"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                              <div className="min-w-0">
                                <span className="text-sm font-semibold text-gray-800 block truncate">
                                  {sub.name}
                                </span>
                                <span className="text-[11px] text-gray-400 block">
                                  {subProducts.length} product{subProducts.length !== 1 ? "s" : ""}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0 ml-2">
                              {canUpdate && (
                                <button
                                  onClick={() => openEdit(sub)}
                                  title="Edit Subcategory"
                                  className="p-1 rounded text-gray-400 hover:text-indigo-600 transition"
                                >
                                  <IconEdit className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  onClick={() => openDeleteModal(sub)}
                                  title="Delete Subcategory"
                                  className="p-1 rounded text-gray-400 hover:text-red-600 transition"
                                >
                                  <IconTrash className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: Subcategories Only Table */}
      {!loading && viewFilter === "sub" && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-5 py-3">Subcategory Name</th>
                <th className="px-5 py-3">Parent Category</th>
                <th className="px-5 py-3">Linked Products</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredSubs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-gray-400">
                    No subcategories found.
                  </td>
                </tr>
              ) : (
                filteredSubs.map((sub) => {
                  const parent = categories.find((c) => c.id === sub.parentId);
                  const linkedCount = getLinkedProducts(sub).length;
                  return (
                    <tr key={sub.id} className="hover:bg-gray-50/60 transition">
                      <td className="px-5 py-3.5 font-semibold text-gray-900">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span>{sub.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-semibold">
                          <IconTag className="w-3 h-3" />
                          {parent?.name || "Unknown"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-gray-600 text-xs">
                        {linkedCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                            {linkedCount} product{linkedCount !== 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span className="text-gray-400">0 products</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          {canUpdate && (
                            <button
                              onClick={() => openEdit(sub)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 transition"
                            >
                              <IconEdit className="w-4 h-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => openDeleteModal(sub)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 transition"
                            >
                              <IconTrash className="w-4 h-4" />
                            </button>
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
      )}

      {/* VIEW 3: Main Categories Only */}
      {!loading && viewFilter === "main" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filteredMain.map((parent) => {
            const subs = subCategoriesByParent[parent.id] || [];
            const linkedCount = getLinkedProducts(parent).length;
            return (
              <div
                key={parent.id}
                className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base">
                      {parent.name.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">{parent.name}</h3>
                      <span className="text-[11px] text-indigo-600 font-semibold">Main Department</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {canUpdate && (
                      <button
                        onClick={() => openEdit(parent)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 transition"
                      >
                        <IconEdit className="w-4 h-4" />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => openDeleteModal(parent)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 transition"
                      >
                        <IconTrash className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                  <span>{subs.length} Subcategories</span>
                  <span>{linkedCount} Products</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              {editingCategory
                ? `Edit ${categoryType === "sub" ? "Subcategory" : "Main Category"}`
                : "Create New Category"}
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Select whether this is a top-level department or a subcategory belonging to a parent.
            </p>

            <form onSubmit={handleSave} className="space-y-4">
              {/* Category Type Selector (Main vs Sub) */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                  Category Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setCategoryType("main");
                      setFormParentId("");
                    }}
                    className={`p-3 rounded-xl border text-left transition ${
                      categoryType === "main"
                        ? "border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-500"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <span className="block text-sm font-bold text-gray-900">Main Category</span>
                    <span className="block text-[11px] text-gray-500 mt-0.5">Top-level (e.g. Men, Women)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCategoryType("sub");
                      if (!formParentId && mainCategories.length > 0) {
                        setFormParentId(String(mainCategories[0].id));
                      }
                    }}
                    className={`p-3 rounded-xl border text-left transition ${
                      categoryType === "sub"
                        ? "border-emerald-600 bg-emerald-50/50 ring-1 ring-emerald-500"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <span className="block text-sm font-bold text-gray-900">Subcategory</span>
                    <span className="block text-[11px] text-gray-500 mt-0.5">Nested (e.g. Jeans, Tops)</span>
                  </button>
                </div>
              </div>

              {/* Category Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {categoryType === "sub" ? "Subcategory Name" : "Main Category Name"} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder={categoryType === "sub" ? "e.g. Jeans, Topwear, Jackets" : "e.g. Men, Women, Kids"}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  required
                />
              </div>

              {/* Parent Selector (only if subcategory) */}
              {categoryType === "sub" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parent Main Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formParentId}
                    onChange={(e) => setFormParentId(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    required
                  >
                    <option value="">-- Select Parent Category --</option>
                    {mainCategories
                      .filter((c) => !editingCategory || c.id !== editingCategory.id)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                  <p className="text-[11px] text-gray-400 mt-1">
                    This subcategory will appear grouped under this main department.
                  </p>
                </div>
              )}

              {formError && <p className="text-xs text-red-500 font-medium">{formError}</p>}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {saving ? "Saving…" : editingCategory ? "Save Changes" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal with Product Blocking Notice */}
      {toDelete && (() => {
        const linkedProducts = getLinkedProducts(toDelete);
        const hasProducts = linkedProducts.length > 0;
        const isParent = !toDelete.parentId;
        const subs = subCategoriesByParent[toDelete.id] || [];

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-3">
                <IconTrash className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-bold text-gray-900 text-center mb-1">
                Delete {isParent ? "Main Category" : "Subcategory"}
              </h3>
              <p className="text-sm text-gray-500 text-center mb-4">
                Are you sure you want to delete <span className="font-bold text-gray-800">"{toDelete.name}"</span>?
              </p>

              {/* CRITICAL WARNING: If category has products, deletion is blocked */}
              {hasProducts ? (
                <div className="rounded-xl bg-red-50 border border-red-200 p-4 mb-5 text-left">
                  <div className="flex items-start gap-2.5">
                    <span className="text-lg leading-none">⛔</span>
                    <div>
                      <p className="text-sm font-bold text-red-900">Cannot Delete This Category</p>
                      <p className="text-xs text-red-700 mt-1 leading-relaxed">
                        There {linkedProducts.length === 1 ? "is" : "are"}{" "}
                        <strong className="underline">{linkedProducts.length} product(s)</strong> currently linked to this category.
                      </p>
                      <p className="text-xs text-red-700 mt-1 leading-relaxed">
                        To delete this category, you must first delete or move those products to another category in the Products section.
                      </p>

                      <div className="mt-2.5 pt-2 border-t border-red-200/60">
                        <p className="text-[11px] font-semibold text-red-800 uppercase tracking-wider mb-1">
                          Linked Products:
                        </p>
                        <ul className="text-xs text-red-800 list-disc list-inside space-y-0.5">
                          {linkedProducts.slice(0, 3).map((p) => (
                            <li key={p.id} className="truncate">
                              {p.name}
                            </li>
                          ))}
                          {linkedProducts.length > 3 && (
                            <li className="italic">...and {linkedProducts.length - 3} more</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              ) : isParent && subs.length > 0 ? (
                <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 mb-4 text-xs text-amber-800 flex items-start gap-2">
                  <span>⚠️</span>
                  <span>
                    This main category has <strong>{subs.length} subcategories</strong>. Deleting it will detach those subcategories.
                  </span>
                </div>
              ) : null}

              {deleteError && (
                <div className="rounded-xl bg-red-100 border border-red-300 p-3 mb-4 text-xs font-semibold text-red-800">
                  {deleteError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setToDelete(null)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
                >
                  {hasProducts ? "Close" : "Cancel"}
                </button>

                <button
                  onClick={handleDelete}
                  disabled={deleting || hasProducts}
                  className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                    hasProducts
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                  }`}
                >
                  {deleting ? "Deleting…" : hasProducts ? "Blocked (Has Products)" : "Delete"}
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
