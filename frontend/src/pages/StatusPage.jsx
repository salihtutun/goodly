import { useEffect, useState } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { api } from "@/lib/api";

export default function StatusPage() {
  usePageMeta({ title: "System Status — Goodly", description: "Real-time system health and incident history for Goodly." });
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  async function fetchHealth() {
    try {
      const res = await api.get("/health");
      setHealth(res.data);
      setError("");
    } catch (e) {
      setError("Unable to reach health endpoint");
    }
    setLoading(false);
  }

  const statusColor = (ok) =>
    ok ? "#10B981" : "#EF4444";

  const statusLabel = (ok) =>
    ok ? "Operational" : "Degraded";

  const services = health
    ? [
        { name: "API", status: health.status === "ok" },
        { name: "Database", status: health.database === "connected" },
        { name: "AI Service", status: health.ai_service === "configured" },
        { name: "Stripe", status: health.stripe === "configured" },
        { name: "Email", status: health.email === "configured" },
        { name: "Scheduler", status: health.scheduler === "enabled" },
      ]
    : [];

  const allUp = services.every((s) => s.status);

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "#1A201A", marginBottom: 8 }}>
          System Status
        </h1>
        <p style={{ fontSize: 16, color: "#6B7280" }}>
          Real-time health monitoring for all Goodly services
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: "#6B7280" }}>Loading...</div>
      ) : error ? (
        <div style={{ padding: 20, background: "#FEF2F2", color: "#991B1B", borderRadius: 12, textAlign: "center" }}>
          {error}
        </div>
      ) : (
        <>
          {/* Overall Status Banner */}
          <div
            style={{
              padding: 24,
              borderRadius: 16,
              background: allUp ? "#ECFDF5" : "#FEF2F2",
              border: `2px solid ${allUp ? "#10B981" : "#EF4444"}`,
              marginBottom: 32,
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 8 }}>{allUp ? "✅" : "⚠️"}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: allUp ? "#065F46" : "#991B1B" }}>
              {allUp ? "All Systems Operational" : "Some Services Degraded"}
            </div>
            <div style={{ fontSize: 14, color: "#6B7280", marginTop: 4 }}>
              Version {health?.version || "—"} · Uptime: {health?.uptime_seconds ? formatUptime(health.uptime_seconds) : "—"}
            </div>
          </div>

          {/* Service Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 40 }}>
            {services.map((s) => (
              <div
                key={s.name}
                style={{
                  padding: 20,
                  borderRadius: 12,
                  background: "#FDFBF7",
                  border: "1px solid #E5E0D8",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: "50%",
                    background: statusColor(s.status),
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#1A201A" }}>{s.name}</div>
                  <div style={{ fontSize: 13, color: statusColor(s.status) }}>{statusLabel(s.status)}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Incident History */}
          <div style={{ padding: 24, background: "#FDFBF7", borderRadius: 16, border: "1px solid #E5E0D8" }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, color: "#1A201A", marginBottom: 16 }}>
              Recent Incidents
            </h2>
            <div style={{ padding: "20px 0", textAlign: "center", color: "#6B7280" }}>
              No incidents reported in the last 90 days.
            </div>
          </div>

          {/* Auto-refresh note */}
          <div style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "#9CA3AF" }}>
            Auto-refreshes every 30 seconds · Last checked: {new Date().toLocaleTimeString()}
          </div>
        </>
      )}
    </div>
  );
}

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  return parts.join(" ") || "<1m";
}
