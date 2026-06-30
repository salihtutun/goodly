# Goodly Incident Response Runbook

## Severity Levels

| Level | Definition | Response Time | Example |
|-------|-----------|---------------|---------|
| **P0 — Critical** | Service completely down, all users affected | 15 min | API returns 5xx for all requests |
| **P1 — High** | Major feature broken, many users affected | 30 min | Stripe checkout fails, AI features down |
| **P2 — Medium** | Minor feature broken, some users affected | 2 hours | PDF export fails, GBP audit errors |
| **P3 — Low** | Cosmetic issue, no user impact | 24 hours | UI glitch, slow page load |

## Incident Response Process

### 1. Detect
- **Automated:** Cloud Monitoring alerts, Sentry errors, uptime checks
- **Manual:** User reports, team observation

### 2. Triage
1. Confirm the incident is real (not a false alarm)
2. Determine severity level
3. Assign incident commander
4. Create incident channel (Slack #incidents)

### 3. Communicate
- Post in #incidents: "INCIDENT: [P0/P1/P2] — [brief description]"
- Update status page if applicable
- Notify affected customers if P0/P1

### 4. Mitigate
- **P0:** Roll back to last known good deployment immediately
- **P1:** Apply hotfix or feature flag off the broken feature
- **P2:** Create fix PR, deploy during business hours
- **P3:** Add to backlog

### 5. Resolve
- Deploy fix
- Verify with health checks and smoke tests
- Monitor for 30 minutes post-deploy

### 6. Post-Mortem
- Document: what happened, why, how fixed, prevention
- Create action items to prevent recurrence
- Review in next team meeting

## Common Incidents

### API returns 5xx errors
1. Check Cloud Run logs: `gcloud logging read "resource.type=cloud_run_revision AND severity>=ERROR"`
2. Check MongoDB Atlas status
3. Check Gemini API status
4. Check Stripe API status
5. Roll back if recent deploy caused it

### Stripe checkout fails
1. Verify STRIPE_API_KEY is valid in Secret Manager
2. Check Stripe dashboard for API errors
3. Verify webhook endpoint is reachable
4. Test with Stripe test mode

### AI features return 502
1. Check GEMINI_API_KEY in Secret Manager
2. Verify Gemini API quota not exhausted
3. Check Google Cloud status for AI Platform
4. Check ai_metrics collection for error patterns

### Database connection errors
1. Check MongoDB Atlas cluster status
2. Verify network access (IP whitelist / VPC peering)
3. Check connection string in Secret Manager
4. Verify maxPoolSize not exceeded

## Emergency Contacts

| Role | Contact |
|------|---------|
| Backend on-call | [TBD] |
| Frontend on-call | [TBD] |
| DevOps on-call | [TBD] |
| MongoDB Atlas admin | [TBD] |
| Stripe admin | [TBD] |
| Google Cloud admin | [TBD] |

## Rollback Procedure

```bash
# List recent revisions
gcloud run revisions list --service=goodly-api --region=us-central1

# Roll back to previous revision
gcloud run services update-traffic goodly-api \
  --to-revisions=LATEST=0,PREVIOUS=100 \
  --region=us-central1
```
