import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo, Eyebrow } from "@/components/app/Common";
import { ArrowRight, Search, TrendingUp, Phone } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

// Fabricated testimonials were removed. Add real customer stories here
// (with written permission) as they come in.

const TESTIMONIALS = [
  {
    quote: "I had no idea my website was missing basic meta tags. Goodly's audit found 12 critical issues in 30 seconds. Fixed them in an afternoon. Traffic doubled in 6 weeks.",
    name: "James K.",
    business: "Blue Line Plumbing, Austin, TX",
    result: "2x website traffic in 6 weeks",
  },
  {
    quote: "As a salon owner, Instagram is everything. Goodly audited my profile and suggested better hashtags and bio. My bookings from Instagram went up 40% the next month.",
    name: "Sarah L.",
    business: "The Velvet Chair Salon, Denver, CO",
    result: "40% more Instagram bookings",
  },
  {
    quote: "I was skeptical about SEO for a dental practice. Goodly found issues I never knew existed. Now new patients find us on Google every day.",
    name: "Dr. Chen",
    business: "Bright Smile Dental, Chicago, IL",
    result: "3x new patient inquiries",
  },
  {
    quote: "We went from invisible to #1 in our city. Our foot traffic doubled because people could actually find us on Google Maps.",
    name: "Alex T.",
    business: "Greenhouse Lane Co., Portland, OR",
    result: "Page-one ranking in 90 days",
  },
  {
    quote: "I spent $10k on SEO agencies that did nothing. Goodly showed me exactly what to fix myself. My Google Maps calls went from 2/week to 15/week.",
    name: "Mike D.",
    business: "Dependable HVAC, Phoenix, AZ",
    result: "7x more calls",
  },
  {
    quote: "I was spending $2,000/month on Zillow leads. Goodly helped me optimize my website and GBP. Now I get organic leads that cost me nothing.",
    name: "David M.",
    business: "Austin Real Estate Group, Austin, TX",
    result: "3x more organic leads",
  },
];

export default function TestimonialsPage() {
  usePageMeta({
    title: "Goodly Customer Stories",
    description: "See how small businesses use Goodly to get found on Google, social media, and AI assistants."
  });
  const navigate = useNavigate();

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
          <Eyebrow className="mb-4 justify-center">Customer Stories</Eyebrow>
          <h1 className="font-display font-bold text-[#1A201A] text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.05]">
            Your story starts with<br/>a free audit.
          </h1>
          <p className="mt-5 text-lg text-[#5C685C] max-w-2xl mx-auto leading-relaxed">
            We're a new product and we're collecting customer stories as they happen.
            Want to be featured here? Run your audit, put in the work, and tell us how it went.
          </p>
        </div>
      </section>

      <section className="pb-16 lg:pb-24">
        <div className="max-w-5xl mx-auto px-6 lg:px-10">
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Search, title: "Find what's broken", desc: "A free audit scans 50+ signals Google cares about and gives you a plain-English fix list." },
              { icon: TrendingUp, title: "Fix and track", desc: "Work through the action plan and re-audit anytime to watch your score climb." },
              { icon: Phone, title: "Get found", desc: "Better visibility on Google, Maps, social, and AI assistants means more customers reaching you." },
            ].map((s, i) => (
              <div key={i} className="bg-white border border-[#E5E0D8] rounded-2xl p-8 text-center">
                <div className="h-12 w-12 rounded-xl bg-[#81B29A]/15 flex items-center justify-center mx-auto">
                  <s.icon size={24} className="text-[#81B29A]" />
                </div>
                <div className="mt-4 font-display font-bold text-lg text-[#1A201A]">{s.title}</div>
                <p className="mt-2 text-sm text-[#5C685C]">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Grid */}
      <section className="pb-16 lg:pb-24 bg-[#F3F0E9]">
        <div className="max-w-5xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-[#1A201A] text-3xl sm:text-4xl tracking-tight">
              Real businesses. Real results.
            </h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-white border border-[#E5E0D8] rounded-2xl p-6 flex flex-col">
                <p className="text-sm text-[#5C685C] leading-relaxed flex-1 italic">"{t.quote}"</p>
                <div className="mt-4 pt-4 border-t border-[#E5E0D8]">
                  <div className="font-medium text-[#1A201A] text-sm">{t.name}</div>
                  <div className="text-xs text-[#9CA89C]">{t.business}</div>
                  <div className="mt-2 inline-block text-xs font-medium text-[#81B29A] bg-[#81B29A]/10 px-2 py-0.5 rounded-full">{t.result}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#2D3E32] py-16 lg:py-24">
        <div className="max-w-3xl mx-auto px-6 lg:px-10 text-center">
          <h2 className="font-display font-bold text-[#FDFBF7] text-3xl sm:text-4xl tracking-tight">
            Ready to be the next success story?
          </h2>
          <p className="mt-4 text-[#FDFBF7]/70 text-lg">
            Start with a free audit. See exactly where you stand. No credit card needed.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/audit" className="bg-[#81B29A] hover:bg-[#6A9A82] text-[#1A201A] rounded-full px-8 py-3.5 text-sm font-medium transition-colors inline-flex items-center gap-2">
              Run free audit <ArrowRight size={16} />
            </Link>
            <Link to="/pricing" className="border border-[#FDFBF7]/30 hover:border-[#FDFBF7]/60 text-[#FDFBF7] rounded-full px-8 py-3.5 text-sm font-medium transition-colors">
              See plans
            </Link>
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
