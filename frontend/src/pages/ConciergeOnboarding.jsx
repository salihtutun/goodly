import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { formatApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/app/AppLayout";
import { Eyebrow } from "@/components/app/Common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, X, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";

const EMPTY = {
  business_name: "",
  website: "",
  industry: "",
  location: "",
  target_keywords: [],
  competitors: [],
  primary_goal: "",
  target_customer: "",
  brand_voice: "",
  monthly_traffic_goal: "",
  blockers: "",
  contact_phone: "",
  preferred_meeting_time: "",
};

export default function ConciergeOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [kwInput, setKwInput] = useState("");
  const [compInput, setCompInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);

  const isConcierge = user?.plan === "concierge";

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/concierge/brief");
        if (data) {
          setForm({ ...EMPTY, ...data });
          setSubmitted(true);
        }
      } catch (e) {
        // ignore
      } finally { setLoading(false); }
    })();
  }, []);

  const addKw = () => {
    const v = kwInput.trim();
    if (!v) return;
    setForm({ ...form, target_keywords: [...form.target_keywords, v] });
    setKwInput("");
  };

  const addComp = () => {
    const v = compInput.trim();
    if (!v) return;
    setForm({ ...form, competitors: [...form.competitors, v] });
    setCompInput("");
  };

  const removeAt = (key, idx) => {
    setForm({ ...form, [key]: form[key].filter((_, i) => i !== idx) });
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.business_name || !form.website || !form.primary_goal) {
      toast.error("Business name, website, and primary goal are required.");
      return;
    }
    setBusy(true);
    try {
      await api.post("/concierge/brief", form);
      setSubmitted(true);
      toast.success("Brief received — your specialist will reach out within 1 business day.");
    } catch (e) {
      toast.error(formatApiError(e));
    } finally { setBusy(false); }
  };

  if (!isConcierge && !loading) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto mt-12 bg-white border border-[#E5E0D8] rounded-3xl p-10 text-center" data-testid="concierge-locked">
          <Sparkles className="text-[#E07A5F] mx-auto" size={36}/>
          <h1 className="mt-4 font-display font-bold text-3xl text-[#1A201A]">Concierge clients only</h1>
          <p className="mt-3 text-[#5C685C]">
            This onboarding form is for Concierge ($1,000/mo) customers. Upgrade to unlock it and we&apos;ll get
            your specialist working in 1 business day.
          </p>
          <Button onClick={() => navigate("/app/billing")}
            data-testid="concierge-upgrade-btn"
            className="mt-8 bg-[#E07A5F] hover:bg-[#C86A51] text-[#FDFBF7] rounded-full px-6">
            Upgrade to Concierge <ArrowRight size={16} className="ml-1.5"/>
          </Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto" data-testid="concierge-onboarding-root">
        <Eyebrow>Concierge onboarding</Eyebrow>
        <h1 className="mt-3 font-display font-bold text-4xl sm:text-5xl text-[#1A201A] tracking-tight">
          Tell us about your business.
        </h1>
        <p className="mt-3 text-[#5C685C] text-lg">
          The more honest you are, the faster we can rank you. Your specialist reads every word.
        </p>

        {submitted && (
          <div className="mt-8 bg-[#81B29A]/15 border border-[#81B29A]/40 rounded-2xl p-5 flex items-start gap-3" data-testid="brief-submitted-banner">
            <CheckCircle2 className="text-[#2D3E32] shrink-0 mt-0.5" size={20}/>
            <div>
              <div className="font-display font-bold text-[#1A201A]">Brief on file</div>
              <div className="text-sm text-[#5C685C] mt-1">
                You can update any field below — your specialist sees changes instantly.
              </div>
            </div>
          </div>
        )}

        <form onSubmit={submit} className="mt-10 space-y-8" data-testid="concierge-brief-form">
          {/* Business */}
          <Section title="Business basics">
            <Field label="Business name *">
              <Input required value={form.business_name}
                data-testid="brief-name-input"
                onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                className="bg-white border-[#E5E0D8] rounded-xl py-6"/>
            </Field>
            <Field label="Website URL *">
              <Input required value={form.website}
                data-testid="brief-website-input"
                placeholder="https://yourstartup.com"
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                className="bg-white border-[#E5E0D8] rounded-xl py-6"/>
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Industry">
                <Input value={form.industry}
                  data-testid="brief-industry-input"
                  placeholder="SaaS, restaurant, agency…"
                  onChange={(e) => setForm({ ...form, industry: e.target.value })}
                  className="bg-white border-[#E5E0D8] rounded-xl py-6"/>
              </Field>
              <Field label="Location (city, state)">
                <Input value={form.location}
                  data-testid="brief-location-input"
                  placeholder="Portland, OR"
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  className="bg-white border-[#E5E0D8] rounded-xl py-6"/>
              </Field>
            </div>
          </Section>

          {/* Targets */}
          <Section title="What we&rsquo;re going after">
            <Field label="Target keywords (the phrases you want to rank for)">
              <div className="flex gap-2">
                <Input value={kwInput} onChange={(e) => setKwInput(e.target.value)}
                  data-testid="brief-keyword-input"
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addKw(); } }}
                  placeholder="e.g. plant shop portland"
                  className="bg-white border-[#E5E0D8] rounded-xl py-5"/>
                <Button type="button" onClick={addKw}
                  data-testid="brief-add-keyword-btn"
                  className="bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7] rounded-full px-5">Add</Button>
              </div>
              <ChipList items={form.target_keywords} onRemove={(i) => removeAt("target_keywords", i)} testIdPrefix="keyword-chip"/>
            </Field>

            <Field label="Main competitors (URLs or names)">
              <div className="flex gap-2">
                <Input value={compInput} onChange={(e) => setCompInput(e.target.value)}
                  data-testid="brief-competitor-input"
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addComp(); } }}
                  placeholder="competitor.com"
                  className="bg-white border-[#E5E0D8] rounded-xl py-5"/>
                <Button type="button" onClick={addComp}
                  data-testid="brief-add-competitor-btn"
                  className="bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7] rounded-full px-5">Add</Button>
              </div>
              <ChipList items={form.competitors} onRemove={(i) => removeAt("competitors", i)} testIdPrefix="competitor-chip"/>
            </Field>
          </Section>

          {/* Goals */}
          <Section title="What does winning look like">
            <Field label="Primary goal in your own words *">
              <Textarea required rows={3} value={form.primary_goal}
                data-testid="brief-goal-input"
                placeholder="e.g. Be the #1 result for &lsquo;wedding florist denver&rsquo; so I get 5 new inquiries / week."
                onChange={(e) => setForm({ ...form, primary_goal: e.target.value })}
                className="bg-white border-[#E5E0D8] rounded-xl"/>
            </Field>
            <Field label="Who is your ideal customer?">
              <Textarea rows={2} value={form.target_customer}
                data-testid="brief-customer-input"
                placeholder="e.g. Couples planning weddings in the next 12 months, budget $3k+."
                onChange={(e) => setForm({ ...form, target_customer: e.target.value })}
                className="bg-white border-[#E5E0D8] rounded-xl"/>
            </Field>
            <Field label="Brand voice — how should we sound when we write for you?">
              <Textarea rows={2} value={form.brand_voice}
                data-testid="brief-voice-input"
                placeholder="e.g. Warm and casual, no jargon. Avoid &lsquo;solutions&rsquo;."
                onChange={(e) => setForm({ ...form, brand_voice: e.target.value })}
                className="bg-white border-[#E5E0D8] rounded-xl"/>
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Monthly traffic goal (optional)">
                <Input value={form.monthly_traffic_goal}
                  data-testid="brief-traffic-input"
                  placeholder="e.g. 2,000 organic visitors / month"
                  onChange={(e) => setForm({ ...form, monthly_traffic_goal: e.target.value })}
                  className="bg-white border-[#E5E0D8] rounded-xl py-6"/>
              </Field>
              <Field label="Current blockers (optional)">
                <Input value={form.blockers}
                  data-testid="brief-blockers-input"
                  placeholder="Outdated site, no blog, slow developer…"
                  onChange={(e) => setForm({ ...form, blockers: e.target.value })}
                  className="bg-white border-[#E5E0D8] rounded-xl py-6"/>
              </Field>
            </div>
          </Section>

          {/* Contact */}
          <Section title="How to reach you">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Phone (for quarterly check-ins)">
                <Input value={form.contact_phone}
                  data-testid="brief-phone-input"
                  placeholder="+1 555 123 4567"
                  onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                  className="bg-white border-[#E5E0D8] rounded-xl py-6"/>
              </Field>
              <Field label="Preferred meeting time">
                <Input value={form.preferred_meeting_time}
                  data-testid="brief-meeting-input"
                  placeholder="Tuesdays 2-4pm PT"
                  onChange={(e) => setForm({ ...form, preferred_meeting_time: e.target.value })}
                  className="bg-white border-[#E5E0D8] rounded-xl py-6"/>
              </Field>
            </div>
          </Section>

          <div className="flex items-center justify-between gap-4 pt-2">
            <p className="text-sm text-[#5C685C]">
              Your specialist will reach out within 1 business day after submit.
            </p>
            <Button type="submit" disabled={busy}
              data-testid="brief-submit-btn"
              className="bg-[#E07A5F] hover:bg-[#C86A51] text-[#FDFBF7] rounded-full px-7 py-6">
              {busy ? "Saving…" : (submitted ? "Update brief" : "Submit brief")}
              <ArrowRight size={16} className="ml-1.5"/>
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6 space-y-5">
      <div className="label-eyebrow">{title}</div>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div className="space-y-2">
      <Label className="text-[#1A201A] text-sm">{label}</Label>
      {children}
    </div>
  );
}

function ChipList({ items, onRemove, testIdPrefix }) {
  if (!items.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {items.map((c, i) => (
        <Badge key={i} className="bg-[#81B29A]/20 text-[#2D3E32] hover:bg-[#81B29A]/20 border-0 px-3 py-1.5 rounded-full" data-testid={`${testIdPrefix}-${i}`}>
          {c}
          <button type="button" onClick={() => onRemove(i)} className="ml-2 hover:text-[#E07A5F]" aria-label="Remove">
            <X size={12}/>
          </button>
        </Badge>
      ))}
    </div>
  );
}
