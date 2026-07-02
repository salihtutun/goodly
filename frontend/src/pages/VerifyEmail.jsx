import { Link } from "react-router-dom";
import { Logo } from "@/components/app/Common";
import { Mail } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function VerifyEmail() {
  usePageMeta({ title: "Verify your email", description: "Check your inbox to verify your email address." });
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
        <p className="mt-4 text-[#5C685C]">We sent a verification link to your email. Click it to activate your account.</p>
        <p className="mt-2 text-sm text-[#5C685C]">Didn't get it? Check spam or <Link to="/login" className="text-[#2D3E32] underline">try logging in</Link> to resend.</p>
      </div>
    </div>
  );
}
