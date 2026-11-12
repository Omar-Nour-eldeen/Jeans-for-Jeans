import React, { useState } from "react";
import { assets } from "../assets/assets";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { forgotPassword } from "../services/authService";

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      return toast.error("Please enter your email address.");
    }

    setIsSubmitting(true);
    try {
      await forgotPassword(email.trim());
      setSubmitted(true);
      toast.success("Password reset email sent! Check your inbox.");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
        "Failed to send reset link. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center md:items-start bg-gray-100">
      <div className="relative w-1/2 h-screen hidden md:flex flex-col sticky top-0">
        <img className="w-full h-full object-cover" src={assets.present} alt="Reset Password" />
      </div>

      <div className="w-full md:w-1/2 min-h-screen bg-gray-100 flex flex-col p-6 sm:p-12 md:p-16 lg:p-20 justify-between overflow-y-auto">
        <h1 className="text-xl text-stone-950 font-semibold mb-4 md:mb-0">
          JeansForJeans Brand
        </h1>

        <div className="w-full max-w-md mx-auto my-auto py-6">
          {submitted ? (
            <div className="flex flex-col items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h3 className="text-3xl font-semibold text-gray-900">
                Check Your Email
              </h3>

              <p className="text-sm text-gray-600 leading-relaxed">
                If an account with <strong className="text-gray-900">{email}</strong> exists, 
                we have sent a password reset link. Please check your inbox and click the link to reset your password.
              </p>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                ⏰ Note: The reset link expires in <strong>15 minutes</strong>.
              </div>

              <div className="w-full mt-4 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="w-full py-3 text-sm font-semibold text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition"
                >
                  Resend Email
                </button>
                <Link
                  to="/login"
                  className="w-full py-3 text-sm font-semibold text-white bg-black rounded-full text-center hover:bg-gray-800 transition"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={onSubmitHandler} className="w-full flex flex-col">
              <div className="w-full flex flex-col mb-4">
                <h3 className="text-3xl font-semibold mb-2">Forgot Password?</h3>
                <p className="text-base text-gray-600 mb-2">
                  No worries! Enter your registered email address and we'll send you a link to reset your password.
                </p>
              </div>

              <div className="w-full flex flex-col mb-4">
                <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full text-stone-950 py-2.5 my-1 bg-transparent border-b border-black outline-none focus:border-indigo-600 transition"
                />
              </div>

              <div className="w-full flex flex-col my-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full text-white my-2 cursor-pointer active:bg-gray-700 bg-black rounded-full p-4 text-center flex items-center justify-center transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2 text-sm font-semibold">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending reset link…
                    </span>
                  ) : (
                    "Send Reset Link"
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

export default ForgotPassword;

