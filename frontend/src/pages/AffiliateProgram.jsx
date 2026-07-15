import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { PageLoader } from "@/components/app/Common";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Navigate } from "react-router-dom";
import { Copy, Mail, Users, DollarSign, TrendingUp } from "lucide-react";

export default function AffiliateProgram() {
  usePageMeta({ title: "Affiliate Program — Goodly", description: "Earn commissions by referring businesses to Goodly's SEO platform." });
  const { user, loading } = useAuth();
  const [stats, setStats] = useState(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    fetchStats();
  }, [user]);

  async function fetchStats() {
    try {
      const res = await api.get("/referrals/stats");
      setStats(res.data);
    } catch (e) {
      // Stats endpoint may not exist yet — that's ok
      setStats({ total_referrals: 0, signups: 0, audits_completed: 0, credits_earned: 0 });
    }
  }

  const referralLink = user
    ? `${window.location.origin}/audit?ref=${user.id}`
    : "";

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement("input");
      input.value = referralLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  async function handleSendInvite(e) {
    e.preventDefault();
    if (!inviteEmail) return;
    setSending(true);
    setError("");
    try {
      await api.post("/referrals/invite", { email: inviteEmail });
      setInviteEmail("");
      alert("Invite sent!");
    } catch (e) {
      setError(e.response?.data?.detail || "Failed to send invite");
    }
    setSending(false);
  }

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;

  const planCredits = {
    free: 1,
    starter: 10,
    pro: 25,
    concierge: 50,
  };

  const creditPerReferral = planCredits[user.plan] || 1;

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1A201A", marginBottom: 8 }}>
          Affiliate Program
        </h1>
        <p style={{ fontSize: 16, color: "#6B7280" }}>
          Share Goodly with other business owners. Automated referral credits are rolling out soon —
          early sharers will be credited for qualifying referrals.
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 16, marginBottom: 32 }}>
        {[
          { label: "Total Referrals", value: stats?.total_referrals || 0, icon: Users },
          { label: "Signups", value: stats?.signups || 0, icon: TrendingUp },
          { label: "Audits Run", value: stats?.audits_completed || 0, icon: TrendingUp },
          { label: "Credits Earned", value: `$${stats?.credits_earned || 0}`, icon: DollarSign },
        ].map((s) => (
          <div key={s.label} style={{ padding: 20, background: "#FDFBF7", borderRadius: 12, border: "1px solid #E5E0D8", textAlign: "center" }}>
            <s.icon size={24} style={{ color: "#2D3E32", marginBottom: 8 }} />
            <div style={{ fontSize: 28, fontWeight: 700, color: "#1A201A" }}>{s.value}</div>
            <div style={{ fontSize: 13, color: "#6B7280", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Referral Link */}
      <div style={{ padding: 24, background: "#FDFBF7", borderRadius: 16, border: "1px solid #E5E0D8", marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: "#1A201A", marginBottom: 12 }}>
          Your Referral Link
        </h3>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            type="text"
            value={referralLink}
            readOnly
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #E5E0D8",
              fontSize: 14,
              background: "#F9FAFB",
              color: "#374151",
            }}
          />
          <button
            onClick={handleCopyLink}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              background: copied ? "#10B981" : "#2D3E32",
              color: "#FDFBF7",
              cursor: "pointer",
              fontSize: 14,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6,
              whiteSpace: "nowrap",
            }}
          >
            <Copy size={16} />
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* Email Invite */}
      <div style={{ padding: 24, background: "#FDFBF7", borderRadius: 16, border: "1px solid #E5E0D8", marginBottom: 24 }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: "#1A201A", marginBottom: 12 }}>
          Invite by Email
        </h3>
        <form onSubmit={handleSendInvite} style={{ display: "flex", gap: 8 }}>
          <input
            type="email"
            placeholder="friend@business.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: 8,
              border: "1px solid #E5E0D8",
              fontSize: 14,
              background: "#FDFBF7",
              color: "#1A201A",
            }}
          />
          <button
            type="submit"
            disabled={sending}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              background: sending ? "#9CA3AF" : "#2D3E32",
              color: "#FDFBF7",
              cursor: sending ? "not-allowed" : "pointer",
              fontSize: 14,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6,
              whiteSpace: "nowrap",
            }}
          >
            <Mail size={16} />
            {sending ? "Sending..." : "Send Invite"}
          </button>
        </form>
        {error && <div style={{ marginTop: 8, color: "#EF4444", fontSize: 14 }}>{error}</div>}
      </div>

      {/* How It Works */}
      <div style={{ padding: 24, background: "#FDFBF7", borderRadius: 16, border: "1px solid #E5E0D8" }}>
        <h3 style={{ fontSize: 18, fontWeight: 600, color: "#1A201A", marginBottom: 16 }}>
          How It Works
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[
            { step: "1", title: "Share your link", desc: "Copy your unique referral link and share it with other business owners on social media, email, or anywhere." },
            { step: "2", title: "They try Goodly", desc: "Your link takes them straight to a free SEO audit — no signup needed." },
            { step: "3", title: "They grow", desc: "They get an AI action plan and can start improving their visibility right away." },
            { step: "4", title: "Rewards coming soon", desc: `Automated referral credits (up to $${creditPerReferral} per qualifying referral on your plan) are rolling out soon.` },
          ].map((item) => (
            <div key={item.step} style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: "#2D3E32",
                  color: "#FDFBF7",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 700,
                  fontSize: 16,
                  flexShrink: 0,
                }}
              >
                {item.step}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 15, color: "#1A201A", marginBottom: 2 }}>
                  {item.title}
                </div>
                <div style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.5 }}>
                  {item.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
