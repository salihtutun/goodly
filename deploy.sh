#!/bin/bash
# Goodly Deployment Script — searchgoodly.com
# Usage: ./deploy.sh [backend|frontend|all]

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() { echo -e "${GREEN}[goodly]${NC} $1"; }
warn() { echo -e "${YELLOW}[warn]${NC} $1"; }
err() { echo -e "${RED}[error]${NC} $1"; exit 1; }

check_env() {
  if [ -z "$1" ]; then
    err "$2 is not set. Add it to your environment or .env file."
  fi
}

deploy_backend() {
  log "Deploying backend to Google Cloud Run..."

  check_env "$GCLOUD_PROJECT" "GCLOUD_PROJECT"
  check_env "$MONGO_URL" "MONGO_URL"
  check_env "$JWT_SECRET" "JWT_SECRET"
  check_env "$GEMINI_API_KEY" "GEMINI_API_KEY"
  check_env "$STRIPE_API_KEY" "STRIPE_API_KEY"
  check_env "$STRIPE_WEBHOOK_SECRET" "STRIPE_WEBHOOK_SECRET"
  check_env "$RESEND_API_KEY" "RESEND_API_KEY"

  gcloud builds submit --config=cloudbuild.yaml

  log "Backend deployed! URL: https://api.searchgoodly.com"
  log "Health check: curl https://api.searchgoodly.com/api/health"
}

deploy_frontend() {
  log "Deploying frontend to Vercel..."

  check_env "REACT_APP_BACKEND_URL" "REACT_APP_BACKEND_URL (should be https://api.searchgoodly.com)"

  cd frontend
  echo "REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL" > .env.production
  npm run build

  if command -v vercel &> /dev/null; then
    vercel --prod
  else
    warn "Vercel CLI not found. Install with: npm i -g vercel"
    warn "Or deploy via Vercel dashboard: connect GitHub repo, set REACT_APP_BACKEND_URL=https://api.searchgoodly.com"
  fi

  log "Frontend build complete! Deploy to: https://searchgoodly.com"
}

deploy_all() {
  deploy_backend
  deploy_frontend
}

case "${1:-all}" in
  backend)  deploy_backend ;;
  frontend) deploy_frontend ;;
  all)      deploy_all ;;
  *)        echo "Usage: ./deploy.sh [backend|frontend|all]" ;;
esac
