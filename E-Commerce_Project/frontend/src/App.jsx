import React from "react";
import { ToastContainer } from "react-toastify";
import { Route, Routes, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Collection from "./pages/Collection";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Product from "./pages/Product";
import Cart from "./pages/Cart";
import PlaceOrder from "./pages/PlaceOrder";
import Orders from "./pages/Orders";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import AdminPage from "./pages/admin/AdminPage";
import EmployeePage from "./pages/employee/EmployeePage";
import ProtectedRoute from "./components/ProtectedRoute";
import Profile from "./pages/Profile";
import Unauthorized from "./pages/Unauthorized";

function App() {
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        <Route
          path="/admin/*"
          element={
            <ProtectedRoute roles={["ADMIN"]}>
              <AdminPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/employee/*"
          element={
            <ProtectedRoute roles={["EMPLOYEE"]}>
              <EmployeePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="*"
          element={
            <div className="px-4 sm:px-[5vw] md:px-[7vw] lg:px-[9vw]">
              <Routes>
                <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/collection" element={<Collection />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/product/:productId" element={<Product />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/place-order" element={<PlaceOrder />} />
                  <Route path="/orders" element={<Orders />} />
                </Route>
              </Routes>
            </div>
          }
        />
      </Routes>
    </>
  );
}

export default App;
