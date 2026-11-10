import React, { useContext, useMemo } from "react";
import Title from "../components/Title";
import { assets } from "../assets/assets";
import { ShopContext } from "../context/ShopContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import CartTotal from "../components/CartTotal";
import { toast } from "react-toastify";

function Cart() {
  const {
    products,
    currency,
    cartData,
    cartLoading,
    updateQuantity,
    removeCartItem,
    navigate,
    getReservedForVariant,
  } = useContext(ShopContext);

  const items = cartData?.items ?? [];

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

  const hasOverStock = useMemo(() => {
    return items.some((item) => {
      const stock = getItemStock(item);
      return stock !== null && (stock === 0 || item.quantity > stock);
    });
  }, [items, products]);

  const handleProceedToCheckout = () => {
    const overStockItem = items.find((item) => {
      const stock = getItemStock(item);
      return stock !== null && (stock === 0 || item.quantity > stock);
    });

    if (overStockItem) {
      const stock = getItemStock(overStockItem) ?? 0;
      toast.error(
        `Cannot proceed: "${overStockItem.productName}" exceeds available stock (Only ${stock} available). Please reduce the quantity.`,
        { autoClose: 6000 },
      );
      return;
    }

    navigate("/place-order");
  };

  if (cartLoading) {
    return (
      <>
        <Navbar />
        <div className="border-t pt-14 min-h-[60vh] flex items-center justify-center text-gray-400">
          Loading cart…
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="border-t pt-14">
        <div className="text-2xl mb-3">
          <Title text1={"YOUR"} text2={"CART"} />
        </div>

        {hasOverStock && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6 flex items-center gap-2 text-sm">
            <span className="text-lg">⚠️</span>
            <span>
              Some items in your cart exceed available stock. Please adjust quantities before proceeding to checkout.
            </span>
          </div>
        )}

        <div>
          {items.length === 0 ? (
            <p className="text-center py-16 text-gray-400">
              Your cart is empty.
            </p>
          ) : (
            items.map((item) => {
              const stock = getItemStock(item);
              const isOverStock = stock !== null && item.quantity > stock;
              const isOutOfStock = stock !== null && stock === 0;

              return (
                <div
                  key={item.itemId}
                  className={`py-4 border-t border-b grid grid-cols-[4fr_0.8fr_0.4fr] sm:grid-cols-[4fr_1.5fr_0.5fr] items-center gap-4 transition-colors ${
                    isOverStock || isOutOfStock ? "bg-red-50/50" : "text-gray-700"
                  }`}
                >
                  {/* Product info */}
                  <div className="flex items-start gap-4 sm:gap-6">
                    <div className="w-16 sm:w-20 h-16 sm:h-20 bg-gray-100 rounded overflow-hidden shrink-0">
                      {item.imageUrl ? (
                        <img
                          className="w-full h-full object-cover"
                          src={item.imageUrl}
                          alt={item.productName}
                          onError={(e) => {
                            e.target.src =
                              "https://placehold.co/80x80/e5e7eb/9ca3af?text=?";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
                          👕
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs sm:text-base font-medium">
                        {item.productName}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 mt-1.5">
                        <p className="font-semibold text-gray-800">
                          {currency}
                          {item.unitPrice}
                        </p>
                        <p className="px-2 sm:px-3 py-0.5 border bg-slate-50 text-xs rounded font-medium">
                          {item.variantLabel}
                        </p>
                        {stock !== null && (
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                              isOutOfStock
                                ? "bg-red-100 text-red-700 font-bold"
                                : isOverStock
                                ? "bg-red-100 text-red-700 font-bold"
                                : stock <= 3
                                ? "bg-amber-100 text-amber-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {isOutOfStock
                              ? "Out of stock"
                              : isOverStock
                              ? `⚠️ Only ${stock} available!`
                              : `In stock: ${stock}`}
                          </span>
                        )}
                      </div>

                      {/* Warning message if overstock */}
                      {isOverStock && (
                        <p className="text-xs text-red-600 font-semibold mt-1">
                          ⚠️ Requested quantity ({item.quantity}) exceeds stock ({stock}). Please reduce the quantity.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Quantity input */}
                  <div className="flex flex-col items-center">
                    <input
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (isNaN(val) || val < 1) return;
                        if (stock !== null && val > stock) {
                          toast.error(
                            `Only ${stock} item(s) available in stock for this product.`,
                          );
                          updateQuantity(item.itemId, stock);
                        } else {
                          updateQuantity(item.itemId, val);
                        }
                      }}
                      className={`border max-w-14 sm:max-w-20 px-2 py-1 text-center rounded ${
                        isOverStock
                          ? "border-red-500 bg-red-50 text-red-600 font-bold"
                          : "border-gray-300"
                      }`}
                      type="number"
                      min={1}
                      max={stock ?? 99}
                      value={item.quantity}
                    />
                    {stock !== null && (
                      <span className="text-[10px] text-gray-400 mt-0.5 whitespace-nowrap">
                        Max: {stock}
                      </span>
                    )}
                  </div>

                  {/* Remove button */}
                  <div className="flex justify-end pr-2">
                    <img
                      onClick={() => removeCartItem(item.itemId)}
                      className="w-4 sm:w-5 cursor-pointer hover:opacity-75 transition"
                      src={assets.bin_icon}
                      alt="Remove"
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {items.length > 0 && (
          <div className="flex justify-end my-20">
            <div className="w-full sm:w-112.5">
              <CartTotal />
              <div className="w-full text-end">
                <button
                  onClick={handleProceedToCheckout}
                  disabled={hasOverStock}
                  className={`text-sm my-8 px-8 py-3 rounded-full transition ${
                    hasOverStock
                      ? "bg-gray-400 text-white cursor-not-allowed"
                      : "bg-black text-white cursor-pointer active:bg-gray-700 hover:opacity-90"
                  }`}
                >
                  PROCEED TO CHECKOUT
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
}

export default Cart;
