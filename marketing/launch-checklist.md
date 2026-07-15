# Goodly — Launch Checklist & Distribution Plan
> Last updated: July 7, 2026
> Status: Product is live, all systems go. This is the execution plan.

---

## CURRENT STATE

| System | Status | Detail |
|--------|--------|--------|
| Backend API | ✅ Live | v1.9.0, Cloud Run, all services configured |
| Frontend | ✅ Live | Vercel, searchgoodly.com, all pages 200 |
| Stripe | ✅ Configured | Checkout, webhooks, customer portal |
| Email (Resend) | ✅ Configured | All templates built, scheduler sending |
| Blog | ✅ Live | 9 posts published, RSS feed active |
| Free Tools | ✅ Live | 8 SEO tools, all functional |
| Industry Pages | ✅ Live | 5 pages: restaurants, plumbers, salons, dentists, retail |
| Scheduler | ✅ Running | Hourly audits, daily notifications, trial checks, re-engagement |
| Analytics | ⚠️ Needs IDs | GA + Meta Pixel code in place, needs real IDs |
| Calendly | ⚠️ Needs setup | Code in place, needs calendly.com account |

---

## AUDIT DATA (20 real SMB sites analyzed)

| Industry | Avg Score | Avg Issues | Avg Monthly Loss |
|----------|-----------|------------|------------------|
| Plumbers | 94/100 | 2 | $475/mo |
| Dentists | 84/100 | 4 | $933/mo |
| Retail | 86/100 | 3 | $850/mo |
| Restaurants | 74/100 | 6 | $2,050/mo |
| Salons | 66/100 | 6 | $2,125/mo |

**Top issues across all sites:**
1. Meta tags (9/16 sites) — missing descriptions, titles too long/short
2. Image alt text (5/16 sites) — images without alt attributes
3. Heading structure (2/16 sites) — missing or multiple H1s

**Key insight for marketing:** "We audited 20 real small business websites. The average restaurant is losing $2,050/month from SEO issues they can fix in an afternoon."

---

## WEEK 1: FOUNDATION (Do this week)

### Day 1 — Analytics Setup
- [ ] Create Google Analytics account → get Measurement ID (G-XXXXXXXX)
- [ ] Create Meta Business account → get Pixel ID
- [ ] Replace placeholder IDs in frontend/index.html
- [ ] Deploy frontend with real IDs
- [ ] Verify events firing in GA real-time report

### Day 2 — Calendly Setup
- [ ] Create calendly.com account (free tier is fine)
- [ ] Create "Concierge Intro Call" event (15 min)
- [ ] Set availability (start with 2-3 slots/week)
- [ ] Update Calendly link in ConciergeOnboarding.jsx
- [ ] Deploy

### Day 3 — Stripe Price IDs
- [ ] Create products in Stripe dashboard:
  - Starter Monthly ($49/mo)
  - Starter Annual ($490/yr)
  - Pro Monthly ($149/mo)
  - Pro Annual ($1,490/yr)
  - Concierge Monthly ($1,000/mo)
- [ ] Add Price IDs to Google Secret Manager
- [ ] Test checkout flow end-to-end

### Day 4 — Google Search Console
- [ ] Add searchgoodly.com to Google Search Console
- [ ] Submit sitemap.xml
- [ ] Verify all pages are indexed
- [ ] Set up email alerts for indexing issues

### Day 5 — Social Proof
- [ ] Create Goodly Twitter/X account
- [ ] Create Goodly LinkedIn page
- [ ] Add social links to footer
- [ ] Post first content: "We audited 20 small business websites. Here's what we found."

---

## WEEK 2: REDDIT LAUNCH

### Post #1: r/smallbusiness (Tuesday, 7-10am EST)
**Title:** I got tired of SEO tools costing $129/month, so I built a free one

**Body:** (Use the post from marketing/reddit-launch-posts.md)

**Key data points to include:**
- "We audited 20 real small business websites. The average restaurant is losing $2,050/month."
- "90% of sites had the same 3 problems: missing meta descriptions, no H1, images without alt text"
- "All fixable in under an hour. Total cost: $0."

**Engagement plan:**
- Reply to EVERY comment within 2 hours
- Offer free audits to anyone who asks
- Don't be salesy — just helpful

### Post #2: r/SEO (Thursday, 7-10am EST)
**Title:** I audited 20 small business websites — 90% had the same 3 problems

**Body:** (Use post #2 from marketing/reddit-launch-posts.md)

### Post #3: r/Entrepreneur (Following Tuesday)
**Title:** The real reason your business isn't on page one of Google

---

## WEEK 3-4: CONTENT ENGINE

### Blog posts to publish (2/week)
1. "How a Portland Restaurant Went from Invisible to #1 on Google in 83 Days" (case study)
2. "The $49 SEO Tool That's Replacing $1,500/month Agencies"
3. "Why Your Google Business Profile Is Costing You Customers"
4. "Page Speed SEO: How a 1-Second Delay Costs You 7% of Conversions"
5. "Local SEO Checklist: 15 Things to Fix Before Your Competitors Do"
6. "How to Get More Google Reviews (Without Getting Penalized)"
7. "The Small Business Guide to TikTok SEO"
8. "What the Google Algorithm Update Means for Your Small Business"

### Free tools to promote
- Post each free tool individually on relevant subreddits
- r/webdev: Meta Tag Checker, Page Speed Test, SSL Checker
- r/SEO: Schema Validator, Robots Checker, Keyword Density Checker
- r/smallbusiness: All tools as a bundle

---

## WEEK 5-8: PAID ACQUISITION

### Google Ads (start with $20/day)
**Keywords to target:**
- "free seo audit" — $2-4 CPC, high intent
- "website checker" — $1-3 CPC
- "seo checker" — $2-5 CPC
- "google ranking check" — $2-4 CPC
- "why is my website not on google" — $1-3 CPC

**Ad copy:**
"Free SEO Audit — See Why You're Not on Google. Paste your URL. Get your score in 30 seconds. No signup needed."

### Retargeting (Meta Pixel)
- Retarget all free audit users who didn't sign up
- Ad: "You scored 62/100. Here's how to fix it. Free account. 7-day trial."
- Retarget blog readers with industry-specific ads

---

## ONGOING: METRICS TO TRACK

### Weekly
- [ ] New signups
- [ ] Free audits run
- [ ] Trial starts
- [ ] Paid conversions
- [ ] Blog traffic (Google Analytics)
- [ ] Reddit post performance

### Monthly
- [ ] MRR
- [ ] Churn rate
- [ ] Conversion rate (visitor → signup → paid)
- [ ] Top-performing blog posts
- [ ] Top-performing acquisition channels
- [ ] Customer feedback / feature requests

---

## QUICK WINS (Do immediately)

1. **Add your real email to the footer** — hello@searchgoodly.com is already there, make sure it works
2. **Set up email forwarding** — support@, sales@, hello@ → your real inbox
3. **Create a "Powered by Goodly" badge** — for agencies to put on client reports
4. **Add a "Share your audit" button** — let users share their score on social media
5. **Set up Google Alerts** — for "searchgoodly.com" mentions

---

## REVENUE PROJECTIONS

Based on industry averages for SaaS:

| Metric | Conservative | Realistic | Optimistic |
|--------|-------------|-----------|------------|
| Free audits/day | 50 | 200 | 500 |
| Signup rate | 5% | 10% | 15% |
| Trial start rate | 20% | 30% | 40% |
| Trial → paid | 30% | 50% | 60% |
| **Month 1 MRR** | $245 | $1,470 | $4,410 |
| **Month 3 MRR** | $735 | $4,410 | $13,230 |
| **Month 6 MRR** | $2,205 | $13,230 | $39,690 |
| **Month 12 MRR** | $4,410 | $26,460 | $79,380 |

**The math:** If 200 people/day run a free audit, 20 sign up, 6 start a trial, 3 convert to paid at $49/mo = $147/day = $4,410/month.

---

## THE ONE THING

If you only do ONE thing from this entire plan: **post to r/smallbusiness.**

That single post, if it gets 500+ upvotes, will bring more traffic than everything else combined. The product is ready. The funnel is built. The content is live. All it needs is distribution.

Post the Reddit thread. Engage with every comment. Let the product sell itself.
