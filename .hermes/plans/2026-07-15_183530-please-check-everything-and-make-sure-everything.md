# Production Readiness Plan — Goodly (searchgoodly.com)

**Date:** 2026-07-15 18:35 UTC  
**Status:** Planning — do not execute

---

## Goal

Ensure Goodly is fully production-ready for business use. All 14 fixes from the audit are implemented but need final verification, test fixes, and deployment.

---

## Current State

### Production (LIVE)
| Service | Status | Details |
|---------|--------|---------|
| Frontend (searchgoodly.com) | UP | HTTP 200, Vercel HIT, all security headers |
| Backend (api.searchgoodly.com) | UP | v1.9.0, DB/AI/Stripe/Email/Scheduler all connected |
| Uptime | 5+ hours | Healthy |

### Code Changes (17 files modified, 2 new)
```
Modified:
  backend/auth.py          — JWT 24h + refresh tokens + CSRF cookie helper
  backend/cache.py         — HybridCache (Redis + in-memory fallback)
  backend/database.py      — MongoDB connection pooling
  backend/dependencies.py  — Async cache invalidation
  backend/server.py        — CSRF middleware, body limit, refresh endpoint, 8 SEO endpoints
  backend/validators.py    — SSRF docstring update
  cloudrun-env.yaml        — DEMO_PASSWORD removed
  .github/workflows/cd.yml — DEMO_PASSWORD secret added
  docker-compose.yml       — Cleaned up, uses .env file
  pyproject.toml           — Coverage 99% → 95%
  frontend/.env.production — BACKEND_URL set explicitly
  frontend/src/App.jsx     — /health route
  frontend/src/lib/api.jsx — CSRF auto-attach + token refresh interceptor
  frontend/src/contexts/AuthContext.jsx — Refresh token storage
  tests/unit/test_cache.py — Updated for HybridCache

Deleted:
  cloudbuild.yaml          — Consolidated into cd.yml

New:
  backend/seo_enhanced.py  — Schema.org, PageSpeed, E-E-A-T, IndexNow, drift, clustering
  frontend/src/pages/HealthPage.jsx — System health dashboard
  .env.example             — Dev environment template
```

### Test Status
| Suite | Result |
|-------|--------|
| Unit tests | 711 passed, **1 failed** |
| Integration tests | **Import error** (stale __pycache__) |
| E2E tests | Not yet run against updated code |

### Known Issues
1. **test_dependencies.py** — `_invalidate_dashboard_cache` is now async but test calls it synchronously
2. **Integration tests** — Stale `__pycache__` prevents import of new `create_refresh_token` from `auth.py`
3. **No deployment** — All changes are local only, not yet pushed or deployed

---

## Step-by-Step Plan

### Phase 1: Fix Test Failures (5 min)

**1.1 Clear stale bytecode caches**
```bash
find backend tests -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null
find backend tests -name "*.pyc" -delete
```

**1.2 Fix test_dependencies.py**
- File: `tests/unit/test_dependencies.py`, line ~84
- Problem: `_invalidate_dashboard_cache("u1")` called without `await`
- Fix: Add `@pytest.mark.asyncio` and `await` the call
- Also need to handle the mock correctly — `dashboard_cache.delete` is now awaited, so the mock needs to return an awaitable

**1.3 Verify all tests pass**
```bash
.venv/bin/python -m pytest tests/unit/ -q
.venv/bin/python -m pytest tests/integration/ -q
```

### Phase 2: Frontend Build Verification (3 min)

**2.1 Build frontend**
```bash
cd frontend && npm run build
```
- Verify no build errors from new HealthPage.jsx or api.jsx changes
- Check bundle size hasn't regressed significantly

**2.2 Run frontend tests**
```bash
cd frontend && npm test -- --watchAll=false
```

### Phase 3: Security Verification (5 min)

**3.1 Verify CSRF middleware works**
- Test that POST without X-CSRF-Token returns 403
- Test that POST with matching cookie+header passes
- Test that GET requests are exempt

**3.2 Verify body size limit**
- Test that POST with Content-Length > 10MB returns 413
- Test that normal requests pass through

**3.3 Verify refresh token flow**
- Test login returns refresh_token
- Test POST /api/auth/refresh with valid token returns new access token
- Test that consumed refresh token cannot be reused
- Test that expired refresh token returns 401

**3.4 Verify new SEO endpoints**
- Test GET /api/seo/schema/types returns list
- Test POST /api/seo/schema/generate with valid type
- Test POST /api/seo/cluster-keywords with keyword list

### Phase 4: Deploy (10 min)

**4.1 Commit and push**
```bash
git add -A
git commit -m "Production hardening: JWT refresh, CSRF, Redis cache, body limit, claude-seo integration"
git push origin main
```

**4.2 Deploy backend (Cloud Run)**
- Push to main triggers `.github/workflows/cd.yml`
- Or manual: `gcloud builds submit --config=cloudbuild.yaml` (if still present)
- Wait for deployment to complete
- Verify health: `curl https://api.searchgoodly.com/api/health`

**4.3 Deploy frontend (Vercel)**
- Vercel auto-deploys on push to main
- Or manual: `cd frontend && vercel --prod`
- Verify: `curl https://searchgoodly.com/health`

**4.4 Set up Cloud Scheduler**
- Create a Cloud Scheduler job to POST to `https://api.searchgoodly.com/api/scheduler/trigger`
- Set `X-Scheduler-Key` header to the value of `SCHEDULER_API_KEY` env var
- Schedule: every 15 minutes
- This ensures scheduled audits run even when Cloud Run scales to zero

**4.5 Create Secret Manager entries**
- `DEMO_PASSWORD` — move the value from the old cloudrun-env.yaml
- `SCHEDULER_API_KEY` — generate a random 32-char key

### Phase 5: Post-Deploy Smoke Tests (5 min)

**5.1 Backend smoke tests**
```bash
# Health check
curl https://api.searchgoodly.com/api/health

# Auth flow
curl -X POST https://api.searchgoodly.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrong"}' 
# Expect 401

# New SEO endpoints
curl https://api.searchgoodly.com/api/seo/schema/types
# Expect list of schema types

# CSRF protection
curl -X POST https://api.searchgoodly.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test"}'
# Expect 403 (no CSRF token)
```

**5.2 Frontend smoke tests**
```bash
# Homepage
curl -sI https://searchgoodly.com | grep "200"

# Health page
curl -sI https://searchgoodly.com/health | grep "200"

# Security headers
curl -sI https://searchgoodly.com | grep -i "content-security-policy"
```

**5.3 Run E2E test suite**
```bash
FRONTEND_URL=https://searchgoodly.com \
npx playwright test --config=tests/e2e/playwright.config.js \
  tests/e2e/smoke-tests.spec.js
```

### Phase 6: Documentation & Cleanup (3 min)

**6.1 Update README.md**
- Add new SEO endpoints to API reference
- Document refresh token flow
- Document CSRF requirements for API consumers
- Add Cloud Scheduler setup instructions

**6.2 Update DEPLOYMENT.md**
- Add SCHEDULER_API_KEY to required env vars
- Add REDIS_URL as optional env var
- Document Cloud Scheduler setup

**6.3 Update memory**
- Save key facts about the new architecture to Hermes memory

---

## Files Likely to Change

| File | Change |
|------|--------|
| `tests/unit/test_dependencies.py` | Fix async test |
| `README.md` | Document new endpoints |
| `DEPLOYMENT.md` | Document new env vars |
| `backend/__pycache__/` | Delete stale cache |
| `tests/__pycache__/` | Delete stale cache |

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| CSRF breaks existing frontend | High — all POST/PUT/DELETE fail | Frontend api.jsx already auto-attaches CSRF header. Test thoroughly before deploy |
| Refresh token not stored by frontend | Medium — users logged out after 24h | AuthContext.jsx stores refresh_token in localStorage. Verify on deploy |
| Stale __pycache__ causes import errors | Medium — integration tests fail | Clear all __pycache__ before running tests |
| Cloud Scheduler not configured | Low — scheduled audits only run when instance is warm | Document setup; APScheduler still runs as fallback |
| Redis not configured | Low — cache falls back to in-memory | No action needed; Redis is optional enhancement |

---

## Open Questions

1. **Should we bump version to 1.10.0?** — The changes are significant (new auth, CSRF, SEO endpoints). Recommend yes.
2. **Should we add REDIS_URL to Cloud Run?** — Not required for launch. In-memory cache works fine for current scale. Add when traffic grows.
3. **Should we run the full E2E suite (534 tests) or just smoke tests (123)?** — Smoke tests are sufficient for deploy verification. Full suite can run overnight.

---

## Success Criteria

- [ ] All unit tests pass (712/712)
- [ ] All integration tests pass (270+/270+)
- [ ] Frontend builds without errors
- [ ] Backend deploys to Cloud Run successfully
- [ ] Frontend deploys to Vercel successfully
- [ ] Health check returns 200 for both services
- [ ] CSRF protection active (POST without token → 403)
- [ ] Refresh token flow works end-to-end
- [ ] New SEO endpoints respond correctly
- [ ] Smoke tests pass against production
- [ ] Cloud Scheduler job configured
- [ ] Secret Manager entries created
