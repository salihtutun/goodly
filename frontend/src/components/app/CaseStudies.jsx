import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp, Star, Quote } from "lucide-react";

const CASE_STUDIES = [
  {
    industry: "restaurant",
    label: "Restaurants",
    icon: "🍕",
    business: "Maria's Italian Kitchen",
    location: "Portland, OR",
    before: 52,
    after: 88,
    days: 83,
    result: "#1 on Google for 'best Italian restaurant Portland'",
    quote: "I run a tiny restaurant. Goodly showed me my Google listing was invisible. Three months later I'm #1 in my city and my phone won't stop ringing.",
    name: "Maya R.",
    role: "Owner",
    image: "https://images.unsplash.com/photo-1507914464562-6ff4ac29692f?crop=entropy&cs=srgb&fm=jpg&q=85&w=200",
  },
  {
    industry: "plumbing",
    label: "Plumbers",
    icon: "🔧",
    business: "Blue Line Plumbing",
    location: "Austin, TX",
    before: 45,
    after: 79,
    days: 42,
    result: "2x website traffic in 6 weeks",
    quote: "I had no idea my website was missing basic meta tags. Goodly's audit found 12 critical issues in 30 seconds. Fixed them in an afternoon. Traffic doubled in 6 weeks.",
    name: "James K.",
    role: "Owner",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?crop=entropy&cs=srgb&fm=jpg&q=85&w=200",
  },
  {
    industry: "salon",
    label: "Salons & Spas",
    icon: "💇",
    business: "The Velvet Chair Salon",
    location: "Denver, CO",
    before: 48,
    after: 82,
    days: 30,
    result: "40% more Instagram bookings",
    quote: "As a salon owner, Instagram is everything. Goodly audited my profile and suggested better hashtags and bio. My bookings from Instagram went up 40% the next month.",
    name: "Sarah L.",
    role: "Owner",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?crop=entropy&cs=srgb&fm=jpg&q=85&w=200",
  },
  {
    industry: "dental",
    label: "Dentists",
    icon: "🦷",
    business: "Bright Smile Dental",
    location: "Chicago, IL",
    before: 55,
    after: 91,
    days: 60,
    result: "3x new patient inquiries from Google",
    quote: "I was skeptical about SEO for a dental practice. Goodly found issues I never knew existed. Now new patients find us on Google every day.",
    name: "Dr. Chen",
    role: "Owner",
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?crop=entropy&cs=srgb&fm=jpg&q=85&w=200",
  },
  {
    industry: "retail",
    label: "Retail Shops",
    icon: "🏪",
    business: "Greenhouse Lane Co.",
    location: "Portland, OR",
    before: 38,
    after: 85,
    days: 90,
    result: "Page-one ranking for 'plant shop Portland'",
    quote: "We went from invisible to #1 in our city. Our foot traffic doubled because people could actually find us on Google Maps.",
    name: "Alex T.",
    role: "Owner",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?crop=entropy&cs=srgb&fm=jpg&q=85&w=200",
  },
  {
    industry: "legal",
    label: "Lawyers",
    icon: "⚖️",
    business: "Park Legal Group",
    location: "Seattle, WA",
    before: 61,
    after: 93,
    days: 75,
    result: "Top 3 for 'business lawyer Seattle'",
    quote: "Legal marketing is competitive. Goodly helped us identify exactly what the top firms were doing and how to compete. Our consultation requests tripled.",
    name: "Jennifer P.",
    role: "Managing Partner",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?crop=entropy&cs=srgb&fm=jpg&q=85&w=200",
  },
];

export default function CaseStudies({ compact = false }) {
  const [filter, setFilter] = useState(null);

  const filtered = filter ? CASE_STUDIES.filter(c => c.industry === filter) : CASE_STUDIES;
  const display = compact ? filtered.slice(0, 3) : filtered;

  return (
    <section className="py-16 lg:py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="text-center mb-12">
          <div className="label-eyebrow mb-3">Real Results</div>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-[#1A201A] tracking-tight">
            Small businesses like yours are getting found
          </h2>
          <p className="mt-3 text-[#5C685C] text-lg">
            See how businesses in your industry improved their visibility with Goodly.
          </p>
        </div>

        {/* Industry filter */}
        {!compact && (
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            <button
              onClick={() => setFilter(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                !filter ? "bg-[#2D3E32] text-white" : "bg-[#F3F0E9] text-[#5C685C] hover:text-[#1A201A]"
              }`}
            >
              All Industries
            </button>
            {[...new Set(CASE_STUDIES.map(c => c.industry))].map(ind => {
              const study = CASE_STUDIES.find(c => c.industry === ind);
              return (
                <button
                  key={ind}
                  onClick={() => setFilter(ind)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    filter === ind ? "bg-[#2D3E32] text-white" : "bg-[#F3F0E9] text-[#5C685C] hover:text-[#1A201A]"
                  }`}
                >
                  {study.icon} {study.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Case study cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {display.map((study, i) => (
            <div key={i} className="bg-white border border-[#E5E0D8] rounded-2xl overflow-hidden hover:-translate-y-1 hover:shadow-lg transition-all duration-300">
              {/* Score improvement */}
              <div className="bg-gradient-to-r from-[#2D3E32] to-[#4A5F4F] p-6 text-white">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm text-white/70">{study.business}</div>
                  <div className="text-xs bg-white/20 px-2 py-0.5 rounded-full">{study.location}</div>
                </div>
                <div className="flex items-end gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-display font-bold">{study.before}</div>
                    <div className="text-xs text-white/50">Before</div>
                  </div>
                  <div className="flex-1">
                    <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-[#81B29A] rounded-full" style={{ width: `${study.after}%` }} />
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-display font-bold">{study.after}</div>
                    <div className="text-xs text-white/50">After</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-sm text-white/80">
                  <TrendingUp size={14} className="text-[#81B29A]" />
                  +{study.after - study.before} points in {study.days} days
                </div>
              </div>

              {/* Result + quote */}
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Star size={14} className="text-[#E07A5F] fill-[#E07A5F]" />
                  <span className="text-sm font-medium text-[#1A201A]">{study.result}</span>
                </div>
                <div className="flex items-start gap-3">
                  <Quote size={16} className="text-[#E5E0D8] mt-0.5 shrink-0" />
                  <p className="text-sm text-[#5C685C] leading-relaxed">&ldquo;{study.quote}&rdquo;</p>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <img src={study.image} alt={study.name} className="w-8 h-8 rounded-full object-cover" />
                  <div>
                    <div className="text-xs font-medium text-[#1A201A]">{study.name}</div>
                    <div className="text-[10px] text-[#9CA89C]">{study.role}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {compact && (
          <div className="text-center mt-8">
            <Link to="/register" className="inline-flex items-center gap-1.5 text-[#81B29A] hover:text-[#5C9A7A] font-medium">
              See more success stories <ArrowRight size={14} />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
