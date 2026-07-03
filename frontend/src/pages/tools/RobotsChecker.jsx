import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/app/Common";
import { ArrowRight, Search, Loader2, FileCheck, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import api from "@/lib/api";

export default function RobotsChecker() {
  usePageMeta({
    title: "Free Robots.txt Checker — See what search engines can access",
    description: "Check if your website has a robots.txt file and what it allows or blocks. Free tool, no signup."
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
      setError(err?.response?.data?.detail || "Could not check this URL.");
    } finally {
      setLoading(false);
    }
  };

  const meta = result?.metadata || {};
  const robotsContent = meta.robots || "";
  const hasRobots = !!robotsContent;
  const isNoIndex = robotsContent.toLowerCase().includes("noindex");
  const isNoFollow = robotsContent.toLowerCase().includes("nofollow");
  const indexingScore = result?.categories?.headings ? 100 : 70;

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
          <h1 className="font-display font-bold text-4xl text-[#1A201A]">Free Robots.txt Checker</h1>
          <p className="mt-3 text-[#5C685C] text-lg">See what search engines can and can't access on your site. Check for noindex tags that block Google.</p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-xl mx-auto mb-10">
          <div className="flex gap-0">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA89C]" size={20} />
              <Input type="text" placeholder="yourwebsite.com" value={url} onChange={(e) => setUrl(e.target.value)} className="pl-12 py-6 text-lg rounded-l-2xl rounded-r-none border-[#D4CFC4]" disabled={loading} />
            </div>
            <Button type="submit" disabled={loading || !url.trim()} className="rounded-r-2xl rounded-l-none py-6 px-8 text-lg bg-[#E07A5F] hover:bg-[#D06A4F] text-white">
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Check"}
            </Button>
          </div>
        </form>

        {result && (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className={`rounded-2xl border p-8 text-center ${isNoIndex ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
              <FileCheck size={48} className="mx-auto mb-4 text-[#2D3E32]" />
              <div className="text-5xl font-display font-bold mb-2" style={{ color: isNoIndex ? '#dc2626' : '#16a34a' }}>
                {isNoIndex ? "Blocked!" : "Indexable"}
              </div>
              <div className="text-lg text-[#5C685C]">
                {isNoIndex ? "Your page has a noindex tag — Google won't show it in search results." : "Your page can be indexed by Google. No blocking directives found."}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 text-center">
                <div className="text-sm text-[#5C685C] mb-2">Robots Meta Tag</div>
                {hasRobots ? <CheckCircle2 size={32} className="mx-auto text-green-500" /> : <AlertTriangle size={32} className="mx-auto text-amber-500" />}
                <div className="text-sm font-medium mt-2 text-[#1A201A]">{hasRobots ? robotsContent : "Not set"}</div>
              </div>
              <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 text-center">
                <div className="text-sm text-[#5C685C] mb-2">Noindex</div>
                {isNoIndex ? <XCircle size={32} className="mx-auto text-red-400" /> : <CheckCircle2 size={32} className="mx-auto text-green-500" />}
                <div className="text-sm font-medium mt-2 text-[#1A201A]">{isNoIndex ? "BLOCKED" : "Allowed"}</div>
              </div>
              <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 text-center">
                <div className="text-sm text-[#5C685C] mb-2">Nofollow</div>
                {isNoFollow ? <AlertTriangle size={32} className="mx-auto text-amber-500" /> : <CheckCircle2 size={32} className="mx-auto text-green-500" />}
                <div className="text-sm font-medium mt-2 text-[#1A201A]">{isNoFollow ? "Links not followed" : "Links followed"}</div>
              </div>
            </div>

            <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6">
              <h3 className="font-display font-bold text-lg text-[#1A201A] mb-3">What this means</h3>
              <div className="space-y-3 text-sm text-[#5C685C] leading-relaxed">
                {isNoIndex && <p>🔴 <strong>Critical:</strong> Your page has a noindex directive. Google will NOT show this page in search results. If you want this page to rank, remove the noindex tag immediately.</p>}
                {!hasRobots && <p>⚠ No robots meta tag found. This is usually fine — Google will index your page by default. Add a robots tag only if you need to control indexing.</p>}
                {isNoFollow && <p>⚠ Nofollow is set. Links on this page won't pass SEO value. This is sometimes intentional (for user-generated content) but check it's not accidental.</p>}
                {!isNoIndex && !isNoFollow && <p>✅ Your page is set up correctly for search engine indexing. Google can crawl and index this page normally.</p>}
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
