import React, { useState } from "react";
import { assets } from "../assets/assets";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }
    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      toast.success("Registration successful! Please login.");
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
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
        <div>
          <img src={assets.Jeans} alt="" className="w-28" />
        </div>
        <div className="w-full flex flex-col max-w-125">
          <div className="w-full flex flex-col mb-2">
            <h3 className="text-3xl font-semibold mb-2">Sign up</h3>
            <p className="text-base mb-2">
              Please enter your credentials to sign up now.
            </p>
          </div>
          <form onSubmit={onSubmitHandler} className="w-full flex flex-col">
            <div className="w-full flex flex-col">
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Name"
                required
                className="w-full text-stone-950 py-2 my-2 bg-transparent border-b border-black outline-none focus:outline-none"
              />
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
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm Password"
                required
                className="w-full text-stone-950 py-2 my-2 bg-transparent border-b border-black outline-none focus:outline-none"
              />
            </div>
            <div className="w-full flex flex-col my-4">
              <button
                type="submit"
                className="w-full text-white my-2 cursor-pointer active:bg-gray-700 bg-black rounded-full p-4 text-center flex items-center justify-center"
              >
                Register
              </button>
            </div>
          </form>
        </div>
        <Link to="/login" className="w-full flex items-center justify-center mt-4">
          <p>
            Already have an account?{" "}
            <span className="font-semibold underline underline-offset-2 hover:font-bold hover:scale-105 transition ease-in-out duration-300">
              Log in
            </span>
          </p>
        </Link>
      </div>
    </div>
  );
}

export default Register;
