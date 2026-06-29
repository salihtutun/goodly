# Goodly — Product Requirements Document

> **Last updated:** 2026-06-29
> **Status:** v1.6 — Unified Visibility Score + AI Assistant visibility shipped. Full 5-channel coverage.

## 1. Vision
Goodly is the **visibility OS for startups** — one place to see, fix, and grow your presence on every channel that brings customers: Google, Instagram, TikTok, YouTube, and AI assistants.

## 2. Pricing
- **Self-serve** $0 (3 audits/mo, 1 project)
- **Concierge** $1,000/mo (done-for-you, 25 properties, all channels, 90-day promise)

## 3. Channels covered (full quintuple)
- ✅ **Google Search / SEO** (v1.0) — on-page audit, AI recs, scheduled re-runs, PDF report
- ✅ **Google SERP rank tracking** (v1.1) — DuckDuckGo + SerpAPI optional
- ✅ **Instagram / TikTok / YouTube** (v1.5) — audit + AI suggestions + competitor analysis
- ✅ **AI Assistants** (v1.6) — ChatGPT/Claude/Perplexity/Gemini visibility simulation
- 🟡 Backlog: Google Business Profile / Maps, LinkedIn, Yelp + directories

## 4. v1.6 Changes
### AI Assistant Visibility (NEW channel)
- `POST /api/ai-visibility/check` — input business + category + location, get per-assistant simulation
- `GET /api/ai-visibility/history` — recent checks
- Backend `/app/backend/ai_visibility.py` uses Claude Sonnet 4.6 to simulate ChatGPT, Claude, Perplexity and Gemini responses to category queries, returns:
  - `overall_visibility_score` 0-100
  - `per_assistant` with `likely_mentions`, `estimated_position`, `likely_top_5_brands`, `reasoning`
  - `blocking_factors` (what's keeping you out of AI answers)
  - `discoverability_signals_missing` (specific online artifacts needed)
  - `improvement_plan` (concrete actions with effort estimates)
- Frontend `/app/ai-visibility` with the diagnostic + per-assistant breakdown + 3 actionable sections (blockers, missing signals, action plan).
- Honest disclosure: "Best-effort simulation based on public training-data patterns. Not a live API query."

### Unified Visibility Score (NEW north-star)
- `GET /api/dashboard/visibility` — single weighted score (Google 30%, IG 17.5%, TT 17.5%, YT 15%, AI 20%) with breakdown + `informed_fraction`.
- New `VisibilityTile` on Dashboard shows the big ring + 5 channel mini-tiles. Each channel tile is clickable to the audit page for that channel. Shows "X% informed — run more audits to lock in your real number" when not all channels have data.

## 5. Verified
- Backend lint clean. Frontend lint clean (3 pre-existing shadcn UI library issues remain).
- `/api/dashboard/visibility` smoke-test (no LLM call required): demo user with only Google audit returns overall=20, informed_fraction=0.3, breakdown shows google=68 + others null. Logic confirmed correct.
- Visual: Dashboard renders new tile at top with proper ring + 5 channel mini-tiles. AI Visibility page renders with new headline + form.
- **NOT re-tested by testing subagent** this iteration because `EMERGENT_LLM_KEY` budget exhausted from v1.5 — would just yield 502s. Re-test once user tops up.

## 6. Architecture summary
- Backend: FastAPI + Motor + emergentintegrations (Claude 4.6) + Stripe SDK (subscription + portal) + ReportLab + APScheduler + Resend + httpx + BeautifulSoup.
- Frontend: React 19 + react-router 7 + Tailwind + shadcn/ui + Recharts + Sonner.
- DB collections: users, projects, audits, payment_transactions, serp_checks, scheduled_runs, concierge_briefs, social_audits, ai_visibility_checks, ai_history.

## 7. Next Action Items
- **Top up `EMERGENT_LLM_KEY`** (still blocking — required for all AI features incl. the new AI-visibility one). Profile → Universal Key → Add Balance.
- Build **Google Business Profile** audit next (highest-impact channel for local startups — explicitly asked but not yet built).
- Test the v1.6 endpoints (AI visibility + unified score) once budget is refilled.

## 8. Backlog
- P1 Google Business Profile audit (next channel)
- P1 Resend API key + verified sender domain (for digest emails)
- P1 Real Stripe Price ID for live $1,000/mo Concierge
- P2 LinkedIn audit (for B2B startups)
- P2 Yelp + TripAdvisor + niche directories
- P2 Specialist CRM view (`/app/admin/clients`)
- P2 Whitelabel PDF (custom logo per concierge client)
- P2 Multi-page site audit (full crawl)
- P3 Auto-generated content calendar from suggestions
- P3 Live AI-assistant queries (when affordable APIs available) to replace simulation
