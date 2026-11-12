import React, { useContext, useState, useEffect } from "react";
import { assets } from "../assets/assets";
import { Link, NavLink } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import { useAuth } from "../context/AuthContext";
import { getProfile } from "../services/userService";

function Navbar() {
  const { setShowSearch, getCartCount, navigate } = useContext(ShopContext);
  const { logout, auth } = useAuth();
  const [visible, setVisible] = useState(false);
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

        {/* Mobile menu toggle button */}
        <button
          type="button"
          onClick={() => setVisible(true)}
          className="sm:hidden p-1 text-gray-700 hover:text-black cursor-pointer focus:outline-none"
          aria-label="Open mobile menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      <div
        className={`fixed inset-0 z-50 bg-black/40 transition-opacity duration-300 sm:hidden ${
          visible ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setVisible(false)}
      >
        <div
          className={`absolute top-0 right-0 bottom-0 w-3/4 max-w-xs bg-white shadow-2xl p-6 flex flex-col gap-4 transition-transform duration-300 ease-in-out ${
            visible ? "translate-x-0" : "translate-x-full"
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-4 border-b border-gray-200">
            <img src={assets.Jeans} alt="Logo" className="w-28" />
            <button
              onClick={() => setVisible(false)}
              className="p-1.5 text-gray-500 hover:text-black cursor-pointer"
              aria-label="Close menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* User info on mobile */}
          {registeredEmail && (
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold shrink-0">
                {initials || "U"}
              </div>
              <div className="overflow-hidden">
                {fullName && <p className="text-xs font-bold text-gray-900 truncate">{fullName}</p>}
                <p className="text-[11px] text-gray-500 truncate">{registeredEmail}</p>
              </div>
            </div>
          )}

          {/* Nav Links */}
          <div className="flex flex-col gap-1 py-2 text-sm font-medium text-gray-800">
            <NavLink
              onClick={() => setVisible(false)}
              to="/"
              className={({ isActive }) =>
                `py-2.5 px-3 rounded-lg transition ${
                  isActive ? "bg-black text-white font-semibold" : "hover:bg-gray-100"
                }`
              }
            >
              HOME
            </NavLink>
            <NavLink
              onClick={() => setVisible(false)}
              to="/collection"
              className={({ isActive }) =>
                `py-2.5 px-3 rounded-lg transition ${
                  isActive ? "bg-black text-white font-semibold" : "hover:bg-gray-100"
                }`
              }
            >
              COLLECTION
            </NavLink>
            <NavLink
              onClick={() => setVisible(false)}
              to="/about"
              className={({ isActive }) =>
                `py-2.5 px-3 rounded-lg transition ${
                  isActive ? "bg-black text-white font-semibold" : "hover:bg-gray-100"
                }`
              }
            >
              ABOUT
            </NavLink>
            <NavLink
              onClick={() => setVisible(false)}
              to="/contact"
              className={({ isActive }) =>
                `py-2.5 px-3 rounded-lg transition ${
                  isActive ? "bg-black text-white font-semibold" : "hover:bg-gray-100"
                }`
              }
            >
              CONTACT
            </NavLink>
            <NavLink
              onClick={() => setVisible(false)}
              to="/orders"
              className={({ isActive }) =>
                `py-2.5 px-3 rounded-lg transition ${
                  isActive ? "bg-black text-white font-semibold" : "hover:bg-gray-100"
                }`
              }
            >
              MY ORDERS
            </NavLink>
            <NavLink
              onClick={() => setVisible(false)}
              to="/profile"
              className={({ isActive }) =>
                `py-2.5 px-3 rounded-lg transition ${
                  isActive ? "bg-black text-white font-semibold" : "hover:bg-gray-100"
                }`
              }
            >
              MY PROFILE
            </NavLink>
          </div>

          {/* Logout button */}
          {auth?.accessToken ? (
            <button
              onClick={() => {
                setVisible(false);
                handleLogout();
              }}
              className="mt-auto w-full py-2.5 text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition cursor-pointer"
            >
              Logout
            </button>
          ) : (
            <Link
              onClick={() => setVisible(false)}
              to="/login"
              className="mt-auto w-full py-2.5 text-sm font-semibold text-center text-white bg-black rounded-lg hover:bg-gray-800 transition"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default Navbar;
