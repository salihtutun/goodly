# Goodly — Product Requirements Document

> **Last updated:** 2026-06-29
> **Status:** v1.4 — Real Stripe subscription mode + Concierge onboarding brief shipped.

## 1. Original Problem Statement
> "In these days, I want to develop the framework to optimize of SEO for small companies."
> Updated to: $1,000/mo concierge service for startups + done-for-you SEO + page-one promise. Brand: Goodly.

## 2. Brand & Pricing
- **Goodly** — done-for-you SEO for startups
- **Self-serve** $0 (3 audits/mo, 1 project — tool-only trial)
- **Concierge** $1,000/mo (done-for-you, 25 properties, unlimited audits, weekly SERP tracking, monthly PDF reports, page-one in 90 days or month 4 free)

## 3. Architecture (current)
- Backend: FastAPI + Motor + JWT + Claude Sonnet 4.6 + Stripe (Emergent + raw SDK) + ReportLab + APScheduler + Resend (mocked until key) + SerpAPI/DDG fallback.
- Frontend: React 19 + Tailwind + shadcn/ui + Recharts.
- Background: APScheduler hourly for due monthly audits → digest email.

## 4. v1.4 Changes
- **Real Stripe subscription mode**: `billing.py:create_subscription_checkout` branches on `STRIPE_PRICE_ID_CONCIERGE` env var. When set, uses raw `stripe.checkout.Session.create(mode='subscription', line_items=[{price: price_id, quantity: 1}])` with metadata pass-through to subscription. When unset, falls back to Emergent dynamic-amount one-time checkout (dev/test). `_NormalizedSession` wrapper makes both paths return identical shape.
- **Concierge onboarding brief**: `/app/concierge/onboarding` page — full form with chip-input target keywords + competitors + primary goal + brand voice + contact details. Persists via `POST /api/concierge/brief` (upsert, unique-indexed on user_id).
- **Dashboard prompt banner** for concierge users without a brief.
- **Sidebar nav link** to the brief page.
- **BillingSuccess** has "Start your brief" CTA after successful payment.
- **Admin view** at `GET /api/admin/concierge/briefs` — admin sees all briefs sorted by updated_at desc.
- **Free-user lock**: visiting `/app/concierge/onboarding` as a free user shows an upgrade card.

## 5. Verified (v1.4)
- Backend: 19/19 new pytest tests pass (concierge brief CRUD, upsert idempotency, free-user 402, admin-only listing, Stripe fallback returns valid `cs_test_*` session). Code review confirms both subscription-mode and fallback branches in `create_subscription_checkout`.
- Frontend: All new testids render. Concierge brief form has chip-input pattern (button + Enter key both add chips; X removes). Dashboard banner appears for concierge users without a brief and disappears after submission. Free users see the locked card. **Submit button now disabled until required fields (business_name, website, primary_goal) are filled** (fixed after first testing pass).
- Visual: brand reads "goodly", sidebar shows "Concierge brief" nav, form sections use proper Cabinet Grotesk + Outfit typography on the earthy palette.

## 6. Backlog
- **P1**: Update legacy `test_iteration3.py` to assert 'concierge' instead of pro/agency (cosmetic — covered by iter4 tests).
- **P1**: Live Stripe Price ID — user provides `STRIPE_PRICE_ID_CONCIERGE` from their Stripe Dashboard; no code change needed.
- **P1**: Resend API key for real email sends.
- **P2**: Whitelabel PDF (custom logo for concierge clients).
- **P2**: Specialist dashboard (CRM-style view of all briefs + per-client audit history).
- **P2**: Multi-page audit / full-site crawl.
- **P2**: Production SERP via SerpAPI / DataForSEO (auto-uses when `SERPAPI_KEY` set).
- **P2**: "Book a strategy call" CTA via Cal.com/Calendly above Concierge upgrade button.
- **P3**: Automated month-4-free credit when 90-day page-one goal not met.

## 7. Next Action Items
- Push to GitHub via Emergent UI's "Save to GitHub" button (main agent cannot push directly).
- Create the Concierge product + monthly Price in Stripe Dashboard, copy the `price_xxx` ID into `STRIPE_PRICE_ID_CONCIERGE` env var, restart backend — done.
- Provide a Resend API key + verified sender domain.
- Build the specialist's CRM view: a single `/app/admin/clients` page showing all concierge briefs + last-audit-scores side-by-side, so your team can manage clients in-app.
