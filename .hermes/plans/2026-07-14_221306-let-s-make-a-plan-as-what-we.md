# Goodly Next Steps — Phase 3

**Date:** 2026-07-14
**Context:** 1,384 tests pass. Demo account works. All features verified. Security tight. Infrastructure stable. Now: polish, content, and external setup.

---

## Current State (What's Solid)

| Area | Status |
|---|---|
| Tests | 1,384/1,384 pass (55 shell + 382 E2E + 900 backend + 47 frontend) |
| Pages | 46/46 load with 200, zero console errors |
| Demo account | One-click login → dashboard |
| Auth | Register, login, JWT, edge cases all work |
| Public audit | Real scans, real scores |
| API | All services connected, under 500ms |
| Security | CSP, X-CTO, XFO, XSS, HSTS, Referrer-Policy, Permissions-Policy |
| SSL | Valid until Oct 2026 |
| Domain | Expires June 2027 |
| Sitemap | 58 URLs |
| Backups | Daily cron via GitHub Actions |
| CI/CD | E2E tests run on PR/merge |
| SEO basics | JSON-LD, Open Graph, Twitter cards, canonical, apple-touch-icon, manifest |

---

## What's Left

### Block A: External Setup (Requires Dashboard Access)

These need someone with account access to Stripe, Resend, Google, Sentry:

| # | Task | Dashboard | Time |
|---|---|---|---|
| 1 | Create Stripe price IDs + test checkout | Stripe | 30 min |
| 2 | Verify Resend domain + test emails | Resend | 30 min |
| 3 | Get GA4 measurement ID → set in Vercel | Google Analytics | 15 min |
| 4 | Get Sentry DSN → set in Secret Manager | Sentry | 15 min |
| 5 | Verify domain in Google Search Console → submit sitemap | GSC + IONOS DNS | 15 min |
| 6 | Create UptimeRobot account → add 2 monitors | UptimeRobot | 10 min |

### Block B: Content & SEO (I Can Do)

| # | Task | Impact | Time |
|---|---|---|---|
| 7 | Add 10-15 blog posts via API | SEO authority | 1-2 hours |
| 8 | Add customer testimonials to /stories | Social proof | 30 min |
| 9 | Run Lighthouse on all 9 key pages → fix issues | Perf/SEO | 1 hour |
| 10 | Add per-page JSON-LD (Article, FAQPage, LocalBusiness) | Rich results | 30 min |

### Block C: UX Polish (I Can Do)

| # | Task | Impact | Time |
|---|---|---|---|
| 11 | Add skeleton loaders to dashboard, audit, blog | Perceived speed | 1 hour |
| 12 | Test mobile at 375px/414px/768px → fix issues | Mobile UX | 1 hour |
| 13 | Add unique server-side meta titles (or accept SPA limitation) | SEO | 30 min |

### Block D: Operations

| # | Task | Impact | Time |
|---|---|---|---|
| 14 | Create staging environment (staging.searchgoodly.com) | Safe deploys | 1 hour |
| 15 | Add `MONGO_URL` secret to GitHub for backup cron | Backups work | 5 min |

---

## Recommended Execution Order

**This session (no dependencies):**
1. Add 10-15 blog posts (Block B.7)
2. Add skeleton loaders (Block C.11)
3. Add per-page JSON-LD (Block B.10)
4. Run Lighthouse + fix issues (Block B.9)
5. Mobile testing + fixes (Block C.12)

**When dashboard access available:**
6. Stripe price IDs + checkout test (Block A.1)
7. Resend verification (Block A.2)
8. GA4 + Sentry + GSC + UptimeRobot (Block A.3-6)
9. GitHub secret for backups (Block D.15)
10. Staging environment (Block D.14)

---

## Files Likely to Change

| File | Change |
|---|---|
| `backend/blog_service.py` | Seed additional blog posts |
| `frontend/src/pages/Dashboard.jsx` | Skeleton loaders |
| `frontend/src/pages/AuditDetail.jsx` | Skeleton loaders |
| `frontend/src/pages/Blog.jsx` | Skeleton loaders |
| `frontend/src/components/app/JsonLd.jsx` | Article, FAQPage, LocalBusiness schemas |
| `frontend/src/pages/BlogPost.jsx` | Article JSON-LD |
| `frontend/src/pages/IndustryPage.jsx` | LocalBusiness JSON-LD |
| `frontend/src/pages/Landing.jsx` | FAQPage JSON-LD |
| Various CSS files | Mobile fixes |

## Success Criteria

- [ ] 15+ blog posts live
- [ ] Skeleton loaders on dashboard, audit, blog
- [ ] JSON-LD on blog posts, FAQ, industry pages
- [ ] Lighthouse ≥ 80/90/90/90 on all 9 key pages
- [ ] No horizontal scroll at 375px
- [ ] All 1,384 tests still pass
