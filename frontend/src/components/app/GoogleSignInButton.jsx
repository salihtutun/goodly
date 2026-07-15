import { useEffect, useRef } from "react";
import { GOOGLE_CLIENT_ID } from "@/lib/env";

export default function GoogleSignInButton({ onSuccess }) {
  const btnRef = useRef(null);

  useEffect(() => {
    // Without a client ID the button can't work — render nothing instead of
    // loading Google's script and failing silently.
    if (!GOOGLE_CLIENT_ID) return;

    const initButton = () => {
      if (!window.google?.accounts?.id || !btnRef.current) return;

      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          if (response.credential && onSuccess) {
            onSuccess(response.credential);
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      window.google.accounts.id.renderButton(btnRef.current, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: "signin_with",
        shape: "rectangular",
        width: "100%",
      });
    };

    // Load Google Identity Services script
    if (window.google?.accounts) {
      initButton();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initButton;
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, [onSuccess]);

  return (
    <div ref={btnRef} className="w-full" style={{ minHeight: 48 }}>
      {/* Google button renders here */}
    </div>
  );
}
