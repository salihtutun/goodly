import { useState } from "react";
import { Link } from "react-router-dom";
import api, { formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/app/Common";
import { AuthShell } from "@/pages/Login";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function ForgotPassword() {
  usePageMeta({ title: "Forgot password", description: "Reset your Goodly account password." });
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      await api.post("/auth/forgot-password", { email: email.trim() });
      setSent(true);
    } catch (err) {
      setError(formatApiError(err));
    } finally { setBusy(false); }
  };

  if (sent) return (
    <AuthShell>
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center mb-6">
          <div className="h-16 w-16 rounded-full bg-[#81B29A]/10 flex items-center justify-center">
            <CheckCircle2 size={32} className="text-[#81B29A]" />
          </div>
        </div>
        <h1 className="font-display font-bold text-3xl text-[#1A201A] tracking-tight">Check your inbox</h1>
        <p className="mt-3 text-[#5C685C]">If an account exists for {email}, we sent a reset link.</p>
        <Link to="/login" className="inline-flex items-center gap-1.5 mt-6 text-sm text-[#2D3E32] hover:underline"><ArrowLeft size={14} /> Back to sign in</Link>
      </div>
    </AuthShell>
  );

  return (
    <AuthShell>
      <div className="w-full max-w-md">
        <Link to="/"><Logo /></Link>
        <h1 className="mt-12 font-display font-bold text-4xl text-[#1A201A] tracking-tight">Forgot password?</h1>
        <p className="mt-2 text-[#5C685C]">Enter your email and we'll send you a reset link.</p>
        <form onSubmit={submit} className="mt-10 space-y-5" data-testid="forgot-password-form">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={e => setEmail(e.target.value)}
              data-testid="forgot-email-input" className="bg-white border-[#E5E0D8] rounded-xl py-6" placeholder="you@business.com" />
          </div>
          {error && <div className="text-sm text-[#E07A5F]">{error}</div>}
          <Button type="submit" disabled={busy} data-testid="forgot-submit-btn" className="w-full bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7] rounded-full py-6">
            {busy ? "Sending..." : "Send reset link"}
          </Button>
        </form>
        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm text-[#2D3E32] hover:underline inline-flex items-center gap-1.5"><ArrowLeft size={14} /> Back to sign in</Link>
        </div>
      </div>
    </AuthShell>
  );
}
