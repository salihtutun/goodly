#!/bin/bash
# MongoDB backup script for Goodly
# Usage: ./scripts/backup-mongo.sh
set -euo pipefail
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups/${TIMESTAMP}"
mkdir -p "${BACKUP_DIR}"
echo "Backing up MongoDB to ${BACKUP_DIR}..."
mongodump --uri="${MONGO_URL}" --out="${BACKUP_DIR}"
echo "Backup complete: ${BACKUP_DIR}"
