import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/app/Common";
import { ArrowRight, Search, Loader2, BarChart3, FileText } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import api from "@/lib/api";

export default function KeywordDensityChecker() {
  usePageMeta({
    title: "Free Keyword Density Analyzer — Check your page's keyword usage",
    description: "Analyze keyword density on any webpage. See word count, top keywords, and get optimization tips. Free tool, no signup."
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

  const wordCount = result?.content?.word_count || 0;
  const textPreview = result?.content?.text_preview || "";
  const contentScore = result?.categories?.content || 0;
  const headings = result?.headings || {};

  // Extract top words from text preview
  const topWords = (() => {
    if (!textPreview) return [];
    const words = textPreview.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const stopWords = new Set(["this", "that", "with", "from", "they", "will", "have", "been", "were", "about", "which", "their", "your"]);
    const freq = {};
    words.forEach(w => {
      const clean = w.replace(/[^a-z]/g, '');
      if (clean && !stopWords.has(clean)) freq[clean] = (freq[clean] || 0) + 1;
    });
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 10);
  })();

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
          <h1 className="font-display font-bold text-4xl text-[#1A201A]">Free Keyword Density Analyzer</h1>
          <p className="mt-3 text-[#5C685C] text-lg">See what words appear most on your page and if you have enough content for Google.</p>
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 text-center">
                <FileText size={28} className="mx-auto mb-2 text-[#81B29A]" />
                <div className="text-3xl font-display font-bold text-[#1A201A]">{wordCount}</div>
                <div className="text-xs text-[#5C685C] mt-1">Total Words</div>
              </div>
              <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 text-center">
                <BarChart3 size={28} className="mx-auto mb-2 text-[#E07A5F]" />
                <div className="text-3xl font-display font-bold text-[#1A201A]">{contentScore}/100</div>
                <div className="text-xs text-[#5C685C] mt-1">Content Score</div>
              </div>
              <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 text-center">
                <Search size={28} className="mx-auto mb-2 text-[#2D3E32]" />
                <div className="text-3xl font-display font-bold text-[#1A201A]">{topWords.length}</div>
                <div className="text-xs text-[#5C685C] mt-1">Top Keywords Found</div>
              </div>
            </div>

            {topWords.length > 0 && (
              <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6">
                <h3 className="font-display font-bold text-lg text-[#1A201A] mb-4">Top Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {topWords.map(([word, count]) => (
                    <span key={word} className="bg-[#F3F0E9] text-[#1A201A] px-3 py-1.5 rounded-full text-sm">
                      {word} <span className="text-[#9CA89C] text-xs ml-1">{count}x</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6">
              <h3 className="font-display font-bold text-lg text-[#1A201A] mb-3">Content Analysis</h3>
              <div className="space-y-3 text-sm text-[#5C685C] leading-relaxed">
                {wordCount < 300 && <p>⚠ Your page has {wordCount} words. Google considers pages with fewer than 300 words "thin content." Aim for 600+ words for better rankings.</p>}
                {wordCount >= 300 && wordCount < 600 && <p>⚠ Your page has {wordCount} words — decent, but expanding to 600+ words would help rankings.</p>}
                {wordCount >= 600 && <p>✅ Your page has {wordCount} words — good content length for SEO.</p>}
                {headings.h1_count === 0 && <p>⚠ No H1 heading found. Every page needs exactly one H1 that describes the main topic.</p>}
                {headings.h1_count > 1 && <p>⚠ {headings.h1_count} H1 headings found. Use only one H1 per page.</p>}
                {headings.h1_count === 1 && <p>✅ One H1 heading found — good structure.</p>}
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#2D3E32] to-[#4A5F4F] rounded-2xl p-8 text-center text-white">
              <h3 className="font-display font-bold text-2xl mb-2">Get the full content + SEO audit</h3>
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
