# Goodly Operational Runbook

## Production URLs

| Service | URL |
|---|---|
| Frontend | https://searchgoodly.com |
| Backend API | https://api.searchgoodly.com |
| Cloud Run | https://goodly-api-ha7sdjf54q-uc.a.run.app |
| Vercel Project | frontend (prj_qzWN6IOPM8MD3DboaB04keXcWWk2) |

## Quick Health Check

```bash
# Frontend
curl -sI https://searchgoodly.com | head -5

# Backend
curl -s https://api.searchgoodly.com/api/health

# Full smoke test
FRONTEND_URL=https://searchgoodly.com BACKEND_URL=https://api.searchgoodly.com bash scripts/smoke-test.sh
```

## Common Issues

### 1. Stale Frontend Deploy (pages show 404)

**Symptom:** A page that exists in code shows 404 on production.

**Cause:** Vercel deployment is stale — the latest build wasn't deployed.

**Fix:**
```bash
cd frontend
npm run build
vercel --prod --yes
```

**Verify:** `curl -s https://searchgoodly.com/content-studio | grep -c "404"` should return 0.

### 2. API Returns 404 (Vercel Rewrite Broken)

**Symptom:** `https://api.searchgoodly.com/api/health` returns Vercel 404 HTML.

**Cause:** Cloud Run URL changed (new revision deployed). Vercel rewrite points to old URL.

**Fix:**
1. Find current Cloud Run URL:
   ```bash
   gcloud run services describe goodly-api --region=us-central1 --format="value(status.url)"
   ```
2. Update `frontend/vercel.json` with the new URL:
   ```json
   "destination": "https://<NEW-URL>.a.run.app/api/$1"
   ```
3. Redeploy:
   ```bash
   cd frontend && vercel --prod --yes
   ```

### 3. Backend Cold Start Timeout

**Symptom:** First request after idle period times out (>10s).

**Cause:** Cloud Run `min-instances=0` — container needs to cold-start.

**Fix:** Consider setting `min-instances=1` in Cloud Run config (adds ~$7/month).

### 4. Database Connection Issues

**Symptom:** Health endpoint shows `"database": "disconnected"`.

**Fix:**
1. Check MongoDB Atlas status
2. Verify `MONGO_URL` secret in Cloud Run
3. Check IP whitelist in MongoDB Atlas (add Cloud Run outbound IPs)

### 5. Email Delivery Issues

**Symptom:** Users not receiving verification/password-reset emails.

**Fix:**
1. Check Resend dashboard for bounce/complaint rates
2. Verify `RESEND_API_KEY` secret in Cloud Run
3. Verify domain verification in Resend (searchgoodly.com)
4. Check spam score at mail-tester.com

## Deployment

### Backend (Cloud Run)
```bash
gcloud builds submit --config=cloudbuild.yaml
# OR via GitHub Actions: push to main triggers CD pipeline
```

### Frontend (Vercel)
```bash
cd frontend
npm run build
vercel --prod --yes
# OR: push to main, Vercel auto-deploys if GitHub integration is set up
```

## Monitoring

- **Sentry:** Backend error tracking (SENTRY_DSN configured in Cloud Run)
- **GA4:** Frontend analytics (set REACT_APP_GA_ID in Vercel env vars)
- **Uptime:** Cloud Monitoring checks `searchgoodly.com/` and `api.searchgoodly.com/api/health` every 5m (alerts → admin@searchgoodly.com). Legacy note — UptimeRobot not required:
  - https://searchgoodly.com
  - https://api.searchgoodly.com/api/health

## Backup

```bash
# Manual backup
MONGO_URL=<connection-string> bash scripts/backup-mongo.sh

# Backups stored in ./backups/<timestamp>/
```

## Security Headers (Verified)

| Header | Status |
|---|---|
| Content-Security-Policy | Present |
| X-Content-Type-Options | nosniff |
| X-Frame-Options | DENY |
| X-XSS-Protection | 1; mode=block |
| Strict-Transport-Security | max-age=63072000 |
| Referrer-Policy | strict-origin-when-cross-origin |
| Permissions-Policy | camera=(), microphone=(), geolocation=() |

## Key Contacts

- Support: hello@searchgoodly.com
- Legal: legal@searchgoodly.com
- Privacy: privacy@searchgoodly.com
