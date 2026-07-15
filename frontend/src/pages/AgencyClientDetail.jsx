import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { PageLoader } from "@/components/app/Common";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Navigate, useParams, useNavigate } from "react-router-dom";

export default function AgencyClientDetail() {
  usePageMeta({ title: "Client Detail — Goodly", description: "View and manage client SEO performance." });
  const { user, loading } = useAuth();
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [auditUrl, setAuditUrl] = useState("");
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || !clientId) return;
    fetchClient();
  }, [user, clientId]);

  async function fetchClient() {
    setFetching(true);
    try {
      const res = await api.get(`/agency/clients/${clientId}`);
      setClient(res.data);
    } catch (e) {
      setError("Failed to load client data.");
    }
    setFetching(false);
  }

  async function runAudit() {
    if (!auditUrl) return;
    setRunning(true);
    setError("");
    try {
      await api.post("/agency/audits", {
        client_id: clientId,
        url: auditUrl,
      });
      setAuditUrl("");
      fetchClient();
    } catch (e) {
      setError(e.response?.data?.detail || "Audit failed");
    }
    setRunning(false);
  }

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;

  const card = { padding: 20, background: "#FDFBF7", borderRadius: 12, border: "1px solid #E5E0D8" };
  const metricStyle = { fontSize: 28, fontWeight: 700, color: "#1A201A" };
  const labelStyle = { fontSize: 13, color: "#6B7280", marginBottom: 4 };
  const btnPrimary = {
    padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer",
    background: "#2D3E32", color: "#FFFFFF", fontSize: 14, fontWeight: 600,
  };

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 24px" }}>
      <button
        onClick={() => navigate("/app/agency")}
        style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280", fontSize: 14, marginBottom: 16 }}
      >
        ← Back to Agency Dashboard
      </button>

      {fetching ? <PageLoader /> : client ? (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1A201A", marginBottom: 4 }}>{client.name}</h1>
              <p style={{ color: "#6B7280", fontSize: 14 }}>{client.email}</p>
            </div>
            <span style={{
              display: "inline-block", padding: "4px 12px", borderRadius: 12, fontSize: 14, fontWeight: 600,
              background: (client.last_score ?? 0) >= 70 ? "#DCFCE7" : (client.last_score ?? 0) >= 40 ? "#FEF3C7" : "#FEE2E2",
              color: (client.last_score ?? 0) >= 70 ? "#166534" : (client.last_score ?? 0) >= 40 ? "#92400E" : "#991B1B",
            }}>
              Score: {client.last_score ?? "—"}
            </span>
          </div>

          {error && (
            <div style={{ padding: 12, background: "#FEF2F2", color: "#991B1B", borderRadius: 8, marginBottom: 16 }}>
              {error}
            </div>
          )}

          {/* Run Audit */}
          <div style={{ ...card, marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "#1A201A" }}>Run Audit for Client</h3>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                placeholder="Enter URL to audit..."
                value={auditUrl}
                onChange={e => setAuditUrl(e.target.value)}
                style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid #E5E0D8", fontSize: 14 }}
                onKeyDown={e => e.key === "Enter" && runAudit()}
              />
              <button onClick={runAudit} disabled={running || !auditUrl} style={{ ...btnPrimary, opacity: running ? 0.6 : 1 }}>
                {running ? "Running..." : "Run Audit"}
              </button>
            </div>
          </div>

          {/* Projects */}
          <div style={{ ...card, marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "#1A201A" }}>
              Projects ({(client.projects || []).length})
            </h3>
            {(client.projects || []).map((p) => (
              <div key={p.id} style={{ padding: "12px 0", borderBottom: "1px solid #F3F4F6" }}>
                <div style={{ fontWeight: 500, color: "#1A201A" }}>{p.name}</div>
                <div style={{ fontSize: 13, color: "#6B7280" }}>{p.url}</div>
                {p.last_score != null && (
                  <span style={{
                    display: "inline-block", marginTop: 4, padding: "2px 8px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                    background: p.last_score >= 70 ? "#DCFCE7" : p.last_score >= 40 ? "#FEF3C7" : "#FEE2E2",
                    color: p.last_score >= 70 ? "#166534" : p.last_score >= 40 ? "#92400E" : "#991B1B",
                  }}>
                    Score: {p.last_score}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Recent Audits */}
          <div style={card}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "#1A201A" }}>
              Recent Audits ({(client.recent_audits || []).length})
            </h3>
            {(client.recent_audits || []).length === 0 ? (
              <p style={{ color: "#6B7280" }}>No audits yet.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #E5E0D8" }}>
                    <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 13, color: "#6B7280" }}>URL</th>
                    <th style={{ textAlign: "center", padding: "8px 12px", fontSize: 13, color: "#6B7280" }}>Score</th>
                    <th style={{ textAlign: "right", padding: "8px 12px", fontSize: 13, color: "#6B7280" }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {(client.recent_audits || []).map((a) => (
                    <tr key={a.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                      <td style={{ padding: "8px 12px", color: "#374151", maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {a.url}
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "center" }}>
                        <span style={{
                          display: "inline-block", padding: "2px 8px", borderRadius: 8, fontSize: 13, fontWeight: 600,
                          background: ((a.result || {}).overall_score ?? 0) >= 70 ? "#DCFCE7" : ((a.result || {}).overall_score ?? 0) >= 40 ? "#FEF3C7" : "#FEE2E2",
                          color: ((a.result || {}).overall_score ?? 0) >= 70 ? "#166534" : ((a.result || {}).overall_score ?? 0) >= 40 ? "#92400E" : "#991B1B",
                        }}>
                          {(a.result || {}).overall_score ?? "—"}
                        </span>
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "right", color: "#6B7280", fontSize: 13 }}>
                        {a.created_at ? new Date(a.created_at).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : (
        <div style={{ textAlign: "center", padding: 40, color: "#6B7280" }}>
          Client not found.
        </div>
      )}
    </div>
  );
}
