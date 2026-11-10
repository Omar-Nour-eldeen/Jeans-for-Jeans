import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function Unauthorized() {
  const { logout, auth } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-gray-50">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-3xl font-bold">
            🚫
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 text-sm mb-6 leading-relaxed">
            You do not have the required permissions to access this page. If you believe this is an error, please sign in with an authorized account or return to the store.
          </p>

          {auth?.role && (
            <div className="mb-6 py-2 px-3 bg-gray-100 rounded-lg text-xs text-gray-600">
              Logged in as: <span className="font-semibold text-gray-900">{auth.user?.email || "User"}</span> (Role: <span className="font-semibold text-indigo-600">{auth.role}</span>)
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              to="/"
              className="flex-1 py-2.5 px-4 rounded-xl bg-black text-white text-sm font-medium hover:bg-gray-800 transition text-center"
            >
              Go to Home
            </Link>
            <button
              onClick={handleLogout}
              className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-100 transition cursor-pointer"
            >
              Switch Account
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
