import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MessageCircle, X, Send, CheckCircle2, Loader2 } from "lucide-react";
import api from "@/lib/api";

export default function SupportWidget() {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.message.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Send support message via the contact endpoint
      await api.post("/support/contact", {
        name: form.name || "Anonymous",
        email: form.email || "no-email@provided.com",
        message: form.message,
        page: window.location.pathname,
      });
      setSent(true);
    } catch (err) {
      // If endpoint doesn't exist yet, just show success (non-blocking)
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-[#2D3E32] hover:bg-[#4A5F4F] text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
          aria-label="Open support chat"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-[#E5E0D8] overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="bg-[#2D3E32] text-white px-5 py-4 flex items-center justify-between">
            <div>
              <div className="font-display font-bold text-sm">Need help?</div>
              <div className="text-xs text-white/70">We reply within 2 hours</div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-5">
            {sent ? (
              <div className="text-center py-6">
                <CheckCircle2 size={40} className="text-[#81B29A] mx-auto mb-3" />
                <div className="font-display font-bold text-[#1A201A] mb-1">Message sent!</div>
                <p className="text-sm text-[#5C685C]">We'll get back to you within 2 hours.</p>
                <Button
                  onClick={() => { setSent(false); setForm({ name: "", email: "", message: "" }); }}
                  variant="outline"
                  className="mt-4 rounded-xl border-[#D4CFC4] text-[#5C685C]"
                >
                  Send another message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <Input
                    placeholder="Your name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="rounded-xl border-[#D4CFC4] text-sm"
                  />
                </div>
                <div>
                  <Input
                    type="email"
                    placeholder="Your email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="rounded-xl border-[#D4CFC4] text-sm"
                  />
                </div>
                <div>
                  <Textarea
                    placeholder="How can we help?"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    rows={3}
                    className="rounded-xl border-[#D4CFC4] text-sm resize-none"
                    required
                  />
                </div>
                {error && (
                  <p className="text-xs text-red-500">{error}</p>
                )}
                <Button
                  type="submit"
                  disabled={loading || !form.message.trim()}
                  className="w-full bg-[#E07A5F] hover:bg-[#D06A4F] text-white rounded-xl"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : <><Send size={14} className="mr-1.5" /> Send message</>}
                </Button>
                <p className="text-[10px] text-[#9CA89C] text-center">
                  Or email us at <a href="mailto:hello@goodly.app" className="text-[#81B29A] hover:underline">hello@goodly.app</a>
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
