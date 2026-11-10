import React, { useState } from "react";
import { assets } from "../assets/assets";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    try {
      const data = await login({
        email: formData.email,
        password: formData.password,
      });
      toast.success("Login successful!");
      
      // Navigate safely based on user role
      const rawFrom = location.state?.from?.pathname || "/";
      const userRole = (data?.role || data?.user?.role || "").replace(/^ROLE_/, "").toUpperCase();

      let targetPath = "/";
      if (userRole === "ADMIN") {
        targetPath = rawFrom.startsWith("/admin") ? rawFrom : "/admin";
      } else if (userRole === "EMPLOYEE") {
        targetPath = rawFrom.startsWith("/employee") ? rawFrom : "/employee";
      } else {
        // Regular USER — prevent navigating to restricted or error routes
        if (
          rawFrom.startsWith("/admin") ||
          rawFrom.startsWith("/employee") ||
          rawFrom.includes("unauthorized") ||
          rawFrom.includes("login") ||
          rawFrom.includes("account-inactive")
        ) {
          targetPath = "/";
        } else {
          targetPath = rawFrom;
        }
      }

      navigate(targetPath, { replace: true });
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
    }
  };

  return (
    <div className="w-full h-screen flex items-start">
      <div className="relative w-1/2 h-full flex flex-col">
        <img className="w-full h-full" src={assets.present} alt="Welcome" />
      </div>
      <div className="w-1/2 h-full bg-gray-100 flex flex-col p-20 justify-between">
        <h1 className="text-xl text-stone-950 font-semibold">
          JeansForJeans Brand
        </h1>

        <form onSubmit={onSubmitHandler} className="w-full flex flex-col max-w-125">
          <div className="w-full flex flex-col mb-2">
            <h3 className="text-3xl font-semibold mb-2">Login</h3>
            <p className="text-base mb-2">
              Please enter your credentials to login.
            </p>
          </div>

          <div className="w-full flex flex-col">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              required
              className="w-full text-stone-950 py-2 my-2 bg-transparent border-b border-black outline-none focus:outline-none"
            />
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              required
              className="w-full text-stone-950 py-2 my-2 bg-transparent border-b border-black outline-none focus:outline-none"
            />
          </div>
          <div className=" w-full flex items-center justify-between">
            <p className="text-sm hover:font-bold font-medium whitespace-nowrap cursor-pointer underline underline-offset-2">
              Forget Password ?
            </p>
          </div>

          <div className="w-full flex flex-col my-4">
            <button type="submit" className="w-full text-white my-2 cursor-pointer active:bg-gray-700 bg-black rounded-full p-4 text-center flex items-center justify-center">
              Login
            </button>
          </div>
        </form>
        <Link
          to="/register"
          className="w-full flex items-center justify-center"
        >
          <p>
            Don't have an account?{" "}
            <span className="font-semibold underline underline-offset-2 hover:font-bold hover:scale-105 transition ease-in-out duration-300">
              Sign up
            </span>
          </p>
        </Link>
      </div>
    </div>
  );
}

export default Login;
