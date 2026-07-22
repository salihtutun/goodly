import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "@/index.css";
import App from "@/App";

// Sentry is deferred to an async chunk loaded after first paint — bundling it
// in the entry added ~85KB of JS that Lighthouse flagged as unused at startup.
// Errors in the first ~1s go unreported, which is an acceptable trade for LCP.
const loadSentry = () => import("@/lib/sentry").then((m) => m.initSentry());
if ("requestIdleCallback" in window) {
  requestIdleCallback(loadSentry, { timeout: 3000 });
} else {
  setTimeout(loadSentry, 2000);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      refetchOnWindowFocus: false,
    },
  },
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
