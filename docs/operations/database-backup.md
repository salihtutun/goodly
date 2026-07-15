# Database Backup Strategy

## Overview
Goodly uses MongoDB (Atlas) as the primary database. This document outlines the backup strategy to ensure data durability and disaster recovery.

## Backup Methods

### 1. MongoDB Atlas Automated Backups (Primary)
- **Frequency**: Continuous (point-in-time recovery, PITR)
- **Retention**: 7 days of snapshots + 24 hours of oplog
- **Restore RTO**: < 1 hour
- **Enabled by default** on M10+ clusters

### 2. Manual mongodump Backups (Secondary)
- **Script**: `scripts/backup-db.sh`
- **Frequency**: Daily (via cron job)
- **Retention**: 30 days (configurable via `BACKUP_RETENTION_DAYS`)
- **Storage**: Local disk + Google Cloud Storage (optional)
- **Format**: Gzipped mongodump archives

### 3. Cloud Run Automated Backups
- Cloud Run does NOT persist data — MongoDB Atlas handles all persistence
- No additional backup needed for the application layer
- Environment variables are stored in Google Secret Manager

## Backup Script Usage

```bash
# Manual backup
./scripts/backup-db.sh "mongodb+srv://user:pass@cluster.mongodb.net/goodly"

# With GCS upload
GCS_BACKUP_BUCKET=goodly-backups ./scripts/backup-db.sh

# Set retention (default: 30 days)
BACKUP_RETENTION_DAYS=90 ./scripts/backup-db.sh
```

## Cron Job Setup

Add to crontab for daily backups at 2 AM:

```bash
0 2 * * * cd /path/to/goodly && ./scripts/backup-db.sh >> backups/cron.log 2>&1
```

## Restore Procedure

### From mongodump archive:
```bash
# Extract
tar -xzf backups/20260702_020000.tar.gz -C /tmp/restore

# Restore
mongorestore --uri="mongodb+srv://user:pass@cluster.mongodb.net/goodly" \
  --gzip --drop /tmp/restore/20260702_020000/goodly
```

### From Atlas PITR:
1. Go to MongoDB Atlas → Clusters → Backup
2. Click "Restore" → Choose point-in-time
3. Select target cluster (can restore to new cluster)
4. Update MONGO_URL in Cloud Run after restore

## What's Backed Up

| Collection | Criticality | Notes |
|-----------|------------|-------|
| users | HIGH | User accounts, roles, plans |
| audits | HIGH | All SEO audit results |
| projects | HIGH | User projects and settings |
| serp_checks | MEDIUM | Rank tracking history |
| ai_history | MEDIUM | AI generation history |
| social_audits | MEDIUM | Social media audits |
| gbp_audits | MEDIUM | Google Business Profile audits |
| concierge_briefs | MEDIUM | Concierge onboarding briefs |
| support_messages | LOW | Support contact form submissions |
| scheduled_runs | LOW | Scheduler run history |

## Recovery Time Objectives (RTO)

| Scenario | RTO | Method |
|----------|-----|--------|
| Accidental deletion | < 1 hour | Atlas PITR |
| Collection corruption | < 1 hour | Atlas PITR |
| Full cluster failure | < 4 hours | Atlas restore to new cluster |
| Regional disaster | < 8 hours | Atlas cross-region restore |

## Recovery Point Objectives (RPO)

| Scenario | RPO | Method |
|----------|-----|--------|
| Atlas PITR | < 5 minutes | Continuous oplog backup |
| Manual mongodump | < 24 hours | Daily cron job |

## Testing

Backup restoration should be tested quarterly:
1. Restore latest backup to a temporary cluster
2. Verify user count, audit count, and sample data integrity
3. Document any issues in the test log

## Monitoring

- Atlas backup status is visible in the Atlas dashboard
- Set up Atlas alerts for backup failures
- Monitor `backups/backup.log` for script errors
- Alert if backup size changes by >50% (may indicate data loss or corruption)
