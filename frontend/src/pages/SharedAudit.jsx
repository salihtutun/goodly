import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Logo, ScoreRing, Eyebrow } from "@/components/app/Common";
import { Button } from "@/components/ui/button";
import { ArrowRight, AlertTriangle, CheckCircle2, Info, ExternalLink, TrendingUp } from "lucide-react";
import api from "@/lib/api";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function SharedAudit() {
  const { token } = useParams();
  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  usePageMeta({
    title: audit ? `SEO Audit: ${audit.overall_score}/100 — ${audit.url}` : "Shared SEO Audit — Goodly",
    description: audit ? `This site scored ${audit.overall_score}/100 on Goodly's SEO audit. See the full breakdown.` : "View a shared SEO audit report from Goodly."
  });

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/shared/${token}`);
        setAudit(data);
      } catch (e) {
        setError("This shared audit link is no longer available.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="animate-pulse space-y-4 w-full max-w-xl px-6">
          <div className="h-8 bg-[#F3F0E9] rounded w-1/3 mx-auto" />
          <div className="h-32 bg-[#F3F0E9] rounded-2xl" />
          <div className="h-4 bg-[#F3F0E9] rounded w-2/3" />
        </div>
      </div>
    );
  }

  if (error || !audit) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="text-4xl mb-4">🔗</div>
          <h1 className="font-display font-bold text-2xl text-[#1A201A] mb-2">Link not found</h1>
          <p className="text-[#5C685C] mb-6">{error || "This shared audit is no longer available."}</p>
          <Link to="/" className="text-[#81B29A] hover:underline">← Back to Goodly</Link>
        </div>
      </div>
    );
  }

  const result = audit;
  const issues = result.issues || [];
  const critical = issues.filter(i => i.severity === "high" || i.severity === "critical");
  const warnings = issues.filter(i => i.severity === "medium" || i.severity === "warning");
  const revenue = result.revenue_impact;

  const scoreColor = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-amber-600";
    return "text-red-500";
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <header className="border-b border-[#E5E0D8] bg-[#FDFBF7] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/"><Logo /></Link>
          <Link to="/register" className="text-sm bg-[#2D3E32] hover:bg-[#4A5F4F] text-white rounded-full px-5 py-2.5">
            Get your free audit →
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-8 grid md:grid-cols-3 gap-8 items-center mb-8">
          <div className="flex flex-col items-center">
            <ScoreRing score={result.overall_score} size={160} />
            <div className="mt-3 label-eyebrow">Overall health</div>
          </div>
          <div className="md:col-span-2">
            <Eyebrow>Shared SEO Audit</Eyebrow>
            <h1 className="mt-2 font-display font-bold text-2xl text-[#1A201A] break-all">
              {result.url}
            </h1>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs bg-red-50 text-red-600 border border-red-200 px-2.5 py-1 rounded-full font-medium">
                {critical.length} critical
              </span>
              <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-2.5 py-1 rounded-full font-medium">
                {warnings.length} warnings
              </span>
              {result.created_at && (
                <span className="text-xs bg-[#F3F0E9] text-[#5C685C] px-2.5 py-1 rounded-full">
                  {new Date(result.created_at).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Revenue impact */}
        {revenue && revenue.total_estimated_monthly_revenue_loss > 0 && (
          <div className="bg-[#2D3E32] rounded-2xl p-6 mb-8 text-white">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={20} className="text-[#81B29A]" />
              <h2 className="font-display font-bold text-lg">Revenue opportunity</h2>
            </div>
            <p className="text-white/80 text-sm mb-4">
              Fixing all {issues.length} issues could bring approximately {revenue.total_estimated_additional_clicks} additional clicks and {revenue.total_estimated_additional_conversions} new customers per month.
            </p>
            <div className="text-4xl font-display font-bold text-[#81B29A]">
              ${revenue.total_estimated_monthly_revenue_loss?.toLocaleString()}<span className="text-lg text-white/60 font-normal">/mo</span>
            </div>
            <p className="text-xs text-white/50 mt-2">Estimated monthly revenue you're leaving on the table</p>
          </div>
        )}

        {/* Issues */}
        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6 mb-8">
          <h2 className="font-display font-bold text-lg text-[#1A201A] mb-4">Issues found ({issues.length})</h2>
          <div className="space-y-3">
            {issues.map((issue, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-[#FDFBF7] rounded-xl border border-[#E5E0D8]">
                {issue.severity === "high" || issue.severity === "critical" ? (
                  <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
                ) : issue.severity === "medium" || issue.severity === "warning" ? (
                  <Info size={18} className="text-amber-500 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 size={18} className="text-green-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-medium text-[#1A201A] text-sm">{issue.title}</div>
                  {issue.message && (
                    <div className="text-xs text-[#5C685C] mt-1">{issue.message}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Recommendations */}
        {result.ai_recommendations && (
          <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6 mb-8">
            <h2 className="font-display font-bold text-lg text-[#1A201A] mb-3">AI recommendations</h2>
            <p className="text-sm text-[#5C685C] mb-4">{result.ai_recommendations.summary}</p>
            {result.ai_recommendations.priority_actions?.length > 0 && (
              <div className="space-y-2">
                {result.ai_recommendations.priority_actions.map((action, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-[#F3F0E9] rounded-xl">
                    <span className="text-xs font-bold text-[#2D3E32] bg-[#81B29A]/20 w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <div>
                      <div className="font-medium text-[#1A201A] text-sm">{action.action}</div>
                      <div className="text-xs text-[#5C685C] mt-0.5">{action.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="bg-gradient-to-r from-[#2D3E32] to-[#4A5F4F] rounded-2xl p-8 text-center text-white">
          <h2 className="font-display font-bold text-2xl mb-2">Get your own free audit</h2>
          <p className="text-white/80 mb-6">See how your website scores in 30 seconds. No signup needed.</p>
          <Link to="/" className="inline-block bg-[#E07A5F] hover:bg-[#D06A4F] text-white rounded-full px-8 py-3.5 font-medium text-lg">
            Run your free audit <ArrowRight size={18} className="inline ml-1" />
          </Link>
        </div>
      </main>

      <footer className="border-t border-[#E5E0D8] py-8">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-[#5C685C]">
          © {new Date().getFullYear()} Goodly. Helping small businesses get found.
        </div>
      </footer>
    </div>
  );
}
