import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Mail, CheckCircle2 } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";

export default function EmailCapture({ score, url, issues }) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    try {
      // Re-run the audit with email to trigger nurture sequence
      await api.post("/public/audit", {
        url,
        email: email.trim(),
      });
      setSubmitted(true);
      toast.success("Report sent! Check your inbox.");
    } catch (e) {
      toast.error("Couldn't send. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (submitted) {
    return (
      <div className="mt-6 bg-[#81B29A]/10 border border-[#81B29A]/30 rounded-2xl p-6 text-center">
        <CheckCircle2 size={28} className="text-[#81B29A] mx-auto mb-3" />
        <div className="font-display font-bold text-lg text-[#1A201A]">Report sent!</div>
        <p className="text-sm text-[#5C685C] mt-1">
          We emailed your full audit report to <strong>{email}</strong>. You'll also get 3 follow-up emails with specific fixes.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 bg-white border border-[#E5E0D8] rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-10 w-10 rounded-xl bg-[#81B29A]/15 flex items-center justify-center">
          <Mail size={20} className="text-[#81B29A]" />
        </div>
        <div>
          <div className="font-display font-bold text-[#1A201A]">Get your full report by email</div>
          <div className="text-sm text-[#5C685C]">Plus 3 free fix-it tips over the next week.</div>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl py-5 flex-1"
        />
        <Button
          type="submit"
          disabled={busy}
          className="bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7] rounded-full px-5 shrink-0"
        >
          {busy ? "Sending..." : "Send"} <ArrowRight size={16} className="ml-1.5" />
        </Button>
      </form>
      <p className="mt-3 text-xs text-[#9CA89C]">No spam. Just your report and 3 helpful emails.</p>
    </div>
  );
}
