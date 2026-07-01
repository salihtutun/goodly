import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { formatApiError } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import AppLayout from "@/components/app/AppLayout";
import { Eyebrow } from "@/components/app/Common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Gift, Users, Check, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function Referral() {
  usePageMeta({ title: "Refer a friend", description: "Give a friend a free SEO audit and earn rewards." });
  const { user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState([]);

  const referralLink = `${window.location.origin}/audit?ref=${user?.id || "guest"}`;

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied!");
  };

  const sendInvite = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    try {
      await api.post("/referrals/invite", { email: email.trim() });
      setSent([...sent, email]);
      setEmail("");
      toast.success(`Invite sent to ${email}`);
    } catch (e) {
      toast.error(formatApiError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto" data-testid="referral-root">
        <Eyebrow>Refer & earn</Eyebrow>
        <h1 className="mt-3 font-display font-bold text-4xl sm:text-5xl text-[#1A201A] tracking-tight">
          Share Goodly, grow together.
        </h1>
        <p className="mt-3 text-[#5C685C] text-lg">
          Give a friend a free SEO audit. When they sign up, you both get a free month of Starter.
        </p>

        {/* Referral link */}
        <div className="mt-10 bg-white border border-[#E5E0D8] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-[#81B29A]/20 text-[#2D3E32] flex items-center justify-center">
              <Gift size={20} strokeWidth={1.75} />
            </div>
            <div>
              <div className="font-display font-bold text-lg text-[#1A201A]">Your referral link</div>
              <div className="text-sm text-[#5C685C]">Anyone who signs up via this link gets a free audit.</div>
            </div>
          </div>
          <div className="flex gap-2">
            <Input
              value={referralLink}
              readOnly
              className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl font-mono text-sm"
              data-testid="referral-link-input"
            />
            <Button onClick={copyLink} data-testid="copy-referral-btn"
              className="bg-[#2D3E32] hover:bg-[#4A5F4F] text-[#FDFBF7] rounded-xl shrink-0">
              <Copy size={16} className="mr-1.5" /> Copy
            </Button>
          </div>
        </div>

        {/* Email invite */}
        <div className="mt-6 bg-white border border-[#E5E0D8] rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-[#E07A5F]/20 text-[#E07A5F] flex items-center justify-center">
              <Users size={20} strokeWidth={1.75} />
            </div>
            <div>
              <div className="font-display font-bold text-lg text-[#1A201A]">Invite by email</div>
              <div className="text-sm text-[#5C685C]">We'll send them a personal invite with your referral link.</div>
            </div>
          </div>
          <form onSubmit={sendInvite} className="flex gap-2">
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="friend@business.com"
              data-testid="referral-email-input"
              className="bg-[#FDFBF7] border-[#E5E0D8] rounded-xl"
            />
            <Button type="submit" disabled={busy} data-testid="send-invite-btn"
              className="bg-[#E07A5F] hover:bg-[#C86A51] text-[#FDFBF7] rounded-xl shrink-0">
              {busy ? "Sending..." : "Send invite"}
            </Button>
          </form>

          {sent.length > 0 && (
            <div className="mt-4 space-y-2">
              {sent.map((e, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-[#81B29A]">
                  <Check size={14} /> Invite sent to {e}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* How it works */}
        <div className="mt-10 grid grid-cols-3 gap-4 text-center">
          <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5">
            <div className="text-3xl font-display font-bold text-[#2D3E32]">1</div>
            <div className="text-sm text-[#5C685C] mt-2">Share your link with a friend</div>
          </div>
          <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5">
            <div className="text-3xl font-display font-bold text-[#2D3E32]">2</div>
            <div className="text-sm text-[#5C685C] mt-2">They run a free audit and sign up</div>
          </div>
          <div className="bg-white border border-[#E5E0D8] rounded-2xl p-5">
            <div className="text-3xl font-display font-bold text-[#2D3E32]">3</div>
            <div className="text-sm text-[#5C685C] mt-2">You both get a free month of Starter</div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Button onClick={() => navigate("/app/billing")} variant="outline"
            className="border-[#2D3E32] text-[#2D3E32] hover:bg-[#F3F0E9] rounded-full">
            View plans <ArrowRight size={16} className="ml-2" />
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
