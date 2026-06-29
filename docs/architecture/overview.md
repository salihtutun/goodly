# Goodly — Architecture Overview

## System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                     Client (Browser)                      │
│  React 18 SPA → react-router-dom → shadcn/ui components   │
│  Auth: HttpOnly JWT cookie (auto-sent withCredentials)    │
└────────────────────────┬─────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼─────────────────────────────────┐
│                 Google Cloud Run (FastAPI)                 │
│                                                           │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────┐  │
│  │  Auth   │ │ Projects │ │  Audits  │ │ AI Services  │  │
│  │  JWT    │ │   CRUD   │ │ SEO/SERP │ │ Gemini 2.5   │  │
│  └─────────┘ └──────────┘ └──────────┘ └─────────────┘  │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────┐  │
│  │ Social  │ │   GBP    │ │ Billing  │ │  Scheduler   │  │
│  │ IG/TT/YT│ │  Audit   │ │  Stripe  │ │  APScheduler │  │
│  └─────────┘ └──────────┘ └──────────┘ └─────────────┘  │
│                                                           │
│  Middleware: CORS │ Rate Limiting (SlowAPI) │ Logging     │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│                    MongoDB Atlas                           │
│  Collections: users │ projects │ audits │ serp_checks     │
│  social_audits │ gbp_audits │ ai_visibility_checks        │
│  payment_transactions │ concierge_briefs │ ai_history     │
│  scheduled_runs                                           │
└──────────────────────────────────────────────────────────┘
```

## Data Flow

### Audit Flow
1. User submits URL → `POST /api/audits`
2. Backend fetches page via httpx + BeautifulSoup
3. SEO analyzer scores: meta tags, headings, content, performance, links
4. AI service (Gemini) generates recommendations
5. Results stored in MongoDB, returned to frontend
6. Frontend renders score ring, category breakdown, issues list, AI action plan

### AI Visibility Flow
1. User submits business name + category → `POST /api/ai-visibility/check`
2. Backend generates 3-5 natural language queries
3. Gemini 2.5 Pro simulates how ChatGPT, Claude, Perplexity, Gemini would respond
4. Returns: overall visibility score, per-assistant breakdown, blocking factors, improvement plan
5. Results stored for history

### Billing Flow
1. User clicks upgrade → `POST /api/billing/checkout`
2. Backend creates Stripe Checkout Session (subscription mode if Price ID configured)
3. User completes payment on Stripe
4. Stripe webhook → `POST /api/webhook/stripe` → updates user plan
5. User can manage subscription via Stripe Customer Portal

## Security Model

| Layer | Mechanism |
|-------|-----------|
| Authentication | JWT in HttpOnly, Secure, SameSite=Lax cookie |
| Authorization | User-scoped queries (user_id filter on all data) |
| Rate Limiting | SlowAPI: 3-5/min auth, 5-10/min AI, 200/min default |
| CORS | Restricted origins in production, localhost in dev |
| Input Validation | Pydantic models + sanitize.py for HTML/XSS |
| Secrets | Google Secret Manager in production, .env in dev |
| Container | Non-root user, HEALTHCHECK, minimal base image |

## AI Service Architecture

```
┌────────────────────────────────────────────┐
│              llm_client.py                  │
│  ┌──────────────────────────────────────┐  │
│  │ ask_json(prompt, system, model, ...) │  │
│  │  - Retry with exponential backoff    │  │
│  │  - Token usage logging              │  │
│  │  - JSON extraction + fallback       │  │
│  └──────────────────────────────────────┘  │
│  Models: gemini-2.5-flash (default)        │
│          gemini-2.5-pro (complex tasks)    │
└────────────────────────────────────────────┘
         ↑              ↑              ↑
    ai_service    social_service  gbp_service
    ai_visibility
```

## Database Schema

### users
```
{ id, email, password_hash, name, role, plan, onboarded,
  email_verified, verification_token?, reset_token?,
  reset_token_expires?, stripe_customer_id?,
  plan_started_at?, created_at }
```

### projects
```
{ id, user_id, name, url, description, target_keywords,
  schedule, next_audit_at, last_audit_at, last_score, created_at }
```

### audits
```
{ id, user_id, project_id, url, created_at, month_key,
  result: { overall_score, categories, issues, metadata, ... },
  ai_recommendations: { summary, priority_actions, wins, next_30_days } }
```
