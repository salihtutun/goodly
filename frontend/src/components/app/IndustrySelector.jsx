import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Search, MapPin, Share2, Phone, Star } from "lucide-react";

const INDUSTRIES = {
  restaurant: {
    icon: "🍕",
    label: "Restaurant",
    headline: "Get found when people search 'best pizza near me'",
    problem: "When someone's hungry and searches for a restaurant, they pick from the top 3 results. If you're not there, you don't exist.",
    stats: [
      { value: "92%", label: "of clicks go to page 1 results" },
      { value: "3x", label: "more calls with optimized Google listing" },
      { value: "76%", label: "of local searches visit within 24 hours" },
    ],
    features: [
      { icon: Search, title: "Show up on Google", desc: "We scan your restaurant website for 50+ signals and tell you exactly what to fix to rank higher." },
      { icon: MapPin, title: "Get found on Google Maps", desc: "When someone searches 'Italian restaurant near me,' your listing shows up in the top 3." },
      { icon: Share2, title: "Grow on Instagram", desc: "Your food photos deserve to be seen. We audit your Instagram and suggest better hashtags and captions." },
      { icon: Phone, title: "Watch the phone ring", desc: "Track your progress. See exactly which fixes brought in more reservations." },
    ],
    cta: "Get your restaurant found →",
  },
  plumbing: {
    icon: "🔧",
    label: "Plumber",
    headline: "Be the first call when someone's pipe bursts",
    problem: "Emergency calls start with a Google search. If you're not on page one for 'emergency plumber,' you're losing thousands in emergency calls every month.",
    stats: [
      { value: "53%", label: "of mobile users leave slow sites" },
      { value: "5x", label: "more calls with optimized GBP" },
      { value: "28%", label: "of local searches result in a purchase" },
    ],
    features: [
      { icon: Search, title: "Rank for emergency keywords", desc: "We track your ranking for 'emergency plumber,' 'plumber near me,' and your top 5 keywords." },
      { icon: MapPin, title: "Dominate Google Maps", desc: "When someone's pipe bursts at 2 AM, your business shows up first in the local map pack." },
      { icon: Star, title: "Beat your competitors", desc: "See exactly what the #1 plumber in your area is doing — and how to do it better." },
      { icon: Phone, title: "Get more emergency calls", desc: "Every position you climb in Google rankings means more emergency calls. We track the ROI." },
    ],
    cta: "Get your plumbing business found →",
  },
  dental: {
    icon: "🦷",
    label: "Dentist",
    headline: "Show up when patients search for a new dentist",
    problem: "New patients search for dentists online before they ever call. If your practice isn't on page one, you're invisible to them.",
    stats: [
      { value: "87%", label: "of patients read online reviews" },
      { value: "2.7x", label: "more trust with complete GBP" },
      { value: "42%", label: "more clicks with listing photos" },
    ],
    features: [
      { icon: Search, title: "Rank for 'dentist near me'", desc: "We audit your dental practice website and tell you exactly how to rank higher for local searches." },
      { icon: MapPin, title: "Optimize your Google listing", desc: "Complete Google Business Profiles get 5x more calls. We check yours and tell you what's missing." },
      { icon: Star, title: "Manage your reviews", desc: "93% of patients say reviews impact their choice. We help you monitor and respond to reviews." },
      { icon: Phone, title: "Fill your appointment book", desc: "Track how many new patient inquiries come from Google each month." },
    ],
    cta: "Get your dental practice found →",
  },
  salon: {
    icon: "💇",
    label: "Salon",
    headline: "Fill your appointment book from Instagram and Google",
    problem: "Your next client is scrolling Instagram right now. If your profile isn't optimized and your website isn't ranking, they're booking with someone else.",
    stats: [
      { value: "74%", label: "of purchases influenced by social media" },
      { value: "40%", label: "more bookings with optimized profiles" },
      { value: "71%", label: "of SMBs use social media for marketing" },
    ],
    features: [
      { icon: Share2, title: "Audit your Instagram", desc: "We check your bio, hashtags, and content strategy. Tell you exactly how to turn scrollers into bookers." },
      { icon: Search, title: "Rank on Google too", desc: "Don't rely only on Instagram. We help your salon website show up when people search for 'best salon near me.'" },
      { icon: MapPin, title: "Show up on Google Maps", desc: "When someone's looking for a haircut nearby, your salon appears in the top results." },
      { icon: Phone, title: "Track your bookings", desc: "See exactly how many bookings come from Google vs Instagram each month." },
    ],
    cta: "Get your salon found →",
  },
  retail: {
    icon: "🏪",
    label: "Retail",
    headline: "Get foot traffic from Google and Instagram",
    problem: "People search for products before they visit stores. If your shop doesn't show up in local search results, they're walking into your competitor's store instead.",
    stats: [
      { value: "76%", label: "of local searches visit within 24 hours" },
      { value: "46%", label: "of all Google searches are local" },
      { value: "28%", label: "of local searches result in a purchase" },
    ],
    features: [
      { icon: Search, title: "Show up in local searches", desc: "We audit your retail website and tell you exactly how to rank for 'best [product] near me' searches." },
      { icon: MapPin, title: "Get found on Google Maps", desc: "Your store appears when people search for products nearby. We optimize your listing for maximum visibility." },
      { icon: Share2, title: "Grow on social media", desc: "Audit your Instagram and TikTok profiles. Get more followers who actually visit your store." },
      { icon: Phone, title: "Track foot traffic impact", desc: "See how your online visibility translates to in-store visits and sales." },
    ],
    cta: "Get your retail store found →",
  },
};

export default function IndustrySelector() {
  const [selected, setSelected] = useState("restaurant");
  const industry = INDUSTRIES[selected];

  return (
    <section className="bg-[#F3F0E9] py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="text-center mb-10">
          <div className="label-eyebrow mb-3">Built for your industry</div>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-[#1A201A] tracking-tight">
            Select your business type
          </h2>
          <p className="mt-3 text-[#5C685C] text-lg">
            See exactly how Goodly helps businesses like yours get found.
          </p>
        </div>

        {/* Industry tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {Object.entries(INDUSTRIES).map(([key, ind]) => (
            <button
              key={key}
              onClick={() => setSelected(key)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${
                selected === key
                  ? "bg-[#2D3E32] text-white shadow-md"
                  : "bg-white border border-[#E5E0D8] text-[#5C685C] hover:text-[#1A201A] hover:border-[#D4CFC4]"
              }`}
            >
              {ind.icon} {ind.label}
            </button>
          ))}
        </div>

        {/* Industry content */}
        <div className="bg-white border border-[#E5E0D8] rounded-3xl p-8 lg:p-12 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <div className="text-4xl mb-4">{industry.icon}</div>
              <h3 className="font-display font-bold text-3xl sm:text-4xl text-[#1A201A] tracking-tight leading-tight">
                {industry.headline}
              </h3>
              <p className="mt-4 text-[#5C685C] text-lg leading-relaxed">
                {industry.problem}
              </p>

              {/* Stats */}
              <div className="mt-8 grid grid-cols-3 gap-4">
                {industry.stats.map((stat, i) => (
                  <div key={i} className="bg-[#F3F0E9] rounded-xl p-4 text-center">
                    <div className="text-2xl font-display font-bold text-[#2D3E32]">{stat.value}</div>
                    <div className="text-xs text-[#5C685C] mt-1 leading-tight">{stat.label}</div>
                  </div>
                ))}
              </div>

              <Link
                to="/register"
                className="mt-8 inline-flex items-center gap-2 bg-[#E07A5F] hover:bg-[#D06A4F] text-white rounded-full px-8 py-4 text-base font-medium transition-colors"
              >
                {industry.cta} <ArrowRight size={18} />
              </Link>
            </div>

            <div className="space-y-4">
              {industry.features.map((feat, i) => (
                <div key={i} className="flex items-start gap-4 bg-[#FDFBF7] border border-[#E5E0D8] rounded-2xl p-5">
                  <div className="h-10 w-10 rounded-xl bg-[#81B29A]/15 flex items-center justify-center shrink-0">
                    <feat.icon size={20} className="text-[#81B29A]" strokeWidth={1.75} />
                  </div>
                  <div>
                    <div className="font-display font-bold text-[#1A201A]">{feat.title}</div>
                    <div className="text-sm text-[#5C685C] mt-1">{feat.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
