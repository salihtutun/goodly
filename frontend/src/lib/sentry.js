/**
 * Frontend Sentry init — no-op unless REACT_APP_SENTRY_DSN is set at build time.
 */
import * as Sentry from "@sentry/react";
import { env, SENTRY_DSN } from "@/lib/env";

const dsn = SENTRY_DSN;

export function initSentry() {
  if (!dsn) return false;
  Sentry.init({
    dsn,
    environment: env("REACT_APP_SENTRY_ENVIRONMENT", "production"),
    release: env("REACT_APP_SENTRY_RELEASE", "goodly-frontend@1.9.0"),
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: 0.1,
    // Never send localhost noise
    enabled: typeof window === "undefined" || !["localhost", "127.0.0.1"].includes(window.location.hostname),
  });
  return true;
}

export { Sentry };
