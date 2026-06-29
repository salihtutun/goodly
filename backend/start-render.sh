#!/bin/bash
# Start embedded MongoDB then the FastAPI app (Render free tier — data is ephemeral).
set -euo pipefail

mkdir -p /data/db
mongod --dbpath /data/db --bind_ip 127.0.0.1 --port 27017 --fork --logpath /var/log/mongodb.log

export MONGO_URL="${MONGO_URL:-mongodb://127.0.0.1:27017}"
export DB_NAME="${DB_NAME:-goodly}"

exec uvicorn server:app --host 0.0.0.0 --port "${PORT:-10000}"
