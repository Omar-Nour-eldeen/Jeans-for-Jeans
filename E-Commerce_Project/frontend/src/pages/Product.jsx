import React, { useContext, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import { assets } from "../assets/assets";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { toast } from "react-toastify";
function Product() {
  const { productId } = useParams();
  const { products, currency, addTOCart, cartData, getReservedForVariant } =
    useContext(ShopContext);
  const productData = useMemo(
    () => products.find((item) => String(item.id) === productId) || false,
    [productId, products],
  );
  const [selectedImage, setSelectedImage] = useState("");
  const [size, setSize] = useState("");
  const image =
    selectedImage || (productData ? productData.images?.[0] || "" : "");

  const selectedVariant = useMemo(() => {
    return (productData?.variants || []).find((v) => v.size === size);
  }, [productData, size]);

  const reservedForSelected = useMemo(() => {
    return selectedVariant ? getReservedForVariant(selectedVariant.id) : 0;
  }, [selectedVariant, getReservedForVariant]);

  const stock = useMemo(() => {
    if (!selectedVariant || selectedVariant.stockQuantity == null) return null;
    return Math.max(0, Number(selectedVariant.stockQuantity) - reservedForSelected);
  }, [selectedVariant, reservedForSelected]);

  const currentInCart = useMemo(() => {
    if (!cartData?.items || !productData || !selectedVariant) return 0;
    const found = cartData.items.find(
      (i) =>
        String(i.productId) === String(productData.id) &&
        String(i.variantId) === String(selectedVariant.id),
    );
    return found ? found.quantity : 0;
  }, [cartData, productData, selectedVariant]);

  const handleAddToCart = () => {
    if (!size) {
      toast.error("Please select a size first");
      return;
    }

    if (!selectedVariant?.id) {
      toast.error("Selected size is unavailable");
      return;
    }

    if (stock !== null && stock <= 0) {
      toast.error("Sorry, this size is currently out of stock");
      return;
    }

    if (stock !== null && currentInCart + 1 > stock) {
      toast.error(
        `Only ${stock} item(s) available in stock (${currentInCart} already in your cart).`,
      );
      return;
    }

    addTOCart(productData.id, selectedVariant.id, 1);

    const cartIcon = document.getElementById("cart-icon");
    const productImg = document.getElementById("main-product-image");

    if (cartIcon && productImg) {
      const imgRect = productImg.getBoundingClientRect();
      const cartRect = cartIcon.getBoundingClientRect();

      const clone = productImg.cloneNode(true);
      clone.style.position = "fixed";
      clone.style.top = `${imgRect.top}px`;
      clone.style.left = `${imgRect.left}px`;
      clone.style.width = `${imgRect.width}px`;
      clone.style.height = `${imgRect.height}px`;
      clone.style.borderRadius = "8px";
      clone.style.zIndex = "9999";
      clone.style.transition = "all 0.8s cubic-bezier(0.25, 1, 0.5, 1)";
      clone.style.pointerEvents = "none";

      document.body.appendChild(clone);

      // Trigger reflow
      void clone.offsetWidth;

      clone.style.top = `${cartRect.top + cartRect.height / 2 - 10}px`;
      clone.style.left = `${cartRect.left + cartRect.width / 2 - 10}px`;
      clone.style.width = "20px";
      clone.style.height = "20px";
      clone.style.opacity = "0.1";
      clone.style.transform = "rotate(360deg)";

      setTimeout(() => {
        clone.remove();
      }, 800);
    }
  };

  return productData ? (
    <>
      <Navbar />
      <div className="border-t-2 pt-10 transition-opacity ease-in duration-500 opacity-100">
        {/* Product data */}
        <div className="flex gap-12 sm:gap-12 flex-col sm:flex-row">
          {/* Product Images */}
          <div className="flex-1 flex flex-col-reverse gap-3 sm:flex-row ">
            <div className="flex sm:flex-col justify-between sm:justify-normal sm:w-[18.7%] w-full">
              {(productData.images || []).map((item, index) => (
                <img
                  onClick={() => setSelectedImage(item)}
                  key={index}
                  src={item}
                  alt={`item`}
                  className="w-[24%] sm:w-full sm:mb-3 shrink-0 cursor-pointer hover:scale-105 transition ease-in-out"
                />
              ))}
            </div>
            <div className="w-full sm:w-[80%]">
              <img id="main-product-image" src={image} alt="product" className="w-full h-auto" />
            </div>
          </div>
          {/* Product Info */}
          <div className="flex-1">
            <h1 className="text-2xl font-medium mt-2">{productData.name}</h1>
            <div className="flex items-center gap-1 mt-2">
              <img src={assets.star_icon} alt="" className="w-3 5" />
              <img src={assets.star_icon} alt="" className="w-3 5" />
              <img src={assets.star_icon} alt="" className="w-3 5" />
              <img src={assets.star_icon} alt="" className="w-3 5" />
              <img src={assets.star_dull_icon} alt="" className="w-3 5" />
              <p className="pl-2">4.0 (120 Reviews)</p>
            </div>
            <p className="mt-5 text-3xl font-medium">
              {currency}
              {Number(productData.price).toFixed(2)}
            </p>
            <p className="mt-5 text-gray-500 md:w-4/5">
              {productData.description}
            </p>
            <div className="flex flex-col gap-3 my-6">
              <div className="flex items-center justify-between sm:w-4/5">
                <p className="font-medium text-gray-700">Select Size</p>
                {size && stock !== null && (
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      stock === 0
                        ? "bg-red-100 text-red-700"
                        : stock <= 3
                        ? "bg-amber-100 text-amber-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {stock === 0
                      ? "Out of stock"
                      : `In stock: ${stock}`}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {(productData?.variants || []).map((variantItem, index) => {
                  const reservedForVar = getReservedForVariant(variantItem.id);
                  const effectiveVarStock =
                    variantItem.stockQuantity !== null
                      ? Math.max(0, Number(variantItem.stockQuantity) - reservedForVar)
                      : null;
                  const isOutOfStock =
                    effectiveVarStock !== null &&
                    effectiveVarStock <= 0;
                  const isSelected = variantItem.size === size;
                  return (
                    <button
                      onClick={() => setSize(variantItem.size)}
                      key={index}
                      className={`border cursor-pointer py-2 px-4 transition relative ${
                        isSelected
                          ? "bg-black text-white border-black font-semibold"
                          : isOutOfStock
                          ? "bg-gray-100 text-gray-400 border-gray-200 line-through"
                          : "bg-white text-gray-800 hover:border-black"
                      }`}
                      title={
                        isOutOfStock
                          ? "Out of stock"
                          : `Available: ${effectiveVarStock ?? "N/A"}`
                      }
                    >
                      {variantItem.size}
                      {effectiveVarStock !== null &&
                        effectiveVarStock <= 3 &&
                        effectiveVarStock > 0 && (
                          <span className="absolute -top-2 -right-1 bg-amber-500 text-white text-[9px] px-1 rounded-full">
                            {effectiveVarStock}
                          </span>
                        )}
                    </button>
                  );
                })}
              </div>

              {/* Stock status indicator */}
              {size && selectedVariant && (
                <div className="mt-1">
                  {stock === 0 ? (
                    <p className="text-sm font-semibold text-red-600 flex items-center gap-1.5">
                      <span>✕</span> This size is currently out of stock.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-1">
                      <p className="text-xs text-green-700 font-medium flex items-center gap-1.5">
                        <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                        Available in stock: {stock} item(s)
                      </p>
                      {reservedForSelected > 0 && (
                        <p className="text-[11px] text-gray-500">
                          ℹ️ {reservedForSelected} item(s) reserved in pending orders
                        </p>
                      )}
                      {currentInCart > 0 && (
                        <p className="text-xs text-blue-600">
                          ℹ️ You already have ({currentInCart}) of this size in your cart.
                        </p>
                      )}
                      {currentInCart >= stock && (
                        <p className="text-xs font-semibold text-amber-700">
                          ⚠️ You have added the maximum available stock to your cart ({stock} items).
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={handleAddToCart}
              disabled={stock !== null && (stock <= 0 || currentInCart >= stock)}
              className={`px-8 py-3 text-sm font-medium transition cursor-pointer ${
                stock !== null && stock <= 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : stock !== null && currentInCart >= stock
                  ? "bg-gray-400 text-white cursor-not-allowed"
                  : "bg-black text-white active:bg-gray-700 hover:opacity-90"
              }`}
            >
              {stock !== null && stock <= 0
                ? "OUT OF STOCK"
                : stock !== null && currentInCart >= stock
                ? "MAX STOCK REACHED"
                : "ADD TO CART"}
            </button>
            <hr className="mt-8 sm:w-4/5" />
            <div className="text-sm text-gray-500 mt-5 flex flex-col gap-1">
              <p>100% Original product.</p>
              <p>Cash on delivery is available on this product.</p>
              <p>Easy return and exchange policy within 7 days.</p>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  ) : (
    <div className="opacity-0"></div>
  );
}

export default Product;
