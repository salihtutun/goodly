import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/app/Common";
import { toast } from "sonner";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function Login() {
  usePageMeta({ title: "Sign in", description: "Sign in to your Goodly account to manage your visibility across Google, social media, and AI assistants." });
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError("");
    const res = await login(email.trim(), password);
    setBusy(false);
    if (res.ok) {
      toast.success("Welcome back");
      navigate("/app");
    } else {
      setError(res.error);
    }
  };

  const useDemo = () => {
    setEmail("demo@smallbiz.com"); setPassword("demo1234");
  };

  return (
    <AuthShell>
      <div className="w-full max-w-md">
        <Link to="/"><Logo /></Link>
        <h1 className="mt-12 font-display font-bold text-4xl text-[#1A201A] tracking-tight">Welcome back</h1>
        <p className="mt-2 text-[#5C685C]">Sign in to keep growing.</p>

        <form onSubmit={submit} className="mt-10 space-y-5" data-testid="login-form">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[#1A201A]">Email</Label>
            <Input
              id="email" type="email" required value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-testid="login-email-input"
              className="bg-white border-[#E5E0D8] rounded-xl py-6 focus:ring-2 focus:ring-[#81B29A]"
              placeholder="you@business.com"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-[#1A201A]">Password</Label>
            <Input
              id="password" type="password" required value={password}
              onChange={(e) => setPassword(e.target.value)}
              data-testid="login-password-input"
              className="bg-white border-[#E5E0D8] rounded-xl py-6 focus:ring-2 focus:ring-[#81B29A]"
            />
          </div>

          {error && (
            <div data-testid="login-error" className="text-sm text-[#E07A5F] bg-[#E07A5F]/10 border border-[#E07A5F]/30 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <Button
            type="submit" disabled={busy}
            data-testid="login-submit-btn"
            className="w-full bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7] rounded-full py-6 text-base"
          >
            {busy ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <div className="mt-8 flex items-center justify-between text-sm">
          <button onClick={useDemo} data-testid="use-demo-btn" className="text-[#5C685C] hover:text-[#E07A5F]">
            Use demo account
          </button>
          <Link to="/register" data-testid="goto-register-link" className="text-[#2D3E32] font-medium hover:text-[#4A5F4F]">
            Create account →
          </Link>
        </div>

        <div className="mt-4 text-center">
          <Link to="/forgot-password" className="text-sm text-[#5C685C] hover:text-[#2D3E32] hover:underline">
            Forgot password?
          </Link>
        </div>
      </div>
    </AuthShell>
  );
}

export function AuthShell({ children }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:block relative">
        <img
          src="https://images.unsplash.com/photo-1547106429-11e696f446d9?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200"
          alt="Plant under sunlight"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#2D3E32]/40 via-transparent to-[#2D3E32]/20" />
        <div className="absolute bottom-12 left-12 right-12 text-[#FDFBF7]">
          <div className="label-eyebrow text-[#FDFBF7]/70 mb-3">Goodly</div>
          <p className="font-display text-3xl leading-snug tracking-tight max-w-md">
            Done-for-you SEO for startups. We get you to #1 on Google. Your phone starts ringing.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center p-8 lg:p-16 bg-[#FDFBF7]">
        {children}
      </div>
    </div>
  );
}
