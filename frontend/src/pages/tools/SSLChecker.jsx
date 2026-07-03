import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/app/Common";
import { ArrowRight, Search, Loader2, Shield, CheckCircle2, XCircle, AlertTriangle, Lock, Globe } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";
import api from "@/lib/api";

export default function SSLChecker() {
  usePageMeta({
    title: "Free SSL Certificate Checker — Verify your site's HTTPS security",
    description: "Check if your website has a valid SSL certificate. See HTTPS status, security score, and get tips. Free tool, no signup."
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
  const isHttps = meta.is_https;
  const securityScore = result?.categories?.security || 0;
  const statusCode = result?.status_code;

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
          <h1 className="font-display font-bold text-4xl text-[#1A201A]">Free SSL Certificate Checker</h1>
          <p className="mt-3 text-[#5C685C] text-lg">Check if your site uses HTTPS. Google penalizes non-secure sites and marks them "Not Secure."</p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-xl mx-auto mb-10">
          <div className="flex gap-0">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA89C]" size={20} />
              <Input type="text" placeholder="yourwebsite.com" value={url} onChange={(e) => setUrl(e.target.value)} className="pl-12 py-6 text-lg rounded-l-2xl rounded-r-none border-[#D4CFC4]" disabled={loading} />
            </div>
            <Button type="submit" disabled={loading || !url.trim()} className="rounded-r-2xl rounded-l-none py-6 px-8 text-lg bg-[#E07A5F] hover:bg-[#D06A4F] text-white">
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Check SSL"}
            </Button>
          </div>
        </form>

        {result && (
          <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
            <div className={`rounded-2xl border p-8 text-center ${isHttps ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              {isHttps ? <Lock size={48} className="mx-auto mb-4 text-green-600" /> : <Globe size={48} className="mx-auto mb-4 text-red-500" />}
              <div className="text-5xl font-display font-bold mb-2" style={{ color: isHttps ? '#16a34a' : '#dc2626' }}>
                {isHttps ? "Secure" : "Not Secure"}
              </div>
              <div className="text-lg text-[#5C685C]">
                {isHttps ? "Your site uses HTTPS with a valid SSL certificate." : "Your site does not use HTTPS. Google marks it as 'Not Secure' in Chrome."}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 text-center">
                <div className="text-sm text-[#5C685C] mb-2">HTTPS</div>
                {isHttps ? <CheckCircle2 size={32} className="mx-auto text-green-500" /> : <XCircle size={32} className="mx-auto text-red-400" />}
                <div className="text-sm font-medium mt-2 text-[#1A201A]">{isHttps ? "Enabled" : "Missing"}</div>
              </div>
              <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 text-center">
                <div className="text-sm text-[#5C685C] mb-2">Security Score</div>
                <Shield size={32} className="mx-auto text-[#2D3E32]" />
                <div className="text-sm font-medium mt-2 text-[#1A201A]">{securityScore}/100</div>
              </div>
              <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 text-center">
                <div className="text-sm text-[#5C685C] mb-2">Status Code</div>
                <div className="text-3xl font-display font-bold text-[#1A201A] mt-1">{statusCode || "—"}</div>
              </div>
            </div>

            <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6">
              <h3 className="font-display font-bold text-lg text-[#1A201A] mb-3">What this means for your business</h3>
              <div className="space-y-3 text-sm text-[#5C685C] leading-relaxed">
                {!isHttps && (
                  <>
                    <p>🔴 <strong>Critical:</strong> Your site is not secure. Google Chrome shows a "Not Secure" warning to visitors. This hurts trust and rankings.</p>
                    <p>Fix: Install an SSL certificate through your hosting provider. Most hosts offer free SSL via Let's Encrypt. Then force all traffic to HTTPS.</p>
                  </>
                )}
                {isHttps && (
                  <>
                    <p>✅ Your site uses HTTPS — good! Google favors secure sites in rankings.</p>
                    <p>Tip: Make sure all internal links use HTTPS (not HTTP) to avoid mixed content warnings.</p>
                  </>
                )}
                <p className="text-xs text-[#9CA89C] mt-2">Google has confirmed HTTPS is a ranking signal. Sites without SSL are penalized in search results.</p>
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#2D3E32] to-[#4A5F4F] rounded-2xl p-8 text-center text-white">
              <h3 className="font-display font-bold text-2xl mb-2">Get the full security + SEO audit</h3>
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
