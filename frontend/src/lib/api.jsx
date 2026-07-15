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
