import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Logo, Eyebrow } from "@/components/app/Common";
import QuickAuditWidget from "@/components/app/QuickAuditWidget";
import ContentGraderWidget from "@/components/app/ContentGraderWidget";
import IndustrySelector from "@/components/app/IndustrySelector";
import FAQ from "@/components/app/FAQ";
import JsonLd, { organizationSchema, softwareAppSchema, faqSchema } from "@/components/app/JsonLd";
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
      <JsonLd data={organizationSchema()} />
      <JsonLd data={softwareAppSchema()} />
      <JsonLd data={faqSchema([
        { question: "What is an SEO audit?", answer: "An SEO audit scans your website for 50+ signals Google cares about — page titles, headings, mobile-friendliness, page speed, content quality, and more. You get a score and a plain-English list of exactly what to fix." },
        { question: "How long does it take to see results?", answer: "Most businesses see meaningful improvement in 3-6 months. But many see their Google Maps ranking improve within 2-4 weeks after fixing the basics like completing their Google Business Profile and fixing page titles and descriptions." },
        { question: "Do I need to know SEO to use Goodly?", answer: "No. Goodly is built for business owners, not SEO experts. Every issue comes with a plain-English explanation and step-by-step fix. If you can use Facebook, you can use Goodly." },
        { question: "Is there really a free plan?", answer: "Yes. The Free plan gives you 5 audits per month, 2 saved projects, and an AI action plan — forever. No credit card needed." },
        { question: "What's the difference between Starter and Pro?", answer: "Starter ($49/mo) includes 10 audits, 5 keyword trackers, weekly re-audits, and PDF reports. Pro ($149/mo) adds unlimited audits, 25 keyword trackers, daily re-audits, competitor analysis, and all social platforms." },
        { question: "What is the Concierge plan?", answer: "Concierge ($1,000/mo) is done-for-you SEO. A dedicated specialist does all the work — audits, content writing, Google Maps optimization, backlink outreach — with a page-one in 90 days guarantee." },
        { question: "Can I cancel anytime?", answer: "Yes. All paid plans are month-to-month with no long-term contracts. Cancel anytime from your Billing page. Your data is yours — export it anytime." },
        { question: "Does Goodly work for local businesses?", answer: "Absolutely. Goodly is built specifically for local businesses — restaurants, plumbers, dentists, salons, retail shops, lawyers, home services, real estate agents, and auto shops. We audit Google Maps, local SEO, and social media presence." },
      ])} />
      {/* Nav */}
      <header className="border-b border-[#E5E0D8] bg-[#FDFBF7] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-5 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-8 text-sm text-[#5C685C]">
            <a href="#how" className="hover:text-[#1A201A] transition-colors">How it works</a>
            <a href="#features" className="hover:text-[#1A201A] transition-colors">What you get</a>
            <Link to="/pricing" className="hover:text-[#1A201A] transition-colors">Pricing</Link>
            <Link to="/content-studio" className="hover:text-[#1A201A] transition-colors">Content Studio</Link>
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

      {/* main landmark — target of the skip link in index.html, and required
          by the landmark-one-main accessibility audit */}
      <main id="main-content">

      {/* Hero — Business outcome language + QuickAuditWidget */}
      <section className="relative overflow-hidden">
        <div className="organic-blob bg-[#81B29A]" style={{ width: 500, height: 500, top: -80, right: -120 }} />
        <div className="organic-blob bg-[#E07A5F]" style={{ width: 380, height: 380, bottom: -120, left: -100 }} />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 py-16 lg:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <Eyebrow className="mb-6 justify-center">For small businesses that want more customers</Eyebrow>
            <h1 className="font-display font-bold text-[#1A201A] text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.05]">
              Get found on Google.<br/>
              {/* #D4643F is the darkest terracotta that keeps the brand feel while
                  passing the 3:1 large-text contrast ratio on the cream bg */}
              <span className="text-[#D4643F]">Without learning SEO.</span>
            </h1>
            <p className="mt-6 text-lg text-[#5C685C] max-w-xl mx-auto leading-relaxed">
              See exactly why customers can't find your business online — and what to fix.
              One free audit. No jargon. No credit card.
            </p>

            {/* Quick Audit Widget — the #1 conversion tool */}
            <div className="mt-10">
              <QuickAuditWidget submitTestId="hero-cta-primary" />
            </div>

            {/* Trust signals */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-8 text-sm text-[#5C685C]">
              <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-[#81B29A]"/> Free forever plan</div>
              <div className="flex items-center gap-2"><Clock size={16} className="text-[#81B29A]"/> Results in 30 seconds</div>
              <div className="flex items-center gap-2"><Star size={16} className="text-[#81B29A]"/> No credit card required</div>
            </div>
          </div>
        </div>
      </section>

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
              { n: "01", icon: Search, t: "Paste your website", d: "Enter your URL. We check everything Google looks at — page titles, speed, mobile fit, and more. Takes 30 seconds." },
              { n: "02", icon: TrendingUp, t: "See what's holding you back", d: "Get a clear score and a plain-English list of exactly what to fix. No technical jargon. Just 'do this, get more customers.'" },
              { n: "03", icon: Phone, t: "Watch the phone ring", d: "Fix the issues, re-audit anytime, and track your progress as your visibility improves." },
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

      {/* Content Grader — lead gen magnet */}
      <section className="py-20 lg:py-28">
        <div className="max-w-3xl mx-auto px-6 lg:px-10">
          <ContentGraderWidget />
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
              body="We scan your site for 50+ signals Google cares about. Missing page titles? Slow pages? Broken links? We find them all and tell you exactly what to fix — in plain English."
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
              stat="Automated re-audits keep your score up to date"
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

      {/* Fabricated testimonials/case studies were removed — re-add this
          section once real customer stories (with permission) exist. */}
      <section id="stories" className="bg-[#2D3E32] py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 text-center">
          {/* !important — .label-eyebrow sets its own color which otherwise wins */}
          <Eyebrow className="mb-4 !text-[#81B29A] justify-center">Built for you</Eyebrow>
          <h2 className="font-display font-bold text-[#FDFBF7] text-3xl sm:text-4xl lg:text-5xl tracking-tight max-w-3xl mx-auto">
            Your business could be the next success story
          </h2>
          <p className="mt-5 text-[#FDFBF7]/70 text-lg max-w-2xl mx-auto leading-relaxed">
            Run a free audit, follow the plain-English action plan, and watch your visibility grow.
            We're just getting started — and so are you.
          </p>
          <div className="mt-8">
            <Button
              onClick={() => navigate("/audit")}
              className="bg-[#81B29A] hover:bg-[#6FA189] text-[#1A201A] rounded-full px-8 py-6 text-base font-medium"
            >
              Get your free audit <ArrowRight size={18} className="ml-2" />
            </Button>
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
            >Annual <span className="text-[10px] text-[#3F6B55] ml-1">Save 17%</span></button>
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
                "5 audits per month",
                "2 saved projects",
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

      </main>

      <footer className="border-t border-[#E5E0D8] py-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="font-display font-bold text-sm text-[#1A201A] mb-3">Product</div>
              <div className="space-y-2 text-sm text-[#5C685C]">
                <div><a href="#features" className="hover:text-[#1A201A]">Features</a></div>
                <div><Link to="/pricing" className="hover:text-[#1A201A]">Pricing</Link></div>
                <div><Link to="/audit" className="hover:text-[#1A201A]">Free Audit</Link></div>
                <div><Link to="/register" className="hover:text-[#1A201A]">Sign Up</Link></div>
              </div>
            </div>
            <div>
              <div className="font-display font-bold text-sm text-[#1A201A] mb-3">Free Tools</div>
              <div className="space-y-2 text-sm text-[#5C685C]">
                <div><Link to="/content-studio" className="hover:text-[#1A201A]">Content Studio</Link></div>
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
                <div><a href="mailto:hello@searchgoodly.com" className="hover:text-[#1A201A]">Contact</a></div>
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
        {/* #6B776B (not #9CA89C) — small text needs 4.5:1 contrast on white */}
        <div className="flex items-start gap-2 text-xs text-[#6B776B]">
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
      {/* bg #C4502F: white-on-terracotta needs 4.5:1 for small text */}
      {highlighted && (
        <div className="absolute -top-3 left-7 bg-[#C4502F] text-white text-xs font-medium tracking-wider uppercase px-3 py-1 rounded-full">
          {tag}
        </div>
      )}
      {!highlighted && <div className="label-eyebrow">{tag}</div>}
      <div className={`mt-3 ${highlighted ? "!text-[#FDFBF7]/80 label-eyebrow" : ""}`}>{highlighted && name}</div>
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
          highlighted ? "bg-[#C4502F] hover:bg-[#A63E20] text-white"
                      : "bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7]"
        }`}>
        {ctaLabel}
      </button>
    </div>
  );
}
