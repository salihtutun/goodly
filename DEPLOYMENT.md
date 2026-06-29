# Goodly Deployment Checklist

Use this checklist before deploying Goodly to production.

## Pre-Deployment

### Environment Variables
- [ ] Copy `backend/.env.example` to `backend/.env`
- [ ] Set `ENVIRONMENT=production`
- [ ] Generate a strong `JWT_SECRET` (64+ random chars)
- [ ] Set `MONGO_URL` to production MongoDB connection string
- [ ] Set `DB_NAME` (default: `goodly`)
- [ ] Set `EMERGENT_LLM_KEY` from emergent.sh dashboard
- [ ] Set `STRIPE_API_KEY` and `STRIPE_PRICE_ID_CONCIERGE` from Stripe dashboard
- [ ] Set `RESEND_API_KEY` and `SENDER_EMAIL` from Resend dashboard
- [ ] Set `CORS_ORIGINS` to comma-separated list of allowed frontend origins
- [ ] Set `PRODUCTION_DOMAIN` to your production domain
- [ ] Set `SCHEDULER_ENABLED=true` (or `false` to disable)
- [ ] Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` for admin seed

### Database
- [ ] MongoDB instance is running and accessible
- [ ] MongoDB indexes created (auto-created on startup via `on_startup`)
- [ ] Database backup strategy in place (see `scripts/backup-mongo.sh`)
- [ ] Run `./scripts/backup-mongo.sh` to take an initial backup

### Stripe
- [ ] Stripe webhook endpoint registered: `https://<your-domain>/api/webhook/stripe`
- [ ] Webhook signing secret configured in Stripe dashboard
- [ ] Stripe products and prices created for all plans
- [ ] Test mode: run a test checkout to verify end-to-end flow

### Email (Resend)
- [ ] Resend domain verified (DNS records added)
- [ ] `SENDER_EMAIL` matches a verified domain
- [ ] Test email delivery (e.g., password reset, welcome email)

### SSL/TLS
- [ ] SSL certificate installed and valid (e.g., via Let's Encrypt)
- [ ] HTTPS enforced (redirect HTTP to HTTPS)
- [ ] HSTS header configured (optional but recommended)

### CORS
- [ ] `CORS_ORIGINS` includes all valid frontend origins
- [ ] No wildcard `*` in production CORS origins
- [ ] `PRODUCTION_DOMAIN` set correctly

### Rate Limiting
- [ ] Rate limits tested (default: 200 req/min, auth endpoints: 3-5/min)
- [ ] AI endpoints rate-limited (10/min for meta-tags, keywords, competitors)
- [ ] No false positives blocking legitimate traffic

### Health Check
- [ ] `GET /api/health` returns `{"status": "ok", ...}`
- [ ] Database ping succeeds (`"database": "connected"`)
- [ ] All services report `"configured"` (ai_service, stripe, email)
- [ ] Scheduler status matches `SCHEDULER_ENABLED` env var
- [ ] Set up external monitoring (e.g., UptimeRobot, Pingdom) hitting `/api/health`

### Scheduled Audits
- [ ] Scheduler is running (check logs for "Scheduler started")
- [ ] Projects with `schedule: "monthly"` have `next_audit_at` set
- [ ] Manual trigger via `POST /api/scheduler/run-now` works (admin only)
- [ ] Scheduled runs are logged in `scheduled_runs` collection

### Admin User
- [ ] Admin user seeded on first startup (from `ADMIN_EMAIL`/`ADMIN_PASSWORD` env vars)
- [ ] Admin can access `GET /api/admin/concierge/briefs`
- [ ] Admin can trigger `POST /api/scheduler/run-now`
- [ ] Change default admin password after first login

### Backup Strategy
- [ ] `scripts/backup-mongo.sh` is executable (`chmod +x scripts/backup-mongo.sh`)
- [ ] `MONGO_URL` env var is set in the environment where the script runs
- [ ] Backup script tested and produces valid dumps
- [ ] Automated backup schedule configured (cron job or similar):
  ```
  0 2 * * * cd /path/to/goodly && ./scripts/backup-mongo.sh
  ```
- [ ] Backup retention policy defined (e.g., keep last 30 days)
- [ ] Off-site backup copy configured (e.g., S3, GCS, rsync to another host)

### Monitoring & Alerting
- [ ] Application logs are being collected (e.g., stdout/stderr to CloudWatch, Datadog, etc.)
- [ ] Error alerting configured (e.g., Sentry, Rollbar, or log-based alerts)
- [ ] Database performance monitoring (MongoDB Atlas metrics or self-hosted)
- [ ] Stripe webhook failures are monitored
- [ ] API latency and error rate dashboards set up
- [ ] Uptime monitoring hitting `/api/health` every 1-5 minutes

## Post-Deployment Verification

- [ ] `GET /api/health` returns 200 with all services healthy
- [ ] `POST /api/auth/register` creates a new user
- [ ] `POST /api/auth/login` returns a valid JWT
- [ ] `POST /api/audits` runs a full SEO audit
- [ ] `POST /api/billing/checkout` creates a Stripe checkout session
- [ ] Stripe webhook receives and processes events
- [ ] PDF export works for Pro/Concierge users
- [ ] Social audit (Instagram/TikTok/YouTube) works
- [ ] AI Visibility check works
- [ ] GBP audit works
- [ ] Frontend loads and connects to the API

## Rollback Plan

- [ ] Previous deployment artifacts are preserved
- [ ] Database rollback procedure documented
- [ ] Emergency contact list is up to date
