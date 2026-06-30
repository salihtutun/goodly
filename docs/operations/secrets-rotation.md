# Goodly Secrets Rotation Procedure

## Secrets Inventory

| Secret | Location | Rotation Frequency | Impact of Rotation |
|--------|----------|-------------------|-------------------|
| `JWT_SECRET` | GCP Secret Manager | 90 days | Invalidates all existing tokens |
| `GEMINI_API_KEY` | GCP Secret Manager | When key regenerated | AI features unavailable during rotation |
| `STRIPE_API_KEY` | GCP Secret Manager | When key regenerated | Billing unavailable during rotation |
| `STRIPE_WEBHOOK_SECRET` | GCP Secret Manager | When key regenerated | Webhooks rejected during rotation |
| `RESEND_API_KEY` | GCP Secret Manager | When key regenerated | Emails undelivered during rotation |
| `MONGO_URL` | GCP Secret Manager | When password changed | DB unavailable during rotation |
| `ADMIN_PASSWORD` | GCP Secret Manager | 90 days | Admin login uses new password |

## Rotation Procedure

### JWT_SECRET
```bash
# 1. Generate new secret
NEW_SECRET=$(openssl rand -base64 64)

# 2. Create new version in Secret Manager
echo -n "$NEW_SECRET" | gcloud secrets versions add JWT_SECRET --data-file=-

# 3. Deploy new revision (picks up latest secret version)
gcloud run deploy goodly-api --region=us-central1 --source=.

# 4. Verify
curl https://api.goodly.app/api/health
```

### GEMINI_API_KEY
```bash
# 1. Generate new key in Google AI Studio: https://aistudio.google.com/apikey
# 2. Add new version to Secret Manager
echo -n "NEW_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 3. Deploy
gcloud run deploy goodly-api --region=us-central1 --source=.

# 4. Test AI feature
curl -X POST https://api.goodly.app/api/ai/meta-tags \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"business_name":"Test","description":"Test"}'
```

### STRIPE_API_KEY
```bash
# 1. Get new key from Stripe Dashboard → Developers → API Keys
# 2. Add to Secret Manager
echo -n "sk_live_NEW_KEY" | gcloud secrets versions add STRIPE_API_KEY --data-file=-

# 3. Update webhook secret if also rotated
echo -n "whsec_NEW_SECRET" | gcloud secrets versions add STRIPE_WEBHOOK_SECRET --data-file=-

# 4. Deploy
gcloud run deploy goodly-api --region=us-central1 --source=.

# 5. Test checkout
curl -X POST https://api.goodly.app/api/billing/checkout \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"plan_id":"concierge","origin_url":"https://goodly.app"}'
```

### MONGO_URL (password rotation)
```bash
# 1. Generate new password in MongoDB Atlas → Database Access
# 2. Update connection string with new password
# 3. Add to Secret Manager
echo -n "mongodb+srv://user:NEW_PASS@cluster.mongodb.net/goodly" | \
  gcloud secrets versions add MONGO_URL --data-file=-

# 4. Deploy (expect brief DB reconnection)
gcloud run deploy goodly-api --region=us-central1 --source=.

# 5. Verify DB connection
curl https://api.goodly.app/api/health | jq .database
```

## Pre-Rotation Checklist
- [ ] Notify team in #engineering 24 hours before rotation
- [ ] Schedule during low-traffic window (Sunday 2-4 AM UTC)
- [ ] Have rollback plan ready (previous secret version)
- [ ] Test new credentials in staging environment first

## Post-Rotation Verification
- [ ] Health check passes: `GET /api/health`
- [ ] Auth works: `POST /api/auth/login`
- [ ] AI features work: `POST /api/ai/meta-tags`
- [ ] Billing works: `POST /api/billing/checkout`
- [ ] No spike in Sentry errors
- [ ] No spike in Cloud Monitoring alerts
