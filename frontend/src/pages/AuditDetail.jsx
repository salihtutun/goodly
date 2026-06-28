import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api, { formatApiError } from "@/lib/api";
import AppLayout from "@/components/app/AppLayout";
import { Eyebrow, ScoreRing } from "@/components/app/Common";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ExternalLink, AlertTriangle, CheckCircle2, Info, Sparkles, Globe, Smartphone, Image as ImageIcon, Link2, Shield } from "lucide-react";
import { toast } from "sonner";

export default function AuditDetail() {
  const { id } = useParams();
  const [audit, setAudit] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/audits/${id}`);
        setAudit(data);
      } catch (e) {
        toast.error(formatApiError(e));
      } finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return <AppLayout><div className="text-[#5C685C]">Loading audit…</div></AppLayout>;
  if (!audit) return <AppLayout><div className="text-[#5C685C]">Audit not found.</div></AppLayout>;

  const result = audit.result || {};
  const ai = audit.ai_recommendations || {};

  if (result.fetch_failed) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto bg-white border border-[#E5E0D8] rounded-2xl p-10">
          <Link to="/app/audit" className="text-sm text-[#5C685C] hover:text-[#1A201A] flex items-center gap-1.5 mb-6">
            <ArrowLeft size={16}/> Back to audits
          </Link>
          <div className="font-display font-bold text-2xl text-[#E07A5F]">Couldn&apos;t reach that site</div>
          <p className="mt-3 text-[#5C685C]">{result.error}</p>
        </div>
      </AppLayout>
    );
  }

  const cats = result.categories || {};
  const issues = result.issues || [];
  const highIssues = issues.filter((i) => i.severity === "high");
  const medIssues = issues.filter((i) => i.severity === "medium");
  const lowIssues = issues.filter((i) => i.severity === "low");

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto" data-testid="audit-detail-root">
        <Link to="/app/audit" className="text-sm text-[#5C685C] hover:text-[#1A201A] flex items-center gap-1.5 mb-6" data-testid="back-to-audits">
          <ArrowLeft size={16}/> New audit
        </Link>

        {/* Header */}
        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-8 grid md:grid-cols-3 gap-8 items-center">
          <div className="flex flex-col items-center">
            <ScoreRing score={result.overall_score} size={160} />
            <div className="mt-3 label-eyebrow">Overall health</div>
          </div>
          <div className="md:col-span-2">
            <Eyebrow>SEO Audit</Eyebrow>
            <h1 className="mt-2 font-display font-bold text-3xl text-[#1A201A] tracking-tight break-all">
              {result.url}
            </h1>
            <div className="mt-3 flex flex-wrap gap-2 text-sm text-[#5C685C]">
              <a href={result.url} target="_blank" rel="noreferrer" className="hover:text-[#E07A5F] flex items-center gap-1">
                Open site <ExternalLink size={13}/>
              </a>
              <span>·</span>
              <span>{new Date(audit.created_at).toLocaleString()}</span>
              <span>·</span>
              <span>{result.load_time_ms}ms load</span>
              <span>·</span>
              <span>{issues.length} issues</span>
            </div>

            {ai?.summary && (
              <div className="mt-5 bg-[#F3F0E9] border border-[#E5E0D8] rounded-xl p-4 flex gap-3">
                <Sparkles className="text-[#E07A5F] shrink-0 mt-0.5" size={18}/>
                <div>
                  <div className="label-eyebrow mb-1">AI summary</div>
                  <p className="text-[#1A201A] text-sm leading-relaxed">{ai.summary}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Category scores */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          <CatTile label="Meta tags" score={cats.meta_tags} icon={Info}/>
          <CatTile label="Headings" score={cats.headings} icon={Info}/>
          <CatTile label="Performance" score={cats.performance} icon={Globe}/>
          <CatTile label="Mobile" score={cats.mobile} icon={Smartphone}/>
          <CatTile label="Accessibility" score={cats.accessibility} icon={ImageIcon}/>
          <CatTile label="Content" score={cats.content} icon={Info}/>
          <CatTile label="Social" score={cats.social} icon={Link2}/>
          <CatTile label="Security" score={cats.security} icon={Shield}/>
        </div>

        {/* Detail tabs */}
        <Tabs defaultValue="actions" className="mt-10">
          <TabsList className="bg-[#F3F0E9] border border-[#E5E0D8] rounded-full p-1.5 inline-flex">
            <TabsTrigger value="actions" data-testid="tab-actions" className="rounded-full data-[state=active]:bg-[#2D3E32] data-[state=active]:text-[#FDFBF7]">AI Action Plan</TabsTrigger>
            <TabsTrigger value="issues" data-testid="tab-issues" className="rounded-full data-[state=active]:bg-[#2D3E32] data-[state=active]:text-[#FDFBF7]">Issues ({issues.length})</TabsTrigger>
            <TabsTrigger value="details" data-testid="tab-details" className="rounded-full data-[state=active]:bg-[#2D3E32] data-[state=active]:text-[#FDFBF7]">Raw details</TabsTrigger>
          </TabsList>

          <TabsContent value="actions" className="mt-6 space-y-5">
            {ai?.priority_actions?.length ? (
              <>
                {ai.priority_actions.map((a, i) => (
                  <div key={i} className="bg-white border border-[#E5E0D8] rounded-2xl p-6" data-testid={`action-${i}`}>
                    <div className="flex items-start gap-4">
                      <div className="h-9 w-9 rounded-full bg-[#E07A5F]/15 text-[#E07A5F] font-display font-bold flex items-center justify-center shrink-0">
                        {i + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-display font-bold text-lg text-[#1A201A]">{a.title}</div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge variant="outline" className="border-[#E5E0D8] text-[#5C685C]">Impact: {a.estimated_impact}</Badge>
                          <Badge variant="outline" className="border-[#E5E0D8] text-[#5C685C]">Effort: {a.estimated_effort}</Badge>
                        </div>
                        <p className="mt-3 text-sm text-[#5C685C]"><strong className="text-[#1A201A]">Why:</strong> {a.why}</p>
                        <p className="mt-2 text-sm text-[#5C685C]"><strong className="text-[#1A201A]">How:</strong> {a.how}</p>
                      </div>
                    </div>
                  </div>
                ))}

                {ai.wins?.length > 0 && (
                  <div className="bg-[#81B29A]/12 border border-[#81B29A]/40 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="text-[#81B29A]" size={18}/>
                      <div className="font-display font-bold text-[#1A201A]">What you&apos;re doing well</div>
                    </div>
                    <ul className="space-y-1.5 text-sm text-[#1A201A]">
                      {ai.wins.map((w, i) => <li key={i}>• {w}</li>)}
                    </ul>
                  </div>
                )}

                {ai.next_30_days?.length > 0 && (
                  <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6">
                    <div className="label-eyebrow mb-3">Next 30 days</div>
                    <ul className="space-y-2 text-[#1A201A]">
                      {ai.next_30_days.map((step, i) => (
                        <li key={i} className="flex gap-3"><span className="text-[#81B29A] font-bold">→</span><span>{step}</span></li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white border border-[#E5E0D8] rounded-2xl p-8 text-[#5C685C]">
                AI recommendations are unavailable right now. The Issues tab still has everything you need to act on.
              </div>
            )}
          </TabsContent>

          <TabsContent value="issues" className="mt-6 space-y-3">
            {issues.length === 0 ? (
              <div className="bg-[#81B29A]/12 border border-[#81B29A]/40 rounded-2xl p-8 text-center">
                <CheckCircle2 className="text-[#81B29A] mx-auto" size={36}/>
                <div className="mt-3 font-display font-bold text-xl text-[#1A201A]">No issues found</div>
                <p className="mt-1 text-[#5C685C]">Excellent. This page is well-optimized.</p>
              </div>
            ) : (
              <>
                {highIssues.length > 0 && <IssueGroup title="Critical" items={highIssues} color="#E07A5F"/>}
                {medIssues.length > 0 && <IssueGroup title="Medium" items={medIssues} color="#E6A57E"/>}
                {lowIssues.length > 0 && <IssueGroup title="Polish" items={lowIssues} color="#81B29A"/>}
              </>
            )}
          </TabsContent>

          <TabsContent value="details" className="mt-6 grid md:grid-cols-2 gap-5">
            <DetailCard title="Meta tags">
              <Row k="Title" v={result.metadata?.title || "—"}/>
              <Row k="Title length" v={result.metadata?.title_length}/>
              <Row k="Description" v={result.metadata?.description || "—"}/>
              <Row k="Description length" v={result.metadata?.description_length}/>
              <Row k="Canonical" v={result.metadata?.canonical || "—"}/>
              <Row k="Robots" v={result.metadata?.robots || "—"}/>
            </DetailCard>
            <DetailCard title="Headings">
              <Row k="H1 count" v={result.headings?.h1_count}/>
              <Row k="H2 count" v={result.headings?.h2_count}/>
              <Row k="H3 count" v={result.headings?.h3_count}/>
              {(result.headings?.h1 || []).map((h, i) => <Row key={i} k={`H1 #${i+1}`} v={h}/>)}
            </DetailCard>
            <DetailCard title="Page">
              <Row k="HTTPS" v={result.metadata?.is_https ? "Yes" : "No"}/>
              <Row k="Viewport tag" v={result.metadata?.has_viewport ? "Yes" : "No"}/>
              <Row k="Schema (JSON-LD)" v={result.metadata?.has_schema ? "Yes" : "No"}/>
              <Row k="Status code" v={result.status_code}/>
              <Row k="Load time" v={`${result.load_time_ms} ms`}/>
              <Row k="Word count" v={result.content?.word_count}/>
            </DetailCard>
            <DetailCard title="Images & links">
              <Row k="Images total" v={result.images?.total}/>
              <Row k="Missing alt text" v={result.images?.missing_alt}/>
              <Row k="Internal links" v={result.links?.internal}/>
              <Row k="External links" v={result.links?.external}/>
            </DetailCard>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function CatTile({ label, score, icon: Icon }) {
  return (
    <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5 flex items-center gap-4" data-testid={`cat-${label.toLowerCase().replace(/\s/g,'-')}`}>
      <ScoreRing score={score ?? 0} size={56}/>
      <div className="min-w-0">
        <div className="label-eyebrow">{label}</div>
        <div className="font-display font-bold text-xl text-[#1A201A] mt-1">{score ?? 0}<span className="text-sm text-[#5C685C]">/100</span></div>
      </div>
    </div>
  );
}

function IssueGroup({ title, items, color }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3 mt-2">
        <AlertTriangle style={{ color }} size={18}/>
        <div className="font-display font-bold text-[#1A201A]">{title} <span className="text-[#5C685C] font-normal">({items.length})</span></div>
      </div>
      <div className="space-y-3">
        {items.map((it, i) => (
          <div key={i} className="bg-white border border-[#E5E0D8] rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full mt-2.5" style={{ backgroundColor: color }}/>
              <div className="flex-1">
                <div className="text-xs text-[#5C685C] uppercase tracking-wider">{it.category}</div>
                <div className="font-medium text-[#1A201A] mt-1">{it.message}</div>
                <div className="text-sm text-[#5C685C] mt-1.5">{it.fix}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DetailCard({ title, children }) {
  return (
    <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6">
      <div className="label-eyebrow mb-4">{title}</div>
      <div className="space-y-2.5 text-sm">{children}</div>
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div className="flex gap-3 border-b border-[#E5E0D8] last:border-b-0 pb-2 last:pb-0">
      <div className="text-[#5C685C] w-40 shrink-0">{k}</div>
      <div className="text-[#1A201A] break-words flex-1">{String(v ?? "—")}</div>
    </div>
  );
}
