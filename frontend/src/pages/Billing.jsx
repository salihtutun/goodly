import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { formatApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/app/AppLayout";
import { Eyebrow } from "@/components/app/Common";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function Billing() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [billingMe, setBillingMe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyPlan, setBusyPlan] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [p, m] = await Promise.all([api.get("/billing/plans"), api.get("/billing/me")]);
        setPlans(p.data);
        setBillingMe(m.data);
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

  const currentPlan = billingMe?.plan?.id || user?.plan || "free";

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto" data-testid="billing-root">
        <Eyebrow>Billing & plans</Eyebrow>
        <h1 className="mt-3 font-display font-bold text-4xl sm:text-5xl text-[#1A201A] tracking-tight">
          Choose how you grow.
        </h1>
        <p className="mt-3 text-[#5C685C] text-lg">
          You&apos;re on the <strong className="text-[#2D3E32]">{billingMe?.plan?.name || "Free"}</strong> plan.
        </p>

        {/* Usage */}
        {billingMe && (
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            <UsageTile label="Audits this month"
              value={`${billingMe.usage.audits_this_month}${billingMe.plan.audit_limit ? ` / ${billingMe.plan.audit_limit}` : " (unlimited)"}`} />
            <UsageTile label="Saved projects"
              value={`${billingMe.usage.projects_count}${billingMe.plan.project_limit ? ` / ${billingMe.plan.project_limit}` : ""}`} />
            <UsageTile label="Current plan" value={billingMe.plan.name} accent />
          </div>
        )}

        {/* Plans grid */}
        <div className="mt-12 grid md:grid-cols-3 gap-6" data-testid="plans-grid">
          {loading ? <div className="text-[#5C685C]">Loading plans…</div> : plans.map((p) => {
            const isCurrent = p.id === currentPlan;
            const isPro = p.id === "pro";
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
