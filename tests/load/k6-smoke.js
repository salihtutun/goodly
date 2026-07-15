import http from "k6/http";
import { check, sleep, group } from "k6";
import { Rate, Trend } from "k6/metrics";

// Custom metrics
const errorRate = new Rate("errors");
const auditDuration = new Trend("audit_duration");
const healthDuration = new Trend("health_duration");

// Configuration
const BASE_URL = __ENV.BASE_URL || "https://api.searchgoodly.com";
const API_URL = `${BASE_URL}/api`;

export const options = {
  // Smoke test by default — override with --env STAGE=load|stress|soak
  stages: [
    { duration: "30s", target: 5 },   // Ramp up to 5 users
    { duration: "1m", target: 5 },     // Stay at 5 users
    { duration: "30s", target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000"], // 95% of requests under 2s
    errors: ["rate<0.1"],              // Error rate under 10%
  },
};

// Test data
const TEST_URL = "https://example.com";
const TEST_EMAIL = `loadtest_${Date.now()}@goodly.test`;
const TEST_PASSWORD = "TestPass123!";

export default function () {
  let token = "";

  group("Health Check", () => {
    const res = http.get(`${API_URL}/health`, {
      tags: { name: "health" },
    });
    healthDuration.add(res.timings.duration);
    check(res, {
      "health status 200": (r) => r.status === 200,
      "health status ok": (r) => r.json("status") === "ok",
    }) || errorRate.add(1);
    sleep(1);
  });

  group("Public Audit", () => {
    const res = http.post(
      `${API_URL}/public/audit`,
      JSON.stringify({ url: TEST_URL }),
      {
        headers: { "Content-Type": "application/json" },
        tags: { name: "public_audit" },
      }
    );
    auditDuration.add(res.timings.duration);
    check(res, {
      "public audit 200": (r) => r.status === 200,
      "public audit has score": (r) => r.json("score") !== undefined,
    }) || errorRate.add(1);
    sleep(1);
  });

  group("Auth — Register", () => {
    const res = http.post(
      `${API_URL}/auth/register`,
      JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        name: "Load Test User",
      }),
      {
        headers: { "Content-Type": "application/json" },
        tags: { name: "register" },
      }
    );
    check(res, {
      "register 200 or 409": (r) => r.status === 200 || r.status === 409,
    }) || errorRate.add(1);
    sleep(1);
  });

  group("Auth — Login", () => {
    const res = http.post(
      `${API_URL}/auth/login`,
      JSON.stringify({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
      }),
      {
        headers: { "Content-Type": "application/json" },
        tags: { name: "login" },
      }
    );
    check(res, {
      "login 200": (r) => r.status === 200,
      "login has token": (r) => r.json("token") !== undefined,
    }) || errorRate.add(1);
    token = res.json("token") || "";
    sleep(1);
  });

  if (token) {
    const authHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    group("Authenticated — Dashboard", () => {
      const res = http.get(`${API_URL}/dashboard`, {
        headers: authHeaders,
        tags: { name: "dashboard" },
      });
      check(res, {
        "dashboard 200": (r) => r.status === 200,
      }) || errorRate.add(1);
      sleep(1);
    });

    group("Authenticated — Projects", () => {
      const res = http.get(`${API_URL}/projects`, {
        headers: authHeaders,
        tags: { name: "projects" },
      });
      check(res, {
        "projects 200": (r) => r.status === 200,
      }) || errorRate.add(1);
      sleep(1);
    });

    group("Authenticated — Audit", () => {
      const res = http.post(
        `${API_URL}/audits`,
        JSON.stringify({ url: TEST_URL }),
        {
          headers: authHeaders,
          tags: { name: "audit" },
        }
      );
      auditDuration.add(res.timings.duration);
      check(res, {
        "audit 200 or 429": (r) => r.status === 200 || r.status === 429,
      }) || errorRate.add(1);
      sleep(1);
    });

    group("Authenticated — Plans", () => {
      const res = http.get(`${API_URL}/billing/plans`, {
        headers: authHeaders,
        tags: { name: "plans" },
      });
      check(res, {
        "plans 200": (r) => r.status === 200,
      }) || errorRate.add(1);
      sleep(1);
    });
  }

  group("Support Contact", () => {
    const res = http.post(
      `${API_URL}/support/contact`,
      JSON.stringify({
        name: "Load Test",
        email: "loadtest@goodly.test",
        message: "This is an automated load test message.",
      }),
      {
        headers: { "Content-Type": "application/json" },
        tags: { name: "support" },
      }
    );
    check(res, {
      "support 200": (r) => r.status === 200,
    }) || errorRate.add(1);
    sleep(1);
  });

  group("API Root", () => {
    const res = http.get(`${API_URL}/`, {
      tags: { name: "api_root" },
    });
    check(res, {
      "api root 200": (r) => r.status === 200,
    }) || errorRate.add(1);
    sleep(1);
  });
}

export function handleSummary(data) {
  return {
    "tests/reports/k6-summary.json": JSON.stringify(data, null, 2),
    stdout: `
============================================
  Goodly API Load Test Summary
============================================
Total Requests:      ${data.metrics.http_reqs?.values?.count || 0}
Failed Requests:     ${data.metrics.http_req_failed?.values?.rate ? (data.metrics.http_req_failed.values.rate * 100).toFixed(1) + "%" : "N/A"}
Avg Duration:        ${data.metrics.http_req_duration?.values?.avg ? data.metrics.http_req_duration.values.avg.toFixed(0) + "ms" : "N/A"}
P95 Duration:        ${data.metrics.http_req_duration?.values?.["p(95)"] ? data.metrics.http_req_duration.values["p(95)"].toFixed(0) + "ms" : "N/A"}
Peak VUs:            ${data.metrics.vus_max?.values?.value || 0}
============================================
`,
  };
}
