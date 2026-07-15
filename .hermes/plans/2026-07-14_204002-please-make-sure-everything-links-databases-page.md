# End-to-End Verification Plan: searchgoodly.com

**Date:** 2026-07-14
**Goal:** Verify every link, database connection, page, form, login flow, and backend relation works correctly
**Context:** 437 automated tests pass. 4 bugs fixed. Now need deep manual verification of all systems.

---

## Current State

### What's Verified (Automated)
- 437/437 tests pass (shell smoke + Playwright smoke/auth/full-coverage)
- All 46 public pages return 200 with content
- Zero console errors on all pages
- All forms have correct elements
- All navigation links present
- All 17 protected routes redirect to login
- Mobile responsive at 375px
- Page load under 10s
- SEO elements present
- Security headers present
- API health returns 200 (DB, AI, Stripe, email, scheduler all "connected")

### What's NOT Yet Verified (Needs Manual Testing)
- **Database:** Is MongoDB actually storing/retrieving data? Health says "connected" but no CRUD test done
- **Login:** Can a real user log in? Does demo account work? Does JWT token flow work?
- **Registration:** Can a new user register? Does email verification work?
- **Audit engine:** Does the SEO audit actually scan a real website and return results?
- **API endpoints:** Do the 55+ endpoints actually work (not just health)?
- **Stripe:** Does checkout flow work? Are webhooks configured?
- **Email:** Do emails actually deliver (verification, password reset, digest)?
- **Cross-page relations:** Do all internal links actually navigate correctly?
- **Error states:** What happens on network failure, invalid input, expired tokens?
- **Rate limiting:** Does it actually throttle at 200 req/min?
- **Scheduler:** Are automated audits actually running?

---

## Plan

### Phase 1: Database Verification

**Step 1.1: Test MongoDB CRUD via API**
- Register a test user via the API
- Verify user appears in database (check via health or admin endpoint)
- Login with the test user
- Delete the test user
- **Files:** `backend/database.py`, `backend/server.py` (auth endpoints)
- **Verify:** `curl -X POST https://api.searchgoodly.com/api/auth/register -H "Content-Type: application/json" -d '{"name":"Test","email":"test-verify@searchgoodly.com","password":"Test1234!"}'`

**Step 1.2: Test database resilience**
- Hit the health endpoint 10 times rapidly
- Verify database stays "connected" throughout
- Check for any connection pool exhaustion

### Phase 2: Authentication Flow (End-to-End)

**Step 2.1: Demo account login**
- Navigate to `/login`
- Click "Use demo account"
- Verify redirect to `/app` (dashboard)
- Verify user menu shows demo user info
- Verify dashboard loads with data
- Logout and verify redirect to `/login`

**Step 2.2: Full registration flow**
- Register new user at `/register`
- Fill all fields (name, website, email, password)
- Submit and verify redirect to `/app` or `/verify-email`
- If verification required, check email flow
- Login with new credentials
- Verify dashboard shows empty state (new user)

**Step 2.3: Password reset flow**
- Go to `/forgot-password`
- Enter email, submit
- Verify success message
- Check that reset email would be sent (Resend)

**Step 2.4: Auth edge cases**
- Login with wrong password → error message
- Login with unregistered email → error message
- Register with existing email → error message
- Register with weak password → validation error
- Access protected route with expired token → redirect to login

### Phase 3: Core Business Flow (The "Small Business Journey")

**Step 3.1: Public audit (no login)**
- Go to `/audit`
- Enter a real website URL (e.g., `example.com`)
- Click "Get my free score"
- Verify audit results appear (score, issues, revenue impact)
- Verify email capture form appears
- Enter email, submit
- Verify "Create free account" CTA appears

**Step 3.2: Authenticated audit**
- Login (demo or test account)
- Go to `/app/audit`
- Enter a URL, run audit
- Verify audit appears in dashboard
- Verify audit detail page loads with full results
- Verify PDF export option exists

**Step 3.3: Dashboard verification**
- Verify all dashboard widgets load
- Verify project list (if any)
- Verify navigation to all sub-pages:
  - `/app/projects`
  - `/app/audit`
  - `/app/ai-tools`
  - `/app/social`
  - `/app/ai-visibility`
  - `/app/gbp`
  - `/app/billing`
  - `/app/content-studio`
  - `/app/competitors`
  - `/app/referral`
  - `/app/affiliate`

**Step 3.4: Billing page**
- Go to `/app/billing`
- Verify current plan displayed
- Verify upgrade CTAs present
- Verify billing history (if any)

### Phase 4: All Links Verification

**Step 4.1: Header navigation (every page)**
- Test on: `/`, `/pricing`, `/blog`, `/audit`, `/login`, `/register`
- Verify all header links work:
  - Logo → `/`
  - "How it works" → `#how`
  - "What you get" → `#features`
  - "Pricing" → `/pricing`
  - "Content Studio" → `/content-studio`
  - "Stories" → `#stories`
  - "Sign in" → `/login`
  - "Start free" → `/register`

**Step 4.2: Footer links (every page)**
- Verify on `/`, `/pricing`, `/blog`:
  - Product: Features, Pricing, Free Audit, Sign Up
  - Free Tools: Meta Tag Checker, Page Speed Test, Mobile-Friendly Test, Keyword Density
  - Resources: Blog, Contact (mailto)
  - Legal: Terms, Privacy

**Step 4.3: Cross-page link chains**
- Landing → Login → Register → Pricing → Audit → Blog → Blog Post → Back
- Tools Hub → Individual Tool → Back
- Industry Page → CTA → Register
- Comparison Page → CTA → Register/Audit
- Content Studio → CTA → Register

**Step 4.4: External links**
- Twitter/X link on changelog
- RSS feed link on changelog
- mailto links (hello@, legal@, privacy@)
- Stripe checkout links (if any on pricing)

### Phase 5: API Endpoint Verification

**Step 5.1: Public endpoints (no auth)**
```
GET  /api/health
GET  /
POST /api/public/audit  { "url": "example.com" }
POST /api/auth/register { "name": "...", "email": "...", "password": "..." }
POST /api/auth/login    { "email": "...", "password": "..." }
POST /api/auth/forgot-password { "email": "..." }
GET  /api/billing/plans
```

**Step 5.2: Authenticated endpoints (with JWT)**
```
GET    /api/auth/me
POST   /api/auth/onboarded
GET    /api/projects
POST   /api/projects
GET    /api/audits
POST   /api/audits
GET    /api/dashboard/summary
GET    /api/dashboard/visibility
GET    /api/billing/me
POST   /api/billing/checkout
GET    /api/serp/check
GET    /api/social/audit
GET    /api/ai-visibility/check
GET    /api/gbp/audit
POST   /api/referrals/invite
```

**Step 5.3: Admin endpoints (with admin JWT)**
```
GET /api/admin/users
GET /api/admin/analytics/overview
GET /api/admin/concierge/briefs
```

### Phase 6: Free Tools Verification

**Step 6.1: Each tool with real input**
- Meta Tag Checker: enter `example.com` → verify results
- Page Speed: enter `example.com` → verify results
- Mobile Friendly: enter `example.com` → verify results
- Keyword Density: enter `example.com` → verify results
- SSL Checker: enter `example.com` → verify results
- Schema Validator: enter `example.com` → verify results
- Robots Checker: enter `example.com` → verify results
- Heading Checker: enter `example.com` → verify results

**Step 6.2: Tools hub navigation**
- `/tools` → click each tool card → verify navigation
- Verify breadcrumbs on each tool page
- Verify "Get full audit" CTA on each tool page

### Phase 7: Error & Edge Case Handling

**Step 7.1: Network errors**
- Disconnect network → verify error boundary shows
- Slow network → verify loading states appear
- API timeout → verify error message

**Step 7.2: Invalid inputs**
- Audit: empty URL → validation error
- Audit: invalid URL format → validation error
- Login: empty fields → validation error
- Register: mismatched passwords → validation error
- Register: invalid email → validation error
- Free tools: empty URL → validation error

**Step 7.3: Rate limiting**
- Hit public audit endpoint rapidly 10+ times
- Verify 429 response after limit
- Verify X-RateLimit-* headers present

**Step 7.4: 404 handling**
- Navigate to `/nonexistent-page-12345`
- Verify 404 page with navigation links
- Click "Go to homepage" → verify navigates to `/`
- Click "Run a free audit" → verify navigates to `/audit`

### Phase 8: Performance & SEO Final Check

**Step 8.1: Lighthouse audit**
- Run on: `/`, `/pricing`, `/blog`, `/audit`, `/login`, `/register`, `/restaurants`
- Target: Performance ≥ 80, Accessibility ≥ 90, Best Practices ≥ 90, SEO ≥ 90

**Step 8.2: Meta tag uniqueness**
- Verify each page has unique title (not all "Goodly — Visibility OS for Small Businesses")
- Verify each page has unique meta description
- Check: `/`, `/pricing`, `/blog`, `/audit`, `/login`, `/register`, `/restaurants`, `/content-studio`, `/tools`, `/checklist`, `/roi-calculator`, `/stories`, `/refer`, `/competitors`, `/changelog`, `/status`, `/help`, `/terms`, `/privacy`

**Step 8.3: Structured data**
- Verify JSON-LD on landing page
- Verify JSON-LD on blog posts
- Verify JSON-LD on industry pages
- Verify JSON-LD on content studio page

### Phase 9: Mobile & Cross-Browser

**Step 9.1: Mobile testing (375px, 414px, 768px)**
- Test on: `/`, `/pricing`, `/login`, `/register`, `/audit`, `/blog`, `/restaurants`
- Verify no horizontal scroll
- Verify tap targets ≥ 44px
- Verify forms usable
- Verify hamburger menu (if exists)

**Step 9.2: Tablet testing (768px, 1024px)**
- Test on: `/`, `/pricing`, `/login`
- Verify layout adapts correctly
- Verify no overlapping elements

### Phase 10: Final Integration Test

**Step 10.1: Run all test suites**
```bash
# Shell smoke
FRONTEND_URL=https://searchgoodly.com BACKEND_URL=https://api.searchgoodly.com bash scripts/smoke-test.sh

# All Playwright suites
FRONTEND_URL=https://searchgoodly.com npx playwright test --config=tests/e2e/playwright.config.js \
  tests/e2e/smoke-tests.spec.js \
  tests/e2e/comprehensive.spec.js \
  tests/e2e/authenticated.spec.js \
  tests/e2e/full-coverage.spec.js
```

**Step 10.2: Backend unit + integration tests**
```bash
cd backend && python -m pytest ../tests/unit/ ../tests/integration/ -v --tb=short
```

**Step 10.3: Frontend unit tests**
```bash
cd frontend && npm test
```

---

## Files That May Need Changes

| File | Potential Issue |
|---|---|
| `frontend/src/pages/*.jsx` | Missing unique page titles |
| `frontend/vercel.json` | May need additional CSP allowances for tools |
| `backend/server.py` | Rate limit tuning, error handling |
| `backend/limiter.py` | Rate limit values |
| `frontend/src/components/app/ErrorBoundary.jsx` | Error boundary coverage |

## Success Criteria

- [ ] Demo account login works end-to-end
- [ ] Public audit returns real results for a real URL
- [ ] All 55+ API endpoints respond correctly
- [ ] All internal links navigate correctly (header, footer, cross-page)
- [ ] All 8 free tools return results for real input
- [ ] All forms validate correctly (empty, invalid, valid)
- [ ] Rate limiting triggers at 200 req/min
- [ ] 404 page works with navigation
- [ ] Mobile rendering correct at 3 breakpoints
- [ ] Lighthouse scores ≥ 80/90/90/90 on 7 key pages
- [ ] All pages have unique titles and meta descriptions
- [ ] All 437+ automated tests pass
- [ ] Backend 475+ unit/integration tests pass
- [ ] Frontend 47 unit tests pass

## Risks & Open Questions

1. **Demo account:** Does it still work? Credentials may have changed.
2. **Stripe test mode:** Is Stripe in test mode or live? Checkout may fail if misconfigured.
3. **Email delivery:** Resend may be in test mode — emails may not actually deliver.
4. **Rate limiting:** 200 req/min may be too restrictive for the free tools if they call the API.
5. **Cold starts:** Cloud Run min-instances=0 means first request may timeout.
6. **MongoDB Atlas:** IP whitelist may block new Cloud Run instances.
7. **SSL certificates:** When do they expire? Are they auto-renewing?
8. **Domain expiry:** When does searchgoodly.com expire?
