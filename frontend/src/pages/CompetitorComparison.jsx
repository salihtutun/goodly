import { useState } from "react";
import { Link } from "react-router-dom";
import api, { formatApiError } from "@/lib/api";
import AppLayout from "@/components/app/AppLayout";
import { Eyebrow, ScoreRing } from "@/components/app/Common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Plus, X, Loader2, TrendingUp, TrendingDown, Target, Zap, FileText, Shield, Smartphone, Search } from "lucide-react";
import { toast } from "sonner";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function CompetitorComparison() {
  usePageMeta({ title: "Competitor Comparison", description: "See how your site stacks up against competitors on key SEO metrics." });
  const [targetUrl, setTargetUrl] = useState("");
  const [competitors, setCompetitors] = useState([""]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const addCompetitor = () => {
    if (competitors.length < 5) setCompetitors([...competitors, ""]);
  };

  const removeCompetitor = (i) => {
    setCompetitors(competitors.filter((_, idx) => idx !== i));
  };

  const updateCompetitor = (i, val) => {
    const updated = [...competitors];
    updated[i] = val;
    setCompetitors(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validCompetitors = competitors.filter(c => c.trim());
    if (!targetUrl.trim() || validCompetitors.length === 0) {
      setError("Enter your website URL and at least one competitor.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data } = await api.post("/competitors/compare", {
        target_url: targetUrl.trim(),
        competitor_urls: validCompetitors.map(c => c.trim()),
      });
      setResult(data);
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const catLabels = {
    meta_tags: "Meta Tags", headings: "Headings", performance: "Speed",
    mobile: "Mobile", accessibility: "Accessibility", content: "Content",
    social: "Social", security: "Security",
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        <Eyebrow>Competitive Intelligence</Eyebrow>
        <h1 className="mt-3 font-display font-bold text-4xl text-[#1A201A] tracking-tight">
          See how you stack up
        </h1>
        <p className="mt-2 text-[#5C685C] text-lg">
          Compare your site against competitors. See exactly what they're doing better — and how to beat them.
        </p>

        {!result ? (
          <form onSubmit={handleSubmit} className="mt-10 bg-white border border-[#E5E0D8] rounded-2xl p-8">
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-[#1A201A] mb-2">Your website</label>
                <Input
                  placeholder="yourbusiness.com"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  className="bg-white border-[#E5E0D8] rounded-xl py-6 text-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#1A201A] mb-2">
                  Competitor websites ({competitors.filter(c => c.trim()).length}/5)
                </label>
                <div className="space-y-3">
                  {competitors.map((c, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        placeholder={`competitor-${i + 1}.com`}
                        value={c}
                        onChange={(e) => updateCompetitor(i, e.target.value)}
                        className="bg-white border-[#E5E0D8] rounded-xl py-5"
                      />
                      {competitors.length > 1 && (
                        <button type="button" onClick={() => removeCompetitor(i)}
                          className="p-2 text-[#9CA89C] hover:text-[#E07A5F] shrink-0">
                          <X size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                {competitors.length < 5 && (
                  <button type="button" onClick={addCompetitor}
                    className="mt-3 flex items-center gap-1.5 text-sm text-[#81B29A] hover:text-[#5C9A7A]">
                    <Plus size={14} /> Add competitor
                  </button>
                )}
              </div>

              {error && (
                <div className="text-sm text-[#E07A5F] bg-[#E07A5F]/10 border border-[#E07A5F]/30 rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              <Button type="submit" disabled={loading}
                className="w-full bg-[#2D3E32] hover:bg-[#4A5F4F] text-white rounded-full py-6 text-base">
                {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
                {loading ? "Comparing..." : "Compare now"}
              </Button>
            </div>
          </form>
        ) : (
          <div className="mt-10 space-y-8 animate-in fade-in slide-in-from-top-4 duration-300">
            {/* Score comparison */}
            <div className="bg-white border border-[#E5E0D8] rounded-2xl p-8">
              <h2 className="font-display font-bold text-xl text-[#1A201A] mb-6">Score Comparison</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#F3F0E9] rounded-xl p-4 text-center">
                  <div className="text-xs text-[#5C685C] mb-1">Your Score</div>
                  <div className="text-3xl font-display font-bold text-[#1A201A]">{result.comparison.target_score}</div>
                </div>
                <div className="bg-[#F3F0E9] rounded-xl p-4 text-center">
                  <div className="text-xs text-[#5C685C] mb-1">Competitor Avg</div>
                  <div className="text-3xl font-display font-bold text-[#5C685C]">{result.comparison.competitor_avg_score}</div>
                </div>
                <div className="bg-[#F3F0E9] rounded-xl p-4 text-center">
                  <div className="text-xs text-[#5C685C] mb-1">Best Competitor</div>
                  <div className="text-3xl font-display font-bold text-[#81B29A]">{result.comparison.competitor_best_score}</div>
                </div>
                <div className="bg-[#F3F0E9] rounded-xl p-4 text-center">
                  <div className="text-xs text-[#5C685C] mb-1">Gap to Close</div>
                  <div className={`text-3xl font-display font-bold ${result.comparison.score_gap_to_best > 0 ? 'text-[#E07A5F]' : 'text-[#81B29A]'}`}>
                    {result.comparison.score_gap_to_best > 0 ? `+${result.comparison.score_gap_to_best}` : 'Leading!'}
                  </div>
                </div>
              </div>
            </div>

            {/* Category breakdown */}
            <div className="bg-white border border-[#E5E0D8] rounded-2xl p-8">
              <h2 className="font-display font-bold text-xl text-[#1A201A] mb-6">Category Breakdown</h2>
              <div className="space-y-4">
                {Object.entries(result.comparison.target_categories).map(([key, val]) => {
                  const avg = result.comparison.competitor_avg_categories[key] || 0;
                  const diff = val - avg;
                  return (
                    <div key={key} className="flex items-center gap-4">
                      <div className="w-28 text-sm font-medium text-[#1A201A]">{catLabels[key] || key}</div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-[#F3F0E9] rounded-full overflow-hidden">
                            <div className="h-full bg-[#2D3E32] rounded-full" style={{ width: `${val}%` }} />
                          </div>
                          <span className="text-sm font-medium text-[#1A201A] w-8 text-right">{val}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1.5 bg-[#F3F0E9] rounded-full overflow-hidden">
                            <div className="h-full bg-[#9CA89C] rounded-full" style={{ width: `${avg}%` }} />
                          </div>
                          <span className="text-xs text-[#9CA89C] w-8 text-right">{avg}</span>
                        </div>
                      </div>
                      <Badge variant="outline" className={`text-xs ${diff >= 0 ? 'border-[#81B29A] text-[#81B29A]' : 'border-[#E07A5F] text-[#E07A5F]'}`}>
                        {diff >= 0 ? `+${diff}` : diff}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Insights */}
            {result.insights?.length > 0 && (
              <div className="bg-white border border-[#E5E0D8] rounded-2xl p-8">
                <h2 className="font-display font-bold text-xl text-[#1A201A] mb-4">What the Top Competitor Does Differently</h2>
                <div className="space-y-3">
                  {result.insights.map((insight, i) => (
                    <div key={i} className="flex items-start gap-3 bg-[#F3F0E9] rounded-xl p-4">
                      <Target size={16} className="text-[#E07A5F] mt-0.5 shrink-0" />
                      <p className="text-sm text-[#1A201A]">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations?.length > 0 && (
              <div className="bg-white border border-[#E5E0D8] rounded-2xl p-8">
                <h2 className="font-display font-bold text-xl text-[#1A201A] mb-4">How to Beat Them</h2>
                <div className="space-y-4">
                  {result.recommendations.map((rec, i) => (
                    <div key={i} className="flex items-start gap-4 bg-[#F3F0E9] rounded-xl p-5">
                      <div className="h-9 w-9 rounded-full bg-[#E07A5F]/15 text-[#E07A5F] font-display font-bold flex items-center justify-center shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-[#1A201A]">{rec.category}</span>
                          <Badge variant="outline" className="text-[10px] border-[#E5E0D8]">Effort: {rec.effort}</Badge>
                          <Badge variant="outline" className="text-[10px] border-[#E5E0D8]">Impact: {rec.impact}</Badge>
                        </div>
                        <p className="text-sm text-[#5C685C]">{rec.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={() => { setResult(null); setTargetUrl(""); setCompetitors([""]); }}
                variant="outline" className="rounded-full border-[#D4CFC4] text-[#5C685C]">
                Compare more sites
              </Button>
              <Link to="/app/audit" className="inline-flex items-center bg-[#2D3E32] hover:bg-[#4A5F4F] text-white rounded-full px-6 py-3 text-sm font-medium">
                Run full audit <ArrowRight size={14} className="ml-1" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
