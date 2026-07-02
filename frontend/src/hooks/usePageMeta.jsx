import { useEffect } from "react";

const DEFAULTS = {
  title: "Goodly — Visibility OS for Small Businesses",
  description: "Get found on Google, Instagram, TikTok, and YouTube. Free SEO audit in 10 seconds. No signup required.",
  image: "https://goodly.app/og-image.png",
  url: "https://goodly.app",
};

export function usePageMeta({ title, description, image, url } = {}) {
  useEffect(() => {
    const t = title || DEFAULTS.title;
    const d = description || DEFAULTS.description;
    const i = image || DEFAULTS.image;
    const u = url || (typeof window !== "undefined" ? window.location.href : DEFAULTS.url);

    document.title = t;

    const setMeta = (property, content) => {
      if (!content) return;
      let el = document.querySelector(`meta[property="${property}"]`) || document.querySelector(`meta[name="${property}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(property.startsWith("og:") || property.startsWith("twitter:") ? "property" : "name", property);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("description", d);
    setMeta("og:title", t);
    setMeta("og:description", d);
    setMeta("og:image", i);
    setMeta("og:url", u);
    setMeta("og:type", "website");
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", t);
    setMeta("twitter:description", d);
    setMeta("twitter:image", i);

    // Update canonical URL dynamically
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", u);
  }, [title, description, image, url]);
}
