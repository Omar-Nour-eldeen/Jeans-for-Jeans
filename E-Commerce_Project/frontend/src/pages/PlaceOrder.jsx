import React, { useState, useContext, useEffect } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Title from "../components/Title";
import CartTotal from "../components/CartTotal";
import { ShopContext } from "../context/ShopContext";
import { orderApi } from "../services/orderService";
import { getProfile } from "../services/userService";
import { toast } from "react-toastify";

// Backend expects: CASH_ON_DELIVERY
const PAYMENT_MAP = {
  cod: "CASH_ON_DELIVERY",
};

function PlaceOrder() {
  const [method, setMethod] = useState("cod");
  const [submitting, setSubmitting] = useState(false);
  const [stockError, setStockError] = useState(null);
  const { navigate, cartData, clearCart, products, refreshProducts, fetchCart, getReservedForVariant } =
    useContext(ShopContext);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zipcode: "",
    country: "",
    phone: "",
  });

  useEffect(() => {
    let isMounted = true;
    const fetchUserData = async () => {
      try {
        const auth = JSON.parse(localStorage.getItem("auth") || "null");
        const profile = await getProfile();

        if (isMounted && profile) {
          const authEmail = auth?.user?.email || auth?.email || "";
          const isPlaceholder =
            !profile.email ||
            profile.email.endsWith("@local.com") ||
            profile.email.endsWith("@example.com") ||
            profile.email.startsWith("user-");

          setFormData((prev) => ({
            ...prev,
            firstName: profile.firstName || prev.firstName,
            lastName: profile.lastName || prev.lastName,
            email: !isPlaceholder ? profile.email : (authEmail || prev.email),
            phone: profile.phoneNumber || prev.phone,
            street: profile.street || prev.street,
            city: profile.city || prev.city,
            state: profile.city || prev.state,
            country: profile.country || prev.country || "Egypt",
            zipcode: profile.zipCode || prev.zipcode,
          }));
        } else if (isMounted && auth?.user) {
          const names = (auth.user.name || "").trim().split(" ");
          setFormData((prev) => ({
            ...prev,
            email: auth.user.email || prev.email,
            firstName: names[0] || prev.firstName,
            lastName: names.slice(1).join(" ") || prev.lastName,
          }));
        }
      } catch (err) {
        console.warn("Could not autofill profile in PlaceOrder:", err);
        try {
          const auth = JSON.parse(localStorage.getItem("auth") || "null");
          if (isMounted && auth?.user) {
            const names = (auth.user.name || "").trim().split(" ");
            setFormData((prev) => ({
              ...prev,
              email: auth.user.email || prev.email,
              firstName: names[0] || prev.firstName,
              lastName: names.slice(1).join(" ") || prev.lastName,
            }));
          }
        } catch {
          // ignore
        }
      }
    };

    fetchUserData();
    return () => { isMounted = false; };
  }, []);

  const onChangeHandler = (e) => {
    const { name, value } = e.target;
    setFormData((d) => ({ ...d, [name]: value }));
  };

  const getItemStock = (item) => {
    if (item.availableStock !== undefined && item.availableStock !== null) {
      return item.availableStock;
    }
    const prod = products.find((p) => String(p.id) === String(item.productId));
    const variant = prod?.variants?.find(
      (v) => String(v.id) === String(item.variantId),
    );
    if (!variant || variant.stockQuantity == null) return null;
    const reserved = getReservedForVariant ? getReservedForVariant(variant.id) : 0;
    return Math.max(0, Number(variant.stockQuantity) - reserved);
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setStockError(null);

    const items = cartData?.items ?? [];
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    // Pre-validate stock for every item before submitting
    for (const item of items) {
      const stock = getItemStock(item);
      if (stock !== null && (stock === 0 || item.quantity > stock)) {
        const errorText =
          stock === 0
            ? `"${item.productName} (${item.variantLabel})" is out of stock.`
            : `Insufficient stock for "${item.productName} (${item.variantLabel})": requested ${item.quantity}, but only ${stock} available in stock.`;
        setStockError(errorText);
        toast.error(errorText, { autoClose: 7000 });
        return;
      }
    }

    setSubmitting(true);
    try {
      // Build PlaceOrderRequest body matching the backend DTO
      const body = {
        customerEmail: formData.email,
        shippingAddress: {
          email: formData.email,
          street: formData.street,
          city: formData.city,
          state: formData.state,
          country: formData.country || "Egypt",
          zipCode: formData.zipcode,
          phone: formData.phone,
          recipientName: `${formData.firstName} ${formData.lastName}`.trim(),
        },
        paymentMethod: PAYMENT_MAP[method] ?? "CASH_ON_DELIVERY",
      };

      await orderApi.placeOrder(body);

      // Clear cart locally (backend also clears it)
      await clearCart();

      toast.success("Order placed successfully!");
      navigate("/orders");
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Could not place order. Please try again.";
      setStockError(msg);
      toast.error(msg, { autoClose: 8000 });

      // Refresh cart and products to reflect accurate inventory
      fetchCart?.();
      refreshProducts?.();
    } finally {
      setSubmitting(false);
    }
  };

  const items = cartData?.items ?? [];

  return (
    <>
      <Navbar />
      <div className="pt-5 sm:pt-10 max-w-7xl mx-auto px-4">
        {/* Prominent stock error alert banner */}
        {stockError && (
          <div className="bg-red-50 border-2 border-red-300 text-red-900 p-4 rounded-xl mb-6 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="font-bold text-red-900">Stock Alert:</p>
                <p className="text-sm text-red-800 font-medium">{stockError}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate("/cart")}
              className="bg-red-600 hover:bg-red-700 text-white text-xs px-4 py-2 rounded-lg font-semibold shrink-0 cursor-pointer transition shadow"
            >
              Return to Cart to adjust quantities →
            </button>
          </div>
        )}

        <form
          onSubmit={onSubmitHandler}
          className="flex flex-col sm:flex-row justify-between gap-8 pb-14 border-t pt-8"
        >
        {/* Left side — delivery info */}
        <div className="flex flex-col gap-4 w-full sm:max-w-120">
          <div className="text-xl sm:text-2xl my-3">
            <Title text1={"DELIVERY"} text2={"INFORMATION"} />
          </div>
          <div className="flex gap-3">
            <input
              required
              onChange={onChangeHandler}
              name="firstName"
              value={formData.firstName}
              className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
              type="text"
              placeholder="First name"
            />
            <input
              required
              onChange={onChangeHandler}
              name="lastName"
              value={formData.lastName}
              className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
              type="text"
              placeholder="Last name"
            />
          </div>
          <input
            required
            onChange={onChangeHandler}
            name="email"
            value={formData.email}
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            type="email"
            placeholder="Email address"
          />
          <input
            required
            onChange={onChangeHandler}
            name="street"
            value={formData.street}
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            type="text"
            placeholder="Address / Street"
          />
          <div className="flex gap-3">
            <input
              required
              onChange={onChangeHandler}
              name="phone"
              value={formData.phone}
              className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
              type="tel"
              placeholder="Phone number"
            />
            <input
              required
              onChange={onChangeHandler}
              name="zipcode"
              value={formData.zipcode}
              className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
              type="text"
              placeholder="Zipcode"
            />
          </div>
          <div className="flex gap-3">
            <input
              required
              onChange={onChangeHandler}
              name="city"
              value={formData.city}
              className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
              type="text"
              placeholder="City"
            />
            <input
              required
              onChange={onChangeHandler}
              name="state"
              value={formData.state}
              className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
              type="text"
              placeholder="Governorate"
            />
          </div>
          <input
            onChange={onChangeHandler}
            name="country"
            value={formData.country}
            className="border border-gray-300 rounded py-1.5 px-3.5 w-full"
            type="text"
            placeholder="Country (default: Egypt)"
          />
        </div>

        {/* Right side — items review, cart total + payment */}
        <div className="mt-8 flex-1 sm:max-w-md">
          {/* Items In Order with stock status */}
          <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/80 mb-6">
            <h3 className="font-semibold text-gray-800 mb-2.5 text-sm flex items-center justify-between">
              <span>Items in Order ({items.length})</span>
              <span className="text-xs text-gray-500">Stock Status</span>
            </h3>
            <div className="divide-y divide-gray-200 max-h-48 overflow-y-auto pr-1">
              {items.map((item) => {
                const stock = getItemStock(item);
                const isOver = stock !== null && item.quantity > stock;
                const isOut = stock !== null && stock === 0;

                return (
                  <div
                    key={item.itemId}
                    className="py-2 flex items-center justify-between text-xs"
                  >
                    <div className="pr-2">
                      <p className="font-medium text-gray-800 truncate max-w-44">
                        {item.productName}
                      </p>
                      <p className="text-gray-500">
                        {item.variantLabel} × {item.quantity}
                      </p>
                    </div>
                    <div>
                      {stock !== null ? (
                        <span
                          className={`px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${
                            isOut
                              ? "bg-red-100 text-red-700 font-bold"
                              : isOver
                              ? "bg-red-100 text-red-700 font-bold"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {isOut
                            ? "Out of stock"
                            : isOver
                            ? `Only ${stock} left!`
                            : `In stock: ${stock}`}
                        </span>
                      ) : (
                        <span className="text-gray-400">In stock</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 min-w-80">
            <CartTotal />
          </div>
          <div className="mt-12">
            <Title text1={"PAYMENT"} text2={"METHOD"} />
            <div className="flex gap-3 flex-col sm:flex-row">
              <div
                onClick={() => setMethod("cod")}
                className="flex items-center gap-3 border border-gray-300 p-2.5 px-4 cursor-pointer rounded-lg bg-gray-50/50 hover:bg-gray-50 transition"
              >
                <p className="min-w-3.5 h-3.5 border border-gray-400 rounded-full bg-green-500" />
                <p className="text-gray-700 text-sm font-semibold tracking-wide">
                  CASH ON DELIVERY
                </p>
              </div>
            </div>
            <div className="w-full text-end mt-8">
              <button
                type="submit"
                disabled={submitting}
                className="bg-black text-white px-16 py-3 text-sm cursor-pointer active:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? "PLACING ORDER…" : "PLACE ORDER"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
    <Footer />
    </>
  );
}

export default PlaceOrder;
