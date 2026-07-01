import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { formatApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/app/AppLayout";
import { Eyebrow } from "@/components/app/Common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, ArrowLeft, Check, Sparkles, Globe, Target, Flag } from "lucide-react";
import { toast } from "sonner";
import { usePageMeta } from "@/hooks/usePageMeta";

const STEPS = [
  { id: "url", title: "Your website", icon: Globe, description: "Paste your website URL — we'll run your first audit automatically." },
  { id: "industry", title: "Your industry", icon: Target, description: "Tell us what you do so we can tailor recommendations." },
  { id: "goals", title: "Your goals", icon: Flag, description: "What does success look like? More calls? More foot traffic? Online sales?" },
];

export default function OnboardingWizard() {
  usePageMeta({ title: "Get Started", description: "Set up your Goodly account in 2 minutes." });
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    url: "",
    industry: "",
    goals: "",
  });

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const currentStep = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
  };

  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  const finish = async () => {
    setBusy(true);
    try {
      // Create a project
      const { data: project } = await api.post("/projects", {
        name: form.url.replace(/https?:\/\//, "").replace(/\/$/, ""),
        url: form.url.startsWith("http") ? form.url : `https://${form.url}`,
      });

      // Run first audit
      await api.post("/audits", {
        url: project.url,
        project_id: project.id,
      });

      // Mark as onboarded
      await api.post("/auth/onboarded", { industry: form.industry, goals: form.goals });

      await refresh();
      toast.success("Your first audit is ready!");
      navigate("/app");
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto" data-testid="onboarding-wizard">
        <Eyebrow>Setup</Eyebrow>
        <h1 className="mt-3 font-display font-bold text-4xl sm:text-5xl text-[#1A201A] tracking-tight">
          Let's get you set up.
        </h1>
        <p className="mt-3 text-[#5C685C] text-lg">
          2 minutes. 3 questions. Your first audit is on us.
        </p>

        {/* Progress */}
        <div className="mt-10 flex gap-2">
          {STEPS.map((s, i) => (
            <div
              key={s.id}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-[#2D3E32]" : "bg-[#E5E0D8]"
              }`}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="mt-10 bg-white border border-[#E5E0D8] rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 rounded-xl bg-[#81B29A]/20 text-[#2D3E32] flex items-center justify-center">
              <currentStep.icon size={20} strokeWidth={1.75} />
            </div>
            <div>
              <div className="font-display font-bold text-xl text-[#1A201A]">{currentStep.title}</div>
              <div className="text-sm text-[#5C685C]">{currentStep.description}</div>
            </div>
          </div>

          {step === 0 && (
            <div className="space-y-2">
              <Label>Website URL *</Label>
              <Input
                required
                value={form.url}
                onChange={(e) => update("url", e.target.value)}
                placeholder="yourshop.com or https://yourshop.com"
                data-testid="onboard-url"
                className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl py-6 text-lg"
                autoFocus
              />
            </div>
          )}

          {step === 1 && (
            <div className="space-y-2">
              <Label>What does your business do? *</Label>
              <Input
                required
                value={form.industry}
                onChange={(e) => update("industry", e.target.value)}
                placeholder="Family-owned bakery, plumbing service, yoga studio..."
                data-testid="onboard-industry"
                className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl py-6 text-lg"
                autoFocus
              />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-2">
              <Label>What's your main goal? *</Label>
              <Textarea
                required
                rows={4}
                value={form.goals}
                onChange={(e) => update("goals", e.target.value)}
                placeholder="I want more phone calls from local customers... or I want to sell more products online... or I want people to find my studio on Google Maps..."
                data-testid="onboard-goals"
                className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl text-lg"
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          <Button
            onClick={prev}
            disabled={step === 0}
            variant="outline"
            className="rounded-full border-[#E5E0D8] text-[#5C685C]"
          >
            <ArrowLeft size={16} className="mr-2" /> Back
          </Button>

          {isLast ? (
            <Button
              onClick={finish}
              disabled={busy || !form.url || !form.industry || !form.goals}
              data-testid="onboard-finish"
              className="bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7] rounded-full px-8 py-6"
            >
              {busy ? (
                <span className="flex items-center gap-2"><Sparkles size={16} /> Running your first audit...</span>
              ) : (
                <span className="flex items-center gap-2"><Check size={16} /> Finish & see my audit</span>
              )}
            </Button>
          ) : (
            <Button
              onClick={next}
              disabled={(step === 0 && !form.url) || (step === 1 && !form.industry)}
              data-testid="onboard-next"
              className="bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7] rounded-full px-8 py-6"
            >
              Next <ArrowRight size={16} className="ml-2" />
            </Button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
