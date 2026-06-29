import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { formatApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/app/AppLayout";
import { Eyebrow } from "@/components/app/Common";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, ExternalLink, Settings, Mail } from "lucide-react";
import { toast } from "sonner";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function Billing() {
  usePageMeta({ title: "Billing", description: "Manage your Goodly plan and billing settings." });
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [billingMe, setBillingMe] = useState(null);
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyPlan, setBusyPlan] = useState(null);
  const [portalBusy, setPortalBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [p, m, r] = await Promise.all([
          api.get("/billing/plans"),
          api.get("/billing/me"),
          api.get("/scheduler/runs").catch(() => ({ data: [] })),
        ]);
        setPlans(p.data);
        setBillingMe(m.data);
        setRuns(r.data || []);
      } catch (e) {
        toast.error(formatApiError(e));
      } finally { setLoading(false); }
    })();
  }, [user?.plan]);

  const upgrade = async (planId) => {
    setBusyPlan(planId);
    try {
      const { data } = await api.post("/billing/checkout", {
        plan_id: planId,
        origin_url: window.location.origin,
      });
      window.location.href = data.url;
    } catch (e) {
      toast.error(formatApiError(e));
      setBusyPlan(null);
    }
  };

  const openPortal = async () => {
    setPortalBusy(true);
    try {
      const { data } = await api.post("/billing/portal", {
        return_url: `${window.location.origin}/app/billing`,
      });
      window.location.href = data.url;
    } catch (e) {
      toast.error(formatApiError(e));
      setPortalBusy(false);
    }
  };

  const currentPlan = billingMe?.plan?.id || user?.plan || "free";

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto" data-testid="billing-root">
        <Eyebrow>Billing & plans</Eyebrow>
        <div className="mt-3 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="font-display font-bold text-4xl sm:text-5xl text-[#1A201A] tracking-tight">
              Choose how you grow.
            </h1>
            <p className="mt-3 text-[#5C685C] text-lg">
              You&apos;re on the <strong className="text-[#2D3E32]">{billingMe?.plan?.name || "Free"}</strong> plan.
            </p>
          </div>
          {currentPlan !== "free" && (
            <Button onClick={openPortal} disabled={portalBusy}
              data-testid="manage-subscription-btn"
              variant="outline"
              className="bg-transparent border-[#2D3E32] text-[#2D3E32] hover:bg-[#F3F0E9] rounded-full">
              <Settings size={16} className="mr-1.5"/>
              {portalBusy ? "Opening…" : "Manage subscription"}
              <ExternalLink size={13} className="ml-1.5"/>
            </Button>
          )}
        </div>

        {/* Usage */}
        {billingMe && (
          <div className="mt-8 grid md:grid-cols-2 gap-4">
            <UsageTile label="Audits this month"
              value={`${billingMe.usage.audits_this_month}${billingMe.plan.audit_limit ? ` / ${billingMe.plan.audit_limit}` : " (unlimited)"}`} />
            <UsageTile label="Saved projects"
              value={`${billingMe.usage.projects_count}${billingMe.plan.project_limit ? ` / ${billingMe.plan.project_limit}` : ""}`} />
            <UsageTile label="Current plan" value={billingMe.plan.name} accent />
          </div>
        )}

        {/* Plans grid */}
        <div className="mt-12 grid md:grid-cols-2 gap-6" data-testid="plans-grid">
          {loading ? <div className="text-[#5C685C]">Loading plans…</div> : plans.map((p) => {
            const isCurrent = p.id === currentPlan;
            const isPro = p.id === "concierge";
            return (
              <div key={p.id}
                className={`relative rounded-3xl p-7 border transition-all duration-300 ${
                  isPro ? "bg-[#2D3E32] border-[#2D3E32] text-[#FDFBF7]" : "bg-white border-[#E5E0D8] text-[#1A201A]"
                }`}
                data-testid={`plan-card-${p.id}`}>
                {isPro && (
                  <div className="absolute -top-3 left-7 bg-[#E07A5F] text-[#FDFBF7] text-xs font-medium tracking-wider uppercase px-3 py-1 rounded-full">
                    Most popular
                  </div>
                )}
                <div className="label-eyebrow" style={isPro ? { color: "#FDFBF7AA" } : {}}>{p.name}</div>
                <div className="mt-4 font-display">
                  <span className="text-5xl font-bold">${Math.round(p.price_usd)}</span>
                  {p.price_usd > 0 && <span className={`text-sm ml-1 ${isPro ? "text-[#FDFBF7]/70" : "text-[#5C685C]"}`}>/ month</span>}
                </div>
                <ul className="mt-6 space-y-2.5">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check size={16} className={isPro ? "text-[#81B29A]" : "text-[#81B29A]"} />
                      <span className={isPro ? "text-[#FDFBF7]/95" : "text-[#1A201A]"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  {isCurrent ? (
                    <Badge className={`rounded-full px-4 py-2 ${isPro ? "bg-[#FDFBF7]/15 text-[#FDFBF7] hover:bg-[#FDFBF7]/15" : "bg-[#F3F0E9] text-[#1A201A] hover:bg-[#F3F0E9]"} border-0`}
                      data-testid={`current-${p.id}`}>
                      Current plan
                    </Badge>
                  ) : p.id === "free" ? (
                    <Button variant="outline"
                      onClick={() => navigate("/app")}
                      data-testid={`select-${p.id}`}
                      className={`rounded-full ${isPro ? "border-[#FDFBF7] text-[#FDFBF7] hover:bg-[#FDFBF7]/10 bg-transparent" : "border-[#2D3E32] text-[#2D3E32] hover:bg-[#F3F0E9] bg-transparent"}`}>
                      Continue free
                    </Button>
                  ) : (
                    <Button
                      onClick={() => upgrade(p.id)}
                      disabled={busyPlan === p.id}
                      data-testid={`upgrade-${p.id}-btn`}
                      className={`rounded-full px-6 ${
                        isPro ? "bg-[#E07A5F] hover:bg-[#C86A51] text-[#FDFBF7]"
                              : "bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7]"
                      }`}>
                      <Sparkles size={16} className="mr-2"/>
                      {busyPlan === p.id ? "Redirecting…" : `Upgrade to ${p.name}`}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Scheduled runs */}
        {runs.length > 0 && (
          <div className="mt-14" data-testid="scheduled-runs-section">
            <Eyebrow>Scheduled audits</Eyebrow>
            <h2 className="mt-2 font-display font-bold text-2xl text-[#1A201A]">Recent automated runs</h2>
            <div className="mt-5 space-y-2">
              {runs.slice(0, 10).map((r) => (
                <div key={r.id} className="bg-white border border-[#E5E0D8] rounded-2xl px-5 py-4 flex items-center gap-4" data-testid={`run-${r.id}`}>
                  <div className="h-10 w-10 rounded-full bg-[#81B29A]/20 flex items-center justify-center font-display font-bold text-[#2D3E32]">
                    {r.score ?? "—"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-[#1A201A] text-sm">{new Date(r.run_at).toLocaleString()}</div>
                    <div className="text-xs text-[#5C685C] mt-0.5 flex items-center gap-2">
                      <Mail size={12}/>
                      {r.email?.sent ? "Email sent" :
                        r.email?.mocked ? "Email mocked (RESEND_API_KEY not set)" :
                        r.email?.error ? `Email error: ${r.email.error.slice(0, 60)}` : "No email"}
                    </div>
                  </div>
                  {r.audit_id && (
                    <Button size="sm" variant="outline" onClick={() => navigate(`/app/audits/${r.audit_id}`)}
                      className="bg-transparent border-[#E5E0D8] text-[#1A201A] hover:bg-[#F3F0E9] rounded-full">
                      View
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transaction history */}
        {billingMe?.transactions?.length > 0 && (
          <div className="mt-14">
            <Eyebrow>Recent transactions</Eyebrow>
            <h2 className="mt-2 font-display font-bold text-2xl text-[#1A201A]">Payment history</h2>
            <div className="mt-5 bg-white border border-[#E5E0D8] rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-[#F3F0E9] text-[#5C685C]">
                  <tr>
                    <th className="text-left p-4">Date</th>
                    <th className="text-left p-4">Plan</th>
                    <th className="text-left p-4">Amount</th>
                    <th className="text-left p-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {billingMe.transactions.map((t) => (
                    <tr key={t.id} className="border-t border-[#E5E0D8]" data-testid={`tx-${t.id}`}>
                      <td className="p-4 text-[#1A201A]">{new Date(t.created_at).toLocaleDateString()}</td>
                      <td className="p-4 capitalize text-[#1A201A]">{t.plan_id}</td>
                      <td className="p-4 text-[#1A201A]">${t.amount} {t.currency?.toUpperCase()}</td>
                      <td className="p-4">
                        <Badge className={
                          t.payment_status === "paid"
                            ? "bg-[#81B29A]/20 text-[#2D3E32] hover:bg-[#81B29A]/20"
                            : "bg-[#E5E0D8] text-[#5C685C] hover:bg-[#E5E0D8]"
                        }>{t.payment_status}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function UsageTile({ label, value, accent }) {
  return (
    <div className={`rounded-2xl p-5 border ${accent ? "bg-[#F3F0E9] border-[#E5E0D8]" : "bg-white border-[#E5E0D8]"}`}>
      <div className="label-eyebrow">{label}</div>
      <div className="mt-3 font-display font-bold text-2xl text-[#1A201A]">{value}</div>
    </div>
  );
}
