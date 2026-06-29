import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import api, { formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/app/Common";
import { AuthShell } from "@/pages/Login";
import { toast } from "sonner";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function ResetPassword() {
  usePageMeta({ title: "Reset password", description: "Choose a new password for your Goodly account." });
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (!token) { setError("Invalid reset link."); return; }
    setBusy(true); setError("");
    try {
      await api.post("/auth/reset-password", { token, new_password: password });
      toast.success("Password reset! You can now sign in.");
      navigate("/login");
    } catch (err) {
      setError(formatApiError(err));
    } finally { setBusy(false); }
  };

  if (!token) return (
    <AuthShell>
      <div className="w-full max-w-md text-center">
        <h1 className="font-display font-bold text-3xl text-[#1A201A] tracking-tight">Invalid link</h1>
        <p className="mt-3 text-[#5C685C]">This reset link is missing or invalid. Please request a new one.</p>
        <Link to="/forgot-password" className="inline-block mt-6 text-sm text-[#2D3E32] hover:underline">Request new reset link</Link>
      </div>
    </AuthShell>
  );

  return (
    <AuthShell>
      <div className="w-full max-w-md">
        <Link to="/"><Logo /></Link>
        <h1 className="mt-12 font-display font-bold text-4xl text-[#1A201A] tracking-tight">Choose a new password</h1>
        <p className="mt-2 text-[#5C685C]">Make it strong — at least 6 characters.</p>
        <form onSubmit={submit} className="mt-10 space-y-5" data-testid="reset-password-form">
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input id="password" type="password" required minLength={6} value={password} onChange={e => setPassword(e.target.value)}
              data-testid="reset-password-input" className="bg-white border-[#E5E0D8] rounded-xl py-6" placeholder="At least 6 characters" />
          </div>
          {error && <div className="text-sm text-[#E07A5F]">{error}</div>}
          <Button type="submit" disabled={busy} data-testid="reset-submit-btn" className="w-full bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7] rounded-full py-6">
            {busy ? "Resetting..." : "Reset password"}
          </Button>
        </form>
      </div>
    </AuthShell>
  );
}
