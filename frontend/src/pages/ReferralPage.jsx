import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo, Eyebrow } from "@/components/app/Common";
import { ArrowRight, Gift, Users, Star, Share2, Copy, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { FRONTEND_URL } from "@/lib/env";
import { toast } from "sonner";

export default function ReferralPage() {
  usePageMeta({
    title: "Refer a Friend — Get Free Goodly Credits",
    description: "Give a friend a free SEO audit. When they sign up, you both get rewards. Share Goodly with other small business owners."
  });
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  // Public share link — signed-in users get a user-specific link in the app.
  const referralLink = `${FRONTEND_URL}/audit?ref=share`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <header className="border-b border-[#E5E0D8] bg-[#FDFBF7] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-5 flex items-center justify-between">
          <Link to="/"><Logo /></Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-[#5C685C]">
            <Link to="/" className="hover:text-[#1A201A]">Home</Link>
            <Link to="/pricing" className="hover:text-[#1A201A]">Pricing</Link>
            <Link to="/blog" className="hover:text-[#1A201A]">Blog</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-[#1A201A] hover:text-[#4A5F4F]">Sign in</Link>
            <Button onClick={() => navigate("/register")} className="bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7] rounded-full px-5">Start free</Button>
          </div>
        </div>
      </header>

      <section className="py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-6 lg:px-10 text-center">
          <Eyebrow className="mb-4 justify-center">Referral Program</Eyebrow>
          <h1 className="font-display font-bold text-[#1A201A] text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.05]">
            Help a friend get found.
          </h1>
          <p className="mt-5 text-lg text-[#5C685C] max-w-2xl mx-auto leading-relaxed">
            Share Goodly with another small business owner. They get a free SEO audit — no signup needed.
          </p>
        </div>
      </section>

      <section className="pb-16 lg:pb-24">
        <div className="max-w-3xl mx-auto px-6 lg:px-10">
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { icon: Share2, title: "1. Share", desc: "Send your friend a link to Goodly's free audit. Takes 5 seconds." },
              { icon: Star, title: "2. They audit", desc: "They paste their URL, get their score, and see what to fix." },
              { icon: Gift, title: "3. They grow", desc: "They get an AI action plan and can start fixing issues right away." },
            ].map((step, i) => (
              <div key={i} className="bg-white border border-[#E5E0D8] rounded-2xl p-6 text-center">
                <div className="h-12 w-12 rounded-xl bg-[#81B29A]/15 flex items-center justify-center mx-auto">
                  <step.icon size={24} className="text-[#81B29A]" />
                </div>
                <div className="mt-4 font-display font-bold text-lg text-[#1A201A]">{step.title}</div>
                <p className="mt-2 text-sm text-[#5C685C]">{step.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-white border border-[#E5E0D8] rounded-2xl p-8 text-center">
            <h2 className="font-display font-bold text-xl text-[#1A201A] mb-4">Your referral link</h2>
            <div className="flex items-center gap-2 max-w-md mx-auto">
              <div className="flex-1 bg-[#FDFBF7] border border-[#E5E0D8] rounded-xl py-3 px-4 text-sm text-[#5C685C] truncate">
                {referralLink}
              </div>
              <Button onClick={copyLink} className="bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7] rounded-full px-4 shrink-0">
                {copied ? <CheckCircle2 size={16} /> : <Copy size={16} />}
              </Button>
            </div>
            <p className="mt-4 text-xs text-[#9CA89C]">Share this link anywhere — email, text, social media.</p>
          </div>

          <div className="mt-8 bg-[#F3F0E9] border border-[#E5E0D8] rounded-2xl p-6">
            <h3 className="font-display font-bold text-[#1A201A] mb-3">What your friend gets</h3>
            <div className="space-y-2 text-sm text-[#5C685C]">
              <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#81B29A]" /> A free SEO audit (no signup needed)</div>
              <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#81B29A]" /> An AI-generated action plan with prioritized fixes</div>
              <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#81B29A]" /> 5 free audits per month on the free plan</div>
              <div className="flex items-center gap-2"><CheckCircle2 size={14} className="text-[#81B29A]" /> Formal referral rewards are coming soon</div>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#E5E0D8] py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 text-center text-sm text-[#5C685C]">
          <div className="flex flex-wrap justify-center gap-6 mb-4">
            <Link to="/" className="hover:text-[#1A201A]">Home</Link>
            <Link to="/pricing" className="hover:text-[#1A201A]">Pricing</Link>
            <Link to="/blog" className="hover:text-[#1A201A]">Blog</Link>
          </div>
          <div>© {new Date().getFullYear()} Goodly.</div>
        </div>
      </footer>
    </div>
  );
}
