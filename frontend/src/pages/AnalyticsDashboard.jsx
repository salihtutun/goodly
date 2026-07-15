import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { PageLoader } from "@/components/app/Common";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Navigate } from "react-router-dom";

export default function AnalyticsDashboard() {
  usePageMeta({ title: "Analytics — Goodly", description: "Business intelligence and analytics for Goodly." });
  const { user, loading } = useAuth();
  const [data, setData] = useState({});
  const [activeTab, setActiveTab] = useState("funnel");
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    fetchTab(activeTab);
  }, [user, activeTab]);

  async function fetchTab(tab) {
    if (data[tab]) return;
    setFetching(true);
    try {
      const res = await api.get(`/admin/analytics/${tab}`);
      setData(prev => ({ ...prev, [tab]: res.data }));
    } catch (e) {
      if (process.env.NODE_ENV === "development") console.error("Analytics fetch failed:", e);
    }
    setFetching(false);
  }

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/app" replace />;

  const tabs = [
    { id: "funnel", label: "Conversion Funnel" },
    { id: "mrr", label: "MRR & Revenue" },
    { id: "churn", label: "Churn Risk" },
    { id: "features", label: "Feature Adoption" },
    { id: "daily", label: "Daily Metrics" },
  ];

  const card = { padding: 20, background: "#FDFBF7", borderRadius: 12, border: "1px solid #E5E0D8" };
  const metricStyle = { fontSize: 32, fontWeight: 700, color: "#1A201A" };
  const labelStyle = { fontSize: 13, color: "#6B7280", marginBottom: 4 };

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1A201A", marginBottom: 24 }}>Analytics</h1>

      <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "1px solid #E5E0D8" }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: "10px 20px", border: "none", background: "none", cursor: "pointer",
              fontSize: 15, fontWeight: activeTab === t.id ? 600 : 400,
              color: activeTab === t.id ? "#2D3E32" : "#6B7280",
              borderBottom: activeTab === t.id ? "2px solid #2D3E32" : "2px solid transparent",
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {fetching && !data[activeTab] ? <PageLoader /> : (
        <>
          {/* Funnel */}
          {activeTab === "funnel" && data.funnel && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
                {[
                  { label: "Signups", value: data.funnel.funnel.signups },
                  { label: "Ran Audit", value: data.funnel.funnel.ran_audit },
                  { label: "Upgraded", value: data.funnel.funnel.upgraded },
                  { label: "Concierge", value: data.funnel.funnel.concierge },
                ].map((m) => (
                  <div key={m.label} style={card}>
                    <div style={labelStyle}>{m.label}</div>
                    <div style={metricStyle}>{m.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                {Object.entries(data.funnel.conversion_rates).map(([key, val]) => (
                  <div key={key} style={card}>
                    <div style={labelStyle}>{key.replace(/_/g, " ")}</div>
                    <div style={metricStyle}>{val}%</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MRR */}
          {activeTab === "mrr" && data.mrr && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
                {[
                  { label: "MRR", value: "$" + data.mrr.mrr.toLocaleString() },
                  { label: "ARR", value: "$" + data.mrr.arr.toLocaleString() },
                  { label: "Paying Users", value: data.mrr.total_paying_users },
                  { label: "ARPU", value: "$" + data.mrr.arpu },
                ].map((m) => (
                  <div key={m.label} style={card}>
                    <div style={labelStyle}>{m.label}</div>
                    <div style={metricStyle}>{m.value}</div>
                  </div>
                ))}
              </div>
              <div style={card}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "#1A201A" }}>Plan Breakdown</h3>
                {Object.entries(data.mrr.plan_breakdown).map(([plan, info]) => (
                  <div key={plan} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F3F4F6" }}>
                    <span style={{ textTransform: "capitalize", color: "#374151" }}>{plan}</span>
                    <span style={{ color: "#6B7280" }}>{info.users} users × ${info.price_per_user}</span>
                    <span style={{ fontWeight: 600, color: "#1A201A" }}>${info.revenue.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Churn */}
          {activeTab === "churn" && data.churn && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
                {[
                  { label: "Paying Users", value: data.churn.total_paying_users },
                  { label: "At Risk", value: data.churn.at_risk_count },
                  { label: "Risk Rate", value: data.churn.at_risk_rate + "%" },
                  { label: "Inactive Threshold", value: data.churn.days_inactive_threshold + " days" },
                ].map((m) => (
                  <div key={m.label} style={card}>
                    <div style={labelStyle}>{m.label}</div>
                    <div style={{ ...metricStyle, color: m.label === "At Risk" && data.churn.at_risk_count > 0 ? "#DC2626" : "#1A201A" }}>
                      {m.value}
                    </div>
                  </div>
                ))}
              </div>
              {data.churn.at_risk_users.length > 0 && (
                <div style={card}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "#1A201A" }}>At-Risk Users</h3>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: "1px solid #E5E0D8" }}>
                        <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 13, color: "#6B7280" }}>Name</th>
                        <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 13, color: "#6B7280" }}>Email</th>
                        <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 13, color: "#6B7280" }}>Plan</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.churn.at_risk_users.map((u) => (
                        <tr key={u.user_id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                          <td style={{ padding: "8px 12px", color: "#374151" }}>{u.name}</td>
                          <td style={{ padding: "8px 12px", color: "#6B7280" }}>{u.email}</td>
                          <td style={{ padding: "8px 12px", textTransform: "capitalize", color: "#374151" }}>{u.plan}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Features */}
          {activeTab === "features" && data.features && (
            <div>
              <div style={{ ...card, marginBottom: 16 }}>
                <div style={labelStyle}>Total Users</div>
                <div style={metricStyle}>{data.features.total_users}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
                {Object.entries(data.features.features).map(([name, info]) => (
                  <div key={name} style={card}>
                    <div style={{ ...labelStyle, textTransform: "capitalize" }}>{name.replace(/_/g, " ")}</div>
                    <div style={metricStyle}>{info.users}</div>
                    <div style={{ fontSize: 13, color: "#6B7280" }}>{info.adoption_pct}% adoption</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Daily */}
          {activeTab === "daily" && data.daily && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
                {[
                  { label: "Total Signups", value: data.daily.totals.signups },
                  { label: "Total Audits", value: data.daily.totals.audits },
                ].map((m) => (
                  <div key={m.label} style={card}>
                    <div style={labelStyle}>{m.label}</div>
                    <div style={metricStyle}>{m.value}</div>
                  </div>
                ))}
              </div>
              <div style={{ ...card, overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #E5E0D8" }}>
                      <th style={{ textAlign: "left", padding: "8px 12px", color: "#6B7280" }}>Date</th>
                      <th style={{ textAlign: "right", padding: "8px 12px", color: "#6B7280" }}>Signups</th>
                      <th style={{ textAlign: "right", padding: "8px 12px", color: "#6B7280" }}>Audits</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.daily.daily.slice(-14).map((d) => (
                      <tr key={d.date} style={{ borderBottom: "1px solid #F3F4F6" }}>
                        <td style={{ padding: "6px 12px", color: "#374151" }}>{d.date}</td>
                        <td style={{ padding: "6px 12px", textAlign: "right", color: "#1A201A", fontWeight: 600 }}>{d.signups}</td>
                        <td style={{ padding: "6px 12px", textAlign: "right", color: "#1A201A", fontWeight: 600 }}>{d.audits}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
