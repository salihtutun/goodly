import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Gauge, FolderKanban, Sparkles, BarChart3, ArrowRight, ArrowLeft } from "lucide-react";

const STEPS = [
  {
    icon: Gauge,
    eyebrow: "Step 1 of 4",
    title: "Run your first audit",
    body: "Paste any website URL and we'll score 8 SEO signals in seconds. No setup needed.",
    cta: "Next",
  },
  {
    icon: FolderKanban,
    eyebrow: "Step 2 of 4",
    title: "Save it as a project",
    body: "Track scores over time. See your line go up as you fix issues.",
    cta: "Next",
  },
  {
    icon: Sparkles,
    eyebrow: "Step 3 of 4",
    title: "Use AI Studio",
    body: "Claude writes meta tags, finds keywords, and analyses competitors — in your voice, not robot-speak.",
    cta: "Next",
  },
  {
    icon: BarChart3,
    eyebrow: "Step 4 of 4",
    title: "Ready to grow",
    body: "You're on the Free plan with 3 audits/month. Upgrade anytime for unlimited audits, PDF reports, and SERP tracking.",
    cta: "Take me to my audit",
  },
];

export default function OnboardingTour() {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (user && user.onboarded === false) {
      const timer = setTimeout(() => setOpen(true), 600);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const finish = async () => {
    setOpen(false);
    try { await api.post("/auth/onboarded"); await refresh(); } catch { /* ignore */ }
    navigate("/app/audit");
  };

  const skip = async () => {
    setOpen(false);
    try { await api.post("/auth/onboarded"); await refresh(); } catch { /* ignore */ }
  };

  const next = () => {
    if (step === STEPS.length - 1) {
      finish();
    } else {
      setStep((s) => s + 1);
    }
  };

  const s = STEPS[step];
  const Icon = s.icon;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) skip(); }}>
      <DialogContent className="bg-[#FDFBF7] border-[#E5E0D8] rounded-3xl max-w-lg p-0 overflow-hidden" data-testid="onboarding-dialog">
        <DialogTitle className="sr-only">Onboarding — {s.title}</DialogTitle>
        <div className="p-8">
          <div className="flex items-center justify-between">
            <div className="label-eyebrow">{s.eyebrow}</div>
            <button onClick={skip} className="text-xs text-[#5C685C] hover:text-[#1A201A]" data-testid="onboarding-skip">
              Skip tour
            </button>
          </div>
          <div className="mt-6 h-14 w-14 rounded-2xl bg-[#81B29A]/20 flex items-center justify-center">
            <Icon className="text-[#2D3E32]" size={26} strokeWidth={1.75}/>
          </div>
          <h2 className="mt-5 font-display font-bold text-3xl text-[#1A201A] tracking-tight">{s.title}</h2>
          <p className="mt-3 text-[#5C685C] leading-relaxed">{s.body}</p>

          <div className="mt-8 flex items-center justify-between">
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <div key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === step ? "w-8 bg-[#2D3E32]" : "w-1.5 bg-[#E5E0D8]"
                  }`}/>
              ))}
            </div>
            <div className="flex gap-2">
              {step > 0 && (
                <Button variant="outline" onClick={() => setStep((s) => s - 1)} data-testid="onboarding-prev"
                  className="bg-transparent border-[#E5E0D8] text-[#1A201A] hover:bg-[#F3F0E9] rounded-full">
                  <ArrowLeft size={16}/>
                </Button>
              )}
              <Button onClick={next} data-testid="onboarding-next"
                className="bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7] rounded-full px-5">
                {s.cta} <ArrowRight className="ml-1.5" size={16}/>
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
