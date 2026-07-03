import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/app/Common";
import { ArrowRight, Search, Loader2, Smartphone, Monitor, CheckCircle2, XCircle } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import api from "@/lib/api";

export default function MobileFriendlyChecker() {
  usePageMeta({
    title: "Free Mobile-Friendly Test — Check if your site works on phones",
    description: "Test if your website is mobile-friendly. See viewport settings, responsive design checks, and get tips. Free tool, no signup."
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

  const meta = result?.metadata || {};
  const mobileScore = result?.categories?.mobile || 0;
  const hasViewport = meta.has_viewport;
  const isHttps = meta.is_https;
  const loadMs = result?.load_time_ms || 0;

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
          <h1 className="font-display font-bold text-4xl text-[#1A201A]">Free Mobile-Friendly Test</h1>
          <p className="mt-3 text-[#5C685C] text-lg">See if your website works on phones. Over 60% of searches are on mobile.</p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-xl mx-auto mb-10">
          <div className="flex gap-0">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA89C]" size={20} />
              <Input type="text" placeholder="yourwebsite.com" value={url} onChange={(e) => setUrl(e.target.value)} className="pl-12 py-6 text-lg rounded-l-2xl rounded-r-none border-[#D4CFC4]" disabled={loading} />
            </div>
            <Button type="submit" disabled={loading || !url.trim()} className="rounded-r-2xl rounded-l-none py-6 px-8 text-lg bg-[#E07A5F] hover:bg-[#D06A4F] text-white">
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Test"}
            </Button>
          </div>
        </form>

        {result && (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className={`rounded-2xl border p-8 text-center ${mobileScore >= 80 ? 'bg-green-50 border-green-200' : mobileScore >= 50 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
              <Smartphone size={48} className="mx-auto mb-4 text-[#2D3E32]" />
              <div className="text-5xl font-display font-bold text-[#1A201A] mb-2">{mobileScore}/100</div>
              <div className="text-lg font-medium text-[#5C685C]">
                {mobileScore >= 80 ? "Mobile-friendly" : mobileScore >= 50 ? "Needs work" : "Not mobile-friendly"}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 text-center">
                <div className="text-sm text-[#5C685C] mb-2">Viewport Meta Tag</div>
                {hasViewport ? <CheckCircle2 size={32} className="mx-auto text-green-500" /> : <XCircle size={32} className="mx-auto text-red-400" />}
                <div className="text-sm font-medium mt-2 text-[#1A201A]">{hasViewport ? "Present" : "Missing"}</div>
              </div>
              <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 text-center">
                <div className="text-sm text-[#5C685C] mb-2">HTTPS Secure</div>
                {isHttps ? <CheckCircle2 size={32} className="mx-auto text-green-500" /> : <XCircle size={32} className="mx-auto text-red-400" />}
                <div className="text-sm font-medium mt-2 text-[#1A201A]">{isHttps ? "Secure" : "Not secure"}</div>
              </div>
              <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 text-center">
                <div className="text-sm text-[#5C685C] mb-2">Load Time</div>
                <Monitor size={32} className="mx-auto text-[#2D3E32]" />
                <div className="text-sm font-medium mt-2 text-[#1A201A]">{(loadMs/1000).toFixed(1)}s</div>
              </div>
            </div>

            <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6">
              <h3 className="font-display font-bold text-lg text-[#1A201A] mb-3">What this means</h3>
              <div className="space-y-3 text-sm text-[#5C685C] leading-relaxed">
                {!hasViewport && <p>⚠ Your site is missing the viewport meta tag. Without it, mobile browsers can't scale your page properly. Add: <code className="bg-[#F3F0E9] px-1.5 py-0.5 rounded text-xs">&lt;meta name="viewport" content="width=device-width, initial-scale=1"&gt;</code></p>}
                {!isHttps && <p>⚠ Your site doesn't use HTTPS. Google marks non-HTTPS sites as "Not Secure" and penalizes them in rankings.</p>}
                {loadMs > 3000 && <p>⚠ Your site loads slowly on mobile ({loadMs}ms). Over 53% of mobile visitors leave if a page takes more than 3 seconds.</p>}
                {mobileScore >= 80 && <p>✅ Your site is mobile-friendly. Google will rank you higher for mobile searches.</p>}
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#2D3E32] to-[#4A5F4F] rounded-2xl p-8 text-center text-white">
              <h3 className="font-display font-bold text-2xl mb-2">Get the full mobile + SEO audit</h3>
              <p className="text-white/80 mb-6">See all 50+ checks including meta tags, speed, content, and more.</p>
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
