import React, { useState, useEffect, createContext, useCallback } from "react";
import { productApi, categoryApi } from "../services/productService";
import { cartApi } from "../services/cartService";
import { orderApi } from "../services/orderService";
import { cacheService } from "../services/cacheService";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

// eslint-disable-next-line react-refresh/only-export-components
export const ShopContext = createContext();

const PRODUCT_PERMISSIONS = [
  "product:read",
  "product:create",
  "product:update",
  "product:delete",
];

const ORDER_PERMISSIONS = [
  "order:read",
  "order:update",
  "order:cancel",
];

const PRODUCTS_CACHE_KEY = "products";
const PRODUCTS_TTL_MS = 5 * 60 * 1000; // 5 minutes
const CATEGORIES_CACHE_KEY = "categories";
const CATEGORIES_TTL_MS = 10 * 60 * 1000; // 10 minutes

function ShopContextProvider({ children }) {
  const currency = "$";
  const delivery_fee = 0;
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  // Initialize directly from cache for instant 0ms first render
  const [products, setProducts] = useState(() => {
    try {
      const cached = cacheService.get(PRODUCTS_CACHE_KEY, PRODUCTS_TTL_MS * 2);
      return Array.isArray(cached?.data) ? cached.data : [];
    } catch {
      return [];
    }
  });

  const [categories, setCategories] = useState(() => {
    try {
      const cached = cacheService.get(CATEGORIES_CACHE_KEY, CATEGORIES_TTL_MS * 2);
      return Array.isArray(cached?.data) ? cached.data : [];
    } catch {
      return [];
    }
  });

  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState(null);
  const [reservedStock, setReservedStock] = useState({});

  const { auth, isLoggedIn, hasAnyPermission } = useAuth();

  const fetchReservedStock = useCallback(async () => {
    try {
      const data = await orderApi.getReservedStock();
      const stockObj = typeof data === "object" && data !== null ? data : {};
      setReservedStock(stockObj);
      return stockObj;
    } catch (err) {
      console.warn("Could not fetch reserved stock:", err);
      setReservedStock({});
      return {};
    }
  }, []);

  const getReservedForVariant = useCallback((variantId) => {
    if (!variantId || !reservedStock) return 0;
    return Number(reservedStock[String(variantId)] ?? reservedStock[Number(variantId)] ?? 0);
  }, [reservedStock]);

  useEffect(() => {
    fetchReservedStock();
  }, [fetchReservedStock, auth]);

  const canLoadProducts = useCallback(() => {
    if (!auth) return false;
    if (auth.role === "ADMIN" || auth.role === "USER") return true;
    if (auth.role === "EMPLOYEE")
      return hasAnyPermission(...PRODUCT_PERMISSIONS);
    return false;
  }, [auth, hasAnyPermission]);

  const hasProductPermission = useCallback(
    (...perms) => {
      if (auth?.role === "ADMIN") return true;
      return hasAnyPermission(...perms);
    },
    [auth, hasAnyPermission],
  );

  const hasOrderPermission = useCallback(
    (...perms) => {
      if (auth?.role === "ADMIN") return true;
      return hasAnyPermission(...perms);
    },
    [auth, hasAnyPermission],
  );

  // ── Cart (real API) ───────────────────────────────────────────────────────
  const [cartData, setCartData] = useState(null);
  const [cartLoading, setCartLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    try {
      setCartLoading(true);
      const data = await cartApi.getCart();
      setCartData(data);
      return data;
    } catch (err) {
      if (err?.response?.status !== 404) {
        console.error("Failed to load cart:", err);
      }
      setCartData({ items: [] });
      return { items: [] };
    } finally {
      setCartLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn() && auth?.role === "USER") {
      fetchCart();
    } else if (!isLoggedIn()) {
      setCartData(null);
    }
  }, [auth]); // eslint-disable-line react-hooks/exhaustive-deps

  const addTOCart = useCallback(async (productId, variantId, quantity = 1) => {
    if (!productId) {
      toast.error("Product is missing");
      return;
    }
    if (!variantId) {
      toast.error("Please select a size");
      return;
    }
    try {
      const updated = await cartApi.addItem(productId, variantId, quantity);
      setCartData(updated);
      toast.success("Item added to cart");
    } catch (err) {
      fetchReservedStock();
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Could not add item to cart",
      );
    }
  }, [fetchReservedStock]);

  const getCartCount = useCallback(() => {
    if (!cartData?.items) return 0;
    return cartData.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }, [cartData]);

  const updateQuantity = useCallback(async (cartItemId, quantity) => {
    if (quantity === 0) {
      try {
        await cartApi.removeItem(cartItemId);
        setCartData((prev) =>
          prev
            ? {
                ...prev,
                items: prev.items.filter((i) => i.itemId !== cartItemId),
              }
            : prev,
        );
      } catch (err) {
        toast.error(err?.response?.data?.message || "Could not remove item");
      }
      return;
    }
    try {
      const updated = await cartApi.updateItem(cartItemId, quantity);
      setCartData(updated);
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not update quantity");
    }
  }, []);

  const removeCartItem = useCallback(async (cartItemId) => {
    try {
      await cartApi.removeItem(cartItemId);
      setCartData((prev) =>
        prev
          ? {
              ...prev,
              items: prev.items.filter((i) => i.itemId !== cartItemId),
            }
          : prev,
      );
    } catch (err) {
      if (err?.response?.status === 404) {
        setCartData((prev) =>
          prev
            ? {
                ...prev,
                items: prev.items.filter((i) => i.itemId !== cartItemId),
              }
            : prev,
        );
      } else {
        toast.error(err?.response?.data?.message || "Could not remove item");
      }
    }
  }, []);

  const clearCart = useCallback(async () => {
    try {
      await cartApi.clearCart();
      setCartData({ items: [] });
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not clear cart");
    }
  }, []);

  const getCartAmount = useCallback(() => {
    if (!cartData?.items) return 0;
    return cartData.items.reduce(
      (sum, item) =>
        sum + Number(item.unitPrice || 0) * Number(item.quantity || 0),
      0,
    );
  }, [cartData]);

  // ── Categories with Cache ────────────────────────────────────────────────
  const refreshCategories = useCallback(async ({ force = false } = {}) => {
    const cached = cacheService.get(CATEGORIES_CACHE_KEY, CATEGORIES_TTL_MS);
    if (!force && cached && !cached.isExpired && Array.isArray(cached.data) && cached.data.length > 0) {
      setCategories(cached.data);
      return cached.data;
    }

    try {
      const res = await categoryApi.getAll();
      const list = res?.data?.data || res?.data || [];
      if (Array.isArray(list) && list.length > 0) {
        setCategories(list);
        cacheService.set(CATEGORIES_CACHE_KEY, list);
        return list;
      }
      return cached?.data || [];
    } catch (err) {
      console.warn("Could not load categories in background:", err);
      return cached?.data || [];
    }
  }, []);

  // ── Products with Cache & Stale-While-Revalidate ──────────────────────────
  const refreshProducts = useCallback(async ({ force = false } = {}) => {
    const cached = cacheService.get(PRODUCTS_CACHE_KEY, PRODUCTS_TTL_MS);

    // If fresh cache exists and force is false, populate state immediately with 0ms network
    if (!force && cached && !cached.isExpired && Array.isArray(cached.data) && cached.data.length > 0) {
      setProducts(cached.data);
      return cached.data;
    }

    try {
      // Only show full loading if we do not already have products displayed
      if (!cached?.data?.length && products.length === 0) {
        setProductsLoading(true);
      }
      setProductsError(null);

      const [data] = await Promise.all([
        productApi.getAll(),
        fetchReservedStock(),
        refreshCategories({ force }),
      ]);

      const list = Array.isArray(data) ? data : [];
      setProducts(list);
      cacheService.set(PRODUCTS_CACHE_KEY, list);
      return list;
    } catch (err) {
      if (cached?.data?.length > 0) {
        console.warn("[ShopContext] Backend error; falling back to cached products:", err?.message);
        setProducts(cached.data);
        return cached.data;
      }

      const msg =
        err?.response?.status === 401
          ? "Your session expired. Please log in again."
          : err?.response?.status === 403
            ? "You don't have permission to view products."
            : err?.response?.data?.message ||
              err?.message ||
              "Could not load products.";
      setProductsError(msg);
      return [];
    } finally {
      setProductsLoading(false);
    }
  }, [fetchReservedStock, refreshCategories, products.length]);

  useEffect(() => {
    if (!isLoggedIn()) {
      setProducts([]);
      setProductsLoading(false);
      setProductsError(null);
      return;
    }
    if (canLoadProducts()) {
      refreshProducts();
    } else {
      setProducts([]);
      setProductsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth]);

  const addProduct = (p) => {
    setProducts((prev) => {
      const next = [p, ...prev];
      cacheService.set(PRODUCTS_CACHE_KEY, next);
      return next;
    });
  };

  const updateProduct = (up) => {
    setProducts((prev) => {
      const next = prev.map((p) => (p.id === up.id ? up : p));
      cacheService.set(PRODUCTS_CACHE_KEY, next);
      return next;
    });
  };

  const deleteProduct = (id) => {
    setProducts((prev) => {
      const next = prev.filter((p) => p.id !== id);
      cacheService.set(PRODUCTS_CACHE_KEY, next);
      return next;
    });
  };

  const navigate = useNavigate();

  const value = {
    products,
    setProducts,
    productsLoading,
    productsError,
    refreshProducts,
    addProduct,
    updateProduct,
    deleteProduct,

    categories,
    refreshCategories,

    PRODUCT_PERMISSIONS,
    ORDER_PERMISSIONS,
    hasProductPermission,
    hasOrderPermission,
    canLoadProducts,

    currency,
    delivery_fee,
    search,
    setSearch,
    showSearch,
    setShowSearch,

    // Cart (API-backed)
    cartData,
    cartLoading,
    fetchCart,
    addTOCart,
    getCartCount,
    updateQuantity,
    removeCartItem,
    clearCart,
    getCartAmount,

    // Reserved stock (pending orders)
    reservedStock,
    fetchReservedStock,
    getReservedForVariant,

    navigate,
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export default ShopContextProvider;
