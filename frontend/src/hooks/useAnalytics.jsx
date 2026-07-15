import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { GA_MEASUREMENT_ID } from "@/lib/env";

/**
 * Google Analytics 4 page view tracking.
 * Call once in App.jsx to track all route changes.
 */
export function useAnalytics() {
  const location = useLocation();

  useEffect(() => {
    if (!GA_MEASUREMENT_ID) return;

    // Load GA script once
    if (!window.gtag) {
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
      document.head.appendChild(script);

      window.dataLayer = window.dataLayer || [];
      window.gtag = function () {
        window.dataLayer.push(arguments);
      };
      window.gtag("js", new Date());
      window.gtag("config", GA_MEASUREMENT_ID, {
        send_page_view: false, // We'll send manually
      });
    }

    // Track page view
    window.gtag("event", "page_view", {
      page_path: location.pathname + location.search,
      page_title: document.title,
    });
  }, [location]);
}

/**
 * Track a custom event in Google Analytics.
 * @param {string} action - Event action (e.g., 'click', 'submit', 'signup')
 * @param {object} params - Event parameters
 */
export function trackEvent(action, params = {}) {
  if (!GA_MEASUREMENT_ID || !window.gtag) return;
  window.gtag("event", action, params);
}

/**
 * Track a conversion event.
 * @param {string} type - 'signup', 'trial_start', 'upgrade', 'audit_complete'
 * @param {object} params - Additional parameters
 */
export function trackConversion(type, params = {}) {
  trackEvent("conversion", { conversion_type: type, ...params });
}

/**
 * Track a free tool usage event.
 * @param {string} toolName - Name of the tool used
 * @param {string} url - URL being analyzed
 */
export function trackToolUsage(toolName, url = "") {
  trackEvent("tool_used", { tool_name: toolName, url_domain: extractDomain(url) });
}

function extractDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}
