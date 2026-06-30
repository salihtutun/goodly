# Goodly — Business Production-Ready Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.
> **Goal:** Make Goodly fully production-ready with cloud database, MLOps, CI/CD, monitoring, and 99%+ test coverage.
> **Architecture:** FastAPI + MongoDB Atlas (cloud) + Gemini (AI) + Stripe + Cloud Run (GCP) + GitHub Actions (CI/CD)
> **Tech Stack:** Python 3.11+, FastAPI, Motor, Google Gemini 2.5 Flash, Stripe, APScheduler, Resend, ReportLab, React 19, Vite, Tailwind, shadcn/ui

---

## Current State Assessment

### What's Solid (v1.7)
- 53 API endpoints with full auth, rate limiting, CORS, sanitization
- 5-channel visibility: SEO, SERP, Social (IG/TT/YT), AI Visibility, GBP
- Stripe billing (checkout, portal, webhooks) with plan enforcement
- Email verification + password reset flows
- PDF export, scheduled audits, concierge briefs
- Dockerfile (multi-stage), cloudbuild.yaml (GCP Cloud Run)
- Health check with dependency status
- 14/15 backend modules at 100% test coverage
- Frontend: 22 pages, full auth flow, error pages, terms/privacy
- Docs: PRD, API reference, architecture, deployment guide, dev guide

### Critical Gaps for Business Readiness

| # | Gap | Severity | Category |
|---|-----|----------|----------|
| 1 | Test coverage only 65% (serp.py 63%, server.py 37%) | Critical | Quality |
| 2 | No CI/CD pipeline (GitHub Actions) | Critical | DevOps |
| 3 | No cloud MongoDB setup (Atlas) documented/automated | Critical | Infrastructure |
| 4 | No MLOps — prompts hardcoded, no eval framework, no versioning | High | AI/ML |
| 5 | No error tracking (Sentry) or APM | High | Operations |
| 6 | No load testing performed | High | Quality |
| 7 | No database migration strategy | Medium | DevOps |
| 8 | No API versioning strategy | Medium | API |
| 9 | No frontend E2E tests (Playwright) | Medium | Quality |
| 10 | No secrets rotation procedure | Medium | Security |
| 11 | No SLA/SLO definitions | Medium | Business |
| 12 | No incident response runbook | Medium | Operations |

---

## Phase 1: Test Coverage → 99% (Critical Path)

### Task 1.1: Push serp.py from 63% → 100%
**Objective:** Cover the 28 missed lines in `_check_via_duckduckgo` function.

**Files:**
- Modify: `tests/unit/test_serp.py` (or `tests/unit/test_serp_gaps.py`)

**Step 1: Write targeted tests for _check_via_duckduckgo**
```python
"""Tests for serp.py _check_via_duckduckgo (lines 61-93)."""
import pytest, asyncio
from unittest.mock import patch, MagicMock, AsyncMock

class AsyncCtxMock:
    def __init__(self, client):
        self._client = client
    async def __aenter__(self):
        return self._client
    async def __aexit__(self, *args):
        pass

def test_ddg_rank_found():
    from serp import _check_via_duckduckgo
    mock_resp = MagicMock()
    mock_resp.text = '<html><body><a class="result__a" href="https://example.com">R</a></body></html>'
    mock_client = MagicMock()
    mock_client.post = AsyncMock(return_value=mock_resp)
    with patch("serp.httpx.AsyncClient", return_value=AsyncCtxMock(mock_client)):
        r = asyncio.run(_check_via_duckduckgo("test kw", "example.com"))
        assert r["engine"] == "duckduckgo"
        assert r["found"] == True

def test_ddg_not_found():
    from serp import _check_via_duckduckgo
    mock_resp = MagicMock()
    mock_resp.text = '<html><body>No results</body></html>'
    mock_client = MagicMock()
    mock_client.post = AsyncMock(return_value=mock_resp)
    with patch("serp.httpx.AsyncClient", return_value=AsyncCtxMock(mock_client)):
        r = asyncio.run(_check_via_duckduckgo("test", "other.com"))
        assert r["found"] == False

def test_ddg_network_error():
    from serp import _check_via_duckduckgo
    mock_client = MagicMock()
    mock_client.post = AsyncMock(side_effect=Exception("Network error"))
    with patch("serp.httpx.AsyncClient", return_value=AsyncCtxMock(mock_client)):
        r = asyncio.run(_check_via_duckduckgo("test", "example.com"))
        assert r["error"] is not None
```

**Step 2: Run and verify**
```bash
cd /Users/salihtutun/Downloads/goodly-main
.venv/bin/python -m pytest tests/unit/test_serp.py tests/unit/test_serp_gaps.py -v --cov=backend/serp --cov-report=term
```
Expected: serp.py 100%

### Task 1.2: Push server.py from 37% → 80%+
**Objective:** Add comprehensive integration tests for server.py endpoints, helpers, middleware, and error handlers using FastAPI TestClient with mocked MongoDB.

**Files:**
- Create: `tests/integration/test_server_endpoints.py`
- Modify: `tests/integration/conftest.py`

**Step 1: Create robust TestClient fixture with mongomock**
```python
# tests/integration/conftest.py
import pytest
import mongomock
from unittest.mock import patch, AsyncMock, MagicMock
from fastapi.testclient import TestClient

@pytest.fixture
def mock_db():
    """Return a mongomock database with all collections."""
    client = mongomock.MongoClient()
    db = client["goodly"]
    # Pre-create all collections
    for coll in ["users", "projects", "audits", "payment_transactions",
                 "serp_checks", "scheduled_runs", "concierge_briefs",
                 "social_audits", "ai_visibility_checks", "gbp_audits",
                 "ai_history"]:
        db.create_collection(coll)
    return db

@pytest.fixture
def client(mock_db):
    """FastAPI TestClient with mocked MongoDB."""
    with patch("server._get_db", return_value=mock_db):
        from server import app
        with TestClient(app) as c:
            yield c
```

**Step 2: Test all endpoint categories**
- Auth endpoints (register, login, logout, me, verify, forgot/reset password)
- Project CRUD (create, list, get, update, delete)
- Audit endpoints (run, list, get, delete)
- AI tools (meta-tags, keywords, competitors)
- Health check
- Dashboard summary + visibility
- Billing (plans, me, checkout, status, portal)
- Stripe webhook
- PDF export
- SERP check + history
- Schedule management
- Onboarding
- GBP audit/suggestions/competitors/history
- AI visibility check/history
- Social audit/suggestions/competitors/history
- Concierge brief (upsert, get, admin list)
- Scheduler (run-now, runs)
- Rate limiting behavior
- CORS headers
- Error handling (404, 401, 402, 403, 502)

**Step 3: Run and verify**
```bash
.venv/bin/python -m pytest tests/integration/ -v --cov=backend/server --cov-report=term
```
Target: server.py >80%

### Task 1.3: Final coverage push to 99%
**Objective:** Identify and cover any remaining gaps.

**Step 1: Generate detailed HTML coverage report**
```bash
.venv/bin/python -m pytest tests/ -v --cov=backend --cov-report=html:tests/reports/coverage
```

**Step 2: Review uncovered lines and add targeted tests**

**Step 3: Verify 99%+ overall**
```bash
.venv/bin/python -m pytest tests/ -v --cov=backend --cov-report=term --cov-fail-under=99
```

---

## Phase 2: Cloud Database — MongoDB Atlas

### Task 2.1: Create MongoDB Atlas cluster setup script
**Objective:** Automated setup of production MongoDB Atlas cluster with proper security.

**Files:**
- Create: `scripts/setup-atlas.sh`
- Create: `scripts/atlas-network-access.sh`

**Step 1: Atlas cluster creation script**
```bash
#!/bin/bash
# scripts/setup-atlas.sh
# Creates M10+ cluster, database user, network access, and connection string

PROJECT_ID="${ATLAS_PROJECT_ID:-goodly-prod}"
CLUSTER_NAME="${ATLAS_CLUSTER_NAME:-goodly-prod}"
REGION="${ATLAS_REGION:-us-central1}"
DB_USER="${ATLAS_DB_USER:-goodly-app}"
DB_NAME="${ATLAS_DB_NAME:-goodly}"

# Install mongosh if needed
# Create cluster via Atlas CLI
atlas cluster create $CLUSTER_NAME \
  --projectId $PROJECT_ID \
  --region $REGION \
  --tier M10 \
  --provider GCP \
  --mdbVersion 7.0

# Create database user
DB_PASSWORD=$(openssl rand -base64 32)
atlas dbusers create \
  --username $DB_USER \
  --password "$DB_PASSWORD" \
  --role readWrite@$DB_NAME \
  --projectId $PROJECT_ID

# Add IP access (Cloud Run uses dynamic IPs — use VPC peering or IP whitelist)
atlas accessList create \
  --cidr "0.0.0.0/0" \
  --comment "Cloud Run (restrict via VPC peering in production)" \
  --projectId $PROJECT_ID

# Output connection string
CONN_STRING=$(atlas cluster connectionString describe $CLUSTER_NAME --projectId $PROJECT_ID)
echo "MONGO_URL=mongodb+srv://${DB_USER}:${DB_PASSWORD}@${CONN_STRING}/${DB_NAME}?retryWrites=true&w=majority"
echo "Save this password securely: $DB_PASSWORD"
```

### Task 2.2: Add MongoDB Atlas connection pooling config
**Objective:** Optimize connection pooling for serverless Cloud Run.

**Files:**
- Modify: `backend/server.py:49-57`

**Step 1: Add connection pool settings**
```python
def _get_db():
    global _client, _db
    if _client is None:
        mongo_url = os.environ.get("MONGO_URL")
        if not mongo_url:
            raise RuntimeError("MONGO_URL not configured")
        _client = AsyncIOMotorClient(
            mongo_url,
            maxPoolSize=10,           # Cloud Run: limited connections
            minPoolSize=0,            # Scale to zero
            serverSelectionTimeoutMS=5000,
            connectTimeoutMS=5000,
            retryWrites=True,
            w="majority",
        )
        _db = _client[os.environ.get("DB_NAME", "goodly")]
    return _db
```

### Task 2.3: Add database migration framework
**Objective:** Versioned migrations instead of ad-hoc startup index creation.

**Files:**
- Create: `backend/migrations/__init__.py`
- Create: `backend/migrations/001_initial_indexes.py`
- Create: `backend/migrations/runner.py`

**Step 1: Migration runner**
```python
# backend/migrations/runner.py
"""Simple versioned migration runner for MongoDB."""
import logging
from motor.motor_asyncio import AsyncIOMotorDatabase

logger = logging.getLogger(__name__)

MIGRATIONS = []

def migration(version: int, name: str):
    """Decorator to register a migration."""
    def decorator(fn):
        MIGRATIONS.append((version, name, fn))
        return fn
    return decorator

async def run_migrations(db: AsyncIOMotorDatabase):
    """Run all pending migrations in order."""
    # Ensure migrations collection exists
    applied = set()
    async for doc in db.migrations.find({}):
        applied.add(doc["version"])
    
    for version, name, fn in sorted(MIGRATIONS):
        if version in applied:
            continue
        logger.info("Running migration %03d: %s", version, name)
        await fn(db)
        await db.migrations.insert_one({
            "version": version,
            "name": name,
            "applied_at": datetime.utcnow().isoformat(),
        })
        logger.info("Migration %03d complete", version)
```

**Step 2: First migration — all indexes**
```python
# backend/migrations/001_initial_indexes.py
from .runner import migration

@migration(1, "Create initial indexes")
async def create_indexes(db):
    await db.users.create_index("email", unique=True)
    await db.users.create_index("id", unique=True)
    await db.users.create_index("verification_token", sparse=True)
    await db.users.create_index("reset_token", sparse=True)
    await db.projects.create_index("id", unique=True)
    await db.projects.create_index("user_id")
    await db.projects.create_index([("schedule", 1), ("next_audit_at", 1)])
    await db.audits.create_index("id", unique=True)
    await db.audits.create_index([("user_id", 1), ("created_at", -1)])
    await db.payment_transactions.create_index("session_id", unique=True)
    await db.serp_checks.create_index([("user_id", 1), ("created_at", -1)])
    await db.scheduled_runs.create_index([("user_id", 1), ("run_at", -1)])
    await db.concierge_briefs.create_index("user_id", unique=True)
    await db.social_audits.create_index([("user_id", 1), ("created_at", -1)])
    await db.ai_visibility_checks.create_index([("user_id", 1), ("created_at", -1)])
    await db.gbp_audits.create_index([("user_id", 1), ("created_at", -1)])
    await db.ai_history.create_index([("user_id", 1), ("created_at", -1)])
    # TTL indexes
    await db.serp_checks.create_index("created_at", expireAfterSeconds=90*24*3600)
    await db.ai_history.create_index("created_at", expireAfterSeconds=365*24*3600)
```

---

## Phase 3: CI/CD Pipeline — GitHub Actions

### Task 3.1: Create CI workflow (test + lint on PR)
**Objective:** Automated testing and linting on every PR and push to main.

**Files:**
- Create: `.github/workflows/ci.yml`

**Step 1: CI workflow**
```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    services:
      mongodb:
        image: mongo:7
        ports:
          - 27017:27017
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
          cache: pip
      - run: pip install -r backend/requirements.txt
      - run: pip install pytest pytest-cov pytest-asyncio mongomock
      - run: cd backend && python -m pytest ../tests/ -v --cov=backend --cov-report=xml --cov-report=term --cov-fail-under=90
        env:
          MONGO_URL: mongodb://localhost:27017
          JWT_SECRET: test-secret-for-ci
          GEMINI_API_KEY: test-key
          ENVIRONMENT: test
      - uses: codecov/codecov-action@v4
        with:
          file: ./coverage.xml

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: frontend/package-lock.json
      - run: cd frontend && npm ci --legacy-peer-deps
      - run: cd frontend && npm test -- --watchAll=false --passWithNoTests
      - run: cd frontend && npm run build

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.11"
      - run: pip install ruff
      - run: ruff check backend/ --ignore=E501
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: cd frontend && npx eslint src/ --ext .jsx,.js --no-error-on-unmatched-pattern || true
```

### Task 3.2: Create CD workflow (deploy to Cloud Run)
**Objective:** Automated deployment to GCP Cloud Run on merge to main.

**Files:**
- Create: `.github/workflows/cd.yml`

**Step 1: CD workflow**
```yaml
# .github/workflows/cd.yml
name: Deploy to Cloud Run

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4
      
      - id: auth
        uses: google-github-actions/auth@v2
        with:
          workload_identity_provider: ${{ secrets.GCP_WIF_PROVIDER }}
          service_account: ${{ secrets.GCP_SA_EMAIL }}
      
      - uses: google-github-actions/setup-gcloud@v2
      
      - run: gcloud auth configure-docker us-central1-docker.pkg.dev
      
      - run: |
          docker build -t us-central1-docker.pkg.dev/${{ secrets.GCP_PROJECT_ID }}/goodly/goodly-api:${{ github.sha }} .
          docker push us-central1-docker.pkg.dev/${{ secrets.GCP_PROJECT_ID }}/goodly/goodly-api:${{ github.sha }}
      
      - run: |
          gcloud run deploy goodly-api \
            --image=us-central1-docker.pkg.dev/${{ secrets.GCP_PROJECT_ID }}/goodly/goodly-api:${{ github.sha }} \
            --region=us-central1 \
            --platform=managed \
            --allow-unauthenticated \
            --memory=1Gi \
            --cpu=1 \
            --min-instances=0 \
            --max-instances=10 \
            --timeout=300 \
            --set-env-vars=ENVIRONMENT=production \
            --set-secrets=MONGO_URL=MONGO_URL:latest \
            --set-secrets=JWT_SECRET=JWT_SECRET:latest \
            --set-secrets=GEMINI_API_KEY=GEMINI_API_KEY:latest \
            --set-secrets=STRIPE_API_KEY=STRIPE_API_KEY:latest \
            --set-secrets=RESEND_API_KEY=RESEND_API_KEY:latest \
            --set-secrets=STRIPE_WEBHOOK_SECRET=STRIPE_WEBHOOK_SECRET:latest
      
      - run: |
          gcloud run deploy goodly-frontend \
            --source=./frontend \
            --region=us-central1 \
            --platform=managed \
            --allow-unauthenticated \
            --memory=512Mi \
            --set-env-vars=REACT_APP_BACKEND_URL=${{ steps.deploy.outputs.url }}
```

### Task 3.3: Add pre-commit hooks
**Objective:** Catch issues before they reach CI.

**Files:**
- Create: `.pre-commit-config.yaml`

```yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.6.0
    hooks:
      - id: ruff
        args: [--fix, --ignore=E501]
      - id: ruff-format
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.6.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-json
      - id: detect-private-key
```

---

## Phase 4: MLOps — AI Pipeline Management

### Task 4.1: Create prompt registry with versioning
**Objective:** Move all hardcoded prompts out of service files into a versioned registry.

**Files:**
- Create: `backend/prompts/__init__.py`
- Create: `backend/prompts/registry.py`
- Create: `backend/prompts/v1/__init__.py`
- Create: `backend/prompts/v1/seo.py`
- Create: `backend/prompts/v1/social.py`
- Create: `backend/prompts/v1/gbp.py`
- Create: `backend/prompts/v1/ai_visibility.py`

**Step 1: Prompt registry**
```python
# backend/prompts/registry.py
"""Versioned prompt registry for all AI features."""

from dataclasses import dataclass, field
from typing import Dict, Optional
import os

@dataclass
class Prompt:
    version: str
    system: str
    user_template: str
    model: str = "gemini-2.5-flash"
    temperature: float = 0.3
    max_tokens: int = 2048
    metadata: Dict = field(default_factory=dict)

class PromptRegistry:
    def __init__(self):
        self._prompts: Dict[str, Dict[str, Prompt]] = {}
    
    def register(self, name: str, version: str, prompt: Prompt):
        if name not in self._prompts:
            self._prompts[name] = {}
        self._prompts[name][version] = prompt
    
    def get(self, name: str, version: Optional[str] = None) -> Prompt:
        versions = self._prompts.get(name, {})
        if not versions:
            raise KeyError(f"No prompt registered for '{name}'")
        if version:
            return versions[version]
        # Return latest version
        return versions[sorted(versions.keys())[-1]]
    
    def list_versions(self, name: str):
        return sorted(self._prompts.get(name, {}).keys())

# Global registry
registry = PromptRegistry()
```

**Step 2: Example prompt — SEO audit recommendations**
```python
# backend/prompts/v1/seo.py
from ..registry import registry, Prompt

registry.register("seo_audit_recommendations", "v1", Prompt(
    version="v1",
    system="You are an expert SEO consultant. Provide actionable, specific recommendations.",
    user_template="""Analyze this SEO audit and provide recommendations:

URL: {url}
Overall Score: {overall_score}/100
Issues Found: {issues}
Categories: {categories}

Return JSON with:
- summary: 2-3 sentence executive summary
- priority_actions: top 3 fixes with effort (low/medium/high) and impact (low/medium/high)
- wins: 2-3 quick wins that take <1 hour
- next_30_days: 3-5 strategic actions for the next month""",
    model="gemini-2.5-flash",
    temperature=0.3,
    max_tokens=2048,
))
```

### Task 4.2: Create AI evaluation framework
**Objective:** Measure prompt quality with automated evals.

**Files:**
- Create: `backend/evals/__init__.py`
- Create: `backend/evals/runner.py`
- Create: `backend/evals/test_cases/seo_audit.json`

**Step 1: Eval runner**
```python
# backend/evals/runner.py
"""Simple evaluation framework for AI outputs."""

import json
from typing import List, Dict, Callable
from dataclasses import dataclass

@dataclass
class EvalCase:
    name: str
    input: Dict
    expected_keys: List[str]
    assertions: List[Callable]  # Functions that take output and return (bool, str)

class EvalResult:
    def __init__(self):
        self.passed = 0
        self.failed = 0
        self.failures = []

async def run_eval(prompt_fn, cases: List[EvalCase]) -> EvalResult:
    result = EvalResult()
    for case in cases:
        output = await prompt_fn(**case.input)
        for key in case.expected_keys:
            if key not in output:
                result.failed += 1
                result.failures.append(f"{case.name}: missing key '{key}'")
        for assertion in case.assertions:
            ok, msg = assertion(output)
            if not ok:
                result.failed += 1
                result.failures.append(f"{case.name}: {msg}")
            else:
                result.passed += 1
    return result
```

### Task 4.3: Add prompt A/B testing support
**Objective:** Ability to run two prompt versions and compare results.

**Files:**
- Modify: `backend/llm_client.py`

**Step 1: Add version parameter to LLM calls**
```python
async def get_client(prompt_version: str = None):
    """Get Gemini client. If prompt_version is set, use that prompt version."""
    # ... existing code ...
    if prompt_version:
        client.prompt_version = prompt_version
    return client
```

### Task 4.4: Add AI usage tracking dashboard
**Objective:** Track token usage, costs, latency per feature.

**Files:**
- Create: `backend/ai_metrics.py`
- Modify: `backend/llm_client.py`

**Step 1: Metrics collector**
```python
# backend/ai_metrics.py
import time
from datetime import datetime, timezone
from dataclasses import dataclass, field
from typing import Optional

@dataclass
class AIMetrics:
    feature: str
    prompt_version: str
    model: str
    input_tokens: int
    output_tokens: int
    latency_ms: float
    success: bool
    error: Optional[str] = None
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class AIMetricsCollector:
    def __init__(self, db):
        self.db = db
    
    async def record(self, metrics: AIMetrics):
        await self.db.ai_metrics.insert_one(metrics.__dict__)
    
    async def summary(self, days: int = 7):
        """Get cost and usage summary for last N days."""
        cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
        pipeline = [
            {"$match": {"timestamp": {"$gte": cutoff}}},
            {"$group": {
                "_id": "$feature",
                "calls": {"$sum": 1},
                "total_input_tokens": {"$sum": "$input_tokens"},
                "total_output_tokens": {"$sum": "$output_tokens"},
                "avg_latency_ms": {"$avg": "$latency_ms"},
                "error_rate": {"$avg": {"$cond": [{"$eq": ["$success", False]}, 1, 0]}},
            }},
        ]
        return await self.db.ai_metrics.aggregate(pipeline).to_list(100)
```

---

## Phase 5: Monitoring & Observability

### Task 5.1: Add structured logging
**Objective:** JSON-formatted logs for Cloud Logging aggregation.

**Files:**
- Create: `backend/logging_config.py`
- Modify: `backend/server.py`

**Step 1: Structured logger**
```python
# backend/logging_config.py
import logging
import json
import sys
from datetime import datetime, timezone

class StructuredFormatter(logging.Formatter):
    def format(self, record):
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        if record.exc_info and record.exc_info[1]:
            log_entry["exception"] = str(record.exc_info[1])
        return json.dumps(log_entry)

def setup_logging():
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(StructuredFormatter())
    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(logging.INFO)
```

### Task 5.2: Add Sentry error tracking
**Objective:** Real-time error alerts with stack traces.

**Files:**
- Modify: `backend/requirements.txt` (add `sentry-sdk`)
- Modify: `backend/server.py`

**Step 1: Sentry initialization**
```python
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

sentry_sdk.init(
    dsn=os.environ.get("SENTRY_DSN", ""),
    environment=os.environ.get("ENVIRONMENT", "development"),
    traces_sample_rate=0.1,
    integrations=[FastApiIntegration()],
)
```

### Task 5.3: Add Cloud Monitoring metrics
**Objective:** Custom metrics for API latency, error rates, AI call volume.

**Files:**
- Create: `backend/metrics.py`
- Modify: `backend/server.py`

**Step 1: Metrics middleware**
```python
# backend/metrics.py
import time
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

class MetricsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.time()
        response = await call_next(request)
        duration = time.time() - start
        
        # Log metric (Cloud Logging will pick this up)
        logging.getLogger("metrics").info(json.dumps({
            "metric": "request_duration_ms",
            "value": duration * 1000,
            "path": request.url.path,
            "method": request.method,
            "status": response.status_code,
        }))
        return response
```

### Task 5.4: Create operational dashboards
**Objective:** Pre-built Grafana/Cloud Monitoring dashboard configs.

**Files:**
- Create: `monitoring/dashboards/api-overview.json`
- Create: `monitoring/dashboards/ai-metrics.json`
- Create: `monitoring/alerts.yaml`

---

## Phase 6: Frontend Production Hardening

### Task 6.1: Add E2E tests with Playwright
**Objective:** Critical user journeys tested end-to-end.

**Files:**
- Create: `tests/e2e/playwright.config.js`
- Create: `tests/e2e/auth.spec.js`
- Create: `tests/e2e/audit-flow.spec.js`
- Create: `tests/e2e/billing.spec.js`

**Step 1: Playwright config**
```javascript
// tests/e2e/playwright.config.js
const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: '.',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: process.env.FRONTEND_URL || 'http://localhost:3000',
    screenshot: 'only-on-failure',
  },
});
```

**Step 2: Auth E2E test**
```javascript
// tests/e2e/auth.spec.js
const { test, expect } = require('@playwright/test');

test('full auth flow: register → login → dashboard → logout', async ({ page }) => {
  const email = `test-${Date.now()}@example.com`;
  
  // Register
  await page.goto('/register');
  await page.fill('[data-testid="register-name-input"]', 'Test User');
  await page.fill('[data-testid="register-email-input"]', email);
  await page.fill('[data-testid="register-password-input"]', 'TestPass123!');
  await page.click('[data-testid="register-submit-btn"]');
  await expect(page).toHaveURL('/app');
  
  // Logout
  await page.click('[data-testid="user-menu"]');
  await page.click('[data-testid="logout-btn"]');
  await expect(page).toHaveURL('/login');
  
  // Login
  await page.fill('[data-testid="login-email-input"]', email);
  await page.fill('[data-testid="login-password-input"]', 'TestPass123!');
  await page.click('[data-testid="login-submit-btn"]');
  await expect(page).toHaveURL('/app');
});
```

### Task 6.2: Add environment-specific configs
**Objective:** Separate dev/staging/prod configs for frontend.

**Files:**
- Create: `frontend/.env.development`
- Create: `frontend/.env.staging`
- Create: `frontend/.env.production`
- Modify: `frontend/vite.config.js`

### Task 6.3: Add PWA support
**Objective:** Installable PWA for mobile users.

**Files:**
- Create: `frontend/public/manifest.json`
- Create: `frontend/public/service-worker.js`
- Modify: `frontend/index.html`

### Task 6.4: Performance optimization
**Objective:** Code splitting, lazy loading, image optimization.

**Files:**
- Modify: `frontend/src/App.jsx` (add React.lazy for route-based splitting)
- Modify: `frontend/vite.config.js` (add build optimizations)

---

## Phase 7: Security Hardening

### Task 7.1: Add secrets rotation runbook
**Objective:** Documented procedure for rotating all secrets.

**Files:**
- Create: `docs/operations/secrets-rotation.md`

### Task 7.2: Add security headers
**Objective:** HSTS, CSP, X-Frame-Options, etc.

**Files:**
- Modify: `backend/server.py` (add security headers middleware)

### Task 7.3: Add rate limit monitoring
**Objective:** Alert when rate limits are being hit.

**Files:**
- Modify: `backend/server.py` (add rate limit hit logging)

---

## Phase 8: Documentation & Runbooks

### Task 8.1: Create incident response runbook
**Files:**
- Create: `docs/operations/incident-response.md`

### Task 8.2: Create SLA/SLO definitions
**Files:**
- Create: `docs/operations/sla.md`

### Task 8.3: Create API versioning strategy doc
**Files:**
- Create: `docs/architecture/api-versioning.md`

---

## Execution Order

```
Phase 1 (Tests):    1.1 → 1.2 → 1.3          [Critical path — must do first]
Phase 2 (DB):       2.1 → 2.2 → 2.3          [Cloud infra setup]
Phase 3 (CI/CD):    3.1 → 3.2 → 3.3          [Automation]
Phase 4 (MLOps):    4.1 → 4.2 → 4.3 → 4.4    [AI pipeline]
Phase 5 (Monitoring): 5.1 → 5.2 → 5.3 → 5.4  [Observability]
Phase 6 (Frontend): 6.1 → 6.2 → 6.3 → 6.4    [UX hardening]
Phase 7 (Security): 7.1 → 7.2 → 7.3          [Hardening]
Phase 8 (Docs):     8.1 → 8.2 → 8.3          [Runbooks]
```

## Success Criteria

- [ ] All backend modules at 100% test coverage, overall >99%
- [ ] CI pipeline runs on every PR (tests + lint + build)
- [ ] CD pipeline deploys to Cloud Run on merge to main
- [ ] MongoDB Atlas cluster configured with connection pooling
- [ ] Database migrations are versioned and automated
- [ ] All AI prompts are in versioned registry with eval framework
- [ ] AI metrics tracked (tokens, latency, cost per feature)
- [ ] Structured JSON logging to stdout
- [ ] Sentry error tracking configured
- [ ] E2E tests cover critical user journeys
- [ ] Security headers configured (HSTS, CSP, etc.)
- [ ] Incident response runbook documented
- [ ] SLA/SLO targets defined
- [ ] Secrets rotation procedure documented
