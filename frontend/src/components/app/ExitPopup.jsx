import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, X } from "lucide-react";
import api from "@/lib/api";
import { FRONTEND_URL } from "@/lib/env";
import { toast } from "sonner";

export default function ExitPopup() {
  const [visible, setVisible] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Show after 30 seconds, only once per session
    const shown = sessionStorage.getItem("exit_popup_shown");
    if (shown) return;

    const timer = setTimeout(() => {
      setVisible(true);
      sessionStorage.setItem("exit_popup_shown", "1");
    }, 30000);

    // Also show on mouse leave (exit intent)
    const handleMouseLeave = (e) => {
      if (e.clientY <= 0 && !sessionStorage.getItem("exit_popup_shown")) {
        setVisible(true);
        sessionStorage.setItem("exit_popup_shown", "1");
      }
    };
    document.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    try {
      await api.post("/public/audit", { url: FRONTEND_URL, email: email.trim() });
      setSubmitted(true);
      toast.success("Check your inbox!");
    } catch {
      // Non-blocking — email capture is best-effort
      setSubmitted(true);
    } finally {
      setBusy(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-8 relative shadow-2xl animate-in fade-in zoom-in duration-300">
        <button
          onClick={() => setVisible(false)}
          className="absolute top-4 right-4 text-[#9CA89C] hover:text-[#1A201A]"
        >
          <X size={20} />
        </button>

        {submitted ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-4">📬</div>
            <h3 className="font-display font-bold text-xl text-[#1A201A]">You're in!</h3>
            <p className="mt-2 text-[#5C685C] text-sm">
              We sent a free SEO checklist to <strong>{email}</strong>. Check your inbox.
            </p>
            <Button
              onClick={() => setVisible(false)}
              className="mt-6 bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7] rounded-full px-6"
            >
              Got it
            </Button>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">🚀</div>
              <h3 className="font-display font-bold text-xl text-[#1A201A]">
                Want a free SEO checklist?
              </h3>
              <p className="mt-2 text-[#5C685C] text-sm leading-relaxed">
                15 things to fix on your website today. Takes 30 minutes. No technical skills needed.
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl py-5 text-center"
              />
              <Button
                type="submit"
                disabled={busy}
                className="w-full bg-[#E07A5F] hover:bg-[#C86A51] text-[#FDFBF7] rounded-full py-5 font-medium"
              >
                {busy ? "Sending..." : "Send me the checklist"} <ArrowRight size={16} className="ml-1.5" />
              </Button>
            </form>
            <p className="mt-3 text-xs text-[#9CA89C] text-center">
              No spam. Just the checklist and 2 helpful follow-ups.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
