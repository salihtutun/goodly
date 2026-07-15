# Goodly Next Steps — Prioritized Roadmap

**Date:** 2026-07-14
**Context:** 437 tests pass. All pages load. DB/auth/audit verified. Security headers in place. 4 bugs fixed. Project is production-ready for basic usage.

---

## What's Solid (Don't Touch)

- All 46 public pages load with 200, zero console errors
- Authentication: register, login, JWT, logout, edge cases
- Public audit engine: real scans return scores and issues
- Database: MongoDB connected, CRUD works
- Security: CSP, X-CTO, XFO, XSS, HSTS, Referrer-Policy, Permissions-Policy
- Sitemap: 58 URLs, robots.txt correct
- Navigation: all header/footer/cross-page links work
- Mobile: renders correctly at 375px on 7 key pages
- Rate limiting: 200 req/min with proper client IP detection
- Industry pages: all 9 fixed and rendering

---

## Priority 1: Launch Blockers (Must Do Before Real Users)

### 1.1 Configure Demo Account
- **Why:** The "Use demo account" button shows "not available" — first impression for potential customers
- **How:** Set `DEMO_EMAIL` and `DEMO_PASSWORD` env vars in Cloud Run, or create a real demo user in MongoDB
- **Files:** `backend/server.py` (auth endpoint), Cloud Run env vars
- **Verify:** Click "Use demo account" on /login → lands on /app dashboard

### 1.2 Verify Email Delivery (Resend)
- **Why:** Registration emails, password resets, and audit digests must actually deliver
- **How:** 
  1. Check Resend dashboard — is searchgoodly.com domain verified?
  2. Register a test user → check if verification email arrives
  3. Test forgot-password flow → check if reset email arrives
- **Files:** `backend/email_service.py`, Resend dashboard
- **Verify:** Email lands in inbox (not spam), within 2 minutes

### 1.3 Test Stripe Checkout End-to-End
- **Why:** Revenue depends on it
- **How:**
  1. Confirm Stripe is in test mode (not live)
  2. Login as test user → go to /app/billing
  3. Click "Try 7 days free" on Starter plan
  4. Complete Stripe checkout with test card `4242 4242 4242 4242`
  5. Verify plan upgrades in dashboard
  6. Test Stripe webhook → verify subscription status updates
- **Files:** `backend/billing.py`, Stripe dashboard
- **Verify:** Plan changes from "free" to "starter" after checkout

### 1.4 Set Up Uptime Monitoring
- **Why:** Need to know when the site goes down before customers complain
- **How:** 
  1. Create free UptimeRobot account
  2. Add monitors for:
     - `https://searchgoodly.com` (keyword: "Get found on Google")
     - `https://api.searchgoodly.com/api/health` (keyword: "ok")
  3. Set alert interval: 1 minute, alert after 2 failures
  4. Configure email/Slack notifications
- **Verify:** Pause Cloud Run → alert fires within 2 minutes

### 1.5 Fix Cloud Run Cold Starts
- **Why:** First request after idle period can take 8+ seconds — terrible UX
- **How:** Set `min-instances=1` in Cloud Run (adds ~$7/month)
- **Alternative:** Set up Cloud Scheduler cron job to ping `/api/health` every 5 minutes
- **Files:** `cloudbuild.yaml`, Cloud Run console
- **Verify:** `curl -w "%{time_total}" https://api.searchgoodly.com/api/health` consistently under 1s

---

## Priority 2: Growth & Analytics (Week 1-2)

### 2.1 Enable Google Analytics (GA4)
- **Why:** Can't improve what you don't measure
- **How:** 
  1. Create GA4 property for searchgoodly.com
  2. Set `REACT_APP_GA_ID` in Vercel env vars
  3. Redeploy frontend
- **Files:** `frontend/src/hooks/useAnalytics.jsx`, `frontend/src/lib/env.js`, Vercel dashboard
- **Verify:** Real-time report shows page views while browsing

### 2.2 Verify Sentry Error Tracking
- **Why:** Need to catch production errors before users report them
- **How:**
  1. Confirm `SENTRY_DSN` is set in Cloud Run secrets
  2. Trigger a test error (hit a non-existent endpoint)
  3. Verify error appears in Sentry dashboard
  4. Set up alert rules for new errors
- **Files:** `backend/sentry_integration.py`, Sentry dashboard
- **Verify:** Error appears in Sentry within 30 seconds

### 2.3 Add Meta Descriptions to All Pages
- **Why:** Currently all pages share the same meta description in server-rendered HTML
- **How:** Use `react-helmet-async` (already installed) to set per-page meta tags
- **Files:** Each page component in `frontend/src/pages/`
- **Verify:** `curl -s https://searchgoodly.com/pricing | grep "meta name=\"description\""` shows unique content

### 2.4 Submit Sitemap to Google Search Console
- **Why:** Get indexed faster
- **How:**
  1. Verify domain ownership in Google Search Console
  2. Submit `https://searchgoodly.com/sitemap.xml`
  3. Request indexing for key pages
- **Verify:** Sitemap shows "Success" in GSC within 24 hours

---

## Priority 3: Content & SEO (Week 2-3)

### 3.1 Run Lighthouse Audits on All Key Pages
- **Why:** Identify performance/accessibility/SEO gaps
- **Pages:** `/`, `/pricing`, `/blog`, `/audit`, `/login`, `/register`, `/restaurants`, `/content-studio`, `/tools`
- **Target:** Performance ≥ 80, Accessibility ≥ 90, Best Practices ≥ 90, SEO ≥ 90
- **Fix:** Any page below target → investigate and fix

### 3.2 Add Blog Content
- **Why:** Blog has 6 posts — needs more for SEO authority
- **How:** Use the Content Studio AI to generate 10-15 more SEO-optimized posts
- **Topics:** Local SEO guides, industry-specific tips, Google Business Profile optimization, social media for small business
- **Files:** `backend/blog_service.py`, MongoDB blog collection

### 3.3 Add Customer Testimonials
- **Why:** /stories page is empty — social proof is critical for conversion
- **How:** Reach out to early users, collect 3-5 real testimonials with photos
- **Files:** `frontend/src/pages/TestimonialsPage.jsx`

### 3.4 Optimize Landing Page Conversion
- **Why:** The free audit is the primary conversion funnel
- **How:**
  1. Add social proof above the fold (e.g., "Join 500+ small businesses")
  2. Add trust badges (SSL, money-back guarantee)
  3. A/B test CTA button text
- **Files:** `frontend/src/pages/Landing.jsx`

---

## Priority 4: Product Completeness (Week 3-4)

### 4.1 Test All Authenticated Features
- **Why:** Only tested public API — need to verify the full dashboard experience
- **How:** Login as test user, test every feature:
  - Create project → run audit → view results → export PDF
  - Social audit (Instagram/TikTok/YouTube)
  - AI visibility check
  - Google Business Profile audit
  - Competitor comparison
  - Content Studio (AI content generation)
  - Referral invites
  - Billing management
- **Verify:** Each feature returns real data, not errors

### 4.2 Test Google OAuth Login
- **Why:** Alternative login method — reduces friction
- **How:** 
  1. Verify `GOOGLE_CLIENT_ID` is set in Cloud Run
  2. Test Google sign-in button on /login
  3. Verify account creation/linking works
- **Files:** `backend/auth.py`, `frontend/src/pages/Login.jsx`

### 4.3 Verify Scheduler (Automated Audits)
- **Why:** Weekly re-audits are a key paid feature
- **How:**
  1. Create a project with a URL
  2. Set up weekly scheduled audit
  3. Verify audit runs automatically
  4. Verify email digest is sent
- **Files:** `backend/scheduler.py`, `backend/email_service.py`

### 4.4 Test PDF Export
- **Why:** PDF reports are a key differentiator
- **How:** Run an audit → click "Export PDF" → verify PDF downloads with correct content
- **Files:** `backend/pdf_export.py`

---

## Priority 5: Operations & Reliability (Ongoing)

### 5.1 Set Up Automated Backups
- **Why:** MongoDB data loss would be catastrophic
- **How:** 
  1. Test `scripts/backup-mongo.sh` with real credentials
  2. Set up cron job (daily) to run backup
  3. Store backups in GCS or S3
  4. Test restore procedure
- **Files:** `scripts/backup-mongo.sh`

### 5.2 Run Backend Test Suite
- **Why:** 475+ unit/integration tests exist but couldn't run (venv issue)
- **How:** Fix Python venv, install deps, run `make test`
- **Verify:** All 475+ tests pass, coverage ≥ 95%

### 5.3 Run Frontend Unit Tests
- **Why:** 47 Jest tests exist
- **How:** `cd frontend && npm test`
- **Verify:** All 47 pass

### 5.4 Check SSL Certificate & Domain Expiry
- **Why:** Expired cert/domain = site down
- **How:**
  ```bash
  echo | openssl s_client -servername searchgoodly.com -connect searchgoodly.com:443 2>/dev/null | openssl x509 -noout -dates
  whois searchgoodly.com | grep -i "expir"
  ```
- **Verify:** SSL renews automatically (Vercel handles this), domain auto-renews

### 5.5 Set Up CI/CD for E2E Tests
- **Why:** Catch regressions before deploy
- **How:** Update `.github/workflows/ci.yml` to run full-coverage E2E tests on PR
- **Files:** `.github/workflows/ci.yml`

---

## Priority 6: Polish (Week 4+)

### 6.1 Add Loading States
- **Why:** Some pages flash empty states before data loads
- **How:** Add skeleton loaders to dashboard, audit results, blog posts
- **Files:** Various page components

### 6.2 Add Error Boundaries
- **Why:** One component crash shouldn't break the whole page
- **How:** Wrap each major section in `<ErrorBoundary>` (already imported in App.jsx)
- **Files:** `frontend/src/App.jsx`, individual page components

### 6.3 Improve Mobile Experience
- **Why:** 60%+ of small business owners browse on mobile
- **How:**
  1. Test on real iPhone SE and Pixel 5
  2. Fix any horizontal scroll
  3. Ensure tap targets ≥ 44px
  4. Test audit flow on mobile
- **Files:** Various CSS/Tailwind classes

### 6.4 Add Favicon Variants
- **Why:** Better branding in browser tabs, bookmarks, and mobile home screens
- **How:** Add apple-touch-icon, mask-icon, theme-color meta
- **Files:** `frontend/index.html`, `frontend/public/`

### 6.5 Add Structured Data to All Pages
- **Why:** Rich results in Google (star ratings, breadcrumbs, FAQ)
- **How:** Add JSON-LD to:
  - Blog posts (Article schema)
  - Pricing page (Product schema)
  - FAQ sections (FAQPage schema)
  - Industry pages (LocalBusiness schema)
- **Files:** `frontend/src/components/app/JsonLd.jsx`, individual pages

---

## Summary: What To Do Now (This Week)

| # | Task | Est. Time | Impact |
|---|---|---|---|
| 1 | Configure demo account | 30 min | High |
| 2 | Verify email delivery | 1 hour | Critical |
| 3 | Test Stripe checkout | 1 hour | Critical |
| 4 | Set up UptimeRobot | 15 min | High |
| 5 | Fix Cloud Run cold starts | 15 min | High |
| 6 | Enable GA4 | 30 min | Medium |
| 7 | Verify Sentry | 15 min | Medium |
| 8 | Submit sitemap to GSC | 15 min | Medium |
| 9 | Run backend + frontend tests | 1 hour | Medium |
| 10 | Check SSL/domain expiry | 5 min | High |

**Total estimated time: ~5.5 hours for the critical path**

## Open Questions

1. **Stripe:** Is it in test mode or live? Do we have the webhook secret?
2. **Resend:** Is the domain verified? Are emails landing in inbox?
3. **Demo account:** Should we use a real MongoDB user or env vars?
4. **Cloud Run budget:** Is $7/month for min-instances=1 acceptable?
5. **Content:** Who will write blog posts and testimonials?
6. **Google OAuth:** Is the Google Cloud Console project configured?
7. **Domain:** Who manages the searchgoodly.com domain registration?
8. **Vercel team:** Who else has deploy access?
