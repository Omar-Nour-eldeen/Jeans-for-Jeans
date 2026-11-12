import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  login as loginApi,
  loginWithGoogle as loginWithGoogleApi,
  register as registerApi,
  logout as logoutApi,
  logoutAll as logoutAllApi,
  refreshSession as refreshSessionApi,
  getStoredAuth,
} from "../services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(getStoredAuth);
  const navigate = useNavigate();

  useEffect(() => {
    const handleForcedLogout = () => {
      setAuth(null);
      navigate("/login", { replace: true });
    };
    window.addEventListener("auth:logout", handleForcedLogout);
    return () => window.removeEventListener("auth:logout", handleForcedLogout);
  }, [navigate]);

  const syncSession = useCallback(async () => {
    try {
      const fresh = await refreshSessionApi();
      if (fresh) setAuth(fresh);
      return fresh;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const handleAuthUpdated = (event) => {
      if (event?.detail) {
        setAuth(event.detail);
      } else {
        const stored = getStoredAuth();
        setAuth(stored);
      }
    };
    const handleStorage = (e) => {
      if (e.key === "app:permissions_updated") {
        syncSession();
      } else if (e.key === "auth") {
        handleAuthUpdated();
      }
    };
    window.addEventListener("auth:updated", handleAuthUpdated);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("auth:updated", handleAuthUpdated);
      window.removeEventListener("storage", handleStorage);
    };
  }, [syncSession]);

  // ── Real-Time Server-Sent Events (SSE) for instant permission updates ────────
  useEffect(() => {
    const userId = auth?.user?.id;
    if (!userId) return;

    let es = null;
    try {
      es = new EventSource(`/api/auth/subscribe/${userId}`);

      es.addEventListener("permissions-updated", async (event) => {
        try {
          const newPerms = JSON.parse(event.data);
          const current = getStoredAuth();
          if (current) {
            const updated = {
              ...current,
              permissions: Array.isArray(newPerms) ? newPerms : Array.from(newPerms),
            };
            localStorage.setItem("auth", JSON.stringify(updated));
            setAuth(updated);
            window.dispatchEvent(new CustomEvent("auth:updated", { detail: updated }));
          }
          // Mint a fresh JWT token in the background with the new permissions
          await syncSession();
        } catch (err) {
          console.error("Error processing permission update event", err);
        }
      });

      es.addEventListener("account-deleted", () => {
        try {
          es.close();
        } catch (_) {}
        localStorage.removeItem("auth");
        setAuth(null);
        window.dispatchEvent(new CustomEvent("auth:updated", { detail: null }));
        toast.error("تم حذف هذا الحساب بواسطة المشرف. تم تسجيل خروجك تلقائياً.");
        setTimeout(() => {
          window.location.href = "/login";
        }, 1000);
      });
    } catch (e) {
      console.warn("Could not establish SSE connection", e);
    }

    return () => {
      if (es) {
        es.close();
      }
    };
  }, [auth?.user?.id, syncSession]);

  const register = useCallback(async (info) => {
    const data = await registerApi(info);
    return data;
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await loginApi(credentials);
    setAuth(data);
    return data;
  }, []);

  const loginWithGoogle = useCallback(async (idToken) => {
    const data = await loginWithGoogleApi(idToken);
    setAuth(data);
    return data;
  }, []);

  const logout = useCallback(async () => {
    await logoutApi();
    setAuth(null);
  }, []);

  const logoutAll = useCallback(async () => {
    await logoutAllApi();
    setAuth(null);
  }, []);

  const getEffectiveAuth = useCallback(() => {
    return auth?.accessToken ? auth : getStoredAuth();
  }, [auth]);

  const hasPermission = useCallback(
    (perm) => {
      const a = getEffectiveAuth();
      const rawRole = (a?.role || a?.user?.role || "").replace(/^ROLE_/, "").toUpperCase();
      if (rawRole === "ADMIN") return true;
      const perms = Array.isArray(a?.permissions)
        ? a.permissions
        : Array.from(a?.permissions || []);
      return perms.includes(perm);
    },
    [getEffectiveAuth],
  );

  const hasAnyPermission = useCallback(
    (...perms) => {
      const a = getEffectiveAuth();
      const rawRole = (a?.role || a?.user?.role || "").replace(/^ROLE_/, "").toUpperCase();
      if (rawRole === "ADMIN") return true;
      const userPerms = Array.isArray(a?.permissions)
        ? a.permissions
        : Array.from(a?.permissions || []);
      return perms.some((p) => userPerms.includes(p));
    },
    [getEffectiveAuth],
  );

  const hasRole = useCallback(
    (...roles) => {
      const a = getEffectiveAuth();
      const rawRole = (a?.role || a?.user?.role || "").replace(/^ROLE_/, "").toUpperCase();
      return roles.some((r) => r.replace(/^ROLE_/, "").toUpperCase() === rawRole);
    },
    [getEffectiveAuth],
  );

  const isAdmin = useCallback(() => {
    const a = getEffectiveAuth();
    const rawRole = (a?.role || a?.user?.role || "").replace(/^ROLE_/, "").toUpperCase();
    return rawRole === "ADMIN";
  }, [getEffectiveAuth]);

  const isEmployee = useCallback(() => {
    const a = getEffectiveAuth();
    const rawRole = (a?.role || a?.user?.role || "").replace(/^ROLE_/, "").toUpperCase();
    return rawRole === "EMPLOYEE";
  }, [getEffectiveAuth]);

  const isLoggedIn = useCallback(() => {
    const a = getEffectiveAuth();
    return !!a?.accessToken;
  }, [getEffectiveAuth]);

  const value = useMemo(
    () => ({
      auth,
      login,
      loginWithGoogle,
      register,
      logout,
      logoutAll,
      hasPermission,
      hasAnyPermission,
      hasRole,
      isAdmin,
      isEmployee,
      isLoggedIn,
      syncSession,
    }),
    [
      auth,
      login,
      loginWithGoogle,
      register,
      logout,
      logoutAll,
      hasPermission,
      hasAnyPermission,
      hasRole,
      isAdmin,
      isEmployee,
      isLoggedIn,
      syncSession,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
