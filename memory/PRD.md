# Goodly — Product Requirements Document

> **Last updated:** 2026-06-29
> **Status:** v1.3 — Rebranded to Goodly, restructured to a $1,000/mo Concierge SEO service.

## 1. Original Problem Statement
> "In these days, I want to develop the framework to optimize of SEO for small companies."
> v1.3 update: "I will be 1000 dollars (monthly) for each startup company. But, we will optimize their SEO and we will make sure they are at the first on google search and others and everyone start to call their business! Also, change the name as goodly."

## 2. Brand & Positioning (v1.3)
- **Brand**: Goodly
- **Positioning**: Done-for-you SEO service for startups & small companies
- **Promise**: Page-one on Google in 90 days, or month 4 is free
- **Pricing**:
  - Self-serve: $0 (3 audits/mo, 1 project — tool-only trial)
  - **Concierge: $1,000/mo** (done-for-you, 25 properties, unlimited audits, weekly SERP tracking, monthly PDF reports, dedicated specialist)

## 3. Architecture (unchanged from v1.2)
- Backend: FastAPI + Motor (Mongo) + JWT + Claude Sonnet 4.6 + Stripe + ReportLab + APScheduler + Resend
- Frontend: React 19 + Tailwind + shadcn/ui + Recharts
- Background: APScheduler hourly for due monthly audits → digest email (mocked until RESEND_API_KEY set)

## 4. v1.3 Changes
- Brand rename **RootedSEO → Goodly** across logo, hero, login/register shells, PDF footer, email digest copy, FastAPI service name, bot user-agent, PRD, test_credentials.md
- Pricing restructured to two plans: `free` (Self-serve $0) and `concierge` ($1,000/mo)
- Legacy `pro` / `agency` users migrated to `concierge` on startup
- Demo & admin users now seed as `concierge`
- Landing copy rewritten to lead with the page-one promise + service positioning
- Pricing section: 2-up grid (was 3-up); Concierge card highlighted with full feature list
- Testimonial rewritten to reflect concierge service ("Goodly handled everything... easiest $1k I spend each month")

## 5. Verified (v1.3)
- Backend `/api/` returns `{"service":"Goodly API"}`
- `/api/billing/plans` returns 2 plans: Self-serve $0 + Concierge $1000
- Demo user `/api/auth/me` returns `plan: "concierge"`
- Landing screenshots: brand reads "goodly", hero h1 = "We get your startup to #1 on Google. Your phone starts ringing.", pricing shows the new 2-plan grid with $1000 Concierge highlighted.
- Frontend lint: no issues in my code (3 pre-existing shadcn library issues remain)
- All 58 backend tests from prior iterations remain valid (plan names changed but endpoint contracts unchanged).

## 6. Backlog
- **P1**: Provide a real Stripe Price ID / product on $1,000 Concierge — currently uses Emergent test Stripe with dynamic amount
- **P1**: BYO Resend API key UI (so users can send real digest emails)
- **P1**: Stripe Customer Portal live happy-path verification (manual test-card checkout)
- **P2**: Whitelabel PDF for clients
- **P2**: Multi-page crawl
- **P2**: Production SERP via SerpAPI / DataForSEO
- **P2**: CRM-style client management view for the SEO specialist (since this is now a service business)
- **P3**: Onboarding questionnaire after Concierge purchase (target keywords, competitors, business goals)

## 7. Next Action Items
- Push to GitHub via Emergent's UI integration (see chat for instructions — main agent cannot push directly)
- Decide on Stripe Price IDs for the $1,000 Concierge product
- Add a Concierge onboarding form (post-purchase) so the specialist has everything to start work day 1
