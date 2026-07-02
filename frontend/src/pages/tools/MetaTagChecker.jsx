import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/app/Common";
import { ArrowRight, Search, Loader2, CheckCircle2, XCircle, AlertTriangle, ExternalLink } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import api from "@/lib/api";

export default function MetaTagChecker() {
  usePageMeta({
    title: "Free Meta Tag Checker — See your title & description tags",
    description: "Check any website's meta tags instantly. See title, description, Open Graph tags, and more. Free tool, no signup."
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
      setError(err?.response?.data?.detail || "Could not analyze this URL. Please check and try again.");
    } finally {
      setLoading(false);
    }
  };

  const meta = result?.metadata || {};
  const scoreColor = (s) => s >= 80 ? "text-green-600" : s >= 60 ? "text-amber-600" : "text-red-500";

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <header className="border-b border-[#E5E0D8] bg-[#FDFBF7] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/"><Logo /></Link>
          <Link to="/register" className="text-sm bg-[#2D3E32] hover:bg-[#4A5F4F] text-white rounded-full px-5 py-2.5">Get full audit →</Link>
        </div>
      </header>

      <main id="main-content" className="max-w-4xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-[#9CA89C] mb-6" aria-label="Breadcrumb">
          <Link to="/" className="hover:text-[#1A201A]">Home</Link>
          <span>/</span>
          <Link to="/tools/meta-tag-checker" className="hover:text-[#1A201A]">Free Tools</Link>
          <span>/</span>
          <span className="text-[#5C685C]">Meta Tag Checker</span>
        </nav>

        <div className="text-center mb-10">
          <h1 className="font-display font-bold text-4xl text-[#1A201A]">Free Meta Tag Checker</h1>
          <p className="mt-3 text-[#5C685C] text-lg">See exactly what Google sees when it looks at your page.</p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-xl mx-auto mb-10">
          <div className="flex gap-0">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA89C]" size={20} />
              <Input
                type="text"
                placeholder="yourwebsite.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="pl-12 py-6 text-lg rounded-l-2xl rounded-r-none border-[#D4CFC4]"
                disabled={loading}
              />
            </div>
            <Button type="submit" disabled={loading || !url.trim()} className="rounded-r-2xl rounded-l-none py-6 px-8 text-lg bg-[#E07A5F] hover:bg-[#D06A4F] text-white">
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Check"}
            </Button>
          </div>
          {error && <p className="mt-3 text-sm text-red-500 flex items-center gap-1.5"><AlertTriangle size={14} /> {error}</p>}
        </form>

        {result && (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
            {/* Score */}
            <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-[#5C685C] font-medium">Meta Tag Score</div>
                  <div className="text-xs text-[#9CA89C] truncate max-w-[300px]">{result.url}</div>
                </div>
                <div className={`text-4xl font-display font-bold ${scoreColor(result.overall_score)}`}>
                  {result.overall_score}<span className="text-lg font-normal text-[#9CA89C]">/100</span>
                </div>
              </div>
            </div>

            {/* Title */}
            <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6">
              <h3 className="font-display font-bold text-lg text-[#1A201A] mb-3">Title Tag</h3>
              <div className="bg-[#F3F0E9] rounded-xl p-4 mb-3">
                <p className="text-[#1A201A] font-medium">{meta.title || "(missing)"}</p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className={meta.title_length >= 30 && meta.title_length <= 60 ? "text-green-600" : "text-amber-600"}>
                  {meta.title_length} characters {meta.title_length >= 30 && meta.title_length <= 60 ? "✓ Optimal" : meta.title_length < 30 ? "⚠ Too short" : "⚠ Too long"}
                </span>
                <span className="text-[#9CA89C]">Google shows ~50-60 chars</span>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6">
              <h3 className="font-display font-bold text-lg text-[#1A201A] mb-3">Meta Description</h3>
              <div className="bg-[#F3F0E9] rounded-xl p-4 mb-3">
                <p className="text-[#1A201A]">{meta.description || "(missing)"}</p>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className={meta.description_length >= 120 && meta.description_length <= 160 ? "text-green-600" : "text-amber-600"}>
                  {meta.description_length} characters {meta.description_length >= 120 && meta.description_length <= 160 ? "✓ Optimal" : meta.description_length < 120 ? "⚠ Too short" : "⚠ Too long"}
                </span>
                <span className="text-[#9CA89C]">Google shows ~120-160 chars</span>
              </div>
            </div>

            {/* Open Graph */}
            <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6">
              <h3 className="font-display font-bold text-lg text-[#1A201A] mb-3">Social Sharing (Open Graph)</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-[#F3F0E9] rounded-xl p-4">
                  <div className="text-xs text-[#5C685C] mb-1">OG Title</div>
                  <div className="flex items-center gap-2">
                    {meta.og_title ? <CheckCircle2 size={16} className="text-green-500" /> : <XCircle size={16} className="text-red-400" />}
                    <span className="text-sm text-[#1A201A] truncate">{meta.og_title || "Missing"}</span>
                  </div>
                </div>
                <div className="bg-[#F3F0E9] rounded-xl p-4">
                  <div className="text-xs text-[#5C685C] mb-1">OG Description</div>
                  <div className="flex items-center gap-2">
                    {meta.og_description ? <CheckCircle2 size={16} className="text-green-500" /> : <XCircle size={16} className="text-red-400" />}
                    <span className="text-sm text-[#1A201A] truncate">{meta.og_description || "Missing"}</span>
                  </div>
                </div>
                <div className="bg-[#F3F0E9] rounded-xl p-4">
                  <div className="text-xs text-[#5C685C] mb-1">OG Image</div>
                  <div className="flex items-center gap-2">
                    {meta.og_image ? <CheckCircle2 size={16} className="text-green-500" /> : <XCircle size={16} className="text-red-400" />}
                    <span className="text-sm text-[#1A201A] truncate">{meta.og_image ? "Set" : "Missing"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Other tags */}
            <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6">
              <h3 className="font-display font-bold text-lg text-[#1A201A] mb-3">Other Tags</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div className="bg-[#F3F0E9] rounded-xl p-3">
                  <div className="text-xs text-[#5C685C]">Canonical</div>
                  <div className="mt-1">{meta.canonical ? <CheckCircle2 size={14} className="text-green-500 inline" /> : <XCircle size={14} className="text-red-400 inline" />} <span className="text-[#1A201A]">{meta.canonical ? "Set" : "Missing"}</span></div>
                </div>
                <div className="bg-[#F3F0E9] rounded-xl p-3">
                  <div className="text-xs text-[#5C685C]">Viewport</div>
                  <div className="mt-1">{meta.has_viewport ? <CheckCircle2 size={14} className="text-green-500 inline" /> : <XCircle size={14} className="text-red-400 inline" />} <span className="text-[#1A201A]">{meta.has_viewport ? "Mobile-ready" : "Missing"}</span></div>
                </div>
                <div className="bg-[#F3F0E9] rounded-xl p-3">
                  <div className="text-xs text-[#5C685C]">HTTPS</div>
                  <div className="mt-1">{meta.is_https ? <CheckCircle2 size={14} className="text-green-500 inline" /> : <XCircle size={14} className="text-red-400 inline" />} <span className="text-[#1A201A]">{meta.is_https ? "Secure" : "Not secure"}</span></div>
                </div>
                <div className="bg-[#F3F0E9] rounded-xl p-3">
                  <div className="text-xs text-[#5C685C]">Schema</div>
                  <div className="mt-1">{meta.has_schema ? <CheckCircle2 size={14} className="text-green-500 inline" /> : <XCircle size={14} className="text-red-400 inline" />} <span className="text-[#1A201A]">{meta.has_schema ? "Found" : "Missing"}</span></div>
                </div>
              </div>
            </div>

            {/* CTA */}
            <div className="bg-gradient-to-r from-[#2D3E32] to-[#4A5F4F] rounded-2xl p-8 text-center text-white">
              <h3 className="font-display font-bold text-2xl mb-2">Want the full picture?</h3>
              <p className="text-white/80 mb-6">Get a complete SEO audit with 50+ checks, AI action plan, and competitor analysis.</p>
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
