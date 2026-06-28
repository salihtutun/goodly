import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo, Eyebrow } from "@/components/app/Common";
import { ArrowRight, Gauge, KeySquare, Sparkles, Users, ShieldCheck, LineChart, Leaf, Quote } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Nav */}
      <header className="border-b border-[#E5E0D8] bg-[#FDFBF7] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-5 flex items-center justify-between">
          <Logo />
          <nav className="hidden md:flex items-center gap-8 text-sm text-[#5C685C]">
            <a href="#features" className="hover:text-[#1A201A] transition-colors">Features</a>
            <a href="#pricing" className="hover:text-[#1A201A] transition-colors">Pricing</a>
            <a href="#how" className="hover:text-[#1A201A] transition-colors">How it works</a>
            <a href="#testimonials" className="hover:text-[#1A201A] transition-colors">Stories</a>
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

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="organic-blob bg-[#81B29A]" style={{ width: 500, height: 500, top: -80, right: -120 }} />
        <div className="organic-blob bg-[#E07A5F]" style={{ width: 380, height: 380, bottom: -120, left: -100 }} />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 py-20 lg:py-28 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7">
            <Eyebrow className="mb-6">SEO for small business owners</Eyebrow>
            <h1 className="font-display font-bold text-[#1A201A] text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.05]">
              Grow your shop the way <span className="text-[#E07A5F]">plants do.</span> Slowly, but unmistakably.
            </h1>
            <p className="mt-6 text-lg text-[#5C685C] max-w-xl leading-relaxed">
              RootedSEO is the friendly framework that audits your website, finds the keywords your customers
              actually type, and tells you — in plain English — exactly what to fix this week.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Button
                data-testid="hero-cta-primary"
                onClick={() => navigate("/register")}
                className="bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7] rounded-full px-7 py-6 text-base"
              >
                Audit my website free <ArrowRight className="ml-2" size={18} />
              </Button>
              <Button
                data-testid="hero-cta-secondary"
                variant="outline"
                onClick={() => navigate("/login")}
                className="rounded-full border-[#2D3E32] text-[#2D3E32] hover:bg-[#F3F0E9] px-7 py-6 text-base bg-transparent"
              >
                Sign in
              </Button>
            </div>
            <div className="mt-10 flex items-center gap-6 text-sm text-[#5C685C]">
              <div className="flex items-center gap-2"><ShieldCheck size={16} className="text-[#81B29A]"/>No credit card</div>
              <div className="flex items-center gap-2"><Leaf size={16} className="text-[#81B29A]"/>Built for small teams</div>
            </div>
          </div>
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden border border-[#E5E0D8] shadow-sm">
              <img
                src="https://images.unsplash.com/photo-1531058240690-006c446962d8?crop=entropy&cs=srgb&fm=jpg&q=85&w=900"
                alt="Small business owner in her plant shop"
                className="w-full h-[460px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2D3E32]/40 to-transparent"/>
              <div className="absolute bottom-4 left-4 right-4 bg-[#FDFBF7]/95 backdrop-blur rounded-2xl p-4 border border-[#E5E0D8]">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#81B29A] flex items-center justify-center text-[#FDFBF7] font-bold">87</div>
                  <div>
                    <div className="text-sm font-medium text-[#1A201A]">Greenhouse Lane Co.</div>
                    <div className="text-xs text-[#5C685C]">SEO health, up 32 points this month</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features - Bento */}
      <section id="features" className="bg-[#F3F0E9] py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="max-w-2xl">
            <Eyebrow className="mb-4">What you get</Eyebrow>
            <h2 className="font-display font-bold text-[#1A201A] text-3xl sm:text-4xl lg:text-5xl tracking-tight">
              Everything a small business needs. None of the SEO jargon.
            </h2>
          </div>
          <div className="mt-14 grid grid-cols-1 md:grid-cols-6 gap-5">
            <FeatureCard
              span="md:col-span-4"
              icon={Gauge}
              accent="#81B29A"
              title="One-click website audit"
              body="We crawl your site like Google does and score the things that matter — meta tags, headings, mobile, speed, links — into a single health number."
            />
            <FeatureCard
              span="md:col-span-2"
              icon={KeySquare}
              accent="#E07A5F"
              title="Keyword research"
              body="AI surfaces the low-competition phrases your real customers search for."
            />
            <FeatureCard
              span="md:col-span-2"
              icon={Sparkles}
              accent="#E07A5F"
              title="AI meta tag writer"
              body="Drop in your business, get title + description that fits Google's character limits."
            />
            <FeatureCard
              span="md:col-span-4"
              icon={Users}
              accent="#81B29A"
              title="Competitor analysis"
              body="See what the shop down the street is doing well — and where you can quietly beat them in search."
            />
            <FeatureCard
              span="md:col-span-3"
              icon={LineChart}
              accent="#2D3E32"
              title="Project history"
              body="Save every website, every audit. Watch your scores climb over weeks and months."
            />
            <FeatureCard
              span="md:col-span-3"
              icon={ShieldCheck}
              accent="#2D3E32"
              title="Plain-English fixes"
              body="No 'optimize your DOM' nonsense. Just clear next steps, ranked by impact."
            />
          </div>
        </div>
      </section>

      {/* How */}
      <section id="how" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <Eyebrow className="mb-4">How it works</Eyebrow>
          <h2 className="font-display font-bold text-[#1A201A] text-3xl sm:text-4xl lg:text-5xl tracking-tight max-w-3xl">
            Three steps. Honest answers. Real progress.
          </h2>
          <div className="mt-14 grid md:grid-cols-3 gap-6">
            {[
              { n: "01", t: "Paste your URL", d: "We scan every meta tag, heading, and link in seconds." },
              { n: "02", t: "Read your action plan", d: "AI translates the findings into the 5 things to fix this week." },
              { n: "03", t: "Watch the score grow", d: "Re-audit anytime. Your history makes progress visible." },
            ].map((s) => (
              <div key={s.n} className="bg-white border border-[#E5E0D8] rounded-2xl p-8 hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
                <div className="font-display font-bold text-5xl text-[#81B29A]">{s.n}</div>
                <div className="mt-6 font-display font-bold text-xl text-[#1A201A]">{s.t}</div>
                <div className="mt-2 text-[#5C685C]">{s.d}</div>
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
            Start free. Upgrade when your shop outgrows the soil.
          </h2>
          <div className="mt-14 grid md:grid-cols-3 gap-6">
            <PricingCard
              testId="pricing-free"
              name="Free"
              price={0}
              tag="Get started"
              features={["3 audits per month", "1 saved project", "Basic AI recommendations"]}
              onClick={() => navigate("/register")}
              ctaLabel="Start free"
            />
            <PricingCard
              testId="pricing-pro"
              name="Pro"
              price={19}
              tag="Most popular"
              highlighted
              features={[
                "Unlimited audits",
                "5 saved projects",
                "PDF export of audit reports",
                "Scheduled monthly audits",
                "SERP rank tracking",
                "Competitor analysis",
              ]}
              onClick={() => navigate("/register")}
              ctaLabel="Start Pro trial"
            />
            <PricingCard
              testId="pricing-agency"
              name="Agency"
              price={49}
              tag="For multiple clients"
              features={[
                "Everything in Pro",
                "10 saved projects",
                "Priority support",
                "Bulk audit running",
              ]}
              onClick={() => navigate("/register")}
              ctaLabel="Start Agency"
            />
          </div>
        </div>
      </section>


      {/* Testimonial */}
      <section id="testimonials" className="bg-[#2D3E32] py-20 lg:py-24">
        <div className="max-w-5xl mx-auto px-6 lg:px-10">
          <Quote className="text-[#E07A5F]" size={42} />
          <p className="mt-6 font-display text-2xl sm:text-3xl lg:text-4xl text-[#FDFBF7] leading-snug tracking-tight max-w-4xl">
            &ldquo;I run a tiny pottery studio. I didn&apos;t know what a meta description was three months ago.
            Now I rank #2 in my city and most of that came from following the audit list.&rdquo;
          </p>
          <div className="mt-8 flex items-center gap-3 text-[#FDFBF7]/80">
            <img
              src="https://images.unsplash.com/photo-1507914464562-6ff4ac29692f?crop=entropy&cs=srgb&fm=jpg&q=85&w=200"
              alt="Maya, Studio Owner"
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <div className="text-[#FDFBF7] font-medium">Maya R.</div>
              <div className="text-sm">Owner, Clay & Kiln Studio</div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 lg:py-28">
        <div className="max-w-4xl mx-auto px-6 lg:px-10 text-center">
          <h2 className="font-display font-bold text-[#1A201A] text-3xl sm:text-4xl lg:text-5xl tracking-tight">
            Plant the seed today.
          </h2>
          <p className="mt-5 text-lg text-[#5C685C]">
            Audit your first website in under 30 seconds.
          </p>
          <Button
            data-testid="footer-cta"
            onClick={() => navigate("/register")}
            className="mt-10 bg-[#E07A5F] hover:bg-[#C86A51] text-[#FDFBF7] rounded-full px-8 py-6 text-base"
          >
            Start growing free <ArrowRight className="ml-2" size={18} />
          </Button>
        </div>
      </section>

      <footer className="border-t border-[#E5E0D8] py-8 text-center text-sm text-[#5C685C]">
        © {new Date().getFullYear()} RootedSEO. Made for honest small businesses.
      </footer>
    </div>
  );
}

function FeatureCard({ span, icon: Icon, title, body, accent }) {
  return (
    <div className={`${span} bg-white border border-[#E5E0D8] rounded-2xl p-8 hover:-translate-y-1 hover:shadow-lg transition-all duration-300`}>
      <div className="h-11 w-11 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${accent}22`, color: accent }}>
        <Icon size={22} strokeWidth={1.75} />
      </div>
      <div className="mt-6 font-display font-bold text-xl text-[#1A201A]">{title}</div>
      <div className="mt-2 text-[#5C685C]">{body}</div>
    </div>
  );
}

function PricingCard({ name, price, tag, features, onClick, ctaLabel, highlighted, testId }) {
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
        <span className="text-5xl font-bold">${price}</span>
        {price > 0 && <span className={`text-sm ml-1 ${highlighted ? "text-[#FDFBF7]/70" : "text-[#5C685C]"}`}>/ month</span>}
      </div>
      <ul className="mt-6 space-y-2.5">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm">
            <ShieldCheck size={16} className={highlighted ? "text-[#81B29A] shrink-0 mt-0.5" : "text-[#81B29A] shrink-0 mt-0.5"} />
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
