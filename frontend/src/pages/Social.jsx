import { useEffect, useState } from "react";
import api, { formatApiError } from "@/lib/api";
import AppLayout from "@/components/app/AppLayout";
import { Eyebrow, ScoreRing } from "@/components/app/Common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Leaf, Copy, Instagram, Music2, Youtube, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: Instagram, accent: "#E07A5F" },
  { id: "tiktok", label: "TikTok", icon: Music2, accent: "#2D3E32" },
  { id: "youtube", label: "YouTube", icon: Youtube, accent: "#E07A5F" },
];

export default function Social() {
  const [tab, setTab] = useState("instagram");
  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto" data-testid="social-root">
        <Eyebrow>Visibility — beyond Google</Eyebrow>
        <h1 className="mt-3 font-display font-bold text-4xl sm:text-5xl text-[#1A201A] tracking-tight">
          Get found everywhere your customers look.
        </h1>
        <p className="mt-3 text-[#5C685C] text-lg">
          Audit your social presence, get AI-rewritten bios & content ideas, compare against competitors.
        </p>

        <Tabs value={tab} onValueChange={setTab} className="mt-10">
          <TabsList className="bg-[#F3F0E9] border border-[#E5E0D8] rounded-full p-1.5 inline-flex">
            {PLATFORMS.map((p) => (
              <TabsTrigger key={p.id} value={p.id} data-testid={`social-tab-${p.id}`}
                className="rounded-full data-[state=active]:bg-[#2D3E32] data-[state=active]:text-[#FDFBF7] gap-1.5">
                <p.icon size={14}/> {p.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {PLATFORMS.map((p) => (
            <TabsContent key={p.id} value={p.id} className="mt-8">
              <PlatformPanel platform={p.id} accent={p.accent} />
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AppLayout>
  );
}

function PlatformPanel({ platform, accent }) {
  const [mode, setMode] = useState("audit"); // audit | suggestions | competitors
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-6" data-testid={`mode-switcher-${platform}`}>
        {[
          { id: "audit", label: "Audit & score" },
          { id: "suggestions", label: "AI improvements" },
          { id: "competitors", label: "Competitor analysis" },
        ].map((m) => (
          <button key={m.id} onClick={() => setMode(m.id)}
            data-testid={`mode-${platform}-${m.id}`}
            className={`px-4 py-2 rounded-full text-sm transition-colors ${
              mode === m.id ? "bg-[#2D3E32] text-[#FDFBF7]" : "bg-[#F3F0E9] text-[#1A201A] hover:bg-[#E5E0D8]"
            }`}>
            {m.label}
          </button>
        ))}
      </div>
      {mode === "audit" && <AuditPanel platform={platform} accent={accent} />}
      {mode === "suggestions" && <SuggestionsPanel platform={platform} accent={accent} />}
      {mode === "competitors" && <CompetitorsPanel platform={platform} accent={accent} />}
    </div>
  );
}

function copy(text) { navigator.clipboard.writeText(text); toast.success("Copied"); }

function Loader({ label }) {
  return (
    <div className="bg-white border border-[#E5E0D8] rounded-2xl p-10 flex flex-col items-center justify-center text-[#5C685C]">
      <Leaf className="loader-leaf text-[#81B29A]" size={36}/>
      <div className="mt-4 text-sm">{label}</div>
    </div>
  );
}

// ============ AUDIT ============
function AuditPanel({ platform, accent }) {
  const [form, setForm] = useState({
    handle: "", bio: "", niche: "", location: "", followers: "", recent_caption: "", posts_per_week: "",
  });
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.handle.trim() || !form.niche.trim()) {
      toast.error("Handle and niche are required."); return;
    }
    setBusy(true); setData(null); setError(null);
    try {
      const { data: result } = await api.post("/social/audit", { platform, ...form });
      setData(result);
    } catch (err) {
      const msg = formatApiError(err);
      setError(msg);
      toast.error(msg);
    }
    finally { setBusy(false); }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <form onSubmit={submit} className="bg-white border border-[#E5E0D8] rounded-2xl p-6 space-y-4 h-fit" data-testid={`audit-form-${platform}`}>
        <Field label="Handle *">
          <Input required value={form.handle} onChange={(e) => setForm({ ...form, handle: e.target.value })}
            data-testid={`audit-handle-${platform}`} placeholder="@yourbusiness"
            className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl"/>
        </Field>
        <Field label="What you do (niche) *">
          <Textarea required rows={2} value={form.niche} onChange={(e) => setForm({ ...form, niche: e.target.value })}
            data-testid={`audit-niche-${platform}`}
            placeholder="Handmade ceramics studio selling mugs and bowls online + to cafes"
            className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl"/>
        </Field>
        <Field label="Current bio (paste verbatim)">
          <Textarea rows={2} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })}
            data-testid={`audit-bio-${platform}`}
            placeholder="What's currently in your profile bio"
            className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl"/>
        </Field>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Location"><Input value={form.location} onChange={(e) => setForm({...form,location:e.target.value})} placeholder="Portland, OR" className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl"/></Field>
          <Field label="Followers (approx)"><Input value={form.followers} onChange={(e) => setForm({...form,followers:e.target.value})} placeholder="850" className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl"/></Field>
        </div>
        <Field label="Recent caption / video description">
          <Textarea rows={2} value={form.recent_caption} onChange={(e) => setForm({ ...form, recent_caption: e.target.value })}
            placeholder="Your most recent post text" className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl"/>
        </Field>
        <Field label="Posts per week">
          <Input value={form.posts_per_week} onChange={(e) => setForm({ ...form, posts_per_week: e.target.value })}
            placeholder="3" className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl"/>
        </Field>
        <Button type="submit" disabled={busy || !form.handle.trim() || !form.niche.trim()}
          data-testid={`audit-submit-${platform}`}
          style={{ backgroundColor: busy ? undefined : accent }}
          className="w-full text-[#FDFBF7] rounded-full py-6 hover:opacity-90 transition-opacity disabled:opacity-60">
          <Sparkles className="mr-2" size={18}/>{busy ? "Auditing…" : "Audit my profile"}
        </Button>
      </form>

      <div>
        {busy && <Loader label="Claude is reviewing your presence…"/>}
        {error && !busy && <ErrorTile message={error} testId={`audit-${platform}-error`}/>}
        {data && <AuditResult result={data.result} accent={accent} testIdPrefix={`audit-${platform}`}/>}
      </div>
    </div>
  );
}

function AuditResult({ result, accent, testIdPrefix }) {
  const cats = result.categories || {};
  const issues = result.issues || [];
  const groupBy = (sev) => issues.filter((i) => (i.severity || "").toLowerCase() === sev);
  return (
    <div className="space-y-4" data-testid={`${testIdPrefix}-result`}>
      <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6 flex gap-5">
        <ScoreRing score={result.overall_score ?? 0} size={120}/>
        <div className="flex-1">
          <div className="label-eyebrow">Diagnosis</div>
          <p className="mt-2 text-[#1A201A] text-sm leading-relaxed">{result.headline}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {Object.entries(cats).map(([k, v]) => (
          <div key={k} className="bg-white border border-[#E5E0D8] rounded-2xl p-4 flex items-center gap-3">
            <ScoreRing score={v ?? 0} size={48}/>
            <div>
              <div className="text-xs label-eyebrow">{k.replace(/_/g, " ")}</div>
              <div className="font-display font-bold text-lg text-[#1A201A] mt-0.5">{v ?? 0}</div>
            </div>
          </div>
        ))}
      </div>
      {result.quick_wins?.length > 0 && (
        <div className="bg-[#81B29A]/12 border border-[#81B29A]/40 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="text-[#2D3E32]" size={18}/>
            <div className="font-display font-bold text-[#1A201A]">Quick wins</div>
          </div>
          <ul className="space-y-2 text-sm text-[#1A201A]">
            {result.quick_wins.map((w, i) => <li key={i} className="flex gap-2"><span className="text-[#2D3E32]">→</span><span>{w}</span></li>)}
          </ul>
        </div>
      )}
      {["high", "medium", "low"].map((sev) => {
        const items = groupBy(sev);
        if (!items.length) return null;
        const color = sev === "high" ? "#E07A5F" : (sev === "medium" ? "#E6A57E" : "#81B29A");
        return (
          <div key={sev}>
            <div className="flex items-center gap-2 mt-2 mb-2">
              <AlertTriangle style={{ color }} size={16}/>
              <div className="font-medium text-[#1A201A] capitalize">{sev} <span className="text-[#5C685C]">({items.length})</span></div>
            </div>
            <div className="space-y-2">
              {items.map((it, i) => (
                <div key={i} className="bg-white border border-[#E5E0D8] rounded-2xl p-4">
                  <div className="text-xs text-[#5C685C] uppercase tracking-wider">{it.category}</div>
                  <div className="mt-1 text-[#1A201A] text-sm font-medium">{it.message}</div>
                  <div className="mt-1 text-[#5C685C] text-sm">{it.fix}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============ SUGGESTIONS ============
function SuggestionsPanel({ platform, accent }) {
  const [form, setForm] = useState({ handle: "", bio: "", niche: "", location: "", target_customer: "" });
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.handle.trim() || !form.niche.trim()) { toast.error("Handle and niche required."); return; }
    setBusy(true); setData(null);
    try {
      const { data: result } = await api.post("/social/suggestions", { platform, ...form });
      setData(result);
    } catch (err) { toast.error(formatApiError(err)); }
    finally { setBusy(false); }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <form onSubmit={submit} className="bg-white border border-[#E5E0D8] rounded-2xl p-6 space-y-4 h-fit" data-testid={`sug-form-${platform}`}>
        <Field label="Handle *"><Input required value={form.handle} onChange={(e)=>setForm({...form,handle:e.target.value})} data-testid={`sug-handle-${platform}`} placeholder="@yourbusiness" className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl"/></Field>
        <Field label="What you do (niche) *"><Textarea required rows={2} value={form.niche} onChange={(e)=>setForm({...form,niche:e.target.value})} data-testid={`sug-niche-${platform}`} className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl"/></Field>
        <Field label="Current bio (so we can improve it)"><Textarea rows={2} value={form.bio} onChange={(e)=>setForm({...form,bio:e.target.value})} className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl"/></Field>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Location"><Input value={form.location} onChange={(e)=>setForm({...form,location:e.target.value})} className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl"/></Field>
          <Field label="Ideal customer"><Input value={form.target_customer} onChange={(e)=>setForm({...form,target_customer:e.target.value})} placeholder="e.g. local cafes & gift shoppers" className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl"/></Field>
        </div>
        <Button type="submit" disabled={busy} data-testid={`sug-submit-${platform}`} style={{backgroundColor: busy ? undefined : accent}} className="w-full text-[#FDFBF7] rounded-full py-6 hover:opacity-90 transition-opacity">
          <Sparkles className="mr-2" size={18}/>{busy ? "Composing…" : "Generate improvements"}
        </Button>
      </form>
      <div>
        {busy && <Loader label="Writing your bios, hashtags and content ideas…"/>}
        {data && (
          <div className="space-y-4" data-testid={`sug-${platform}-result`}>
            <Block title="Bio rewrites">
              {data.bio_rewrites?.map((b, i) => (
                <Row key={i} text={b.text} sub={`${b.length} chars · ${b.rationale}`} />
              ))}
            </Block>
            <Block title="Hashtag sets">
              {data.hashtag_sets?.map((h, i) => (
                <div key={i} className="border-b border-[#E5E0D8] last:border-b-0 pb-2 last:pb-0">
                  <div className="text-xs text-[#5C685C] uppercase tracking-wider">{h.theme}</div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {h.tags?.map((t, j) => (
                      <Badge key={j} className="bg-[#81B29A]/20 text-[#2D3E32] hover:bg-[#81B29A]/20 border-0 cursor-pointer" onClick={()=>copy(t)}>{t}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </Block>
            <Block title="Content ideas">
              {data.content_ideas?.map((c, i) => (
                <Row key={i} text={c.title} sub={`${c.format} · Hook: ${c.hook} — ${c.why}`}/>
              ))}
            </Block>
            <Block title="CTA examples">
              {data.cta_examples?.map((c, i) => <Row key={i} text={c}/>)}
            </Block>
          </div>
        )}
      </div>
    </div>
  );
}

// ============ COMPETITORS ============
function CompetitorsPanel({ platform, accent }) {
  const [yourHandle, setYourHandle] = useState("");
  const [yourNiche, setYourNiche] = useState("");
  const [comps, setComps] = useState(["", "", ""]);
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    const list = comps.map(c => c.trim()).filter(Boolean);
    if (!yourHandle.trim() || !list.length) { toast.error("Your handle + at least one competitor."); return; }
    setBusy(true); setData(null); setError(null);
    try {
      const { data: r } = await api.post("/social/competitors", {
        platform, your_handle: yourHandle, your_niche: yourNiche, competitors: list,
      });
      setData(r);
    } catch (err) {
      const msg = formatApiError(err);
      setError(msg);
      toast.error(msg);
    }
    finally { setBusy(false); }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <form onSubmit={submit} className="bg-white border border-[#E5E0D8] rounded-2xl p-6 space-y-4 h-fit" data-testid={`comp-form-${platform}`}>
        <Field label="Your handle *"><Input required value={yourHandle} onChange={(e)=>setYourHandle(e.target.value)} data-testid={`comp-yours-${platform}`} placeholder="@yourbusiness" className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl"/></Field>
        <Field label="Your niche"><Textarea rows={2} value={yourNiche} onChange={(e)=>setYourNiche(e.target.value)} className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl"/></Field>
        <Field label="Competitor handles *">
          {comps.map((c, i) => (
            <Input key={i} value={c} onChange={(e)=>{ const n=[...comps]; n[i]=e.target.value; setComps(n); }}
              data-testid={`comp-${platform}-${i}`}
              placeholder={`@competitor${i+1}`} className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl mt-2 first:mt-0"/>
          ))}
        </Field>
        <Button type="submit" disabled={busy} data-testid={`comp-submit-${platform}`} style={{backgroundColor: busy ? undefined : accent}} className="w-full text-[#FDFBF7] rounded-full py-6 hover:opacity-90 transition-opacity">
          <Sparkles className="mr-2" size={18}/>{busy ? "Analyzing…" : "Analyze competitors"}
        </Button>
      </form>
      <div>
        {busy && <Loader label="Reading the room…"/>}
        {error && !busy && <ErrorTile message={error} testId={`comp-${platform}-error`}/>}
        {data && (
          <div className="space-y-4" data-testid={`comp-${platform}-result`}>
            {data.overview && (
              <div className="bg-[#F3F0E9] border border-[#E5E0D8] rounded-2xl p-5">
                <div className="label-eyebrow mb-2">Landscape</div>
                <p className="text-[#1A201A] text-sm leading-relaxed">{data.overview}</p>
              </div>
            )}
            <Block title="Your opportunities">
              {data.your_opportunities?.map((o, i) => <Row key={i} text={o.opportunity} sub={`${o.why} · First step: ${o.first_step}`}/>)}
            </Block>
            <Block title="Competitors at a glance">
              {data.competitor_summaries?.map((c, i) => (
                <Row key={i} text={`@${c.handle.replace(/^@/, "")}`}
                  sub={`${c.likely_content_style} · ${c.estimated_audience} audience · strengths: ${(c.likely_strengths || []).join(", ")}`}/>
              ))}
            </Block>
            <Block title="Content gaps">
              {data.content_gaps?.map((g, i) => <Row key={i} text={g.topic} sub={`${g.format} · ${g.why}`}/>)}
            </Block>
            <Block title="Quick wins">
              {data.quick_wins?.map((q, i) => <Row key={i} text={q}/>)}
            </Block>
          </div>
        )}
      </div>
    </div>
  );
}

function ErrorTile({ message, testId }) {
  return (
    <div className="bg-[#E07A5F]/10 border border-[#E07A5F]/40 rounded-2xl p-6 flex items-start gap-3" data-testid={testId}>
      <AlertTriangle className="text-[#E07A5F] shrink-0 mt-0.5" size={20}/>
      <div>
        <div className="font-display font-bold text-[#1A201A]">Couldn&apos;t complete that request</div>
        <div className="text-sm text-[#5C685C] mt-1">{message}</div>
      </div>
    </div>
  );
}

// ============ Shared ============
function Field({ label, children }) {
  return <div className="space-y-2"><Label className="text-[#1A201A] text-sm">{label}</Label>{children}</div>;
}
function Block({ title, children }) {
  return (
    <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5">
      <div className="label-eyebrow mb-3">{title}</div>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}
function Row({ text, sub }) {
  return (
    <div className="flex items-start gap-3 group">
      <div className="flex-1 min-w-0">
        <div className="text-[#1A201A] text-sm leading-snug">{text}</div>
        {sub && <div className="text-xs text-[#5C685C] mt-0.5">{sub}</div>}
      </div>
      <button onClick={() => copy(text)} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#5C685C] hover:text-[#E07A5F]" aria-label="Copy">
        <Copy size={14}/>
      </button>
    </div>
  );
}
