import axios from "axios";
import { BACKEND_URL } from "@/lib/env";

// Empty BACKEND_URL → same-origin /api (Vercel rewrite to Cloud Run in production).
// Never allow a production page to call localhost (Chrome blocks it as private network).
function resolveApiBase() {
  const configured = (BACKEND_URL || "").replace(/\/$/, "");
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    const isLocal = host === "localhost" || host === "127.0.0.1";
    if (!isLocal && (!configured || configured.includes("localhost") || configured.includes("127.0.0.1"))) {
      return "/api";
    }
  }
  return configured ? `${configured}/api` : "/api";
}

export const API_BASE = resolveApiBase();

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  timeout: 60000,
});

// ── CSRF Token ─────────────────────────────────────────
// Read the csrf_token cookie and attach it as X-CSRF-Token header
// on all state-changing requests (POST, PUT, PATCH, DELETE).
function getCsrfToken() {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : "";
}

api.interceptors.request.use((config) => {
  const csrf = getCsrfToken();
  if (csrf && ["post", "put", "patch", "delete"].includes(config.method?.toLowerCase() || "")) {
    config.headers["X-CSRF-Token"] = csrf;
  }
  return config;
});

// ── Token Refresh ──────────────────────────────────────
// When a 401 is received, try to refresh the access token using
// the stored refresh_token. If refresh succeeds, retry the original
// request. If refresh fails, redirect to login.
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  failedQueue = [];
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt refresh on 401 and not already retried
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Don't try to refresh the refresh endpoint itself
    if (originalRequest.url?.includes("/auth/refresh")) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue this request until refresh completes
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => {
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) {
        throw new Error("No refresh token");
      }

      const { data } = await axios.post(
        `${API_BASE}/auth/refresh`,
        { refresh_token: refreshToken },
        { withCredentials: true }
      );

      // Store new refresh token
      if (data.refresh_token) {
        localStorage.setItem("refresh_token", data.refresh_token);
      }

      processQueue(null, data.token);
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      // Clear stored tokens and redirect to login
      localStorage.removeItem("refresh_token");
      if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// Auth is handled via HttpOnly cookies (withCredentials: true)
// No manual token attachment needed

export { api };
export default api;

export function formatApiError(err) {
  const detail = err?.response?.data?.detail ?? err?.response?.data?.error;
  if (detail == null) return err?.message || "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e)))
      .filter(Boolean)
      .join(" ");
  }
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}
