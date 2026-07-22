import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, ArrowRight, CheckCircle2, AlertTriangle, XCircle, Loader2, ExternalLink } from "lucide-react";
import api, { formatApiError } from "@/lib/api";
import { toast } from "sonner";

/**
 * ContentGraderWidget — public widget that grades any webpage's content.
 * Paste a URL, get an AI-powered content score with actionable fixes.
 * Lead generation magnet — shows value before signup.
 */
export default function ContentGraderWidget({ className = "" }) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) {
      toast.error("Please enter a URL to grade.");
      return;
    }
    // Basic URL validation
    let normalized = trimmed;
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = "https://" + normalized;
    }
    try {
      new URL(normalized);
    } catch {
      toast.error("Please enter a valid URL (e.g., yourbusiness.com)");
      return;
    }

    setBusy(true);
    setResult(null);
    setError(null);
    try {
      const { data } = await api.post("/ai/content-grade", { url: normalized });
      setResult(data);
    } catch (err) {
      const msg = formatApiError(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  };

  const gradeColor = (grade) => {
    const g = (grade || "").trim();
    if (g.startsWith("A")) return "text-[#34A853]";
    if (g.startsWith("B")) return "text-[#81B29A]";
    if (g.startsWith("C")) return "text-[#FBBC05]";
    if (g.startsWith("D")) return "text-[#E07A5F]";
    return "text-[#EA4335]";
  };

  const gradeBg = (grade) => {
    const g = (grade || "").trim();
    if (g.startsWith("A")) return "bg-[#34A853]/10";
    if (g.startsWith("B")) return "bg-[#81B29A]/10";
    if (g.startsWith("C")) return "bg-[#FBBC05]/10";
    if (g.startsWith("D")) return "bg-[#E07A5F]/10";
    return "bg-[#EA4335]/10";
  };

  return (
    <div className={`bg-white border border-[#E5E0D8] rounded-2xl p-6 sm:p-8 ${className}`}>
      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={18} className="text-[#E07A5F]" />
        {/* #B04A2E — small text needs 4.5:1 contrast; brand #E07A5F only hits 2.9 */}
        <span className="text-xs font-medium tracking-wider uppercase text-[#B04A2E]">AI Content Grader</span>
      </div>
      <h3 className="font-display font-bold text-xl sm:text-2xl text-[#1A201A] mt-1">
        Is your website content working?
      </h3>
      <p className="mt-2 text-sm text-[#5C685C]">
        Paste any page URL. Our AI grades your content, finds weak spots, and gives you exact fixes — in 30 seconds.
      </p>

      <form onSubmit={submit} className="mt-5 flex flex-col sm:flex-row gap-3">
        <Input
          type="text"
          placeholder="yourbusiness.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 rounded-xl border-[#E5E0D8] bg-[#FDFBF7] h-12 text-sm"
          disabled={busy}
        />
        <Button
          type="submit"
          disabled={busy || !url.trim()}
          className="bg-[#E07A5F] hover:bg-[#C86A51] text-white rounded-xl px-6 h-12 font-medium shrink-0"
        >
          {busy ? (
            <><Loader2 size={16} className="animate-spin mr-1.5" /> Grading…</>
          ) : (
            <>Grade my content <ArrowRight size={16} className="ml-1.5" /></>
          )}
        </Button>
      </form>

      {/* Results */}
      {result && (
        <div className="mt-6 pt-6 border-t border-[#E5E0D8] animate-in fade-in duration-300">
          {/* Score header */}
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${gradeBg(result.overall_grade)}`}>
              <span className={`font-display font-bold text-2xl ${gradeColor(result.overall_grade)}`}>
                {result.overall_grade || "?"}
              </span>
            </div>
            <div>
              <div className="font-display font-bold text-lg text-[#1A201A]">
                Score: {result.overall_score ?? "?"}/100
              </div>
              <div className="text-sm text-[#5C685C]">{result.summary}</div>
            </div>
          </div>

          {/* Strengths & Weaknesses */}
          <div className="grid sm:grid-cols-2 gap-4 mt-4">
            {result.strengths?.length > 0 && (
              <div className="bg-[#34A853]/5 rounded-xl p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <CheckCircle2 size={14} className="text-[#34A853]" />
                  <span className="text-xs font-semibold text-[#34A853] uppercase tracking-wider">Strengths</span>
                </div>
                <ul className="space-y-1.5">
                  {result.strengths.slice(0, 3).map((s, i) => (
                    <li key={i} className="text-sm text-[#5C685C] flex items-start gap-1.5">
                      <span className="text-[#34A853] mt-0.5 shrink-0">•</span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.weaknesses?.length > 0 && (
              <div className="bg-[#E07A5F]/5 rounded-xl p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <AlertTriangle size={14} className="text-[#E07A5F]" />
                  <span className="text-xs font-semibold text-[#E07A5F] uppercase tracking-wider">Needs Work</span>
                </div>
                <ul className="space-y-1.5">
                  {result.weaknesses.slice(0, 3).map((w, i) => (
                    <li key={i} className="text-sm text-[#5C685C] flex items-start gap-1.5">
                      <span className="text-[#E07A5F] mt-0.5 shrink-0">•</span>
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Action items */}
          {result.action_items?.length > 0 && (
            <div className="mt-4 bg-[#F3F0E9] rounded-xl p-4">
              <div className="text-xs font-semibold text-[#1A201A] uppercase tracking-wider mb-2">
                Top fixes (do these first)
              </div>
              <ol className="space-y-1.5">
                {result.action_items.slice(0, 3).map((item, i) => (
                  <li key={i} className="text-sm text-[#5C685C] flex items-start gap-2">
                    <span className="font-bold text-[#E07A5F] shrink-0">{i + 1}.</span>
                    {item}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* CTA */}
          <div className="mt-5 text-center">
            <p className="text-sm text-[#5C685C] mb-3">
              Want a full audit with 50+ checks and ready-to-paste fixes?
            </p>
            <a
              href="/audit"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#E07A5F] hover:text-[#C86A51]"
            >
              Get your free full audit <ExternalLink size={14} />
            </a>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="mt-4 p-4 bg-[#EA4335]/5 rounded-xl flex items-start gap-2">
          <XCircle size={16} className="text-[#EA4335] shrink-0 mt-0.5" />
          <p className="text-sm text-[#5C685C]">{error}</p>
        </div>
      )}
    </div>
  );
}
