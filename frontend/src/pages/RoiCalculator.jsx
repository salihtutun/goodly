import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo, Eyebrow } from "@/components/app/Common";
import { ArrowRight, DollarSign, TrendingUp, Calculator, BarChart3, Target } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function RoiCalculator() {
  usePageMeta({
    title: "SEO ROI Calculator — How Much Revenue Are You Losing?",
    description: "Calculate how much revenue your small business is losing from poor SEO. Free calculator based on real industry data."
  });
  const navigate = useNavigate();

  const [industry, setIndustry] = useState("home_services");
  const [monthlyVisitors, setMonthlyVisitors] = useState(2000);
  const [avgCustomerValue, setAvgCustomerValue] = useState(500);
  const [currentRank, setCurrentRank] = useState(8);

  // CTR by position
  const ctrByPosition = { 1: 0.285, 2: 0.157, 3: 0.110, 4: 0.080, 5: 0.062, 6: 0.049, 7: 0.039, 8: 0.032, 9: 0.028, 10: 0.025 };
  const conversionRates = { home_services: 0.035, restaurant: 0.030, salon_spa: 0.032, healthcare: 0.038, legal: 0.045, retail: 0.025, automotive: 0.022, professional: 0.040, default: 0.025 };

  const currentCtr = ctrByPosition[currentRank] || 0.025;
  const targetCtr = ctrByPosition[1]; // #1 position
  const convRate = conversionRates[industry] || 0.025;

  const currentClicks = Math.round(monthlyVisitors * currentCtr);
  const targetClicks = Math.round(monthlyVisitors * targetCtr);
  const clickGain = targetClicks - currentClicks;

  const currentConversions = Math.round(currentClicks * convRate);
  const targetConversions = Math.round(targetClicks * convRate);
  const conversionGain = targetConversions - currentConversions;

  const currentRevenue = Math.round(currentConversions * avgCustomerValue);
  const targetRevenue = Math.round(targetConversions * avgCustomerValue);
  const revenueGain = targetRevenue - currentRevenue;
  const annualGain = revenueGain * 12;

  const industries = [
    { value: "home_services", label: "Home Services (Plumber, Electrician)" },
    { value: "restaurant", label: "Restaurant / Food" },
    { value: "salon_spa", label: "Salon / Spa" },
    { value: "healthcare", label: "Healthcare / Dental" },
    { value: "legal", label: "Legal Services" },
    { value: "retail", label: "Retail Shop" },
    { value: "automotive", label: "Auto Repair / Dealership" },
    { value: "professional", label: "Professional Services" },
  ];

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
          <Eyebrow className="mb-4 justify-center">SEO ROI Calculator</Eyebrow>
          <h1 className="font-display font-bold text-[#1A201A] text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.05]">
            How much money is poor SEO costing you?
          </h1>
          <p className="mt-5 text-lg text-[#5C685C] max-w-2xl mx-auto leading-relaxed">
            Adjust the sliders below. See exactly how much revenue you could gain by moving to page one.
          </p>
        </div>
      </section>

      <section className="pb-16 lg:pb-24">
        <div className="max-w-3xl mx-auto px-6 lg:px-10">
          <div className="bg-white border border-[#E5E0D8] rounded-2xl p-8">
            {/* Industry */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#1A201A] mb-2">Your Industry</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full bg-[#FDFBF7] border border-[#E5E0D8] rounded-xl py-3 px-4 text-sm"
              >
                {industries.map((ind) => (
                  <option key={ind.value} value={ind.value}>{ind.label}</option>
                ))}
              </select>
            </div>

            {/* Monthly Visitors */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#1A201A] mb-2">
                Monthly Website Visitors: <strong>{monthlyVisitors.toLocaleString()}</strong>
              </label>
              <input
                type="range" min="500" max="50000" step="500" value={monthlyVisitors}
                onChange={(e) => setMonthlyVisitors(Number(e.target.value))}
                className="w-full accent-[#2D3E32]"
              />
              <div className="flex justify-between text-xs text-[#9CA89C] mt-1">
                <span>500</span><span>50,000</span>
              </div>
            </div>

            {/* Current Rank */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#1A201A] mb-2">
                Your Current Google Rank: <strong>#{currentRank}</strong>
              </label>
              <input
                type="range" min="1" max="10" step="1" value={currentRank}
                onChange={(e) => setCurrentRank(Number(e.target.value))}
                className="w-full accent-[#2D3E32]"
              />
              <div className="flex justify-between text-xs text-[#9CA89C] mt-1">
                <span>#1</span><span>#10</span>
              </div>
            </div>

            {/* Avg Customer Value */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#1A201A] mb-2">
                Average Customer Value: <strong>${avgCustomerValue.toLocaleString()}</strong>
              </label>
              <input
                type="range" min="25" max="10000" step="25" value={avgCustomerValue}
                onChange={(e) => setAvgCustomerValue(Number(e.target.value))}
                className="w-full accent-[#2D3E32]"
              />
              <div className="flex justify-between text-xs text-[#9CA89C] mt-1">
                <span>$25</span><span>$10,000</span>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="mt-8 bg-[#2D3E32] rounded-2xl p-8 text-center">
            <h2 className="font-display font-bold text-2xl text-[#FDFBF7] mb-6">Your Results</h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-[#FDFBF7]/10 rounded-xl p-4">
                <div className="text-xs text-[#FDFBF7]/60 mb-1">Current Monthly Revenue</div>
                <div className="text-2xl font-display font-bold text-[#FDFBF7]">${currentRevenue.toLocaleString()}</div>
              </div>
              <div className="bg-[#81B29A]/20 rounded-xl p-4">
                <div className="text-xs text-[#81B29A] mb-1">Potential at #1</div>
                <div className="text-2xl font-display font-bold text-[#81B29A]">${targetRevenue.toLocaleString()}</div>
              </div>
            </div>
            <div className="bg-[#E07A5F]/20 rounded-xl p-6 mb-6">
              <div className="text-sm text-[#E07A5F] mb-1">You're losing every month</div>
              <div className="text-4xl font-display font-bold text-[#FDFBF7]">${revenueGain.toLocaleString()}</div>
              <div className="text-sm text-[#FDFBF7]/60 mt-1">That's ${annualGain.toLocaleString()} per year</div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              <div>
                <div className="text-[#FDFBF7]/60">Clicks gained</div>
                <div className="font-display font-bold text-[#FDFBF7] text-lg">+{clickGain.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[#FDFBF7]/60">New customers</div>
                <div className="font-display font-bold text-[#FDFBF7] text-lg">+{conversionGain}</div>
              </div>
              <div>
                <div className="text-[#FDFBF7]/60">CTR improvement</div>
                <div className="font-display font-bold text-[#FDFBF7] text-lg">+{Math.round((targetCtr - currentCtr) * 100)}%</div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="mt-8 text-center">
            <p className="text-[#5C685C] mb-4">Want to stop losing ${revenueGain.toLocaleString()}/month?</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/audit" className="bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7] rounded-full px-8 py-3.5 text-sm font-medium transition-colors inline-flex items-center gap-2">
                Run free audit <ArrowRight size={16} />
              </Link>
              <Link to="/pricing" className="border border-[#E5E0D8] hover:border-[#2D3E32] text-[#1A201A] rounded-full px-8 py-3.5 text-sm font-medium transition-colors">
                See plans from $49/mo
              </Link>
            </div>
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
          <div>© {new Date().getFullYear()} Goodly. Estimates based on industry averages. Actual results vary.</div>
        </div>
      </footer>
    </div>
  );
}
