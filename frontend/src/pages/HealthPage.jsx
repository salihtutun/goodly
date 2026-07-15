import { useState, useEffect } from "react";
import { api } from "@/lib/api";

export default function HealthPage() {
  const [backend, setBackend] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get("/health")
      .then((r) => setBackend(r.data))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <div style={{ maxWidth: 600, margin: "80px auto", padding: 24, fontFamily: "system-ui" }}>
      <h1>Goodly — System Health</h1>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
        <tbody>
          <tr>
            <td style={{ padding: "8px 0", fontWeight: 600 }}>Frontend</td>
            <td style={{ color: "#16a34a" }}>OK</td>
          </tr>
          {backend ? (
            <>
              <tr>
                <td style={{ padding: "8px 0", fontWeight: 600 }}>Backend</td>
                <td style={{ color: backend.status === "ok" ? "#16a34a" : "#dc2626" }}>
                  {backend.status === "ok" ? "OK" : backend.status}
                </td>
              </tr>
              <tr>
                <td style={{ padding: "8px 0", fontWeight: 600 }}>Version</td>
                <td>{backend.version}</td>
              </tr>
              <tr>
                <td style={{ padding: "8px 0", fontWeight: 600 }}>Database</td>
                <td style={{ color: backend.database === "connected" ? "#16a34a" : "#dc2626" }}>
                  {backend.database}
                </td>
              </tr>
              <tr>
                <td style={{ padding: "8px 0", fontWeight: 600 }}>AI Service</td>
                <td style={{ color: backend.ai_service === "configured" ? "#16a34a" : "#f59e0b" }}>
                  {backend.ai_service}
                </td>
              </tr>
              <tr>
                <td style={{ padding: "8px 0", fontWeight: 600 }}>Stripe</td>
                <td style={{ color: backend.stripe === "configured" ? "#16a34a" : "#f59e0b" }}>
                  {backend.stripe}
                </td>
              </tr>
              <tr>
                <td style={{ padding: "8px 0", fontWeight: 600 }}>Email</td>
                <td style={{ color: backend.email === "configured" ? "#16a34a" : "#f59e0b" }}>
                  {backend.email}
                </td>
              </tr>
              <tr>
                <td style={{ padding: "8px 0", fontWeight: 600 }}>Scheduler</td>
                <td style={{ color: backend.scheduler === "enabled" ? "#16a34a" : "#f59e0b" }}>
                  {backend.scheduler}
                </td>
              </tr>
              <tr>
                <td style={{ padding: "8px 0", fontWeight: 600 }}>Uptime</td>
                <td>{Math.floor(backend.uptime_seconds / 3600)}h {Math.floor((backend.uptime_seconds % 3600) / 60)}m</td>
              </tr>
            </>
          ) : error ? (
            <tr>
              <td style={{ padding: "8px 0", fontWeight: 600 }}>Backend</td>
              <td style={{ color: "#dc2626" }}>Unreachable: {error}</td>
            </tr>
          ) : (
            <tr>
              <td colSpan={2} style={{ padding: "16px 0", color: "#6b7280" }}>Checking backend...</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
