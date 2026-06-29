# Goodly — Product Requirements Document

> **Last updated:** 2026-06-29
> **Status:** v1.5 — Multi-channel visibility live. Social Reach (Instagram + TikTok + YouTube) shipped.

## 1. Vision
Help startups get more customers from every channel they use — Google search, Google Maps, Instagram, TikTok, YouTube, AI assistants. One platform. One workflow: **Audit & score → AI improvements → Competitor analysis** repeated across each channel.

## 2. Pricing (unchanged)
- **Self-serve** $0 (3 audits/mo, 1 project)
- **Concierge** $1,000/mo (done-for-you across every channel)

## 3. Channels covered
- ✅ **Google Search / on-page SEO** (v1.0)
- ✅ **Google SERP rank tracking** (v1.1, DuckDuckGo + SerpAPI optional)
- ✅ **Instagram** audit + AI suggestions + competitor analysis (v1.5)
- ✅ **TikTok** same triple (v1.5)
- ✅ **YouTube** same triple (v1.5)
- 🟡 Backlog: Google Business Profile / Maps, Yelp + directories, AI-assistant visibility, LinkedIn

## 4. v1.5 Changes
- **3 new endpoints**: `POST /api/social/audit`, `POST /api/social/suggestions`, `POST /api/social/competitors`, plus `GET /api/social/audits?platform=`.
- **Server-authoritative platform allow-list**: `{instagram, tiktok, youtube}` (400 on anything else).
- **Best-effort public profile signals**: `social_fetcher.fetch_profile_signals(platform, handle)` tries to grab og:title/og:description/follower estimate from the public HTML. Never raises; UI doesn't depend on it but Claude gets the extra context when available.
- **Platform-aware Claude prompts**: `PLATFORM_HINTS` injects platform-specific best-practice knobs (bio character limits, hashtag norms, hook formulas, posting cadence) into every prompt — no generic "social tips".
- **Frontend `/app/social`** with tabbed UI (3 platforms × 3 modes = 9 combinations). Click-to-copy hashtag chips and bio rewrites. Inline error tile when AI service fails (not just toast).
- **Landing rewritten**: hero now reads "We get your startup found. On Google, on Instagram, on TikTok, on YouTube. Your phone starts ringing." Eyebrow widened to "Done-for-you visibility for startups".
- **Dashboard quick-action** added for `Social Reach`. Sidebar nav gets `Social Reach` between SEO Audit and AI Studio.

## 5. Verified (v1.5)
- **20/20 backend pytest pass** — auth gating, platform validation, response shape, persistence, history filter, `_id` exclusion.
- Frontend lint clean, all data-testids in place, page renders correctly with all 3 platform tabs and 3 mode buttons.
- Live Claude smoke test: instagram audit for `@acmepottery` returned score=38 with 7 issues + 4 quick wins, all 6 categories populated.
- ⚠️ **EMERGENT_LLM_KEY budget exhausted during testing** — backend correctly returns 502, frontend now shows both a toast AND an inline ErrorTile when this happens (UX polish applied post-test).

## 6. Architecture summary
- FastAPI + Motor + emergentintegrations (Claude 4.6 + Stripe checkout) + raw Stripe SDK (subscription + portal) + ReportLab + APScheduler + Resend + httpx + BeautifulSoup.
- React 19 + react-router 7 + Tailwind + shadcn/ui + Recharts + Sonner.
- DB collections: users, projects, audits, payment_transactions, serp_checks, scheduled_runs, concierge_briefs, **social_audits**, ai_history.

## 7. Next Action Items
- **Top up `EMERGENT_LLM_KEY` budget** in Profile → Universal Key. Current cost exceeded the 3.20 cap during the 20 pytest suite + UI testing.
- Decide next channel(s) to add: Google Business Profile (huge for local startups) OR AI-assistant visibility ("does ChatGPT recommend you when asked about your category?") — both are wide-open in 2026.
- Optional: surface social audit history on the project detail page so each saved website has a unified visibility report across Google + social.

## 8. Backlog
- P1 Google Business Profile audit + AI suggestions (next channel)
- P1 AI Assistant visibility ("ask ChatGPT about your category, see if your business is mentioned")
- P1 Unified Visibility Score on Dashboard (single 0-100 blending Google + Instagram + TikTok + YouTube)
- P1 Real Stripe Price ID for Concierge ($1,000/mo) + Resend API key for digest emails
- P2 Whitelabel PDF (custom logo per concierge client)
- P2 Specialist CRM view (`/app/admin/clients` page with all briefs + all audits)
- P2 LinkedIn + Yelp + directory citations
- P2 Multi-page site audit
- P3 Auto-generated content calendar from suggestions
