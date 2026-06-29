import { useEffect, useState, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import api, { formatApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/app/AppLayout";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Leaf, AlertCircle } from "lucide-react";
import { usePageMeta } from "@/hooks/usePageMeta";

const POLL_INTERVAL = 2000;
const MAX_POLLS = 20;

export default function BillingSuccess() {
  usePageMeta({ title: "Payment confirmed", description: "Your payment was successful." });
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { refresh } = useAuth();
  const sessionId = params.get("session_id");
  const [state, setState] = useState({ status: "checking", message: "Confirming your payment…" });
  const polledRef = useRef(0);

  useEffect(() => {
    if (!sessionId) {
      setState({ status: "error", message: "Missing session id." });
      return;
    }
    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;
      polledRef.current += 1;
      try {
        const { data } = await api.get(`/billing/status/${sessionId}`);
        if (data.payment_status === "paid") {
          await refresh();
          setState({
            status: "success",
            message: `Payment confirmed — you're now on the ${data.plan_id.toUpperCase()} plan.`,
            data,
          });
          return;
        }
        if (data.status === "expired") {
          setState({ status: "error", message: "This checkout session expired. Try again." });
          return;
        }
        if (polledRef.current >= MAX_POLLS) {
          setState({ status: "error", message: "Still processing. Check your email — we'll confirm shortly." });
          return;
        }
        setTimeout(poll, POLL_INTERVAL);
      } catch (e) {
        setState({ status: "error", message: formatApiError(e) });
      }
    };
    poll();
    return () => { cancelled = true; };
  }, [sessionId, refresh]);

  return (
    <AppLayout>
      <div className="max-w-xl mx-auto mt-12 bg-white border border-[#E5E0D8] rounded-3xl p-10 text-center" data-testid="billing-success-root">
        {state.status === "checking" && (
          <>
            <Leaf className="loader-leaf text-[#81B29A] mx-auto" size={48}/>
            <h1 className="mt-6 font-display font-bold text-2xl text-[#1A201A]">{state.message}</h1>
            <p className="mt-2 text-[#5C685C] text-sm">This usually takes a few seconds.</p>
          </>
        )}
        {state.status === "success" && (
          <>
            <div className="h-16 w-16 mx-auto rounded-full bg-[#81B29A]/20 flex items-center justify-center">
              <CheckCircle2 className="text-[#2D3E32]" size={32}/>
            </div>
            <h1 className="mt-6 font-display font-bold text-3xl text-[#1A201A]">All set!</h1>
            <p className="mt-2 text-[#5C685C]">{state.message}</p>
            <div className="mt-8 flex justify-center gap-3 flex-wrap">
              <Button onClick={() => navigate("/app/concierge/onboarding")} data-testid="go-brief-btn"
                className="bg-[#E07A5F] hover:bg-[#C86A51] text-[#FDFBF7] rounded-full px-6">
                Start your brief
              </Button>
              <Button onClick={() => navigate("/app")} data-testid="go-dashboard-btn"
                variant="outline"
                className="bg-transparent border-[#2D3E32] text-[#2D3E32] hover:bg-[#F3F0E9] rounded-full px-6">
                Go to dashboard
              </Button>
            </div>
          </>
        )}
        {state.status === "error" && (
          <>
            <div className="h-16 w-16 mx-auto rounded-full bg-[#E07A5F]/20 flex items-center justify-center">
              <AlertCircle className="text-[#E07A5F]" size={32}/>
            </div>
            <h1 className="mt-6 font-display font-bold text-2xl text-[#1A201A]">Hmm</h1>
            <p className="mt-2 text-[#5C685C]">{state.message}</p>
            <Button onClick={() => navigate("/app/billing")}
              data-testid="back-to-billing-btn"
              className="mt-8 bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7] rounded-full px-6">
              Back to billing
            </Button>
          </>
        )}
      </div>
    </AppLayout>
  );
}
