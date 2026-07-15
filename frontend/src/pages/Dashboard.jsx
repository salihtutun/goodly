import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { formatApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/app/AppLayout";
import { Eyebrow, ScoreRing } from "@/components/app/Common";
import { Button } from "@/components/ui/button";
import { ArrowRight, CreditCard, FolderKanban, Gauge, Mail, Sparkles, TrendingUp, TrendingDown, Minus } from "lucide-react";
import VisibilityTile from "@/components/app/VisibilityTile";
import { usePageMeta } from "@/hooks/usePageMeta";
import { toast } from "sonner";
export default function Dashboard() {
  usePageMeta({ title: "Dashboard", description: "Your visibility command center — track SEO, social, and AI presence all in one place." });
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [projects, setProjects] = useState([]);
  const [brief, setBrief] = useState(null);
  const [briefLoaded, setBriefLoaded] = useState(false);
  const [achievements, setAchievements] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const [s, p] = await Promise.all([api.get("/dashboard/summary"), api.get("/projects")]);
        setSummary(s.data);
        setProjects(p.data);
        // Fetch achievements
        try {
          const a = await api.get("/dashboard/achievements");
          setAchievements(a.data);
        } catch { /* achievements may not be available */ }
      } catch (e) {
        if (process.env.NODE_ENV === "development") console.error(formatApiError(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (user?.plan !== "concierge") return;
    (async () => {
      try {
        const { data } = await api.get("/concierge/brief");
        setBrief(data);
      } catch { /* ignore */ }
      finally { setBriefLoaded(true); }
    })();
  }, [user?.plan]);

  const resendVerification = async () => {
    try {
      await api.post("/auth/resend-verification");
      toast.success("Verification email resent — check your inbox");
    } catch (e) {
      toast.error("Could not resend. Try again later.");
    }
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto" data-testid="dashboard-root">
        <Eyebrow>Your garden</Eyebrow>
        <h1 className="mt-3 font-display font-bold text-4xl sm:text-5xl text-[#1A201A] tracking-tight">
          Hello, {user?.name?.split(" ")[0] || "friend"}.
        </h1>
        <p className="mt-3 text-[#5C685C] text-lg">Here&apos;s how your projects are growing.</p>

        {/* Free trial banner — show upgrade prompt for free users */}
        {user?.plan === "free" && (
          <div className="mt-6 bg-gradient-to-r from-[#81B29A]/10 to-[#2D3E32]/10 border border-[#81B29A]/30 rounded-2xl p-5 flex items-start gap-4" data-testid="free-trial-banner">
            <div className="h-10 w-10 rounded-xl bg-[#81B29A]/20 text-[#2D3E32] flex items-center justify-center shrink-0">
              <Sparkles size={20} strokeWidth={1.75}/>
            </div>
            <div className="flex-1">
              <div className="font-display font-bold text-[#1A201A]">You're on the free plan</div>
              <div className="text-sm text-[#5C685C] mt-1">
                Upgrade to Starter for $49/mo and get 10 audits, SERP tracking, PDF reports, and weekly automated re-audits. 7-day free trial.
              </div>
            </div>
            <Button onClick={() => navigate("/app/billing")}
              data-testid="upgrade-from-banner-btn"
              className="bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7] rounded-full px-5 shrink-0">
              See plans
            </Button>
          </div>
        )}

        {user?.plan === "concierge" && briefLoaded && !brief && (
          <div className="mt-8 bg-[#E07A5F]/10 border border-[#E07A5F]/40 rounded-2xl p-5 flex items-start gap-4" data-testid="concierge-brief-banner">
            <div className="h-10 w-10 rounded-xl bg-[#E07A5F]/20 text-[#E07A5F] flex items-center justify-center shrink-0">
              <Sparkles size={20} strokeWidth={1.75}/>
            </div>
            <div className="flex-1">
              <div className="font-display font-bold text-[#1A201A]">Tell us about your business</div>
              <div className="text-sm text-[#5C685C] mt-1">
                Your specialist needs your target keywords, competitors and goals to start work. Takes 5 minutes.
              </div>
            </div>
            <Button onClick={() => navigate("/app/concierge/onboarding")}
              data-testid="open-concierge-brief-btn"
              className="bg-[#E07A5F] hover:bg-[#C86A51] text-[#FDFBF7] rounded-full px-5 shrink-0">
              Start brief
            </Button>
          </div>
        )}

        {user && !user.email_verified && (
          <div className="mt-8 bg-[#E6A57E]/10 border border-[#E6A57E]/40 rounded-2xl p-5 flex items-start gap-4" data-testid="verify-email-banner">
            <Mail size={20} className="text-[#E6A57E] mt-0.5" />
            <div className="flex-1">
              <div className="font-medium text-[#1A201A]">Verify your email</div>
              <div className="text-sm text-[#5C685C] mt-1">Check your inbox for the verification link. Need it resent?</div>
            </div>
            <button onClick={resendVerification} className="text-sm text-[#2D3E32] font-medium hover:underline">Resend</button>
          </div>
        )}

        {/* Stat tiles */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
          <StatTile
            testId="stat-projects"
            label="Projects tracked"
            value={loading ? "—" : summary?.projects_count ?? 0}
            icon={FolderKanban}
            accent="#81B29A"
          />
          <StatTile
            testId="stat-audits"
            label="Audits this account"
            value={loading ? "—" : summary?.audits_count ?? 0}
            icon={Gauge}
            accent="#E07A5F"
          />
          <StatTile
            testId="stat-avg-score"
            label="Avg. SEO health"
            value={loading ? "—" : summary?.average_score ?? "—"}
            icon={TrendingUp}
            accent="#2D3E32"
          />
        </div>

        {/* Score History Trend */}
        {summary?.score_history && summary.score_history.length >= 2 && (
          <div className="mt-8 bg-white border border-[#E5E0D8] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <Eyebrow>Score trend</Eyebrow>
                <h2 className="mt-1 font-display font-bold text-xl text-[#1A201A]">Your progress over time</h2>
              </div>
              <ScoreTrendBadge history={summary.score_history} />
            </div>
            <div className="flex items-end gap-2 h-32">
              {summary.score_history.slice(-12).map((point, i) => {
                const maxScore = 100;
                const heightPct = Math.max(8, (point.score / maxScore) * 100);
                const isLatest = i === summary.score_history.slice(-12).length - 1;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                    <span className={`text-xs font-display font-bold ${isLatest ? "text-[#2D3E32]" : "text-[#9CA89C]"}`}>
                      {point.score}
                    </span>
                    <div className="w-full flex-1 flex items-end">
                      <div
                        className={`w-full rounded-t-md transition-all duration-500 ${
                          isLatest ? "bg-[#2D3E32]" : "bg-[#81B29A]/40"
                        }`}
                        style={{ height: `${heightPct}%`, minHeight: 4 }}
                        title={`${point.date}: ${point.score}/100`}
                      />
                    </div>
                    <span className="text-[9px] text-[#9CA89C] truncate w-full text-center">
                      {new Date(point.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Unified Visibility Score */}
        <div className="mt-8">
          <VisibilityTile/>
        </div>

        {/* Achievements */}
        {achievements && achievements.total_earned > 0 && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <Eyebrow>Achievements</Eyebrow>
                <h2 className="mt-1 font-display font-bold text-xl text-[#1A201A]">
                  {achievements.total_earned} of {achievements.total_available} earned
                </h2>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {achievements.earned.map((a) => (
                <div key={a.id} className="bg-white border border-[#81B29A]/30 rounded-xl p-3 text-center hover:-translate-y-0.5 transition-all">
                  <div className="text-2xl mb-1">{a.icon}</div>
                  <div className="text-xs font-medium text-[#1A201A]">{a.name}</div>
                  <div className="text-[10px] text-[#5C685C] mt-0.5">{a.description}</div>
                </div>
              ))}
              {achievements.locked.slice(0, 6 - achievements.earned.length).map((a) => (
                <div key={a.id} className="bg-[#F3F0E9]/50 border border-[#E5E0D8] rounded-xl p-3 text-center opacity-50">
                  <div className="text-2xl mb-1 grayscale">{a.icon}</div>
                  <div className="text-xs font-medium text-[#9CA89C]">{a.name}</div>
                  <div className="text-[10px] text-[#9CA89C] mt-0.5">Locked</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick actions */}
        <div className="mt-10 grid md:grid-cols-4 gap-5">
          <QuickAction onClick={() => navigate("/app/audit")} testId="qa-audit"
            title="Run a website audit" body="Paste any URL. Get a score in seconds." icon={Gauge}/>
          <QuickAction onClick={() => navigate("/app/social")} testId="qa-social"
            title="Audit your social reach" body="Instagram, TikTok, YouTube — score + AI improvements." icon={Sparkles}/>
          <QuickAction onClick={() => navigate("/app/ai-tools")} testId="qa-ai"
            title="Open AI Studio" body="Generate meta tags, keywords, competitor reports." icon={Sparkles}/>
          <QuickAction onClick={() => navigate("/app/billing")} testId="qa-billing"
            title="Manage billing" body="Upgrade plan, view invoices, manage subscription." icon={CreditCard}/>
        </div>

        {/* Recent audits */}
        <div className="mt-14">
          <div className="flex items-center justify-between mb-5">
            <div>
              <Eyebrow>Recent audits</Eyebrow>
              <h2 className="mt-2 font-display font-bold text-2xl text-[#1A201A]">Latest checkups</h2>
            </div>
            <Link to="/app/audit" className="text-sm text-[#2D3E32] hover:text-[#4A5F4F] flex items-center gap-1" data-testid="see-all-audits-link">
              Run new <ArrowRight size={14}/>
            </Link>
          </div>

          {loading ? (
            <div className="grid gap-3">
              {[1,2,3].map(i => (
                <div key={i} className="bg-white border border-[#E5E0D8] rounded-2xl px-5 py-4 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-[#F3F0E9]" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-[#F3F0E9] rounded w-2/3" />
                      <div className="h-3 bg-[#F3F0E9] rounded w-1/3" />
                    </div>
                    <div className="h-8 w-16 bg-[#F3F0E9] rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : !summary?.recent_audits?.length ? (
            <EmptyState
              title="No audits yet"
              body="Run your first audit — it takes about 10 seconds."
              cta="Run my first audit"
              onClick={() => navigate("/app/audit")}
            />
          ) : (
            <div className="grid gap-3">
              {summary.recent_audits.map((a) => (
                <Link
                  key={a.id} to={`/app/audits/${a.id}`}
                  className="bg-white border border-[#E5E0D8] rounded-2xl px-5 py-4 flex items-center gap-4 hover:-translate-y-0.5 hover:shadow-md transition-all"
                  data-testid={`recent-audit-${a.id}`}
                >
                  <ScoreRing score={a.overall_score ?? 0} size={56} />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[#1A201A] truncate">{a.url}</div>
                    <div className="text-xs text-[#5C685C] mt-1">{new Date(a.created_at).toLocaleString()}</div>
                  </div>
                  <ArrowRight className="text-[#5C685C]" size={18}/>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Projects preview */}
        <div className="mt-14">
          <div className="flex items-center justify-between mb-5">
            <div>
              <Eyebrow>Your projects</Eyebrow>
              <h2 className="mt-2 font-display font-bold text-2xl text-[#1A201A]">Saved websites</h2>
            </div>
            <Link to="/app/projects" className="text-sm text-[#2D3E32] hover:text-[#4A5F4F] flex items-center gap-1" data-testid="manage-projects-link">
              Manage <ArrowRight size={14}/>
            </Link>
          </div>

          {!projects.length ? (
            <EmptyState
              title="No projects yet"
              body="Save a website to track its SEO score over time."
              cta="Add my first project"
              onClick={() => navigate("/app/projects")}
            />
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {projects.slice(0, 4).map((p) => (
                <Link
                  key={p.id} to={`/app/projects/${p.id}`}
                  className="bg-white border border-[#E5E0D8] rounded-2xl p-5 hover:-translate-y-0.5 hover:shadow-md transition-all flex gap-4"
                  data-testid={`project-card-${p.id}`}
                >
                  <ScoreRing score={p.last_score ?? 0} size={64} />
                  <div className="min-w-0">
                    <div className="font-display font-bold text-lg text-[#1A201A] truncate">{p.name}</div>
                    <div className="text-sm text-[#5C685C] truncate">{p.url}</div>
                    <div className="text-xs text-[#5C685C] mt-2">
                      {p.last_audit_at ? `Last audit ${new Date(p.last_audit_at).toLocaleDateString()}` : "No audits yet"}
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

function StatTile({ label, value, icon: Icon, accent, testId }) {
  return (
    <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6" data-testid={testId}>
      <div className="flex items-start justify-between">
        <div className="text-xs label-eyebrow">{label}</div>
        <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${accent}22`, color: accent }}>
          <Icon size={18} strokeWidth={1.75}/>
        </div>
      </div>
      <div className="mt-6 font-display font-bold text-4xl text-[#1A201A]">{value}</div>
    </div>
  );
}

function QuickAction({ onClick, title, body, icon: Icon, testId }) {
  return (
    <button onClick={onClick} data-testid={testId}
      className="text-left bg-[#F3F0E9] hover:bg-[#E5E0D8] border border-[#E5E0D8] rounded-2xl p-6 transition-all duration-300 hover:-translate-y-0.5">
      <Icon className="text-[#2D3E32]" size={22} strokeWidth={1.75}/>
      <div className="mt-4 font-display font-bold text-lg text-[#1A201A]">{title}</div>
      <div className="text-sm text-[#5C685C] mt-1">{body}</div>
    </button>
  );
}

function EmptyState({ title, body, cta, onClick }) {
  return (
    <div className="bg-white border border-dashed border-[#E5E0D8] rounded-2xl p-10 text-center" data-testid="empty-state">
      <div className="font-display font-bold text-xl text-[#1A201A]">{title}</div>
      <div className="mt-2 text-[#5C685C]">{body}</div>
      <Button onClick={onClick} data-testid="empty-state-cta" className="mt-6 bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7] rounded-full px-6">
        {cta}
      </Button>
    </div>
  );
}

function ScoreTrendBadge({ history }) {
  if (!history || history.length < 2) return null;
  const first = history[0].score;
  const last = history[history.length - 1].score;
  const delta = last - first;
  if (delta === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-[#F3F0E9] text-[#5C685C]">
        <Minus size={12} /> No change
      </span>
    );
  }
  const isUp = delta > 0;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${
      isUp ? "bg-[#81B29A]/15 text-[#2D3E32]" : "bg-[#E07A5F]/15 text-[#E07A5F]"
    }`}>
      {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
      {isUp ? "+" : ""}{delta} points
    </span>
  );
}
