import { useEffect } from "react";

export function usePageMeta({ title, description }) {
  useEffect(() => {
    document.title = title ? `${title} — Goodly` : "Goodly — Visibility OS for Startups";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", description || "Goodly audits every channel your customers use — Google, Instagram, TikTok, YouTube, and AI assistants — and fixes what's broken.");
    }
  }, [title, description]);
}
