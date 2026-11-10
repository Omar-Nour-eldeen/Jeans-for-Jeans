import React from "react";
import { useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import Title from "./Title";

function CartTotal() {
  const { currency, getCartAmount } = useContext(ShopContext);
  const subtotal = getCartAmount();

  return (
    <div className="w-full">
      <div className="text-2xl">
        <Title text1={"CART"} text2={"TOTAL"} />
      </div>
      <div className="flex flex-col gap-2 mt-2 text-sm">
        <div className="flex justify-between">
          <p>Subtotal</p>
          <p>
            {currency}
            {subtotal.toFixed(2)}
          </p>
        </div>
        <hr />
        <div className="flex justify-between font-bold text-base">
          <span>Total</span>
          <span>
            {currency}
            {subtotal.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default CartTotal;