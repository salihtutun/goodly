# Goodly — Deployment Guide

## Prerequisites

- Google Cloud project with billing enabled
- MongoDB Atlas cluster (or any MongoDB instance)
- Stripe account with live API keys
- Resend account with verified domain
- Google Gemini API key (from Google AI Studio)
- Domain name (goodly.app or custom)

## Quick Deploy

### 1. Set up Google Cloud

```bash
# Install gcloud CLI
brew install google-cloud-sdk  # macOS
# or: https://cloud.google.com/sdk/docs/install

# Login and set project
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Enable required services
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

### 2. Store Secrets

```bash
# Create secrets in Google Secret Manager
echo -n "your-gemini-api-key" | gcloud secrets create GEMINI_API_KEY --data-file=-
echo -n "sk_live_..." | gcloud secrets create STRIPE_API_KEY --data-file=-
echo -n "whsec_..." | gcloud secrets create STRIPE_WEBHOOK_SECRET --data-file=-
echo -n "$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')" | gcloud secrets create JWT_SECRET --data-file=-
echo -n "mongodb+srv://..." | gcloud secrets create MONGO_URL --data-file=-
echo -n "re_..." | gcloud secrets create RESEND_API_KEY --data-file=-

# Grant Cloud Run access to secrets
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
# Repeat for each secret
```

### 3. Deploy

```bash
# Build and deploy using Cloud Build
gcloud builds submit --config=cloudbuild.yaml

# Or deploy directly from source
gcloud run deploy goodly-api \
  --source . \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --timeout 300 \
  --set-env-vars="ENVIRONMENT=production,DB_NAME=goodly,SCHEDULER_ENABLED=true,FRONTEND_URL=https://goodly.app,PRODUCTION_DOMAIN=https://goodly.app,CORS_ORIGINS=https://goodly.app,SENDER_EMAIL=hello@goodly.app,ADMIN_EMAIL=admin@goodly.app" \
  --set-secrets="MONGO_URL=MONGO_URL:latest,JWT_SECRET=JWT_SECRET:latest,GEMINI_API_KEY=GEMINI_API_KEY:latest,STRIPE_API_KEY=STRIPE_API_KEY:latest,STRIPE_WEBHOOK_SECRET=STRIPE_WEBHOOK_SECRET:latest,RESEND_API_KEY=RESEND_API_KEY:latest"
```

### 4. Configure Custom Domain

```bash
gcloud run domain-mappings create \
  --service=goodly-api \
  --domain=api.goodly.app \
  --region=us-central1
```

### 5. Set up Stripe Webhook

1. Go to Stripe Dashboard → Webhooks
2. Add endpoint: `https://api.goodly.app/api/webhook/stripe`
3. Select events: `checkout.session.completed`, `customer.subscription.updated`
4. Copy signing secret → store as `STRIPE_WEBHOOK_SECRET`

### 6. Deploy Frontend

```bash
cd frontend
# Set environment variables
export REACT_APP_BACKEND_URL=https://api.goodly.app
# Build
npm run build
# Deploy to Firebase Hosting or Cloud Run
firebase deploy --only hosting
```

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `ENVIRONMENT` | Yes | `production` or `development` |
| `MONGO_URL` | Yes | MongoDB connection string |
| `DB_NAME` | Yes | Database name (default: `goodly`) |
| `JWT_SECRET` | Yes | Random 64-char string for JWT signing |
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `STRIPE_API_KEY` | Yes | Stripe secret key |
| `STRIPE_PRICE_ID_CONCIERGE` | No | Stripe Price ID for Concierge subscription |
| `STRIPE_WEBHOOK_SECRET` | Yes | Stripe webhook signing secret |
| `RESEND_API_KEY` | No | Resend API key for emails |
| `SENDER_EMAIL` | No | Verified sender email (default: onboarding@resend.dev) |
| `CORS_ORIGINS` | No | Comma-separated allowed origins |
| `PRODUCTION_DOMAIN` | No | Production domain for CORS fallback |
| `FRONTEND_URL` | No | Frontend URL for email links |
| `SCHEDULER_ENABLED` | No | Enable scheduled audits (default: true) |
| `ADMIN_EMAIL` | No | Admin seed email |
| `ADMIN_PASSWORD` | No | Admin seed password |
| `DEMO_PASSWORD` | No | Demo account password |
| `SERPAPI_KEY` | No | SerpAPI key for rank tracking |

## Post-Deployment Checklist

- [ ] Health check: `curl https://api.goodly.app/api/health`
- [ ] Register test user: `curl -X POST https://api.goodly.app/api/auth/register ...`
- [ ] Run SEO audit: `curl -X POST https://api.goodly.app/api/audits ...`
- [ ] Verify Stripe webhook: Check Stripe Dashboard for successful deliveries
- [ ] Verify email: Check Resend dashboard for sent emails
- [ ] Check logs: `gcloud logging read "resource.type=cloud_run_revision"`
- [ ] Set up monitoring: Google Cloud Monitoring for Cloud Run
- [ ] Configure MongoDB Atlas IP whitelist (or use VPC peering)
- [ ] Set up automated backups: MongoDB Atlas automated backups
- [ ] Configure uptime monitoring (Google Cloud Monitoring or external)

## Rollback

```bash
# List revisions
gcloud run revisions list --service=goodly-api --region=us-central1

# Rollback to previous revision
gcloud run services update-traffic goodly-api \
  --to-revisions=LATEST=0,PREVIOUS=100 \
  --region=us-central1
```
