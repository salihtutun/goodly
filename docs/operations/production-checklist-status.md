# Production Manual Setup — Status

Updated: 2026-07-17

The terminal checklist used mangled names (`MONGOURL`, etc.). Production uses
**GCP Secret Manager + Cloud Run** for app secrets. GitHub only holds CD/WIF
credentials (+ `MONGO_URL` for the backup workflow).

| Checklist item | Status | Where |
|----------------|--------|-------|
| `ENVIRONMENT=production` | **Done** | `cloudrun-env.yaml` → Cloud Run |
| GCP Workload Identity Federation for CD | **Done** | Pool `github-pool` / provider `github-provider`; GitHub secrets `GCP_WIF_PROVIDER`, `GCP_SA_EMAIL`, `GCP_PROJECT_ID` |
| App secrets (Mongo, JWT, Stripe, CORS, demo, admin) | **Done** | Secret Manager + Cloud Run (not duplicated into GitHub) |
| `STRIPE_PRICE_ID_CONCIERGE` | **Done** | `price_1Tqa5K4FfgWurD2It8xFaUV6` (active Concierge Monthly) |
| `RESEND_API_KEY` + `SENDER_EMAIL` | **Done** | Secret Manager + `hello@searchgoodly.com`; Resend domain **verified** |

## Name mapping (checklist → actual)

| Checklist | Actual |
|-----------|--------|
| `MONGOURL` | `MONGO_URL` (GCP SM; also GitHub for backup.yml) |
| `DBNAME` | `DB_NAME=goodly` (env) |
| `JWTSECRET` | `JWT_SECRET` (GCP SM) |
| `EMERGENTLLMKEY` | `GEMINI_API_KEY` (GCP SM; Emergent key retired) |
| `STRIPEAPIKEY` | `STRIPE_API_KEY` (GCP SM) |
| `CORSORIGINS` | `CORS_ORIGINS` (env) |
| `DEMOPASSWORD` | `DEMO_PASSWORD` (GCP SM) |
| `ADMINPASSWORD` | `ADMIN_PASSWORD` (GCP SM) |
| `STRIPEPRICEID_CONCIERGE` | `STRIPE_PRICE_ID_CONCIERGE` (GCP SM) |
| `RESENDAPIKEY` | `RESEND_API_KEY` (GCP SM) |
