# RootedSEO — Product Requirements Document

> **Last updated:** 2026-06-29
> **Status:** v1.2 — Scheduler + Resend digest + SerpAPI fallback + Stripe Customer Portal shipped.

## 1. Original Problem Statement
> "In these days, I want to develop the framework to optimize of SEO for small companies. Can you help me to do it"

## 2. User Choices (across all iterations)
- v1.0: All core features (audit + keywords + AI content + competitor analysis), Claude Sonnet 4.6, JWT email/password auth, saved projects, default visual design.
- v1.1: Free tier + Pro $19/mo + Agency $49/mo via Emergent Stripe test key. Optional features: PDF export, SERP tracking, onboarding tour.
- v1.2: Resend for scheduled audit email digest (mock until key provided), SerpAPI with DDG fallback, Stripe Customer Portal, hourly scheduler.

## 3. Architecture
- **Backend**: FastAPI + Motor + bcrypt + PyJWT + httpx + BeautifulSoup + emergentintegrations + ReportLab + APScheduler + Resend SDK + Stripe SDK (raw, for Portal).
- **Frontend**: React 19 + react-router 7 + Tailwind + shadcn/ui + Recharts + Sonner + axios.
- **Background worker**: APScheduler hourly, finds `projects.schedule='monthly'` with `next_audit_at <= now`, runs audit, emails digest, advances next_audit_at +30d.
- **DB collections**: `users`, `projects`, `audits`, `ai_history`, `payment_transactions`, `serp_checks`, `scheduled_runs`.

## 4. Implemented
### v1.0 (2026-06-28)
- Landing + JWT auth + Dashboard + Projects + Audit (8 cat scores + issues) + AI Studio + Audit Detail (action plan / issues / details tabs).

### v1.1 (2026-06-28)
- Pricing section, Stripe Checkout, Billing page, free-tier limits, PDF export (Pro+), SERP tracking via DDG (Pro+), Schedule toggle (Pro+), Onboarding tour.

### v1.2 (2026-06-29)
- **APScheduler** runs hourly inside FastAPI, checks for due monthly audits, fires `analyze_url` + Claude AI recs + advances `next_audit_at`.
- **Resend digest email** with brand-styled HTML (score, delta vs last month, top 5 issues, link to full report). Gracefully MOCKS sends when `RESEND_API_KEY` is empty — fully end-to-end testable now.
- **SerpAPI integration** with **DuckDuckGo fallback**: uses SerpAPI when `SERPAPI_KEY` is set, falls back to DDG on missing key or SerpAPI error.
- **Stripe Customer Portal**: `POST /api/billing/portal` returns a hosted-portal URL using raw `stripe.billing_portal.Session.create`. Automatically captures `stripe_customer_id` from the latest paid Checkout Session.
- **Admin tools**: `POST /api/scheduler/run-now` (admin-only) lets you manually fire all due audits. `GET /api/scheduler/runs` returns the user's recent automated-run history with per-run email status.
- **Billing page additions**: "Manage subscription" button (visible to non-free users) + "Recent automated runs" history section.

### Verified
- Iteration 3 testing: **58/58 backend tests pass** (17 new + 41 regression); frontend critical flows green. Smoke-tested end-to-end: backdated project → admin trigger → 1 due → 1 ran → audit created (score 68) → digest email mocked → scheduled_runs history visible in UI.

## 5. Backlog
- **P1**: User-provided Resend API key (currently mocked). Add a UI for users to BYO their own Resend key + sender email + verified-domain check.
- **P1**: Stripe Customer Portal happy-path live verification (requires a real test-card checkout in browser).
- **P2**: Whitelabel agency PDF (custom logo + brand color).
- **P2**: Multi-page crawl (audit a whole site, not just one URL).
- **P2**: Production SERP via SerpAPI / DataForSEO with paid key.
- **P2**: Team accounts (multiple users per Agency).
- **P2**: Slack / email alerts when audit score drops.
- **P3**: AI page-rewrite tool (paste URL → get full optimized HTML).

## 6. Next Action Items
- Decide on production Resend / SerpAPI API keys (both currently optional — system runs without them).
- Drive at least one live Stripe test checkout to verify the Customer Portal flow end-to-end.
- Decide on a domain to verify in Resend so sender doesn't have to be `onboarding@resend.dev`.
