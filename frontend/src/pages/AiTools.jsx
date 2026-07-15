import { useState } from "react";
import api, { formatApiError } from "@/lib/api";
import AppLayout from "@/components/app/AppLayout";
import { Eyebrow } from "@/components/app/Common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Copy, Leaf } from "lucide-react";
import { toast } from "sonner";
import { usePageMeta } from "@/hooks/usePageMeta";
import GoogleSERPPreview from "@/components/app/GoogleSERPPreview";

export default function AiTools() {
  usePageMeta({ title: "AI Studio", description: "AI-powered meta tag writer, keyword research, and competitor analysis." });
  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto" data-testid="ai-tools-root">
        <Eyebrow>AI Studio</Eyebrow>
        <h1 className="mt-3 font-display font-bold text-4xl sm:text-5xl text-[#1A201A] tracking-tight">
          Creative spark, on tap.
        </h1>
        <p className="mt-3 text-[#5C685C] text-lg">
          Claude Sonnet 4.6 writes meta tags, finds keywords, and reads your competitors — in seconds.
        </p>

        <Tabs defaultValue="meta" className="mt-10">
          <TabsList className="bg-[#F3F0E9] border border-[#E5E0D8] rounded-full p-1.5 inline-flex">
            <TabsTrigger value="meta" data-testid="tab-meta" className="rounded-full data-[state=active]:bg-[#E07A5F] data-[state=active]:text-[#FDFBF7]">Meta tag writer</TabsTrigger>
            <TabsTrigger value="keywords" data-testid="tab-keywords" className="rounded-full data-[state=active]:bg-[#E07A5F] data-[state=active]:text-[#FDFBF7]">Keyword research</TabsTrigger>
            <TabsTrigger value="competitors" data-testid="tab-competitors" className="rounded-full data-[state=active]:bg-[#E07A5F] data-[state=active]:text-[#FDFBF7]">Competitor analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="meta" className="mt-8"><MetaTab/></TabsContent>
          <TabsContent value="keywords" className="mt-8"><KeywordsTab/></TabsContent>
          <TabsContent value="competitors" className="mt-8"><CompetitorsTab/></TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

const copy = (text) => {
  navigator.clipboard.writeText(text);
  toast.success("Copied");
};

function Loader({ label }) {
  return (
    <div className="bg-white border border-[#E5E0D8] rounded-2xl p-10 flex flex-col items-center justify-center text-[#5C685C]">
      <Leaf className="loader-leaf text-[#81B29A]" size={36}/>
      <div className="mt-4 text-sm">{label}</div>
    </div>
  );
}

function MetaTab() {
  const [form, setForm] = useState({ business_name: "", description: "", target_keywords: "" });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setResult(null);
    try {
      const { data } = await api.post("/ai/meta-tags", form);
      setResult(data);
    } catch (err) { toast.error(formatApiError(err)); }
    finally { setBusy(false); }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <form onSubmit={submit} className="bg-white border border-[#E5E0D8] rounded-2xl p-6 space-y-4" data-testid="meta-form">
        <div className="space-y-2">
          <Label>Business name *</Label>
          <Input required value={form.business_name} onChange={(e) => setForm({...form, business_name: e.target.value})}
            data-testid="meta-name" className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl"/>
        </div>
        <div className="space-y-2">
          <Label>What does it do? *</Label>
          <Textarea required rows={4} value={form.description}
            placeholder="Family-owned bakery in Portland specializing in sourdough and pastries."
            onChange={(e) => setForm({...form, description: e.target.value})}
            data-testid="meta-desc" className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl"/>
        </div>
        <div className="space-y-2">
          <Label>Target keywords (optional)</Label>
          <Input value={form.target_keywords} onChange={(e) => setForm({...form, target_keywords: e.target.value})}
            data-testid="meta-keywords" placeholder="sourdough Portland, artisan bakery"
            className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl"/>
        </div>
        <Button type="submit" disabled={busy} data-testid="meta-submit"
          className="w-full bg-[#E07A5F] hover:bg-[#C86A51] text-[#FDFBF7] rounded-full py-6">
          <Sparkles className="mr-2" size={18}/>{busy ? "Writing…" : "Generate meta tags"}
        </Button>
      </form>

      <div>
        {busy && <Loader label="Claude is composing your tags…"/>}
        {result && (
          <div className="space-y-4" data-testid="meta-result">
            {/* Google SERP Preview — show how tags look in search results */}
            <GoogleSERPPreview
              title={result.title_options?.[0]?.text || "Your Page Title"}
              url={form.business_name.toLowerCase().replace(/\s+/g, "") + ".com"}
              description={result.description_options?.[0]?.text || "Your meta description appears here."}
            />
            <ResultBlock title="Title options">
              {result.title_options?.map((t, i) => (
                <ResultRow key={i} text={t.text} sub={`${t.length} chars · ${t.rationale}`} />
              ))}
            </ResultBlock>
            <ResultBlock title="Description options">
              {result.description_options?.map((d, i) => (
                <ResultRow key={i} text={d.text} sub={`${d.length} chars · ${d.rationale}`} />
              ))}
            </ResultBlock>
            <ResultBlock title="Social (OpenGraph)">
              <ResultRow text={result.og_title} sub="og:title" />
              <ResultRow text={result.og_description} sub="og:description" />
            </ResultBlock>
            {result.focus_keywords && (
              <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5">
                <div className="label-eyebrow mb-3">Focus keywords</div>
                <div className="flex flex-wrap gap-2">
                  {result.focus_keywords.map((k, i) => (
                    <Badge key={i} className="bg-[#81B29A]/20 text-[#2D3E32] hover:bg-[#81B29A]/30 border-0">{k}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function KeywordsTab() {
  const [form, setForm] = useState({ seed_topic: "", industry: "", location: "" });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setResult(null);
    try {
      const { data } = await api.post("/ai/keywords", form);
      setResult(data);
    } catch (err) { toast.error(formatApiError(err)); }
    finally { setBusy(false); }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <form onSubmit={submit} className="bg-white border border-[#E5E0D8] rounded-2xl p-6 space-y-4 h-fit" data-testid="keywords-form">
        <div className="space-y-2">
          <Label>Topic or niche *</Label>
          <Input required value={form.seed_topic} onChange={(e) => setForm({...form, seed_topic: e.target.value})}
            placeholder="indoor plants, dog grooming, handmade jewelry"
            data-testid="kw-topic" className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl"/>
        </div>
        <div className="space-y-2">
          <Label>Industry (optional)</Label>
          <Input value={form.industry} onChange={(e) => setForm({...form, industry: e.target.value})}
            data-testid="kw-industry" className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl"/>
        </div>
        <div className="space-y-2">
          <Label>Location (optional)</Label>
          <Input value={form.location} onChange={(e) => setForm({...form, location: e.target.value})}
            placeholder="Portland, OR"
            data-testid="kw-location" className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl"/>
        </div>
        <Button type="submit" disabled={busy} data-testid="kw-submit"
          className="w-full bg-[#E07A5F] hover:bg-[#C86A51] text-[#FDFBF7] rounded-full py-6">
          <Sparkles className="mr-2" size={18}/>{busy ? "Researching…" : "Find keywords"}
        </Button>
      </form>

      <div>
        {busy && <Loader label="Hunting low-competition phrases…"/>}
        {result && (
          <div className="space-y-4" data-testid="keywords-result">
            <ResultBlock title="Primary keywords">
              {result.primary_keywords?.map((k, i) => (
                <ResultRow key={i} text={k.keyword}
                  sub={`${k.intent} · ${k.difficulty} difficulty · ${k.monthly_volume_estimate} volume — ${k.why}`}/>
              ))}
            </ResultBlock>
            <ResultBlock title="Long-tail opportunities (low competition)">
              {result.long_tail_opportunities?.map((k, i) => (
                <ResultRow key={i} text={k.keyword} sub={`${k.intent} · ${k.why}`}/>
              ))}
            </ResultBlock>
            {result.local_keywords?.length > 0 && (
              <ResultBlock title="Local keywords">
                {result.local_keywords.map((k, i) => <ResultRow key={i} text={k.keyword} sub={k.why}/>)}
              </ResultBlock>
            )}
            <ResultBlock title="Questions your customers ask">
              {result.questions_people_ask?.map((q, i) => <ResultRow key={i} text={q}/>)}
            </ResultBlock>
            <ResultBlock title="Content ideas">
              {result.content_ideas?.map((c, i) => (
                <ResultRow key={i} text={c.title} sub={`${c.format} · target: ${c.target_keyword}`}/>
              ))}
            </ResultBlock>
          </div>
        )}
      </div>
    </div>
  );
}

function CompetitorsTab() {
  const [yourSite, setYourSite] = useState("");
  const [comps, setComps] = useState(["", "", ""]);
  const [industry, setIndustry] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    const list = comps.map((c) => c.trim()).filter(Boolean);
    if (!list.length) { toast.error("Add at least one competitor"); return; }
    setBusy(true); setResult(null);
    try {
      const { data } = await api.post("/ai/competitors", {
        your_site: yourSite, competitors: list, industry,
      });
      setResult(data);
    } catch (err) { toast.error(formatApiError(err)); }
    finally { setBusy(false); }
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <form onSubmit={submit} className="bg-white border border-[#E5E0D8] rounded-2xl p-6 space-y-4 h-fit" data-testid="comp-form">
        <div className="space-y-2">
          <Label>Your website *</Label>
          <Input required value={yourSite} onChange={(e) => setYourSite(e.target.value)}
            placeholder="https://yourshop.com"
            data-testid="comp-your-site" className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl"/>
        </div>
        <div className="space-y-2">
          <Label>Competitors *</Label>
          {comps.map((c, i) => (
            <Input key={i} value={c} onChange={(e) => {
              const next = [...comps]; next[i] = e.target.value; setComps(next);
            }} placeholder={`competitor${i+1}.com`}
              data-testid={`comp-input-${i}`}
              className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl"/>
          ))}
        </div>
        <div className="space-y-2">
          <Label>Industry (optional)</Label>
          <Input value={industry} onChange={(e) => setIndustry(e.target.value)}
            data-testid="comp-industry" className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl"/>
        </div>
        <Button type="submit" disabled={busy} data-testid="comp-submit"
          className="w-full bg-[#E07A5F] hover:bg-[#C86A51] text-[#FDFBF7] rounded-full py-6">
          <Sparkles className="mr-2" size={18}/>{busy ? "Analyzing…" : "Analyze competitors"}
        </Button>
      </form>

      <div>
        {busy && <Loader label="Reading the room…"/>}
        {result && (
          <div className="space-y-4" data-testid="comp-result">
            {result.overview && (
              <div className="bg-[#F3F0E9] border border-[#E5E0D8] rounded-2xl p-5">
                <div className="label-eyebrow mb-2">Landscape</div>
                <p className="text-[#1A201A] text-sm leading-relaxed">{result.overview}</p>
              </div>
            )}
            <ResultBlock title="Your opportunities">
              {result.your_opportunities?.map((o, i) => (
                <ResultRow key={i} text={o.opportunity} sub={`${o.why_it_matters} · First step: ${o.first_step}`}/>
              ))}
            </ResultBlock>
            <ResultBlock title="What competitors are doing well">
              {result.competitor_strengths?.map((c, i) => (
                <ResultRow key={i} text={c.competitor}
                  sub={`Strengths: ${(c.strengths || []).join(", ")} · Keywords: ${(c.likely_keyword_focus || []).join(", ")}`}/>
              ))}
            </ResultBlock>
            <ResultBlock title="Content gaps">
              {result.content_gaps?.map((g, i) => <ResultRow key={i} text={g.topic} sub={g.why}/>)}
            </ResultBlock>
            <ResultBlock title="Quick wins">
              {result.quick_wins?.map((q, i) => <ResultRow key={i} text={q}/>)}
            </ResultBlock>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultBlock({ title, children }) {
  return (
    <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5">
      <div className="label-eyebrow mb-3">{title}</div>
      <div className="space-y-2.5">{children}</div>
    </div>
  );
}

function ResultRow({ text, sub }) {
  return (
    <div className="flex items-start gap-3 group">
      <div className="flex-1 min-w-0">
        <div className="text-[#1A201A] text-sm leading-snug">{text}</div>
        {sub && <div className="text-xs text-[#5C685C] mt-0.5">{sub}</div>}
      </div>
      <button onClick={() => copy(text)} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#5C685C] hover:text-[#E07A5F]">
        <Copy size={14}/>
      </button>
    </div>
  );
}
