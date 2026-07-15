import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { PageLoader } from "@/components/app/Common";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Navigate, useNavigate } from "react-router-dom";

export default function AgencyDashboard() {
  usePageMeta({ title: "Agency Dashboard — Goodly", description: "Manage your SEO clients from one dashboard." });
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [clients, setClients] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ email: "", name: "", website: "", plan: "free" });
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    fetchAll();
  }, [user]);

  async function fetchAll() {
    setFetching(true);
    try {
      const [dashRes, clientsRes] = await Promise.all([
        api.get("/agency/dashboard"),
        api.get("/agency/clients"),
      ]);
      setDashboard(dashRes.data);
      setClients(clientsRes.data);
    } catch (e) {
      setError("Failed to load agency data.");
    }
    setFetching(false);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/agency/clients", form);
      setShowCreate(false);
      setForm({ email: "", name: "", website: "", plan: "free" });
      fetchAll();
    } catch (e) {
      setError(e.response?.data?.detail || "Failed to create client");
    }
  }

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;

  const card = { padding: 20, background: "#FDFBF7", borderRadius: 12, border: "1px solid #E5E0D8" };
  const metricStyle = { fontSize: 32, fontWeight: 700, color: "#1A201A" };
  const labelStyle = { fontSize: 13, color: "#6B7280", marginBottom: 4 };
  const btnPrimary = {
    padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer",
    background: "#2D3E32", color: "#FFFFFF", fontSize: 14, fontWeight: 600,
  };
  const btnSecondary = {
    padding: "10px 20px", borderRadius: 8, border: "1px solid #E5E0D8", cursor: "pointer",
    background: "#FDFBF7", color: "#1A201A", fontSize: 14,
  };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1A201A" }}>Agency Dashboard</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={fetchAll} style={btnSecondary}>Refresh</button>
          <button onClick={() => setShowCreate(!showCreate)} style={btnPrimary}>
            {showCreate ? "Cancel" : "+ Add Client"}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: 12, background: "#FEF2F2", color: "#991B1B", borderRadius: 8, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Create Client Form */}
      {showCreate && (
        <form onSubmit={handleCreate} style={{ ...card, marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#1A201A" }}>Add New Client</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <input
              placeholder="Client Name" required
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #E5E0D8", fontSize: 14 }}
            />
            <input
              placeholder="Email" type="email" required
              value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #E5E0D8", fontSize: 14 }}
            />
            <input
              placeholder="Website URL" required
              value={form.website} onChange={e => setForm({ ...form, website: e.target.value })}
              style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #E5E0D8", fontSize: 14 }}
            />
            <select
              value={form.plan} onChange={e => setForm({ ...form, plan: e.target.value })}
              style={{ padding: "10px 12px", borderRadius: 8, border: "1px solid #E5E0D8", fontSize: 14 }}
            >
              <option value="free">Free</option>
              <option value="starter">Starter ($49/mo)</option>
              <option value="pro">Pro ($149/mo)</option>
              <option value="concierge">Concierge ($1,000/mo)</option>
            </select>
          </div>
          <button type="submit" style={{ ...btnPrimary, marginTop: 16 }}>Create Client</button>
        </form>
      )}

      {fetching ? <PageLoader /> : (
        <>
          {/* Overview Cards */}
          {dashboard && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
              {[
                { label: "Total Clients", value: dashboard.total_clients },
                { label: "Total Projects", value: dashboard.total_projects },
                { label: "Total Audits", value: dashboard.total_audits },
                { label: "Avg Score", value: dashboard.average_score ?? "—" },
                { label: "Need Attention", value: dashboard.clients_needing_attention, alert: dashboard.clients_needing_attention > 0 },
              ].map((m) => (
                <div key={m.label} style={card}>
                  <div style={labelStyle}>{m.label}</div>
                  <div style={{ ...metricStyle, color: m.alert ? "#DC2626" : "#1A201A" }}>{m.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Clients Table */}
          <div style={card}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: "#1A201A" }}>
              Clients ({clients.length})
            </h3>
            {clients.length === 0 ? (
              <p style={{ color: "#6B7280" }}>No clients yet. Add your first client above.</p>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #E5E0D8" }}>
                    <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 13, color: "#6B7280" }}>Name</th>
                    <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 13, color: "#6B7280" }}>Email</th>
                    <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 13, color: "#6B7280" }}>Plan</th>
                    <th style={{ textAlign: "center", padding: "8px 12px", fontSize: 13, color: "#6B7280" }}>Score</th>
                    <th style={{ textAlign: "center", padding: "8px 12px", fontSize: 13, color: "#6B7280" }}>Projects</th>
                    <th style={{ textAlign: "center", padding: "8px 12px", fontSize: 13, color: "#6B7280" }}>Audits</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((c) => (
                    <tr
                      key={c.id}
                      onClick={() => navigate(`/app/agency/clients/${c.id}`)}
                      style={{ borderBottom: "1px solid #F3F4F6", cursor: "pointer" }}
                      onMouseEnter={e => e.currentTarget.style.background = "#F9FAFB"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "10px 12px", color: "#1A201A", fontWeight: 500 }}>{c.name}</td>
                      <td style={{ padding: "10px 12px", color: "#6B7280" }}>{c.email}</td>
                      <td style={{ padding: "10px 12px", textTransform: "capitalize", color: "#374151" }}>{c.plan || "free"}</td>
                      <td style={{ padding: "10px 12px", textAlign: "center" }}>
                        <span style={{
                          display: "inline-block", padding: "2px 8px", borderRadius: 12, fontSize: 13, fontWeight: 600,
                          background: (c.last_score ?? 0) >= 70 ? "#DCFCE7" : (c.last_score ?? 0) >= 40 ? "#FEF3C7" : "#FEE2E2",
                          color: (c.last_score ?? 0) >= 70 ? "#166534" : (c.last_score ?? 0) >= 40 ? "#92400E" : "#991B1B",
                        }}>
                          {c.last_score ?? "—"}
                        </span>
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "center", color: "#374151" }}>{c.project_count}</td>
                      <td style={{ padding: "10px 12px", textAlign: "center", color: "#374151" }}>{c.audit_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
