import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { PageLoader } from "@/components/app/Common";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Navigate } from "react-router-dom";

export default function AdminDashboard() {
  usePageMeta({ title: "Admin Dashboard — Goodly", description: "System administration and user management for Goodly." });
  const { user, loading } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [supportMessages, setSupportMessages] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [analyticsTab, setAnalyticsTab] = useState("funnel");

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    fetchAll();
  }, [user]);

  async function fetchAll() {
    setFetching(true);
    setError("");
    try {
      const [statsRes, usersRes, supportRes] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/users"),
        api.get("/admin/support-messages"),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setSupportMessages(supportRes.data);
    } catch (e) {
      setError("Failed to load admin data. Please try again.");
    }
    setFetching(false);
  }

  async function fetchAnalytics(endpoint) {
    try {
      const res = await api.get(`/admin/analytics/${endpoint}`);
      setAnalytics(prev => ({ ...prev, [endpoint]: res.data }));
    } catch (e) {
      if (process.env.NODE_ENV === "development") console.error("Analytics fetch failed:", e);
    }
  }

  async function handleDeleteUser(userId, name) {
    if (!window.confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers(users.filter((u) => u.id !== userId));
    } catch (e) {
      alert("Delete failed. Please try again.");
    }
  }

  async function handleUpdateUser(userId, field, value) {
    try {
      await api.patch(`/admin/users/${userId}`, { [field]: value });
      setUsers(users.map((u) => (u.id === userId ? { ...u, [field]: value } : u)));
    } catch (e) {
      alert("Update failed. Please try again.");
    }
  }

  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/app" replace />;

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "users", label: `Users (${users.length})` },
    { id: "support", label: `Support (${supportMessages.length})` },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "32px 24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1A201A" }}>Admin Dashboard</h1>
        <button
          onClick={fetchAll}
          style={{
            padding: "8px 16px", borderRadius: 8, border: "1px solid #E5E0D8",
            background: "#FDFBF7", cursor: "pointer", fontSize: 14,
          }}
        >
          Refresh
        </button>
      </div>

      {error && (
        <div style={{ padding: 12, background: "#FEF2F2", color: "#991B1B", borderRadius: 8, marginBottom: 16 }}>
          {error}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: "1px solid #E5E0D8" }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: "10px 20px",
              border: "none",
              background: "none",
              cursor: "pointer",
              fontSize: 15,
              fontWeight: activeTab === t.id ? 600 : 400,
              color: activeTab === t.id ? "#2D3E32" : "#6B7280",
              borderBottom: activeTab === t.id ? "2px solid #2D3E32" : "2px solid transparent",
              marginBottom: -1,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {fetching ? (
        <PageLoader />
      ) : (
        <>
          {/* Overview Tab */}
          {activeTab === "overview" && stats && (
            <div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
                {[
                  { label: "Total Users", value: stats.total_users },
                  { label: "Total Audits", value: stats.total_audits },
                  { label: "Total Projects", value: stats.total_projects },
                  { label: "Support Messages", value: stats.total_support_messages },
                  { label: "Concierge Briefs", value: stats.total_concierge_briefs },
                ].map((m) => (
                  <div key={m.label} style={{ padding: 20, background: "#FDFBF7", borderRadius: 12, border: "1px solid #E5E0D8" }}>
                    <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 4 }}>{m.label}</div>
                    <div style={{ fontSize: 32, fontWeight: 700, color: "#1A201A" }}>{m.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
                {/* Plans */}
                <div style={{ padding: 20, background: "#FDFBF7", borderRadius: 12, border: "1px solid #E5E0D8" }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "#1A201A" }}>Users by Plan</h3>
                  {Object.entries(stats.plans || {}).map(([plan, count]) => (
                    <div key={plan} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F3F4F6" }}>
                      <span style={{ textTransform: "capitalize", color: "#374151" }}>{plan}</span>
                      <span style={{ fontWeight: 600, color: "#1A201A" }}>{count}</span>
                    </div>
                  ))}
                </div>

                {/* Roles */}
                <div style={{ padding: 20, background: "#FDFBF7", borderRadius: 12, border: "1px solid #E5E0D8" }}>
                  <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "#1A201A" }}>Users by Role</h3>
                  {Object.entries(stats.roles || {}).map(([role, count]) => (
                    <div key={role} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid #F3F4F6" }}>
                      <span style={{ textTransform: "capitalize", color: "#374151" }}>{role}</span>
                      <span style={{ fontWeight: 600, color: "#1A201A" }}>{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Users */}
              <div style={{ marginTop: 24, padding: 20, background: "#FDFBF7", borderRadius: 12, border: "1px solid #E5E0D8" }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: "#1A201A" }}>Recent Signups</h3>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #E5E0D8" }}>
                      <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 13, color: "#6B7280" }}>Name</th>
                      <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 13, color: "#6B7280" }}>Email</th>
                      <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 13, color: "#6B7280" }}>Plan</th>
                      <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 13, color: "#6B7280" }}>Role</th>
                      <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 13, color: "#6B7280" }}>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(stats.recent_users || []).map((u) => (
                      <tr key={u.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                        <td style={{ padding: "8px 12px", fontSize: 14 }}>{u.name || "—"}</td>
                        <td style={{ padding: "8px 12px", fontSize: 14, color: "#6B7280" }}>{u.email}</td>
                        <td style={{ padding: "8px 12px", fontSize: 14 }}>
                          <span style={{
                            padding: "2px 8px", borderRadius: 12, fontSize: 12,
                            background: u.plan === "concierge" ? "#FEF3C7" : u.plan === "pro" ? "#DBEAFE" : u.plan === "starter" ? "#D1FAE5" : "#F3F4F6",
                            color: u.plan === "concierge" ? "#92400E" : u.plan === "pro" ? "#1E40AF" : u.plan === "starter" ? "#065F46" : "#374151",
                          }}>
                            {u.plan || "free"}
                          </span>
                        </td>
                        <td style={{ padding: "8px 12px", fontSize: 14, textTransform: "capitalize" }}>{u.role || "user"}</td>
                        <td style={{ padding: "8px 12px", fontSize: 13, color: "#6B7280" }}>
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === "users" && (
            <div style={{ padding: 20, background: "#FDFBF7", borderRadius: 12, border: "1px solid #E5E0D8" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #E5E0D8" }}>
                    <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 13, color: "#6B7280" }}>Name</th>
                    <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 13, color: "#6B7280" }}>Email</th>
                    <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 13, color: "#6B7280" }}>Plan</th>
                    <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 13, color: "#6B7280" }}>Role</th>
                    <th style={{ textAlign: "left", padding: "8px 12px", fontSize: 13, color: "#6B7280" }}>Joined</th>
                    <th style={{ textAlign: "right", padding: "8px 12px", fontSize: 13, color: "#6B7280" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                      <td style={{ padding: "8px 12px", fontSize: 14 }}>{u.name || "—"}</td>
                      <td style={{ padding: "8px 12px", fontSize: 14, color: "#6B7280" }}>{u.email}</td>
                      <td style={{ padding: "8px 12px" }}>
                        <select
                          value={u.plan || "free"}
                          onChange={(e) => handleUpdateUser(u.id, "plan", e.target.value)}
                          style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #E5E0D8", fontSize: 13 }}
                        >
                          <option value="free">Free</option>
                          <option value="starter">Starter</option>
                          <option value="pro">Pro</option>
                          <option value="concierge">Concierge</option>
                        </select>
                      </td>
                      <td style={{ padding: "8px 12px" }}>
                        <select
                          value={u.role || "user"}
                          onChange={(e) => handleUpdateUser(u.id, "role", e.target.value)}
                          style={{ padding: "4px 8px", borderRadius: 6, border: "1px solid #E5E0D8", fontSize: 13 }}
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td style={{ padding: "8px 12px", fontSize: 13, color: "#6B7280" }}>
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                      </td>
                      <td style={{ padding: "8px 12px", textAlign: "right" }}>
                        <button
                          onClick={() => handleDeleteUser(u.id, u.name || u.email)}
                          style={{
                            padding: "4px 12px", borderRadius: 6, border: "1px solid #FCA5A5",
                            background: "#FEF2F2", color: "#991B1B", cursor: "pointer", fontSize: 13,
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Support Tab */}
          {activeTab === "support" && (
            <div style={{ padding: 20, background: "#FDFBF7", borderRadius: 12, border: "1px solid #E5E0D8" }}>
              {supportMessages.length === 0 ? (
                <p style={{ color: "#6B7280", textAlign: "center", padding: 40 }}>No support messages yet.</p>
              ) : (
                supportMessages.map((m) => (
                  <div key={m.id} style={{ padding: "12px 0", borderBottom: "1px solid #F3F4F6" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{m.name}</span>
                      <span style={{ fontSize: 12, color: "#6B7280" }}>
                        {m.created_at ? new Date(m.created_at).toLocaleString() : "—"}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: "#6B7280", marginBottom: 4 }}>{m.email} {m.page ? `· ${m.page}` : ""}</div>
                    <div style={{ fontSize: 14, color: "#374151", whiteSpace: "pre-wrap" }}>{m.message}</div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
