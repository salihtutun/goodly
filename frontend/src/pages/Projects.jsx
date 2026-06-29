import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { formatApiError } from "@/lib/api";
import AppLayout from "@/components/app/AppLayout";
import { Eyebrow, ScoreRing } from "@/components/app/Common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function Projects() {
  usePageMeta({ title: "Projects", description: "Manage your tracked websites and their SEO performance." });
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openCreate, setOpenCreate] = useState(false);
  const [form, setForm] = useState({ name: "", url: "", description: "", target_keywords: "" });
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/projects");
      setProjects(data);
    } catch (e) {
      toast.error(formatApiError(e));
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data } = await api.post("/projects", form);
      toast.success("Project saved");
      setOpenCreate(false);
      setForm({ name: "", url: "", description: "", target_keywords: "" });
      setProjects((p) => [data, ...p]);
    } catch (err) {
      toast.error(formatApiError(err));
    } finally { setBusy(false); }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this project and all its audits?")) return;
    try {
      await api.delete(`/projects/${id}`);
      setProjects((p) => p.filter((x) => x.id !== id));
      toast.success("Project deleted");
    } catch (e) { toast.error(formatApiError(e)); }
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto" data-testid="projects-root">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <Eyebrow>Saved websites</Eyebrow>
            <h1 className="mt-3 font-display font-bold text-4xl sm:text-5xl text-[#1A201A] tracking-tight">Projects</h1>
            <p className="mt-3 text-[#5C685C]">Save the sites you care about so we can track them over time.</p>
          </div>

          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild>
              <Button data-testid="new-project-btn"
                onClick={() => setOpenCreate(true)}
                className="bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7] rounded-full px-6">
                <Plus className="mr-1.5" size={18}/> New project
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#FDFBF7] border-[#E5E0D8] rounded-2xl">
              <DialogHeader>
                <DialogTitle className="font-display text-2xl text-[#1A201A]">Add a website</DialogTitle>
              </DialogHeader>
              <form onSubmit={submit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Project name *</Label>
                  <Input required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})}
                    data-testid="project-name-input" className="bg-white border-[#E5E0D8] rounded-xl"/>
                </div>
                <div className="space-y-2">
                  <Label>Website URL *</Label>
                  <Input required value={form.url} onChange={(e) => setForm({...form, url: e.target.value})}
                    data-testid="project-url-input" placeholder="https://yourshop.com"
                    className="bg-white border-[#E5E0D8] rounded-xl"/>
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea value={form.description} onChange={(e) => setForm({...form, description: e.target.value})}
                    data-testid="project-desc-input" rows={2}
                    className="bg-white border-[#E5E0D8] rounded-xl"/>
                </div>
                <div className="space-y-2">
                  <Label>Target keywords (comma-separated)</Label>
                  <Input value={form.target_keywords} onChange={(e) => setForm({...form, target_keywords: e.target.value})}
                    data-testid="project-keywords-input"
                    className="bg-white border-[#E5E0D8] rounded-xl"/>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={busy} data-testid="project-create-submit"
                    className="bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7] rounded-full">
                    {busy ? "Saving..." : "Save project"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mt-10 grid md:grid-cols-2 gap-5">
          {loading ? (
            <div className="text-[#5C685C]">Loading…</div>
          ) : !projects.length ? (
            <div className="md:col-span-2 bg-white border border-dashed border-[#E5E0D8] rounded-2xl p-10 text-center">
              <div className="font-display font-bold text-xl text-[#1A201A]">No projects yet</div>
              <div className="mt-2 text-[#5C685C]">Save your first website to start tracking.</div>
              <Button onClick={() => setOpenCreate(true)} data-testid="empty-new-project"
                className="mt-6 bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7] rounded-full">
                <Plus className="mr-1.5" size={18}/> Add a website
              </Button>
            </div>
          ) : (
            projects.map((p) => (
              <div key={p.id}
                className="bg-white border border-[#E5E0D8] rounded-2xl p-6 hover:-translate-y-0.5 hover:shadow-md transition-all"
                data-testid={`project-row-${p.id}`}>
                <div className="flex gap-4">
                  <ScoreRing score={p.last_score ?? 0} size={72} />
                  <div className="flex-1 min-w-0">
                    <Link to={`/app/projects/${p.id}`}>
                      <div className="font-display font-bold text-lg text-[#1A201A] truncate">{p.name}</div>
                    </Link>
                    <a href={p.url} target="_blank" rel="noreferrer" className="text-sm text-[#5C685C] hover:text-[#E07A5F] truncate block">
                      {p.url}
                    </a>
                    <div className="text-xs text-[#5C685C] mt-2">
                      {p.last_audit_at ? `Last audit ${new Date(p.last_audit_at).toLocaleDateString()}` : "Not audited yet"}
                    </div>
                  </div>
                </div>
                <div className="mt-5 flex gap-2">
                  <Button size="sm" onClick={() => navigate(`/app/audit?project=${p.id}&url=${encodeURIComponent(p.url)}`)}
                    data-testid={`audit-project-${p.id}`}
                    className="bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7] rounded-full">
                    Run audit
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => navigate(`/app/projects/${p.id}`)}
                    data-testid={`open-project-${p.id}`}
                    className="bg-transparent border-[#E5E0D8] text-[#1A201A] hover:bg-[#F3F0E9] rounded-full">
                    Open
                  </Button>
                  <button onClick={() => remove(p.id)} data-testid={`delete-project-${p.id}`}
                    className="ml-auto text-[#5C685C] hover:text-[#E07A5F]">
                    <Trash2 size={16}/>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
