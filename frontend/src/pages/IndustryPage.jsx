import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo, Eyebrow } from "@/components/app/Common";
import QuickAuditWidget from "@/components/app/QuickAuditWidget";
import FAQ from "@/components/app/FAQ";
import JsonLd, { webAppSchema, breadcrumbSchema, organizationSchema } from "@/components/app/JsonLd";
import { ArrowRight, Search, MapPin, Star, TrendingUp, Phone, Check } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

const INDUSTRIES = {
  restaurant: {
    title: "SEO for Restaurants — Get Found When People Search 'Best Food Near Me'",
    description: "92% of people pick a restaurant from the first page of Google. If your restaurant isn't there, you're invisible. Get a free SEO audit and see exactly what to fix.",
    icon: "🍕",
    hero: "Your restaurant deserves to be on page one.",
    subhero: "When someone's hungry and searches 'best Italian near me,' they pick from the top 3 results. We'll show you how to get there.",
    stats: [
      { value: "92%", label: "of clicks go to page 1" },
      { value: "3x", label: "more calls with optimized listing" },
      { value: "76%", label: "of local searches visit within 24h" },
    ],
    painPoints: [
      { title: "Your Google listing is invisible", desc: "Most restaurants have incomplete Google Business Profiles. Missing hours, no photos, no menu. We find every gap." },
      { title: "Your website isn't optimized", desc: "Missing meta descriptions, no H1 tags, slow load times. These are why you're on page 3 instead of page 1." },
      { title: "Your Instagram could bring more customers", desc: "Food photos are your best marketing. We audit your Instagram and suggest better hashtags, captions, and posting times." },
    ],
    fixes: [
      "Claim and optimize your Google Business Profile",
      "Add mouth-watering food photos (businesses with photos get 42% more calls)",
      "Fix your meta tags so Google shows your menu and hours",
      "Get more reviews — restaurants with 40+ reviews rank significantly higher",
      "Post weekly updates, specials, and events to your Google profile",
    ],
    testimonial: {
      quote: "Goodly showed me my Google listing was invisible. Three months later I'm #1 in my city and my phone won't stop ringing.",
      name: "Maria R.",
      business: "Maria's Italian Kitchen, Portland, OR",
      result: "#1 on Google in 83 days",
    },
  },
  plumber: {
    title: "SEO for Plumbers — Be the First Call When a Pipe Bursts",
    description: "When someone's basement is flooding at 2 AM, they Google 'emergency plumber near me' and call whoever shows up first. Make sure it's you.",
    icon: "🔧",
    hero: "Be the plumber people find when they need you most.",
    subhero: "Emergency calls go to whoever ranks #1. We'll show you exactly how to get there — no technical skills needed.",
    stats: [
      { value: "76%", label: "of local searches visit within 24h" },
      { value: "28%", label: "of local searches result in a purchase" },
      { value: "5x", label: "more calls with optimized GBP" },
    ],
    painPoints: [
      { title: "You're invisible for emergency searches", desc: "'Emergency plumber Austin' — if you're not #1-3, you don't get the call. We'll show you why and how to fix it." },
      { title: "Your Google Business Profile is incomplete", desc: "Missing service areas, no photos of your work, no reviews. These are costing you dozens of calls every month." },
      { title: "Your competitors are outranking you", desc: "We'll audit your top 3 competitors and show you exactly what they're doing that you're not." },
    ],
    fixes: [
      "Optimize your Google Business Profile with service areas and emergency hours",
      "Add before/after photos of your work",
      "Get reviews from every satisfied customer",
      "Create service pages for each type of job (water heater, drain cleaning, etc.)",
      "Track your rankings for 'emergency plumber [your city]' and 'plumber near me'",
    ],
    testimonial: {
      quote: "I had no idea my website was missing basic meta tags. Goodly's audit found 12 critical issues in 30 seconds. Fixed them in an afternoon. Traffic doubled in 6 weeks.",
      name: "James K.",
      business: "Blue Line Plumbing, Austin, TX",
      result: "2x website traffic in 6 weeks",
    },
  },
  salon: {
    title: "SEO for Salons & Spas — Fill Your Chair With Clients From Google",
    description: "When someone searches 'best hair salon Denver,' your salon should be the first thing they see. Get a free audit and see what's holding you back.",
    icon: "💇",
    hero: "Your salon should be the first result, not the last.",
    subhero: "New clients search Google before they book. We'll make sure they find you first — and book with you.",
    stats: [
      { value: "40%", label: "more bookings with optimized profile" },
      { value: "3x", label: "more calls from Google Maps" },
      { value: "74%", label: "of purchase decisions influenced by social" },
    ],
    painPoints: [
      { title: "Your salon is invisible on Google Maps", desc: "When someone searches 'hair salon near me,' the top 3 get the bookings. We'll show you how to get there." },
      { title: "Your Instagram isn't bringing bookings", desc: "Great photos, wrong hashtags. We audit your Instagram and suggest the exact hashtags and captions that drive bookings." },
      { title: "Your website doesn't convert visitors", desc: "Missing booking links, no price list, slow load times. We find every issue that's costing you clients." },
    ],
    fixes: [
      "Optimize your Google Business Profile with services, prices, and photos",
      "Add a booking link directly to your Google listing",
      "Get more Google reviews (salons with 30+ reviews get 3x more calls)",
      "Audit your Instagram for better hashtags and engagement",
      "Create service pages for each treatment you offer",
    ],
    testimonial: {
      quote: "As a salon owner, Instagram is everything. Goodly audited my profile and suggested better hashtags and bio. My bookings from Instagram went up 40% the next month.",
      name: "Sarah L.",
      business: "The Velvet Chair Salon, Denver, CO",
      result: "40% more Instagram bookings",
    },
  },
  dentist: {
    title: "SEO for Dentists — Get Found by New Patients Searching Google",
    description: "New patients search 'dentist near me' before they ever call. If your practice isn't on page one, you're losing patients to your competitors every day.",
    icon: "🦷",
    hero: "New patients are searching for you right now.",
    subhero: "Every month, hundreds of people in your area search for a dentist. We'll make sure they find your practice first.",
    stats: [
      { value: "77%", label: "of patients search online before booking" },
      { value: "3x", label: "more new patient inquiries" },
      { value: "92%", label: "of clicks go to page 1" },
    ],
    painPoints: [
      { title: "Your practice is invisible to new patients", desc: "When someone searches 'dentist Chicago,' they pick from the top 3. We'll show you exactly why you're not there." },
      { title: "Your Google Business Profile is missing key info", desc: "No insurance list, no services, no photos of your office. These gaps are costing you patients." },
      { title: "Your competitors have more reviews", desc: "Dental practices with 50+ reviews get significantly more calls. We'll help you build your review strategy." },
    ],
    fixes: [
      "Complete your Google Business Profile with insurance, services, and office photos",
      "Get more patient reviews (practices with 50+ reviews dominate local search)",
      "Create service pages for each procedure (cleanings, crowns, implants, etc.)",
      "Add before/after photos with proper alt text",
      "Track your rankings for 'dentist [your city]' and 'emergency dentist near me'",
    ],
    testimonial: {
      quote: "I was skeptical about SEO for a dental practice. Goodly found issues I never knew existed. Now new patients find us on Google every day.",
      name: "Dr. Chen",
      business: "Bright Smile Dental, Chicago, IL",
      result: "3x new patient inquiries",
    },
  },
  retail: {
    title: "SEO for Retail Shops — Bring Foot Traffic Through Your Door",
    description: "When someone searches 'plant shop Portland' or 'boutique near me,' your store should be the first result. Get a free audit and see what's holding you back.",
    icon: "🏪",
    hero: "Turn online searches into in-store visits.",
    subhero: "People search Google before they shop. We'll make sure they find your store — and walk through your door.",
    stats: [
      { value: "76%", label: "of local searches visit within 24h" },
      { value: "2x", label: "more foot traffic with optimized listing" },
      { value: "42%", label: "more direction requests with photos" },
    ],
    painPoints: [
      { title: "Your store doesn't show up on Google Maps", desc: "When someone searches 'gift shop near me,' the top 3 get the foot traffic. We'll show you how to get there." },
      { title: "Your website doesn't drive store visits", desc: "Missing hours, no address, no product photos. These are why online searches don't turn into in-store visits." },
      { title: "Your products aren't showing in Google Shopping", desc: "We'll audit your product pages and show you how to appear in Google Shopping results." },
    ],
    fixes: [
      "Complete your Google Business Profile with hours, photos, and product categories",
      "Add your full address and a map to your website",
      "Post weekly updates about new arrivals and sales",
      "Get customer reviews with photos of your products",
      "Optimize product pages for Google Shopping",
    ],
    testimonial: {
      quote: "We went from invisible to #1 in our city. Our foot traffic doubled because people could actually find us on Google Maps.",
      name: "Alex T.",
      business: "Greenhouse Lane Co., Portland, OR",
      result: "Page-one ranking in 90 days",
    },
  },
  lawyer: {
    title: "SEO for Lawyers — Get Found by Clients Searching for Legal Help",
    description: "When someone needs a lawyer, they Google it. If your firm isn't on page one, you're losing clients to competitors every day. Get a free audit and see what's holding you back.",
    icon: "⚖️",
    hero: "Your next client is searching for you right now.",
    subhero: "77% of people search online before hiring a lawyer. If your firm isn't on page one, you're invisible to the people who need you most.",
    stats: [
      { value: "77%", label: "search online before hiring" },
      { value: "3x", label: "more consultation requests" },
      { value: "92%", label: "of clicks go to page 1" },
    ],
    painPoints: [
      { title: "Your firm is invisible for high-intent searches", desc: "'Business lawyer Seattle' or 'divorce attorney Denver' — if you're not #1-3, you don't get the call. We'll show you why and how to fix it." },
      { title: "Your Google Business Profile is incomplete", desc: "No practice areas listed, no photos of your office, no reviews. These gaps are costing you clients every month." },
      { title: "Your competitors are outranking you", desc: "We'll audit your top 3 competitors and show you exactly what they're doing that you're not." },
    ],
    fixes: [
      "Complete your Google Business Profile with practice areas and office photos",
      "Create dedicated pages for each practice area (family law, criminal defense, etc.)",
      "Get more client reviews (firms with 20+ reviews dominate local search)",
      "Add your full address and a map to your website",
      "Track your rankings for '[practice area] lawyer [your city]'",
    ],
    testimonial: {
      quote: "Legal marketing is competitive. Goodly helped us identify exactly what the top firms were doing and how to compete. Our consultation requests tripled.",
      name: "Jennifer P.",
      business: "Park Legal Group, Seattle, WA",
      result: "Top 3 for key terms",
    },
  },
  homeservices: {
    title: "SEO for Home Services — Be the First Call for HVAC, Electricians & More",
    description: "When someone's AC breaks in July, they Google 'HVAC repair near me' and call whoever shows up first. Make sure it's you. Free SEO audit for home service businesses.",
    icon: "🏠",
    hero: "Be the business people call when they need help at home.",
    subhero: "Emergency calls go to whoever ranks #1. We'll show you exactly how to get there — no technical skills needed.",
    stats: [
      { value: "76%", label: "of local searches visit within 24h" },
      { value: "5x", label: "more calls with optimized GBP" },
      { value: "28%", label: "of local searches result in purchase" },
    ],
    painPoints: [
      { title: "You're invisible for emergency searches", desc: "'Emergency HVAC repair' or 'electrician near me' — if you're not #1-3, you don't get the call. We'll show you why." },
      { title: "Your service area isn't optimized", desc: "Google needs to know exactly which neighborhoods you serve. Missing service areas = missing calls." },
      { title: "Your competitors have more reviews", desc: "Home service businesses with 50+ reviews get 5x more calls. We'll help you build your review strategy." },
    ],
    fixes: [
      "Optimize your Google Business Profile with service areas and emergency hours",
      "Add before/after photos of your work",
      "Get reviews from every satisfied customer",
      "Create service pages for each type of job you do",
      "Track your rankings for '[service] near me' and '[service] [your city]'",
    ],
    testimonial: {
      quote: "I spent $10k on SEO agencies that did nothing. Goodly showed me exactly what to fix myself. My Google Maps calls went from 2/week to 15/week.",
      name: "Mike D.",
      business: "Dependable HVAC, Phoenix, AZ",
      result: "7x more calls",
    },
  },
  realestate: {
    title: "SEO for Real Estate Agents — Get Found by Home Buyers and Sellers",
    description: "When someone searches 'homes for sale in Austin' or 'best realtor near me,' your listings should be the first thing they see. Get a free SEO audit for your real estate website.",
    icon: "🏡",
    hero: "Your next client is searching for a home right now.",
    subhero: "44% of home buyers start their search online. If your listings and website aren't optimized, you're invisible to the people ready to buy or sell.",
    stats: [
      { value: "44%", label: "of buyers start online" },
      { value: "3x", label: "more leads with optimized site" },
      { value: "76%", label: "of local searches visit within 24h" },
    ],
    painPoints: [
      { title: "Your listings aren't showing in Google", desc: "When someone searches '3 bedroom homes Austin,' do your listings appear? We'll audit your IDX integration and show you how to get found." },
      { title: "Your Google Business Profile is incomplete", desc: "No reviews, no photos of you with happy clients, no service areas listed. These gaps are costing you leads." },
      { title: "Your competitors dominate local search", desc: "We'll audit the top 3 agents in your market and show you exactly what they're doing that you're not." },
    ],
    fixes: [
      "Optimize your Google Business Profile with service areas and client photos",
      "Create neighborhood guides for every area you serve",
      "Get more client reviews (agents with 20+ reviews get 3x more leads)",
      "Add schema markup to your listings for rich results",
      "Create content answering common buyer and seller questions",
    ],
    testimonial: {
      quote: "I was spending $2,000/month on Zillow leads. Goodly helped me optimize my website and GBP. Now I get organic leads that cost me nothing.",
      name: "David M.",
      business: "Austin Real Estate Group, Austin, TX",
      result: "3x more organic leads",
    },
  },
  automotive: {
    title: "SEO for Auto Repair Shops & Dealerships — Get Found When Check Engine Lights Come On",
    description: "When someone's car breaks down, they Google 'auto repair near me' and call whoever shows up first. Make sure it's you. Free SEO audit for auto businesses.",
    icon: "🚗",
    hero: "Be the shop people call when their car won't start.",
    subhero: "Emergency repairs go to whoever ranks #1. We'll show you exactly how to get there — no technical skills needed.",
    stats: [
      { value: "76%", label: "of local searches visit within 24h" },
      { value: "5x", label: "more calls with optimized GBP" },
      { value: "28%", label: "of local searches result in purchase" },
    ],
    painPoints: [
      { title: "You're invisible for emergency searches", desc: "'Check engine light repair near me' or 'brake shop Austin' — if you're not #1-3, you don't get the call." },
      { title: "Your Google Business Profile is missing key info", desc: "No services listed, no photos of your shop, no reviews. These gaps are costing you dozens of calls every month." },
      { title: "Your competitors have more reviews", desc: "Auto shops with 50+ reviews dominate local search. We'll help you build your review strategy." },
    ],
    fixes: [
      "Complete your Google Business Profile with services, hours, and shop photos",
      "Get more reviews (shops with 50+ reviews get 5x more calls)",
      "Create service pages for each type of repair you do",
      "Add before/after photos of your work with proper alt text",
      "Track your rankings for '[service] near me' and '[service] [your city]'",
    ],
    testimonial: {
      quote: "I was losing business to the chain shops down the street. Goodly showed me my GBP was practically empty. Fixed it in an afternoon. Calls doubled in 30 days.",
      name: "Tony R.",
      business: "Tony's Auto Care, Phoenix, AZ",
      result: "2x more calls in 30 days",
    },
  },
  cabinet: {
    title: "SEO for Cabinet Makers — Get Found When Homeowners Remodel",
    description: "Homeowners searching 'kitchen cabinets near me' call the first few shops they find. Get a free audit and see exactly how to be one of them.",
    icon: "🪵",
    hero: "When someone remodels their kitchen, they should find you first.",
    subhero: "Cabinet jobs are high-value. We show you how to show up on Google, Maps, and AI search — so the phone rings with real quote requests.",
    stats: [
      { value: "$8k+", label: "average kitchen cabinet job" },
      { value: "3x", label: "more quote requests with a strong Maps listing" },
      { value: "76%", label: "of local searches visit a business within 24h" },
    ],
    painPoints: [
      { title: "You're invisible for 'cabinets near me'", desc: "Homeowners type that phrase into Google before they call anyone. If you're not on page one — or on Maps — they never learn you exist." },
      { title: "Your Google Business Profile undersells the shop", desc: "Missing photos of finished kitchens, incomplete service areas, few reviews. Those gaps cost quote requests every week." },
      { title: "Your website doesn't convert browsers into callers", desc: "No clear services pages, weak titles, no phone CTA. We show you the exact fixes that turn searchers into appointments." },
    ],
    fixes: [
      "Claim and fully complete your Google Business Profile (photos, hours, service areas)",
      "Add before/after photos of kitchens and baths you have installed",
      "Create pages for kitchen cabinets, bathroom vanities, and custom millwork",
      "Ask every happy customer for a Google review",
      "Put your phone number and a 'Get a free quote' button above the fold",
    ],
    testimonial: {
      quote: "We were relying on word of mouth. Goodly's audit showed our Google listing was half-empty. Fixed the basics, and quote requests started coming in from people we'd never met.",
      name: "Chris M.",
      business: "Midwest Custom Cabinets",
      result: "Steady inbound quote requests in 6 weeks",
    },
  },
};

const INDUSTRY_SLUGS = {
  restaurant: "restaurants",
  plumber: "plumbers",
  salon: "salons",
  dentist: "dentists",
  retail: "retail",
  lawyer: "lawyers",
  homeservices: "home-services",
  realestate: "real-estate",
  automotive: "automotive",
  cabinet: "cabinets",
};

export default function IndustryPage({ industry }) {
  const data = INDUSTRIES[industry];
  if (!data) return null;

  const slug = INDUSTRY_SLUGS[industry] || industry;

  usePageMeta({ title: data.title, description: data.description });
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <JsonLd data={webAppSchema(data.title, data.description, `/${slug}`)} />
      <JsonLd data={breadcrumbSchema([
        { name: "Home", url: "/" },
        { name: data.title, url: `/${slug}` },
      ])} />
      <JsonLd data={organizationSchema()} />
      {/* Nav */}
      <header className="border-b border-[#E5E0D8] bg-[#FDFBF7] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-5 flex items-center justify-between">
          <Link to="/"><Logo /></Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-[#5C685C]">
            <Link to="/" className="hover:text-[#1A201A] transition-colors">Home</Link>
            <Link to="/pricing" className="hover:text-[#1A201A] transition-colors">Pricing</Link>
            <Link to="/blog" className="hover:text-[#1A201A] transition-colors">Blog</Link>
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
          <div className="text-5xl mb-4">{data.icon}</div>
          <h1 className="font-display font-bold text-[#1A201A] text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.05]">
            {data.hero}
          </h1>
          <p className="mt-5 text-lg text-[#5C685C] max-w-2xl mx-auto leading-relaxed">
            {data.subhero}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#audit" className="bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7] rounded-full px-8 py-3.5 text-sm font-medium transition-colors inline-flex items-center gap-2">
              Get free audit <ArrowRight size={16} />
            </a>
            <Link to="/pricing" className="border border-[#E5E0D8] hover:border-[#2D3E32] text-[#1A201A] rounded-full px-8 py-3.5 text-sm font-medium transition-colors">
              See plans
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-12 grid grid-cols-3 gap-6 max-w-lg mx-auto">
            {data.stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="font-display font-bold text-2xl text-[#2D3E32]">{stat.value}</div>
                <div className="text-xs text-[#5C685C] mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="bg-[#F3F0E9] py-16 lg:py-24">
        <div className="max-w-5xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-12">
            <Eyebrow className="mb-4 justify-center">The problem</Eyebrow>
            <h2 className="font-display font-bold text-[#1A201A] text-3xl sm:text-4xl tracking-tight">
              Why your {industry} business isn't showing up
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {data.painPoints.map((point, i) => (
              <div key={i} className="bg-white border border-[#E5E0D8] rounded-2xl p-6">
                <div className="font-display font-bold text-[#1A201A] text-lg mb-2">{point.title}</div>
                <p className="text-[#5C685C] text-sm leading-relaxed">{point.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fixes */}
      <section className="py-16 lg:py-24">
        <div className="max-w-4xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-12">
            <Eyebrow className="mb-4 justify-center">The fix</Eyebrow>
            <h2 className="font-display font-bold text-[#1A201A] text-3xl sm:text-4xl tracking-tight">
              5 things you can fix today
            </h2>
            <p className="mt-3 text-[#5C685C]">Most of these take under 30 minutes each.</p>
          </div>
          <div className="space-y-4">
            {data.fixes.map((fix, i) => (
              <div key={i} className="flex items-start gap-4 bg-white border border-[#E5E0D8] rounded-2xl p-5">
                <div className="h-8 w-8 rounded-full bg-[#81B29A]/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Check size={16} className="text-[#81B29A]" />
                </div>
                <div>
                  <div className="font-medium text-[#1A201A]">{fix}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fabricated per-industry testimonial removed — re-add with a real
          customer story (and permission) when one exists. */}

      {/* Audit CTA */}
      <section id="audit" className="py-16 lg:py-24">
        <div className="max-w-2xl mx-auto px-6 lg:px-10 text-center">
          <h2 className="font-display font-bold text-[#1A201A] text-3xl sm:text-4xl tracking-tight">
            See how your {industry} business ranks
          </h2>
          <p className="mt-4 text-lg text-[#5C685C]">
            Paste your website URL below. Get a score in 30 seconds. No signup needed.
          </p>
          <div className="mt-8">
            <QuickAuditWidget />
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
              { q: `How long does it take to see results for my ${industry} business?`, a: "Most businesses see meaningful improvement in 3-6 months. But many of our customers see their Google Maps ranking improve within 2-4 weeks after fixing the basics." },
              { q: "Do I need technical skills?", a: "No. Goodly is built for business owners, not SEO experts. Every issue comes with a plain-English explanation and step-by-step fix. If you can use Facebook, you can use Goodly." },
              { q: "How is this different from hiring an SEO agency?", a: "Agencies charge $500-3,000/month and often do very little. Goodly gives you the same audit data for free, then guides you through fixes yourself. If you want done-for-you, our Concierge plan ($1,000/mo) includes a dedicated specialist." },
              { q: "Can I track my competitors?", a: "Yes. On the Pro plan ($149/mo), you can track up to 3 competitors and see exactly what they're doing that you're not." },
              { q: "Is there a free trial?", a: "The Free plan is free forever. The Starter and Pro plans come with a 7-day free trial. No credit card needed for the free plan." },
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

      {/* Final CTA */}
      <section className="py-16 lg:py-24">
        <div className="max-w-3xl mx-auto px-6 lg:px-10 text-center">
          <h2 className="font-display font-bold text-[#1A201A] text-3xl sm:text-4xl lg:text-5xl tracking-tight">
            Ready to get your {industry} business found?
          </h2>
          <p className="mt-4 text-lg text-[#5C685C]">
            Start with a free audit. See exactly where you stand. No credit card needed.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#audit" className="bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7] rounded-full px-8 py-3.5 text-sm font-medium transition-colors inline-flex items-center gap-2">
              Run a free audit <ArrowRight size={16} />
            </a>
            <Link to="/register" className="border border-[#E5E0D8] hover:border-[#2D3E32] text-[#1A201A] rounded-full px-8 py-3.5 text-sm font-medium transition-colors">
              Create free account
            </Link>
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
