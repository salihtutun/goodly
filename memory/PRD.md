# RootedSEO — Product Requirements Document

> **Last updated:** 2026-06-28
> **Status:** MVP complete, end-to-end verified by testing agent.

## 1. Original Problem Statement
> "In these days, I want to develop the framework to optimize of SEO for small companies. Can you help me to do it"

## 2. User Choices (gathered)
- Core features: All — SEO audit + keyword research + AI content/meta + competitor analysis
- AI: **Claude Sonnet 4.6** via Emergent Universal LLM key
- Auth: **Email + password (JWT)**
- Persistence: Saved projects + audit history per user
- Design: Earthy & Organic light theme (warm alabaster + forest green + terracotta accents) — chosen by design agent to avoid AI-slop tropes.

## 3. Target User Personas
- **Small shop owner** (florist, bakery, studio): non-technical, wants plain-English advice.
- **Side-hustle founder**: needs to rank locally without hiring an agency.
- **Tiny in-house marketer**: wants a single dashboard to track multiple client sites.

## 4. Architecture
- **Backend**: FastAPI + Motor (MongoDB) + bcrypt + PyJWT + httpx + BeautifulSoup + emergentintegrations (Claude Sonnet 4.6).
- **Frontend**: React 19 + react-router 7 + Tailwind + shadcn/ui + Recharts + Sonner toasts + axios.
- **Auth**: JWT (7 day). Token in localStorage AND httpOnly cookie. `withCredentials: true` + Bearer header. Routes protected via React `<Protected>` wrapper.
- **DB collections**: `users`, `projects`, `audits`, `ai_history`.

## 5. Implemented (2026-06-28)
- Landing page with hero, bento features, how-it-works, testimonial, CTA, footer.
- Auth: register, login, /me, logout. Demo + Admin users auto-seeded on startup.
- Dashboard: stat tiles, quick actions, recent audits, project preview.
- Projects: create dialog, list grid with score rings, delete, run-audit shortcut, project detail with score-history line chart.
- SEO Audit: paste URL → backend fetches via httpx, parses with BeautifulSoup, scores 8 categories (meta_tags, headings, performance, mobile, accessibility, content, social, security). Generates issues list with severity.
- Audit detail: large overall score, 8 category tiles, tabs for AI Action Plan / Issues / Raw Details.
- AI Studio (Claude Sonnet 4.6): Meta tag writer, Keyword research, Competitor analysis — each returns structured JSON rendered to UI.
- Verified end-to-end by testing agent (100% backend / 100% frontend on critical flows).

## 6. Backlog (P1 / P2)
- **P1**: Stripe billing (free vs pro tier with audit limits).
- **P1**: Scheduled monthly audits + email digest (Resend).
- **P1**: Export audit as PDF for client reporting.
- **P2**: SERP rank tracking for specific keywords (requires Alpha Vantage or similar API).
- **P2**: Backlink overview / domain authority (third-party API).
- **P2**: Onboarding tutorial / sample data button on first login.
- **P2**: Multi-user team accounts.
- **P2**: AI suggestion to auto-rewrite a specific page (paste a URL → get full HTML rewrite).

## 7. Next Action Items
- Decide on monetization (free-tier limits or paid plans) before adding Stripe.
- Decide which email provider (Resend recommended) for scheduled-audit notifications.
