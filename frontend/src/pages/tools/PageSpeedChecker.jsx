import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/app/Common";
import { ArrowRight, Search, Loader2, Gauge, Clock, Zap, Smartphone, Monitor } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import api from "@/lib/api";

export default function PageSpeedChecker() {
  usePageMeta({
    title: "Free Page Speed Test — Check your website loading time",
    description: "Test how fast your website loads. See load time, page size, and get tips to speed it up. Free tool, no signup."
  });

  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    let normalized = trimmed;
    if (!/^https?:\/\//i.test(normalized)) normalized = "https://" + normalized;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data } = await api.post("/public/audit", { url: normalized });
      setResult(data);
    } catch (err) {
      setError(err?.response?.data?.detail || "Could not test this URL.");
    } finally {
      setLoading(false);
    }
  };

  const loadMs = result?.load_time_ms || 0;
  const loadSec = (loadMs / 1000).toFixed(1);
  const perfScore = result?.categories?.performance || 0;

  const speedLabel = loadMs < 800 ? "Fast" : loadMs < 1800 ? "Average" : loadMs < 3500 ? "Slow" : "Very Slow";
  const speedColor = loadMs < 800 ? "text-green-600" : loadMs < 1800 ? "text-amber-600" : "text-red-500";
  const speedBg = loadMs < 800 ? "bg-green-50 border-green-200" : loadMs < 1800 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200";

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <header className="border-b border-[#E5E0D8] bg-[#FDFBF7] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/"><Logo /></Link>
          <Link to="/register" className="text-sm bg-[#2D3E32] hover:bg-[#4A5F4F] text-white rounded-full px-5 py-2.5">Get full audit →</Link>
        </div>
      </header>

      <main id="main-content" className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <h1 className="font-display font-bold text-4xl text-[#1A201A]">Free Page Speed Test</h1>
          <p className="mt-3 text-[#5C685C] text-lg">See how fast your website loads — and why it matters for Google rankings.</p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-xl mx-auto mb-10">
          <div className="flex gap-0">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA89C]" size={20} />
              <Input type="text" placeholder="yourwebsite.com" value={url} onChange={(e) => setUrl(e.target.value)} className="pl-12 py-6 text-lg rounded-l-2xl rounded-r-none border-[#D4CFC4]" disabled={loading} />
            </div>
            <Button type="submit" disabled={loading || !url.trim()} className="rounded-r-2xl rounded-l-none py-6 px-8 text-lg bg-[#E07A5F] hover:bg-[#D06A4F] text-white">
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Test Speed"}
            </Button>
          </div>
        </form>

        {result && (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
            {/* Speed result */}
            <div className={`rounded-2xl border p-8 text-center ${speedBg}`}>
              <Gauge size={48} className="mx-auto mb-4 text-[#2D3E32]" />
              <div className={`text-5xl font-display font-bold ${speedColor} mb-2`}>{loadSec}s</div>
              <div className={`text-lg font-medium ${speedColor}`}>{speedLabel}</div>
              <div className="text-sm text-[#5C685C] mt-2">{loadMs}ms to load</div>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 text-center">
                <Clock size={24} className="mx-auto mb-2 text-[#81B29A]" />
                <div className="font-display font-bold text-2xl text-[#1A201A]">{loadSec}s</div>
                <div className="text-xs text-[#5C685C] mt-1">Load Time</div>
              </div>
              <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 text-center">
                <Zap size={24} className="mx-auto mb-2 text-[#E07A5F]" />
                <div className="font-display font-bold text-2xl text-[#1A201A]">{perfScore}/100</div>
                <div className="text-xs text-[#5C685C] mt-1">Speed Score</div>
              </div>
              <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 text-center">
                <Monitor size={24} className="mx-auto mb-2 text-[#2D3E32]" />
                <div className="font-display font-bold text-2xl text-[#1A201A]">{result.status_code || "—"}</div>
                <div className="text-xs text-[#5C685C] mt-1">Status Code</div>
              </div>
            </div>

            {/* What this means */}
            <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6">
              <h3 className="font-display font-bold text-lg text-[#1A201A] mb-3">What this means for your business</h3>
              <div className="space-y-3 text-sm text-[#5C685C] leading-relaxed">
                {loadMs < 800 && (
                  <p>✓ Your site loads fast. Google loves fast sites — this helps your ranking. Visitors are less likely to bounce.</p>
                )}
                {loadMs >= 800 && loadMs < 1800 && (
                  <p>⚠ Your site is average. About 30% of visitors will leave if a page takes more than 3 seconds. A few optimizations could make a big difference.</p>
                )}
                {loadMs >= 1800 && loadMs < 3500 && (
                  <p>⚠ Your site is slow. Over 50% of mobile visitors abandon sites that take more than 3 seconds. Google penalizes slow sites in rankings.</p>
                )}
                {loadMs >= 3500 && (
                  <p>🔴 Your site is very slow. You're likely losing over 50% of potential visitors. Google heavily penalizes slow sites. This needs immediate attention.</p>
                )}
                <p className="text-xs text-[#9CA89C] mt-2">Tip: Compress images, enable browser caching, and use a CDN to speed up your site.</p>
              </div>
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-r from-[#2D3E32] to-[#4A5F4F] rounded-2xl p-8 text-center text-white">
              <h3 className="font-display font-bold text-2xl mb-2">See all 50+ SEO checks</h3>
              <p className="text-white/80 mb-6">Get a complete audit including meta tags, mobile-friendliness, content quality, and more.</p>
              <Link to="/register" className="inline-block bg-[#E07A5F] hover:bg-[#D06A4F] text-white rounded-full px-8 py-3 font-medium">
                Get free full audit <ArrowRight size={16} className="inline ml-1" />
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
