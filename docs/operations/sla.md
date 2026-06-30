# Goodly SLA / SLO Definitions

## Service Level Objectives (SLOs)

| Metric | Target | Measurement Window |
|--------|--------|-------------------|
| **API Availability** | 99.9% | 30 days |
| **API Latency (p95)** | < 500ms | 30 days |
| **API Latency (p99)** | < 2000ms | 30 days |
| **AI Feature Availability** | 99.5% | 30 days |
| **AI Response Time (p95)** | < 8 seconds | 30 days |
| **Stripe Checkout Success Rate** | 99.9% | 30 days |
| **Error Rate** | < 0.1% | 30 days |

## Service Level Agreements (SLAs)

| Tier | Uptime SLA | Support Response | Refund Policy |
|------|-----------|-----------------|---------------|
| **Free** | Best effort | Community only | N/A |
| **Concierge ($1,000/mo)** | 99.9% | P0: 1hr, P1: 4hrs | 5% credit per 0.1% below SLA |

## Error Budget

- **Monthly error budget:** 43.2 minutes of downtime (99.9% uptime)
- **Burned at:** ~1.44 minutes/day
- **If budget exhausted:** Freeze all non-critical deploys, focus on reliability

## Monitoring

- **Uptime check:** `/api/health` pinged every 60 seconds via Cloud Monitoring
- **Latency tracking:** MetricsMiddleware logs every request duration
- **Error tracking:** Sentry captures all 5xx errors with stack traces
- **AI metrics:** `ai_metrics` collection tracks token usage, latency, cost per feature

## Alerting Thresholds

| Alert | Condition | Channel |
|-------|-----------|---------|
| API down | Health check fails 3 consecutive times | PagerDuty |
| High error rate | >1% errors in 5 minutes | Slack #alerts |
| AI degraded | >10% AI calls fail in 15 minutes | Slack #alerts |
| Stripe failures | >5 checkout failures in 10 minutes | PagerDuty |
| DB connection lost | Health check DB ping fails | PagerDuty |
| Cost spike | Daily AI cost >$50 | Slack #alerts |
