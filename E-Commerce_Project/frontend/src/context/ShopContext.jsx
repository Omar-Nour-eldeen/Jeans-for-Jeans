import React, { useState, useEffect, createContext, useCallback, useRef } from "react";
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

  const inFlightReservedStockRef = useRef(null);
  const inFlightCategoriesRef = useRef(null);
  const inFlightProductsRef = useRef(null);

  const fetchReservedStock = useCallback(async () => {
    if (inFlightReservedStockRef.current) return inFlightReservedStockRef.current;

    inFlightReservedStockRef.current = (async () => {
      try {
        const data = await orderApi.getReservedStock();
        const stockObj = typeof data === "object" && data !== null ? data : {};
        setReservedStock(stockObj);
        return stockObj;
      } catch (err) {
        console.warn("Could not fetch reserved stock:", err);
        setReservedStock({});
        return {};
      } finally {
        inFlightReservedStockRef.current = null;
      }
    })();

    return inFlightReservedStockRef.current;
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

  // ── Cart (Hybrid Resilient API + Local Persistence) ────────────────────────
  const getSavedLocalCart = () => {
    try {
      const saved = localStorage.getItem("local_cart");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.items)) return parsed;
      }
    } catch {}
    return { items: [], totalItems: 0, subtotal: 0 };
  };

  const persistCart = (newCart) => {
    try {
      localStorage.setItem("local_cart", JSON.stringify(newCart));
    } catch {}
  };

  const [cartData, setCartData] = useState(() => getSavedLocalCart());
  const [cartLoading, setCartLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    try {
      setCartLoading(true);
      const data = await cartApi.getCart();
      if (data && Array.isArray(data.items)) {
        // If backend returned items, save & use them
        if (data.items.length > 0) {
          setCartData(data);
          persistCart(data);
          return data;
        }
        // If backend is empty but local had items, keep local
        const local = getSavedLocalCart();
        if (local.items.length > 0) {
          setCartData(local);
          return local;
        }
        setCartData(data);
        persistCart(data);
        return data;
      }
    } catch (err) {
      console.warn("Could not load backend cart, using offline cart:", err?.message);
    } finally {
      setCartLoading(false);
    }
    const fallback = getSavedLocalCart();
    setCartData(fallback);
    return fallback;
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart, auth]);

  const addTOCart = useCallback(async (productId, variantId, quantity = 1) => {
    if (!productId) {
      toast.error("Product is missing");
      return;
    }
    if (!variantId) {
      toast.error("Please select a size");
      return;
    }

    // 1. Optimistic instant local update
    const prod = products.find((p) => String(p.id) === String(productId));
    const variant = prod?.variants?.find((v) => String(v.id) === String(variantId));

    setCartData((prev) => {
      const currentItems = Array.isArray(prev?.items) ? [...prev.items] : [];
      const existingIndex = currentItems.findIndex(
        (i) => String(i.productId) === String(productId) && String(i.variantId) === String(variantId)
      );

      const price = Number(prod?.price || 0);
      const qty = parseInt(quantity, 10) || 1;

      if (existingIndex > -1) {
        const item = currentItems[existingIndex];
        const newQty = item.quantity + qty;
        currentItems[existingIndex] = {
          ...item,
          quantity: newQty,
          lineTotal: price * newQty,
        };
      } else {
        currentItems.push({
          itemId: "item_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
          productId: String(productId),
          productName: prod?.name || "Product",
          variantId: variant?.id ?? variantId,
          variantLabel: variant?.size ? `Size: ${variant.size}` : `Size: ${variantId}`,
          imageUrl: prod?.images?.[0] || "",
          unitPrice: price,
          quantity: qty,
          lineTotal: price * qty,
          availableStock: variant?.stockQuantity ?? 99,
        });
      }

      const totalItems = currentItems.reduce((sum, i) => sum + (i.quantity || 0), 0);
      const subtotal = currentItems.reduce((sum, i) => sum + (Number(i.unitPrice || 0) * (i.quantity || 0)), 0);

      const newCart = {
        cartId: prev?.cartId || "cart_" + Date.now(),
        items: currentItems,
        totalItems,
        subtotal,
      };

      persistCart(newCart);
      return newCart;
    });

    toast.success("Item added to cart");

    // 2. Background sync to backend
    try {
      const updated = await cartApi.addItem(productId, variantId, quantity);
      if (updated && Array.isArray(updated.items)) {
        setCartData(updated);
        persistCart(updated);
      }
    } catch (err) {
      console.warn("Background cart sync pending/offline:", err?.message);
    }
  }, [products]);

  const getCartCount = useCallback(() => {
    if (!cartData?.items) return 0;
    return cartData.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }, [cartData]);

  const updateQuantity = useCallback(async (cartItemId, quantity) => {
    const qty = parseInt(quantity, 10);
    setCartData((prev) => {
      if (!prev?.items) return prev;
      let newItems;
      if (qty <= 0) {
        newItems = prev.items.filter((i) => i.itemId !== cartItemId);
      } else {
        newItems = prev.items.map((i) =>
          i.itemId === cartItemId
            ? { ...i, quantity: qty, lineTotal: Number(i.unitPrice || 0) * qty }
            : i
        );
      }
      const totalItems = newItems.reduce((sum, i) => sum + (i.quantity || 0), 0);
      const subtotal = newItems.reduce((sum, i) => sum + (Number(i.unitPrice || 0) * (i.quantity || 0)), 0);
      const updated = { ...prev, items: newItems, totalItems, subtotal };
      persistCart(updated);
      return updated;
    });

    // Background sync
    try {
      if (qty <= 0) {
        await cartApi.removeItem(cartItemId);
      } else {
        await cartApi.updateItem(cartItemId, qty);
      }
    } catch {}
  }, []);

  const removeCartItem = useCallback(async (cartItemId) => {
    setCartData((prev) => {
      if (!prev?.items) return prev;
      const newItems = prev.items.filter((i) => i.itemId !== cartItemId);
      const totalItems = newItems.reduce((sum, i) => sum + (i.quantity || 0), 0);
      const subtotal = newItems.reduce((sum, i) => sum + (Number(i.unitPrice || 0) * (i.quantity || 0)), 0);
      const updated = { ...prev, items: newItems, totalItems, subtotal };
      persistCart(updated);
      return updated;
    });

    try {
      await cartApi.removeItem(cartItemId);
    } catch {}
  }, []);

  const clearCart = useCallback(async () => {
    const empty = { items: [], totalItems: 0, subtotal: 0 };
    setCartData(empty);
    persistCart(empty);

    try {
      await cartApi.clearCart();
    } catch {}
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
  const refreshCategories = useCallback(async () => {
    if (inFlightCategoriesRef.current) return inFlightCategoriesRef.current;

    inFlightCategoriesRef.current = (async () => {
      const cached = cacheService.get(CATEGORIES_CACHE_KEY, CATEGORIES_TTL_MS);
      if (cached?.data?.length > 0) {
        setCategories(cached.data);
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
      } finally {
        inFlightCategoriesRef.current = null;
      }
    })();

    return inFlightCategoriesRef.current;
  }, []);

  // ── Products with Cache & Stale-While-Revalidate ──────────────────────────
  const refreshProducts = useCallback(async () => {
    if (inFlightProductsRef.current) return inFlightProductsRef.current;

    inFlightProductsRef.current = (async () => {
      const cached = cacheService.get(PRODUCTS_CACHE_KEY, PRODUCTS_TTL_MS);

      // Instant initial display from cache
      if (cached?.data?.length > 0 && products.length === 0) {
        setProducts(cached.data);
      }

      try {
        if (!cached?.data?.length && products.length === 0) {
          setProductsLoading(true);
        }
        setProductsError(null);

        // Always call the backend services to wake them up and get fresh data
        const [data] = await Promise.all([
          productApi.getAll(),
          fetchReservedStock(),
          refreshCategories(),
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
        inFlightProductsRef.current = null;
      }
    })();

    return inFlightProductsRef.current;
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
