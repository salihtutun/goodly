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
import { Sparkles, MapPin, Leaf, AlertTriangle, CheckCircle2, X, Plus } from "lucide-react";
import { toast } from "sonner";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function GbpAudit() {
  usePageMeta({ title: "Google Business Profile", description: "Audit your Google Business Profile and get AI-powered recommendations to rank higher in local search." });
  const [tab, setTab] = useState("audit");

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto" data-testid="gbp-root">
        <Eyebrow>Local presence</Eyebrow>
        <h1 className="mt-3 font-display font-bold text-4xl sm:text-5xl text-[#1A201A] tracking-tight">
          Own your Google Maps panel.
        </h1>
        <p className="mt-3 text-[#5C685C] text-lg max-w-3xl">
          Your Google Business Profile is the most important local-SEO asset you have. We audit it, score it, and tell you exactly what to fix.
        </p>

        <Tabs value={tab} onValueChange={setTab} className="mt-10">
          <TabsList className="bg-[#F3F0E9] border border-[#E5E0D8] rounded-full p-1.5 inline-flex">
            <TabsTrigger value="audit" data-testid="gbp-tab-audit" className="rounded-full data-[state=active]:bg-[#2D3E32] data-[state=active]:text-[#FDFBF7] gap-1.5">
              <MapPin size={14} /> Audit
            </TabsTrigger>
            <TabsTrigger value="suggestions" data-testid="gbp-tab-suggestions" className="rounded-full data-[state=active]:bg-[#2D3E32] data-[state=active]:text-[#FDFBF7] gap-1.5">
              <Sparkles size={14} /> Suggestions
            </TabsTrigger>
            <TabsTrigger value="competitors" data-testid="gbp-tab-competitors" className="rounded-full data-[state=active]:bg-[#2D3E32] data-[state=active]:text-[#FDFBF7] gap-1.5">
              <MapPin size={14} /> Competitors
            </TabsTrigger>
            <TabsTrigger value="history" data-testid="gbp-tab-history" className="rounded-full data-[state=active]:bg-[#2D3E32] data-[state=active]:text-[#FDFBF7] gap-1.5">
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="audit" className="mt-8"><AuditTab /></TabsContent>
          <TabsContent value="suggestions" className="mt-8"><SuggestionsTab /></TabsContent>
          <TabsContent value="competitors" className="mt-8"><CompetitorsTab /></TabsContent>
          <TabsContent value="history" className="mt-8"><HistoryTab /></TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function AuditTab() {
  const [form, setForm] = useState({ business_name: "", primary_category: "", address: "", service_area: "", description: "", phone: "", website: "", hours_summary: "", photo_count: "", reviews_count: "", avg_rating: "", response_rate: "", posts_per_month: "", booking_enabled: false, messaging_enabled: false });
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.business_name.trim() || !form.primary_category.trim()) {
      toast.error("Business name and primary category are required."); return;
    }
    setBusy(true); setData(null);
    try {
      const payload = { ...form };
      if (payload.photo_count) payload.photo_count = parseInt(payload.photo_count);
      if (payload.reviews_count) payload.reviews_count = parseInt(payload.reviews_count);
      if (payload.avg_rating) payload.avg_rating = parseFloat(payload.avg_rating);
      if (payload.posts_per_month) payload.posts_per_month = parseInt(payload.posts_per_month);
      const { data: r } = await api.post("/gbp/audit", payload);
      setData(r);
      toast.success("GBP audit complete");
    } catch (err) {
      toast.error(formatApiError(err));
    } finally { setBusy(false); }
  };

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div>
      <form onSubmit={submit} className="bg-white border border-[#E5E0D8] rounded-2xl p-6 space-y-5" data-testid="gbp-audit-form">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <Label>Business name *</Label>
            <Input value={form.business_name} onChange={e => update("business_name", e.target.value)} placeholder="Greenhouse Lane Co." data-testid="gbp-business-name" className="bg-white border-[#E5E0D8] rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Primary category *</Label>
            <Input value={form.primary_category} onChange={e => update("primary_category", e.target.value)} placeholder="Plant Nursery" data-testid="gbp-category" className="bg-white border-[#E5E0D8] rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input value={form.address} onChange={e => update("address", e.target.value)} placeholder="123 Main St, Portland, OR" className="bg-white border-[#E5E0D8] rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Service area</Label>
            <Input value={form.service_area} onChange={e => update("service_area", e.target.value)} placeholder="Portland metro area" className="bg-white border-[#E5E0D8] rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="(503) 555-0123" className="bg-white border-[#E5E0D8] rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Website</Label>
            <Input value={form.website} onChange={e => update("website", e.target.value)} placeholder="https://greenhouselane.com" className="bg-white border-[#E5E0D8] rounded-xl" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea value={form.description} onChange={e => update("description", e.target.value)} placeholder="Your current GBP description..." rows={3} className="bg-white border-[#E5E0D8] rounded-xl" />
        </div>
        <div className="space-y-2">
          <Label>Hours summary</Label>
          <Input value={form.hours_summary} onChange={e => update("hours_summary", e.target.value)} placeholder="Mon-Fri 9-5, Sat 10-4" className="bg-white border-[#E5E0D8] rounded-xl" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label>Photo count</Label>
            <Input type="number" value={form.photo_count} onChange={e => update("photo_count", e.target.value)} className="bg-white border-[#E5E0D8] rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Review count</Label>
            <Input type="number" value={form.reviews_count} onChange={e => update("reviews_count", e.target.value)} className="bg-white border-[#E5E0D8] rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Avg rating</Label>
            <Input type="number" step="0.1" value={form.avg_rating} onChange={e => update("avg_rating", e.target.value)} className="bg-white border-[#E5E0D8] rounded-xl" />
          </div>
          <div className="space-y-2">
            <Label>Posts/month</Label>
            <Input type="number" value={form.posts_per_month} onChange={e => update("posts_per_month", e.target.value)} className="bg-white border-[#E5E0D8] rounded-xl" />
          </div>
        </div>
        <Button type="submit" disabled={busy} data-testid="gbp-audit-submit" className="bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7] rounded-full px-6">
          {busy ? <Leaf className="loader-leaf text-[#81B29A]" size={18} /> : <><MapPin size={16} className="mr-2" /> Run GBP audit</>}
        </Button>
      </form>

      {data?.result && (
        <div className="mt-8 space-y-6" data-testid="gbp-audit-results">
          <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6 flex items-center gap-6">
            <ScoreRing score={data.result.overall_score} size={100} />
            <div>
              <div className="font-display font-bold text-2xl text-[#1A201A]">GBP Health Score</div>
              <div className="text-[#5C685C] mt-1">Based on {Object.keys(data.result.categories || {}).length} categories</div>
            </div>
          </div>
          {Object.entries(data.result.categories || {}).map(([catName, catScore], i) => (
            <div key={i} className="bg-white border border-[#E5E0D8] rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="font-medium text-[#1A201A]">{catName}</div>
                <Badge className={catScore >= 70 ? "bg-[#81B29A]/20 text-[#81B29A]" : catScore >= 40 ? "bg-[#E6A57E]/20 text-[#E6A57E]" : "bg-[#E07A5F]/20 text-[#E07A5F]"}>{catScore}/100</Badge>
              </div>
              {null?.map((issue, j) => (
                <div key={j} className="flex items-start gap-2 mt-2 text-sm">
                  {issue.severity === "high" ? <AlertTriangle size={14} className="text-[#E07A5F] mt-0.5 shrink-0" /> : <CheckCircle2 size={14} className="text-[#81B29A] mt-0.5 shrink-0" />}
                  <span className="text-[#5C685C]">{issue.message}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SuggestionsTab() {
  const [form, setForm] = useState({ business_name: "", primary_category: "", location: "", target_customer: "", current_description: "" });
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.business_name.trim() || !form.primary_category.trim()) {
      toast.error("Business name and category are required."); return;
    }
    setBusy(true); setData(null);
    try {
      const { data: r } = await api.post("/gbp/suggestions", form);
      setData(r);
    } catch (err) {
      toast.error(formatApiError(err));
    } finally { setBusy(false); }
  };

  return (
    <div>
      <form onSubmit={submit} className="bg-white border border-[#E5E0D8] rounded-2xl p-6 space-y-5" data-testid="gbp-suggestions-form">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2"><Label>Business name *</Label><Input value={form.business_name} onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))} className="bg-white border-[#E5E0D8] rounded-xl" /></div>
          <div className="space-y-2"><Label>Primary category *</Label><Input value={form.primary_category} onChange={e => setForm(f => ({ ...f, primary_category: e.target.value }))} className="bg-white border-[#E5E0D8] rounded-xl" /></div>
          <div className="space-y-2"><Label>Location</Label><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="bg-white border-[#E5E0D8] rounded-xl" /></div>
          <div className="space-y-2"><Label>Target customer</Label><Input value={form.target_customer} onChange={e => setForm(f => ({ ...f, target_customer: e.target.value }))} className="bg-white border-[#E5E0D8] rounded-xl" /></div>
        </div>
        <div className="space-y-2"><Label>Current description</Label><Textarea value={form.current_description} onChange={e => setForm(f => ({ ...f, current_description: e.target.value }))} rows={3} className="bg-white border-[#E5E0D8] rounded-xl" /></div>
        <Button type="submit" disabled={busy} data-testid="gbp-suggestions-submit" className="bg-[#E07A5F] hover:bg-[#C86A51] text-[#FDFBF7] rounded-full px-6">
          {busy ? <Leaf className="loader-leaf text-[#FDFBF7]" size={18} /> : <><Sparkles size={16} className="mr-2" /> Get suggestions</>}
        </Button>
      </form>
      {data && <div className="mt-8 bg-white border border-[#E5E0D8] rounded-2xl p-6" data-testid="gbp-suggestions-results"><pre className="text-sm text-[#5C685C] whitespace-pre-wrap font-sans">{JSON.stringify(data, null, 2)}</pre></div>}
    </div>
  );
}

function CompetitorsTab() {
  const [form, setForm] = useState({ business_name: "", primary_category: "", location: "", competitors: [] });
  const [compInput, setCompInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState(null);

  const addCompetitor = () => {
    const c = compInput.trim();
    if (c && !form.competitors.includes(c)) {
      setForm(f => ({ ...f, competitors: [...f.competitors, c] }));
      setCompInput("");
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.business_name.trim() || !form.primary_category.trim()) {
      toast.error("Business name and category are required."); return;
    }
    setBusy(true); setData(null);
    try {
      const { data: r } = await api.post("/gbp/competitors", form);
      setData(r);
    } catch (err) {
      toast.error(formatApiError(err));
    } finally { setBusy(false); }
  };

  return (
    <div>
      <form onSubmit={submit} className="bg-white border border-[#E5E0D8] rounded-2xl p-6 space-y-5" data-testid="gbp-competitors-form">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="space-y-2"><Label>Business name *</Label><Input value={form.business_name} onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))} className="bg-white border-[#E5E0D8] rounded-xl" /></div>
          <div className="space-y-2"><Label>Primary category *</Label><Input value={form.primary_category} onChange={e => setForm(f => ({ ...f, primary_category: e.target.value }))} className="bg-white border-[#E5E0D8] rounded-xl" /></div>
          <div className="space-y-2"><Label>Location</Label><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} className="bg-white border-[#E5E0D8] rounded-xl" /></div>
        </div>
        <div className="space-y-2">
          <Label>Competitors</Label>
          <div className="flex gap-2">
            <Input value={compInput} onChange={e => setCompInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addCompetitor())} placeholder="Add a competitor name..." className="bg-white border-[#E5E0D8] rounded-xl" />
            <Button type="button" onClick={addCompetitor} className="bg-[#F3F0E9] hover:bg-[#E5E0D8] text-[#1A201A] rounded-xl"><Plus size={16} /></Button>
          </div>
          {form.competitors.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {form.competitors.map((c, i) => (
                <Badge key={i} className="bg-[#F3F0E9] text-[#1A201A] gap-1.5 px-3 py-1.5">
                  {c}
                  <button onClick={() => setForm(f => ({ ...f, competitors: f.competitors.filter((_, j) => j !== i) }))}><X size={12} /></button>
                </Badge>
              ))}
            </div>
          )}
        </div>
        <Button type="submit" disabled={busy} data-testid="gbp-competitors-submit" className="bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7] rounded-full px-6">
          {busy ? <Leaf className="loader-leaf text-[#81B29A]" size={18} /> : <><MapPin size={16} className="mr-2" /> Compare competitors</>}
        </Button>
      </form>
      {data && <div className="mt-8 bg-white border border-[#E5E0D8] rounded-2xl p-6" data-testid="gbp-competitors-results"><pre className="text-sm text-[#5C685C] whitespace-pre-wrap font-sans">{JSON.stringify(data, null, 2)}</pre></div>}
    </div>
  );
}

function HistoryTab() {
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/gbp/audits");
        setAudits(data);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <div className="bg-white border border-[#E5E0D8] rounded-2xl p-10 flex items-center justify-center"><Leaf className="loader-leaf text-[#81B29A]" size={36} /></div>;

  if (audits.length === 0) return (
    <div className="bg-white border border-[#E5E0D8] rounded-2xl p-10 text-center" data-testid="gbp-history-empty">
      <MapPin size={36} className="text-[#E5E0D8] mx-auto mb-4" />
      <div className="text-[#5C685C]">No GBP audits yet. Run your first one above.</div>
    </div>
  );

  return (
    <div className="space-y-4" data-testid="gbp-history-list">
      {audits.map((a) => (
        <div key={a.id} className="bg-white border border-[#E5E0D8] rounded-2xl p-5 flex items-center justify-between">
          <div>
            <div className="font-medium text-[#1A201A]">{a.input?.business_name || "Unknown"}</div>
            <div className="text-sm text-[#5C685C]">{a.input?.primary_category} — {new Date(a.created_at).toLocaleDateString()}</div>
          </div>
          {a.result?.overall_score != null && <ScoreRing score={a.result.overall_score} size={60} />}
        </div>
      ))}
    </div>
  );
}
