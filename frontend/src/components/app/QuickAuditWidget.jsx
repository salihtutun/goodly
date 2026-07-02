import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Loader2, Search, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import api from "@/lib/api";

export default function QuickAuditWidget({ onComplete }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;

    // Basic URL normalization
    let normalized = trimmed;
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = "https://" + normalized;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const { data } = await api.post("/public/audit", { url: normalized });
      setResult(data);
      if (onComplete) onComplete(data);
    } catch (err) {
      const msg = err?.response?.data?.detail || "Could not analyze this URL. Please check and try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const scoreColor = (score) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-amber-600";
    return "text-red-500";
  };

  const scoreBg = (score) => {
    if (score >= 80) return "bg-green-50 border-green-200";
    if (score >= 60) return "bg-amber-50 border-amber-200";
    return "bg-red-50 border-red-200";
  };

  const criticalCount = result?.issues?.filter(i => i.severity === "critical")?.length || 0;
  const warningCount = result?.issues?.filter(i => i.severity === "warning")?.length || 0;

  return (
    <div className="w-full max-w-xl mx-auto">
      {!result ? (
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex items-center gap-0">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA89C] pointer-events-none" size={20} />
              <Input
                type="text"
                placeholder="yourwebsite.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="pl-12 pr-4 py-7 text-lg rounded-l-2xl rounded-r-none border-[#D4CFC4] bg-white focus-visible:ring-[#81B29A] focus-visible:border-[#81B29A] shadow-sm"
                disabled={loading}
                autoFocus
              />
            </div>
            <Button
              type="submit"
              disabled={loading || !url.trim()}
              className="rounded-r-2xl rounded-l-none py-7 px-8 text-lg bg-[#E07A5F] hover:bg-[#D06A4F] text-white font-semibold shadow-sm"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : "Get Free Score"}
            </Button>
          </div>
          {error && (
            <p className="mt-3 text-sm text-red-500 flex items-center gap-1.5">
              <AlertTriangle size={14} /> {error}
            </p>
          )}
          <p className="mt-3 text-xs text-[#9CA89C] text-center">
            Free instant audit. No signup required.
          </p>
        </form>
      ) : (
        <div className={`rounded-2xl border p-6 ${scoreBg(result.overall_score)} animate-in fade-in slide-in-from-top-4 duration-300`}>
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-[#5C685C] font-medium">Your website score</p>
              <p className="text-xs text-[#9CA89C] truncate max-w-[250px]">{result.url}</p>
            </div>
            <div className={`text-4xl font-display font-bold ${scoreColor(result.overall_score)}`}>
              {result.overall_score}
              <span className="text-lg font-normal text-[#9CA89C]">/100</span>
            </div>
          </div>

          {/* Score bar */}
          <div className="w-full h-2.5 bg-white/60 rounded-full mb-4 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                result.overall_score >= 80 ? "bg-green-500" :
                result.overall_score >= 60 ? "bg-amber-500" :
                "bg-red-500"
              }`}
              style={{ width: `${result.overall_score}%` }}
            />
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center gap-2 text-sm">
              {criticalCount === 0 ? (
                <CheckCircle2 size={16} className="text-green-500" />
              ) : (
                <XCircle size={16} className="text-red-500" />
              )}
              <span className="text-[#5C685C]">
                {criticalCount === 0 ? "No critical issues" : `${criticalCount} critical ${criticalCount === 1 ? 'issue' : 'issues'}`}
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              {warningCount === 0 ? (
                <CheckCircle2 size={16} className="text-green-500" />
              ) : (
                <AlertTriangle size={16} className="text-amber-500" />
              )}
              <span className="text-[#5C685C]">
                {warningCount === 0 ? "No warnings" : `${warningCount} ${warningCount === 1 ? 'warning' : 'warnings'}`}
              </span>
            </div>
          </div>

          {/* Revenue impact estimate */}
          {result.overall_score < 80 && (
            <div className="bg-white/70 rounded-xl p-3 mb-4 border border-white">
              <p className="text-sm text-[#1A201A] font-medium">
                {result.overall_score < 50
                  ? "You're losing potential customers every day. Fixing these issues could 2-3x your traffic."
                  : result.overall_score < 70
                  ? "You're leaving money on the table. A few fixes could boost your traffic by 40-60%."
                  : "Close to great! Small tweaks could push you to the top of search results."}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={() => navigate("/register")}
              className="flex-1 bg-[#2D3E32] hover:bg-[#4A5F4F] text-white rounded-xl py-5"
            >
              See full report — free <ArrowRight size={16} className="ml-1" />
            </Button>
            <Button
              variant="outline"
              onClick={() => { setResult(null); setUrl(""); }}
              className="rounded-xl border-[#D4CFC4] text-[#5C685C]"
            >
              Try another URL
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
