import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Logo, Eyebrow } from "@/components/app/Common";
import QuickAuditWidget from "@/components/app/QuickAuditWidget";
import { ArrowRight, Search, TrendingUp, ShieldCheck, Star, BarChart3, Target, Zap } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function CompetitorLanding() {
  usePageMeta({
    title: "Beat Your Competitors on Google — Free Competitor SEO Analysis",
    description: "See exactly what your top 3 competitors are doing to rank above you — and how to beat them. Free competitor SEO analysis."
  });
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Nav */}
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

      {/* Hero */}
      <section className="py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-6 lg:px-10 text-center">
          <Eyebrow className="mb-4 justify-center">Competitor Analysis</Eyebrow>
          <h1 className="font-display font-bold text-[#1A201A] text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.05]">
            Know exactly what your competitors are doing.<br/>Then do it better.
          </h1>
          <p className="mt-5 text-lg text-[#5C685C] max-w-2xl mx-auto leading-relaxed">
            Stop guessing why they outrank you. We'll audit your site AND your top 3 competitors — and show you the exact gaps.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#audit" className="bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7] rounded-full px-8 py-3.5 text-sm font-medium transition-colors inline-flex items-center gap-2">
              Compare my site <ArrowRight size={16} />
            </a>
            <Link to="/pricing" className="border border-[#E5E0D8] hover:border-[#2D3E32] text-[#1A201A] rounded-full px-8 py-3.5 text-sm font-medium transition-colors">
              See plans
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-[#F3F0E9] py-16 lg:py-24">
        <div className="max-w-5xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-12">
            <Eyebrow className="mb-4 justify-center">How it works</Eyebrow>
            <h2 className="font-display font-bold text-[#1A201A] text-3xl sm:text-4xl tracking-tight">
              Three steps to outranking your competition
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Search, title: "1. Audit your site", desc: "Paste your URL. Get your score. See every issue holding you back — in plain English." },
              { icon: Target, title: "2. Add your competitors", desc: "Enter up to 3 competitor URLs. We'll audit them the same way and show you the side-by-side comparison." },
              { icon: TrendingUp, title: "3. Close the gap", desc: "Get a prioritized list of exactly what to fix to beat each competitor. No guesswork." },
            ].map((step, i) => (
              <div key={i} className="bg-white border border-[#E5E0D8] rounded-2xl p-6 text-center">
                <div className="h-12 w-12 rounded-xl bg-[#81B29A]/15 flex items-center justify-center mx-auto">
                  <step.icon size={24} className="text-[#81B29A]" />
                </div>
                <div className="mt-4 font-display font-bold text-lg text-[#1A201A]">{step.title}</div>
                <p className="mt-2 text-sm text-[#5C685C] leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What you'll learn */}
      <section className="py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-12">
            <Eyebrow className="mb-4 justify-center">What you'll learn</Eyebrow>
            <h2 className="font-display font-bold text-[#1A201A] text-3xl sm:text-4xl tracking-tight">
              The exact gaps between you and your competitors
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { icon: BarChart3, title: "Score comparison", desc: "See your score vs each competitor's score. Know exactly how far behind (or ahead) you are." },
              { icon: Search, title: "Keyword gaps", desc: "Which keywords are they ranking for that you're not? Where are the easy wins?" },
              { icon: ShieldCheck, title: "Technical advantages", desc: "Are they faster? More mobile-friendly? Better structured data? We'll show you." },
              { icon: Zap, title: "Content gaps", desc: "What content do they have that you don't? What questions are they answering that you're not?" },
              { icon: Target, title: "Backlink profile", desc: "Who's linking to them? Which links could you also get?" },
              { icon: TrendingUp, title: "Quick wins", desc: "The 3-5 things you can fix today that will have the biggest impact on your rankings." },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4 bg-white border border-[#E5E0D8] rounded-2xl p-5">
                <div className="h-10 w-10 rounded-xl bg-[#81B29A]/15 flex items-center justify-center shrink-0">
                  <item.icon size={20} className="text-[#81B29A]" />
                </div>
                <div>
                  <div className="font-display font-bold text-[#1A201A]">{item.title}</div>
                  <p className="text-sm text-[#5C685C] mt-1">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Audit CTA */}
      <section id="audit" className="bg-[#F3F0E9] py-16 lg:py-24">
        <div className="max-w-2xl mx-auto px-6 lg:px-10 text-center">
          <h2 className="font-display font-bold text-[#1A201A] text-3xl sm:text-4xl tracking-tight">
            See how you compare
          </h2>
          <p className="mt-4 text-lg text-[#5C685C]">
            Start with a free audit of your site. Then add your competitors.
          </p>
          <div className="mt-8">
            <QuickAuditWidget />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E5E0D8] py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 text-center text-sm text-[#5C685C]">
          <div className="flex flex-wrap justify-center gap-6 mb-4">
            <Link to="/" className="hover:text-[#1A201A]">Home</Link>
            <Link to="/pricing" className="hover:text-[#1A201A]">Pricing</Link>
            <Link to="/blog" className="hover:text-[#1A201A]">Blog</Link>
            <Link to="/terms" className="hover:text-[#1A201A]">Terms</Link>
            <Link to="/privacy" className="hover:text-[#1A201A]">Privacy</Link>
          </div>
          <div>© {new Date().getFullYear()} Goodly. Helping small businesses get found.</div>
        </div>
      </footer>
    </div>
  );
}
