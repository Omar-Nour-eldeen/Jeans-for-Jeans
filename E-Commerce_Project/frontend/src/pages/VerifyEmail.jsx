import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { assets } from "../assets/assets";
import { toast } from "react-toastify";
import { verifyEmail, resendVerification } from "../services/authService";

function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [resendEmail, setResendEmail] = useState("");
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setErrorMessage("No verification token found in the URL.");
      return;
    }

    let isMounted = true;
    verifyEmail(token)
      .then((res) => {
        if (!isMounted) return;
        setSuccess(true);
        toast.success(res?.message || "Email verified successfully!");
      })
      .catch((err) => {
        if (!isMounted) return;
        const msg =
          err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.message ||
          "Verification failed. The link may have expired.";
        setErrorMessage(msg);
        toast.error(msg);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleResend = async (e) => {
    e.preventDefault();
    if (!resendEmail.trim()) {
      return toast.error("Please enter your email address.");
    }

    setIsResending(true);
    try {
      const res = await resendVerification(resendEmail.trim());
      setResendSuccess(true);
      toast.success(res?.message || "A new verification link has been sent!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to resend verification link.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="w-full h-screen flex items-start">
      <div className="relative w-1/2 h-full hidden md:flex flex-col">
        <img className="w-full h-full object-cover" src={assets.present} alt="Email Verification" />
      </div>

      <div className="w-full md:w-1/2 h-full bg-gray-100 flex flex-col p-10 md:p-20 justify-between">
        <h1 className="text-xl text-stone-950 font-semibold">
          JeansForJeans Brand
        </h1>

        <div className="w-full max-w-125">
          {loading ? (
            <div className="flex flex-col items-center justify-center text-center gap-4 py-10">
              <span className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin" />
              <h3 className="text-2xl font-bold text-gray-900">Verifying your email…</h3>
              <p className="text-sm text-gray-500">Please wait while we confirm your email address.</p>
            </div>
          ) : success ? (
            <div className="flex flex-col items-start gap-4">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h3 className="text-3xl font-bold text-gray-900">Email Verified!</h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                Your email address has been successfully confirmed. Your account is now active and ready to use.
              </p>

              <div className="w-full mt-4">
                <Link
                  to="/login"
                  className="w-full py-3.5 text-sm font-semibold text-white bg-black rounded-full text-center flex items-center justify-center hover:bg-gray-800 transition"
                >
                  Log In to Your Account
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>

              <h3 className="text-2xl font-bold text-gray-900">Verification Failed</h3>
              <p className="text-sm text-gray-600">
                {errorMessage || "The verification link is invalid or has expired."}
              </p>

              {resendSuccess ? (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-xs text-green-800">
                  A fresh verification email has been sent to <strong>{resendEmail}</strong>. Please check your inbox.
                </div>
              ) : (
                <form onSubmit={handleResend} className="mt-2 flex flex-col gap-3">
                  <label className="text-xs font-semibold text-gray-700 uppercase">
                    Resend Verification Link
                  </label>
                  <input
                    type="email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    required
                    className="w-full text-stone-950 py-2.5 my-1 bg-transparent border-b border-black outline-none focus:border-indigo-600 transition text-sm"
                  />
                  <button
                    type="submit"
                    disabled={isResending}
                    className="w-full py-3 text-sm font-semibold text-white bg-black rounded-full text-center hover:bg-gray-800 transition disabled:opacity-60"
                  >
                    {isResending ? "Sending link…" : "Resend Verification Link"}
                  </button>
                </form>
              )}

              <Link
                to="/login"
                className="mt-2 text-center text-sm font-medium text-gray-600 hover:text-black transition"
              >
                Back to Login
              </Link>
            </div>
          )}
        </div>

        <div className="text-center text-xs text-gray-400">
          Need help? Contact support@jeansforjeans.com
        </div>
      </div>
    </div>
  );
}

export default VerifyEmail;

