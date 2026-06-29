import { useState } from "react";
import api, { formatApiError } from "@/lib/api";
import AppLayout from "@/components/app/AppLayout";
import { Eyebrow, ScoreRing } from "@/components/app/Common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Bot, Leaf, AlertTriangle, CheckCircle2, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { usePageMeta } from "@/hooks/usePageMeta";

const ASSISTANT_COLORS = {
  ChatGPT: "#74AA9C",
  Claude: "#E07A5F",
  Perplexity: "#21808D",
  "Google Gemini": "#4285F4",
};

export default function AiVisibility() {
  usePageMeta({ title: "AI Visibility", description: "See if your business gets mentioned when people ask ChatGPT, Claude, Perplexity, and Gemini about your category." });
  const [form, setForm] = useState({ business_name: "", category: "", location: "", website: "" });
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.business_name.trim() || !form.category.trim()) {
      toast.error("Business name and category are required."); return;
    }
    setBusy(true); setData(null); setError(null);
    try {
      const { data: r } = await api.post("/ai-visibility/check", form);
      setData(r);
    } catch (err) {
      const msg = formatApiError(err);
      setError(msg);
      toast.error(msg);
    } finally { setBusy(false); }
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto" data-testid="ai-visibility-root">
        <Eyebrow>The 2026 channel</Eyebrow>
        <h1 className="mt-3 font-display font-bold text-4xl sm:text-5xl text-[#1A201A] tracking-tight">
          When people ask ChatGPT, do they hear about you?
        </h1>
        <p className="mt-3 text-[#5C685C] text-lg max-w-3xl">
          AI assistants are the new search engines. We simulate how ChatGPT, Claude, Perplexity and Gemini
          would respond when someone asks about your category — and tell you exactly what&apos;s missing
          to get mentioned.
        </p>
        <div className="mt-3 inline-flex items-center gap-2 text-xs text-[#5C685C]">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#E6A57E]"/>
          Best-effort simulation based on public training-data patterns. Not a live API query.
        </div>

        <div className="mt-10 grid lg:grid-cols-2 gap-6">
          <form onSubmit={submit} className="bg-white border border-[#E5E0D8] rounded-2xl p-6 space-y-4 h-fit" data-testid="aiv-form">
            <Field label="Business name *">
              <Input required value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                data-testid="aiv-name" placeholder="Acme Pottery"
                className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl py-6"/>
            </Field>
            <Field label="Category / what you do *">
              <Textarea required rows={2} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                data-testid="aiv-category" placeholder="Handmade pottery studio / ceramic mugs"
                className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl"/>
            </Field>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Location">
                <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })}
                  data-testid="aiv-location" placeholder="Portland, OR"
                  className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl py-6"/>
              </Field>
              <Field label="Website">
                <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })}
                  data-testid="aiv-website" placeholder="acmepottery.com"
                  className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl py-6"/>
              </Field>
            </div>
            <Button type="submit" disabled={busy || !form.business_name.trim() || !form.category.trim()}
              data-testid="aiv-submit"
              className="w-full bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7] rounded-full py-6 disabled:opacity-60 disabled:cursor-not-allowed">
              <Bot className="mr-2" size={18}/>{busy ? "Asking the AIs…" : "Check my AI visibility"}
            </Button>
          </form>

          <div>
            {busy && (
              <div className="bg-white border border-[#E5E0D8] rounded-2xl p-10 flex flex-col items-center justify-center text-[#5C685C]">
                <Leaf className="loader-leaf text-[#81B29A]" size={36}/>
                <div className="mt-4 text-sm">Simulating 4 AI assistants × 3 queries…</div>
              </div>
            )}
            {error && !busy && (
              <div className="bg-[#E07A5F]/10 border border-[#E07A5F]/40 rounded-2xl p-6 flex items-start gap-3" data-testid="aiv-error">
                <AlertTriangle className="text-[#E07A5F] shrink-0 mt-0.5" size={20}/>
                <div>
                  <div className="font-display font-bold text-[#1A201A]">Couldn&apos;t complete that check</div>
                  <div className="text-sm text-[#5C685C] mt-1">{error}</div>
                </div>
              </div>
            )}
            {data && <Result result={data.result}/>}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function Result({ result }) {
  return (
    <div className="space-y-4" data-testid="aiv-result">
      <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6 flex gap-5">
        <ScoreRing score={result.overall_visibility_score ?? 0} size={120}/>
        <div className="flex-1">
          <div className="label-eyebrow">AI Visibility</div>
          <p className="mt-2 text-[#1A201A] text-sm leading-relaxed">{result.diagnosis}</p>
        </div>
      </div>

      {result.per_assistant?.length > 0 && (
        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5" data-testid="aiv-per-assistant">
          <div className="label-eyebrow mb-3">By assistant</div>
          <div className="space-y-3">
            {result.per_assistant.map((a, i) => (
              <div key={i} className="border-b border-[#E5E0D8] last:border-b-0 pb-3 last:pb-0">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ASSISTANT_COLORS[a.assistant] || "#5C685C" }}/>
                    <span className="font-medium text-[#1A201A]">{a.assistant}</span>
                  </div>
                  {a.likely_mentions ? (
                    <Badge className="bg-[#81B29A]/20 text-[#2D3E32] hover:bg-[#81B29A]/20 border-0">
                      Mentioned {a.estimated_position ? `· #${a.estimated_position}` : ""}
                    </Badge>
                  ) : (
                    <Badge className="bg-[#E07A5F]/15 text-[#C86A51] hover:bg-[#E07A5F]/15 border-0">
                      Not mentioned
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-[#5C685C] mt-1.5">{a.reasoning}</div>
                {a.likely_top_5_brands?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {a.likely_top_5_brands.map((b, j) => (
                      <span key={j} className="text-xs bg-[#F3F0E9] text-[#5C685C] px-2 py-0.5 rounded-full">{b}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {result.blocking_factors?.length > 0 && (
        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="text-[#E07A5F]" size={16}/>
            <div className="label-eyebrow !text-[#E07A5F]">What&apos;s blocking you</div>
          </div>
          <div className="space-y-2.5">
            {result.blocking_factors.map((b, i) => (
              <div key={i} className="border-b border-[#E5E0D8] last:border-b-0 pb-2 last:pb-0">
                <div className="text-[#1A201A] font-medium text-sm">{b.factor}</div>
                <div className="text-xs text-[#5C685C] mt-0.5">{b.explanation}</div>
                <div className="text-xs text-[#2D3E32] mt-0.5"><strong>Fix:</strong> {b.fix}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {result.discoverability_signals_missing?.length > 0 && (
        <div className="bg-[#F3F0E9] border border-[#E5E0D8] rounded-2xl p-5">
          <div className="label-eyebrow mb-3">Signals AIs need to see</div>
          <ul className="space-y-1.5 text-sm text-[#1A201A]">
            {result.discoverability_signals_missing.map((s, i) => <li key={i}>• {s}</li>)}
          </ul>
        </div>
      )}

      {result.improvement_plan?.length > 0 && (
        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb className="text-[#E07A5F]" size={16}/>
            <div className="label-eyebrow">Action plan</div>
          </div>
          <div className="space-y-2.5">
            {result.improvement_plan.map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="h-7 w-7 shrink-0 rounded-full bg-[#E07A5F]/15 text-[#E07A5F] font-display font-bold flex items-center justify-center text-sm">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="text-[#1A201A] text-sm font-medium">{a.action}</div>
                  <div className="text-xs text-[#5C685C] mt-0.5">{a.why}</div>
                  <div className="mt-1">
                    <Badge variant="outline" className="border-[#E5E0D8] text-[#5C685C] text-[10px]">
                      Effort: {a.estimated_effort}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return <div className="space-y-2"><Label className="text-[#1A201A] text-sm">{label}</Label>{children}</div>;
}
