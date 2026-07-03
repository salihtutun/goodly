import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/app/Common";
import { ArrowRight, Search, Loader2, Heading, CheckCircle2, XCircle, AlertTriangle, List } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import api from "@/lib/api";

export default function HeadingChecker() {
  usePageMeta({
    title: "Free Heading Structure Analyzer — Check your H1, H2, H3 tags",
    description: "Analyze your heading structure. See H1, H2, H3 counts and get tips for better SEO. Free tool, no signup."
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
      setError(err?.response?.data?.detail || "Could not analyze this URL.");
    } finally {
      setLoading(false);
    }
  };

  const headings = result?.headings || {};
  const h1Count = headings.h1_count || 0;
  const h2Count = headings.h2_count || 0;
  const h3Count = headings.h3_count || 0;
  const h1s = headings.h1 || [];
  const h2s = headings.h2 || [];
  const headingScore = result?.categories?.headings || 0;

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
          <h1 className="font-display font-bold text-4xl text-[#1A201A]">Free Heading Structure Analyzer</h1>
          <p className="mt-3 text-[#5C685C] text-lg">See how your headings are structured. Google uses headings to understand your page content.</p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-xl mx-auto mb-10">
          <div className="flex gap-0">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA89C]" size={20} />
              <Input type="text" placeholder="yourwebsite.com" value={url} onChange={(e) => setUrl(e.target.value)} className="pl-12 py-6 text-lg rounded-l-2xl rounded-r-none border-[#D4CFC4]" disabled={loading} />
            </div>
            <Button type="submit" disabled={loading || !url.trim()} className="rounded-r-2xl rounded-l-none py-6 px-8 text-lg bg-[#E07A5F] hover:bg-[#D06A4F] text-white">
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Analyze"}
            </Button>
          </div>
        </form>

        {result && (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className={`rounded-2xl border p-8 text-center ${headingScore >= 80 ? 'bg-green-50 border-green-200' : headingScore >= 50 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
              <Heading size={48} className="mx-auto mb-4 text-[#2D3E32]" />
              <div className="text-5xl font-display font-bold text-[#1A201A] mb-2">{headingScore}/100</div>
              <div className="text-lg text-[#5C685C]">
                {headingScore >= 80 ? "Well-structured headings" : headingScore >= 50 ? "Needs improvement" : "Poor heading structure"}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className={`bg-white border rounded-2xl p-5 text-center ${h1Count === 1 ? 'border-green-200' : 'border-red-200'}`}>
                <div className="text-sm text-[#5C685C] mb-2">H1 Tags</div>
                <div className="text-3xl font-display font-bold text-[#1A201A]">{h1Count}</div>
                <div className="text-xs mt-1" style={{ color: h1Count === 1 ? '#16a34a' : '#dc2626' }}>
                  {h1Count === 0 ? "Missing!" : h1Count === 1 ? "Perfect" : "Too many!"}
                </div>
              </div>
              <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 text-center">
                <div className="text-sm text-[#5C685C] mb-2">H2 Tags</div>
                <div className="text-3xl font-display font-bold text-[#1A201A]">{h2Count}</div>
                <div className="text-xs text-[#9CA89C] mt-1">Sub-sections</div>
              </div>
              <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 text-center">
                <div className="text-sm text-[#5C685C] mb-2">H3 Tags</div>
                <div className="text-3xl font-display font-bold text-[#1A201A]">{h3Count}</div>
                <div className="text-xs text-[#9CA89C] mt-1">Sub-topics</div>
              </div>
            </div>

            {h1s.length > 0 && (
              <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6">
                <h3 className="font-display font-bold text-lg text-[#1A201A] mb-3">Your H1 Headings</h3>
                <div className="space-y-2">
                  {h1s.map((h, i) => (
                    <div key={i} className="bg-[#F3F0E9] rounded-xl p-3 text-sm text-[#1A201A] font-medium">{h}</div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6">
              <h3 className="font-display font-bold text-lg text-[#1A201A] mb-3">What this means</h3>
              <div className="space-y-3 text-sm text-[#5C685C] leading-relaxed">
                {h1Count === 0 && <p>🔴 <strong>No H1 found:</strong> Every page needs exactly one H1 heading. It tells Google what your page is about. Add one clear, descriptive H1.</p>}
                {h1Count > 1 && <p>⚠ <strong>{h1Count} H1s found:</strong> Use only one H1 per page. Multiple H1s confuse search engines about your page's main topic.</p>}
                {h1Count === 1 && <p>✅ One H1 heading — perfect! Google knows exactly what your page is about.</p>}
                {h2Count === 0 && <p>⚠ No H2 headings. Use H2s to break your content into sections. This helps both readers and search engines.</p>}
                {h2Count > 0 && <p>✅ {h2Count} H2 headings — good structure for organizing your content.</p>}
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#2D3E32] to-[#4A5F4F] rounded-2xl p-8 text-center text-white">
              <h3 className="font-display font-bold text-2xl mb-2">Get the full SEO audit</h3>
              <p className="text-white/80 mb-6">See all 50+ checks including meta tags, speed, mobile, and more.</p>
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
