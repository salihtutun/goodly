import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Logo, Eyebrow } from "@/components/app/Common";
import QuickAuditWidget from "@/components/app/QuickAuditWidget";
import CaseStudies from "@/components/app/CaseStudies";
import IndustrySelector from "@/components/app/IndustrySelector";
import TrustBadges from "@/components/app/TrustBadges";
import MediaMentions from "@/components/app/MediaMentions";
import FAQ from "@/components/app/FAQ";
import { ArrowRight, Search, MapPin, Share2, Bot, ShieldCheck, Star, Quote, TrendingUp, Users, Clock, Phone, ArrowUp } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function Landing() {
  usePageMeta({
    title: "Get more customers from Google — Free website audit",
    description: "See how your small business ranks on Google, Instagram, and AI assistants. Free instant audit. No signup needed."
  });
  const navigate = useNavigate();
  const [annual, setAnnual] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState("restaurant");

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Nav */}
      <header className="border-b border-[#E5E0D8] bg-[#FDFBF7] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-5 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-8 text-sm text-[#5C685C]">
            <a href="#how" className="hover:text-[#1A201A] transition-colors">How it works</a>
            <a href="#features" className="hover:text-[#1A201A] transition-colors">What you get</a>
            <a href="#pricing" className="hover:text-[#1A201A] transition-colors">Pricing</a>
            <a href="#stories" className="hover:text-[#1A201A] transition-colors">Stories</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm text-[#1A201A] hover:text-[#4A5F4F]" data-testid="nav-login-link">Sign in</Link>
            <Button
              data-testid="cta-get-started"
              onClick={() => navigate("/register")}
              className="bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7] rounded-full px-5"
            >
              Start free
            </Button>
          </div>
        </div>
      </header>

      {/* Hero — Business outcome language + QuickAuditWidget */}
      <section className="relative overflow-hidden">
        <div className="organic-blob bg-[#81B29A]" style={{ width: 500, height: 500, top: -80, right: -120 }} />
        <div className="organic-blob bg-[#E07A5F]" style={{ width: 380, height: 380, bottom: -120, left: -100 }} />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 py-16 lg:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <Eyebrow className="mb-6 justify-center">For small businesses that want more customers</Eyebrow>
            <h1 className="font-display font-bold text-[#1A201A] text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.05]">
              Get found on Google.<br/>
              <span className="text-[#E07A5F]">Without learning SEO.</span>
            </h1>
            <p className="mt-6 text-lg text-[#5C685C] max-w-xl mx-auto leading-relaxed">
              See exactly why customers can't find your business online — and what to fix.
              One free audit. No jargon. No credit card.
            </p>

            {/* Quick Audit Widget — the #1 conversion tool */}
            <div className="mt-10">
              <QuickAuditWidget />
            </div>

            {/* Trust signals */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-sm text-[#5C685C]">
              <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-[#81B29A]"/> Free forever plan</div>
              <div className="flex items-center gap-2"><Clock size={16} className="text-[#81B29A]"/> Results in 30 seconds</div>
              <div className="flex items-center gap-2"><Star size={16} className="text-[#81B29A]"/> 4.9/5 from small business owners</div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges — Social proof counters */}
      <TrustBadges />

      {/* Media Mentions — As seen on */}
      <MediaMentions />

      {/* How it works — 3 simple steps */}
      <section id="how" className="bg-[#F3F0E9] py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="max-w-2xl">
            <Eyebrow className="mb-4">How it works</Eyebrow>
            <h2 className="font-display font-bold text-[#1A201A] text-3xl sm:text-4xl lg:text-5xl tracking-tight">
              Three steps. More customers. No headaches.
            </h2>
          </div>
          <div className="mt-14 grid md:grid-cols-3 gap-6">
            {[
              { n: "01", icon: Search, t: "Paste your website", d: "Enter your URL. We scan everything Google looks at — meta tags, speed, mobile-friendliness, and more. Takes 30 seconds." },
              { n: "02", icon: TrendingUp, t: "See what's holding you back", d: "Get a clear score and a plain-English list of exactly what to fix. No technical jargon. Just 'do this, get more customers.'" },
              { n: "03", icon: Phone, t: "Watch the phone ring", d: "Fix the issues, re-audit anytime. Track your progress. Our customers see 40-200% more traffic in 90 days." },
            ].map((s) => (
              <div key={s.n} className="bg-white border border-[#E5E0D8] rounded-2xl p-8 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                <div className="h-12 w-12 rounded-xl bg-[#81B29A]/15 flex items-center justify-center text-[#81B29A]">
                  <s.icon size={24} strokeWidth={1.75} />
                </div>
                <div className="mt-6 font-display font-bold text-xl text-[#1A201A]">{s.t}</div>
                <div className="mt-2 text-[#5C685C] leading-relaxed">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features — Business outcomes, not technical features */}
      <section id="features" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="max-w-2xl">
            <Eyebrow className="mb-4">What you get</Eyebrow>
            <h2 className="font-display font-bold text-[#1A201A] text-3xl sm:text-4xl lg:text-5xl tracking-tight">
              Everything you need to bring customers to your door
            </h2>
            <p className="mt-4 text-[#5C685C] text-lg">
              We check every place your customers look for you — and tell you exactly how to show up there.
            </p>
          </div>
          <div className="mt-14 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            <OutcomeCard
              icon={Search}
              accent="#81B29A"
              title="Show up on Google"
              body="We scan your site for 50+ signals Google cares about. Missing meta tags? Slow pages? Broken links? We find them all and tell you exactly what to fix — in plain English."
              stat="Businesses on page one get 92% of all search traffic"
            />
            <OutcomeCard
              icon={MapPin}
              accent="#E07A5F"
              title="Get found on Google Maps"
              body="When someone searches 'best pizza near me,' does your business show up? We audit your Google Business Profile and tell you how to appear in the local 3-pack."
              stat="76% of local searches result in a visit within 24 hours"
            />
            <OutcomeCard
              icon={Share2}
              accent="#2D3E32"
              title="Grow on Instagram & TikTok"
              body="Your customers are scrolling right now. We audit your social profiles, suggest better bios, captions, and hashtags — so they stop scrolling and start following."
              stat="Social media influences 74% of purchase decisions"
            />
            <OutcomeCard
              icon={Bot}
              accent="#81B29A"
              title="Show up in ChatGPT & Siri"
              body="When someone asks AI 'who's the best plumber in Austin,' does your business get mentioned? We check your AI visibility and tell you how to get recommended."
              stat="AI assistants now influence 1 in 4 local searches"
            />
            <OutcomeCard
              icon={TrendingUp}
              accent="#E07A5F"
              title="Track your progress"
              body="Run audits anytime. Watch your score climb. See exactly which fixes moved the needle. Get weekly email updates so you never have to remember to check."
              stat="Customers who audit monthly see 3x faster improvement"
            />
            <OutcomeCard
              icon={Users}
              accent="#2D3E32"
              title="Beat your competitors"
              body="See how you stack up against the businesses ranking above you. We show you what they're doing right — and how to do it better. No guesswork."
              stat="Know exactly what your top 3 competitors are doing"
            />
          </div>
        </div>
      </section>

      {/* Industry Selector — Choose your business type */}
      <IndustrySelector selected={selectedIndustry} onSelect={setSelectedIndustry} />

      {/* Case Studies — Industry-specific results */}
      <CaseStudies filter={selectedIndustry} />

      {/* Testimonials — Real stories */}
      <section id="stories" className="bg-[#2D3E32] py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <Eyebrow className="mb-4 text-[#81B29A]">Real results</Eyebrow>
          <h2 className="font-display font-bold text-[#FDFBF7] text-3xl sm:text-4xl lg:text-5xl tracking-tight max-w-3xl">
            Small businesses like yours are getting found
          </h2>
          <div className="mt-14 grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "I run a tiny pottery studio. Goodly showed me my Google listing was invisible. Three months later I'm #1 in my city and my phone won't stop ringing.",
                name: "Maya R.",
                role: "Owner, Clay & Kiln Studio",
                result: "#1 on Google in 83 days",
                img: "https://images.unsplash.com/photo-1507914464562-6ff4ac29692f?crop=entropy&cs=srgb&fm=jpg&q=85&w=200",
              },
              {
                quote: "I had no idea my website was missing basic meta tags. Goodly's audit found 12 critical issues in 30 seconds. Fixed them in an afternoon. Traffic doubled in 6 weeks.",
                name: "James K.",
                role: "Owner, Blue Line Plumbing",
                result: "2x website traffic in 6 weeks",
                img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=srgb&fm=jpg&q=85&w=200",
              },
              {
                quote: "As a salon owner, Instagram is everything. Goodly audited my profile and suggested better hashtags and bio. My bookings from Instagram went up 40% the next month.",
                name: "Sarah L.",
                role: "Owner, The Velvet Chair Salon",
                result: "40% more Instagram bookings",
                img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?crop=entropy&cs=srgb&fm=jpg&q=85&w=200",
              },
            ].map((t, i) => (
              <div key={i} className="bg-[#3A4F3F] rounded-2xl p-8 flex flex-col">
                <Quote className="text-[#81B29A]/40" size={28} />
                <p className="mt-4 text-[#FDFBF7]/90 leading-relaxed flex-1">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-6 pt-6 border-t border-[#FDFBF7]/10">
                  <div className="flex items-center gap-3">
                    <img src={t.img} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <div className="text-[#FDFBF7] font-medium text-sm">{t.name}</div>
                      <div className="text-[#FDFBF7]/60 text-xs">{t.role}</div>
                    </div>
                  </div>
                  <div className="mt-3 inline-flex items-center gap-1.5 bg-[#81B29A]/20 text-[#81B29A] text-xs font-medium px-2.5 py-1 rounded-full">
                    <TrendingUp size={12} /> {t.result}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-[#F3F0E9] py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <Eyebrow className="mb-4">Pricing</Eyebrow>
          <h2 className="font-display font-bold text-[#1A201A] text-3xl sm:text-4xl lg:text-5xl tracking-tight max-w-3xl">
            Start free. Upgrade when you're ready.
          </h2>
          <p className="mt-5 text-[#5C685C] text-lg max-w-2xl">
            Every plan includes AI-powered audits. No contracts. Cancel anytime.
          </p>

          {/* Annual/Monthly Toggle */}
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              onClick={() => setAnnual(false)}
              className={`text-sm font-medium px-4 py-2 rounded-full transition-colors ${!annual ? "bg-[#2D3E32] text-white" : "text-[#5C685C] hover:text-[#1A201A]"}`}
            >Monthly</button>
            <button
              onClick={() => setAnnual(true)}
              className={`text-sm font-medium px-4 py-2 rounded-full transition-colors ${annual ? "bg-[#2D3E32] text-white" : "text-[#5C685C] hover:text-[#1A201A]"}`}
            >Annual <span className="text-[10px] text-[#81B29A] ml-1">Save 17%</span></button>
          </div>

          <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl">
            <PricingCard
              testId="pricing-free"
              name="Free"
              price={0}
              annualPrice={0}
              annual={annual}
              tag="Get started"
              features={[
                "3 audits per month",
                "1 saved project",
                "AI action plan",
                "No credit card needed",
              ]}
              onClick={() => navigate("/register")}
              ctaLabel="Start free"
            />
            <PricingCard
              testId="pricing-starter"
              name="Starter"
              price={49}
              annualPrice={41}
              annual={annual}
              tag="Most popular"
              highlighted
              features={[
                "10 audits per month",
                "3 saved projects",
                "Track 5 keywords on Google",
                "Weekly auto re-audits",
                "PDF reports",
                "Instagram audit",
                "Email support",
              ]}
              onClick={() => navigate("/register")}
              ctaLabel="Try 7 days free"
            />
            <PricingCard
              testId="pricing-pro"
              name="Pro"
              price={149}
              annualPrice={124}
              annual={annual}
              tag="Growing business"
              features={[
                "Unlimited audits",
                "15 saved projects",
                "Track 25 keywords",
                "Daily auto re-audits",
                "Beat your competitors",
                "All social platforms",
                "AI visibility + Google Maps",
                "White-label PDFs",
                "Priority support",
              ]}
              onClick={() => navigate("/register")}
              ctaLabel="Try 7 days free"
            />
            <PricingCard
              testId="pricing-concierge"
              name="Concierge"
              price={1000}
              annualPrice={1000}
              annual={annual}
              tag="Done for you"
              features={[
                "We do all the work",
                "Dedicated SEO specialist",
                "Unlimited everything",
                "Weekly rank reports",
                "Monthly client PDF",
                "We write your content",
                "Google Maps + citations",
                "Backlink outreach",
                "Page-one in 90 days guarantee",
              ]}
              onClick={() => navigate("/register")}
              ctaLabel="Talk to us"
            />
          </div>
        </div>
      </section>

      {/* FAQ */}
      <FAQ />

      {/* Final CTA */}
      <section className="py-20 lg:py-28">
        <div className="max-w-4xl mx-auto px-6 lg:px-10 text-center">
          <h2 className="font-display font-bold text-[#1A201A] text-3xl sm:text-4xl lg:text-5xl tracking-tight">
            Your customers are searching.<br/>Are they finding you?
          </h2>
          <p className="mt-5 text-lg text-[#5C685C]">
            Free audit in 30 seconds. See exactly where you stand.
          </p>
          <div className="mt-10 max-w-xl mx-auto">
            <QuickAuditWidget />
          </div>
        </div>
      </section>

      <footer className="border-t border-[#E5E0D8] py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="font-display font-bold text-sm text-[#1A201A] mb-3">Product</div>
              <div className="space-y-2 text-sm text-[#5C685C]">
                <div><a href="#features" className="hover:text-[#1A201A]">Features</a></div>
                <div><a href="#pricing" className="hover:text-[#1A201A]">Pricing</a></div>
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
                <div><Link to="/tools/keyword-density" className="hover:text-[#1A201A]">Keyword Density</Link></div>
              </div>
            </div>
            <div>
              <div className="font-display font-bold text-sm text-[#1A201A] mb-3">Resources</div>
              <div className="space-y-2 text-sm text-[#5C685C]">
                <div><Link to="/blog" className="hover:text-[#1A201A]">Blog</Link></div>
                <div><a href="mailto:hello@goodly.app" className="hover:text-[#1A201A]">Contact</a></div>
              </div>
            </div>
            <div>
              <div className="font-display font-bold text-sm text-[#1A201A] mb-3">Legal</div>
              <div className="space-y-2 text-sm text-[#5C685C]">
                <div><Link to="/terms" className="hover:text-[#1A201A]">Terms</Link></div>
                <div><Link to="/privacy" className="hover:text-[#1A201A]">Privacy</Link></div>
                <div><Link to="/sitemap.xml" className="hover:text-[#1A201A]">Sitemap</Link></div>
              </div>
            </div>
          </div>
          <div className="pt-6 border-t border-[#E5E0D8] text-center text-sm text-[#5C685C]">
            © {new Date().getFullYear()} Goodly. Helping small businesses get found.
          </div>
        </div>
      </footer>

      {/* Back to top button */}
      <BackToTop />
    </div>
  );
}

function BackToTop() {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 500);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (!visible) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 left-6 z-50 bg-white border border-[#E5E0D8] rounded-full p-3 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
      aria-label="Back to top"
    >
      <ArrowUp size={20} className="text-[#2D3E32]" />
    </button>
  );
}

function OutcomeCard({ icon: Icon, title, body, stat, accent }) {
  return (
    <div className="bg-white border border-[#E5E0D8] rounded-2xl p-8 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 flex flex-col">
      <div className="h-11 w-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${accent}18`, color: accent }}>
        <Icon size={22} strokeWidth={1.75} />
      </div>
      <div className="mt-5 font-display font-bold text-lg text-[#1A201A]">{title}</div>
      <div className="mt-2 text-[#5C685C] text-sm leading-relaxed flex-1">{body}</div>
      <div className="mt-4 pt-4 border-t border-[#E5E0D8]">
        <div className="flex items-start gap-2 text-xs text-[#9CA89C]">
          <TrendingUp size={14} className="text-[#81B29A] shrink-0 mt-0.5" />
          {stat}
        </div>
      </div>
    </div>
  );
}

function PricingCard({ name, price, annualPrice, annual, tag, features, onClick, ctaLabel, highlighted, testId }) {
  const displayPrice = annual && annualPrice ? annualPrice : price;
  const period = annual && annualPrice && price > 0 ? "/ month (billed annually)" : price > 0 ? "/ month" : "";
  return (
    <div data-testid={testId}
      className={`relative rounded-3xl p-8 border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
        highlighted ? "bg-[#2D3E32] border-[#2D3E32] text-[#FDFBF7]" : "bg-white border-[#E5E0D8] text-[#1A201A]"
      }`}>
      {highlighted && (
        <div className="absolute -top-3 left-7 bg-[#E07A5F] text-[#FDFBF7] text-xs font-medium tracking-wider uppercase px-3 py-1 rounded-full">
          {tag}
        </div>
      )}
      {!highlighted && <div className="label-eyebrow">{tag}</div>}
      <div className={`mt-3 ${highlighted ? "text-[#FDFBF7]/80 label-eyebrow" : ""}`}>{highlighted && name}</div>
      {!highlighted && <div className="font-display font-bold text-2xl mt-1">{name}</div>}
      <div className="mt-4 font-display">
        <span className="text-5xl font-bold">${displayPrice}</span>
        {price > 0 && <span className={`text-sm ml-1 ${highlighted ? "text-[#FDFBF7]/70" : "text-[#5C685C]"}`}>{period}</span>}
        {annual && annualPrice && price > 0 && (
          <div className={`text-xs mt-1 ${highlighted ? "text-[#81B29A]" : "text-[#81B29A]"}`}>
            ${price * 12}/yr billed monthly
          </div>
        )}
      </div>
      <ul className="mt-6 space-y-2.5">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <ShieldCheck size={16} className="text-[#81B29A] shrink-0 mt-0.5" />
            <span className={highlighted ? "text-[#FDFBF7]/95" : ""}>{f}</span>
          </li>
        ))}
      </ul>
      <button onClick={onClick}
        className={`mt-8 w-full rounded-full py-3 text-sm font-medium transition-colors ${
          highlighted ? "bg-[#E07A5F] hover:bg-[#C86A51] text-[#FDFBF7]"
                      : "bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7]"
        }`}>
        {ctaLabel}
      </button>
    </div>
  );
}
