# RootedSEO — Product Requirements Document

> **Last updated:** 2026-06-28
> **Status:** v1.1 — Stripe billing, PDF export, SERP tracking, onboarding tour all live and verified.

## 1. Original Problem Statement
> "In these days, I want to develop the framework to optimize of SEO for small companies. Can you help me to do it"

## 2. User Choices (gathered across iterations)
- **Core features (v1.0)**: SEO audit + keyword research + AI content/meta + competitor analysis
- **AI**: Claude Sonnet 4.6 via Emergent Universal LLM key
- **Auth**: Email + password (JWT)
- **Monetization (v1.1)**: Free tier with limits + Pro $19/mo + Agency $49/mo via Emergent Stripe test key
- **Scheduled audits**: Queue in-app (no email yet)
- **Optional features (v1.1)**: PDF export, SERP rank tracking, onboarding tour — all built

## 3. Target User Personas
- **Small shop owner**: non-technical, wants plain-English advice + monthly check-ups
- **Side-hustle founder**: ranks locally without an agency
- **Tiny in-house marketer / freelancer**: tracks multiple client sites (Agency plan)

## 4. Architecture
- **Backend**: FastAPI + Motor + bcrypt + PyJWT + httpx + BeautifulSoup + emergentintegrations (Claude Sonnet 4.6 + Stripe) + ReportLab.
- **Frontend**: React 19 + react-router 7 + Tailwind + shadcn/ui + Recharts + Sonner + axios.
- **Plans**: server-authoritative `PLANS` dict in `/app/backend/billing.py` (audit_limit, project_limit, perks).
- **DB collections**: `users`, `projects`, `audits`, `ai_history`, `payment_transactions`, `serp_checks`.

## 5. Implemented
### v1.0 (2026-06-28)
- Landing page, JWT auth (register/login/logout/me, seeded demo + admin)
- Dashboard with stats + recent audits + projects preview
- Projects CRUD with score-history line chart
- Full on-page SEO audit (8 weighted categories: meta_tags, headings, performance, mobile, accessibility, content, social, security) + plain-English issues list
- AI Studio (meta tag writer, keyword research, competitor analysis) via Claude Sonnet 4.6
- Audit detail with AI action plan, issues by severity, raw details tabs

### v1.1 (2026-06-28)
- **Pricing section on landing** (Free / Pro highlighted / Agency)
- **Stripe checkout** via Emergent test key: `/api/billing/checkout` → Stripe redirect → `/api/billing/status/{id}` polling → idempotent plan upgrade. Webhook at `/api/webhook/stripe`.
- **Billing page** at `/app/billing` with current plan, usage tiles, upgrade buttons, transaction history table.
- **Free-tier enforcement**: 3 audits/month + 1 project. 402 with upgrade message on limit hit.
- **PDF export** of audit reports (`GET /api/audits/{id}/pdf`) — Pro+ only, ReportLab with brand colors and HTML-escaped content.
- **SERP rank tracking** (`POST /api/serp/check`) using DuckDuckGo HTML — Pro+ only.
- **Scheduled monthly audits** (`POST /api/projects/{id}/schedule`) — Pro+ only, sets `next_audit_at` 30 days out.
- **Onboarding tour** — 4-step modal on first login; persisted via `POST /api/auth/onboarded`.

### Verified
- Iteration 2 testing: backend 41/41 pytest pass, frontend critical flows green. Smoke-tested PDF (10KB valid `%PDF-1.4`), SERP (rank #1 for example.com on test query), Stripe session creation (valid checkout URL), billing polling, schedule toggle.

## 6. Backlog (P1 / P2)
- **P1**: Scheduled-audit cron worker that actually runs the queued audits + email digest (Resend/SendGrid integration).
- **P1**: Stripe Customer Portal for self-service cancel/upgrade.
- **P2**: Whitelabel agency reports (custom logo on PDF).
- **P2**: Multi-page audits (crawl whole site, not just one URL).
- **P2**: Real SERP via SerpAPI / DataForSEO for production-grade accuracy.
- **P2**: Team accounts (multiple users per Agency).
- **P2**: Slack / email alerts when audit score drops.
- **P3**: AI page-rewrite tool (paste URL → get full optimized HTML).

## 7. Next Action Items
- Decide on email provider (Resend recommended) to ship scheduled-audit notifications.
- Decide whether to keep DuckDuckGo SERP free or upgrade to SerpAPI (paid, more accurate).
- Set up Stripe Customer Portal for production billing self-service.
