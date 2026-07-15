import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const FAQS = [
  {
    q: "What is an SEO audit?",
    a: "An SEO audit scans your website for 50+ signals that Google uses to rank pages. It checks your meta tags, headings, page speed, mobile-friendliness, content quality, security, and more. You get a score out of 100 and a plain-English list of exactly what to fix."
  },
  {
    q: "How long does it take to see results?",
    a: "Most small businesses see improvements within 30-90 days. Simple fixes like adding meta descriptions can boost your score immediately. Ranking changes take longer — typically 2-6 months for significant movement. Our customers see an average improvement of 34 points."
  },
  {
    q: "Do I need to know SEO to use Goodly?",
    a: "No! That's the whole point. Goodly translates everything into plain English. Instead of 'your H1 tag is missing,' we say 'Google doesn't know what your page is about. Add one sentence that describes your business.' No jargon. No SEO degree required."
  },
  {
    q: "Is there really a free plan?",
    a: "Yes! The free plan gives you 5 audits per month, 2 saved projects, and AI-generated action plans. No credit card needed. Upgrade to Starter ($49/mo) for 10 audits, SERP tracking, PDF reports, and weekly automated re-audits."
  },
  {
    q: "What's the difference between Starter and Pro?",
    a: "Starter ($49/mo) is perfect for a single business: 10 audits/month, 5 keyword trackers, weekly re-audits, PDF reports, and Instagram audit. Pro ($149/mo) adds unlimited audits, 25 keyword trackers, daily re-audits, competitor analysis, all social platforms, AI visibility monitoring, Google Business Profile audit, and white-label PDFs."
  },
  {
    q: "What is the Concierge plan?",
    a: "Concierge ($1,000/mo) is done-for-you SEO. A dedicated specialist handles everything — audits, content writing, meta tag optimization, Google Business Profile management, backlink outreach, and monthly client-ready reports. Goal: page-one ranking in 90 days or month 4 is free."
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. All paid plans are month-to-month. Cancel anytime from your Billing page. No contracts. No cancellation fees. Your data is yours — you can export it anytime."
  },
  {
    q: "Does Goodly work for local businesses?",
    a: "Absolutely. Goodly was built for local businesses. We audit your Google Business Profile, check your local rankings, and tell you exactly how to show up in the 'local 3-pack' on Google Maps. 76% of local searches result in a visit within 24 hours — we help you capture that traffic."
  },
];

export default function FAQ() {
  const [open, setOpen] = useState(null);

  return (
    <section className="py-20 lg:py-28">
      <div className="max-w-3xl mx-auto px-6 lg:px-10">
        <div className="text-center mb-12">
          <div className="label-eyebrow mb-3">FAQ</div>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-[#1A201A] tracking-tight">
            Questions small businesses ask us
          </h2>
        </div>

        <div className="space-y-3">
          {FAQS.map((faq, i) => (
            <div key={i} className="bg-white border border-[#E5E0D8] rounded-2xl overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-[#FDFBF7] transition-colors"
              >
                <span className="font-display font-bold text-[#1A201A] pr-4">{faq.q}</span>
                {open === i ? (
                  <ChevronUp size={18} className="text-[#9CA89C] shrink-0" />
                ) : (
                  <ChevronDown size={18} className="text-[#9CA89C] shrink-0" />
                )}
              </button>
              {open === i && (
                <div className="px-5 pb-5 text-[#5C685C] text-sm leading-relaxed animate-in slide-in-from-top-2 duration-200">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
