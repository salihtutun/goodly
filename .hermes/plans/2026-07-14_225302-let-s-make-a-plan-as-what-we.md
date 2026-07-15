# Goodly Next Steps — Phase 4

**Date:** 2026-07-14
**Context:** 1,384 tests pass. Demo account works. All features verified. Security tight. Infrastructure stable. 16 blog posts. JSON-LD on all key pages. Backups automated. CI/CD updated.

---

## What's Solid (Reference)

| Area | Status |
|---|---|
| Tests | 1,384/1,384 pass |
| Pages | 46/46 load, zero console errors |
| Demo account | One-click login → dashboard |
| Auth | Register, login, JWT, edge cases |
| Public audit | Real scans, real scores |
| API | All services connected, under 500ms |
| Security | CSP, X-CTO, XFO, XSS, HSTS, Referrer-Policy, Permissions-Policy |
| SSL | Valid until Oct 2026 |
| Domain | Expires June 2027 |
| Sitemap | 58 URLs |
| Blog | 16 posts (6 original + 10 seed) |
| JSON-LD | BlogPost, FAQPage, Organization, SoftwareApplication, WebApplication, BreadcrumbList |
| Backups | Daily cron via GitHub Actions |
| CI/CD | E2E tests on PR/merge |
| Cold starts | Fixed (min-instances=1) |
| Secret Manager | All secrets exist, SA has access |

---

## What's Left

### Block A: External Setup (Dashboard Access Required)

| # | Task | Dashboard | Time |
|---|---|---|---|
| 1 | Create Stripe price IDs + test checkout | Stripe | 30 min |
| 2 | Verify Resend domain + test emails | Resend | 30 min |
| 3 | Get GA4 measurement ID → Vercel | Google Analytics | 15 min |
| 4 | Get Sentry DSN → Secret Manager | Sentry | 15 min |
| 5 | Verify domain in GSC → submit sitemap | GSC + IONOS DNS | 15 min |
| 6 | Create UptimeRobot → add 2 monitors | UptimeRobot | 10 min |

### Block B: UX Polish (No Dependencies)

| # | Task | Impact | Time |
|---|---|---|---|
| 7 | Add skeleton loaders to Dashboard, AuditDetail, Blog | Perceived speed | 1 hour |
| 8 | Add LocalBusiness JSON-LD to IndustryPage | Rich results | 15 min |
| 9 | Add customer testimonials to /stories | Social proof | 30 min |
| 10 | Mobile tap target audit (ensure ≥44px) | Mobile UX | 30 min |
| 11 | Add error boundaries to remaining page components | Resilience | 30 min |

### Block C: Content & SEO

| # | Task | Impact | Time |
|---|---|---|---|
| 12 | Add 5 more blog posts (industry-specific) | SEO depth | 1 hour |
| 13 | Add FAQPage JSON-LD to Landing page FAQ section | Rich results | 15 min |
| 14 | Add unique meta descriptions to top 10 pages | CTR in SERPs | 30 min |

### Block D: Operations

| # | Task | Impact | Time |
|---|---|---|---|
| 15 | Create staging environment (staging.searchgoodly.com) | Safe deploys | 1 hour |
| 16 | Add MONGO_URL secret to GitHub for backup cron | Backups work | 5 min |
| 17 | Add pre-deploy smoke test to CD pipeline | Catch regressions | 15 min |

---

## Recommended Execution Order

**This session (no dependencies, ~3 hours):**
1. Add skeleton loaders (Block B.7)
2. Add LocalBusiness JSON-LD to industry pages (Block B.8)
3. Add FAQPage JSON-LD to landing page (Block C.13)
4. Add error boundaries (Block B.11)
5. Mobile tap target audit (Block B.10)
6. Add 5 industry-specific blog posts (Block C.12)
7. Add unique meta descriptions (Block C.14)

**When dashboard access available (~2 hours):**
8. Stripe + Resend + GA4 + Sentry + GSC + UptimeRobot (Block A)
9. GitHub secret + staging + CD smoke test (Block D)

---

## Files Likely to Change

| File | Change |
|---|---|
| `frontend/src/pages/Dashboard.jsx` | Skeleton loaders |
| `frontend/src/pages/AuditDetail.jsx` | Skeleton loaders |
| `frontend/src/pages/Blog.jsx` | Skeleton loaders |
| `frontend/src/pages/IndustryPage.jsx` | LocalBusiness JSON-LD |
| `frontend/src/pages/Landing.jsx` | FAQPage JSON-LD |
| `frontend/src/pages/TestimonialsPage.jsx` | Customer testimonials |
| `backend/blog_service.py` | 5 more industry-specific posts |
| `frontend/src/App.jsx` | Error boundaries |
| `.github/workflows/cd.yml` | Pre-deploy smoke test |

## Success Criteria

- [ ] Skeleton loaders on Dashboard, AuditDetail, Blog
- [ ] LocalBusiness JSON-LD on all 9 industry pages
- [ ] FAQPage JSON-LD on landing page
- [ ] Error boundaries on all major page components
- [ ] No tap targets under 44px on mobile
- [ ] 20+ blog posts total
- [ ] All 1,384 tests still pass
