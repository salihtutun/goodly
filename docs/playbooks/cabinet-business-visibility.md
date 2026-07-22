# Visibility Playbook — Cabinet Business (St. Louis Example)

**Generated end-to-end with Goodly's live production tools on 2026-07-21.**
Example business: USA Cabinet Express, St. Louis, MO (`usacabinetexpress.com/location/st-louis-mo/`).
Every score, keyword, and recommendation below is real output from the deployed API — this is exactly what a customer sees.

The goal: when someone in St. Louis searches "kitchen cabinets near me" — on Google, Maps, or ChatGPT — this business shows up first, and the phone rings.

---

## Where the business stands today (Goodly's diagnosis)

| Tool | Score | What it means |
|------|-------|---------------|
| Website SEO audit | **84/100** | Strong technical base; weak meta tags (70), accessibility (40), thin content (70), no schema |
| Google Business Profile audit | **18/100** | Severely incomplete — missing address/phone/hours, zero Google Posts, no review responses |
| AI assistant visibility | **30/100** | ChatGPT/Claude won't recommend it; loses to Home Depot, Lowe's, IKEA in AI answers |

The pattern Goodly surfaces is common for small businesses: the **website is fine, but the discovery layer is broken**. People can't find the business in the places they actually search.

---

## Phase 1 — Week 1: Fix the Google Business Profile (biggest lever, $0 cost)

GBP is what shows in the Map Pack — the 3 businesses Google shows above all normal results for "cabinet store near me". Goodly's GBP audit (18/100) produced these quick wins:

1. **Add full address, phone number, and operating hours** — critical info is missing, so Google can't rank the profile at all.
2. **Expand the business description to 600–750 characters** with local keywords ("custom kitchen cabinets in St. Louis", "cabinet refacing", "free design consultation").
3. **Add up to 9 secondary categories** — "Kitchen Remodeler", "Countertop Store", "Bathroom Remodeler" — each one is another search you can appear in.
4. **Publish 1–2 Google Posts per week** (project photos, offers). Zero posts signals a dormant business to Google.
5. **Respond to every review** — response rate is a local ranking factor and a trust signal for the 4.5★ rating already earned.

Expected effect: this alone typically moves a business into Map Pack contention within 4–8 weeks for "near me" searches.

## Phase 2 — Week 1–2: On-site fixes (copy-paste ready from Goodly)

The audit's AI action plan, with the assets Goodly already generated:

1. **Replace the title tag** — Goodly's top option (60 chars, keyword-first):
   > Kitchen Cabinets St. Louis | Custom, Shaker & RTA | USA Cabinet Express
2. **Replace the meta description** (current one is just an address):
   > Find your dream kitchen & bathroom cabinets in St. Louis! USA Cabinet Express offers custom, shaker, and RTA cabinets with expert design consultation & professional installation.
3. **Paste the LocalBusiness JSON-LD schema** Goodly generated (name, address, phone, hours, price range) into the page `<head>` — this feeds Google's knowledge panel and rich results. Full snippet in the app under AI Tools → Schema.
4. **Add alt text to the 3 images missing it** (accessibility score 40 → ~90; also helps Google Images, where people browse cabinet styles).
5. **Thicken the location page content** — the content score (70) reflects a thin page. Add sections for each service + neighborhood names served (Kirkwood, Webster Groves, Chesterfield…).

## Phase 3 — Weeks 2–6: Own the searches that bring buyers

Goodly's keyword research for "kitchen cabinets" in St. Louis found the money terms:

| Keyword | Intent | Difficulty | Volume |
|---------|--------|-----------|--------|
| kitchen cabinets St. Louis | commercial | medium | high |
| kitchen remodeling St. Louis | transactional | high | high |
| custom cabinets St. Louis | commercial | medium | medium |
| cabinet refacing St. Louis | commercial | medium | medium |
| kitchen design St. Louis | commercial | medium | medium |

And generated the content plan to capture them (one piece per week):

1. Landing page: **"Custom Kitchen Cabinets St. Louis: Design Your Dream Kitchen"** → targets `custom cabinets St. Louis`
2. Guide: **"How to Budget for Your Kitchen Cabinet Project in St. Louis"** → targets `kitchen cabinet cost St. Louis` (buyers researching price are close to purchase)
3. Blog: **"Refacing vs. Replacing: Which is Right for Your St. Louis Kitchen?"** → targets `cabinet refacing vs replacement`
4. FAQ page: **"Your Top Questions About Kitchen Remodeling in St. Louis Answered"** → targets `kitchen remodeling St. Louis cost`, feeds Google's "People also ask"
5. Blog: **"The Ultimate Guide to Kitchen Cabinet Styles for St. Louis Homes"** → top-of-funnel, earns links and Pinterest/Google Images traffic

## Phase 4 — Weeks 4–12: Get recommended by AI assistants

Goodly's AI visibility check (30/100) found that ChatGPT recommends Home Depot and IKEA instead — because the business has no citations AI models learn from. The improvement plan:

1. **Get on local "best of" lists** (St. Louis Magazine, Riverfront Times, local blogs) — these lists are exactly what AI assistants cite.
2. **Diversify reviews beyond Google** — Houzz, Yelp, BBB, Angi. Multiple platforms = multiple signals.
3. **Local PR** — pitch a kitchen-transformation story to St. Louis media; one article outranks months of ads.
4. **Participate in r/StLouis and local Facebook groups** where "who did your kitchen?" gets asked weekly.
5. **Publish project case studies with photos** — shareable content earns the links AI systems trust.

## Ongoing — Goodly automates the monitoring

- **Weekly scheduled re-audits** (Cloud Scheduler is live) catch regressions.
- **Drift detection** alerts if the site's title/schema/content changes for the worse.
- **Rank tracking** shows keyword movement week over week.
- **Revenue impact estimates** on each audit tie fixes to dollars, so the owner knows what to do first.

---

## The expected trajectory

| Timeline | What happens |
|----------|--------------|
| Weeks 1–2 | GBP complete + on-site fixes live. Google re-crawls; profile becomes rankable. |
| Weeks 4–8 | Map Pack appearances for "cabinet store near me" begin. First calls from Google Maps. |
| Weeks 8–16 | Content pages rank for "cost"/"refacing" searches. Steady inquiry flow from organic. |
| Months 4–6 | Citations accumulate; AI assistants start including the business in recommendations. |

The whole loop — audit → prioritized fixes → generated assets (titles, descriptions, schema) → content plan → monitoring — is what Goodly sells. This playbook demonstrates it works end-to-end in production for exactly the "cabinet business wants calls" scenario.
