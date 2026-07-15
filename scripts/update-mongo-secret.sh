#!/usr/bin/env bash
# Update MONGO_URL in GCP Secret Manager and redeploy Cloud Run.
# Usage: ./scripts/update-mongo-secret.sh 'mongodb+srv://user:pass@cluster.mongodb.net/goodly?retryWrites=true&w=majority'
set -euo pipefail

MONGO_URL="${1:-}"
PROJECT="${GCLOUD_PROJECT:-kai-app-1762224583}"
REGION="${GCLOUD_REGION:-us-central1}"

if [ -z "$MONGO_URL" ]; then
  echo "Usage: $0 'mongodb+srv://...'"
  echo ""
  echo "Get your connection string from:"
  echo "  https://cloud.mongodb.com/v2/6a46c6ca2d2ab80d09cea362#/clusters/connect"
  exit 1
fi

printf '%s' "$MONGO_URL" | gcloud secrets versions add MONGO_URL --project="$PROJECT" --data-file=-
echo "MONGO_URL secret updated."

gcloud run deploy goodly-api --source . --region="$REGION" --project="$PROJECT" --allow-unauthenticated --quiet
echo "Cloud Run redeployed."

curl -s "https://api.searchgoodly.com/api/health" | python3 -m json.tool
