import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Loader2, Search, CheckCircle2, XCircle, AlertTriangle, Mail, Check } from "lucide-react";
import api from "@/lib/api";

export default function QuickAuditWidget({ onComplete, submitTestId }) {
  const [url, setUrl] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [emailSent, setEmailSent] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
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
      // Backend returns 200 with fetch_failed when the site can't be audited.
      if (data?.fetch_failed) {
        setError(data.error || "Could not analyze this URL. Please check and try again.");
        return;
      }
      setResult(data);
      if (onComplete) onComplete(data);
    } catch (err) {
      const status = err?.response?.status;
      const data = err?.response?.data;
      const detail = data?.detail || data?.error || data?.message;
      if (status === 429) {
        setError("Too many audits just now — wait a minute and try again.");
      } else if (typeof detail === "string" && detail.trim()) {
        setError(detail);
      } else {
        setError("Could not analyze this URL. Please check and try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !result) return;

    setEmailLoading(true);
    try {
      await api.post("/public/audit", { url: result.url, email: email.trim() });
      setEmailSent(true);
    } catch {
      // Best-effort email capture — don't block the user
      setEmailSent(true);
    } finally {
      setEmailLoading(false);
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
              data-testid={submitTestId}
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

          {/* Concierge CTA for low-scoring sites */}
          {result.overall_score < 50 && (
            <div className="bg-[#E07A5F]/10 rounded-xl p-4 mb-4 border border-[#E07A5F]/20">
              <p className="text-sm text-[#1A201A] font-medium mb-2">
                Want an expert to fix this for you? We'll get you to page one in 90 days — or you don't pay.
              </p>
              <a
                href={`mailto:hello@searchgoodly.com?subject=Concierge%20inquiry%20-%20${encodeURIComponent(result.url)}%20(Score:%20${result.overall_score})`}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-[#B04A2E] hover:text-[#8F3A22] underline underline-offset-2"
              >
                Talk to a specialist <ArrowRight size={14} />
              </a>
            </div>
          )}

          {/* Email capture for nurture sequence */}
          {!emailSent ? (
            <form onSubmit={handleEmailSubmit} className="mb-4">
              <p className="text-sm text-[#1A201A] font-medium mb-2">
                Get your full report + 3 free fix-it tips by email
              </p>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA89C]" size={16} />
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 py-2.5 text-sm rounded-xl border-[#D4CFC4] bg-white"
                    disabled={emailLoading}
                  />
                </div>
                <Button
                  type="submit"
                  disabled={emailLoading || !email.trim()}
                  className="rounded-xl bg-[#81B29A] hover:bg-[#6A9A82] text-white text-sm py-2.5 px-4"
                >
                  {emailLoading ? <Loader2 className="animate-spin" size={16} /> : "Send"}
                </Button>
              </div>
              <p className="mt-1.5 text-xs text-[#9CA89C]">
                No spam. Just your report and 3 helpful emails.
              </p>
            </form>
          ) : (
            <div className="mb-4 bg-[#81B29A]/10 rounded-xl p-3 border border-[#81B29A]/20 flex items-center gap-2">
              <Check size={16} className="text-[#81B29A]" />
              <span className="text-sm text-[#1A201A] font-medium">Report sent! Check your inbox.</span>
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
              onClick={() => { setResult(null); setUrl(""); setEmail(""); setEmailSent(false); }}
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
