#!/usr/bin/env bash
# Goodly Database Backup Script
# Usage: ./backup-db.sh [mongodb_uri]
# Requires: mongodump (mongodb-database-tools), gcloud CLI (for Cloud Run)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKUP_DIR="${SCRIPT_DIR}/../backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_PATH="${BACKUP_DIR}/${TIMESTAMP}"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}
LOG_FILE="${BACKUP_DIR}/backup.log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_success() { log "${GREEN}✓${NC} $1"; }
log_error() { log "${RED}✗${NC} $1"; }
log_warn() { log "${YELLOW}⚠${NC} $1"; }

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Get MongoDB URI
MONGO_URI="${1:-${MONGO_URL:-}}"
if [ -z "$MONGO_URI" ]; then
    log_error "No MongoDB URI provided. Set MONGO_URL env var or pass as argument."
    log "Usage: ./backup-db.sh mongodb+srv://user:pass@host/dbname"
    exit 1
fi

log "Starting database backup..."
log "Backup path: $BACKUP_PATH"

# Run mongodump
if mongodump --uri="$MONGO_URI" --out="$BACKUP_PATH" --gzip 2>&1 | tee -a "$LOG_FILE"; then
    log_success "Backup completed successfully"

    # Calculate backup size
    BACKUP_SIZE=$(du -sh "$BACKUP_PATH" | cut -f1)
    log "Backup size: $BACKUP_SIZE"

    # Create tar archive
    ARCHIVE_PATH="${BACKUP_PATH}.tar.gz"
    tar -czf "$ARCHIVE_PATH" -C "$BACKUP_DIR" "$TIMESTAMP"
    log_success "Archive created: $ARCHIVE_PATH ($(du -sh "$ARCHIVE_PATH" | cut -f1))"

    # Upload to Google Cloud Storage (if configured)
    if [ -n "${GCS_BACKUP_BUCKET:-}" ]; then
        log "Uploading to GCS: gs://${GCS_BACKUP_BUCKET}/"
        if gsutil cp "$ARCHIVE_PATH" "gs://${GCS_BACKUP_BUCKET}/backups/${TIMESTAMP}.tar.gz" 2>&1 | tee -a "$LOG_FILE"; then
            log_success "Uploaded to GCS"
        else
            log_error "GCS upload failed"
        fi
    fi

    # Clean up old backups
    log "Cleaning up backups older than ${RETENTION_DAYS} days..."
    find "$BACKUP_DIR" -name "*.tar.gz" -mtime "+${RETENTION_DAYS}" -delete 2>/dev/null || true
    find "$BACKUP_DIR" -maxdepth 1 -type d -name "202*" -mtime "+${RETENTION_DAYS}" -exec rm -rf {} + 2>/dev/null || true
    log_success "Cleanup complete"

else
    log_error "Backup failed!"
    exit 1
fi

log "Backup process finished"
echo ""
