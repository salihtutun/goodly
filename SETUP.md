# SETUP INSTRUCTIONS — Remaining Manual Clicks
# Most external deps were completed 2026-07-15 (see docs/operations/external-setup-status.md).
# Resend DNS + GSC TXT are already on IONOS — only dashboard "Verify" clicks remain.

=================================================================
0. DONE AUTOMATICALLY (do not redo)
=================================================================
- Stripe price IDs verified + checkout session OK (test mode)
- Stripe webhook → https://api.searchgoodly.com/api/webhook/stripe
- GA4 Measurement ID G-ZFFNFYE2YP live on searchgoodly.com
- Sentry DSN live (backend Secret Manager + frontend Vercel)
- Cloud Monitoring uptime checks + email alerts (admin@searchgoodly.com)
- Resend DNS (DKIM/MX/SPF) live on IONOS auth nameservers

=================================================================
0b. RESEND — CLICK VERIFY (1 minute)
=================================================================
DNS is already correct (dig @8.8.8.8 confirms). Resend API still shows pending.
1. Open https://resend.com/domains → searchgoodly.com
2. Click Restart verification / Verify DNS
3. Wait until status is verified (can take minutes to a few hours)

=================================================================
0c. GOOGLE SEARCH CONSOLE — VERIFY (2 minutes)
=================================================================
TXT google-site-verification=JmH6VMoAq5K8Cu6Gq5MsHCe2CZbf4egBeA-XFv3Q1Ns is already on the apex.
1. Open https://search.google.com/search-console
2. Add domain property searchgoodly.com (or URL prefix https://searchgoodly.com/)
3. Click Verify (DNS TXT method)

=================================================================
1. POST TO REDDIT (5 minutes)
=================================================================

1. Go to https://www.reddit.com/r/smallbusiness/submit
2. Copy the title and body from marketing/reddit-post-copy-paste.md
3. Paste and post
4. Reply to every comment

That's it. This single post will bring more traffic than everything else.

=================================================================
2. SET UP GOOGLE ANALYTICS (10 minutes)
=================================================================

1. Go to https://analytics.google.com
2. Click "Create Account" → name it "Goodly"
3. Create a property → name it "searchgoodly.com"
4. Choose "Web" as platform
5. Copy the Measurement ID (looks like G-XXXXXXXXXX)
6. Open frontend/index.html
7. Find and replace "G-XXXXXXXXXX" with your real ID (appears twice)
8. Deploy: cd frontend && npm run build && vercel --prod --yes

=================================================================
3. SET UP META PIXEL (10 minutes)
=================================================================

1. Go to https://business.facebook.com
2. Create a Business account (or use existing)
3. Go to Events Manager → Connect Data Sources → Web
4. Name it "Goodly Pixel"
5. Copy the Pixel ID (looks like 123456789012345)
6. Open frontend/index.html
7. Find and replace "XXXXXXXXXXXXXXXXX" with your real Pixel ID (appears 3 times)
8. Deploy: cd frontend && npm run build && vercel --prod --yes

=================================================================
4. SET UP STRIPE PRICE IDs (15 minutes)
=================================================================

1. Go to https://dashboard.stripe.com/products
2. Create these products (all recurring, USD):

   Starter Monthly: $49.00/month
   Starter Annual: $490.00/year
   Pro Monthly: $149.00/month
   Pro Annual: $1,490.00/year
   Concierge Monthly: $1,000.00/month

3. For each product, copy the Price ID (looks like price_xxxxxxxxxxxxx)
4. Go to Google Cloud Console → Secret Manager
5. Create these secrets with the matching Price IDs:
   - STRIPE_PRICE_ID_STARTER
   - STRIPE_PRICE_ID_STARTER_ANNUAL
   - STRIPE_PRICE_ID_PRO
   - STRIPE_PRICE_ID_PRO_ANNUAL
   - STRIPE_PRICE_ID_CONCIERGE
6. Redeploy backend: gcloud builds submit --config=cloudbuild.yaml

=================================================================
5. SET UP CALENDLY (5 minutes)
=================================================================

1. Go to https://calendly.com/signup
2. Create account with hello@searchgoodly.com
3. Create event type: "Concierge Intro Call" (15 min)
4. Set your availability
5. Copy your Calendly link
6. Open frontend/src/pages/ConciergeOnboarding.jsx
7. Find "calendly.com/searchgoodly/concierge-intro"
8. Replace with your real Calendly link
9. Deploy: cd frontend && npm run build && vercel --prod --yes
