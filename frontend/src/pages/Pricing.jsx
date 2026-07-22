import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Logo, Eyebrow } from "@/components/app/Common";
import FAQ from "@/components/app/FAQ";
import JsonLd, { webAppSchema } from "@/components/app/JsonLd";
import { ArrowRight, Check, X, ShieldCheck, Star, Clock, Zap, Users, BarChart3, Globe, MessageCircle, FileText, RefreshCw, Search, MapPin, Share2, Bot, TrendingUp } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import { toast } from "sonner";

export default function Pricing() {
  usePageMeta({
    title: "Pricing — Goodly SEO for Small Businesses",
    description: "Plans from free to done-for-you. See which Goodly plan fits your small business. No contracts, cancel anytime."
  });
  const navigate = useNavigate();
  const { user } = useAuth();
  const [annual, setAnnual] = useState(true);
  const [checkingOut, setCheckingOut] = useState(null);

  const handleUpgrade = async (planId) => {
    if (!user) {
      navigate("/register");
      return;
    }
    if (planId === "free") {
      navigate("/register");
      return;
    }
    if (planId === "concierge") {
      navigate("/app/concierge/onboarding");
      return;
    }
    setCheckingOut(planId);
    try {
      const { data } = await api.post("/billing/checkout", { 
        plan_id: planId,
        origin_url: window.location.origin 
      });
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Could not start checkout. Please try again.");
      }
    } catch (e) {
      toast.error("Checkout failed. Please try again or contact support.");
    } finally {
      setCheckingOut(null);
    }
  };

  const plans = [
    {
      id: "free",
      name: "Free",
      price: 0,
      annualPrice: 0,
      tag: "Get started",
      cta: "Start free",
      ctaLink: "/register",
      features: [
        "5 SEO audits per month",
        "2 saved projects",
        "AI action plan",
        "Basic score tracking",
        "No credit card needed",
      ],
      missing: [
        "PDF reports",
        "Scheduled re-audits",
        "Keyword rank tracking",
        "Competitor analysis",
        "Social media audit",
        "AI visibility check",
        "Google Maps audit",
      ],
    },
    {
      id: "starter",
      name: "Starter",
      price: 49,
      annualPrice: 41,
      tag: "Most popular",
      highlighted: true,
      cta: "Try 7 days free",
      ctaLink: "/register",
      features: [
        "10 SEO audits per month",
        "3 saved projects",
        "5 keyword rank trackers",
        "Weekly auto re-audits",
        "PDF reports",
        "Instagram audit",
        "Email support (24h)",
      ],
      missing: [
        "Competitor analysis",
        "AI visibility check",
        "Google Maps audit",
        "TikTok / YouTube audit",
        "White-label PDFs",
        "Priority support",
      ],
    },
    {
      id: "pro",
      name: "Pro",
      price: 149,
      annualPrice: 124,
      tag: "Growing business",
      cta: "Try 7 days free",
      ctaLink: "/register",
      features: [
        "Unlimited SEO audits",
        "15 saved projects",
        "25 keyword rank trackers",
        "Daily auto re-audits",
        "Competitor analysis (3 competitors)",
        "All social platforms",
        "AI visibility monitoring",
        "Google Maps audit",
        "White-label PDF reports",
        "Priority email support",
      ],
      missing: [
        "Done-for-you work",
        "Dedicated specialist",
        "Content writing",
        "Backlink outreach",
      ],
    },
    {
      id: "concierge",
      name: "Concierge",
      price: 1000,
      annualPrice: 1000,
      tag: "Done for you",
      cta: "Talk to us",
      ctaLink: "/app/concierge/onboarding",
      features: [
        "We do all the work",
        "Dedicated SEO specialist",
        "Unlimited everything",
        "Weekly rank reports",
        "Monthly client PDF",
        "We write your content",
        "Google Maps + citations",
        "Backlink outreach",
        "Page-one in 90 days guarantee",
      ],
      missing: [],
    },
  ];

  const comparisonFeatures = [
    { name: "SEO audits / month", free: "5", starter: "10", pro: "Unlimited", concierge: "Unlimited" },
    { name: "Saved projects", free: "2", starter: "3", pro: "15", concierge: "25" },
    { name: "Keyword tracking", free: "—", starter: "5 keywords", pro: "25 keywords", concierge: "Unlimited" },
    { name: "Auto re-audits", free: "—", starter: "Weekly", pro: "Daily", concierge: "Daily" },
    { name: "PDF reports", free: "—", starter: "✓", pro: "✓", concierge: "✓" },
    { name: "Competitor analysis", free: "—", starter: "—", pro: "3 competitors", concierge: "Unlimited" },
    { name: "Social media audit", free: "—", starter: "Instagram", pro: "All platforms", concierge: "All platforms" },
    { name: "AI visibility", free: "—", starter: "—", pro: "✓", concierge: "✓" },
    { name: "Google Maps audit", free: "—", starter: "—", pro: "✓", concierge: "✓" },
    { name: "White-label PDFs", free: "—", starter: "—", pro: "✓", concierge: "✓" },
    { name: "Done-for-you work", free: "—", starter: "—", pro: "—", concierge: "✓" },
    { name: "Dedicated specialist", free: "—", starter: "—", pro: "—", concierge: "✓" },
    { name: "Content writing", free: "—", starter: "—", pro: "—", concierge: "✓" },
    { name: "Backlink outreach", free: "—", starter: "—", pro: "—", concierge: "✓" },
    { name: "90-day page-one guarantee", free: "—", starter: "—", pro: "—", concierge: "✓" },
    { name: "Support", free: "—", starter: "Email (24h)", pro: "Priority email", concierge: "Slack + email" },
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <JsonLd data={webAppSchema("Goodly Pricing", "Plans from free to done-for-you. See which Goodly plan fits your small business. No contracts, cancel anytime.", "/pricing")} />
      {/* Nav */}
      <header className="border-b border-[#E5E0D8] bg-[#FDFBF7] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-5 flex items-center justify-between">
          <Link to="/"><Logo /></Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-[#5C685C]">
            <Link to="/" className="hover:text-[#1A201A] transition-colors">Home</Link>
            <Link to="/audit" className="hover:text-[#1A201A] transition-colors">Free audit</Link>
            <Link to="/blog" className="hover:text-[#1A201A] transition-colors">Blog</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-[#1A201A] hover:text-[#4A5F4F]">Sign in</Link>
            <Button onClick={() => navigate("/register")} className="bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7] rounded-full px-5">
              Start free
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-6 lg:px-10 text-center">
          <Eyebrow className="mb-4 justify-center">Pricing</Eyebrow>
          <h1 className="font-display font-bold text-[#1A201A] text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.05]">
            Plans for every stage<br/>of your business
          </h1>
          <p className="mt-5 text-lg text-[#5C685C] max-w-2xl mx-auto leading-relaxed">
            From free self-serve to done-for-you. Every plan includes AI-powered audits.
            No contracts. Cancel anytime. Upgrade or downgrade whenever you want.
          </p>

          {/* Trial offer banner */}
          <div className="mt-6 inline-flex items-center gap-2 bg-[#FEF3C7] border border-[#F59E0B]/30 rounded-full px-5 py-2.5 text-sm">
            <span className="text-[#92400E] font-medium">🎉 Limited time: 7-day free trial on Starter & Pro</span>
          </div>

          {/* Annual savings calculator */}
          <div className="mt-4 inline-flex items-center gap-2 bg-[#81B29A]/10 border border-[#81B29A]/30 rounded-full px-5 py-2.5 text-sm">
            <span className="text-[#2D3E32] font-medium">💰 Save 17% with annual billing — that's $98/year on Starter, $298/year on Pro</span>
          </div>

          {/* Trust signals */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-8 text-sm text-[#5C685C]">
            <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-[#81B29A]"/> Free forever plan</div>
            <div className="flex items-center gap-2"><Clock size={16} className="text-[#81B29A]"/> 7-day free trial on paid plans</div>
            <div className="flex items-center gap-2"><Star size={16} className="text-[#81B29A]"/> No credit card for free plan</div>
            <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-[#81B29A]"/> 14-day money-back guarantee</div>
          </div>
        </div>
      </section>

      {/* Plan Cards */}
      <section className="pb-16 lg:pb-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          {/* Annual/Monthly Toggle */}
          <div className="flex items-center justify-center gap-3 mb-10">
            <button
              onClick={() => setAnnual(false)}
              className={`text-sm font-medium px-4 py-2 rounded-full transition-colors ${!annual ? "bg-[#2D3E32] text-white" : "text-[#5C685C] hover:text-[#1A201A]"}`}
            >Monthly</button>
            <button
              onClick={() => setAnnual(true)}
              className={`text-sm font-medium px-4 py-2 rounded-full transition-colors ${annual ? "bg-[#2D3E32] text-white" : "text-[#5C685C] hover:text-[#1A201A]"}`}
            >Annual <span className="text-[10px] text-[#81B29A] ml-1">Save 17%</span></button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {plans.map((plan) => {
              const displayPrice = annual && plan.annualPrice ? plan.annualPrice : plan.price;
              const period = annual && plan.annualPrice && plan.price > 0 ? "/mo (billed annually)" : plan.price > 0 ? "/mo" : "";
              return (
                <div key={plan.id}
                  className={`relative rounded-3xl p-8 border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg flex flex-col ${
                    plan.highlighted ? "bg-[#2D3E32] border-[#2D3E32] text-[#FDFBF7]" : "bg-white border-[#E5E0D8] text-[#1A201A]"
                  }`}>
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-7 bg-[#E07A5F] text-[#FDFBF7] text-xs font-medium tracking-wider uppercase px-3 py-1 rounded-full">
                      {plan.tag}
                    </div>
                  )}
                  {!plan.highlighted && <div className="label-eyebrow">{plan.tag}</div>}
                  <div className={`mt-3 ${plan.highlighted ? "!text-[#FDFBF7]/80 label-eyebrow" : ""}`}>{plan.highlighted && plan.name}</div>
                  {!plan.highlighted && <div className="font-display font-bold text-2xl mt-1">{plan.name}</div>}
                  <div className="mt-4 font-display">
                    <span className="text-5xl font-bold">${displayPrice}</span>
                    {plan.price > 0 && <span className={`text-sm ml-1 ${plan.highlighted ? "text-[#FDFBF7]/70" : "text-[#5C685C]"}`}>{period}</span>}
                    {annual && plan.annualPrice && plan.price > 0 && (
                      <div className={`text-xs mt-1 ${plan.highlighted ? "text-[#81B29A]" : "text-[#81B29A]"}`}>
                        ${plan.price * 12}/yr billed monthly
                      </div>
                    )}
                  </div>
                  <ul className="mt-6 space-y-2.5 flex-1">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check size={16} className="text-[#81B29A] shrink-0 mt-0.5" />
                        <span className={plan.highlighted ? "text-[#FDFBF7]/95" : ""}>{f}</span>
                      </li>
                    ))}
                    {plan.missing.map((f, i) => (
                      <li key={`m-${i}`} className="flex items-start gap-2 text-sm opacity-40">
                        <X size={16} className="shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={checkingOut === plan.id}
                    className={`mt-8 w-full rounded-full py-3 text-sm font-medium transition-colors text-center block ${
                      plan.highlighted ? "bg-[#E07A5F] hover:bg-[#C86A51] text-[#FDFBF7]"
                                        : "bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7]"
                    } disabled:opacity-60 disabled:cursor-not-allowed`}>
                    {checkingOut === plan.id ? "Redirecting..." : plan.cta}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="bg-[#F3F0E9] py-16 lg:py-24">
        <div className="max-w-5xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-12">
            <Eyebrow className="mb-4 justify-center">Compare plans</Eyebrow>
            <h2 className="font-display font-bold text-[#1A201A] text-3xl sm:text-4xl tracking-tight">
              Every feature, side by side
            </h2>
          </div>

          <div className="bg-white border border-[#E5E0D8] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E5E0D8] bg-[#FDFBF7]">
                    <th className="text-left py-4 px-6 font-display font-bold text-[#1A201A]">Feature</th>
                    <th className="py-4 px-4 text-center font-display font-bold text-[#1A201A]">Free</th>
                    <th className="py-4 px-4 text-center font-display font-bold text-[#1A201A] bg-[#2D3E32]/5">Starter</th>
                    <th className="py-4 px-4 text-center font-display font-bold text-[#1A201A]">Pro</th>
                    <th className="py-4 px-4 text-center font-display font-bold text-[#1A201A]">Concierge</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonFeatures.map((row, i) => (
                    <tr key={i} className={`border-b border-[#E5E0D8] last:border-0 ${i % 2 === 0 ? "bg-white" : "bg-[#FDFBF7]"}`}>
                      <td className="py-3.5 px-6 text-[#1A201A] font-medium">{row.name}</td>
                      <td className="py-3.5 px-4 text-center text-[#5C685C]">{row.free}</td>
                      <td className="py-3.5 px-4 text-center text-[#5C685C] bg-[#2D3E32]/5">{row.starter}</td>
                      <td className="py-3.5 px-4 text-center text-[#5C685C]">{row.pro}</td>
                      <td className="py-3.5 px-4 text-center text-[#5C685C]">{row.concierge}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Who is each plan for */}
      <section className="py-16 lg:py-24">
        <div className="max-w-5xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-12">
            <Eyebrow className="mb-4 justify-center">Which plan is right for you?</Eyebrow>
            <h2 className="font-display font-bold text-[#1A201A] text-3xl sm:text-4xl tracking-tight">
              Find your fit
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: Search, title: "Free — Just getting started", desc: "Perfect if you want to see where you stand. Run a few audits, get your score, and understand what needs fixing. No commitment, no credit card.", who: "Solo business owners testing the waters" },
              { icon: TrendingUp, title: "Starter — Ready to grow", desc: "You know SEO matters and you're ready to put in the work. Track your keywords, get weekly re-audits, and download PDF reports to share with your team.", who: "Small businesses with 1-3 locations" },
              { icon: BarChart3, title: "Pro — Serious about ranking", desc: "You want to dominate your local market. Unlimited audits, daily tracking, competitor analysis, and white-label reports. Everything you need to outrank the competition.", who: "Growing businesses and marketing teams" },
              { icon: Users, title: "Concierge — We do it for you", desc: "You want results without doing the work. A dedicated SEO specialist handles everything — audits, content, backlinks, citations. Page-one in 90 days or you don't pay month 4.", who: "Busy owners who want results, not tools" },
            ].map((item, i) => (
              <div key={i} className="bg-white border border-[#E5E0D8] rounded-2xl p-8 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                <div className="h-11 w-11 rounded-xl bg-[#81B29A]/15 flex items-center justify-center text-[#81B29A]">
                  <item.icon size={22} strokeWidth={1.75} />
                </div>
                <div className="mt-5 font-display font-bold text-lg text-[#1A201A]">{item.title}</div>
                <p className="mt-2 text-[#5C685C] leading-relaxed">{item.desc}</p>
                <div className="mt-4 pt-4 border-t border-[#E5E0D8]">
                  <div className="text-xs text-[#9CA89C] uppercase tracking-wider font-medium">Best for</div>
                  <div className="text-sm text-[#1A201A] font-medium mt-1">{item.who}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-[#F3F0E9] py-16 lg:py-24">
        <div className="max-w-3xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-12">
            <Eyebrow className="mb-4 justify-center">Questions</Eyebrow>
            <h2 className="font-display font-bold text-[#1A201A] text-3xl sm:text-4xl tracking-tight">
              Frequently asked
            </h2>
          </div>
          <div className="space-y-4">
            {[
              { q: "Can I switch plans anytime?", a: "Yes. Upgrade, downgrade, or cancel anytime. If you upgrade mid-month, we prorate the difference. If you downgrade, the change takes effect at the end of your billing period." },
              { q: "Is there a free trial?", a: "The Free plan is free forever — no credit card needed. The Starter and Pro plans come with a 7-day free trial so you can test all the features before committing." },
              { q: "What's the 90-day page-one guarantee?", a: "On the Concierge plan, if we don't get you to page one of Google for your target keywords within 90 days, your 4th month is free. We'll keep working until you're there. Terms apply — your site must be indexable and not penalized." },
              { q: "Do you offer refunds?", a: "We offer a 14-day money-back guarantee on all paid plans. If you're not satisfied, email us and we'll refund your payment — no questions asked." },
              { q: "Can I use Goodly for multiple websites?", a: "Yes. Each plan includes a number of saved projects (websites). The Free plan includes 2, Starter includes 3, Pro includes 15, and Concierge includes 25." },
              { q: "What's an 'audit' exactly?", a: "An audit scans your website for 50+ SEO signals — meta tags, headings, content quality, page speed, mobile-friendliness, SSL, broken links, and more. You get a score out of 100 and a plain-English list of what to fix." },
              { q: "Do I need technical skills?", a: "No. Goodly is built for small business owners, not SEO experts. Every issue comes with a simple explanation and step-by-step fix. If you're on Concierge, we do it all for you." },
              { q: "How does the Concierge plan work?", a: "After signing up, you'll be matched with a dedicated SEO specialist. They'll audit your site, create a 90-day plan, and start working on fixes, content, and outreach. You'll get weekly updates and a monthly report." },
            ].map((faq, i) => (
              <details key={i} className="bg-white border border-[#E5E0D8] rounded-2xl group">
                <summary className="px-8 py-5 cursor-pointer font-medium text-[#1A201A] flex items-center justify-between list-none">
                  {faq.q}
                  <span className="text-[#81B29A] group-open:rotate-45 transition-transform text-lg ml-4">+</span>
                </summary>
                <p className="px-8 pb-5 text-[#5C685C] leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* JSON-LD FAQ Schema for rich results */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          { "@type": "Question", "name": "Can I switch plans anytime?", "acceptedAnswer": { "@type": "Answer", "text": "Yes. Upgrade, downgrade, or cancel anytime. If you upgrade mid-month, we prorate the difference." }},
          { "@type": "Question", "name": "Is there a free trial?", "acceptedAnswer": { "@type": "Answer", "text": "The Free plan is free forever. Starter and Pro plans come with a 7-day free trial." }},
          { "@type": "Question", "name": "Do you offer refunds?", "acceptedAnswer": { "@type": "Answer", "text": "We offer a 14-day money-back guarantee on all paid plans." }},
          { "@type": "Question", "name": "Do I need technical skills?", "acceptedAnswer": { "@type": "Answer", "text": "No. Goodly is built for small business owners, not SEO experts. Every issue comes with a simple explanation and step-by-step fix." }},
          { "@type": "Question", "name": "How does the Concierge plan work?", "acceptedAnswer": { "@type": "Answer", "text": "You'll be matched with a dedicated SEO specialist who audits your site, creates a 90-day plan, and handles fixes, content, and outreach." }},
        ]
      })}} />

      {/* Final CTA */}
      <section className="py-16 lg:py-24">
        <div className="max-w-3xl mx-auto px-6 lg:px-10 text-center">
          <h2 className="font-display font-bold text-[#1A201A] text-3xl sm:text-4xl lg:text-5xl tracking-tight">
            Ready to get found?
          </h2>
          <p className="mt-4 text-lg text-[#5C685C]">
            Start with a free audit. See exactly where you stand. No credit card needed.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/audit" className="bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7] rounded-full px-8 py-3.5 text-sm font-medium transition-colors inline-flex items-center gap-2">
              Run a free audit <ArrowRight size={16} />
            </Link>
            <Link to="/register" className="border border-[#E5E0D8] hover:border-[#2D3E32] text-[#1A201A] rounded-full px-8 py-3.5 text-sm font-medium transition-colors">
              Create free account
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E5E0D8] py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="font-display font-bold text-sm text-[#1A201A] mb-3">Product</div>
              <div className="space-y-2 text-sm text-[#5C685C]">
                <div><Link to="/" className="hover:text-[#1A201A]">Home</Link></div>
                <div><Link to="/pricing" className="hover:text-[#1A201A]">Pricing</Link></div>
                <div><Link to="/audit" className="hover:text-[#1A201A]">Free Audit</Link></div>
                <div><Link to="/register" className="hover:text-[#1A201A]">Sign Up</Link></div>
              </div>
            </div>
            <div>
              <div className="font-display font-bold text-sm text-[#1A201A] mb-3">Free Tools</div>
              <div className="space-y-2 text-sm text-[#5C685C]">
                <div><Link to="/tools/meta-tag-checker" className="hover:text-[#1A201A]">Meta Tag Checker</Link></div>
                <div><Link to="/tools/page-speed" className="hover:text-[#1A201A]">Page Speed Test</Link></div>
                <div><Link to="/tools/mobile-friendly" className="hover:text-[#1A201A]">Mobile-Friendly Test</Link></div>
                <div><Link to="/tools" className="hover:text-[#1A201A]">All Free Tools</Link></div>
              </div>
            </div>
            <div>
              <div className="font-display font-bold text-sm text-[#1A201A] mb-3">Resources</div>
              <div className="space-y-2 text-sm text-[#5C685C]">
                <div><Link to="/blog" className="hover:text-[#1A201A]">Blog</Link></div>
                <div><Link to="/help" className="hover:text-[#1A201A]">Help Center</Link></div>
                <div><Link to="/changelog" className="hover:text-[#1A201A]">Changelog</Link></div>
                <div><Link to="/status" className="hover:text-[#1A201A]">Status</Link></div>
              </div>
            </div>
            <div>
              <div className="font-display font-bold text-sm text-[#1A201A] mb-3">Company</div>
              <div className="space-y-2 text-sm text-[#5C685C]">
                <div><Link to="/terms" className="hover:text-[#1A201A]">Terms</Link></div>
                <div><Link to="/privacy" className="hover:text-[#1A201A]">Privacy</Link></div>
                <div><a href="mailto:hello@searchgoodly.com" className="hover:text-[#1A201A]">Contact</a></div>
              </div>
            </div>
          </div>
          <div className="pt-6 border-t border-[#E5E0D8] text-center text-sm text-[#5C685C]">
            © {new Date().getFullYear()} Goodly. Helping small businesses get found.
          </div>
        </div>
      </footer>
    </div>
  );
}
