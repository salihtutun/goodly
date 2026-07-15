import { usePageMeta } from "@/hooks/usePageMeta";

const changelog = [
  {
    version: "1.9.0",
    date: "2026-07-02",
    title: "Admin Dashboard + System Status",
    changes: [
      "Admin Dashboard with user management, system metrics, and support inbox",
      "Public Status Page at /status with real-time health monitoring",
      "Sentry error tracking integration (backend)",
      "Google Analytics 4 event tracking (frontend)",
      "Swagger/OpenAPI docs with full endpoint descriptions and tags",
      "Knowledge Base with 10+ help articles",
      "Affiliate Program page (referral tracking rolling out soon)",
      "Changelog page (this page!)",
      "Database backup strategy with automated scripts",
      "Load testing scripts with k6 for critical endpoints",
    ],
  },
  {
    version: "1.8.0",
    date: "2026-07-01",
    title: "Free Tools + Landing Page Overhaul",
    changes: [
      "8 free SEO tools: Meta Tag Checker, Page Speed, Mobile-Friendly, Keyword Density, SSL Checker, Schema Validator, Robots.txt Checker, Heading Analyzer",
      "Free Tools Hub page at /tools",
      "Landing page rewritten in business-outcome language",
      "Industry Selector with 5 industry tabs",
      "FAQ section with 8 questions",
      "Annual pricing toggle (save 17%)",
      "4-column footer with sitemap link",
      "Back-to-top button on landing page",
      "Cookie consent banner (GDPR-friendly)",
      "RSS feed for blog at /blog/rss.xml",
    ],
  },
  {
    version: "1.7.0",
    date: "2026-06-30",
    title: "Business-Ready Features",
    changes: [
      "4-tier pricing: Free, Starter ($49/mo), Pro ($149/mo), Concierge ($1,000/mo)",
      "7-day free trial on Starter and Pro plans",
      "Annual billing with 17% discount",
      "Public audit page at /audit (no login required)",
      "Onboarding wizard with 3-step guided setup",
      "Referral invites by email",
      "Google OAuth sign-in",
      "Password show/hide toggle and strength meter",
      "Competitor comparison engine",
      "Achievement system with 11 badges",
      "Rank change alerts (email + in-app notifications)",
      "Dark mode with localStorage persistence",
      "Lazy loading and code splitting (bundle: 879KB → 389KB)",
      "Input validation (URL, email, domain)",
      "Revenue impact estimates in audit reports",
      "Email automation: post-audit, weekly tips, onboarding sequence (5 emails)",
    ],
  },
  {
    version: "1.6.0",
    date: "2026-06-29",
    title: "Infrastructure & Testing",
    changes: [
      "CI/CD pipeline with GitHub Actions (tests + deploy on merge)",
      "Pre-commit hooks (ruff, YAML/JSON validation)",
      "365+ unit tests with 98% backend coverage",
      "Integration tests for all API endpoints",
      "E2E tests with Playwright (33/33 pass)",
      "MLOps infrastructure: prompt registry, evals, AI metrics",
      "Structured JSON logging with request ID tracking",
      "Security headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options",
      "API versioning header (X-API-Version)",
      "Rate limiting with headers (X-RateLimit-*)",
      "Operational runbooks: incident response, SLA, secrets rotation",
      "Docker Compose for one-command local dev",
      "Deployment script for Cloud Run + Vercel",
    ],
  },
  {
    version: "1.5.0",
    date: "2026-06-28",
    title: "Core Platform Launch",
    changes: [
      "SEO audit engine with 50+ checks",
      "AI-powered content generation (Gemini 2.5 Flash)",
      "Social media presence analysis",
      "AI visibility tracking (ChatGPT, Gemini)",
      "Google Business Profile audits",
      "PDF export for audit reports",
      "SERP rank checking via DuckDuckGo",
      "Scheduled weekly audits with APScheduler",
      "Stripe billing integration",
      "Email service with Resend",
      "User authentication with JWT",
      "Role-based access control (admin, user)",
      "Concierge onboarding for high-touch customers",
    ],
  },
];

export default function ChangelogPage() {
  usePageMeta({ title: "Changelog — Goodly", description: "See what's new in Goodly — product updates, new features, and improvements." });

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <h1 style={{ fontSize: 36, fontWeight: 700, color: "#1A201A", marginBottom: 8 }}>
          Changelog
        </h1>
        <p style={{ fontSize: 16, color: "#6B7280" }}>
          Every update, improvement, and new feature — in one place.
        </p>
      </div>

      <div style={{ position: "relative" }}>
        {/* Timeline line */}
        <div
          style={{
            position: "absolute",
            left: 24,
            top: 0,
            bottom: 0,
            width: 2,
            background: "#E5E0D8",
          }}
        />

        {changelog.map((release, i) => (
          <div key={release.version} style={{ position: "relative", paddingLeft: 60, marginBottom: 48 }}>
            {/* Timeline dot */}
            <div
              style={{
                position: "absolute",
                left: 16,
                top: 8,
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: i === 0 ? "#2D3E32" : "#E5E0D8",
                border: i === 0 ? "3px solid #2D3E32" : "3px solid #D1D5DB",
                zIndex: 1,
              }}
            />

            {/* Release card */}
            <div
              style={{
                padding: 24,
                background: i === 0 ? "#F0F7F4" : "#FDFBF7",
                borderRadius: 16,
                border: i === 0 ? "2px solid #2D3E32" : "1px solid #E5E0D8",
              }}
            >
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
                <span
                  style={{
                    padding: "2px 10px",
                    borderRadius: 12,
                    fontSize: 13,
                    fontWeight: 600,
                    background: i === 0 ? "#2D3E32" : "#F3F4F6",
                    color: i === 0 ? "#FDFBF7" : "#374151",
                  }}
                >
                  v{release.version}
                </span>
                <span style={{ fontSize: 14, color: "#6B7280" }}>{release.date}</span>
                {i === 0 && (
                  <span style={{ fontSize: 12, color: "#10B981", fontWeight: 600 }}>● Latest</span>
                )}
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 600, color: "#1A201A", marginBottom: 12 }}>
                {release.title}
              </h2>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {release.changes.map((change, j) => (
                  <li key={j} style={{ fontSize: 15, color: "#374151", marginBottom: 6, lineHeight: 1.6 }}>
                    {change}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center", marginTop: 32, padding: 24, background: "#FDFBF7", borderRadius: 16, border: "1px solid #E5E0D8" }}>
        <p style={{ fontSize: 15, color: "#6B7280" }}>
          Want to stay updated? Follow us on{" "}
          <a href="https://twitter.com/goodly" style={{ color: "#2D3E32", fontWeight: 600 }}>Twitter</a>
          {" "}or subscribe to our{" "}
          <a href="/blog/rss.xml" style={{ color: "#2D3E32", fontWeight: 600 }}>RSS feed</a>.
        </p>
      </div>
    </div>
  );
}
