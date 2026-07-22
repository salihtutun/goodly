import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/app/Common";
import { AuthShell } from "@/pages/Login";
import GoogleSignInButton from "@/components/app/GoogleSignInButton";
import { Eye, EyeOff } from "lucide-react";
import api, { formatApiError } from "@/lib/api";
import { toast } from "sonner";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function Register() {
  usePageMeta({ title: "Create your account", description: "Start your free Goodly account and get your first SEO audit in under a minute." });
  const { register, refresh } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [website, setWebsite] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const pwStrength = (() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return Math.min(4, score);
  })();

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    const res = await register(email.trim(), password, name.trim() || undefined, website.trim() || undefined);
    setBusy(false);
    if (res.ok) {
      // Take owners straight to value — their audit if we ran one, otherwise
      // the guided setup. Verify-email is no longer a hard stop (session is live).
      toast.success("Account created! Check your inbox when you can — email verification helps keep your account safe.");
      if (res.audit?.id) {
        navigate(`/app/audits/${res.audit.id}`);
      } else if (website.trim()) {
        navigate(`/app/audit?url=${encodeURIComponent(website.trim())}`);
      } else {
        navigate("/app/onboarding");
      }
    } else {
      setError(res.error);
    }
  };

  const handleGoogleAuth = async (credential) => {
    setBusy(true); setError("");
    try {
      // Auth is cookie-based: the endpoint sets an httpOnly cookie, so we
      // refresh the auth context instead of stashing tokens in localStorage.
      await api.post("/auth/google", { credential });
      await refresh();
      toast.success("Welcome! Let's get your business found.");
      navigate("/app/onboarding");
    } catch (err) {
      setError(formatApiError(err));
    } finally { setBusy(false); }
  };

  return (
    <AuthShell>
      <div className="w-full max-w-md">
        <Link to="/"><Logo /></Link>
        <h1 className="mt-12 font-display font-bold text-4xl text-[#1A201A] tracking-tight">Create your account</h1>
        <p className="mt-2 text-[#5C685C]">Plant the seed in under a minute.</p>

        <form onSubmit={submit} className="mt-10 space-y-5" data-testid="register-form">
          {/* Google Sign-Up */}
          <GoogleSignInButton onSuccess={(credential) => handleGoogleAuth(credential)} />

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#E5E0D8]" /></div>
            <div className="relative flex justify-center text-xs"><span className="bg-[#FDFBF7] px-3 text-[#9CA89C]">or sign up with email</span></div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Business / your name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)}
              data-testid="register-name-input"
              className="bg-white border-[#E5E0D8] rounded-xl py-6 focus:ring-2 focus:ring-[#81B29A]"
              placeholder="Greenhouse Lane Co." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">Website URL (optional — we'll run your first audit)</Label>
            <Input id="website" value={website} onChange={(e) => setWebsite(e.target.value)}
              className="bg-white border-[#E5E0D8] rounded-xl py-6 focus:ring-2 focus:ring-[#81B29A]"
              placeholder="yourbusiness.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
              data-testid="register-email-input"
              className="bg-white border-[#E5E0D8] rounded-xl py-6 focus:ring-2 focus:ring-[#81B29A]"
              placeholder="you@business.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input id="password" type={showPw ? "text" : "password"} required minLength={8} value={password}
                onChange={(e) => setPassword(e.target.value)}
                data-testid="register-password-input"
                className="bg-white border-[#E5E0D8] rounded-xl py-6 pr-12 focus:ring-2 focus:ring-[#81B29A]"
                placeholder="At least 8 characters" />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA89C] hover:text-[#1A201A] p-1"
                tabIndex={-1}>
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {password && (
              <div className="mt-2">
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4].map((level) => (
                    <div key={level} className={`h-1.5 flex-1 rounded-full transition-colors ${
                      pwStrength >= level ? (pwStrength <= 2 ? "bg-[#E07A5F]" : pwStrength === 3 ? "bg-[#E6A57E]" : "bg-[#81B29A]") : "bg-[#E5E0D8]"
                    }`} />
                  ))}
                </div>
                <p className="text-xs text-[#5C685C] mt-1.5">
                  {pwStrength <= 1 && "Weak — add uppercase, numbers, or special characters"}
                  {pwStrength === 2 && "Fair — add more variety"}
                  {pwStrength === 3 && "Good — almost there"}
                  {pwStrength >= 4 && "Strong password!"}
                </p>
              </div>
            )}
          </div>

          {error && (
            <div data-testid="register-error" className="text-sm text-[#E07A5F] bg-[#E07A5F]/10 border border-[#E07A5F]/30 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <Button type="submit" disabled={busy} data-testid="register-submit-btn"
            className="w-full bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7] rounded-full py-6 text-base">
            {busy ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="mt-8 text-sm text-[#5C685C]">
          Already have one?{" "}
          <Link to="/login" data-testid="goto-login-link" className="text-[#2D3E32] font-medium hover:text-[#4A5F4F]">
            Sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
