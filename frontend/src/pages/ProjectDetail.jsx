import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api, { formatApiError } from "@/lib/api";
import AppLayout from "@/components/app/AppLayout";
import { Eyebrow, ScoreRing } from "@/components/app/Common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Gauge, ExternalLink, Clock, Search, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import SearchPerformance from "@/components/app/SearchPerformance";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function ProjectDetail() {
  usePageMeta({ title: "Project details", description: "View audit history and trends for your project." });
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [serpKw, setSerpKw] = useState("");
  const [serpBusy, setSerpBusy] = useState(false);
  const [serpHistory, setSerpHistory] = useState([]);

  const isPro = user?.plan && user.plan !== "free";

  useEffect(() => {
    (async () => {
      try {
        const [p, a, s] = await Promise.all([
          api.get(`/projects/${id}`),
          api.get(`/audits?project_id=${id}`),
          api.get(`/serp/history?project_id=${id}`).catch(() => ({ data: [] })),  // SERP history is optional
        ]);
        setProject(p.data);
        setAudits(a.data);
        setSerpHistory(s.data || []);
      } catch (e) {
        toast.error(formatApiError(e));
        navigate("/app/projects");
      } finally { setLoading(false); }
    })();
  }, [id, navigate]);

  const toggleSchedule = async () => {
    const next = project.schedule === "monthly" ? "off" : "monthly";
    try {
      const { data } = await api.post(`/projects/${id}/schedule`, { schedule: next });
      setProject(data);
      toast.success(next === "monthly" ? "Monthly audits scheduled" : "Schedule turned off");
    } catch (e) {
      toast.error(formatApiError(e));
    }
  };

  const runSerp = async (e) => {
    e.preventDefault();
    if (!serpKw.trim()) return;
    setSerpBusy(true);
    try {
      const { data } = await api.post("/serp/check", {
        keyword: serpKw.trim(),
        domain: project.url,
        project_id: id,
      });
      setSerpHistory((prev) => [data, ...prev]);
      setSerpKw("");
      if (data.rank) toast.success(`Found at position #${data.rank}`);
      else toast.info(`Not in top ${data.total_results_checked || 30} for that keyword`);
    } catch (e) {
      toast.error(formatApiError(e));
    } finally { setSerpBusy(false); }
  };

  if (loading || !project) {
    return <AppLayout><div className="text-[#5C685C]">Loading…</div></AppLayout>;
  }

  const chartData = [...audits].reverse().map((a) => ({
    date: new Date(a.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    score: a.summary?.overall_score ?? 0,
  }));

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto" data-testid="project-detail-root">
        <Link to="/app/projects" className="text-sm text-[#5C685C] hover:text-[#1A201A] flex items-center gap-1.5 mb-6" data-testid="back-to-projects">
          <ArrowLeft size={16}/> Back to projects
        </Link>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <Eyebrow>{project.description || "Project"}</Eyebrow>
            <h1 className="mt-3 font-display font-bold text-4xl sm:text-5xl text-[#1A201A] tracking-tight">
              {project.name}
            </h1>
            <a href={project.url} target="_blank" rel="noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-[#5C685C] hover:text-[#E07A5F]">
              {project.url} <ExternalLink size={14}/>
            </a>
          </div>
          <div className="flex gap-2">
            <Button onClick={toggleSchedule} variant="outline"
              data-testid="schedule-toggle-btn"
              className="bg-transparent border-[#E5E0D8] text-[#1A201A] hover:bg-[#F3F0E9] rounded-full">
              <Clock size={16} className="mr-1.5"/>
              {project.schedule === "monthly" ? "Monthly: ON" : "Schedule monthly"}
              {!isPro && project.schedule !== "monthly" && <span className="ml-2 text-[10px] uppercase bg-[#E07A5F] text-[#FDFBF7] px-1.5 py-0.5 rounded-full">Pro</span>}
            </Button>
            <Button onClick={() => navigate(`/app/audit?project=${project.id}&url=${encodeURIComponent(project.url)}`)}
              data-testid="project-run-audit-btn"
              className="bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7] rounded-full px-6">
              <Gauge className="mr-1.5" size={18}/> Run new audit
            </Button>
          </div>
        </div>

        {project.schedule === "monthly" && project.next_audit_at && (
          <div className="mt-5 bg-[#81B29A]/15 border border-[#81B29A]/40 rounded-2xl px-5 py-3 text-sm text-[#1A201A] inline-flex items-center gap-2">
            <Clock size={16} className="text-[#2D3E32]"/>
            Next scheduled audit: <strong>{new Date(project.next_audit_at).toLocaleDateString()}</strong>
          </div>
        )}

        <div className="mt-10 grid md:grid-cols-3 gap-5">
          <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6 flex flex-col items-center justify-center">
            <Eyebrow>Current SEO score</Eyebrow>
            <div className="mt-4"><ScoreRing score={project.last_score ?? 0} size={130}/></div>
            <div className="mt-3 text-sm text-[#5C685C]">
              {project.last_audit_at ? new Date(project.last_audit_at).toLocaleDateString() : "No audits yet"}
            </div>
          </div>

          <div className="md:col-span-2 bg-white border border-[#E5E0D8] rounded-2xl p-6">
            <Eyebrow>Score history</Eyebrow>
            <div className="mt-4 h-56">
              {chartData.length < 2 ? (
                <div className="h-full flex items-center justify-center text-[#5C685C] text-sm">
                  Run at least 2 audits to see your growth trend.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E0D8"/>
                    <XAxis dataKey="date" stroke="#5C685C" fontSize={12}/>
                    <YAxis domain={[0, 100]} stroke="#5C685C" fontSize={12}/>
                    <Tooltip contentStyle={{ backgroundColor: "#FFFFFF", border: "1px solid #E5E0D8", borderRadius: 12 }}/>
                    <Line type="monotone" dataKey="score" stroke="#2D3E32" strokeWidth={2.5} dot={{ fill: "#2D3E32", r: 4 }}/>
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Google Search Console Performance */}
        {isPro && (
          <div className="mt-8">
            <SearchPerformance projectUrl={project.url} projectName={project.name} />
          </div>
        )}

        {/* SERP rank tracker */}
        <div className="mt-12">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <Eyebrow>SERP Rank Tracking <span className="ml-2 text-[10px] uppercase bg-[#E07A5F] text-[#FDFBF7] px-1.5 py-0.5 rounded-full">Pro</span></Eyebrow>
              <h2 className="mt-2 font-display font-bold text-2xl text-[#1A201A]">Where do you rank?</h2>
              <p className="text-sm text-[#5C685C] mt-1">Check your domain&apos;s position for any keyword (best-effort, uses DuckDuckGo).</p>
            </div>
          </div>

          <form onSubmit={runSerp} className="mt-5 flex flex-wrap gap-3" data-testid="serp-form">
            <Input value={serpKw} onChange={(e) => setSerpKw(e.target.value)}
              data-testid="serp-keyword-input"
              placeholder="e.g. handmade pottery portland"
              className="flex-1 min-w-[260px] bg-white border-[#E5E0D8] rounded-xl py-6"/>
            <Button type="submit" disabled={serpBusy || !isPro}
              data-testid="serp-check-btn"
              className="bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7] rounded-full px-6">
              <Search size={16} className="mr-1.5"/>{serpBusy ? "Searching…" : "Check rank"}
            </Button>
          </form>
          {!isPro && (
            <div className="mt-3 text-sm text-[#5C685C]">
              SERP tracking is a Pro feature. <Link to="/app/billing" className="text-[#E07A5F] hover:underline">Upgrade</Link> to unlock it.
            </div>
          )}

          {serpHistory.length > 0 && (
            <div className="mt-6 space-y-3" data-testid="serp-history">
              {serpHistory.slice(0, 10).map((h) => (
                <div key={h.id} className="bg-white border border-[#E5E0D8] rounded-2xl p-5 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[#1A201A] truncate">{h.keyword}</div>
                    <div className="text-xs text-[#5C685C] mt-1">{new Date(h.created_at).toLocaleString()} · {h.domain}</div>
                  </div>
                  {h.rank ? (
                    <div className="text-right">
                      <div className="font-display font-bold text-2xl text-[#2D3E32]">#{h.rank}</div>
                      <Badge className="bg-[#81B29A]/20 text-[#2D3E32] hover:bg-[#81B29A]/20 border-0">
                        <TrendingUp size={12} className="mr-1"/> Ranking
                      </Badge>
                    </div>
                  ) : (
                    <div className="text-right">
                      <Badge className="bg-[#E07A5F]/15 text-[#C86A51] hover:bg-[#E07A5F]/15 border-0">
                        Not in top 30
                      </Badge>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-12">
          <Eyebrow>Audit history</Eyebrow>
          <h2 className="mt-2 font-display font-bold text-2xl text-[#1A201A]">All audits for this site</h2>

          {!audits.length ? (
            <div className="mt-6 bg-white border border-dashed border-[#E5E0D8] rounded-2xl p-10 text-center">
              <div className="text-[#5C685C]">No audits yet. Run your first one.</div>
            </div>
          ) : (
            <div className="mt-5 grid gap-3">
              {audits.map((a) => (
                <Link key={a.id} to={`/app/audits/${a.id}`}
                  className="bg-white border border-[#E5E0D8] rounded-2xl px-5 py-4 flex items-center gap-4 hover:-translate-y-0.5 hover:shadow-md transition-all"
                  data-testid={`history-audit-${a.id}`}>
                  <ScoreRing score={a.summary?.overall_score ?? 0} size={56} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[#1A201A] truncate">{a.url}</div>
                    <div className="text-xs text-[#5C685C] mt-1">
                      {new Date(a.created_at).toLocaleString()} · {a.summary?.issue_count ?? 0} issues
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

