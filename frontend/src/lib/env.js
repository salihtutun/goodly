/**
 * Centralized client env access.
 *
 * IMPORTANT: Prefer static `process.env.REACT_APP_*` references so Vite's
 * `define` can inline them at build time. Dynamic `process.env[key]` is NOT
 * replaced and falls through to empty in production bundles.
 *
 * Also: do not gate production defaults on `typeof process` — Vite leaves
 * `process` itself undefined in the browser.
 */

function read(key, fallback = "") {
  // Static switch so each branch is a replaceable process.env.X literal.
  switch (key) {
    case "REACT_APP_BACKEND_URL":
      return process.env.REACT_APP_BACKEND_URL ?? fallback;
    case "REACT_APP_FRONTEND_URL":
      return process.env.REACT_APP_FRONTEND_URL ?? fallback;
    case "REACT_APP_GA_ID":
      return process.env.REACT_APP_GA_ID ?? fallback;
    case "REACT_APP_GOOGLE_CLIENT_ID":
      return process.env.REACT_APP_GOOGLE_CLIENT_ID ?? fallback;
    case "REACT_APP_SENTRY_DSN":
      return process.env.REACT_APP_SENTRY_DSN ?? fallback;
    case "REACT_APP_SENTRY_ENVIRONMENT":
      return process.env.REACT_APP_SENTRY_ENVIRONMENT ?? fallback;
    case "REACT_APP_SENTRY_RELEASE":
      return process.env.REACT_APP_SENTRY_RELEASE ?? fallback;
    default:
      return fallback;
  }
}

export function env(key, fallback = "") {
  const v = read(key, "");
  return v != null && v !== "" ? v : fallback;
}

function defaultBackendUrl() {
  if (typeof window !== "undefined" && window.location?.hostname) {
    const host = window.location.hostname;
    if (host !== "localhost" && host !== "127.0.0.1") {
      return "";
    }
  }
  return "http://localhost:8001";
}

export const BACKEND_URL = env("REACT_APP_BACKEND_URL", defaultBackendUrl());
export const FRONTEND_URL = env(
  "REACT_APP_FRONTEND_URL",
  typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
);
export const GA_MEASUREMENT_ID = env("REACT_APP_GA_ID", "");
export const GOOGLE_CLIENT_ID = env("REACT_APP_GOOGLE_CLIENT_ID", "");
export const SENTRY_DSN = env("REACT_APP_SENTRY_DSN", "");
