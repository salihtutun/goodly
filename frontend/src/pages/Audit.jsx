import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api, { formatApiError } from "@/lib/api";
import AppLayout from "@/components/app/AppLayout";
import { Eyebrow } from "@/components/app/Common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gauge, Leaf } from "lucide-react";
import { toast } from "sonner";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function Audit() {
  usePageMeta({ title: "SEO Audit", description: "Run a free SEO audit on any website and get an AI-generated action plan." });
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialUrl = searchParams.get("url") || "";
  const projectId = searchParams.get("project") || null;

  const [url, setUrl] = useState(initialUrl);
  const [busy, setBusy] = useState(false);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(projectId || "");

  useEffect(() => {
    api.get("/projects").then(({ data }) => setProjects(data)).catch(() => {
      // Projects are optional — audit still works without them
    });
  }, []);

  const runAudit = async (e) => {
    e?.preventDefault();
    if (!url.trim()) return;
    setBusy(true);
    try {
      const { data } = await api.post("/audits", {
        url: url.trim(),
        project_id: selectedProject || null,
      });
      if (data?.result?.fetch_failed) {
        toast.error(data.result.error || "Could not fetch the URL");
        setBusy(false);
        return;
      }
      toast.success("Audit complete");
      navigate(`/app/audits/${data.id}`);
    } catch (e) {
      toast.error(formatApiError(e));
      setBusy(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto" data-testid="audit-root">
        <Eyebrow>SEO Audit</Eyebrow>
        <h1 className="mt-3 font-display font-bold text-4xl sm:text-5xl text-[#1A201A] tracking-tight">
          Drop a website. Get the truth.
        </h1>
        <p className="mt-3 text-[#5C685C] text-lg">
          We crawl your page, score every signal that matters, then ask Claude to write your action plan.
        </p>

        <form onSubmit={runAudit} className="mt-12 bg-white border border-[#E5E0D8] rounded-3xl p-8 shadow-sm">
          <label htmlFor="audit-url" className="label-eyebrow block mb-3">Website URL</label>
          <Input
            id="audit-url"
            data-testid="audit-url-input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="yourshop.com or https://yourshop.com"
            className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl py-7 text-lg focus:ring-2 focus:ring-[#81B29A]"
            required
          />

          {projects.length > 0 && (
            <div className="mt-5">
              <label className="label-eyebrow block mb-3">Save to project (optional)</label>
              <select
                data-testid="audit-project-select"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="w-full bg-[#FDFBF7] border border-[#E5E0D8] rounded-xl py-3 px-4 text-[#1A201A] focus:outline-none focus:ring-2 focus:ring-[#81B29A]"
              >
                <option value="">— No project (one-off) —</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          <Button
            type="submit"
            disabled={busy}
            data-testid="run-audit-btn"
            className="mt-8 w-full bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7] rounded-full py-7 text-base"
          >
            {busy ? (
              <span className="flex items-center gap-3"><Leaf className="loader-leaf" size={18}/> Crawling your site…</span>
            ) : (
              <span className="flex items-center gap-2"><Gauge size={18}/> Run audit</span>
            )}
          </Button>
          <p className="mt-5 text-xs text-[#5C685C] text-center">
            We check meta tags, headings, mobile-friendliness, performance, links, security, and content depth.
          </p>
        </form>
      </div>
    </AppLayout>
  );
}
