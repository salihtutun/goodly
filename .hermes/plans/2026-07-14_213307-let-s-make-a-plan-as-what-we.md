# Goodly — Updated Next Steps (Post-Execution)

**Date:** 2026-07-14
**Context:** 1,384 tests pass. Demo account works. All authenticated features tested. PDF export works. Lighthouse data collected. Now planning remaining work.

---

## What's Been Done Since Last Plan

### Verified & Working
- **Demo account:** One-click login → dashboard as "Demo Owner" (concierge plan, audit history, all 11 nav links)
- **All authenticated features tested via API:**
  - Dashboard summary: projects, audits, scores
  - Audits list: 1 audit for example.com
  - Social audit: endpoint responds
  - AI visibility: endpoint responds
  - GBP audit: endpoint responds
  - Competitor analysis: returns data
  - PDF export: 200, 9,137 bytes downloaded
  - Billing: plan info returned (concierge, all perks)
  - Scheduler: endpoint responds (0 runs)
- **Lighthouse data collected:**
  - Landing: title "Get more customers from Google", 10 headings, 23 links, JSON-LD present, 562ms load
  - Pricing: title "Pricing — Goodly SEO for Small Businesses", 5 headings, 24 links, JSON-LD present, 151ms load
- **Secret Manager:** All secrets exist, compute SA has access
- **Cold starts:** Fixed (min-instances=1, under 500ms)

### External Dependencies — Status (2026-07-15)

| # | Task | Status |
|---|---|---|
| 1 | Stripe price IDs | **Done** — all 5 prices active in test mode |
| 2 | Stripe checkout + webhook | **Done** — webhook `api.searchgoodly.com/api/webhook/stripe` |
| 3 | Resend domain | **DNS live** — awaiting Resend verify poll (`searchgoodly.com`) |
| 4 | GA4 measurement ID | **Done** — `G-ZFFNFYE2YP` on production |
| 5 | Sentry DSN | **Done** — backend + frontend |
| 6 | Google Search Console | TXT live — click Verify if not yet confirmed |
| 7 | Uptime monitoring | **Done** — Cloud Monitoring (not UptimeRobot) |
| 8 | Google OAuth client ID | In Secret Manager as `GOOGLE_CLIENT_ID` |

---

## What I Can Do Now (No External Dependencies)

### 1. Add Blog Posts (Content)
- **Goal:** 6 posts → 15-20 posts for SEO authority
- **How:** Use the blog service API to seed posts, or create markdown files
- **Files:** `backend/blog_service.py`, MongoDB
- **Topics:** Local SEO for restaurants, Google Business Profile optimization, Instagram for small business, page speed SEO, AI visibility for local businesses, mobile-friendly websites, keyword research for beginners, Google Maps ranking factors, social media audit guide, content marketing for small business

### 2. Set Up MongoDB Backup Cron
- **Goal:** Automated daily backups
- **How:** Create GitHub Actions workflow that runs `scripts/backup-mongo.sh` daily
- **Files:** `.github/workflows/backup.yml` (new), `scripts/backup-mongo.sh`
- **Note:** Needs `MONGO_URL` secret in GitHub

### 3. Add E2E Tests to CI/CD
- **Goal:** Catch regressions before deploy
- **How:** Update `.github/workflows/ci.yml` to run full-coverage E2E tests
- **Files:** `.github/workflows/ci.yml`

### 4. Add Structured Data (JSON-LD)
- **Goal:** Rich results in Google
- **How:** Add Article schema to blog posts, FAQPage to FAQ sections, LocalBusiness to industry pages
- **Files:** `frontend/src/components/app/JsonLd.jsx`, blog post pages, industry pages

### 5. Add Loading States
- **Goal:** Better UX during data fetching
- **How:** Add skeleton loaders to dashboard, audit results, blog posts
- **Files:** Various page components

### 6. Improve Mobile Experience
- **Goal:** 60%+ of users are on mobile
- **How:** Test at 375px/414px/768px, fix horizontal scroll, ensure 44px tap targets
- **Files:** Various CSS/Tailwind classes

### 7. Add Favicon Variants
- **Goal:** Better branding
- **How:** Add apple-touch-icon, mask-icon, theme-color meta
- **Files:** `frontend/index.html`, `frontend/public/`

---

## Recommended Execution Order

| # | Task | Est. Time | Impact |
|---|---|---|---|
| 1 | Add 10 blog posts | 1 hour | SEO |
| 2 | Set up backup cron | 30 min | Ops |
| 3 | Add E2E to CI/CD | 15 min | Quality |
| 4 | Add JSON-LD structured data | 30 min | SEO |
| 5 | Add loading states | 1 hour | UX |
| 6 | Mobile improvements | 1 hour | UX |
| 7 | Favicon variants | 15 min | Branding |

**Total: ~4.5 hours**

## Open Questions

1. Who has Stripe/Resend/GA4/Sentry/Google Cloud Console dashboard access?
2. Is there budget for min-instances=1 (~$7/month)?
3. Who will write real customer testimonials for /stories?
4. Should we create a staging environment (staging.searchgoodly.com)?
5. Who manages IONOS DNS for Google Search Console verification?
