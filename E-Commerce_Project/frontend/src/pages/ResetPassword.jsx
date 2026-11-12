import React, { useState } from "react";
import { assets } from "../assets/assets";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import { resetPassword } from "../services/authService";

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (!token) {
      return toast.error("Invalid or missing password reset token.");
    }

    if (formData.newPassword.length < 8) {
      return toast.error("Password must be at least 8 characters long.");
    }

    if (formData.newPassword !== formData.confirmPassword) {
      return toast.error("New password and confirm password do not match.");
    }

    setIsSubmitting(true);
    try {
      await resetPassword({
        token,
        newPassword: formData.newPassword,
        confirmPassword: formData.confirmPassword,
      });

      toast.success("Password reset successfully! Please log in.");
      navigate("/login", { replace: true });
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.errors?.[0]?.message ||
        "Failed to reset password. The link may have expired.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full h-screen flex items-start">
      <div className="relative w-1/2 h-full hidden md:flex flex-col">
        <img className="w-full h-full object-cover" src={assets.present} alt="New Password" />
      </div>

      <div className="w-full md:w-1/2 h-full bg-gray-100 flex flex-col p-10 md:p-20 justify-between">
        <h1 className="text-xl text-stone-950 font-semibold">
          JeansForJeans Brand
        </h1>

        <div className="w-full max-w-125">
          {!token ? (
            <div className="flex flex-col gap-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900">
                Invalid or Missing Token
              </h3>
              <p className="text-sm text-gray-600">
                This password reset link is invalid or has expired. Please request a new link.
              </p>
              <Link
                to="/forgot-password"
                className="w-full py-3 text-sm font-semibold text-white bg-black rounded-full text-center hover:bg-gray-800 transition mt-2"
              >
                Request New Reset Link
              </Link>
            </div>
          ) : (
            <form onSubmit={onSubmitHandler} className="w-full flex flex-col">
              <div className="w-full flex flex-col mb-4">
                <h3 className="text-3xl font-semibold mb-2">Set New Password</h3>
                <p className="text-base text-gray-600 mb-2">
                  Please create a new strong password for your account.
                </p>
              </div>

              <div className="w-full flex flex-col gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    New Password
                  </label>
                  <div className="relative w-full">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      placeholder="At least 8 characters"
                      required
                      minLength={8}
                      className="w-full text-stone-950 py-2.5 pr-10 my-1 bg-transparent border-b border-black outline-none focus:border-indigo-600 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-black transition cursor-pointer"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                    Confirm New Password
                  </label>
                  <div className="relative w-full">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Repeat new password"
                      required
                      minLength={8}
                      className="w-full text-stone-950 py-2.5 pr-10 my-1 bg-transparent border-b border-black outline-none focus:border-indigo-600 transition"
                    />
                  </div>
                </div>
              </div>

              <div className="w-full flex flex-col my-5">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full text-white my-2 cursor-pointer active:bg-gray-700 bg-black rounded-full p-4 text-center flex items-center justify-center transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Updating password…
                    </span>
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        <Link
          to="/login"
          className="w-full flex items-center justify-center text-sm text-gray-600 hover:text-black transition"
        >
          <p>
            Remember your password?{" "}
            <span className="font-semibold underline underline-offset-2">
              Back to Login
            </span>
          </p>
        </Link>
      </div>
    </div>
  );
}

export default ResetPassword;

