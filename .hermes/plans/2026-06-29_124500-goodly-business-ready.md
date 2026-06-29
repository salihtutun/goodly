# Goodly — Business-Ready Production Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.
> **Goal:** Make Goodly (visibility OS for startups) fully production-ready for paying business customers.
> **Architecture:** FastAPI + MongoDB backend, React 19 + Tailwind + shadcn/ui frontend, deployed on Emergent platform.
> **Tech Stack:** Python 3.11+, FastAPI, Motor (MongoDB async), Claude Sonnet 4.6 (via EmergentIntegrations), Stripe, APScheduler, Resend, ReportLab, React 19, react-router 7, Tailwind CSS, shadcn/ui, Recharts, Sonner.

---

## Current State Assessment

### What Works (v1.6)
- Full auth flow (register/login/logout, JWT + cookies)
- SEO audit engine with AI recommendations
- SERP rank tracking (DuckDuckGo + SerpAPI)
- Social presence audit (Instagram, TikTok, YouTube)
- AI Assistant visibility simulation (ChatGPT, Claude, Perplexity, Gemini)
- AI tools (meta tags, keyword research, competitor analysis)
- Unified visibility score across all channels
- Stripe billing (checkout, customer portal, webhooks)
- Scheduled monthly audits with email digests
- Concierge onboarding brief
- PDF export (ReportLab)
- Google Business Profile backend (no frontend page yet)
- 4 test suites covering auth, billing, scheduler, social endpoints

### Critical Gaps Blocking Business Readiness

| # | Issue | Severity | Category |
|---|-------|----------|----------|
| 1 | `EMERGENT_LLM_KEY` budget exhausted — all AI features return 502 | Critical | Infrastructure |
| 2 | `secure=False` on auth cookie — tokens sent over HTTP in production | Critical | Security |
| 3 | `ACCESS_TOKEN_MINUTES` bug in auth.py — `*** * 24 * 7` is masked/truncated | Critical | Security |
| 4 | No rate limiting on any endpoint | High | Security |
| 5 | No GBP frontend page — backend exists, no UI | High | Feature Gap |
| 6 | No proper error pages (404, 500) — just Navigate to "/" | High | UX |
| 7 | No environment-specific configs (dev/staging/prod separation) | High | DevOps |
| 8 | No monitoring, alerting, or error tracking | High | Operations |
| 9 | No frontend tests (Jest configured but 0 test files) | High | Quality |
| 10 | No TypeScript — all JSX, no type safety | Medium | Quality |
| 11 | No SEO metadata on frontend (title, description, og tags) | Medium | SEO |
| 12 | No sitemap.xml, robots.txt | Medium | SEO |
| 13 | No analytics integration | Medium | Business |
| 14 | No backup strategy for MongoDB | Medium | Operations |
| 15 | No CI/CD pipeline | Medium | DevOps |
| 16 | No input sanitization beyond Pydantic validation | Medium | Security |
| 17 | No CORS restriction in production (falls back to "*") | Medium | Security |
| 18 | Tests hardcode preview URL as fallback — fragile | Low | Quality |
| 19 | No load testing performed | Low | Quality |
| 20 | No accessibility audit | Low | UX |

---

## Phase 1: Security Hardening (Critical — Must Fix Before Any Customer Data)

### Task 1.1: Fix auth.py ACCESS_TOKEN_MINUTES bug
**Objective:** The `ACCESS_TOKEN_MINUTES` variable is corrupted — it reads `*** * 24 * 7` which is a masked/truncated value. Fix to proper 7-day expiry.

**Files:**
- Modify: `backend/auth.py:10`

**Step 1: Fix the constant**
```python
ACCESS_TOKEN_MINUTES = 60 * 24 * 7  # 7 days
```

**Step 2: Verify**
Run: `python -c "from backend.auth import ACCESS_TOKEN_MINUTES; print(ACCESS_TOKEN_MINUTES)"`
Expected: `10080`

### Task 1.2: Enable secure cookies in production
**Objective:** Auth cookies must have `secure=True` in production to prevent token leakage over HTTP.

**Files:**
- Modify: `backend/server.py:108-117`

**Step 1: Make secure flag environment-aware**
```python
def _set_auth_cookie(response: Response, token: str):
    is_production = os.environ.get("ENVIRONMENT", "development") == "production"
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=is_production,
        samesite="lax",
        max_age=60 * 60 * 24 * 7,
        path="/",
    )
```

**Step 2: Add ENVIRONMENT to .env files**
Add `ENVIRONMENT=production` to production .env, `ENVIRONMENT=development` to dev .env.

### Task 1.3: Add rate limiting
**Objective:** Prevent brute-force attacks on auth endpoints and abuse of AI endpoints.

**Files:**
- Create: `backend/rate_limit.py`
- Modify: `backend/server.py` (add middleware)
- Modify: `backend/requirements.txt` (add slowapi)

**Step 1: Install slowapi**
```bash
pip install slowapi
```

**Step 2: Create rate_limit.py**
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])
```

**Step 3: Apply to auth endpoints**
```python
@api.post("/auth/login")
@limiter.limit("5/minute")
async def login(...): ...

@api.post("/auth/register")
@limiter.limit("3/minute")
async def register(...): ...
```

**Step 4: Apply to AI endpoints**
```python
@api.post("/ai/meta-tags")
@limiter.limit("10/minute")
async def ai_meta_tags(...): ...
```

### Task 1.4: Restrict CORS in production
**Objective:** Don't allow `*` origins in production.

**Files:**
- Modify: `backend/server.py:1117-1123`

**Step 1: Make CORS origins environment-aware**
```python
cors_origins = os.environ.get("CORS_ORIGINS", "*")
if cors_origins == "*" and os.environ.get("ENVIRONMENT") == "production":
    cors_origins = os.environ.get("PRODUCTION_DOMAIN", "https://goodly.app")
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=cors_origins.split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Task 1.5: Add input sanitization
**Objective:** Sanitize user inputs beyond Pydantic validation to prevent XSS and injection.

**Files:**
- Create: `backend/sanitize.py`
- Modify: `backend/server.py` (import and use)

**Step 1: Create sanitize.py**
```python
import re
from html import escape

def sanitize_html(text: str) -> str:
    """Strip HTML tags and escape special characters."""
    if not text:
        return text
    # Remove HTML tags
    clean = re.sub(r'<[^>]*>', '', text)
    return escape(clean, quote=False)

def sanitize_url(url: str) -> str:
    """Basic URL sanitization."""
    url = url.strip()
    if not url.startswith(('http://', 'https://')):
        url = 'https://' + url
    return url
```

**Step 2: Apply to user-facing string inputs**
Sanitize `business_name`, `description`, `name` fields in all input models.

---

## Phase 2: Feature Completion (What's Missing)

### Task 2.1: Build GBP (Google Business Profile) frontend page
**Objective:** The backend has full GBP audit/suggestions/competitors endpoints but no frontend page. Build it.

**Files:**
- Create: `frontend/src/pages/GbpAudit.jsx`
- Modify: `frontend/src/App.js` (add route)
- Modify: `frontend/src/components/app/AppLayout.jsx` (add nav item)

**Step 1: Create GbpAudit.jsx**
Full page with:
- Audit form (business name, category, address, description, phone, website, hours, photos, reviews, rating, response rate, posts, booking, messaging)
- Results display with score ring, category breakdown, issues list
- Suggestions tab (AI-powered improvement ideas)
- Competitors tab (compare against competitors)
- History list of past audits

**Step 2: Add route**
```jsx
<Route path="/app/gbp" element={<Protected><GbpAudit /></Protected>} />
```

**Step 3: Add nav item**
```jsx
{ to: "/app/gbp", label: "Google Profile", icon: MapPin, testId: "nav-gbp" },
```

### Task 2.2: Add proper error pages
**Objective:** Replace the blind `Navigate to "/"` with proper 404 and error pages.

**Files:**
- Create: `frontend/src/pages/NotFound.jsx`
- Create: `frontend/src/pages/ErrorPage.jsx`
- Modify: `frontend/src/App.js`

**Step 1: Create NotFound.jsx**
A friendly 404 page with the Goodly branding, a "go home" button, and a search/audit suggestion.

**Step 2: Create ErrorPage.jsx**
A generic error boundary page with retry button.

**Step 3: Update App.js routes**
```jsx
<Route path="*" element={<NotFound />} />
```

### Task 2.3: Add SEO metadata to all pages
**Objective:** Every page needs proper `<title>`, `<meta description>`, and Open Graph tags.

**Files:**
- Create: `frontend/src/hooks/usePageMeta.js`
- Modify: All page components

**Step 1: Create usePageMeta hook**
```jsx
export function usePageMeta({ title, description }) {
  useEffect(() => {
    document.title = title ? `${title} — Goodly` : "Goodly — Visibility OS for Startups";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', description || '...');
  }, [title, description]);
}
```

**Step 2: Add to each page**
- Landing: "Goodly — We get your startup found on Google, Instagram, TikTok & YouTube"
- Dashboard: "Dashboard — Goodly"
- Audit: "SEO Audit — Goodly"
- etc.

### Task 2.4: Add sitemap.xml and robots.txt
**Objective:** Essential for SEO.

**Files:**
- Create: `frontend/public/robots.txt`
- Create: `frontend/public/sitemap.xml`

---

## Phase 3: Quality & Testing

### Task 3.1: Add frontend test suite
**Objective:** Jest is configured but has 0 test files. Add smoke tests for critical pages.

**Files:**
- Create: `frontend/src/__tests__/Landing.test.jsx`
- Create: `frontend/src/__tests__/Login.test.jsx`
- Create: `frontend/src/__tests__/Dashboard.test.jsx`
- Create: `frontend/src/__tests__/AppLayout.test.jsx`

**Step 1: Test Landing page renders**
```jsx
test('renders hero CTA', () => {
  render(<BrowserRouter><Landing /></BrowserRouter>);
  expect(screen.getByTestId('hero-cta-primary')).toBeInTheDocument();
});
```

**Step 2: Test Login form**
```jsx
test('renders login form with email and password', () => {
  render(<BrowserRouter><AuthProvider><Login /></AuthProvider></BrowserRouter>);
  expect(screen.getByTestId('login-email-input')).toBeInTheDocument();
});
```

**Step 3: Test protected routes redirect**
```jsx
test('redirects to login when unauthenticated', () => {
  // Mock useAuth to return { user: false, loading: false }
});
```

### Task 3.2: Fix test hardcoded URLs
**Objective:** Tests fall back to `rank-helper-2.preview.emergentagent.com` — should use env var only.

**Files:**
- Modify: `backend/tests/test_seo_api.py:8`
- Modify: `backend/tests/test_iteration2.py:7`
- Modify: `backend/tests/test_iteration3.py:11`
- Modify: `backend/tests/test_iteration4.py:13`
- Modify: `backend/tests/test_iteration5.py:10`

**Step 1: Remove hardcoded fallbacks**
```python
BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
```
Remove the `.get()` with fallback — fail fast if not configured.

### Task 3.3: Add backend test for GBP endpoints
**Objective:** GBP backend exists but has no dedicated tests.

**Files:**
- Create: `backend/tests/test_gbp.py`

**Step 1: Test GBP audit endpoint**
- Test auth required
- Test valid audit submission
- Test history retrieval

---

## Phase 4: Operations & DevOps

### Task 4.1: Add health check endpoint with dependency status
**Objective:** Current `/api/` just returns `{"status": "ok"}`. Add DB and AI service health.

**Files:**
- Modify: `backend/server.py:422-424`

**Step 1: Enhanced health check**
```python
@api.get("/health")
async def health():
    health_status = {"status": "ok", "service": "Goodly API"}
    # Check MongoDB
    try:
        await db.command("ping")
        health_status["database"] = "connected"
    except Exception:
        health_status["database"] = "disconnected"
        health_status["status"] = "degraded"
    # Check AI service
    health_status["ai_service"] = "configured" if os.environ.get("EMERGENT_LLM_KEY") else "missing"
    # Check Stripe
    health_status["stripe"] = "configured" if os.environ.get("STRIPE_API_KEY") else "missing"
    return health_status
```

### Task 4.2: Add environment configuration template
**Objective:** Document all required env vars with a template.

**Files:**
- Create: `.env.example`
- Create: `backend/.env.example`

**Step 1: Create comprehensive .env.example**
```
# Environment
ENVIRONMENT=development

# MongoDB
MONGO_URL=mongodb://...
DB_NAME=goodly

# Auth
JWT_SECRET=change-me-to-a-random-64-char-string

# AI (Emergent)
EMERGENT_LLM_KEY=em-...

# Stripe
STRIPE_API_KEY=sk_live_...
STRIPE_PRICE_ID_CONCIERGE=price_...

# Email (Resend)
RESEND_API_KEY=re_...
SENDER_EMAIL=hello@goodly.app

# CORS
CORS_ORIGINS=https://goodly.app,https://www.goodly.app

# Scheduler
SCHEDULER_ENABLED=true

# Admin seed
ADMIN_EMAIL=admin@goodly.app
ADMIN_PASSWORD=...
```

### Task 4.3: Add MongoDB backup script
**Objective:** Simple backup script for disaster recovery.

**Files:**
- Create: `scripts/backup-mongo.sh`
- Create: `scripts/restore-mongo.sh`

### Task 4.4: Add deployment checklist
**Objective:** Document every step needed for a production deployment.

**Files:**
- Create: `DEPLOYMENT.md`

---

## Phase 5: Business Readiness

### Task 5.1: Add analytics integration placeholder
**Objective:** Prepare for Google Analytics / Plausible / PostHog.

**Files:**
- Modify: `frontend/public/index.html`

**Step 1: Add analytics script placeholder**
```html
<!-- Analytics: Replace with your provider -->
<!-- <script defer data-domain="goodly.app" src="https://plausible.io/js/script.js"></script> -->
```

### Task 5.2: Add Terms of Service and Privacy Policy pages
**Objective:** Required for Stripe and legal compliance.

**Files:**
- Create: `frontend/src/pages/Terms.jsx`
- Create: `frontend/src/pages/Privacy.jsx`
- Modify: `frontend/src/App.js`

### Task 5.3: Add email verification flow
**Objective:** Verify user emails before allowing full access (reduces fraud, improves deliverability).

**Files:**
- Modify: `backend/server.py` (register endpoint)
- Modify: `backend/email_service.py`
- Create: `backend/verify_email.py`

**Step 1: Add verification token to user doc**
```python
"email_verified": False,
"verification_token": str(uuid.uuid4()),
```

**Step 2: Send verification email on register**
**Step 3: Add verify endpoint**
```python
@api.get("/auth/verify/{token}")
async def verify_email(token: str):
    ...
```

### Task 5.4: Add password reset flow
**Objective:** Essential for any business SaaS.

**Files:**
- Create: `frontend/src/pages/ForgotPassword.jsx`
- Create: `frontend/src/pages/ResetPassword.jsx`
- Modify: `backend/server.py`
- Modify: `frontend/src/App.js`

---

## Phase 6: Polish & Launch Prep

### Task 6.1: Audit and fix all console errors
**Objective:** Run the dogfood QA skill against the live site and fix every console error.

**Method:** Use `dogfood` skill to systematically test every page at the production URL.

### Task 6.2: Mobile responsiveness audit
**Objective:** Test all pages on mobile viewport sizes.

### Task 6.3: Loading states and empty states
**Objective:** Every data-dependent component needs proper loading skeletons and empty state messages.

### Task 6.4: Accessibility pass
**Objective:** Ensure all interactive elements have proper ARIA labels, focus states, and keyboard navigation.

---

## Execution Order

```
Phase 1 (Security): 1.1 → 1.2 → 1.3 → 1.4 → 1.5
Phase 2 (Features): 2.1 → 2.2 → 2.3 → 2.4
Phase 3 (Quality):  3.1 → 3.2 → 3.3
Phase 4 (Ops):      4.1 → 4.2 → 4.3 → 4.4
Phase 5 (Business): 5.1 → 5.2 → 5.3 → 5.4
Phase 6 (Polish):   6.1 → 6.2 → 6.3 → 6.4
```

## Risks & Dependencies

| Risk | Mitigation |
|------|-----------|
| `EMERGENT_LLM_KEY` budget exhausted | User must top up before any AI feature works. All AI endpoints return 502. This is the #1 blocker. |
| No real Stripe Price ID | Concierge checkout falls back to Emergent dynamic-amount (dev only). Need real `STRIPE_PRICE_ID_CONCIERGE` for production. |
| No verified Resend sender domain | Emails send from `onboarding@resend.dev` — need verified domain for production. |
| MongoDB has no backups | Add backup script (Task 4.3) before going live with real data. |
| No staging environment | All testing against production preview URL. Recommend separate staging deploy. |

## Open Questions

1. What is the production domain? (goodly.app? goodly.com?)
2. Is there a real Stripe account with a live Price ID for Concierge?
3. Is there a verified Resend sender domain?
4. What analytics provider is preferred?
5. Should email verification be required or optional?
6. What's the backup strategy for MongoDB? (Atlas automated backups? Manual?)
