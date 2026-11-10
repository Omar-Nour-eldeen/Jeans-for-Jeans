import React, { useContext, useState, useEffect } from "react";
import { assets } from "../assets/assets";
import { Link, NavLink } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import { useAuth } from "../context/AuthContext";
import { getProfile } from "../services/userService";

function Navbar() {
  const { setShowSearch, getCartCount, navigate } = useContext(ShopContext);
  const { logout, auth } = useAuth();
  const [profile, setProfile] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("user_profile") || "null");
    } catch {
      return null;
    }
  });

  useEffect(() => {
    let isMounted = true;
    if (auth?.accessToken) {
      getProfile()
        .then((data) => {
          if (isMounted && data) {
            setProfile(data);
            localStorage.setItem("user_profile", JSON.stringify(data));
          }
        })
        .catch(() => {});
    }

    const handleProfileUpdate = (e) => {
      if (e.detail) {
        setProfile(e.detail);
      }
    };

    window.addEventListener("profile:updated", handleProfileUpdate);
    return () => {
      isMounted = false;
      window.removeEventListener("profile:updated", handleProfileUpdate);
    };
  }, [auth]);

  const handleLogout = async () => {
    localStorage.removeItem("user_profile");
    setProfile(null);
    await logout();
    navigate("/login");
  };

  const registeredEmail =
    auth?.user?.email ||
    (profile?.email && !profile.email.includes("@example.com") ? profile.email : "");

  const initials =
    [profile?.firstName?.[0], profile?.lastName?.[0]]
      .filter(Boolean)
      .join("")
      .toUpperCase() || registeredEmail?.[0]?.toUpperCase() || "";

  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(" ");

  return (
    <div className="flex items-center justify-between py-5 font-medium h-28 sticky top-0 z-50 bg-white">
      <Link to="/">
        <img src={assets.Jeans} alt="Logo" className="w-38" />
      </Link>
      <ul className="hidden sm:flex gap-5 text-sm text-gray-700">
        <NavLink to="/" className="flex flex-col items-center gap-1">
          <p>HOME</p>
          <hr className="w-2/4 border-none h-[1.5px] bg-gray-700" />
        </NavLink>
        <NavLink to="/collection" className="flex flex-col items-center gap-1">
          <p>COLLECTION</p>
          <hr className="w-2/4 border-none h-[1.5px] bg-gray-700" />
        </NavLink>
        <NavLink to="/about" className="flex flex-col items-center gap-1">
          <p>ABOUT</p>
          <hr className="w-2/4 border-none h-[1.5px] bg-gray-700" />
        </NavLink>
        <NavLink to="/contact" className="flex flex-col items-center gap-1">
          <p>CONTACT</p>
          <hr className="w-2/4 border-none h-[1.5px] bg-gray-700" />
        </NavLink>
      </ul>
      <div className="flex items-center gap-6">
        <img
          onClick={() => setShowSearch(true)}
          src={assets.search}
          alt=""
          className="w-5 cursor-pointer"
        />

        <div className="group relative">
          <div
            onClick={() => navigate("/profile")}
            className="cursor-pointer flex items-center justify-center transition transform active:scale-95"
            title={registeredEmail || "Profile"}
          >
            {profile?.photoUrl ? (
              <img
                src={profile.photoUrl}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover border border-gray-300 hover:border-black transition"
              />
            ) : initials ? (
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-semibold select-none hover:bg-stone-800 transition">
                {initials}
              </div>
            ) : (
              <img src={assets.profile} alt="Profile" className="w-5" />
            )}
          </div>

          <div className="group-hover:block hidden absolute dropdown-menu right-0 pt-3 z-50">
            <div className="flex flex-col gap-1 w-44 py-3 px-4 bg-white border border-gray-200 shadow-xl rounded-lg text-gray-700">
              <div className="pb-2 border-b border-gray-100">
                {fullName ? (
                  <p className="text-sm font-semibold text-gray-900 truncate">{fullName}</p>
                ) : null}
                {registeredEmail ? (
                  <p className="text-xs text-gray-500 font-medium truncate">{registeredEmail}</p>
                ) : null}
              </div>
              <p
                onClick={() => navigate("/profile")}
                className="cursor-pointer hover:text-black py-1.5 text-sm transition"
              >
                My Profile
              </p>
              <p
                onClick={() => navigate("/orders")}
                className="cursor-pointer hover:text-black py-1.5 text-sm transition"
              >
                Orders
              </p>
              <p
                onClick={handleLogout}
                className="cursor-pointer text-red-600 hover:text-red-700 py-1.5 text-sm transition"
              >
                Logout
              </p>
            </div>
          </div>
        </div>

        <Link to="/cart" id="cart-icon" className="relative">
          <img src={assets.Cart} alt="" className="w-5 min-w-5" />
          {getCartCount() > 0 && (
            <p className="absolute -right-1.25 -bottom-1.25 w-4 text-center leading-4 bg-black text-white aspect-square rounded-full text-[8px] ">
              {getCartCount()}
            </p>
          )}
        </Link>
      </div>
    </div>
  );
}

export default Navbar;
