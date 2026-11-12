import React, { useState } from "react";
import { assets } from "../assets/assets";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";
import GoogleAuthButton from "../components/GoogleAuthButton";
import { resendVerification } from "../services/authService";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState("");
  const [isResending, setIsResending] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleResendVerification = async () => {
    if (!pendingVerificationEmail) return;
    setIsResending(true);
    try {
      const res = await resendVerification(pendingVerificationEmail);
      toast.success(
        res?.message ||
          "Verification email resent! Please check your inbox and spam folder."
      );
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to resend verification email."
      );
    } finally {
      setIsResending(false);
    }
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
      const msg = error.response?.data?.message || "Login failed";
      toast.error(msg);
      if (
        msg.toLowerCase().includes("pending") ||
        msg.toLowerCase().includes("verify")
      ) {
        setPendingVerificationEmail(formData.email);
      }
    }
  };

  return (
    <div className="w-full min-h-screen flex items-center justify-center lg:items-start bg-gray-100">
      <div className="relative w-1/2 h-screen hidden lg:flex flex-col sticky top-0">
        <img className="w-full h-full object-cover" src={assets.present} alt="Welcome" />
      </div>
      <div className="w-full lg:w-1/2 min-h-screen bg-gray-100 flex flex-col p-6 sm:p-12 md:p-16 lg:p-20 justify-between overflow-y-auto">
        <h1 className="text-xl text-stone-950 font-semibold mb-4 lg:mb-0">
          JeansForJeans Brand
        </h1>

        <form onSubmit={onSubmitHandler} className="w-full flex flex-col max-w-md mx-auto my-auto py-6">
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
          </div>
          <div className="w-full flex items-center justify-end">
            <Link
              to="/forgot-password"
              className="text-sm text-gray-600 hover:text-black hover:font-bold font-medium whitespace-nowrap cursor-pointer underline underline-offset-2 transition"
            >
              Forgot Password?
            </Link>
          </div>

          {pendingVerificationEmail && (
            <div className="w-full mt-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex flex-col gap-2">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex flex-col gap-1">
                  <p className="font-semibold text-gray-900">Account Pending Verification</p>
                  <p className="text-gray-600">
                    Your account is registered but not verified yet. Please check your inbox and <strong>Spam / Junk</strong> folder for the activation link.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleResendVerification}
                disabled={isResending}
                className="mt-1 w-full py-2 px-3 text-xs font-semibold text-black bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition disabled:opacity-50 text-center cursor-pointer shadow-sm"
              >
                {isResending ? "Resending verification email..." : `Resend verification link to ${pendingVerificationEmail}`}
              </button>
            </div>
          )}

          <div className="w-full flex flex-col my-3">
            <button type="submit" className="w-full text-white my-2 cursor-pointer active:bg-gray-700 bg-black rounded-full p-4 text-center flex items-center justify-center font-medium">
              Login
            </button>

            <div className="w-full flex items-center my-3">
              <div className="flex-1 border-t border-gray-300"></div>
              <span className="px-3 text-xs text-gray-500 font-medium uppercase tracking-wider">
                Or continue with
              </span>
              <div className="flex-1 border-t border-gray-300"></div>
            </div>

            <GoogleAuthButton mode="signin" />
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
