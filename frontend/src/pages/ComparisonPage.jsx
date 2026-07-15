import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo, Eyebrow } from "@/components/app/Common";
import QuickAuditWidget from "@/components/app/QuickAuditWidget";
import { ArrowRight, Check, X, Star, DollarSign, Zap, Users, BarChart3 } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

const COMPARISONS = {
  ahrefs: {
    name: "Ahrefs",
    price: "$129-449/mo",
    icon: "🔗",
    goodlyPrice: "$0-149/mo",
    hero: "Goodly vs Ahrefs: The SEO tool built for business owners, not SEO experts",
    subhero: "Ahrefs is powerful. But it's built for SEO professionals. Goodly gives you the same insights in plain English — at a fraction of the price.",
    comparison: [
      { feature: "Free tier", goodly: "✅ 5 audits/month", ahrefs: "❌ No free tier" },
      { feature: "Starting price", goodly: "$0", ahrefs: "$129/mo" },
      { feature: "Plain-English reports", goodly: "✅ No jargon", ahrefs: "❌ Technical language" },
      { feature: "Revenue impact estimates", goodly: "✅ Shows $ lost", ahrefs: "❌ Not available" },
      { feature: "Google Maps audit", goodly: "✅ Included", ahrefs: "❌ Not available" },
      { feature: "Social media audit", goodly: "✅ IG, TikTok, YouTube", ahrefs: "❌ Not available" },
      { feature: "AI visibility check", goodly: "✅ ChatGPT, Siri", ahrefs: "❌ Not available" },
      { feature: "Done-for-you option", goodly: "✅ Concierge $1K/mo", ahrefs: "❌ Not available" },
      { feature: "Backlink database", goodly: "❌ Not available", ahrefs: "✅ Best in class" },
      { feature: "Learning curve", goodly: "✅ 30 seconds", ahrefs: "❌ Weeks to learn" },
    ],
    verdict: "If you're an SEO professional managing 50+ sites, Ahrefs is the right tool. If you're a small business owner who just wants to know why you're not on page one — Goodly is built for you.",
  },
  semrush: {
    name: "Semrush",
    price: "$139-499/mo",
    icon: "📊",
    goodlyPrice: "$0-149/mo",
    hero: "Goodly vs Semrush: 55+ tools you'll never use vs the 5 you actually need",
    subhero: "Semrush has 55+ tools. Most small business owners use 2-3. Goodly focuses on what actually matters: getting you found on Google.",
    comparison: [
      { feature: "Free tier", goodly: "✅ 5 audits/month", semrush: "❌ Very limited free" },
      { feature: "Starting price", goodly: "$0", semrush: "$139/mo" },
      { feature: "Plain-English reports", goodly: "✅ No jargon", semrush: "❌ Data-heavy reports" },
      { feature: "Revenue impact estimates", goodly: "✅ Shows $ lost", semrush: "❌ Not available" },
      { feature: "Google Maps audit", goodly: "✅ Included", semrush: "❌ Separate tool" },
      { feature: "Social media audit", goodly: "✅ IG, TikTok, YouTube", semrush: "❌ Separate tool" },
      { feature: "AI visibility check", goodly: "✅ ChatGPT, Siri", semrush: "❌ Not available" },
      { feature: "Done-for-you option", goodly: "✅ Concierge $1K/mo", semrush: "❌ Not available" },
      { feature: "Competitor research", goodly: "✅ 3 competitors", semrush: "✅ Unlimited" },
      { feature: "Learning curve", goodly: "✅ 30 seconds", semrush: "❌ 100+ courses needed" },
    ],
    verdict: "Semrush is the Swiss Army knife of SEO — powerful but overwhelming. Goodly is the tool that says 'fix this, get more customers' without requiring a certification to understand it.",
  },
  ubersuggest: {
    name: "Ubersuggest",
    price: "$29-99/mo",
    icon: "💡",
    goodlyPrice: "$0-149/mo",
    hero: "Goodly vs Ubersuggest: AI-powered audits vs basic keyword data",
    subhero: "Ubersuggest is affordable but limited. Goodly covers 5 channels (Google, Maps, Social, AI, GBP) with AI-powered recommendations — not just keyword data.",
    comparison: [
      { feature: "Free tier", goodly: "✅ 5 audits/month", ubersuggest: "✅ Limited free" },
      { feature: "Starting price", goodly: "$0", ubersuggest: "$29/mo" },
      { feature: "AI-powered recommendations", goodly: "✅ Gemini 2.5", ubersuggest: "❌ Basic suggestions" },
      { feature: "Revenue impact estimates", goodly: "✅ Shows $ lost", ubersuggest: "❌ Not available" },
      { feature: "Google Maps audit", goodly: "✅ Included", ubersuggest: "❌ Not available" },
      { feature: "Social media audit", goodly: "✅ IG, TikTok, YouTube", ubersuggest: "❌ Not available" },
      { feature: "AI visibility check", goodly: "✅ ChatGPT, Siri", ubersuggest: "❌ Not available" },
      { feature: "Done-for-you option", goodly: "✅ Concierge $1K/mo", ubersuggest: "❌ Not available" },
      { feature: "Data accuracy", goodly: "✅ Real-time crawling", ubersuggest: "⚠️ Questionable data" },
      { feature: "Learning curve", goodly: "✅ 30 seconds", ubersuggest: "✅ Simple" },
    ],
    verdict: "Ubersuggest is a good budget option for basic keyword research. Goodly gives you AI-powered audits across 5 channels with revenue impact estimates — for less money on the free tier.",
  },
  seranking: {
    name: "SE Ranking",
    price: "$55-239/mo",
    icon: "📈",
    goodlyPrice: "$0-149/mo",
    hero: "Goodly vs SE Ranking: Business outcomes vs SEO metrics",
    subhero: "SE Ranking is a solid mid-range tool. But it still speaks in SEO metrics. Goodly speaks in business outcomes — 'fix this, get more customers.'",
    comparison: [
      { feature: "Free tier", goodly: "✅ 5 audits/month", seranking: "❌ 14-day trial only" },
      { feature: "Starting price", goodly: "$0", seranking: "$55/mo" },
      { feature: "Plain-English reports", goodly: "✅ No jargon", seranking: "❌ Technical reports" },
      { feature: "Revenue impact estimates", goodly: "✅ Shows $ lost", seranking: "❌ Not available" },
      { feature: "Google Maps audit", goodly: "✅ Included", seranking: "❌ Separate tool" },
      { feature: "Social media audit", goodly: "✅ IG, TikTok, YouTube", seranking: "❌ Not available" },
      { feature: "AI visibility check", goodly: "✅ ChatGPT, Siri", seranking: "❌ Not available" },
      { feature: "Done-for-you option", goodly: "✅ Concierge $1K/mo", seranking: "❌ Not available" },
      { feature: "White-label reports", goodly: "✅ Pro plan", seranking: "✅ Included" },
      { feature: "Learning curve", goodly: "✅ 30 seconds", seranking: "⚠️ Moderate" },
    ],
    verdict: "SE Ranking is a good tool for agencies that need white-label reports. Goodly is better for small business owners who want plain-English guidance and multi-channel coverage.",
  },
  agency: {
    name: "SEO Agency",
    price: "$500-3,000/mo",
    icon: "🏢",
    goodlyPrice: "$0-149/mo",
    hero: "Goodly vs Hiring an SEO Agency: $49/mo tool vs $1,500/mo agency",
    subhero: "Most small businesses don't need a $1,500/month agency. They need a tool that tells them what to fix in plain English. Here's the honest comparison.",
    comparison: [
      { feature: "Monthly cost", goodly: "$0-149/mo", agency: "$500-3,000/mo" },
      { feature: "Contract required", goodly: "✅ No contract", agency: "❌ 6-12 month contracts" },
      { feature: "Transparency", goodly: "✅ See every fix", agency: "❌ Black box reports" },
      { feature: "Revenue impact estimates", goodly: "✅ Shows $ lost", agency: "❌ Rarely provided" },
      { feature: "Speed to results", goodly: "✅ Instant audit", agency: "❌ Weeks to start" },
      { feature: "You control everything", goodly: "✅ Full control", agency: "❌ They control strategy" },
      { feature: "Done-for-you work", goodly: "✅ Concierge $1K/mo", agency: "✅ Included" },
      { feature: "Content writing", goodly: "✅ Concierge plan", agency: "✅ Usually included" },
      { feature: "Backlink outreach", goodly: "✅ Concierge plan", agency: "✅ Usually included" },
      { feature: "Risk of doing nothing", goodly: "✅ You see progress", agency: "❌ Common complaint" },
    ],
    verdict: "If you're willing to spend 2-4 hours/month on SEO, Goodly's $49 Starter plan is all you need. If you want someone to do everything, Goodly's Concierge plan ($1,000/mo) gives you a dedicated specialist for less than most agencies charge — with full transparency.",
  },
  localfalcon: {
    name: "Local Falcon",
    price: "$25-100/mo",
    icon: "🦅",
    goodlyPrice: "$0-149/mo",
    hero: "Goodly vs Local Falcon: Full SEO audit vs just rank tracking",
    subhero: "Local Falcon is great for visualizing local rankings. But it only does one thing. Goodly audits your entire online presence across 5 channels.",
    comparison: [
      { feature: "Free tier", goodly: "✅ 5 audits/month", localfalcon: "❌ No free tier" },
      { feature: "Starting price", goodly: "$0", localfalcon: "$25/mo" },
      { feature: "Full SEO audit", goodly: "✅ 50+ signals", localfalcon: "❌ Rank tracking only" },
      { feature: "Revenue impact estimates", goodly: "✅ Shows $ lost", localfalcon: "❌ Not available" },
      { feature: "Google Maps audit", goodly: "✅ Included", localfalcon: "✅ Core feature" },
      { feature: "Social media audit", goodly: "✅ IG, TikTok, YouTube", localfalcon: "❌ Not available" },
      { feature: "AI visibility check", goodly: "✅ ChatGPT, Siri", localfalcon: "❌ Not available" },
      { feature: "Done-for-you option", goodly: "✅ Concierge $1K/mo", localfalcon: "❌ Not available" },
      { feature: "Local rank visualization", goodly: "❌ Basic only", localfalcon: "✅ Best in class" },
      { feature: "Learning curve", goodly: "✅ 30 seconds", localfalcon: "✅ Simple" },
    ],
    verdict: "Local Falcon is the best tool for visualizing local rankings on a map. Goodly is better if you want a complete SEO audit with actionable fixes across all channels.",
  },
  brightlocal: {
    name: "BrightLocal",
    price: "$35-80/mo",
    icon: "📍",
    goodlyPrice: "$0-149/mo",
    hero: "Goodly vs BrightLocal: AI-powered audits vs citation building",
    subhero: "BrightLocal is built for local SEO agencies. Goodly is built for small business owners who want to understand and fix their own SEO.",
    comparison: [
      { feature: "Free tier", goodly: "✅ 5 audits/month", brightlocal: "❌ 14-day trial only" },
      { feature: "Starting price", goodly: "$0", brightlocal: "$35/mo" },
      { feature: "AI-powered recommendations", goodly: "✅ Gemini 2.5", brightlocal: "❌ Basic reports" },
      { feature: "Revenue impact estimates", goodly: "✅ Shows $ lost", brightlocal: "❌ Not available" },
      { feature: "Google Maps audit", goodly: "✅ Included", brightlocal: "✅ Core feature" },
      { feature: "Social media audit", goodly: "✅ IG, TikTok, YouTube", brightlocal: "❌ Not available" },
      { feature: "AI visibility check", goodly: "✅ ChatGPT, Siri", brightlocal: "❌ Not available" },
      { feature: "Done-for-you option", goodly: "✅ Concierge $1K/mo", brightlocal: "❌ Not available" },
      { feature: "Citation building", goodly: "❌ Not available", brightlocal: "✅ Best in class" },
      { feature: "Learning curve", goodly: "✅ 30 seconds", brightlocal: "⚠️ Agency-focused" },
    ],
    verdict: "BrightLocal is the best tool for building and managing local citations. Goodly is better for small business owners who want a complete picture of their online visibility with plain-English fixes.",
  },
  moz: {
    name: "Moz Pro",
    price: "$99-599/mo",
    icon: "🔍",
    goodlyPrice: "$0-149/mo",
    hero: "Goodly vs Moz: Modern AI-powered audits vs a tool that hasn't changed in years",
    subhero: "Moz was great 5 years ago. But the SEO world has changed — AI assistants, social media, Google Maps. Goodly covers all the channels your customers actually use.",
    comparison: [
      { feature: "Free tier", goodly: "✅ 5 audits/month", moz: "❌ 30-day trial only" },
      { feature: "Starting price", goodly: "$0", moz: "$99/mo" },
      { feature: "AI-powered recommendations", goodly: "✅ Gemini 2.5", moz: "❌ Basic suggestions" },
      { feature: "Revenue impact estimates", goodly: "✅ Shows $ lost", moz: "❌ Not available" },
      { feature: "Google Maps audit", goodly: "✅ Included", moz: "❌ Moz Local separate" },
      { feature: "Social media audit", goodly: "✅ IG, TikTok, YouTube", moz: "❌ Not available" },
      { feature: "AI visibility check", goodly: "✅ ChatGPT, Siri", moz: "❌ Not available" },
      { feature: "Done-for-you option", goodly: "✅ Concierge $1K/mo", moz: "❌ Not available" },
      { feature: "Domain Authority", goodly: "❌ Not available", moz: "✅ DA metric" },
      { feature: "Learning curve", goodly: "✅ 30 seconds", moz: "⚠️ Moderate" },
    ],
    verdict: "Moz pioneered SEO tools, but they've fallen behind. Goodly covers more channels, uses modern AI, and costs less — with a free tier Moz doesn't offer.",
  },
};

export default function ComparisonPage({ tool }) {
  const data = COMPARISONS[tool];
  if (!data) return null;

  usePageMeta({
    title: `Goodly vs ${data.name} — Which SEO Tool is Right for Your Small Business?`,
    description: `Compare Goodly vs ${data.name}: pricing, features, and which is better for small businesses. ${data.hero}`,
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
          <Eyebrow className="mb-4 justify-center">Goodly vs {data.name}</Eyebrow>
          <h1 className="font-display font-bold text-[#1A201A] text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.05]">
            {data.hero}
          </h1>
          <p className="mt-5 text-lg text-[#5C685C] max-w-2xl mx-auto leading-relaxed">
            {data.subhero}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#audit" className="bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7] rounded-full px-8 py-3.5 text-sm font-medium transition-colors inline-flex items-center gap-2">
              Try Goodly free <ArrowRight size={16} />
            </a>
            <Link to="/pricing" className="border border-[#E5E0D8] hover:border-[#2D3E32] text-[#1A201A] rounded-full px-8 py-3.5 text-sm font-medium transition-colors">
              See pricing
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[#F3F0E9] py-16 lg:py-24">
        <div className="max-w-3xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-10">
            <h2 className="font-display font-bold text-[#1A201A] text-3xl sm:text-4xl tracking-tight">
              Feature comparison
            </h2>
          </div>
          <div className="bg-white border border-[#E5E0D8] rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E5E0D8] bg-[#FDFBF7]">
                  <th className="text-left p-4 font-display font-bold text-sm text-[#1A201A]">Feature</th>
                  <th className="p-4 font-display font-bold text-sm text-[#2D3E32] bg-[#81B29A]/10 text-center">Goodly</th>
                  <th className="p-4 font-display font-bold text-sm text-[#5C685C] text-center">{data.name}</th>
                </tr>
              </thead>
              <tbody>
                {data.comparison.map((row, i) => {
                  const competitorVal = row[tool] || "";
                  return (
                    <tr key={i} className={`border-b border-[#E5E0D8] ${i % 2 === 0 ? "bg-white" : "bg-[#FDFBF7]"}`}>
                      <td className="p-3.5 text-sm text-[#1A201A]">{row.feature}</td>
                      <td className="p-3.5 text-sm text-center bg-[#81B29A]/5">{row.goodly}</td>
                      <td className="p-3.5 text-sm text-center">{competitorVal}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="mt-8 bg-[#2D3E32] rounded-2xl p-6 text-center">
            <p className="text-[#FDFBF7]/80 text-sm leading-relaxed">{data.verdict}</p>
          </div>
        </div>
      </section>

      <section id="audit" className="py-16 lg:py-24">
        <div className="max-w-2xl mx-auto px-6 lg:px-10 text-center">
          <h2 className="font-display font-bold text-[#1A201A] text-3xl sm:text-4xl tracking-tight">
            See why small businesses choose Goodly
          </h2>
          <p className="mt-4 text-lg text-[#5C685C]">
            Free audit. No credit card. See your score in 30 seconds.
          </p>
          <div className="mt-8">
            <QuickAuditWidget />
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
