# Goodly — Visibility OS for Startups

> **Mission:** One place to see, fix, and grow your presence on every channel that brings customers.

## What is Goodly?

Goodly is the **visibility operating system for startups**. We audit every channel your customers actually use — Google, Instagram, TikTok, YouTube, and AI assistants — and tell you exactly what to fix. One flat fee. One dedicated specialist. One ringing phone.

## Channels Covered

| Channel | Status | Description |
|---------|--------|-------------|
| Google Search / SEO | ✅ v1.0 | On-page audit, AI recommendations, scheduled re-runs, PDF reports |
| Google SERP Tracking | ✅ v1.1 | DuckDuckGo + SerpAPI rank tracking |
| Instagram / TikTok / YouTube | ✅ v1.5 | Social presence audit + AI suggestions + competitor analysis |
| AI Assistants | ✅ v1.6 | ChatGPT/Claude/Perplexity/Gemini visibility simulation |
| Google Business Profile | ✅ v1.7 | GBP audit, suggestions, competitor comparison |
| LinkedIn | 🟡 Backlog | B2B startup visibility |
| Yelp + Directories | 🟡 Backlog | Local business citations |

## Pricing

| Plan | Price | Features |
|------|-------|----------|
| **Self-serve** | $0/mo | 3 audits/mo, 1 project, AI action plan |
| **Concierge** | $1,000/mo | Done-for-you SEO, dedicated specialist, unlimited audits, 25 properties, all channels, 90-day page-one guarantee |

## Tech Stack

- **Backend:** Python 3.11, FastAPI, MongoDB (Motor async), Google Gemini 2.5
- **Frontend:** React 18, Tailwind CSS, shadcn/ui, Recharts
- **Infrastructure:** Google Cloud Run, Cloud Build, Secret Manager, MongoDB Atlas
- **Payments:** Stripe (subscriptions + customer portal)
- **Email:** Resend
- **AI:** Google Gemini 2.5 Flash (fast) + 2.5 Pro (complex reasoning)

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (React)                  │
│  Landing → Auth → Dashboard → Audit → Social → GBP  │
│              → AI Tools → AI Visibility → Billing    │
└──────────────────────┬──────────────────────────────┘
                       │ REST API (JWT cookies)
┌──────────────────────▼──────────────────────────────┐
│                 Backend (FastAPI)                    │
│  Auth │ Projects │ Audits │ AI │ Social │ GBP │ PDF  │
│  SERP │ Scheduler │ Billing │ Concierge │ Webhooks  │
└──────┬───────────────────────────────┬──────────────┘
       │                               │
┌──────▼──────┐              ┌────────▼────────┐
│   MongoDB   │              │  Google Gemini   │
│  (Atlas)    │              │  2.5 Flash/Pro  │
└─────────────┘              └─────────────────┘
```

## Key Design Decisions

1. **HttpOnly cookies for auth** — No localStorage tokens. Prevents XSS token theft.
2. **Rate limiting on all endpoints** — SlowAPI with per-endpoint limits.
3. **Direct Stripe SDK** — No third-party payment abstraction. Full control.
4. **Google Gemini native SDK** — No LLM proxy. Direct API calls with retry logic.
5. **MongoDB indexes on all query patterns** — Sparse indexes for tokens, compound indexes for user queries.
6. **Multi-stage Docker build** — Frontend built separately, backend runs as non-root user.

## Contact

- **Email:** hello@goodly.app
- **Website:** https://goodly.app
