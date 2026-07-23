# External Dependencies — Setup Status

Updated: 2026-07-22

**GCP project:** `goodly-seo` (dedicated). Cut over from `kai-app-1762224583` on 2026-07-22 — Cloud Run `https://goodly-api-ha7sdjf54q-uc.a.run.app`, WIF + secrets + scheduler live here. Do not use `kai-app-1762224583` for Goodly.

| # | Item | Status | Evidence |
|---|------|--------|----------|
| 1 | Stripe price IDs + checkout | **Done** | 5 active prices (Starter/Pro/Concierge); webhook `https://api.searchgoodly.com/api/webhook/stripe` |
| 2 | Resend domain | **Done — verified** | Resend API reports `searchgoodly.com` → `verified` (confirmed 2026-07-22) |
| 3 | GA4 | **Done** | `G-ZFFNFYE2YP` in production JS |
| 4 | Sentry | **Done** | Backend Secret Manager + frontend DSN (`o4510369522057216` / project `4510369535033344`) |
| 5 | Google Search Console | **Done — verified via API** | Property `https://searchgoodly.com/` verified (FILE method, `googlefc2f5395bd2bce1d.html`) via Site Verification API using compute-SA impersonation. Owners: `salihtutunemt@gmail.com` + compute SA. Sitemap (58 URLs) submitted, 0 errors. Visible at [Search Console](https://search.google.com/search-console) |
| 6 | Uptime | **Done** | Cloud Monitoring: `searchgoodly-frontend`, `searchgoodly-api-health` (5m) + email alerts |

## Resend DNS (live — confirmed via dig @ auth NS)

```
TXT  resend._domainkey.searchgoodly.com  p=MIGf...IDAQAB   (matches Resend)
MX   send.searchgoodly.com               10 feedback-smtp.us-east-1.amazonses.com
TXT  send.searchgoodly.com               v=spf1 include:amazonses.com ~all
```

Re-verify (after Resend UI restart, or wait up to a few hours):

```bash
export RESEND_API_KEY=$(gcloud secrets versions access latest --secret=RESEND_API_KEY --project=${GCLOUD_PROJECT})
curl -X POST https://api.resend.com/domains/0f8f7d33-597c-42d7-b707-684c8ec07914/verify \
  -H "Authorization: Bearer $RESEND_API_KEY"
curl https://api.resend.com/domains/0f8f7d33-597c-42d7-b707-684c8ec07914 \
  -H "Authorization: Bearer $RESEND_API_KEY"
```

## What still needs a human (2 clicks)

1. **Resend** — https://resend.com/domains → open `searchgoodly.com` → Restart / Verify DNS  
2. **Search Console** — https://search.google.com/search-console → domain `searchgoodly.com` → Verify (DNS already present)
