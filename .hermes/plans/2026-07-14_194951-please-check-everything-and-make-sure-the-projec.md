# Production Readiness Plan: Goodly (searchgoodly.com)

**Date:** 2026-07-14
**Goal:** Ensure searchgoodly.com is fully production-ready for small business customers
**Context:** Comprehensive E2E testing completed — 627/627 tests pass. One deployment issue found.

---

## Current State

### What's Working (Verified)
- **627/627 automated tests pass** across 5 test suites
- **55/55 shell smoke tests pass** (all pages return 200, security headers present, static assets served)
- **Zero console errors** on all 46 public pages
- **All forms** have proper elements (login, register, forgot-password, audit, 8 free tools)
- **All navigation links** work (header, footer, cross-page)
- **Auth redirects** work for all 17 protected routes
- **Mobile responsive** — 7 key pages render correctly at 375px
- **Page load performance** — all pages under 10s (most under 3s)
- **SEO elements** — title, meta description, h1, canonical present on key pages
- **Security headers** — X-Content-Type-Options, X-Frame-Options present
- **Backend health** — API returns 200 with proper JSON (database, AI, Stripe, email all connected)
- **404 page** — proper content with navigation links
- **Static assets** — favicon, robots.txt, sitemap.xml all return 200

### Issues Found

| # | Issue | Severity | Status |
|---|---|---|---|
| 1 | `/content-studio` shows 404 on production (stale Vercel deploy) | High | Needs redeploy |
| 2 | `/app/content-studio` doesn't redirect to login (same root cause) | Medium | Fixed by redeploy |
| 3 | `critical-paths.spec.js` uses local dev credentials — fails on prod | Low | Local-only, by design |
| 4 | No CSP header (Content-Security-Policy) | Medium | Should add |
| 5 | Backend health transient timeout in smoke test (resolved on re-run) | Low | Monitor |

---

## Plan

### Phase 1: Deploy Fix (Critical)

**Step 1.1: Redeploy frontend to Vercel**
- The current Vercel deployment is stale — it doesn't include the `ContentStudioLanding` and `ContentStudio` chunks
- Local build produces them correctly: `ContentStudioLanding-C9JMNQvO.js` (24.64 kB) and `ContentStudio-Dfx6gJQj.js` (61.45 kB)
- **Action:** Run `cd frontend && npm run build && vercel --prod`
- **Verify:** `curl -s https://searchgoodly.com/content-studio | grep -c "404"` should return 0
- **Verify:** `curl -s https://searchgoodly.com/app/content-studio` should redirect to `/login`

**Step 1.2: Verify backend health stability**
- The `/api/health` endpoint timed out once during smoke testing but worked on re-run
- **Action:** Run `curl -s --max-time 10 https://api.searchgoodly.com/api/health` 5 times, verify all return 200
- **If flaky:** Check Cloud Run min-instances setting (currently 0 — cold starts may cause timeouts)

### Phase 2: Security Hardening

**Step 2.1: Add Content-Security-Policy header**
- Currently: X-Content-Type-Options and X-Frame-Options present, but no CSP
- **File:** `frontend/vercel.json` (add to headers array)
- **File:** `backend/security_headers.py` (if backend serves any frontend assets)
- **Suggested CSP:** `default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.searchgoodly.com https://www.google-analytics.com; font-src 'self'; frame-ancestors 'none';`

**Step 2.2: Verify HTTPS redirect**
- Confirm `http://searchgoodly.com` redirects to `https://searchgoodly.com`
- Confirm `http://api.searchgoodly.com` redirects to `https://api.searchgoodly.com`

### Phase 3: Small Business UX Audit

**Step 3.1: Test the core small business journey end-to-end**
1. Land on homepage → see clear value proposition
2. Enter website URL → get free audit score
3. See plain-English results → understand what to fix
4. Register account → create free account
5. Dashboard → see audit history, run more audits
6. Upgrade path → pricing page clear, CTAs work

**Step 3.2: Verify key small business pages**
- `/restaurants`, `/plumbers`, `/dentists`, `/salons` — industry-specific content renders
- `/roi-calculator` — sliders work, shows dollar amounts
- `/checklist` — all 7 sections present, actionable items
- `/pricing` — free tier clearly visible, no credit card messaging prominent
- `/audit` — "No credit card required" messaging visible

**Step 3.3: Test on real mobile device**
- Use BrowserStack or physical device to test iPhone SE and Pixel 5
- Verify tap targets are large enough (min 44px)
- Verify forms are usable on mobile
- Verify no horizontal scroll on any page

### Phase 4: Performance & SEO

**Step 4.1: Run Lighthouse audit**
- Run Lighthouse on `/`, `/pricing`, `/blog`, `/audit`, `/login`
- Target scores: Performance ≥ 80, Accessibility ≥ 90, Best Practices ≥ 90, SEO ≥ 90
- Fix any issues found

**Step 4.2: Verify sitemap.xml completeness**
- Check that all 46 public pages are in sitemap.xml
- Verify lastmod dates are recent
- Submit to Google Search Console

**Step 4.3: Verify meta tags on all pages**
- Every page should have unique title (50-60 chars) and meta description (120-160 chars)
- Open Graph tags should be present on all pages
- Canonical URLs should be correct

### Phase 5: Monitoring & Alerts

**Step 5.1: Set up uptime monitoring**
- Use a free service (UptimeRobot, Better Uptime free tier) to monitor:
  - `https://searchgoodly.com` (frontend)
  - `https://api.searchgoodly.com/api/health` (backend)
- Alert on downtime > 1 minute

**Step 5.2: Verify Sentry error tracking**
- Confirm Sentry DSN is configured in Cloud Run
- Trigger a test error and verify it appears in Sentry dashboard
- Set up alert rules for new errors

**Step 5.3: Verify Google Analytics**
- Confirm GA4 tracking is firing on all pages
- Check real-time reports while browsing the site

### Phase 6: Operational Readiness

**Step 6.1: Verify backup strategy**
- Confirm MongoDB backup script works (`scripts/backup-mongo.sh`)
- Verify backup schedule is active
- Test restore procedure

**Step 6.2: Verify rate limiting**
- Confirm rate limiting is active on API endpoints
- Check X-RateLimit-* headers in responses
- Verify limits are reasonable for small business usage

**Step 6.3: Verify email delivery**
- Test registration email
- Test password reset email
- Test weekly audit digest email
- Verify Resend is configured correctly

### Phase 7: Documentation

**Step 7.1: Update README with production URLs**
- Ensure README has correct production URLs
- Add deployment instructions for Vercel + Cloud Run
- Add monitoring dashboard links

**Step 7.2: Create runbook for common issues**
- Stale deploy → how to redeploy
- Backend cold start → how to warm up
- Database connection issues → how to check
- Email delivery issues → how to verify Resend

---

## Files Likely to Change

| File | Change |
|---|---|
| `frontend/vercel.json` | Add CSP header |
| `backend/security_headers.py` | Add CSP header if backend serves assets |
| `README.md` | Update production URLs, deployment docs |
| `docs/runbook.md` | New — operational runbook |

## Tests to Run After Changes

1. `bash scripts/smoke-test.sh` — all 55 must pass
2. `npx playwright test --config=tests/e2e/playwright.config.js tests/e2e/smoke-tests.spec.js` — all 123 must pass
3. `npx playwright test --config=tests/e2e/playwright.config.js tests/e2e/full-coverage.spec.js` — all 236 must pass
4. Manual: test `/content-studio` loads correctly
5. Manual: test `/app/content-studio` redirects to login
6. Manual: Lighthouse audit on 5 key pages

## Risks & Open Questions

1. **Vercel deploy:** Who has Vercel access? Is the project connected to a GitHub repo for auto-deploys?
2. **Cloud Run cold starts:** With `min-instances=0`, first request after idle period may timeout. Consider `min-instances=1` for production.
3. **CSP header:** Adding CSP may break inline scripts or third-party integrations (Google Analytics, support widget). Test thoroughly.
4. **Email delivery:** Has Resend domain verification been completed? Are emails landing in inbox vs spam?
5. **Stripe webhooks:** Are Stripe webhook endpoints configured and tested end-to-end?
6. **SSL certificates:** Are they auto-renewing? When do they expire?
7. **Domain registration:** When does searchgoodly.com expire? Is auto-renew enabled?

## Success Criteria

- [ ] `/content-studio` loads correctly on production
- [ ] CSP header present without breaking functionality
- [ ] Lighthouse scores ≥ 80/90/90/90 on all key pages
- [ ] Uptime monitoring active
- [ ] All 627 tests pass after changes
- [ ] Core small business journey works end-to-end
- [ ] Documentation updated
