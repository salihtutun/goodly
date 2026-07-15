# Goodly Improvement Plan
> July 3, 2026 — Comprehensive audit and improvement roadmap

---

## Current State Summary

Goodly is a "Visibility OS for Small Businesses" — an SEO audit platform with impressive scope:

| Dimension | Status |
|-----------|--------|
| Backend | FastAPI + MongoDB + Gemini 2.5 Flash/Pro, 1911-line monolithic server.py |
| Frontend | React 19 + Vite + Tailwind + shadcn/ui, 50+ pages, lazy-loaded |
| Pricing | 4 tiers: Free ($0), Starter ($49/mo), Pro ($149/mo), Concierge ($1,000/mo) |
| Channels | Google SEO, SERP, Social (IG/TT/YT), AI Visibility, GBP |
| APIs | 55+ endpoints, Pydantic models, rate limiting (SlowAPI) |
| Testing | 475+ tests, 98% coverage, unit + integration + e2e |
| Infrastructure | Docker, GCP Cloud Run, Vercel, Stripe, Resend, APScheduler |
| Marketing | Excellent research: competitive analysis, personas, GTM strategy, pain points |

The product is mature and well-architected for its stage. The improvements below are organized by impact and effort.

---

## Tier 1: High Impact, Lower Effort (Do First)

### 1. Break Up Monolithic server.py
**Problem:** 1911 lines in one file. Hard to navigate, test, and maintain. All routes, models, helpers, and middleware config in one place.
**Solution:** Split into route modules under `backend/routes/`:
```
backend/
├── routes/
│   ├── __init__.py
│   ├── auth.py          # register, login, logout, verify, reset, google
│   ├── projects.py      # CRUD + schedule
│   ├── audits.py        # run, list, get, delete, pdf, improvement, public
│   ├── ai_tools.py      # meta-tags, keywords, competitors
│   ├── social.py        # audit, suggestions, competitors, history
│   ├── gbp.py           # audit, suggestions, competitors, history
│   ├── ai_visibility.py # check, history
│   ├── billing.py       # plans, me, checkout, status, portal, webhook
│   ├── dashboard.py     # summary, visibility, achievements, notifications
│   ├── serp.py          # check, history
│   ├── concierge.py     # brief, admin briefs
│   ├── admin.py         # users, stats, support messages
│   ├── referrals.py     # invite
│   ├── scheduler.py     # run-now, runs
│   └── support.py       # contact
├── models/              # Pydantic models (extracted from server.py)
│   ├── __init__.py
│   ├── auth.py
│   ├── projects.py
│   └── ...
└── server.py            # ~100 lines: app creation, middleware, lifespan, router mounting
```
**Files:** `backend/server.py` → split into ~15 route files + ~8 model files
**Risk:** Low — pure refactor, tests catch regressions

### 2. Add Request IDs and Structured Logging Context
**Problem:** No request correlation ID. Hard to trace a single user request through logs.
**Solution:** Add `X-Request-ID` middleware that generates/inherits UUID, injects into logging context.
**Files:** New `backend/middleware/request_id.py`, update `logging_config.py`
**Risk:** Very low

### 3. Add Redis/Memory Cache for Dashboard Queries
**Problem:** Dashboard hits MongoDB for every page load. `dashboard/summary` and `dashboard/visibility` do 5+ queries each.
**Solution:** Add a simple TTL cache (60s) using `cachetools` or Redis for:
- Dashboard summary (per user)
- Plan definitions (global)
- Health check (global, 30s)
**Files:** New `backend/cache.py`, update dashboard/summary and dashboard/visibility endpoints
**Risk:** Low — cache invalidation is time-based, not event-based

### 4. Add Rate Limiting to Missing Endpoints
**Problem:** Several endpoints lack rate limits: `/auth/me`, `/auth/onboarded`, `/projects/*`, `/audits/*`, `/dashboard/*`, `/billing/me`, `/billing/plans`, `/concierge/brief`, `/admin/*`, `/referrals/invite`, `/social/*`, `/gbp/*`, `/serp/*`
**Solution:** Add appropriate rate limits:
- Auth read endpoints: 30/min
- CRUD endpoints: 60/min
- Dashboard: 30/min
- Admin: 20/min
- Social/GBP/SERP: 10/min (already on some)
**Files:** `backend/server.py` (or route files after refactor)
**Risk:** Low — SlowAPI is already integrated

### 5. Add Input Sanitization to All User-Facing String Fields
**Problem:** Some endpoints accept raw strings without sanitization (e.g., project descriptions, concierge brief fields).
**Solution:** Apply `sanitize_html()` and `sanitize_name()` consistently across all string inputs. Add Pydantic field validators.
**Files:** `backend/server.py`, `backend/validators.py`
**Risk:** Low

---

## Tier 2: Medium Impact, Medium Effort

### 6. Implement Proper Service Layer
**Problem:** Business logic is mixed with HTTP concerns. Hard to test in isolation, hard to reuse (e.g., scheduled audits duplicate audit logic).
**Solution:** Extract service classes:
```
backend/services/
├── audit_service.py     # run_audit, get_improvement, etc.
├── project_service.py   # create, update, delete with validation
├── user_service.py      # register, update plan, achievements
├── billing_service.py   # checkout, webhook handling, plan management
├── notification_service.py
└── visibility_service.py # unified score calculation
```
**Files:** New `backend/services/` directory, refactor route handlers to delegate
**Risk:** Medium — significant refactor, but tests protect

### 7. Add Background Task Queue (Redis + ARQ / Cloud Tasks)
**Problem:** Scheduled audits run in-process with APScheduler. If the server restarts, scheduled jobs are lost. PDF generation blocks the event loop. Email sending is synchronous.
**Solution:** 
- Option A (lightweight): Redis + ARQ for async task processing
- Option B (GCP-native): Cloud Tasks + Cloud Scheduler
- Move to queue: PDF generation, email sending, scheduled audits, achievement checks
**Files:** New `backend/worker.py`, `backend/tasks/`, update scheduler
**Risk:** Medium — infrastructure change, but improves reliability significantly

### 8. Add WebSocket Support for Real-Time Audit Progress
**Problem:** Users wait 10-30 seconds for an audit with no progress feedback.
**Solution:** Add WebSocket endpoint that streams audit progress:
1. "Fetching your page..."
2. "Analyzing meta tags..."
3. "Checking headings..."
4. "Generating AI recommendations..."
**Files:** New WebSocket route, update `seo_analyzer.py` to yield progress, frontend WebSocket hook
**Risk:** Medium — new protocol, but FastAPI has good WebSocket support

### 9. Add Feature Flags
**Problem:** No way to gradually roll out features, A/B test, or kill-switch problematic features.
**Solution:** Simple env-var-based or DB-based feature flags:
```python
FEATURES = {
    "ai_visibility": True,
    "social_audit": True,
    "gbp_audit": True,
    "competitor_comparison": True,
    "new_dashboard": False,
}
```
**Files:** New `backend/features.py`, wrap new features in conditionals
**Risk:** Low

### 10. Improve Error Handling Granularity
**Problem:** Most AI failures return generic 502 "AI service error". Users can't distinguish between "Gemini is down" vs "your input was invalid" vs "rate limited by Gemini".
**Solution:** Categorize errors:
- `AIServiceUnavailable` (503) — Gemini API down
- `AIInputInvalid` (400) — bad input to AI
- `AIRateLimited` (429) — Gemini rate limit
- `AITimeout` (504) — Gemini took too long
**Files:** `backend/llm_client.py`, all AI service modules
**Risk:** Low

---

## Tier 3: Strategic / Higher Effort

### 11. Multi-Tenant Agency Features
**Problem:** GTM strategy targets agency owners but the product has no agency features (manage multiple clients, white-label, client dashboards).
**Solution:**
- Add `parent_user_id` to users for agency hierarchy
- Agency dashboard: view all client scores, audits, projects
- White-label: custom domain, custom branding, custom email templates
- Client portal: read-only view for agency clients
**Files:** New models, new routes, new frontend pages
**Risk:** High — significant scope, but directly addresses a GTM persona

### 12. Revenue Impact Estimates (The #1 Requested Feature)
**Problem:** Market research found: "No tool tells me how much money I'm losing by not ranking." Goodly mentions this in marketing but doesn't deliver it in the product.
**Solution:** For each audit issue, estimate revenue impact:
- "Missing meta description → ~3% CTR loss → ~$150/month in lost clicks"
- Use industry benchmarks (CTR by position, conversion rates by industry)
- Show cumulative: "Fixing all critical issues could bring ~$850/month in new revenue"
**Files:** New `backend/revenue_impact.py`, update audit result model, frontend audit detail page
**Risk:** Medium — estimates are directional, need clear disclaimers

### 13. Platform API Integrations (Real Social Data)
**Problem:** Social audits require manual data entry (handle, bio, followers, etc.). Competitor analysis only compares on-page SEO.
**Solution:**
- Instagram Basic Display API / TikTok Research API / YouTube Data API for real profile data
- Google Business Profile API for real GBP data (instead of manual entry)
- Google Search Console API for real search performance data
- Ahrefs/Semrush API for backlink data (if budget allows)
**Files:** New `backend/integrations/` directory, update social_service, gbp_service
**Risk:** High — API approvals, rate limits, cost

### 14. Add Comprehensive Analytics Dashboard
**Problem:** Admin stats are basic (counts). No user behavior analytics, no conversion funnel, no cohort analysis.
**Solution:**
- User acquisition funnel: landing → signup → first audit → upgrade
- Feature adoption: which features are used, by which plan
- Churn indicators: users who haven't logged in for 14+ days
- Revenue metrics: MRR, ARR, churn rate, LTV
**Files:** New `backend/analytics.py`, new admin frontend pages
**Risk:** Medium

### 15. API Versioning
**Problem:** No `/v1/` prefix. Breaking changes will be painful.
**Solution:** Add `/api/v1/` prefix, keep `/api/` as alias for v1. Future v2 can coexist.
**Files:** `backend/server.py`, frontend API client
**Risk:** Medium — requires frontend update, but backward-compatible

---

## Quick Wins (Under 1 Hour Each)

| # | Item | Effort |
|---|------|--------|
| Q1 | Add `healthcheck` to Dockerfile | 5 min |
| Q2 | Add `.env.example` file (referenced in DEPLOYMENT.md but missing) | 10 min |
| Q3 | Add `py.typed` marker for PEP 561 compliance | 2 min |
| Q4 | Add pre-commit hooks for ruff + prettier (config exists but may not be active) | 15 min |
| Q5 | Add `__all__` exports to all modules for cleaner imports | 20 min |
| Q6 | Add response compression (gzip) middleware | 10 min |
| Q7 | Add `Cache-Control` headers to static audit results | 10 min |
| Q8 | Add `HEAD` method support for health check (for load balancers) | 5 min |
| Q9 | Add `Sentry.set_user()` on login for better error tracking | 15 min |
| Q10 | Add database connection pooling configuration | 15 min |

---

## Architecture Improvements (Long-Term)

### Current Architecture
```
Browser → Vercel (React SPA) → Cloud Run (FastAPI monolith) → MongoDB Atlas
                                   ↓
                              Gemini API, Stripe, Resend
```

### Target Architecture
```
Browser → Vercel (React SPA) → Cloud Run (FastAPI) → MongoDB Atlas
                                   ↓              ↓
                              Redis (cache)   Cloud Tasks (queue)
                                   ↓              ↓
                              Gemini API      Worker (Cloud Run)
                                   ↓              ↓
                              Stripe, Resend  PDF gen, emails, scheduled audits
```

---

## Priority Order

1. **This week:** Tier 1 items 1-5 + Quick Wins Q1-Q10
2. **This month:** Tier 2 items 6-10
3. **Next quarter:** Tier 3 items 11-15

---

## Risks & Tradeoffs

- **Monolith split (T1.1):** Risk of circular imports. Mitigate with careful `__init__.py` and late imports.
- **Redis dependency (T1.3, T2.7):** Adds infrastructure cost and complexity. Start with in-memory cache, add Redis when needed.
- **Service layer (T2.6):** Over-engineering risk for current scale. Keep services thin — just extract the business logic, don't build a full DDD.
- **Agency features (T3.11):** Could distract from core SMB focus. Validate demand first.
- **Revenue estimates (T3.12):** Legal risk if estimates are wrong. Add clear disclaimers.

---

## What's Already Great (Don't Touch)

- **Pricing strategy:** 4-tier with clear value progression. The Free → Starter → Pro → Concierge ladder is well-designed.
- **Marketing research:** The competitive analysis, personas, and GTM strategy are excellent. The insight that "small businesses don't want SEO tools — they want to be found" is the right north star.
- **AI integration:** Gemini 2.5 Flash/Pro with retry logic, JSON extraction, and token logging is solid.
- **Security:** JWT in HttpOnly cookies, rate limiting, CORS, input sanitization, security headers — all present.
- **Testing:** 475+ tests with 98% coverage is exceptional for a project at this stage.
- **Free tools as lead magnets:** The 8 free SEO tools are a smart acquisition strategy.
- **Public audit endpoint:** No-login audit at `/audit` is a great conversion funnel entry point.
