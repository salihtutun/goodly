# Goodly — Visibility OS for Small Businesses

> **Mission:** One place to see, fix, and grow your presence on every channel that brings customers.

## What is Goodly?

Goodly is the **visibility operating system for small businesses**. We audit every channel your customers actually use — Google, Instagram, TikTok, YouTube, and AI assistants — and tell you exactly what to fix. One flat fee. One dedicated specialist. One ringing phone.

## Channels Covered

| Channel | Status | Description |
|---------|--------|-------------|
| Google Search / SEO | ✅ v1.9 | On-page audit (50+ signals), AI recommendations, scheduled re-runs, PDF reports |
| Google SERP Tracking | ✅ v1.9 | DuckDuckGo + SerpAPI rank tracking with fallback |
| Instagram / TikTok / YouTube | ✅ v1.9 | Social presence audit + AI suggestions + competitor analysis |
| AI Assistants | ✅ v1.9 | ChatGPT/Siri/Gemini visibility simulation |
| Google Business Profile | ✅ v1.9 | GBP audit, suggestions, competitor comparison |
| LinkedIn | 🟡 Backlog | B2B visibility |
| Yelp + Directories | 🟡 Backlog | Local business citations |

## Pricing

| Plan | Price | Features |
|------|-------|----------|
| **Free** | $0/mo | 5 audits/mo, 2 projects, AI action plan, PDF reports |
| **Starter** | $49/mo | 10 audits/mo, 3 projects, 5 keywords, weekly re-audits, Instagram audit |
| **Pro** | $149/mo | Unlimited audits, 15 projects, 25 keywords, daily re-audits, all social, AI visibility, GBP, white-label PDFs |
| **Concierge** | $1,000/mo | Done-for-you SEO, dedicated specialist, unlimited everything, 90-day page-one guarantee |

## Tech Stack

- **Backend:** Python 3.11, FastAPI, MongoDB (Motor async), Google Gemini 2.5 Flash
- **Frontend:** React 18, Vite 5, Tailwind CSS, Radix UI, Lucide Icons, Recharts
- **Infrastructure:** Google Cloud Run, Vercel, Cloud Build, MongoDB Atlas
- **Payments:** Stripe (subscriptions + customer portal)
- **Email:** Resend (transactional + nurture sequences)
- **AI:** Google Gemini 2.5 Flash (~7s per step)
- **Monitoring:** Sentry, Google Analytics 4

## Architecture

See [architecture.html](./architecture.html) for the full interactive architecture diagram.

```
┌─────────────────────────────────────────────────────────┐
│                  Vercel Edge Network                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │         React Frontend (Vite)                      │  │
│  │  54 pages • 71 routes • Lazy-loaded • Suspense     │  │
│  │  Tailwind CSS • Radix UI • Lucide Icons            │  │
│  │  ErrorBoundary • CookieConsent • Security Headers  │  │
│  └──────────────────────┬────────────────────────────┘  │
└─────────────────────────┼───────────────────────────────┘
                          │ REST API (JWT HttpOnly cookies)
┌─────────────────────────▼───────────────────────────────┐
│                  Google Cloud Run                        │
│  ┌───────────────────────────────────────────────────┐  │
│  │           FastAPI Backend (Python 3.11)            │  │
│  │  83 endpoints • 3 route modules • Rate-limited     │  │
│  │  JWT Auth • RBAC • Feature Flags • CORS            │  │
│  │  SlowAPI • APScheduler • Sentry • Metrics          │  │
│  └──────┬──────────────┬──────────────┬──────────────┘  │
└─────────┼──────────────┼──────────────┼─────────────────┘
          │              │              │
┌─────────▼──┐  ┌────────▼──┐  ┌────────▼──────────┐
│  MongoDB   │  │  Stripe   │  │  Gemini 2.5 Flash │
│  (Atlas)   │  │ (Payments)│  │  (AI + Content)   │
└────────────┘  └───────────┘  └───────────────────┘
┌────────────┐  ┌───────────┐  ┌───────────────────┐
│  Resend    │  │  SerpAPI  │  │  DuckDuckGo       │
│  (Email)   │  │ (Ranking) │  │  (SERP fallback)  │
└────────────┘  └───────────┘  └───────────────────┘
```

## Key Design Decisions

1. **HttpOnly cookies for auth** — No localStorage tokens. Prevents XSS token theft.
2. **Rate limiting on all endpoints** — SlowAPI with per-endpoint limits.
3. **Feature flags on all gated routes** — AI, social, GBP, concierge, referrals, and more gated behind feature flags.
4. **Direct Stripe SDK** — No third-party payment abstraction. Full control.
5. **Google Gemini native SDK** — No LLM proxy. Direct API calls with retry logic.
6. **MongoDB indexes on all query patterns** — Sparse indexes for tokens, compound indexes for user queries.
7. **Multi-stage Docker build** — Frontend built separately, backend runs as non-root user.
8. **Generic error messages** — No internal error details leaked in HTTP responses.
9. **Body size limit** — 5MB max request body to prevent DoS.
10. **Input sanitization** — All user inputs validated and sanitized.

## QA Status (as of July 2026)

| Metric | Value |
|--------|-------|
| Version | 1.9.0 |
| Backend tests | 628 passed |
| Frontend tests | 47 passed |
| Total tests | 675 passed |
| Pages tested (browser) | 54 |
| Console errors | 0 |
| Issues fixed | 100 (across 17 rounds) |
| Production build | 6.74s, zero errors |
| Static assets | 9 verified (all 200) |
| Status | **PRODUCTION READY** ✓ |

## Contact

- **Email:** hello@searchgoodly.com
- **Website:** https://searchgoodly.com
