import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/app/Common";
import { ArrowRight, Search, Loader2, Code, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import api from "@/lib/api";

export default function SchemaValidator() {
  usePageMeta({
    title: "Free Structured Data Validator — Check your schema markup",
    description: "Check if your website has JSON-LD structured data. See schema status and get tips for rich results. Free tool, no signup."
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
  const hasSchema = meta.has_schema;
  const hasOG = meta.og_title || meta.og_description;
  const canonical = meta.canonical;

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
          <h1 className="font-display font-bold text-4xl text-[#1A201A]">Free Structured Data Validator</h1>
          <p className="mt-3 text-[#5C685C] text-lg">Check if your site has schema markup. Structured data helps Google show rich results like star ratings and FAQs.</p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-xl mx-auto mb-10">
          <div className="flex gap-0">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA89C]" size={20} />
              <Input type="text" placeholder="yourwebsite.com" value={url} onChange={(e) => setUrl(e.target.value)} className="pl-12 py-6 text-lg rounded-l-2xl rounded-r-none border-[#D4CFC4]" disabled={loading} />
            </div>
            <Button type="submit" disabled={loading || !url.trim()} className="rounded-r-2xl rounded-l-none py-6 px-8 text-lg bg-[#E07A5F] hover:bg-[#D06A4F] text-white">
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Check Schema"}
            </Button>
          </div>
        </form>

        {result && (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className={`rounded-2xl border p-8 text-center ${hasSchema ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
              <Code size={48} className="mx-auto mb-4 text-[#2D3E32]" />
              <div className="text-5xl font-display font-bold text-[#1A201A] mb-2">
                {hasSchema ? "Schema Found" : "No Schema"}
              </div>
              <div className="text-lg text-[#5C685C]">
                {hasSchema ? "Your site has JSON-LD structured data — great for rich results!" : "Your site doesn't have structured data. You're missing out on rich results in Google."}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 text-center">
                <div className="text-sm text-[#5C685C] mb-2">JSON-LD Schema</div>
                {hasSchema ? <CheckCircle2 size={32} className="mx-auto text-green-500" /> : <XCircle size={32} className="mx-auto text-red-400" />}
                <div className="text-sm font-medium mt-2 text-[#1A201A]">{hasSchema ? "Present" : "Missing"}</div>
              </div>
              <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 text-center">
                <div className="text-sm text-[#5C685C] mb-2">Open Graph Tags</div>
                {hasOG ? <CheckCircle2 size={32} className="mx-auto text-green-500" /> : <XCircle size={32} className="mx-auto text-red-400" />}
                <div className="text-sm font-medium mt-2 text-[#1A201A]">{hasOG ? "Present" : "Missing"}</div>
              </div>
              <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 text-center">
                <div className="text-sm text-[#5C685C] mb-2">Canonical URL</div>
                {canonical ? <CheckCircle2 size={32} className="mx-auto text-green-500" /> : <XCircle size={32} className="mx-auto text-red-400" />}
                <div className="text-sm font-medium mt-2 text-[#1A201A]">{canonical ? "Present" : "Missing"}</div>
              </div>
            </div>

            <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6">
              <h3 className="font-display font-bold text-lg text-[#1A201A] mb-3">What this means</h3>
              <div className="space-y-3 text-sm text-[#5C685C] leading-relaxed">
                {!hasSchema && (
                  <>
                    <p>⚠ <strong>Missing structured data:</strong> Without JSON-LD schema, Google can't show rich results for your pages — no star ratings, no FAQs, no product prices in search results.</p>
                    <p>Fix: Add JSON-LD structured data. For a business, use Organization or LocalBusiness schema. For articles, use Article schema. For products, use Product schema.</p>
                  </>
                )}
                {!hasOG && <p>⚠ <strong>Missing Open Graph tags:</strong> Without OG tags, your pages won't have nice previews when shared on Facebook, LinkedIn, or Twitter.</p>}
                {!canonical && <p>⚠ <strong>Missing canonical URL:</strong> Without a canonical tag, Google may index duplicate versions of your pages, diluting your rankings.</p>}
                {hasSchema && hasOG && canonical && <p>✅ Your site has all three key markup elements — schema, Open Graph, and canonical URL. Great for SEO and social sharing!</p>}
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#2D3E32] to-[#4A5F4F] rounded-2xl p-8 text-center text-white">
              <h3 className="font-display font-bold text-2xl mb-2">Get the full technical SEO audit</h3>
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
