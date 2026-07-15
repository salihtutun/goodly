# Goodly — Visibility OS for Small Businesses

> **One place to see, fix, and grow your presence on every channel that brings customers.**
> Google, Instagram, TikTok, YouTube, and AI assistants — audited, scored, and improved.

---

## Business Model

Goodly helps small businesses get found online. We combine AI-powered audits with optional human expertise.

### Plans

| Plan | Price | Best for |
|------|-------|----------|
| **Free** | $0 | Try the tool — 3 audits/month, 1 project |
| **Starter** | $49/mo | Small business — 10 audits, SERP tracking, PDFs, Instagram audit |
| **Pro** | $149/mo | Growing business — unlimited audits, all channels, competitor analysis |
| **Concierge** | $1,000/mo | Done-for-you — dedicated SEO specialist, we do the work |

### Key Features

- **5-Channel Visibility:** Google SEO, SERP tracking, Social (IG/TT/YT), AI Assistants, Google Business Profile
- **AI-Powered Audits:** 50+ signals checked in 10 seconds, AI-generated action plans
- **Scheduled Re-Audits:** Weekly or monthly automated checkups with email digests
- **PDF Reports:** Professional, client-ready reports for every audit
- **Referral System:** Give a friend a free audit, earn rewards
- **Public Audit Page:** No-login audit at `/audit` — paste URL, get score, register to see full report

---

## Quick Start

```bash
# One-command local dev (requires Docker)
docker compose up

# Or run manually:
# Backend
cd backend && pip install -r requirements.txt && uvicorn server:app --reload --port 8001

# Frontend (separate terminal)
cd frontend && npm install && npm start
```

---

## Architecture

```
goodly/
├── backend/              # FastAPI + MongoDB + Gemini AI
│   ├── server.py         # 55+ API endpoints
│   ├── billing.py        # 4-tier plans + Stripe checkout
│   ├── email_service.py  # Resend email (verify, reset, digest, post-audit, referral)
│   ├── ai_service.py     # SEO AI (meta tags, keywords, competitors)
│   ├── ai_visibility.py  # AI assistant visibility simulation
│   ├── gbp_service.py     # Google Business Profile audit
│   ├── social_service.py  # Instagram/TikTok/YouTube audit
│   ├── seo_analyzer.py    # On-page SEO analysis (50+ signals)
│   ├── serp.py            # SERP rank tracking
│   ├── scheduler.py       # Automated monthly audits
│   ├── pdf_export.py      # ReportLab PDF reports
│   ├── prompts/           # Versioned AI prompt registry
│   ├── evals/             # AI evaluation framework
│   └── ai_metrics.py      # Token usage, latency, cost tracking
├── frontend/             # React 19 + Vite + Tailwind + shadcn/ui
│   └── src/pages/        # 25+ pages (Landing, Dashboard, Audit, PublicAudit, etc.)
├── tests/
│   ├── unit/             # 200+ unit tests
│   ├── integration/      # 270+ endpoint tests
│   └── e2e/              # Playwright critical path tests
├── docs/                 # API reference, architecture, deployment, operations
├── .github/workflows/    # CI/CD (test on PR, deploy on merge)
├── Dockerfile            # Multi-stage (Node + Python)
├── docker-compose.yml    # One-command local dev
└── Makefile              # Common dev commands
```

---

## API Endpoints (55+ total)

```
Auth:      /api/auth/register, login, logout, me, verify, forgot-password, reset-password, onboarded, resend-verification
Projects:  /api/projects (CRUD) + schedule
Audits:    /api/audits (CRUD) + /api/audits/{id}/pdf
Public:    /api/public/audit (no auth, rate-limited)
AI Tools:  /api/ai/meta-tags, keywords, competitors
Billing:   /api/billing/plans, me, checkout, status, portal + /api/webhook/stripe
SERP:      /api/serp/check, history
GBP:       /api/gbp/audit, suggestions, competitors, audits
Social:    /api/social/audit, suggestions, competitors, audits
AI Vis:    /api/ai-visibility/check, history
Dashboard: /api/dashboard/summary, visibility
Concierge: /api/concierge/brief + /api/admin/concierge/briefs
Referrals: /api/referrals/invite
Scheduler: /api/scheduler/run-now, runs
Health:    /api/health, /
```

---

## Environment Variables

```bash
# Required for production
MONGO_URL=mongodb+srv://...
JWT_SECRET=<32+ random chars>
GEMINI_API_KEY=...
STRIPE_API_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
SENDER_EMAIL=hello@searchgoodly.com

# Stripe Price IDs (create in Stripe dashboard)
STRIPE_PRICE_ID_STARTER=price_...
STRIPE_PRICE_ID_PRO=price_...
STRIPE_PRICE_ID_CONCIERGE=price_...

# Optional
ENVIRONMENT=production
CORS_ORIGINS=https://searchgoodly.com
FRONTEND_URL=https://searchgoodly.com
ADMIN_EMAIL=admin@searchgoodly.com
ADMIN_PASSWORD=<secure password>
DB_NAME=goodly
SCHEDULER_ENABLED=true
```

---

## Testing

```bash
# All backend tests with coverage
make test                    # 712+ tests, 98% coverage

# Unit tests only
make test-unit

# Integration tests only
make test-integration

# Frontend tests
cd frontend && npm test      # 47 tests, 7/7 suites

# E2E tests (against production)
FRONTEND_URL=https://searchgoodly.com npx playwright test --config=tests/e2e/playwright.config.js tests/e2e/smoke-tests.spec.js      # 123 tests
FRONTEND_URL=https://searchgoodly.com npx playwright test --config=tests/e2e/playwright.config.js tests/e2e/comprehensive.spec.js   # 192 tests
FRONTEND_URL=https://searchgoodly.com npx playwright test --config=tests/e2e/playwright.config.js tests/e2e/full-coverage.spec.js    # 238 tests
FRONTEND_URL=https://searchgoodly.com npx playwright test --config=tests/e2e/playwright.config.js tests/e2e/authenticated.spec.js    # 21 tests
FRONTEND_URL=https://searchgoodly.com npx playwright test --config=tests/e2e/playwright.config.js tests/e2e/deep-coverage.spec.js    # 152 tests

# All E2E tests combined
FRONTEND_URL=https://searchgoodly.com npx playwright test --config=tests/e2e/playwright.config.js   # 534 tests

# Shell smoke test
FRONTEND_URL=https://searchgoodly.com BACKEND_URL=https://api.searchgoodly.com bash scripts/smoke-test.sh  # 55 tests

# Total: 589 E2E + 712 backend + 47 frontend = 1,348 tests
```

---

## Deployment

### Google Cloud Run (Backend)

```bash
gcloud builds submit --config=cloudbuild.yaml
```

### Vercel (Frontend)

1. Connect GitHub repo to Vercel
2. Set `REACT_APP_BACKEND_URL` to your Cloud Run URL
3. Deploy

### Docker Compose (Local)

```bash
docker compose up
```

---

## Tech Stack

- **Backend:** Python 3.11+, FastAPI, Motor (MongoDB async), Google Gemini 2.5 Flash/Pro
- **Frontend:** React 19, Vite, Tailwind CSS, shadcn/ui, Recharts
- **Database:** MongoDB Atlas (cloud) / MongoDB 7 (local)
- **Infrastructure:** Google Cloud Run, Docker, GitHub Actions, Vercel
- **Payments:** Stripe (checkout, portal, webhooks)
- **Email:** Resend
- **AI:** Google Gemini (via google-genai SDK)
- **Scheduling:** APScheduler
- **PDF:** ReportLab

---

## License

Proprietary — All rights reserved.
