import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { formatApiError } from "@/lib/api";
import { Logo, Eyebrow, ScoreRing } from "@/components/app/Common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Gauge, Leaf, Sparkles, ShieldCheck, Star, PenLine, Code, Copy } from "lucide-react";
import { toast } from "sonner";
import { usePageMeta } from "@/hooks/usePageMeta";
import EmailCapture from "@/components/app/EmailCapture";
import ShareAudit from "@/components/app/ShareAudit";

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
      const { data } = await api.post("/public/audit", {
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

  const score = result?.overall_score ?? result?.result?.overall_score;
  const issues = result?.issues || result?.result?.issues || [];
  const categories = result?.categories || result?.result?.categories || [];
  const highIssues = issues.filter((i) => i.severity === "high");
  const medIssues = issues.filter((i) => i.severity === "medium");
  const resultUrl = result?.url || result?.result?.url || url;

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
                  <p className="mt-2 text-[#5C685C]">It takes 30 seconds. You'll get 5 free audits per month, forever.</p>
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
                {resultUrl}
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

            {/* AI Summary — free value, no auth required */}
            {result?.ai_summary?.summary && (
              <div className="mt-6 bg-[#F3F0E9] border border-[#E5E0D8] rounded-xl p-5 flex gap-3">
                <Sparkles className="text-[#E07A5F] shrink-0 mt-0.5" size={20}/>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#E07A5F] mb-1">AI Analysis</div>
                  <p className="text-[#1A201A] text-sm leading-relaxed">{result.ai_summary.summary}</p>
                  {result.ai_summary.top_action && (
                    <div className="mt-3 bg-white border border-[#E5E0D8] rounded-lg p-3">
                      <div className="text-xs font-semibold text-[#2D3E32] uppercase tracking-wider">Top Priority</div>
                      <div className="text-sm font-medium text-[#1A201A] mt-1">{result.ai_summary.top_action.title}</div>
                      <div className="text-xs text-[#5C685C] mt-1">{result.ai_summary.top_action.how}</div>
                    </div>
                  )}
                  {result.ai_summary.wins?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {result.ai_summary.wins.map((w, i) => (
                        <span key={i} className="text-xs bg-[#81B29A]/10 text-[#2D3E32] px-2 py-0.5 rounded-full">{w}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Schema Markup — free JSON-LD for their site */}
            {result?.schema_markup && (
              <div className="mt-6 bg-white border border-[#E5E0D8] rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Code size={16} className="text-[#81B29A]" />
                    <div className="text-xs font-semibold uppercase tracking-wider text-[#81B29A]">Free Schema Markup</div>
                  </div>
                  <button
                    onClick={() => { navigator.clipboard.writeText(result.schema_markup); toast.success("Schema copied!"); }}
                    className="text-xs text-[#5C685C] hover:text-[#1A201A] flex items-center gap-1 bg-[#F3F0E9] hover:bg-[#E5E0D8] rounded-full px-3 py-1 transition-colors"
                  >
                    <Copy size={12} /> Copy
                  </button>
                </div>
                <p className="text-xs text-[#5C685C] mb-3">Google uses this to show rich results (star ratings, hours, location). Paste it in your site's &lt;head&gt;.</p>
                <pre className="bg-[#1A201A] text-[#81B29A] rounded-lg p-4 text-xs overflow-x-auto max-h-48 font-mono leading-relaxed">
                  {result.schema_markup}
                </pre>
              </div>
            )}

            {/* Revenue Impact */}
            {result?.revenue_impact && result.revenue_impact.total_estimated_monthly_revenue_loss > 0 && (
              <div className="mt-6 bg-[#FEF3C7] border border-[#F59E0B]/30 rounded-2xl p-6 text-center">
                <div className="text-3xl font-display font-bold text-[#92400E]">
                  ${result.revenue_impact.total_estimated_monthly_revenue_loss.toLocaleString()}/mo
                </div>
                <div className="text-sm text-[#92400E]/70 mt-1">
                  Estimated revenue you're losing each month
                </div>
                {result.revenue_impact.top_quick_wins?.length > 0 && (
                  <div className="mt-3 text-xs text-[#92400E]/60">
                    Top fix: {result.revenue_impact.top_quick_wins[0].title}
                  </div>
                )}
              </div>
            )}

            {/* Email capture — get their email before showing full CTA */}
            <EmailCapture score={score} url={resultUrl} issues={issues} />

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
                <span className="flex items-center gap-1"><Star size={12} /> 5 free audits/month</span>
                <span className="flex items-center gap-1"><Star size={12} /> AI action plan</span>
                <span className="flex items-center gap-1"><Star size={12} /> No credit card</span>
              </div>
            </div>

            {/* Share your audit */}
            <ShareAudit score={score} url={resultUrl} />

            {/* Try Content Studio */}
            <div className="mt-6 bg-gradient-to-r from-[#F3F0E9] to-[#FDFBF7] border border-[#E5E0D8] rounded-2xl p-6 text-center">
              <PenLine size={28} className="text-[#2D3E32] mx-auto mb-3" />
              <h3 className="font-display font-bold text-lg text-[#1A201A]">Need content for your website?</h3>
              <p className="mt-1 text-sm text-[#5C685C] max-w-md mx-auto">
                Generate blog posts, social captions, emails, and more — all written by AI, ready to publish in seconds.
              </p>
              <Link to="/content-studio" className="mt-4 inline-flex items-center gap-2 bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7] rounded-full px-6 py-3 text-sm font-medium transition-colors">
                <Sparkles size={16} /> Try Content Studio free <ArrowRight size={14} />
              </Link>
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
