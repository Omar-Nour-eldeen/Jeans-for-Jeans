import React, { useState } from "react";
import { assets } from "../assets/assets";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import GoogleAuthButton from "../components/GoogleAuthButton";
import { resendVerification } from "../services/authService";

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleResend = async () => {
    if (!formData.email) return;
    setIsResending(true);
    try {
      const res = await resendVerification(formData.email);
      toast.success(res?.message || "Verification email resent! Please check your inbox and spam folder.");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend verification email.");
    } finally {
      setIsResending(false);
    }
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }
    setIsSubmitting(true);
    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      setIsRegistered(true);
      toast.success("Account created! Please check your email to verify.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center lg:items-start bg-gray-100">
      <div className="relative w-1/2 h-screen hidden lg:flex flex-col sticky top-0">
        <img className="w-full h-full object-cover" src={assets.present} alt="Welcome" />
      </div>
      <div className="w-full lg:w-1/2 min-h-screen bg-gray-100 flex flex-col p-6 sm:p-12 md:p-16 lg:p-20 justify-between overflow-y-auto">
        <div className="flex items-center justify-between mb-4 lg:mb-0">
          <h1 className="text-xl text-stone-950 font-semibold">
            JeansForJeans Brand
          </h1>
          <img src={assets.Jeans} alt="Logo" className="w-24 sm:w-28" />
        </div>
        <div className="w-full flex flex-col max-w-md mx-auto my-auto py-6">
          {isRegistered ? (
            <div className="flex flex-col items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-3xl font-bold text-gray-900">Check Your Inbox!</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                We've sent a verification link to <strong className="text-gray-900">{formData.email}</strong>. 
                Please click the link in your email to verify and activate your account before logging in.
              </p>

              <div className="w-full p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                <p className="font-semibold mb-1">Didn't find the email in your inbox?</p>
                <p>Please check your <strong>Spam / Junk (الرسائل غير المرغوب فيها)</strong> folder, as automated emails can often land there during development.</p>
              </div>

              <div className="w-full mt-2 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={isResending}
                  className="w-full py-3 text-sm font-medium text-black border border-black rounded-full text-center hover:bg-gray-100 transition disabled:opacity-50 cursor-pointer"
                >
                  {isResending ? "Resending verification email..." : "Resend Verification Email"}
                </button>

                <Link
                  to="/login"
                  className="w-full py-3.5 text-sm font-semibold text-white bg-black rounded-full text-center hover:bg-gray-800 transition"
                >
                  Back to Login
                </Link>
              </div>
            </div>
          ) : (
            <>
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
                  <div className="relative w-full">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Password"
                      required
                      className="w-full text-stone-950 py-2 pr-10 my-2 bg-transparent border-b border-black outline-none focus:outline-none"
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

                  <div className="relative w-full">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm Password"
                      required
                      className="w-full text-stone-950 py-2 pr-10 my-2 bg-transparent border-b border-black outline-none focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-black transition cursor-pointer"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? (
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
                <div className="w-full flex flex-col my-3">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full text-white my-2 cursor-pointer active:bg-gray-700 bg-black rounded-full p-4 text-center flex items-center justify-center transition disabled:opacity-60 font-medium"
                  >
                    {isSubmitting ? "Creating Account…" : "Register"}
                  </button>

                  <div className="w-full flex items-center my-3">
                    <div className="flex-1 border-t border-gray-300"></div>
                    <span className="px-3 text-xs text-gray-500 font-medium uppercase tracking-wider">
                      Or continue with
                    </span>
                    <div className="flex-1 border-t border-gray-300"></div>
                  </div>

                  <GoogleAuthButton mode="signup" />
                </div>
              </form>
            </>
          )}
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
