import React, { useState, useEffect, createContext, useCallback } from "react";
import { productApi } from "../services/productService";
import { cartApi } from "../services/cartService";
import { orderApi } from "../services/orderService";
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

function ShopContextProvider({ children }) {
  const currency = "$";
  const delivery_fee = 0;
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsError, setProductsError] = useState(null);
  const [reservedStock, setReservedStock] = useState({});

  const { auth, isLoggedIn, hasAnyPermission } = useAuth();

  const fetchReservedStock = useCallback(async () => {
    try {
      const data = await orderApi.getReservedStock();
      setReservedStock(typeof data === "object" && data !== null ? data : {});
    } catch (err) {
      console.warn("Could not fetch reserved stock:", err);
      setReservedStock({});
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
    } catch (err) {
      if (err?.response?.status !== 404) {
        console.error("Failed to load cart:", err);
      }
      setCartData({ items: [] });
    } finally {
      setCartLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn() && auth?.role === "USER") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
        // Item already gone on the server — just remove it from local state
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

  // ── Products ──────────────────────────────────────────────────────────────
  const refreshProducts = useCallback(async () => {
    try {
      setProductsLoading(true);
      setProductsError(null);
      const [data] = await Promise.all([
        productApi.getAll(),
        fetchReservedStock(),
      ]);
      setProducts(Array.isArray(data) ? data : []);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      const msg =
        err?.response?.status === 401
          ? "Your session expired. Please log in again."
          : err?.response?.status === 403
            ? "You don't have permission to view products."
            : err?.response?.data?.message ||
              err?.message ||
              "Could not load products.";
      setProductsError(msg);
      setProducts([]);
      return [];
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoggedIn()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const addProduct = (p) => setProducts((prev) => [p, ...prev]);
  const updateProduct = (up) =>
    setProducts((prev) => prev.map((p) => (p.id === up.id ? up : p)));
  const deleteProduct = (id) =>
    setProducts((prev) => prev.filter((p) => p.id !== id));

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
