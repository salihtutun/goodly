import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api, { formatApiError } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/me", { timeout: 5000 });
      setUser(data);
    } catch {
      setUser(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Anonymous visitors have no session cookie and no stored refresh token —
    // skip the /auth/me probe entirely so public pages don't log 401s in the
    // console (QA issue #9). Login/register set both signals, so returning
    // users still bootstrap normally.
    const hasSessionSignal =
      document.cookie.includes("csrf_token=") ||
      localStorage.getItem("refresh_token");
    if (hasSessionSignal) {
      fetchMe();
    } else {
      setUser(false);
      setLoading(false);
    }
  }, [fetchMe]);

  const login = async (email, password) => {
    try {
      const { data } = await api.post("/auth/login", { email, password });
      setUser(data.user);
      // Store refresh token for automatic token refresh
      if (data.refresh_token) {
        localStorage.setItem("refresh_token", data.refresh_token);
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: formatApiError(e) };
    }
  };

  const register = async (email, password, name, website) => {
    try {
      const { data } = await api.post("/auth/register", { email, password, name, website });
      setUser(data.user);
      // Store refresh token for automatic token refresh
      if (data.refresh_token) {
        localStorage.setItem("refresh_token", data.refresh_token);
      }
      // Include auto-audit result when registration provided a website.
      return { ok: true, audit: data.audit ?? null };
    } catch (e) {
      return { ok: false, error: formatApiError(e) };
    }
  };

  const logout = async () => {
    try { await api.post("/auth/logout"); } catch { /* ignore */ }
    localStorage.removeItem("refresh_token");
    setUser(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh: fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
