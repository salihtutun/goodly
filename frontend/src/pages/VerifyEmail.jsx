import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Logo } from "@/components/app/Common";
import { Button } from "@/components/ui/button";
import { Mail, ArrowRight, Loader2 } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";

export default function VerifyEmail() {
  usePageMeta({ title: "Verify your email", description: "Check your inbox to verify your email address." });
  const { user } = useAuth();
  const navigate = useNavigate();
  const [resending, setResending] = useState(false);

  const resend = async () => {
    setResending(true);
    try {
      await api.post("/auth/resend-verification");
      toast.success("Verification email sent — check your inbox and spam folder.");
    } catch {
      toast.error("Couldn't resend right now. Try again in a minute, or email hello@searchgoodly.com.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <Link to="/" className="inline-block mb-8"><Logo /></Link>
        <div className="flex justify-center mb-8">
          <div className="h-24 w-24 rounded-full bg-[#81B29A]/10 flex items-center justify-center">
            <Mail size={48} className="text-[#81B29A]" strokeWidth={1.5} />
          </div>
        </div>
        <h1 className="font-display font-bold text-4xl text-[#1A201A] tracking-tight">Check your inbox</h1>
        <p className="mt-4 text-[#5C685C]">
          We sent a verification link{user?.email ? ` to ${user.email}` : ""}. Click it when you can —
          you can keep using Goodly in the meantime.
        </p>

        {/* Session already exists after register — don't trap owners here */}
        <Button
          onClick={() => navigate(user ? "/app" : "/login")}
          className="mt-8 bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7] rounded-full px-8"
        >
          Continue to your account <ArrowRight size={16} className="ml-2" />
        </Button>

        <p className="mt-6 text-sm text-[#5C685C]">
          Didn't get it? Check spam, or{" "}
          {user ? (
            <button
              type="button"
              onClick={resend}
              disabled={resending}
              className="text-[#2D3E32] underline underline-offset-2 disabled:opacity-50"
            >
              {resending ? (
                <span className="inline-flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Sending…</span>
              ) : (
                "resend the email"
              )}
            </button>
          ) : (
            <Link to="/login" className="text-[#2D3E32] underline">log in</Link>
          )}
          {" "}to try again.
        </p>
      </div>
    </div>
  );
}
