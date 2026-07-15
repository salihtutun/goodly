# Goodly — API Reference

Base URL: `https://api.searchgoodly.com/api`

## Authentication

All endpoints except register/login require authentication via HttpOnly JWT cookie.

### POST /auth/register
Register a new user account.
```
Body: { email, password (min 8 chars), name? }
Response: { user: { id, email, name, role, plan, onboarded, email_verified }, token }
```

### POST /auth/login
Login with email and password.
```
Body: { email, password }
Response: { user, token }
Rate limit: 5/minute
```

### POST /auth/logout
Clear auth cookie.

### GET /auth/me
Get current user profile.

### GET /auth/verify/{token}
Verify email address. Redirects to frontend login.

### POST /auth/resend-verification
Resend verification email. Requires auth.
Rate limit: 3/minute

### POST /auth/forgot-password
Send password reset email.
```
Body: { email }
Rate limit: 3/minute
```

### POST /auth/reset-password
Reset password with token.
```
Body: { token, new_password (min 8 chars) }
Rate limit: 5/minute
```

### POST /auth/onboarded
Mark user as onboarded.

## Projects

### POST /api/projects
Create a new project.
```
Body: { name, url, description?, target_keywords? }
```

### GET /api/projects
List all projects for current user.

### GET /api/projects/{project_id}
Get project details.

### PATCH /api/projects/{project_id}
Update project fields.

### DELETE /api/projects/{project_id}
Delete project and associated audits.

### POST /api/projects/{project_id}/schedule
Set audit schedule.
```
Body: { schedule: "off" | "monthly" }
```

## Audits

### POST /api/audits
Run an SEO audit.
```
Body: { url, project_id? }
Response: { id, url, result: { overall_score, categories, issues, ... }, ai_recommendations }
```

### GET /api/audits
List audits (optionally filtered by project_id).

### GET /api/audits/{audit_id}
Get full audit details with AI recommendations.

### DELETE /api/audits/{audit_id}
Delete an audit.

### GET /api/audits/{audit_id}/pdf
Download audit as PDF (Concierge only).

## AI Tools

### POST /api/ai/meta-tags
Generate SEO meta tags.
```
Body: { business_name, description, target_keywords? }
Rate limit: 10/minute
```

### POST /api/ai/keywords
Keyword research.
```
Body: { seed_topic, industry?, location? }
Rate limit: 10/minute
```

### POST /api/ai/competitors
Competitor analysis.
```
Body: { your_site, competitors: string[], industry? }
Rate limit: 10/minute
```

## Social Presence

### POST /api/social/audit
Audit social media profile.
```
Body: { platform: "instagram"|"tiktok"|"youtube", handle, bio?, niche?, location?, followers?, recent_caption?, posts_per_week? }
Rate limit: 10/minute
```

### POST /api/social/suggestions
Get social media improvement suggestions.

### POST /api/social/competitors
Compare against social media competitors.

### GET /api/social/audits
Get social audit history. Optional query: `?platform=instagram`

## Google Business Profile

### POST /api/gbp/audit
Audit Google Business Profile listing.
```
Body: { business_name, primary_category, address?, description?, phone?, website?, photo_count?, reviews_count?, avg_rating?, ... }
Rate limit: 10/minute
```

### POST /api/gbp/suggestions
Get GBP improvement suggestions.

### POST /api/gbp/competitors
Compare GBP against competitors.

### GET /api/gbp/audits
Get GBP audit history.

## AI Visibility

### POST /api/ai-visibility/check
Check AI assistant visibility.
```
Body: { business_name, category, location?, website?, queries? }
Rate limit: 5/minute
```

### GET /api/ai-visibility/history
Get AI visibility check history.

## Dashboard

### GET /api/dashboard/summary
Get dashboard stats (projects, audits, average score, recent audits).

### GET /api/dashboard/visibility
Get unified visibility score across all channels.

## Billing

### GET /api/billing/plans
List available plans.

### GET /api/billing/me
Get current user's billing status.

### POST /api/billing/checkout
Create Stripe checkout session.
```
Body: { plan_id, origin_url }
Rate limit: 5/minute
```

### GET /api/billing/status/{session_id}
Check payment status.

### POST /api/billing/portal
Create Stripe Customer Portal session.
```
Body: { return_url }
```

### POST /api/webhook/stripe
Stripe webhook handler (called by Stripe, not by frontend).

## SERP Tracking

### POST /api/serp/check
Check keyword ranking.
```
Body: { keyword, domain, project_id? }
```

### GET /api/serp/history
Get SERP check history.

## Concierge

### POST /api/concierge/brief
Submit/update concierge onboarding brief.
Rate limit: 10/minute

### GET /api/concierge/brief
Get current concierge brief.

### GET /api/admin/concierge/briefs
Admin: list all concierge briefs.

## Scheduler

### POST /api/scheduler/run-now
Admin: manually trigger scheduled audits.

### GET /api/scheduler/runs
Get scheduled run history.

## Health

### GET /api/health
System health check. Returns status of database, AI service, Stripe, email, scheduler.
