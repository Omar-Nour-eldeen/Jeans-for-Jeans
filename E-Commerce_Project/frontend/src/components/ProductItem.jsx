import React, { useContext } from "react";
import { ShopContext } from "../context/ShopContext";
import { Link } from "react-router-dom";

function ProductItem({ id, image, name, price }) {
    const { currency } = useContext(ShopContext);

    // image can be an array or a plain string
    const imgSrc = Array.isArray(image) ? image[0] : (image || "");

    // price may be a BigDecimal string from backend — coerce to number
    const displayPrice = Number(price || 0).toFixed(2);

    return (
        <Link className="text-gray-700 cursor-pointer" to={`/product/${id}`}>
            <div className="overflow-hidden">
                <img
                    className="hover:scale-110 transition ease-in-out"
                    src={imgSrc}
                    alt={name}
                    onError={(e) => { e.target.src = "https://placehold.co/300x300/e5e7eb/9ca3af?text=?"; }}
                />
            </div>
            <p className="pt-3 pb-1 text-sm">{name}</p>
            <p className="text-sm font-medium">{currency}{displayPrice}</p>
        </Link>
    );
}

export default ProductItem;
