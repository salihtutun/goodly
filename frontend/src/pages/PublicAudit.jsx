import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { formatApiError } from "@/lib/api";
import { Logo, Eyebrow, ScoreRing } from "@/components/app/Common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Gauge, Leaf, Sparkles, ShieldCheck, Star } from "lucide-react";
import { toast } from "sonner";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function PublicAudit() {
  usePageMeta({ title: "Free SEO Audit", description: "Get a free SEO score for any website in 10 seconds. No signup required." });
  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const runAudit = async (e) => {
    e?.preventDefault();
    if (!url.trim()) return;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const { data } = await api.post("/audits", {
        url: url.trim().startsWith("http") ? url.trim() : `https://${url.trim()}`,
      });
      setResult(data);
    } catch (e) {
      if (e?.response?.status === 401) {
        // Need to register to run audits
        setError("create_account");
      } else {
        setError(formatApiError(e));
      }
    } finally {
      setBusy(false);
    }
  };

  const score = result?.result?.overall_score;
  const issues = result?.result?.issues || [];
  const highIssues = issues.filter((i) => i.severity === "high");
  const medIssues = issues.filter((i) => i.severity === "medium");

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      {/* Header */}
      <header className="border-b border-[#E5E0D8] bg-[#FDFBF7] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/"><Logo /></Link>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm text-[#5C685C] hover:text-[#1A201A]">Sign in</Link>
            <Button onClick={() => navigate("/register")} className="bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7] rounded-full text-sm">
              Sign up free
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16 lg:py-24">
        {!result ? (
          <>
            <div className="text-center">
              <Eyebrow className="justify-center">Free SEO Audit</Eyebrow>
              <h1 className="mt-4 font-display font-bold text-4xl sm:text-5xl lg:text-6xl text-[#1A201A] tracking-tight">
                How healthy is your website?
              </h1>
              <p className="mt-4 text-[#5C685C] text-lg max-w-xl mx-auto">
                Paste your URL. Get a score in 10 seconds. No signup. No credit card. Just honest answers.
              </p>
            </div>

            <form onSubmit={runAudit} className="mt-12 bg-white border border-[#E5E0D8] rounded-3xl p-8 shadow-sm">
              <label htmlFor="public-audit-url" className="label-eyebrow block mb-3">Your website URL</label>
              <Input
                id="public-audit-url"
                data-testid="public-audit-url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="yourshop.com or https://yourshop.com"
                className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl py-7 text-lg focus:ring-2 focus:ring-[#81B29A]"
                required
                autoFocus
              />

              {error && error !== "create_account" && (
                <div className="mt-4 text-sm text-[#E07A5F] bg-[#E07A5F]/10 border border-[#E07A5F]/30 rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              {error === "create_account" && (
                <div className="mt-6 bg-[#F3F0E9] border border-[#E5E0D8] rounded-2xl p-6 text-center">
                  <div className="font-display font-bold text-xl text-[#1A201A]">Create your free account to run audits</div>
                  <p className="mt-2 text-[#5C685C]">It takes 30 seconds. You'll get 3 free audits per month, forever.</p>
                  <Button onClick={() => navigate("/register")} className="mt-4 bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7] rounded-full px-8">
                    Create free account <ArrowRight size={16} className="ml-2" />
                  </Button>
                </div>
              )}

              <Button
                type="submit"
                disabled={busy}
                data-testid="public-audit-btn"
                className="mt-8 w-full bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7] rounded-full py-7 text-base"
              >
                {busy ? (
                  <span className="flex items-center gap-3"><Leaf className="loader-leaf" size={18}/> Crawling your site…</span>
                ) : (
                  <span className="flex items-center gap-2"><Gauge size={18}/> Get my free score</span>
                )}
              </Button>
              <p className="mt-5 text-xs text-[#5C685C] text-center">
                We check meta tags, headings, mobile-friendliness, performance, links, security, and content depth.
              </p>
            </form>

            {/* Trust signals */}
            <div className="mt-16 grid grid-cols-3 gap-6 text-center">
              <div>
                <div className="text-2xl font-display font-bold text-[#1A201A]">10s</div>
                <div className="text-sm text-[#5C685C] mt-1">Average scan time</div>
              </div>
              <div>
                <div className="text-2xl font-display font-bold text-[#1A201A]">50+</div>
                <div className="text-sm text-[#5C685C] mt-1">Signals checked</div>
              </div>
              <div>
                <div className="text-2xl font-display font-bold text-[#1A201A]">Free</div>
                <div className="text-sm text-[#5C685C] mt-1">No credit card</div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Results */}
            <div className="text-center">
              <Eyebrow className="justify-center">Your SEO Score</Eyebrow>
              <h1 className="mt-4 font-display font-bold text-4xl sm:text-5xl text-[#1A201A] tracking-tight">
                {result.result.url}
              </h1>
            </div>

            <div className="mt-10 bg-white border border-[#E5E0D8] rounded-2xl p-8">
              <div className="flex flex-col items-center">
                <ScoreRing score={score} size={180} />
                <div className="mt-4 label-eyebrow">Overall health</div>
              </div>

              <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                <div className="bg-[#FDFBF7] rounded-xl p-4">
                  <div className="text-2xl font-display font-bold text-[#E07A5F]">{highIssues.length}</div>
                  <div className="text-xs text-[#5C685C] mt-1">Critical issues</div>
                </div>
                <div className="bg-[#FDFBF7] rounded-xl p-4">
                  <div className="text-2xl font-display font-bold text-[#E6A57E]">{medIssues.length}</div>
                  <div className="text-xs text-[#5C685C] mt-1">Warnings</div>
                </div>
                <div className="bg-[#FDFBF7] rounded-xl p-4">
                  <div className="text-2xl font-display font-bold text-[#81B29A]">{issues.length - highIssues.length - medIssues.length}</div>
                  <div className="text-xs text-[#5C685C] mt-1">Passed checks</div>
                </div>
              </div>

              {highIssues.length > 0 && (
                <div className="mt-6">
                  <div className="label-eyebrow mb-3">Top issues to fix</div>
                  <div className="space-y-2">
                    {highIssues.slice(0, 3).map((issue, i) => (
                      <div key={i} className="flex items-start gap-3 bg-[#E07A5F]/5 border border-[#E07A5F]/20 rounded-xl p-3">
                        <ShieldCheck size={16} className="text-[#E07A5F] mt-0.5 shrink-0" />
                        <div>
                          <div className="text-sm font-medium text-[#1A201A]">{issue.title || issue.message}</div>
                          {issue.description && <div className="text-xs text-[#5C685C] mt-0.5">{issue.description}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* CTA to register */}
            <div className="mt-8 bg-[#2D3E32] rounded-2xl p-8 text-center">
              <Sparkles size={32} className="text-[#81B29A] mx-auto mb-4" />
              <h2 className="font-display font-bold text-2xl text-[#FDFBF7]">Want the full action plan?</h2>
              <p className="mt-2 text-[#FDFBF7]/70 max-w-md mx-auto">
                Create your free account to see AI-powered recommendations, track your score over time, and get a step-by-step fix plan.
              </p>
              <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => navigate("/register")} className="bg-[#81B29A] hover:bg-[#6A9A82] text-[#1A201A] rounded-full px-8 font-medium">
                  Create free account <ArrowRight size={16} className="ml-2" />
                </Button>
                <Button onClick={() => navigate("/login")} variant="outline" className="border-[#FDFBF7]/30 text-[#FDFBF7] hover:bg-[#FDFBF7]/10 rounded-full">
                  I already have an account
                </Button>
              </div>
              <div className="mt-4 flex items-center justify-center gap-4 text-xs text-[#FDFBF7]/50">
                <span className="flex items-center gap-1"><Star size={12} /> 3 free audits/month</span>
                <span className="flex items-center gap-1"><Star size={12} /> AI action plan</span>
                <span className="flex items-center gap-1"><Star size={12} /> No credit card</span>
              </div>
            </div>

            {/* Try another */}
            <div className="mt-6 text-center">
              <button onClick={() => { setResult(null); setUrl(""); setError(""); }} className="text-sm text-[#5C685C] hover:text-[#1A201A] underline">
                ← Audit another website
              </button>
            </div>
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E5E0D8] py-8 text-center text-sm text-[#5C685C]">
        © 2026 Goodly. Real SEO for small companies that deserve to be found.
      </footer>
    </div>
  );
}
