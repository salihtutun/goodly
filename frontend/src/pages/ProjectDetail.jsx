import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import api, { formatApiError } from "@/lib/api";
import AppLayout from "@/components/app/AppLayout";
import { Eyebrow, ScoreRing } from "@/components/app/Common";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Gauge, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [audits, setAudits] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [p, a] = await Promise.all([
          api.get(`/projects/${id}`),
          api.get(`/audits?project_id=${id}`),
        ]);
        setProject(p.data);
        setAudits(a.data);
      } catch (e) {
        toast.error(formatApiError(e));
        navigate("/app/projects");
      } finally { setLoading(false); }
    })();
  }, [id, navigate]);

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
          <Button onClick={() => navigate(`/app/audit?project=${project.id}&url=${encodeURIComponent(project.url)}`)}
            data-testid="project-run-audit-btn"
            className="bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7] rounded-full px-6">
            <Gauge className="mr-1.5" size={18}/> Run new audit
          </Button>
        </div>

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
                    <defs>
                      <linearGradient id="gscore" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#81B29A" stopOpacity={0.6}/>
                        <stop offset="100%" stopColor="#81B29A" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
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
