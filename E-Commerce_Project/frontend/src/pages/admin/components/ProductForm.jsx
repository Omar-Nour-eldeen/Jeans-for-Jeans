import React, { useState, useRef, useEffect, useMemo } from "react";
import { toast } from "react-toastify";
import { IconX, IconStar, IconUpload } from "./Icons";
import { createProductFull, updateProductFull, categoryApi } from "../../../services/productService";
import { uploadProductImage } from "../../../services/supabaseClient";

const SIZES = ["XS", "S", "M", "L", "XL"];

const empty = {
  name: "",
  description: "",
  price: "",
  mainCategoryId: "",
  subCategoryId: "",
  sizeQuantities: {},
  bestseller: false,
  imageUrl: "",
};

/** Convert an old sizes-array to sizeQuantities object */
function toSizeQuantities(initial) {
  if (initial?.sizeQuantities && typeof initial.sizeQuantities === "object" && !Array.isArray(initial.sizeQuantities)) {
    return { ...initial.sizeQuantities };
  }
  if (Array.isArray(initial?.variants)) {
    return Object.fromEntries(initial.variants.map((v) => [v.size, v.stockQuantity ?? 1]));
  }
  if (Array.isArray(initial?.sizes)) {
    return Object.fromEntries(initial.sizes.map((s) => [s, 1]));
  }
  return {};
}

export default function ProductForm({ initial, onSave, onCancel }) {
  const isEdit = Boolean(initial?.id);
  const fileInputRef = useRef(null);

  const [categoriesList, setCategoriesList] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [form, setForm] = useState(() => {
    if (isEdit) {
      const initialImages = Array.isArray(initial?.images)
        ? initial.images.filter(Boolean)
        : initial?.image
        ? [initial.image]
        : [];
      return {
        ...initial,
        price: String(initial.price),
        sizeQuantities: toSizeQuantities(initial),
        mainCategoryId: "",
        subCategoryId: initial.categoryId ? String(initial.categoryId) : "",
        imageUrl: initialImages[0] || "",
        imageUrls: initialImages,
      };
    }
    return { ...empty, imageUrls: [] };
  });

  // Load categories dynamically from database
  useEffect(() => {
    let isMounted = true;
    setLoadingCategories(true);

    categoryApi
      .getAll()
      .then((res) => {
        if (!isMounted) return;
        const list = res?.data?.data || res?.data || [];
        const cats = Array.isArray(list) ? list : [];
        setCategoriesList(cats);

        if (isEdit && initial) {
          // Resolve main & subcategory from initial
          let target = null;
          if (initial.categoryId) {
            target = cats.find((c) => String(c.id) === String(initial.categoryId));
          }
          if (!target && initial.category) {
            if (initial.categoryParent) {
              const parent = cats.find(
                (c) => !c.parentId && c.name.toLowerCase() === initial.categoryParent.toLowerCase()
              );
              if (parent) {
                target =
                  cats.find(
                    (c) =>
                      c.parentId === parent.id &&
                      c.name.toLowerCase() === initial.category.toLowerCase()
                  ) || parent;
              }
            }
            if (!target) {
              target = cats.find(
                (c) => c.name.toLowerCase() === initial.category.toLowerCase()
              );
            }
          }

          if (target) {
            if (target.parentId) {
              setForm((f) => ({
                ...f,
                mainCategoryId: String(target.parentId),
                subCategoryId: String(target.id),
              }));
            } else {
              setForm((f) => ({
                ...f,
                mainCategoryId: String(target.id),
                subCategoryId: "",
              }));
            }
          }
        } else if (!isEdit) {
          // New product: default to first main category
          const firstMain = cats.find((c) => !c.parentId);
          if (firstMain) {
            const firstSub = cats.find((c) => c.parentId === firstMain.id);
            setForm((f) => ({
              ...f,
              mainCategoryId: String(firstMain.id),
              subCategoryId: firstSub ? String(firstSub.id) : "",
            }));
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load categories:", err);
        toast.error("Failed to load categories from database");
      })
      .finally(() => {
        if (isMounted) setLoadingCategories(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isEdit, initial]);

  const mainCategories = useMemo(
    () => categoriesList.filter((c) => !c.parentId),
    [categoriesList]
  );

  const availableSubCategories = useMemo(() => {
    if (!form.mainCategoryId) return [];
    return categoriesList.filter(
      (c) => String(c.parentId) === String(form.mainCategoryId)
    );
  }, [categoriesList, form.mainCategoryId]);

  const handleMainCategoryChange = (e) => {
    const newMainId = e.target.value;
    const subs = categoriesList.filter((c) => String(c.parentId) === String(newMainId));
    setForm((f) => ({
      ...f,
      mainCategoryId: newMainId,
      subCategoryId: subs.length > 0 ? String(subs[0].id) : "",
    }));
  };

  const handleSubCategoryChange = (e) => {
    setForm((f) => ({
      ...f,
      subCategoryId: e.target.value,
    }));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageMode, setImageMode] = useState("upload"); // 'upload' or 'url'
  const [urlInput, setUrlInput] = useState("");

  const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

  /** Handle multiple direct file uploads to Supabase Storage */
  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        return toast.error(`"${file.name}" is not an image. Only JPG, PNG, WEBP allowed.`);
      }
      if (file.size > 10 * 1024 * 1024) {
        return toast.error(`"${file.name}" exceeds 10 MB limit.`);
      }
    }

    setIsUploadingImage(true);
    const uploadedUrls = [];
    try {
      for (const file of files) {
        const publicUrl = await uploadProductImage(file);
        uploadedUrls.push(publicUrl);
      }

      setForm((f) => {
        const updated = [...(f.imageUrls || []), ...uploadedUrls];
        return {
          ...f,
          imageUrls: updated,
          imageUrl: updated[0] || "",
        };
      });

      toast.success(
        files.length === 1
          ? "Image uploaded to Supabase Storage!"
          : `${files.length} images uploaded to Supabase Storage!`
      );
    } catch (err) {
      console.error("Supabase image upload failed:", err);
      toast.error(
        err?.message || "Failed to upload image(s) to Supabase. Check frontend/.env settings."
      );
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeImage = (indexToRemove) => {
    setForm((f) => {
      const updated = (f.imageUrls || []).filter((_, idx) => idx !== indexToRemove);
      return {
        ...f,
        imageUrls: updated,
        imageUrl: updated[0] || "",
      };
    });
  };

  const setAsMainImage = (index) => {
    setForm((f) => {
      const images = [...(f.imageUrls || [])];
      const [selected] = images.splice(index, 1);
      images.unshift(selected);
      return {
        ...f,
        imageUrls: images,
        imageUrl: images[0] || "",
      };
    });
  };

  const handleAddDirectUrl = () => {
    if (!urlInput.trim()) return;
    const url = urlInput.trim();
    setForm((f) => {
      const updated = [...(f.imageUrls || []), url];
      return {
        ...f,
        imageUrls: updated,
        imageUrl: updated[0] || "",
      };
    });
    setUrlInput("");
    toast.success("Image URL added!");
  };

  /** Toggle a size on/off; default quantity = 1 when first added */
  const toggleSize = (s) => {
    setForm((f) => {
      const sq = { ...f.sizeQuantities };
      if (sq[s] !== undefined) {
        delete sq[s];
      } else {
        sq[s] = 1;
      }
      return { ...f, sizeQuantities: sq };
    });
  };

  /** Update quantity for an already-selected size */
  const setQty = (s, val) => {
    const qty = Math.max(0, parseInt(val, 10) || 0);
    setForm((f) => ({ ...f, sizeQuantities: { ...f.sizeQuantities, [s]: qty } }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isUploadingImage) {
      return toast.info("Please wait until images finish uploading.");
    }

    // ── Client-side validation ──────────────────────────────────
    if (!form.name.trim()) return toast.error("Product name is required");
    if (!form.price || isNaN(+form.price) || +form.price <= 0)
      return toast.error("Enter a valid price");
    const selectedSizes = Object.keys(form.sizeQuantities);
    if (selectedSizes.length === 0) return toast.error("Select at least one size");

    const hasImages = (form.imageUrls && form.imageUrls.length > 0) || form.imageUrl?.trim();
    if (!isEdit && !hasImages) return toast.error("Please provide or upload at least one product image");

    const targetCategoryId = form.subCategoryId || form.mainCategoryId;
    if (!targetCategoryId) {
      return toast.error("Please select a category from the database");
    }

    setIsSubmitting(true);

    try {
      const payload = {
        ...form,
        categoryId: Number(targetCategoryId),
        imageUrl: form.imageUrls?.[0] || form.imageUrl || "",
      };

      let savedProduct;

      if (isEdit) {
        savedProduct = await updateProductFull(initial.id, payload, initial);
        toast.success("Product updated!");
      } else {
        savedProduct = await createProductFull(payload);
        toast.success("Product added with images!");
      }

      onSave(savedProduct);

    } catch (err) {
      const serverMsg =
        err?.response?.data?.errors?.[0]?.message ||
        err?.response?.data?.message ||
        err?.message ||
        "Something went wrong";
      toast.error(serverMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedSizes = Object.keys(form.sizeQuantities);
  const currentImages = form.imageUrls || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">{isEdit ? "Edit Product" : "Add New Product"}</h2>
          <button onClick={onCancel} className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition">
            <IconX className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

          {/* Product Images Section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-gray-700">
                Product Images ({currentImages.length}) {!isEdit && <span className="text-red-500">*</span>}
              </label>
              <div className="flex items-center gap-1 text-xs bg-gray-100 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setImageMode("upload")}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    imageMode === "upload"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  From Device (Supabase)
                </button>
                <button
                  type="button"
                  onClick={() => setImageMode("url")}
                  className={`px-2.5 py-1 rounded-md font-medium transition ${
                    imageMode === "url"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Direct URL
                </button>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Upload Area */}
            {imageMode === "upload" ? (
              <div>
                <div
                  onClick={() => !isUploadingImage && fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 mb-3 ${
                    isUploadingImage
                      ? "border-indigo-300 bg-indigo-50/50 cursor-wait"
                      : "border-gray-300 hover:border-indigo-500 hover:bg-gray-50"
                  }`}
                >
                  {isUploadingImage ? (
                    <>
                      <span className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs font-medium text-indigo-700">Uploading image(s) to Supabase Storage…</p>
                    </>
                  ) : (
                    <>
                      <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <IconUpload className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Click to upload one or multiple images
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Select multiple files from device (stored in Supabase)
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex gap-2 mb-3">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddDirectUrl}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition"
                >
                  + Add URL
                </button>
              </div>
            )}

            {/* Image Gallery / Thumbnails */}
            {currentImages.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                {currentImages.map((imgUrl, index) => (
                  <div
                    key={`${imgUrl}-${index}`}
                    className="relative group rounded-lg overflow-hidden border border-gray-200 bg-white aspect-square flex items-center justify-center shadow-sm"
                  >
                    <img
                      src={imgUrl}
                      alt={`Product view ${index + 1}`}
                      className="w-full h-full object-contain p-1"
                      onError={(e) => { e.target.style.display = "none"; }}
                    />

                    {/* Main cover badge */}
                    {index === 0 && (
                      <span className="absolute top-1.5 left-1.5 bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
                        Cover
                      </span>
                    )}

                    {/* Action Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1">
                      {index !== 0 && (
                        <button
                          type="button"
                          onClick={() => setAsMainImage(index)}
                          className="px-2 py-1 bg-white text-gray-800 text-[10px] font-semibold rounded shadow hover:bg-gray-100 transition"
                        >
                          Make Cover
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="px-2 py-1 bg-red-600 text-white text-[10px] font-semibold rounded shadow hover:bg-red-700 transition"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}

                {/* Add More button inside gallery */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingImage}
                  className="rounded-lg border-2 border-dashed border-gray-300 hover:border-indigo-500 hover:bg-white text-gray-400 hover:text-indigo-600 aspect-square flex flex-col items-center justify-center gap-1 transition"
                >
                  <span className="text-xl leading-none font-bold">+</span>
                  <span className="text-[10px] font-semibold">Add More</span>
                </button>
              </div>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Product Name *</label>
            <input
              value={form.name} onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Slim Fit Denim Jacket"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
            <textarea
              value={form.description} onChange={(e) => set("description", e.target.value)}
              rows={3} placeholder="Describe the product…"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Price ($) *</label>
            <input
              type="number" min="0" step="0.01"
              value={form.price} onChange={(e) => set("price", e.target.value)}
              placeholder="0.00"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Category + SubCategory from Database */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Category (Database) *
              </label>
              {loadingCategories ? (
                <div className="h-10 bg-gray-100 rounded-xl animate-pulse flex items-center px-4 text-xs text-gray-400">
                  Loading categories from database…
                </div>
              ) : mainCategories.length === 0 ? (
                <div className="text-xs text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  ⚠️ No main categories in database. Please create one in Categories tab first.
                </div>
              ) : (
                <select
                  value={form.mainCategoryId || ""}
                  onChange={handleMainCategoryChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="" disabled>-- Select Main Category --</option>
                  {mainCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Sub-Category {availableSubCategories.length > 0 ? "*" : "(Optional)"}
              </label>
              {loadingCategories ? (
                <div className="h-10 bg-gray-100 rounded-xl animate-pulse flex items-center px-4 text-xs text-gray-400">
                  Loading subcategories…
                </div>
              ) : availableSubCategories.length === 0 ? (
                <select
                  disabled
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
                >
                  <option>
                    {form.mainCategoryId ? "No subcategories for this category" : "Select main category first"}
                  </option>
                </select>
              ) : (
                <select
                  value={form.subCategoryId || ""}
                  onChange={handleSubCategoryChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="" disabled>-- Select Subcategory --</option>
                  {availableSubCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Sizes + Quantities */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Sizes & Quantity *</label>

            {/* Size toggle buttons */}
            <div className="flex flex-wrap gap-2 mb-3">
              {SIZES.map((s) => {
                const active = form.sizeQuantities[s] !== undefined;
                return (
                  <button
                    key={s} type="button" onClick={() => toggleSize(s)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-all duration-150 ${active ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:border-indigo-400"
                      }`}
                  >{s}</button>
                );
              })}
            </div>

            {/* Quantity inputs for selected sizes */}
            {selectedSizes.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-1 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                {selectedSizes.map((s) => (
                  <div key={s} className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
                      Size {s}
                    </label>
                    <div className="flex items-center border border-indigo-200 rounded-lg overflow-hidden bg-white shadow-sm">
                      <button
                        type="button"
                        onClick={() => setQty(s, (form.sizeQuantities[s] || 0) - 1)}
                        className="px-2.5 py-1.5 text-indigo-600 hover:bg-indigo-100 font-bold text-base transition select-none"
                      >−</button>
                      <input
                        type="number" min="0"
                        value={form.sizeQuantities[s] ?? 1}
                        onChange={(e) => setQty(s, e.target.value)}
                        className="w-full text-center text-sm font-semibold text-gray-800 focus:outline-none py-1.5 border-x border-indigo-100"
                      />
                      <button
                        type="button"
                        onClick={() => setQty(s, (form.sizeQuantities[s] || 0) + 1)}
                        className="px-2.5 py-1.5 text-indigo-600 hover:bg-indigo-100 font-bold text-base transition select-none"
                      >+</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Bestseller */}
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox" checked={form.bestseller}
                onChange={(e) => set("bestseller", e.target.checked)}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition ${form.bestseller ? "bg-amber-500 border-amber-500" : "border-gray-300"}`}>
                {form.bestseller && <IconStar className="w-3 h-3 text-white" />}
              </div>
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">Mark as Bestseller</span>
          </label>
        </form>

        {/* Footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || isUploadingImage}
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isUploadingImage
              ? "Uploading image…"
              : isSubmitting
              ? (isEdit ? "Saving…" : "Adding…")
              : (isEdit ? "Save Changes" : "Add Product")}
          </button>
        </div>
      </div>
    </div>
  );
}