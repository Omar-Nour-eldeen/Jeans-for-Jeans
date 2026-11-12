import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

function GoogleAuthButton({ mode = "signin" }) {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const buttonRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);

  const clientId =
    import.meta.env.VITE_GOOGLE_CLIENT_ID ||
    "94443026462-4eksrijm2d645ouuvcoc1bq3ulhl8ia2.apps.googleusercontent.com";

  const handleCredentialResponse = async (response) => {
    if (!response?.credential) {
      toast.error("Google sign-in failed. No credential received.");
      return;
    }

    setLoading(true);
    try {
      const data = await loginWithGoogle(response.credential);
      toast.success("Signed in with Google successfully!");

      const rawFrom = location.state?.from?.pathname || "/";
      const userRole = (data?.role || data?.user?.role || "")
        .replace(/^ROLE_/, "")
        .toUpperCase();

      let targetPath = "/";
      if (userRole === "ADMIN") {
        targetPath = rawFrom.startsWith("/admin") ? rawFrom : "/admin";
      } else if (userRole === "EMPLOYEE") {
        targetPath = rawFrom.startsWith("/employee") ? rawFrom : "/employee";
      } else {
        if (
          rawFrom.startsWith("/admin") ||
          rawFrom.startsWith("/employee") ||
          rawFrom.includes("unauthorized") ||
          rawFrom.includes("login") ||
          rawFrom.includes("register") ||
          rawFrom.includes("account-inactive")
        ) {
          targetPath = "/";
        } else {
          targetPath = rawFrom;
        }
      }

      navigate(targetPath, { replace: true });
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Google sign-in failed. Please try again.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!clientId) return;

    const initializeGsi = () => {
      if (!window.google?.accounts?.id || !buttonRef.current) return;

      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
        });

        buttonRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(buttonRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          width: 380,
          text: mode === "signup" ? "signup_with" : "signin_with",
          shape: "pill",
          logo_alignment: "left",
        });

        setGoogleReady(true);
      } catch (err) {
        console.error("Failed to initialize Google Sign-In:", err);
      }
    };

    if (window.google?.accounts?.id) {
      initializeGsi();
      return;
    }

    const existingScript = document.getElementById("google-gsi-client");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "google-gsi-client";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initializeGsi;
      document.body.appendChild(script);
    } else {
      existingScript.addEventListener("load", initializeGsi);
    }
  }, [clientId, mode]);

  const handleCustomButtonClick = () => {
    if (!clientId) {
      toast.info(
        "Google Client ID is not configured. Please set VITE_GOOGLE_CLIENT_ID in .env",
      );
      return;
    }
    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    }
  };

  return (
    <div className="w-full flex flex-col items-center">
      {/* Official Google Button Container */}
      <div
        ref={buttonRef}
        className={`w-full flex justify-center ${
          clientId && googleReady ? "block" : "hidden"
        }`}
      />

      {/* Fallback / Custom Button when clientId not yet configured or GSI loading */}
      {(!clientId || !googleReady) && (
        <button
          type="button"
          onClick={handleCustomButtonClick}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-full bg-white hover:bg-gray-50 active:bg-gray-100 transition cursor-pointer shadow-sm text-sm font-medium text-gray-700 disabled:opacity-60"
        >
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>
            {loading
              ? "Signing in..."
              : mode === "signup"
                ? "Sign up with Google"
                : "Sign in with Google"}
          </span>
        </button>
      )}
    </div>
  );
}

export default GoogleAuthButton;

