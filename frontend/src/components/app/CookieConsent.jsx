import { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consented = localStorage.getItem("cookie-consent");
    if (!consented) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem("cookie-consent", "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:max-w-sm z-50 bg-white border border-[#E5E0D8] rounded-2xl shadow-2xl p-5 animate-in slide-in-from-bottom-4 duration-300">
      {/* aria-label: icon-only button needs an accessible name (a11y audit) */}
      <button onClick={accept} aria-label="Dismiss cookie notice" className="absolute top-3 right-3 text-[#6B776B] hover:text-[#1A201A]">
        <X size={16} />
      </button>
      <p className="text-sm text-[#5C685C] pr-6 leading-relaxed">
        We use essential cookies for authentication. No tracking, no ads.{" "}
        {/* Descriptive text + always-underlined + 4.5:1 green — fixes the
            link-text and link-in-text-block audits */}
        <a href="/privacy" className="text-[#4A7862] underline underline-offset-2 hover:text-[#2D3E32]">Read our privacy policy</a>
      </p>
      <button
        onClick={accept}
        className="mt-3 w-full bg-[#2D3E32] hover:bg-[#4A5F4F] text-white rounded-full py-2.5 text-sm font-medium"
      >
        Got it
      </button>
    </div>
  );
}
