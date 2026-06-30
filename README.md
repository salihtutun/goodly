# Goodly — Visibility OS for Startups

One place to see, fix, and grow your presence on every channel that brings customers: Google, Instagram, TikTok, YouTube, and AI assistants.

## Quick Start

```bash
# Install dependencies
make install

# Run backend
make run-backend

# Run frontend (separate terminal)
make run-frontend

# Run all tests
make test
```

## Architecture

```
goodly/
├── backend/           # FastAPI + MongoDB + Gemini AI
│   ├── server.py      # 53 API endpoints
│   ├── ai_service.py  # SEO AI (meta tags, keywords, competitors)
│   ├── ai_visibility.py  # AI assistant visibility simulation
│   ├── gbp_service.py # Google Business Profile audit
│   ├── social_service.py  # Instagram/TikTok/YouTube audit
│   ├── seo_analyzer.py    # On-page SEO analysis
│   ├── serp.py        # SERP rank tracking (DuckDuckGo + SerpAPI)
│   ├── billing.py     # Stripe subscription management
│   ├── scheduler.py   # Monthly automated audits
│   ├── email_service.py   # Resend email (verification, reset, digests)
│   ├── pdf_export.py  # ReportLab PDF reports
│   ├── llm_client.py  # Google Gemini 2.5 Flash/Pro client
│   ├── prompts/       # Versioned AI prompt registry
│   ├── evals/         # AI evaluation framework
│   ├── ai_metrics.py  # Token usage, latency, cost tracking
│   ├── logging_config.py  # Structured JSON logging
│   ├── metrics.py     # Request latency middleware
│   └── security_headers.py  # HSTS, CSP, X-Frame-Options
├── frontend/          # React 19 + Vite + Tailwind + shadcn/ui
│   └── src/pages/     # 22 pages (Landing, Dashboard, Audit, GBP, Social, etc.)
├── tests/
│   ├── unit/          # 16 test files, 100% on 14/15 core modules
│   ├── integration/   # 70 endpoint tests via TestClient + mongomock
│   └── e2e/           # Playwright critical path tests
├── docs/
│   ├── api/reference.md
│   ├── architecture/overview.md
│   ├── deployment/guide.md
│   ├── guides/development.md
│   └── operations/    # Incident response, SLA, secrets rotation
├── .github/workflows/ # CI/CD (test on PR, deploy on merge)
├── Dockerfile         # Multi-stage (Node + Python)
├── cloudbuild.yaml    # GCP Cloud Run deployment
└── Makefile           # Common dev commands
```

## Features

### 5-Channel Visibility
- **Google Search / SEO** — on-page audit, AI recommendations, scheduled re-runs, PDF reports
- **Google SERP Tracking** — DuckDuckGo (free) + SerpAPI (optional)
- **Social Media** — Instagram, TikTok, YouTube audit + AI suggestions + competitor analysis
- **AI Assistants** — ChatGPT, Claude, Perplexity, Gemini visibility simulation
- **Google Business Profile** — listing audit, improvement suggestions, competitor comparison

### Business Features
- **Stripe Billing** — checkout, customer portal, webhooks
- **Email Flows** — verification, password reset, monthly digests
- **Scheduled Audits** — automatic monthly re-runs with email reports
- **PDF Export** — professional audit reports
- **Concierge Brief** — onboarding form for done-for-you customers

### Plans
| Feature | Free | Concierge ($1,000/mo) |
|---------|------|----------------------|
| SEO Audits | 3/month | Unlimited |
| Projects | 1 | 25 |
| SERP Tracking | — | ✓ |
| Scheduled Audits | — | ✓ |
| PDF Export | — | ✓ |
| Social Audit | — | ✓ |
| AI Visibility | — | ✓ |
| GBP Audit | — | ✓ |
| Done-for-You | — | ✓ |

## API Endpoints (53 total)

```
Auth:     /api/auth/register, login, logout, me, verify, forgot-password, reset-password, onboarded, resend-verification
Projects: /api/projects (CRUD)
Audits:   /api/audits (CRUD) + /api/audits/{id}/pdf
AI Tools: /api/ai/meta-tags, keywords, competitors
Billing:  /api/billing/plans, me, checkout, status, portal + /api/webhook/stripe
SERP:     /api/serp/check, history
GBP:      /api/gbp/audit, suggestions, competitors, audits
Social:   /api/social/audit, suggestions, competitors, audits
AI Vis:   /api/ai-visibility/check, history
Dashboard:/api/dashboard/summary, visibility
Concierge:/api/concierge/brief + /api/admin/concierge/briefs
Scheduler:/api/scheduler/run-now, runs
Health:   /api/health, /
```

## Environment Variables

```bash
# Required
MONGO_URL=mongodb+srv://...
JWT_SECRET=<64+ random chars>
GEMINI_API_KEY=...
STRIPE_API_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
RESEND_API_KEY=re_...
SENDER_EMAIL=hello@goodly.app

# Optional
ENVIRONMENT=production
CORS_ORIGINS=https://goodly.app
PRODUCTION_DOMAIN=https://goodly.app
SCHEDULER_ENABLED=true
ADMIN_EMAIL=admin@goodly.app
ADMIN_PASSWORD=...
DB_NAME=goodly
```

## Testing

```bash
# All tests with coverage
make test                    # 380 tests, 84% coverage

# Unit tests only
make test-unit

# Integration tests only
make test-integration

# HTML coverage report
make coverage
```

## Deployment

```bash
# Google Cloud Run
gcloud builds submit --config=cloudbuild.yaml

# Or use Makefile
make deploy
```

## Tech Stack

- **Backend:** Python 3.11+, FastAPI, Motor (MongoDB async), Google Gemini 2.5 Flash/Pro
- **Frontend:** React 19, Vite, Tailwind CSS, shadcn/ui, Recharts
- **Database:** MongoDB Atlas (cloud)
- **Infrastructure:** Google Cloud Run, Docker, GitHub Actions
- **Payments:** Stripe (checkout, portal, webhooks)
- **Email:** Resend
- **AI:** Google Gemini (via google-genai SDK)
- **Scheduling:** APScheduler
- **PDF:** ReportLab

## License

Proprietary — All rights reserved.
