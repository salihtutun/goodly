#!/usr/bin/env bash
# Deploy Goodly backend to Render (run after `render login`).
set -euo pipefail

FRONTEND_URL="${FRONTEND_URL:-https://frontend-beta-weld-93.vercel.app}"
REPO="${REPO:-https://github.com/salihtutun/goodly}"

if ! render whoami >/dev/null 2>&1; then
  echo "Run: render login"
  exit 1
fi

render services create \
  --name goodly-api \
  --type web_service \
  --runtime python \
  --region virginia \
  --plan free \
  --repo "$REPO" \
  --branch master \
  --root-directory backend \
  --build-command "pip install -r requirements.txt" \
  --start-command "uvicorn server:app --host 0.0.0.0 --port \$PORT" \
  --health-check-path /api/health \
  --env-var "ENVIRONMENT=production" \
  --env-var "DB_NAME=goodly" \
  --env-var "SCHEDULER_ENABLED=true" \
  --env-var "FRONTEND_URL=$FRONTEND_URL" \
  --env-var "CORS_ORIGINS=$FRONTEND_URL" \
  --env-var "PRODUCTION_DOMAIN=$FRONTEND_URL" \
  --output json

echo ""
echo "Add secrets in Render dashboard: MONGO_URL, GEMINI_API_KEY, JWT_SECRET,"
echo "STRIPE_API_KEY, STRIPE_WEBHOOK_SECRET, RESEND_API_KEY, ADMIN_PASSWORD"
echo ""
echo "Then connect frontend:"
echo "  cd frontend && printf '%s' 'YOUR_RENDER_URL' | npx vercel env add REACT_APP_BACKEND_URL production"
echo "  npx vercel --prod --yes"
