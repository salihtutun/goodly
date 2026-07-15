from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Response, Request, BackgroundTasks
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field, field_validator
import asyncio

from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from auth import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    get_current_user_id,
    set_auth_cookie,
    store_refresh_token,
    consume_refresh_token,
    revoke_user_refresh_tokens,
    extract_token,
    decode_token,
)
from seo_analyzer import analyze_url
import ai_service
from billing import PLANS, get_plan, month_key, create_subscription_checkout
from pdf_export import build_audit_pdf
from serp import check_rank
from fastapi.responses import StreamingResponse
import scheduler as scheduler_mod
import stripe as stripe_sdk
import social_service
import social_fetcher
import ai_visibility
import gbp_service
import email_service
from sanitize import sanitize_html, sanitize_name
from validators import validate_url, validate_email
from logging_config import setup_logging
from metrics import MetricsMiddleware
from security_headers import SecurityHeadersMiddleware
from version_header import VersionHeaderMiddleware
from sentry_integration import init_sentry
from cache import dashboard_cache
from features import is_enabled
from revenue_impact import estimate_total_revenue_impact
import agency_service
import achievements
import competitor_analysis
import ai_content
import ai_remediation
import ai_strategy
import seo_enhanced

# Structured JSON logging for Cloud Logging
setup_logging()

# Error tracking (no-op unless SENTRY_DSN is set and sentry-sdk is installed)
init_sentry()


# --- Mongo setup (lazy for serverless) ---
_client = None
_db = None

def _get_db():
    global _client, _db
    if _client is None:
        mongo_url = os.environ.get("MONGO_URL")
        if not mongo_url:
            raise RuntimeError("MONGO_URL not configured")
        _client = AsyncIOMotorClient(
            mongo_url,
            minPoolSize=2,
            maxPoolSize=20,
            maxIdleTimeMS=30000,
            connectTimeoutMS=5000,
            serverSelectionTimeoutMS=5000,
        )
        _db = _client[os.environ.get("DB_NAME", "goodly")]
        # Share connection with database.py so all routes use the same client
        import database as _db_mod
        _db_mod._init_connection(_client, _db)
    return _db

# Proxy object that lazily resolves to db
class _LazyDB:
    def __getattr__(self, name):
        return getattr(_get_db(), name)
    def __getitem__(self, key):
        return _get_db()[key]

db = _LazyDB()

from version import VERSION

app = FastAPI(title="Goodly API", version=VERSION)
api = APIRouter(prefix="/api")
# Single shared limiter instance (also used by routes/* modules) so SlowAPI
# middleware enforcement and test overrides apply everywhere.
from limiter import limiter

logger = logging.getLogger("seo_framework")


# ── CSRF Protection Middleware ──────────────────────────
# Double-submit cookie pattern: server sets a random csrf_token cookie
# (readable by JS, not HttpOnly). State-changing requests must include
# the same value in X-CSRF-Token header. GET/HEAD/OPTIONS are exempt.
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

class CSRFTokenMiddleware(BaseHTTPMiddleware):
    SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}
    # Machine-to-machine + pre-auth endpoints use their own auth (API key,
    # Stripe signature, or credentials) and cannot carry a CSRF cookie yet.
    EXEMPT_PREFIXES = (
        "/api/webhook/",
        "/api/scheduler/trigger",
        "/api/public/",
        "/api/auth/login",
        "/api/auth/register",
        "/api/auth/google",
        "/api/auth/forgot-password",
        "/api/auth/reset-password",
        "/api/auth/refresh",
        "/api/support/contact",
    )

    async def dispatch(self, request, call_next):
        # Only enforce CSRF in production — dev/tests skip it
        is_production = os.environ.get("ENVIRONMENT", "development") == "production"
        path = request.url.path
        if is_production and request.method not in self.SAFE_METHODS:
            if not any(path.startswith(p) for p in self.EXEMPT_PREFIXES):
                cookie_token = request.cookies.get("csrf_token", "")
                header_token = request.headers.get("X-CSRF-Token", "")
                if not cookie_token or not header_token or cookie_token != header_token:
                    return JSONResponse(
                        status_code=403,
                        content={"detail": "CSRF token missing or invalid"},
                    )
        response = await call_next(request)
        return response

app.add_middleware(CSRFTokenMiddleware)


# ── Request Body Size Limit ────────────────────────────
# Reject requests with bodies larger than 10MB before they reach handlers.
MAX_BODY_SIZE = 10 * 1024 * 1024  # 10 MB

class BodySizeLimitMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                if int(content_length) > MAX_BODY_SIZE:
                    return JSONResponse(
                        status_code=413,
                        content={"detail": "Request body too large (max 10MB)"},
                    )
            except ValueError:
                pass
        return await call_next(request)

app.add_middleware(BodySizeLimitMiddleware)


# ---------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def public_user(doc: dict) -> dict:
    return {
        "id": doc["id"],
        "email": doc["email"],
        "name": doc.get("name") or doc["email"].split("@")[0],
        "role": doc.get("role", "user"),
        "plan": doc.get("plan", "free"),
        "onboarded": doc.get("onboarded", False),
        "email_verified": doc.get("email_verified", False),
        "created_at": doc.get("created_at"),
        "brand_voice": doc.get("brand_voice"),
    }


async def get_user(user_id: str) -> dict:
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def get_current_user_doc(user_id: str = Depends(get_current_user_id)) -> dict:
    return await get_user(user_id)


async def usage_for(user_id: str) -> dict:
    mk = month_key()
    audits_this_month = await db.audits.count_documents({
        "user_id": user_id, "month_key": mk,
    })
    projects_count = await db.projects.count_documents({"user_id": user_id})
    return {"month": mk, "audits_this_month": audits_this_month, "projects_count": projects_count}


async def _send_email_background(to: str, subject: str, html: str) -> None:
    """Send an email in the background, logging but never raising on failure."""
    try:
        await email_service.send_html_email(to=to, subject=subject, html=html)
    except Exception as e:
        logger.warning("Background email to %s failed: %s", to, e)


async def _invalidate_dashboard_cache(user_id: str) -> None:
    """Clear cached dashboard data for a user after mutations."""
    await dashboard_cache.delete(f"summary:{user_id}")
    await dashboard_cache.delete(f"achievements:{user_id}")
    await dashboard_cache.delete(f"visibility:{user_id}")
    await dashboard_cache.delete(f"notifications:{user_id}")


async def _seed_demo_experience(user_id: str) -> None:
    """Create a sample project with a pre-built audit so new users see a populated dashboard."""
    # Check if user already has any projects (don't double-seed)
    existing = await db.projects.count_documents({"user_id": user_id})
    if existing > 0:
        return

    # Don't seed for free plan users — preserve their limited slots
    user = await db.users.find_one({"id": user_id})
    plan = get_plan(user.get("plan")) if user else get_plan("free")
    if plan.get("id") == "free":
        return

    sample_project = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "name": "My Business Website",
        "url": "https://example.com",
        "created_at": now_iso(),
        "last_audit_at": now_iso(),
        "last_score": 62,
    }
    await db.projects.insert_one(sample_project)

    # Pre-built sample audit with realistic issues
    sample_audit = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "project_id": sample_project["id"],
        "url": "https://example.com",
        "created_at": now_iso(),
        "month_key": month_key(),
        "result": {
            "url": "https://example.com",
            "overall_score": 62,
            "categories": {
                "meta": {"score": 45, "label": "Meta Tags"},
                "headings": {"score": 60, "label": "Headings"},
                "content": {"score": 55, "label": "Content"},
                "technical": {"score": 70, "label": "Technical"},
                "images": {"score": 50, "label": "Images"},
                "links": {"score": 80, "label": "Links"},
            },
            "issues": [
                {"title": "Missing meta description", "severity": "high", "category": "meta", "message": "Your page has no meta description. This is what shows up in Google search results. Add a compelling 150-160 character description that includes your main keyword."},
                {"title": "Page title is too short", "severity": "medium", "category": "meta", "message": "Your title tag is only 20 characters. Aim for 50-60 characters with your primary keyword near the beginning."},
                {"title": "Missing H1 heading", "severity": "high", "category": "headings", "message": "Your page has no H1 tag. Every page needs one clear H1 that tells Google what the page is about."},
                {"title": "Slow page speed", "severity": "high", "category": "technical", "message": "Your page loads in 4.2 seconds. Google recommends under 2.5 seconds. Compress images and enable caching."},
                {"title": "Missing alt text on 8 images", "severity": "medium", "category": "images", "message": "8 images on your page have no alt text. Add descriptive alt text to help Google understand your images and improve accessibility."},
                {"title": "Thin content — only 180 words", "severity": "medium", "category": "content", "message": "Your page has very little content. Aim for at least 300-500 words of useful, keyword-rich content."},
            ],
        },
        "ai_recommendations": {
            "summary": "Your website has solid foundations but several critical issues are holding you back from ranking on Google. The good news: most of these are quick fixes you can do today.",
            "priority_actions": [
                {"action": "Add a meta description", "impact": "high", "effort": "5 minutes", "detail": "Write a 150-160 character description that includes your main service and location. Example: 'Professional plumbing services in Austin, TX. 24/7 emergency repairs, licensed & insured. Call (512) 555-0100 for a free estimate.'"},
                {"action": "Add an H1 heading", "impact": "high", "effort": "2 minutes", "detail": "Add a clear H1 tag at the top of your page. Make it descriptive: 'Austin Plumbing Services — 24/7 Emergency Repairs'"},
                {"action": "Compress your images", "impact": "high", "effort": "15 minutes", "detail": "Use a tool like TinyPNG to compress your images. This alone could cut your load time in half."},
            ],
            "wins": [
                "Your SSL certificate is properly configured — Google loves secure sites.",
                "Your internal linking structure is clean and easy to crawl.",
                "No broken links detected — all your pages are accessible.",
            ],
            "next_30_days": "Fix the 3 priority actions above, then re-audit. Most businesses see a 10-15 point score improvement after these fixes. Then focus on adding more content to your pages.",
        },
        "revenue_impact": {
            "total_estimated_monthly_revenue_loss": 3200,
            "total_estimated_annual_revenue_loss": 38400,
            "total_estimated_additional_clicks": 255,
            "total_estimated_additional_conversions": 6.4,
            "top_quick_wins": [
                {"title": "Slow page speed", "monthly_impact": 1200, "explanation": "Fixing page speed could bring ~95 additional clicks and ~2.4 new customers/month worth ~$1,200/month."},
                {"title": "Missing meta description", "monthly_impact": 800, "explanation": "Adding a meta description could bring ~65 additional clicks and ~1.6 new customers/month worth ~$800/month."},
                {"title": "Missing H1 heading", "monthly_impact": 650, "explanation": "Adding an H1 could bring ~50 additional clicks and ~1.3 new customers/month worth ~$650/month."},
            ],
            "summary": "Fixing all 6 issues could bring approximately 255 additional clicks and 6.4 new customers per month, worth an estimated $3,200/month ($38,400/year).",
            "disclaimer": "Estimates are directional and based on industry averages. Actual results depend on your market, competition, and implementation quality.",
        },
    }
    await db.audits.insert_one(sample_audit)


# ---------------------------------------------------------------
# Auth models / endpoints
# ---------------------------------------------------------------
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    name: Optional[str] = None
    website: Optional[str] = None

    @field_validator("password")
    @classmethod
    def validate_password(cls, v):
        if v.lower() in ("password", "12345678", "qwerty123", "admin1234", "letmein1"):
            raise ValueError("Password is too common — please choose a stronger one")
        return v


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordIn(BaseModel):
    email: EmailStr


class ResetPasswordIn(BaseModel):
    token: str
    new_password: str = Field(min_length=8, max_length=128)


class GoogleAuthIn(BaseModel):
    credential: str  # Google ID token from Sign In With Google


class AuthOut(BaseModel):
    user: dict
    token: str
    # Present when registration includes a website and auto-audit succeeds.
    audit: Optional[dict] = None


def _set_auth_cookies(response: Response, access_token: str, csrf_token: str = None):
    """Set auth + CSRF cookies on the response."""
    set_auth_cookie(response, access_token)
    # Set CSRF token cookie (readable by JS, not HttpOnly)
    if csrf_token:
        is_production = os.environ.get("ENVIRONMENT", "development") == "production"
        response.set_cookie(
            key="csrf_token",
            value=csrf_token,
            httponly=False,  # Must be readable by JS
            secure=is_production,
            samesite="none" if is_production else "lax",
            max_age=60 * 60 * 24,  # 24 hours
            path="/",
        )


@api.post("/auth/register", response_model=AuthOut)
@limiter.limit("3/minute")
async def register(request: Request, body: RegisterIn, response: Response, bg: BackgroundTasks):
    email = body.email.lower().strip()
    if not validate_email(email):
        raise HTTPException(status_code=400, detail="Invalid email address.")
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")
    user_doc = {
        "id": str(uuid.uuid4()),
        "email": email,
        "password_hash": hash_password(body.password),
        "name": sanitize_name(body.name or email.split("@")[0]),
        "role": "user",
        "plan": "free",
        "onboarded": False,
        "email_verified": False,
        "verification_token": str(uuid.uuid4()),
        "created_at": now_iso(),
    }
    await db.users.insert_one(user_doc)

    # Track signup event
    try:
        from product_analytics import track_event
        await track_event(db, event="signup", user_id=user_doc["id"], properties={"plan": "free"})
    except Exception:
        pass  # Analytics tracking is non-critical

    # Send verification email in background (non-blocking)
    verify_link = f"{_store_base_url(request)}/api/auth/verify/{user_doc['verification_token']}"
    bg.add_task(
        _send_email_background,
        to=email,
        subject="Verify your email — Goodly",
        html=email_service.verify_email_html(name=user_doc["name"], verify_link=verify_link),
    )

    token = create_access_token(user_doc["id"], email)
    refresh = create_refresh_token(user_doc["id"])
    await store_refresh_token(db, user_doc["id"], refresh)
    csrf = str(uuid.uuid4())
    _set_auth_cookies(response, token, csrf)

    # Auto-run audit if website provided during registration
    audit_result = None
    if body.website and validate_url(body.website):
        try:
            from services import run_audit as _run_audit
            audit_result = await _run_audit(url=body.website, user_id=user_doc["id"])
        except Exception as e:
            logger.warning("Auto-audit on registration failed: %s", e)

    # Seed demo project + sample audit so new users see a populated dashboard
    try:
        await _seed_demo_experience(user_doc["id"])
    except Exception as e:
        logger.warning("Demo seed failed: %s", e)

    return {"user": public_user(user_doc), "token": token, "refresh_token": refresh, "audit": audit_result}


@api.post("/auth/login", response_model=AuthOut)
@limiter.limit("5/minute")
async def login(request: Request, body: LoginIn, response: Response):
    email = body.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user["id"], email)
    refresh = create_refresh_token(user["id"])
    await store_refresh_token(db, user["id"], refresh)
    csrf = str(uuid.uuid4())
    _set_auth_cookies(response, token, csrf)
    return {"user": public_user(user), "token": token, "refresh_token": refresh}


@api.post("/auth/google", response_model=AuthOut)
@limiter.limit("10/minute")
async def google_auth(request: Request, body: GoogleAuthIn, response: Response):
    if not is_enabled("google_auth"):
        raise HTTPException(status_code=503, detail="Google Sign-In is temporarily unavailable")
    """Sign in with Google. Verifies the ID token and creates/returns a user."""
    try:
        import google.auth.transport.requests
        from google.oauth2 import id_token
        from google.auth.transport import requests as google_requests

        # Verify the Google ID token
        google_client_id = os.environ.get("GOOGLE_CLIENT_ID")
        if not google_client_id:
            raise HTTPException(status_code=501, detail="Google Sign-In is not configured")

        idinfo = id_token.verify_oauth2_token(
            body.credential,
            google_requests.Request(),
            google_client_id,
        )

        email = idinfo.get("email", "").lower().strip()
        name = idinfo.get("name", email.split("@")[0] if email else "User")
        google_id = idinfo.get("sub", "")

        if not email or not google_id:
            raise HTTPException(status_code=400, detail="Invalid Google credential")

        # Find or create user
        user = await db.users.find_one({"email": email})
        if not user:
            user_doc = {
                "id": str(uuid.uuid4()),
                "email": email,
                "password_hash": hash_password(str(uuid.uuid4())),  # Random password for Google users
                "name": sanitize_name(name),
                "role": "user",
                "plan": "free",
                "onboarded": False,
                "email_verified": True,  # Google accounts are pre-verified
                "google_id": google_id,
                "created_at": now_iso(),
            }
            await db.users.insert_one(user_doc)
            user = user_doc
        else:
            # Link Google ID if not already linked
            if not user.get("google_id"):
                await db.users.update_one(
                    {"id": user["id"]},
                    {"$set": {"google_id": google_id, "email_verified": True}},
                )
                user["google_id"] = google_id
                user["email_verified"] = True

        token = create_access_token(user["id"], email)
        csrf = str(uuid.uuid4())
        _set_auth_cookies(response, token, csrf)
        return {"user": public_user(user), "token": token}

    except ValueError:
        raise HTTPException(status_code=401, detail="Invalid Google credential")
    except HTTPException:
        raise
    except Exception:
        logger.exception("Google auth failed")
        raise HTTPException(status_code=502, detail="Google Sign-In failed. Please try again.")


@api.post("/auth/logout")
async def logout(response: Response, request: Request):
    """Clear auth cookies. Best-effort — works even without valid auth."""
    is_production = os.environ.get("ENVIRONMENT", "development") == "production"
    response.delete_cookie(
        "access_token",
        path="/",
        secure=is_production,
        samesite="none" if is_production else "lax",
    )
    response.delete_cookie(
        "csrf_token",
        path="/",
        secure=is_production,
        samesite="none" if is_production else "lax",
    )
    # Try to revoke refresh tokens if user is authenticated
    try:
        token = extract_token(request)
        if token:
            payload = decode_token(token)
            user_id = payload.get("sub")
            if user_id:
                await revoke_user_refresh_tokens(db, user_id)
    except Exception:
        pass
    return {"ok": True}


@api.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    """Exchange a refresh token for a new access token.

    The refresh token is sent in the request body (not a cookie).
    On success, a new access token cookie is set and the old refresh
    token is consumed (rotated).
    """
    body = await request.json()
    refresh = body.get("refresh_token", "")
    if not refresh:
        raise HTTPException(status_code=400, detail="refresh_token is required")

    user_id = await consume_refresh_token(db, refresh)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")

    # Issue new tokens
    access_token = create_access_token(user_id, user["email"])
    new_refresh = create_refresh_token(user_id)
    await store_refresh_token(db, user_id, new_refresh)

    csrf = str(uuid.uuid4())
    _set_auth_cookies(response, access_token, csrf)

    return {
        "user": public_user(user),
        "token": access_token,
        "refresh_token": new_refresh,
    }


@api.get("/auth/me")
async def me(user_id: str = Depends(get_current_user_id)):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return public_user(user)


class BrandVoiceIn(BaseModel):
    tone: str = Field(default="friendly and professional", max_length=200)
    target_audience: str = Field(default="local customers", max_length=200)
    business_name: str = Field(default="", max_length=200)
    industry: str = Field(default="", max_length=200)
    location: str = Field(default="", max_length=200)


@api.put("/auth/brand-voice")
async def save_brand_voice(body: BrandVoiceIn, user_id: str = Depends(get_current_user_id)):
    """Save brand voice preferences so AI content generation uses them automatically."""
    brand_voice = {
        "tone": body.tone,
        "target_audience": body.target_audience,
        "business_name": body.business_name,
        "industry": body.industry,
        "location": body.location,
        "updated_at": now_iso(),
    }
    await db.users.update_one({"id": user_id}, {"$set": {"brand_voice": brand_voice}})
    return {"ok": True, "brand_voice": brand_voice}


@api.get("/auth/verify/{token}")
async def verify_email(token: str):
    user = await db.users.find_one({"verification_token": token})
    if not user:
        raise HTTPException(status_code=404, detail="Invalid or expired verification token")
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"email_verified": True}, "$unset": {"verification_token": ""}},
    )
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url=f"{os.environ.get('FRONTEND_URL', 'http://localhost:3000')}/login?verified=1")


@api.post("/auth/resend-verification")
@limiter.limit("3/minute")
async def resend_verification(request: Request, bg: BackgroundTasks, user: dict = Depends(get_current_user_doc)):
    if user.get("email_verified"):
        return {"ok": True, "message": "Email already verified"}
    token = str(uuid.uuid4())
    await db.users.update_one({"id": user["id"]}, {"$set": {"verification_token": token}})
    verify_link = f"{_store_base_url(request)}/api/auth/verify/{token}"
    bg.add_task(
        _send_email_background,
        to=user["email"],
        subject="Verify your email — Goodly",
        html=email_service.verify_email_html(name=user.get("name", ""), verify_link=verify_link),
    )
    return {"ok": True}


@api.post("/auth/forgot-password")
@limiter.limit("3/minute")
async def forgot_password(body: ForgotPasswordIn, request: Request, bg: BackgroundTasks):
    email = body.email.lower().strip()
    user = await db.users.find_one({"email": email})
    # Always return success to prevent email enumeration
    if not user:
        return {"ok": True, "message": "If that email exists, we sent a reset link."}

    token = str(uuid.uuid4())
    expires = (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat()
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"reset_token": token, "reset_token_expires": expires}},
    )

    reset_link = f"{os.environ.get('FRONTEND_URL', 'http://localhost:3000')}/reset-password?token={token}"
    bg.add_task(
        _send_email_background,
        to=email,
        subject="Reset your password — Goodly",
        html=email_service.reset_password_html(name=user.get("name", ""), reset_link=reset_link),
    )

    return {"ok": True, "message": "If that email exists, we sent a reset link."}


@api.post("/auth/reset-password")
@limiter.limit("5/minute")
async def reset_password(request: Request, body: ResetPasswordIn):
    user = await db.users.find_one({"reset_token": body.token})
    if not user:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")

    expires = user.get("reset_token_expires")
    if expires and datetime.fromisoformat(expires) < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Reset token has expired")

    await db.users.update_one(
        {"id": user["id"]},
        {
            "$set": {"password_hash": hash_password(body.new_password)},
            "$unset": {"reset_token": "", "reset_token_expires": ""},
        },
    )
    return {"ok": True, "message": "Password reset successfully. You can now log in."}


# ---------------------------------------------------------------
# Projects (saved websites)
# ---------------------------------------------------------------
class ProjectIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    url: str
    description: Optional[str] = None
    target_keywords: Optional[str] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    target_keywords: Optional[str] = None


@api.post("/projects")
async def create_project(body: ProjectIn, user: dict = Depends(get_current_user_doc)):
    if not validate_url(body.url):
        raise HTTPException(status_code=400, detail="Invalid URL. Please provide a valid website URL (e.g., https://example.com).")
    plan = get_plan(user.get("plan"))
    current_count = await db.projects.count_documents({"user_id": user["id"]})
    if plan["project_limit"] is not None and current_count >= plan["project_limit"]:
        raise HTTPException(
            status_code=402,
            detail=f"Project limit reached on the {plan['name']} plan ({plan['project_limit']} projects). Upgrade to add more.",
        )
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "name": sanitize_name(body.name),
        "url": body.url,
        "description": sanitize_html(body.description or ""),
        "target_keywords": sanitize_html(body.target_keywords or ""),
        "schedule": "off",       # 'off' | 'monthly'
        "next_audit_at": None,
        "created_at": now_iso(),
        "last_audit_at": None,
        "last_score": None,
    }
    await db.projects.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.get("/projects")
async def list_projects(user_id: str = Depends(get_current_user_id)):
    cursor = db.projects.find({"user_id": user_id}, {"_id": 0}).sort("created_at", -1)
    return await cursor.to_list(500)


@api.get("/projects/{project_id}")
async def get_project(project_id: str, user_id: str = Depends(get_current_user_id)):
    doc = await db.projects.find_one({"id": project_id, "user_id": user_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Project not found")
    return doc


@api.patch("/projects/{project_id}")
async def update_project(project_id: str, body: ProjectUpdate, user_id: str = Depends(get_current_user_id)):
    update = {k: v for k, v in body.model_dump().items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="No fields to update")
    res = await db.projects.update_one({"id": project_id, "user_id": user_id}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    doc = await db.projects.find_one({"id": project_id, "user_id": user_id}, {"_id": 0})
    return doc


@api.delete("/projects/{project_id}")
async def delete_project(project_id: str, user_id: str = Depends(get_current_user_id)):
    res = await db.projects.delete_one({"id": project_id, "user_id": user_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    await db.audits.delete_many({"project_id": project_id, "user_id": user_id})
    return {"ok": True}


# ---------------------------------------------------------------
# Audits
# ---------------------------------------------------------------
class AuditIn(BaseModel):
    url: str
    project_id: Optional[str] = None


@api.post("/audits")
async def run_audit(body: AuditIn, user: dict = Depends(get_current_user_doc)):
    plan = get_plan(user.get("plan"))
    if plan["audit_limit"] is not None:
        used = await db.audits.count_documents({"user_id": user["id"], "month_key": month_key()})
        if used >= plan["audit_limit"]:
            raise HTTPException(
                status_code=402,
                detail=f"You've used your {plan['audit_limit']} audits this month on the {plan['name']} plan. Upgrade for unlimited audits.",
            )

    result = await analyze_url(body.url)

    # Generate AI recommendations only when fetch succeeded
    ai_recs = None
    if not result.get("fetch_failed"):
        try:
            ai_recs = await ai_service.audit_recommendations(result)
        except Exception as e:
            logger.warning("AI recs failed: %s", e)
            ai_recs = {"summary": "AI recommendations are temporarily unavailable.", "priority_actions": [], "wins": [], "next_30_days": []}

    # Calculate revenue impact if feature enabled
    revenue = None
    if is_enabled("revenue_impact") and not result.get("fetch_failed"):
        try:
            issues = result.get("issues") or []
            if issues:
                revenue = estimate_total_revenue_impact(
                    issues,
                    monthly_traffic=1000,
                    industry=None,
                )
        except Exception as e:
            logger.warning("Revenue impact calculation failed: %s", e)

    audit_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "project_id": body.project_id,
        "url": result.get("url", body.url),
        "created_at": now_iso(),
        "month_key": month_key(),
        "result": result,
        "ai_recommendations": ai_recs,
        "revenue_impact": revenue,
    }
    await db.audits.insert_one(audit_doc)

    if body.project_id:
        await db.projects.update_one(
            {"id": body.project_id, "user_id": user["id"]},
            {"$set": {"last_audit_at": audit_doc["created_at"], "last_score": result.get("overall_score")}},
        )

    audit_doc.pop("_id", None)
    return audit_doc


# Public audit — no auth required, no DB save, no AI recs (just the raw score)
class PublicAuditIn(BaseModel):
    url: str
    email: Optional[EmailStr] = None  # Optional email for nurture sequence


@api.post("/public/audit")
@limiter.limit("30/minute")
async def public_audit(request: Request, body: PublicAuditIn, response: Response, bg: BackgroundTasks):
    if not is_enabled("public_audit"):
        raise HTTPException(status_code=503, detail="Public audit is temporarily unavailable")
    """Run a free SEO audit without authentication. Returns score + top issues only."""
    if not validate_url(body.url):
        raise HTTPException(status_code=400, detail="Invalid URL. Please provide a valid website URL (e.g., https://example.com).")
    result = await analyze_url(body.url)
    # Calculate revenue impact for public audit
    revenue = None
    if not result.get("fetch_failed"):
        try:
            issues = result.get("issues") or []
            if issues:
                from revenue_impact import estimate_total_revenue_impact
                revenue = estimate_total_revenue_impact(issues, monthly_traffic=5000)
        except Exception as e:
            logger.warning("Public audit revenue impact failed: %s", e)

    # Generate lightweight AI summary for public audit (no auth, fast model)
    ai_summary = None
    schema_markup = None
    if not result.get("fetch_failed"):
        try:
            from ai_service import audit_recommendations
            ai_recs = await audit_recommendations(result)
            ai_summary = {
                "summary": ai_recs.get("summary", ""),
                "top_action": (ai_recs.get("priority_actions") or [{}])[0] if ai_recs.get("priority_actions") else None,
                "wins": ai_recs.get("wins", []),
            }
        except Exception as e:
            logger.warning("Public audit AI summary failed: %s", e)

        # Generate schema markup if missing
        try:
            metadata = result.get("metadata") or {}
            if not metadata.get("has_schema"):
                from ai_remediation import generate_fixes
                domain = body.url.split("//")[-1].split("/")[0].replace("www.", "")
                biz_name = metadata.get("title") or domain
                fixes = await generate_fixes(
                    business_name=biz_name,
                    website_url=body.url,
                    audit_issues=[{"message": "Missing schema markup (JSON-LD)", "category": "schema", "severity": "high"}],
                    industry="",
                    location="",
                )
                schema_markup = fixes.get("complete_schema_markup") or fixes.get("schema_markup")
        except Exception as e:
            logger.warning("Public audit schema generation failed: %s", e)

    # Track audit event
    try:
        from product_analytics import track_event
        await track_event(db, event="audit_run", properties={"url": body.url, "public": True, "score": result.get("overall_score")})
    except Exception:
        pass  # Analytics tracking is non-critical

    # Start nurture sequence if email provided
    if body.email and not result.get("fetch_failed"):
        try:
            from nurture_service import schedule_nurture_sequence
            issues = result.get("issues") or []
            # seo_analyzer issues carry "message", not "title"
            top_issue = (issues[0].get("message") or "SEO issues detected") if issues else "SEO issues detected"
            await schedule_nurture_sequence(
                email=body.email,
                score=result.get("overall_score", 0),
                issues_count=len(issues),
                top_issue=top_issue,
                issues=issues,
            )
        except Exception as e:
            logger.warning("Nurture sequence scheduling failed: %s", e)

    return {
        "url": result.get("url", body.url),
        "overall_score": result.get("overall_score"),
        "categories": result.get("categories"),
        "issues": result.get("issues", []),
        "revenue_impact": revenue,
        "ai_summary": ai_summary,
        "schema_markup": schema_markup,
        "fetch_failed": result.get("fetch_failed", False),
        "error": result.get("error"),
    }


@api.get("/audits")
async def list_audits(project_id: Optional[str] = None, user_id: str = Depends(get_current_user_id)):
    query = {"user_id": user_id}
    if project_id:
        query["project_id"] = project_id
    cursor = db.audits.find(query, {"_id": 0, "result.content.text_preview": 0}).sort("created_at", -1).limit(100)
    audits = await cursor.to_list(100)
    # Trim heavy fields in list view
    for a in audits:
        result = a.get("result") or {}
        a["summary"] = {
            "overall_score": result.get("overall_score"),
            "categories": result.get("categories"),
            "url": result.get("url"),
            "issue_count": len(result.get("issues") or []),
        }
        a.pop("result", None)
        a.pop("ai_recommendations", None)
    return audits


@api.get("/audits/{audit_id}")
async def get_audit(audit_id: str, user_id: str = Depends(get_current_user_id)):
    doc = await db.audits.find_one({"id": audit_id, "user_id": user_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Audit not found")
    return doc


@api.post("/audits/{audit_id}/share")
async def share_audit(audit_id: str, user_id: str = Depends(get_current_user_id)):
    """Generate a shareable public link for an audit."""
    doc = await db.audits.find_one({"id": audit_id, "user_id": user_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Audit not found")

    share_token = doc.get("share_token")
    if not share_token:
        share_token = str(uuid.uuid4())
        await db.audits.update_one({"id": audit_id}, {"$set": {"share_token": share_token}})

    frontend_url = os.environ.get("FRONTEND_URL", "http://localhost:3000")
    return {"share_url": f"{frontend_url}/shared/{share_token}", "share_token": share_token}


@api.get("/shared/{share_token}")
async def get_shared_audit(share_token: str):
    """View a shared audit — no auth required."""
    doc = await db.audits.find_one({"share_token": share_token}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Shared audit not found or link expired")
    # Return a sanitized version (no user_id, no internal fields)
    return {
        "url": (doc.get("result") or {}).get("url") or doc.get("url"),
        "overall_score": (doc.get("result") or {}).get("overall_score") or doc.get("overall_score"),
        "categories": (doc.get("result") or {}).get("categories"),
        "issues": (doc.get("result") or {}).get("issues", []),
        "ai_recommendations": doc.get("ai_recommendations"),
        "revenue_impact": doc.get("revenue_impact"),
        "created_at": doc.get("created_at"),
    }


@api.delete("/audits/{audit_id}")
async def delete_audit(audit_id: str, user_id: str = Depends(get_current_user_id)):
    res = await db.audits.delete_one({"id": audit_id, "user_id": user_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Audit not found")
    return {"ok": True}


@api.get("/audits/{audit_id}/improvement")
async def get_audit_improvement(audit_id: str, user_id: str = Depends(get_current_user_id)):
    """Compare this audit with the previous one for the same URL to show improvement."""
    current = await db.audits.find_one({"id": audit_id, "user_id": user_id}, {"_id": 0})
    if not current:
        raise HTTPException(status_code=404, detail="Audit not found")

    url = (current.get("result") or {}).get("url") or current.get("url")
    current_score = (current.get("result") or {}).get("overall_score") or current.get("overall_score", 0)

    # Find the previous audit for the same URL
    previous = await db.audits.find_one(
        {"user_id": user_id, "id": {"$ne": audit_id}, "$or": [
            {"result.url": url},
            {"url": url},
        ]},
        {"_id": 0},
        sort=[("created_at", -1)],
    )

    if not previous:
        return {
            "has_previous": False,
            "current_score": current_score,
            "message": "This is your first audit for this URL. Run another audit after making fixes to see your improvement.",
        }

    prev_score = (previous.get("result") or {}).get("overall_score") or previous.get("overall_score", 0)
    score_delta = current_score - prev_score

    # Count issues fixed
    current_issues = (current.get("result") or {}).get("issues") or []
    prev_issues = (previous.get("result") or {}).get("issues") or []

    current_critical = sum(1 for i in current_issues if i.get("severity") == "high")
    prev_critical = sum(1 for i in prev_issues if i.get("severity") == "high")
    critical_fixed = max(0, prev_critical - current_critical)

    current_total = len(current_issues)
    prev_total = len(prev_issues)
    issues_fixed = max(0, prev_total - current_total)

    # Estimated traffic impact
    traffic_change_pct = int(score_delta * 1.5) if score_delta > 0 else 0

    # Generate AI-optimized meta tags for before/after comparison
    optimized_meta = None
    try:
        current_meta = (current.get("result") or {}).get("metadata") or {}
        if current_meta.get("title") or current_meta.get("description"):
            from ai_service import generate_meta_tags
            biz_name = (current.get("result") or {}).get("url") or url
            desc = current_meta.get("description") or current_meta.get("title") or ""
            optimized = await generate_meta_tags(
                business_name=biz_name.split("//")[-1].split("/")[0].replace("www.", ""),
                description=desc,
                target_keywords="",
            )
            optimized_meta = {
                "title": optimized.get("title_options", [optimized.get("title", "")])[0] if optimized.get("title_options") else optimized.get("title", ""),
                "description": optimized.get("description_options", [optimized.get("description", "")])[0] if optimized.get("description_options") else optimized.get("description", ""),
            }
    except Exception:
        logger.warning("Failed to generate optimized meta tags for comparison", exc_info=True)

    return {
        "has_previous": True,
        "current_score": current_score,
        "previous_score": prev_score,
        "score_delta": score_delta,
        "improved": score_delta > 0,
        "critical_issues_fixed": critical_fixed,
        "total_issues_fixed": issues_fixed,
        "previous_issue_count": prev_total,
        "current_issue_count": current_total,
        "estimated_traffic_increase_pct": traffic_change_pct,
        "current_meta": (current.get("result") or {}).get("metadata"),
        "optimized_meta": optimized_meta,
        "message": (
            f"Your score went from {prev_score} → {current_score} (+{score_delta} points). "
            f"You fixed {issues_fixed} issues including {critical_fixed} critical ones. "
            f"Estimated traffic increase: +{traffic_change_pct}%."
        ) if score_delta > 0 else (
            f"Your score stayed at {current_score}. Keep working on those issues!"
        ) if score_delta == 0 else (
            f"Your score dropped from {prev_score} → {current_score} ({score_delta} points). "
            f"New issues may have been introduced. Check your latest audit."
        ),
    }


# ---------------------------------------------------------------
# AI tools
# ---------------------------------------------------------------
class MetaTagsIn(BaseModel):
    business_name: str
    description: str
    target_keywords: Optional[str] = ""


class KeywordsIn(BaseModel):
    seed_topic: str
    industry: Optional[str] = ""
    location: Optional[str] = ""


class CompetitorsIn(BaseModel):
    your_site: str
    competitors: List[str]
    industry: Optional[str] = ""


@api.post("/ai/meta-tags")
@limiter.limit("10/minute")
async def ai_meta_tags(request: Request, body: MetaTagsIn, user_id: str = Depends(get_current_user_id)):
    try:
        result = await ai_service.generate_meta_tags(body.business_name, body.description, body.target_keywords or "")
        await db.ai_history.insert_one({
            "id": str(uuid.uuid4()), "user_id": user_id, "kind": "meta_tags",
            "input": body.model_dump(), "result": result, "created_at": now_iso(),
        })
        return result
    except Exception:
        logger.exception("meta tags failed")
        raise HTTPException(status_code=502, detail="AI service is temporarily unavailable. Please try again.")


@api.post("/ai/keywords")
@limiter.limit("10/minute")
async def ai_keywords(request: Request, body: KeywordsIn, user_id: str = Depends(get_current_user_id)):
    try:
        result = await ai_service.keyword_research(body.seed_topic, body.industry or "", body.location or "")
        await db.ai_history.insert_one({
            "id": str(uuid.uuid4()), "user_id": user_id, "kind": "keywords",
            "input": body.model_dump(), "result": result, "created_at": now_iso(),
        })
        return result
    except Exception:
        logger.exception("keywords failed")
        raise HTTPException(status_code=502, detail="AI service is temporarily unavailable. Please try again.")


@api.post("/ai/competitors")
@limiter.limit("10/minute")

async def ai_competitors(request: Request, body: CompetitorsIn, user_id: str = Depends(get_current_user_id)):
    try:
        result = await ai_service.competitor_analysis(body.your_site, body.competitors, body.industry or "")
        await db.ai_history.insert_one({
            "id": str(uuid.uuid4()), "user_id": user_id, "kind": "competitors",
            "input": body.model_dump(), "result": result, "created_at": now_iso(),
        })
        return result
    except Exception:
        logger.exception("competitors failed")
        raise HTTPException(status_code=502, detail="AI service is temporarily unavailable. Please try again.")


class CompareCompetitorsIn(BaseModel):
    target_url: str
    competitor_urls: list = Field(default_factory=list, max_length=5)


@api.post("/competitors/compare")
@limiter.limit("10/minute")
async def compare_competitors_endpoint(request: Request, body: CompareCompetitorsIn, user_id: str = Depends(get_current_user_id)):
    if not is_enabled("competitor_comparison"):
        raise HTTPException(status_code=503, detail="Competitor comparison is temporarily unavailable")
    """Compare your site against competitors on key SEO metrics. Returns head-to-head comparison with insights and recommendations."""
    if not body.competitor_urls:
        raise HTTPException(status_code=400, detail="At least one competitor URL is required")
    if not validate_url(body.target_url):
        raise HTTPException(status_code=400, detail="Invalid target URL")
    for url in body.competitor_urls:
        if not validate_url(url):
            raise HTTPException(status_code=400, detail=f"Invalid competitor URL: {url}")

    try:
        result = await competitor_analysis.compare_competitors(body.target_url, body.competitor_urls)
        return result
    except Exception:
        logger.exception("competitor comparison failed")
        raise HTTPException(status_code=502, detail="Competitor comparison is temporarily unavailable. Please try again.")


# ---------------------------------------------------------------
# AI Content Generation — done-for-you content for small businesses
# ---------------------------------------------------------------

class BlogPostIn(BaseModel):
    business_name: str = Field(min_length=1, max_length=200)
    topic: str = Field(min_length=1, max_length=500)
    keywords: str = ""
    tone: str = "friendly and helpful"
    target_audience: str = "small business customers"


class ReviewResponseIn(BaseModel):
    business_name: str = Field(min_length=1, max_length=200)
    reviewer_name: str = Field(min_length=1, max_length=200)
    rating: int = Field(ge=1, le=5)
    review_text: str = Field(min_length=1, max_length=2000)
    tone: str = "professional and warm"


class FAQIn(BaseModel):
    business_name: str = Field(min_length=1, max_length=200)
    category: str = Field(min_length=1, max_length=200)
    location: str = ""
    services: str = ""


class WebsiteCopyIn(BaseModel):
    business_name: str = Field(min_length=1, max_length=200)
    description: str = Field(min_length=1, max_length=1000)
    page_type: str = Field(default="homepage", pattern="^(homepage|about|services|contact|landing)$")
    keywords: str = ""
    location: str = ""
    tone: str = "warm and professional"


@api.post("/ai/blog-post")
@limiter.limit("5/minute")
async def ai_blog_post(request: Request, body: BlogPostIn, user_id: str = Depends(get_current_user_id)):
    """Generate a complete, SEO-optimized blog post ready to publish."""
    try:
        result = await ai_content.generate_blog_post(
            business_name=body.business_name,
            topic=body.topic,
            keywords=body.keywords,
            tone=body.tone,
            target_audience=body.target_audience,
        )
        await db.ai_history.insert_one({
            "id": str(uuid.uuid4()), "user_id": user_id, "kind": "blog_post",
            "input": body.model_dump(), "created_at": now_iso(),
        })
        return result
    except Exception:
        logger.exception("blog post generation failed")
        raise HTTPException(status_code=502, detail="AI content generation is temporarily unavailable. Please try again.")


@api.post("/ai/review-response")
@limiter.limit("10/minute")
async def ai_review_response(request: Request, body: ReviewResponseIn, user_id: str = Depends(get_current_user_id)):
    """Generate a professional response to a customer review."""
    try:
        result = await ai_content.generate_review_response(
            business_name=body.business_name,
            reviewer_name=body.reviewer_name,
            rating=body.rating,
            review_text=body.review_text,
            tone=body.tone,
        )
        await db.ai_history.insert_one({
            "id": str(uuid.uuid4()), "user_id": user_id, "kind": "review_response",
            "input": body.model_dump(), "created_at": now_iso(),
        })
        return result
    except Exception:
        logger.exception("review response generation failed")
        raise HTTPException(status_code=502, detail="AI content generation is temporarily unavailable. Please try again.")


@api.post("/ai/faq")
@limiter.limit("5/minute")
async def ai_faq(request: Request, body: FAQIn, user_id: str = Depends(get_current_user_id)):
    """Generate FAQ content with JSON-LD schema markup for rich results."""
    try:
        result = await ai_content.generate_faq(
            business_name=body.business_name,
            category=body.category,
            location=body.location,
            services=body.services,
        )
        await db.ai_history.insert_one({
            "id": str(uuid.uuid4()), "user_id": user_id, "kind": "faq",
            "input": body.model_dump(), "created_at": now_iso(),
        })
        return result
    except Exception:
        logger.exception("faq generation failed")
        raise HTTPException(status_code=502, detail="AI content generation is temporarily unavailable. Please try again.")


@api.post("/ai/website-copy")
@limiter.limit("5/minute")
async def ai_website_copy(request: Request, body: WebsiteCopyIn, user_id: str = Depends(get_current_user_id)):
    """Generate website copy for homepage, about, services, contact, or landing pages."""
    try:
        result = await ai_content.generate_website_copy(
            business_name=body.business_name,
            description=body.description,
            page_type=body.page_type,
            keywords=body.keywords,
            location=body.location,
            tone=body.tone,
        )
        await db.ai_history.insert_one({
            "id": str(uuid.uuid4()), "user_id": user_id, "kind": "website_copy",
            "input": body.model_dump(), "created_at": now_iso(),
        })
        return result
    except Exception:
        logger.exception("website copy generation failed")
        raise HTTPException(status_code=502, detail="AI content generation is temporarily unavailable. Please try again.")


class EmailIn(BaseModel):
    business_name: str = Field(min_length=1, max_length=200)
    email_type: str = Field(default="promo", pattern="^(welcome|promo|follow_up|newsletter|abandoned_cart)$")
    topic: str = ""
    tone: str = "warm and professional"
    target_audience: str = "customers"


class SocialCaptionsIn(BaseModel):
    business_name: str = Field(min_length=1, max_length=200)
    platform: str = Field(default="instagram", pattern="^(instagram|facebook|linkedin|tiktok)$")
    topic: str = Field(min_length=1, max_length=500)
    tone: str = "friendly and engaging"
    goal: str = "engagement"


@api.post("/ai/email")
@limiter.limit("5/minute")
async def ai_email(request: Request, body: EmailIn, user_id: str = Depends(get_current_user_id)):
    """Generate marketing email copy — welcome, promo, follow-up, newsletter, or abandoned cart."""
    try:
        result = await ai_content.generate_email(
            business_name=body.business_name,
            email_type=body.email_type,
            topic=body.topic,
            tone=body.tone,
            target_audience=body.target_audience,
        )
        await db.ai_history.insert_one({
            "id": str(uuid.uuid4()), "user_id": user_id, "kind": "email",
            "input": body.model_dump(), "created_at": now_iso(),
        })
        return result
    except Exception:
        logger.exception("email generation failed")
        raise HTTPException(status_code=502, detail="AI content generation is temporarily unavailable. Please try again.")


@api.post("/ai/social-captions")
@limiter.limit("10/minute")
async def ai_social_captions(request: Request, body: SocialCaptionsIn, user_id: str = Depends(get_current_user_id)):
    """Generate social media captions with hashtags for Instagram, Facebook, LinkedIn, or TikTok."""
    try:
        result = await ai_content.generate_social_captions(
            business_name=body.business_name,
            platform=body.platform,
            topic=body.topic,
            tone=body.tone,
            goal=body.goal,
        )
        await db.ai_history.insert_one({
            "id": str(uuid.uuid4()), "user_id": user_id, "kind": "social_captions",
            "input": body.model_dump(), "created_at": now_iso(),
        })
        return result
    except Exception:
        logger.exception("social captions generation failed")
        raise HTTPException(status_code=502, detail="AI content generation is temporarily unavailable. Please try again.")


# ---------------------------------------------------------------
# AI Remediation — Fix My Website (audit → ready-to-paste fixes)
# ---------------------------------------------------------------

class FixMySiteIn(BaseModel):
    business_name: str = Field(min_length=1, max_length=200)
    website_url: str = Field(min_length=1, max_length=500)
    audit_issues: list = Field(default_factory=list, max_length=50)
    current_meta: dict | None = None
    industry: str = ""
    location: str = ""


class SingleFixIn(BaseModel):
    business_name: str = Field(min_length=1, max_length=200)
    website_url: str = Field(min_length=1, max_length=500)
    issue_title: str = Field(min_length=1, max_length=500)
    issue_description: str = Field(min_length=1, max_length=2000)
    issue_category: str = "general"
    current_value: str = ""


class ContentGraderIn(BaseModel):
    business_name: str = Field(min_length=1, max_length=200)
    page_url: str = Field(min_length=1, max_length=500)
    page_content: str = Field(min_length=1, max_length=10000)
    target_keywords: str = ""


@api.post("/ai/fix-my-site")
@limiter.limit("5/minute")
async def ai_fix_my_site(request: Request, body: FixMySiteIn, user_id: str = Depends(get_current_user_id)):
    """Generate ready-to-paste fixes for every issue found in an audit."""
    try:
        result = await ai_remediation.generate_fixes(
            business_name=body.business_name,
            website_url=body.website_url,
            audit_issues=body.audit_issues,
            current_meta=body.current_meta,
            industry=body.industry,
            location=body.location,
        )
        await db.ai_history.insert_one({
            "id": str(uuid.uuid4()), "user_id": user_id, "kind": "fix_my_site",
            "input": body.model_dump(), "created_at": now_iso(),
        })
        return result
    except Exception:
        logger.exception("fix my site failed")
        raise HTTPException(status_code=502, detail="AI remediation is temporarily unavailable. Please try again.")


@api.post("/ai/fix-single")
@limiter.limit("10/minute")
async def ai_fix_single(request: Request, body: SingleFixIn, user_id: str = Depends(get_current_user_id)):
    """Generate a fix for a single specific issue."""
    try:
        result = await ai_remediation.generate_single_fix(
            business_name=body.business_name,
            website_url=body.website_url,
            issue_title=body.issue_title,
            issue_description=body.issue_description,
            issue_category=body.issue_category,
            current_value=body.current_value,
        )
        await db.ai_history.insert_one({
            "id": str(uuid.uuid4()), "user_id": user_id, "kind": "fix_single",
            "input": body.model_dump(), "created_at": now_iso(),
        })
        return result
    except Exception:
        logger.exception("fix single failed")
        raise HTTPException(status_code=502, detail="AI remediation is temporarily unavailable. Please try again.")


@api.post("/ai/content-grader")
@limiter.limit("5/minute")
async def ai_content_grader(request: Request, body: ContentGraderIn, user_id: str = Depends(get_current_user_id)):
    """Grade existing content and provide line-by-line improvement suggestions."""
    try:
        result = await ai_remediation.generate_content_grader(
            business_name=body.business_name,
            page_url=body.page_url,
            page_content=body.page_content,
            target_keywords=body.target_keywords,
        )
        await db.ai_history.insert_one({
            "id": str(uuid.uuid4()), "user_id": user_id, "kind": "content_grader",
            "input": body.model_dump(), "created_at": now_iso(),
        })
        return result
    except Exception:
        logger.exception("content grader failed")
        raise HTTPException(status_code=502, detail="AI content grading is temporarily unavailable. Please try again.")


class PublicContentGradeIn(BaseModel):
    url: str = Field(min_length=1, max_length=500)


@api.post("/ai/content-grade")
@limiter.limit("10/minute")
async def public_content_grade(request: Request, body: PublicContentGradeIn):
    """Public content grader — fetches a URL, extracts text, and grades it with AI.
    No auth required. Lead-generation magnet."""
    import httpx
    from bs4 import BeautifulSoup

    url = body.url.strip()
    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    # Fetch the page
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            resp = await client.get(
                url,
                headers={"User-Agent": "GoodlyBot/1.0 (SEO audit; hello@searchgoodly.com)"},
            )
            resp.raise_for_status()
            html = resp.text
    except httpx.HTTPError as e:
        raise HTTPException(status_code=422, detail=f"Could not fetch that URL: {e}")
    except Exception:
        raise HTTPException(status_code=422, detail="Could not reach that website. Check the URL and try again.")

    # Extract text content
    soup = BeautifulSoup(html, "html.parser")
    for tag in soup(["script", "style", "nav", "footer", "header", "noscript"]):
        tag.decompose()
    text = soup.get_text(separator="\n", strip=True)
    # Truncate to ~3000 chars for the AI
    text = text[:3000]

    if len(text) < 50:
        raise HTTPException(status_code=422, detail="Could not extract enough text from that page. It may be mostly images or JavaScript.")

    # Extract domain for business name
    from urllib.parse import urlparse
    domain = urlparse(url).netloc.replace("www.", "")

    try:
        result = await ai_remediation.generate_content_grader(
            business_name=domain,
            page_url=url,
            page_content=text,
            target_keywords="",
        )
        return result
    except Exception:
        logger.exception("public content grader failed")
        raise HTTPException(status_code=502, detail="AI content grading is temporarily unavailable. Please try again.")


# ---------------------------------------------------------------
# AI Content Strategy — plans, repurposing, image prompts
# ---------------------------------------------------------------

class ContentStrategyIn(BaseModel):
    business_name: str = Field(min_length=1, max_length=200)
    industry: str = Field(min_length=1, max_length=200)
    location: str = ""
    target_audience: str = "local customers"
    goals: str = "more customers and better Google ranking"
    competitors: str = ""
    existing_content: str = ""


class RepurposeIn(BaseModel):
    business_name: str = Field(min_length=1, max_length=200)
    source_content: str = Field(min_length=1, max_length=5000)
    source_type: str = Field(default="blog_post", pattern="^(blog_post|video_script|podcast_transcript|customer_review|case_study)$")
    target_platforms: list[str] | None = None
    tone: str = "friendly and professional"


class ImagePromptsIn(BaseModel):
    business_name: str = Field(min_length=1, max_length=200)
    content_type: str = Field(default="blog_header", pattern="^(blog_header|social_post|email_hero|product|team|storefront|abstract)$")
    content_description: str = Field(min_length=1, max_length=1000)
    brand_colors: str = ""
    style: str = "professional and warm"
    platform: str = "website"
    count: int = Field(default=3, ge=1, le=5)


@api.post("/ai/content-strategy")
@limiter.limit("3/minute")
async def ai_content_strategy(request: Request, body: ContentStrategyIn, user_id: str = Depends(get_current_user_id)):
    """Generate a 90-day content strategy with topic clusters, calendar, and publishing schedule."""
    try:
        result = await ai_strategy.generate_content_strategy(
            business_name=body.business_name,
            industry=body.industry,
            location=body.location,
            target_audience=body.target_audience,
            goals=body.goals,
            competitors=body.competitors,
            existing_content=body.existing_content,
        )
        await db.ai_history.insert_one({
            "id": str(uuid.uuid4()), "user_id": user_id, "kind": "content_strategy",
            "input": body.model_dump(), "created_at": now_iso(),
        })
        return result
    except Exception:
        logger.exception("content strategy failed")
        raise HTTPException(status_code=502, detail="AI content strategy is temporarily unavailable. Please try again.")


@api.post("/ai/repurpose")
@limiter.limit("5/minute")
async def ai_repurpose(request: Request, body: RepurposeIn, user_id: str = Depends(get_current_user_id)):
    """Repurpose one piece of content into multiple platform-specific versions."""
    try:
        result = await ai_strategy.repurpose_content(
            business_name=body.business_name,
            source_content=body.source_content,
            source_type=body.source_type,
            target_platforms=body.target_platforms,
            tone=body.tone,
        )
        await db.ai_history.insert_one({
            "id": str(uuid.uuid4()), "user_id": user_id, "kind": "repurpose",
            "input": body.model_dump(), "created_at": now_iso(),
        })
        return result
    except Exception:
        logger.exception("repurpose failed")
        raise HTTPException(status_code=502, detail="AI content repurposing is temporarily unavailable. Please try again.")


@api.post("/ai/image-prompts")
@limiter.limit("10/minute")
async def ai_image_prompts(request: Request, body: ImagePromptsIn, user_id: str = Depends(get_current_user_id)):
    """Generate ready-to-use image prompts for Midjourney, DALL-E, and Canva AI."""
    try:
        result = await ai_strategy.generate_image_prompts(
            business_name=body.business_name,
            content_type=body.content_type,
            content_description=body.content_description,
            brand_colors=body.brand_colors,
            style=body.style,
            platform=body.platform,
            count=body.count,
        )
        await db.ai_history.insert_one({
            "id": str(uuid.uuid4()), "user_id": user_id, "kind": "image_prompts",
            "input": body.model_dump(), "created_at": now_iso(),
        })
        return result
    except Exception:
        logger.exception("image prompts failed")
        raise HTTPException(status_code=502, detail="AI image prompt generation is temporarily unavailable. Please try again.")


@api.get("/ai/industry-pack")
async def ai_industry_pack(industry: str = "restaurant"):
    """Get pre-built content templates for a specific industry. No auth required."""
    return await ai_strategy.get_industry_pack(industry)


# ---------------------------------------------------------------
# Health check
# ---------------------------------------------------------------
_startup_time = datetime.now(timezone.utc)
from version import VERSION

__version__ = VERSION


@api.get("/")
async def root():
    return {"service": "Goodly API", "status": "ok", "version": __version__}


@api.get("/health")
async def health():
    uptime_seconds = (datetime.now(timezone.utc) - _startup_time).total_seconds()
    health_status = {
        "status": "ok",
        "service": "Goodly API",
        "version": __version__,
        "uptime_seconds": int(uptime_seconds),
    }
    try:
        await db.command("ping")
        health_status["database"] = "connected"
    except Exception as e:
        health_status["database"] = f"disconnected: {str(e)[:100]}"
        health_status["status"] = "degraded"
    health_status["ai_service"] = "configured" if os.environ.get("GEMINI_API_KEY") else "missing"
    health_status["stripe"] = "configured" if os.environ.get("STRIPE_API_KEY") else "missing"
    health_status["email"] = "configured" if os.environ.get("RESEND_API_KEY") else "missing"
    health_status["scheduler"] = "enabled" if os.environ.get("SCHEDULER_ENABLED", "true").lower() in ("1", "true", "yes") else "disabled"
    return health_status


# ---------------------------------------------------------------
# Dashboard summary
# ---------------------------------------------------------------
@api.get("/dashboard/summary")
async def dashboard_summary(user_id: str = Depends(get_current_user_id)):
    projects_count = await db.projects.count_documents({"user_id": user_id})
    audits_count = await db.audits.count_documents({"user_id": user_id})
    projects = await db.projects.find({"user_id": user_id}, {"_id": 0, "last_score": 1}).to_list(500)
    scored = [p["last_score"] for p in projects if p.get("last_score") is not None]
    avg_score = int(sum(scored) / len(scored)) if scored else None
    recent_audits_cursor = db.audits.find(
        {"user_id": user_id}, {"_id": 0, "id": 1, "url": 1, "created_at": 1, "result.overall_score": 1}
    ).sort("created_at", -1).limit(5)
    recent_audits = await recent_audits_cursor.to_list(5)
    for a in recent_audits:
        a["overall_score"] = (a.pop("result", {}) or {}).get("overall_score")

    # Score history for trend chart (last 12 audits)
    score_history = []
    try:
        history_cursor = db.audits.find(
            {"user_id": user_id},
            {"_id": 0, "created_at": 1, "result.overall_score": 1},
        ).sort("created_at", 1).limit(50)
        history_audits = await history_cursor.to_list(50)
        for a in history_audits:
            score = (a.get("result") or {}).get("overall_score")
            if score is not None:
                score_history.append({
                    "date": a["created_at"][:10],
                    "score": score,
                })
    except Exception:
        pass  # Analytics tracking is non-critical

    return {
        "projects_count": projects_count,
        "audits_count": audits_count,
        "average_score": avg_score,
        "recent_audits": recent_audits,
        "score_history": score_history,
    }


@api.get("/dashboard/achievements")
async def get_achievements(user_id: str = Depends(get_current_user_id)):
    """Get user's earned achievements and all available achievements."""
    user = await db.users.find_one({"id": user_id})
    earned_ids = user.get("achievements") or [] if user else []
    all_achievements = achievements.get_all_achievements()

    earned = [a for a in all_achievements if a["id"] in earned_ids]
    locked = [a for a in all_achievements if a["id"] not in earned_ids]

    return {
        "earned": earned,
        "locked": locked,
        "total_earned": len(earned),
        "total_available": len(all_achievements),
    }


@api.post("/dashboard/check-achievements")
async def check_new_achievements(user_id: str = Depends(get_current_user_id)):
    if not is_enabled("achievements"):
        return {"new_achievements": [], "count": 0}
    """Check for newly earned achievements (called after audits, SERP checks, etc.)."""
    new_achievements = await achievements.check_achievements(db, user_id)
    return {
        "new_achievements": new_achievements,
        "count": len(new_achievements),
    }


@api.get("/notifications")
async def get_notifications(user_id: str = Depends(get_current_user_id)):
    """Get user notifications (rank changes, achievements, alerts)."""
    cursor = db.notifications.find(
        {"user_id": user_id},
        {"_id": 0},
        sort=[("created_at", -1)],
    ).limit(50)
    notifications = await cursor.to_list(50)

    unread = sum(1 for n in notifications if not n.get("read", False))

    return {
        "notifications": notifications,
        "unread": unread,
    }


@api.post("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, user_id: str = Depends(get_current_user_id)):
    """Mark a notification as read."""
    await db.notifications.update_one(
        {"id": notification_id, "user_id": user_id},
        {"$set": {"read": True}},
    )
    return {"ok": True}


@api.post("/notifications/read-all")
async def mark_all_notifications_read(user_id: str = Depends(get_current_user_id)):
    """Mark all notifications as read."""
    await db.notifications.update_many(
        {"user_id": user_id, "read": False},
        {"$set": {"read": True}},
    )
    return {"ok": True}


# ---------------------------------------------------------------
# Billing / Plans (Stripe)
# ---------------------------------------------------------------
class CheckoutIn(BaseModel):
    plan_id: str
    origin_url: str


@api.get("/billing/plans")
async def get_plans():
    return list(PLANS.values())


@api.get("/billing/me")
async def billing_me(user: dict = Depends(get_current_user_doc)):
    plan = get_plan(user.get("plan"))
    usage = await usage_for(user["id"])
    txs = await db.payment_transactions.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).sort("created_at", -1).limit(10).to_list(10)
    return {"plan": plan, "usage": usage, "transactions": txs}


@api.post("/billing/checkout")
@limiter.limit("5/minute")
async def billing_checkout(body: CheckoutIn, request: Request, user: dict = Depends(get_current_user_doc)):
    if body.plan_id not in PLANS or body.plan_id == "free":
        raise HTTPException(status_code=400, detail="Invalid plan")
    host = str(request.base_url)
    try:
        session, plan = await create_subscription_checkout(
            host_url=host,
            plan_id=body.plan_id,
            user_id=user["id"],
            user_email=user["email"],
            origin_url=body.origin_url,
        )
    except Exception:
        logger.exception("Stripe checkout creation failed")
        raise HTTPException(status_code=502, detail="Could not create checkout session. Please try again.")

    tx = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "user_email": user["email"],
        "session_id": session.session_id,
        "plan_id": body.plan_id,
        "amount": plan["price_usd"],
        "currency": "usd",
        "payment_status": "initiated",
        "status": "open",
        "applied": False,
        "metadata": {"plan_id": body.plan_id, "kind": "subscription_upgrade"},
        "created_at": now_iso(),
    }
    await db.payment_transactions.insert_one(tx)
    return {"session_id": session.session_id, "url": session.url}


@api.get("/billing/status/{session_id}")
async def billing_status(session_id: str, request: Request, user: dict = Depends(get_current_user_doc)):
    tx = await db.payment_transactions.find_one({"session_id": session_id, "user_id": user["id"]}, {"_id": 0})
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    try:
        stripe_sdk.api_key = os.environ.get("STRIPE_API_KEY")
        session_obj = await asyncio.to_thread(
            stripe_sdk.checkout.Session.retrieve, session_id
        )
        class _Status:
            def __init__(self, s):
                self.status = s.get("status", "unknown") if isinstance(s, dict) else getattr(s, "status", "unknown")
                self.payment_status = s.get("payment_status", "unknown") if isinstance(s, dict) else getattr(s, "payment_status", "unknown")
                self.amount_total = s.get("amount_total") if isinstance(s, dict) else getattr(s, "amount_total", None)
                self.currency = s.get("currency") if isinstance(s, dict) else getattr(s, "currency", None)
        status = _Status(session_obj)
    except Exception:
        logger.exception("Stripe status fetch failed")
        raise HTTPException(status_code=502, detail="Could not check payment status. Please try again.")

    update = {
        "status": status.status,
        "payment_status": status.payment_status,
        "updated_at": now_iso(),
    }
    await db.payment_transactions.update_one({"session_id": session_id}, {"$set": update})

    if status.payment_status == "paid" and not tx.get("applied"):
        customer_id = None
        try:
            stripe_sdk.api_key = os.environ.get("STRIPE_API_KEY")
            session_obj2 = await asyncio.to_thread(
                stripe_sdk.checkout.Session.retrieve, session_id
            )
            customer_id = session_obj2.get("customer") if isinstance(session_obj2, dict) else getattr(session_obj2, "customer", None)
        except Exception as e:
            logger.warning("Could not retrieve Stripe customer_id for %s: %s", session_id, e)

        user_update = {"plan": tx["plan_id"], "plan_started_at": now_iso()}
        if customer_id:
            user_update["stripe_customer_id"] = customer_id
        await db.users.update_one({"id": user["id"]}, {"$set": user_update})
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": {"applied": True, "stripe_customer_id": customer_id}},
        )

    return {
        "session_id": session_id,
        "status": status.status,
        "payment_status": status.payment_status,
        "amount_total": status.amount_total,
        "currency": status.currency,
        "plan_id": tx["plan_id"],
        "applied": status.payment_status == "paid",
    }


class PortalIn(BaseModel):
    return_url: str


@api.post("/billing/portal")
async def billing_portal(body: PortalIn, user: dict = Depends(get_current_user_doc)):
    customer_id = user.get("stripe_customer_id")
    if not customer_id:
        tx = await db.payment_transactions.find_one(
            {"user_id": user["id"], "applied": True, "stripe_customer_id": {"$ne": None}},
            sort=[("created_at", -1)],
        )
        if tx:
            customer_id = tx.get("stripe_customer_id")
            await db.users.update_one({"id": user["id"]}, {"$set": {"stripe_customer_id": customer_id}})

    if not customer_id:
        raise HTTPException(
            status_code=400,
            detail="No active Stripe customer found. Upgrade once to enable the billing portal.",
        )

    try:
        stripe_sdk.api_key = os.environ.get("STRIPE_API_KEY")
        portal = await asyncio.to_thread(
            stripe_sdk.billing_portal.Session.create,
            customer=customer_id,
            return_url=body.return_url,
        )
        return {"url": portal.url}
    except Exception:
        logger.exception("Stripe portal session failed")
        raise HTTPException(status_code=502, detail="Could not open the billing portal. Please try again.")


@app.post("/api/webhook/stripe")
async def stripe_webhook(request: Request):
    body = await request.body()
    sig = request.headers.get("Stripe-Signature")
    webhook_secret = os.environ.get("STRIPE_WEBHOOK_SECRET", "")
    if not webhook_secret:
        logger.error("STRIPE_WEBHOOK_SECRET not configured — rejecting webhook")
        raise HTTPException(status_code=400, detail="Webhook secret not configured")
    try:
        stripe_sdk.api_key = os.environ.get("STRIPE_API_KEY")
        evt = stripe_sdk.Webhook.construct_event(body, sig, webhook_secret)
    except Exception as e:
        # Invalid signature/payload must be a 4xx so Stripe surfaces the failure.
        logger.warning("Stripe webhook signature verification failed: %s", e)
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    # construct_event returns a StripeObject (dict-like); index access works on
    # both dicts and StripeObjects — never use isinstance(evt, dict) guards.
    event_type = evt["type"] if "type" in evt else ""
    data = (evt["data"]["object"] if "data" in evt else {}) or {}

    def _get(obj, key, default=None):
        try:
            return obj.get(key, default)
        except AttributeError:
            return default

    if event_type == "checkout.session.completed":
        session_id = _get(data, "id", "")
        payment_status = _get(data, "payment_status", "")
        if payment_status == "paid" and session_id:
            tx = await db.payment_transactions.find_one({"session_id": session_id})
            if tx and not tx.get("applied"):
                user_update = {"plan": tx["plan_id"], "plan_started_at": now_iso()}
                customer_id = _get(data, "customer")
                subscription_id = _get(data, "subscription")
                if customer_id:
                    user_update["stripe_customer_id"] = customer_id
                if subscription_id:
                    user_update["stripe_subscription_id"] = subscription_id
                await db.users.update_one({"id": tx["user_id"]}, {"$set": user_update})
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": {"applied": True, "payment_status": "paid", "status": "complete",
                              "stripe_customer_id": customer_id, "updated_at": now_iso()}},
                )
                logger.info("Plan '%s' applied to user %s via webhook", tx["plan_id"], tx["user_id"])

    elif event_type == "customer.subscription.deleted":
        # Subscription cancelled/ended — downgrade the user to free.
        customer_id = _get(data, "customer")
        if customer_id:
            res = await db.users.update_one(
                {"stripe_customer_id": customer_id},
                {"$set": {"plan": "free", "plan_cancelled_at": now_iso()}},
            )
            if res.matched_count:
                logger.info("Subscription deleted — downgraded customer %s to free", customer_id)
            else:
                logger.warning("subscription.deleted for unknown customer %s", customer_id)

    elif event_type == "invoice.payment_failed":
        # Flag the account; Stripe retries billing before cancelling.
        customer_id = _get(data, "customer")
        if customer_id:
            await db.users.update_one(
                {"stripe_customer_id": customer_id},
                {"$set": {"payment_failed_at": now_iso()}},
            )
            logger.warning("Invoice payment failed for customer %s", customer_id)

    return {"received": True}


# ---------------------------------------------------------------
# PDF export
# ---------------------------------------------------------------
@api.get("/audits/{audit_id}/pdf")
async def audit_pdf(audit_id: str, user: dict = Depends(get_current_user_doc)):
    plan = get_plan(user.get("plan"))
    if not is_enabled("pdf_export"):
        raise HTTPException(status_code=503, detail="PDF export is temporarily unavailable")
    if not plan["perks"].get("pdf_export"):
        raise HTTPException(status_code=402, detail="PDF export is a Pro feature. Upgrade to download reports.")
    audit = await db.audits.find_one({"id": audit_id, "user_id": user["id"]}, {"_id": 0})
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    pdf_bytes = build_audit_pdf(audit)
    filename = f"seo-audit-{audit_id[:8]}.pdf"
    return StreamingResponse(
        io_bytes(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


def io_bytes(b: bytes):
    import io
    return io.BytesIO(b)


# ---------------------------------------------------------------
# SERP rank tracking
# ---------------------------------------------------------------
class SerpIn(BaseModel):
    keyword: str
    domain: str
    project_id: Optional[str] = None


@api.post("/serp/check")
async def serp_check(body: SerpIn, user: dict = Depends(get_current_user_doc)):
    plan = get_plan(user.get("plan"))
    if not is_enabled("serp_tracking"):
        raise HTTPException(status_code=503, detail="SERP tracking is temporarily unavailable")
    if not plan["perks"].get("serp_tracking"):
        raise HTTPException(status_code=402, detail="SERP rank tracking is a Pro feature. Upgrade to use it.")
    result = await check_rank(body.keyword.strip(), body.domain.strip())
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "project_id": body.project_id,
        "keyword": body.keyword,
        "domain": result.get("domain"),
        "rank": result.get("rank"),
        "engine": result.get("engine"),
        "results": result.get("results"),
        "error": result.get("error"),
        "created_at": now_iso(),
    }
    await db.serp_checks.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.get("/serp/history")
async def serp_history(project_id: Optional[str] = None, user: dict = Depends(get_current_user_doc)):
    q = {"user_id": user["id"]}
    if project_id:
        q["project_id"] = project_id
    docs = await db.serp_checks.find(q, {"_id": 0}).sort("created_at", -1).limit(50).to_list(50)
    return docs


# ---------------------------------------------------------------
# Scheduled audits (in-app queue)
# ---------------------------------------------------------------
class ScheduleIn(BaseModel):
    schedule: str


@api.post("/projects/{project_id}/schedule")
async def set_schedule(project_id: str, body: ScheduleIn, user: dict = Depends(get_current_user_doc)):
    plan = get_plan(user.get("plan"))
    if body.schedule not in ("off", "monthly"):
        raise HTTPException(status_code=400, detail="Schedule must be 'off' or 'monthly'")
    if body.schedule != "off" and not plan["perks"].get("scheduled_audits"):
        raise HTTPException(status_code=402, detail="Scheduled audits are a Pro feature. Upgrade to enable.")
    project = await db.projects.find_one({"id": project_id, "user_id": user["id"]})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    next_at = None
    if body.schedule == "monthly":
        from datetime import timedelta
        next_at = (datetime.now(timezone.utc) + timedelta(days=30)).isoformat()
    await db.projects.update_one(
        {"id": project_id},
        {"$set": {"schedule": body.schedule, "next_audit_at": next_at}},
    )
    updated = await db.projects.find_one({"id": project_id}, {"_id": 0})
    return updated


# ---------------------------------------------------------------
# Onboarding
# ---------------------------------------------------------------
@api.post("/auth/onboarded")
async def mark_onboarded(user_id: str = Depends(get_current_user_id)):
    await db.users.update_one({"id": user_id}, {"$set": {"onboarded": True}})
    return {"ok": True}


# ---------------------------------------------------------------
# Google Business Profile audit / suggestions / competitors
# ---------------------------------------------------------------
class GBPAuditIn(BaseModel):
    business_name: str = Field(min_length=1, max_length=200)
    primary_category: str = Field(min_length=1)
    address: Optional[str] = ""
    service_area: Optional[str] = ""
    description: Optional[str] = ""
    phone: Optional[str] = ""
    website: Optional[str] = ""
    hours_summary: Optional[str] = ""
    photo_count: Optional[int] = None
    reviews_count: Optional[int] = None
    avg_rating: Optional[float] = None
    response_rate: Optional[str] = ""
    posts_per_month: Optional[int] = None
    booking_enabled: Optional[bool] = None
    messaging_enabled: Optional[bool] = None
    project_id: Optional[str] = None


class GBPSuggestionsIn(BaseModel):
    business_name: str = Field(min_length=1)
    primary_category: str = Field(min_length=1)
    location: Optional[str] = ""
    target_customer: Optional[str] = ""
    current_description: Optional[str] = ""


class GBPCompetitorsIn(BaseModel):
    business_name: str = Field(min_length=1)
    primary_category: str = Field(min_length=1)
    location: Optional[str] = ""
    competitors: List[str]


@api.post("/gbp/audit")
@limiter.limit("10/minute")
async def gbp_audit(request: Request, body: GBPAuditIn, user: dict = Depends(get_current_user_doc)):
    if not is_enabled("gbp_audit"):
        raise HTTPException(status_code=503, detail="GBP audit is temporarily unavailable")
    try:
        result = await gbp_service.audit_listing(**{k: v for k, v in body.model_dump().items() if k != "project_id"})
    except Exception as e:
        logger.exception("gbp audit failed")
        raise HTTPException(status_code=502, detail="AI service is temporarily unavailable. Please try again.")
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "project_id": body.project_id,
        "input": body.model_dump(),
        "result": result,
        "created_at": now_iso(),
    }
    await db.gbp_audits.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.post("/gbp/suggestions")
@limiter.limit("10/minute")
async def gbp_suggestions(request: Request, body: GBPSuggestionsIn, user: dict = Depends(get_current_user_doc)):
    try:
        result = await gbp_service.suggestions(**body.model_dump())
    except Exception as e:
        logger.exception("gbp suggestions failed")
        raise HTTPException(status_code=502, detail="AI service is temporarily unavailable. Please try again.")
    await db.ai_history.insert_one({
        "id": str(uuid.uuid4()), "user_id": user["id"], "kind": "gbp_suggestions",
        "input": body.model_dump(), "result": result, "created_at": now_iso(),
    })
    return result


@api.post("/gbp/competitors")
@limiter.limit("10/minute")
async def gbp_competitors(request: Request, body: GBPCompetitorsIn, user: dict = Depends(get_current_user_doc)):
    try:
        result = await gbp_service.compare_competitors(**body.model_dump())
    except Exception as e:
        logger.exception("gbp competitors failed")
        raise HTTPException(status_code=502, detail="AI service is temporarily unavailable. Please try again.")
    return result


@api.get("/gbp/audits")
async def gbp_audit_history(user: dict = Depends(get_current_user_doc)):
    docs = await db.gbp_audits.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).sort("created_at", -1).limit(20).to_list(20)
    return docs


# ---------------------------------------------------------------
# AI Assistant Visibility
# ---------------------------------------------------------------
class AIVisibilityIn(BaseModel):
    business_name: str = Field(min_length=1, max_length=200)
    category: str = Field(min_length=1)
    location: Optional[str] = ""
    website: Optional[str] = ""
    queries: Optional[List[str]] = None
    project_id: Optional[str] = None


@api.post("/ai-visibility/check")
@limiter.limit("5/minute")
async def ai_visibility_check(request: Request, body: AIVisibilityIn, user: dict = Depends(get_current_user_doc)):
    if not is_enabled("ai_visibility"):
        raise HTTPException(status_code=503, detail="AI visibility check is temporarily unavailable")
    try:
        result = await ai_visibility.check_ai_visibility(
            business_name=body.business_name,
            category=body.category,
            location=body.location or "",
            website=body.website or "",
            queries=body.queries,
        )
    except Exception as e:
        logger.exception("ai-visibility check failed")
        raise HTTPException(status_code=502, detail="AI service is temporarily unavailable. Please try again.")

    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "project_id": body.project_id,
        "input": body.model_dump(),
        "result": result,
        "created_at": now_iso(),
    }
    await db.ai_visibility_checks.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.get("/ai-visibility/history")
async def ai_visibility_history(user: dict = Depends(get_current_user_doc)):
    docs = await db.ai_visibility_checks.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).sort("created_at", -1).limit(20).to_list(20)
    return docs


# ---------------------------------------------------------------
# Unified Visibility Score (north-star)
# ---------------------------------------------------------------
@api.get("/dashboard/visibility")
async def unified_visibility(user: dict = Depends(get_current_user_doc)):
    last_audit = await db.audits.find(
        {"user_id": user["id"]}, {"_id": 0, "result.overall_score": 1, "created_at": 1}
    ).sort("created_at", -1).limit(1).to_list(1)
    google_score = ((last_audit[0].get("result") or {}).get("overall_score")) if last_audit else None

    socials = {}
    for plat in ("instagram", "tiktok", "youtube"):
        rows = await db.social_audits.find(
            {"user_id": user["id"], "platform": plat},
            {"_id": 0, "result.overall_score": 1, "created_at": 1},
        ).sort("created_at", -1).limit(1).to_list(1)
        socials[plat] = ((rows[0].get("result") or {}).get("overall_score")) if rows else None

    last_aiv = await db.ai_visibility_checks.find(
        {"user_id": user["id"]}, {"_id": 0, "result.overall_visibility_score": 1, "created_at": 1}
    ).sort("created_at", -1).limit(1).to_list(1)
    ai_score = ((last_aiv[0].get("result") or {}).get("overall_visibility_score")) if last_aiv else None

    last_gbp = await db.gbp_audits.find(
        {"user_id": user["id"]}, {"_id": 0, "result.overall_score": 1, "created_at": 1}
    ).sort("created_at", -1).limit(1).to_list(1)
    gbp_score = ((last_gbp[0].get("result") or {}).get("overall_score")) if last_gbp else None

    breakdown = {
        "google":      {"score": google_score,         "has_data": google_score is not None},
        "gbp":         {"score": gbp_score,            "has_data": gbp_score is not None},
        "instagram":   {"score": socials["instagram"], "has_data": socials["instagram"] is not None},
        "tiktok":      {"score": socials["tiktok"],    "has_data": socials["tiktok"] is not None},
        "youtube":     {"score": socials["youtube"],   "has_data": socials["youtube"] is not None},
        "ai_assistants": {"score": ai_score,           "has_data": ai_score is not None},
    }

    weights = {"google": 0.22, "gbp": 0.20, "instagram": 0.13, "tiktok": 0.13, "youtube": 0.12, "ai_assistants": 0.20}
    overall = 0
    informed = 0
    for k, w in weights.items():
        s = breakdown[k]["score"]
        if s is not None:
            overall += s * w
            informed += w
    overall_score = int(round(overall)) if informed > 0 else None

    return {
        "overall_score": overall_score,
        "informed_fraction": round(informed, 2),
        "weights": weights,
        "breakdown": breakdown,
        "checked_at": now_iso(),
    }


# ---------------------------------------------------------------
# Social presence audit (Instagram / TikTok / YouTube)
# ---------------------------------------------------------------
ALLOWED_PLATFORMS = {"instagram", "tiktok", "youtube"}


class SocialAuditIn(BaseModel):
    platform: str
    handle: str
    bio: Optional[str] = ""
    niche: Optional[str] = ""
    location: Optional[str] = ""
    followers: Optional[str] = ""
    recent_caption: Optional[str] = ""
    posts_per_week: Optional[str] = ""
    project_id: Optional[str] = None


class SocialSuggestionsIn(BaseModel):
    platform: str
    handle: str
    bio: Optional[str] = ""
    niche: Optional[str] = ""
    location: Optional[str] = ""
    target_customer: Optional[str] = ""


class SocialCompetitorIn(BaseModel):
    platform: str
    your_handle: str
    your_niche: Optional[str] = ""
    competitors: List[str]


def _check_platform(p: str):
    if p not in ALLOWED_PLATFORMS:
        raise HTTPException(status_code=400, detail=f"platform must be one of: {sorted(ALLOWED_PLATFORMS)}")


@api.post("/social/audit")
@limiter.limit("10/minute")
async def social_audit(request: Request, body: SocialAuditIn, user: dict = Depends(get_current_user_doc)):
    if not is_enabled("social_audit"):
        raise HTTPException(status_code=503, detail="Social audit is temporarily unavailable")
    _check_platform(body.platform)
    fetched = await social_fetcher.fetch_profile_signals(body.platform, body.handle)
    try:
        ai = await social_service.audit_profile(
            platform=body.platform,
            handle=body.handle.lstrip("@"),
            bio=body.bio or "",
            niche=body.niche or "",
            location=body.location or "",
            followers=body.followers or "",
            recent_caption=body.recent_caption or "",
            posts_per_week=body.posts_per_week or "",
            fetched_signals=fetched,
        )
    except Exception as e:
        logger.exception("social audit failed")
        raise HTTPException(status_code=502, detail="AI service is temporarily unavailable. Please try again.")

    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "project_id": body.project_id,
        "platform": body.platform,
        "handle": body.handle.lstrip("@"),
        "input": body.model_dump(),
        "fetched": fetched,
        "result": ai,
        "created_at": now_iso(),
    }
    await db.social_audits.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.post("/social/suggestions")
@limiter.limit("10/minute")
async def social_suggestions(request: Request, body: SocialSuggestionsIn, user: dict = Depends(get_current_user_doc)):
    _check_platform(body.platform)
    try:
        result = await social_service.suggestions(
            platform=body.platform,
            handle=body.handle.lstrip("@"),
            bio=body.bio or "",
            niche=body.niche or "",
            location=body.location or "",
            target_customer=body.target_customer or "",
        )
    except Exception as e:
        logger.exception("social suggestions failed")
        raise HTTPException(status_code=502, detail="AI service is temporarily unavailable. Please try again.")
    await db.ai_history.insert_one({
        "id": str(uuid.uuid4()), "user_id": user["id"], "kind": f"social_suggestions_{body.platform}",
        "input": body.model_dump(), "result": result, "created_at": now_iso(),
    })
    return result


@api.post("/social/competitors")
@limiter.limit("10/minute")
async def social_competitors(request: Request, body: SocialCompetitorIn, user: dict = Depends(get_current_user_doc)):
    _check_platform(body.platform)
    try:
        result = await social_service.compare_competitors(
            platform=body.platform,
            your_handle=body.your_handle,
            your_niche=body.your_niche or "",
            competitors=body.competitors,
        )
    except Exception as e:
        logger.exception("social competitors failed")
        raise HTTPException(status_code=502, detail="AI service is temporarily unavailable. Please try again.")
    return result


@api.get("/social/audits")
async def social_audit_history(platform: Optional[str] = None, user: dict = Depends(get_current_user_doc)):
    q = {"user_id": user["id"]}
    if platform:
        q["platform"] = platform
    docs = await db.social_audits.find(q, {"_id": 0}).sort("created_at", -1).limit(50).to_list(50)
    return docs


# ---------------------------------------------------------------
# Concierge brief (onboarding form for $1k/mo customers)
# ---------------------------------------------------------------
class ConciergeBriefIn(BaseModel):
    business_name: str = Field(min_length=1, max_length=200)
    website: str
    industry: Optional[str] = ""
    location: Optional[str] = ""
    target_keywords: List[str] = Field(default_factory=list)
    competitors: List[str] = Field(default_factory=list)
    primary_goal: str = Field(min_length=1)
    target_customer: Optional[str] = ""
    brand_voice: Optional[str] = ""
    monthly_traffic_goal: Optional[str] = ""
    blockers: Optional[str] = ""
    contact_phone: Optional[str] = ""
    preferred_meeting_time: Optional[str] = ""


@api.post("/concierge/brief")
@limiter.limit("10/minute")
async def upsert_concierge_brief(request: Request, body: ConciergeBriefIn, user: dict = Depends(get_current_user_doc)):
    plan = get_plan(user.get("plan"))
    if not is_enabled("concierge"):
        raise HTTPException(status_code=503, detail="Concierge service is temporarily unavailable")
    if not plan["perks"].get("done_for_you"):
        raise HTTPException(
            status_code=402,
            detail="Concierge brief is for done-for-you customers. Upgrade to Concierge.",
        )
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "user_email": user["email"],
        "user_name": user.get("name"),
        **body.model_dump(),
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    existing = await db.concierge_briefs.find_one({"user_id": user["id"]})
    if existing:
        update = {**body.model_dump(), "updated_at": now_iso()}
        await db.concierge_briefs.update_one({"user_id": user["id"]}, {"$set": update})
        out = await db.concierge_briefs.find_one({"user_id": user["id"]}, {"_id": 0})
        return out
    await db.concierge_briefs.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.get("/concierge/brief")
async def get_concierge_brief(user: dict = Depends(get_current_user_doc)):
    doc = await db.concierge_briefs.find_one({"user_id": user["id"]}, {"_id": 0})
    return doc


@api.get("/admin/concierge/briefs")
async def admin_list_briefs(user: dict = Depends(get_current_user_doc)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    docs = await db.concierge_briefs.find({}, {"_id": 0}).sort("updated_at", -1).to_list(500)
    return docs


# ---------------------------------------------------------------
# Referrals
# ---------------------------------------------------------------
class ReferralInviteIn(BaseModel):
    email: EmailStr


@api.post("/referrals/invite")
@limiter.limit("5/minute")
async def referral_invite(request: Request, body: ReferralInviteIn, bg: BackgroundTasks, user: dict = Depends(get_current_user_doc)):
    if not is_enabled("referrals"):
        raise HTTPException(status_code=503, detail="Referral program is temporarily unavailable")
    referral_link = f"{os.environ.get('FRONTEND_URL', 'http://localhost:3000')}/audit?ref={user['id']}"
    bg.add_task(
        _send_email_background,
        to=body.email,
        subject=f"{user.get('name', 'A friend')} invited you to try Goodly",
        html=email_service.referral_invite_html(
            referrer_name=user.get("name", "A friend"),
            referral_link=referral_link,
        ),
    )
    return {"ok": True, "message": f"Invite sent to {body.email}"}


# ---------------------------------------------------------------
# Scheduled audits — manual trigger + history
# ---------------------------------------------------------------
@api.post("/scheduler/run-now")
async def scheduler_run_now(request: Request, user: dict = Depends(get_current_user_doc)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    base_url = _store_base_url(request)
    summary = await scheduler_mod.run_due_audits(db, base_url)
    return summary


@api.post("/scheduler/trigger")
async def scheduler_cloud_trigger(request: Request):
    """Cloud Scheduler HTTP trigger — uses shared secret, not user auth.

    Set SCHEDULER_API_KEY in Cloud Run env vars and configure Cloud Scheduler
    to POST to https://api.searchgoodly.com/api/scheduler/trigger with header
    X-Scheduler-Key: <SCHEDULER_API_KEY> every 15 minutes.

    This ensures scheduled audits run even when Cloud Run scales to zero.
    The in-process APScheduler still runs as a fallback when the instance is warm.
    """
    import os as _os
    expected = _os.environ.get("SCHEDULER_API_KEY", "")
    provided = request.headers.get("X-Scheduler-Key", "")
    if not expected or provided != expected:
        raise HTTPException(status_code=401, detail="Invalid or missing scheduler key")
    base_url = _store_base_url(request)
    summary = await scheduler_mod.run_due_audits(db, base_url)
    return summary


@api.get("/scheduler/runs")
async def scheduler_runs(user: dict = Depends(get_current_user_doc)):
    docs = await db.scheduled_runs.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).sort("run_at", -1).limit(50).to_list(50)
    return docs


# ---------------------------------------------------------------
# Enhanced SEO endpoints (claude-seo integration)
# ---------------------------------------------------------------
@api.post("/seo/schema/generate")
async def seo_schema_generate(body: dict, user: dict = Depends(get_current_user_doc)):
    """Generate Schema.org JSON-LD markup for a given business type."""
    schema_type = body.get("type", "local_business")
    try:
        schema = seo_enhanced.generate_schema(schema_type, **body.get("fields", {}))
        html = seo_enhanced.generate_schema_html(schema_type, **body.get("fields", {}))
        return {"schema": schema, "html": html}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@api.get("/seo/schema/types")
async def seo_schema_types():
    """List available Schema.org template types."""
    return {"types": list(seo_enhanced.SCHEMA_TEMPLATES.keys())}


@api.post("/seo/pagespeed")
async def seo_pagespeed(body: dict, user: dict = Depends(get_current_user_doc)):
    """Run PageSpeed Insights / Core Web Vitals analysis."""
    url = body.get("url", "")
    strategy = body.get("strategy", "mobile")
    if not url:
        raise HTTPException(status_code=400, detail="url is required")
    result = await seo_enhanced.check_pagespeed(url, strategy)
    return result


@api.post("/seo/content-quality")
async def seo_content_quality(body: dict, user: dict = Depends(get_current_user_doc)):
    """Analyze content quality (E-E-A-T signals)."""
    html = body.get("html", "")
    text = body.get("text", "")
    if not text:
        raise HTTPException(status_code=400, detail="text is required")
    return seo_enhanced.analyze_content_quality(html, text)


@api.post("/seo/indexnow")
async def seo_indexnow(body: dict, user: dict = Depends(get_current_user_doc)):
    """Submit URL to search engines via IndexNow protocol."""
    url = body.get("url", "")
    if not url:
        raise HTTPException(status_code=400, detail="url is required")
    result = await seo_enhanced.submit_indexnow(url, body.get("key"))
    return result


@api.post("/seo/drift/baseline")
async def seo_drift_baseline(body: dict, user: dict = Depends(get_current_user_doc)):
    """Capture SEO baseline for drift monitoring."""
    url = body.get("url", "")
    if not url:
        raise HTTPException(status_code=400, detail="url is required")
    return await seo_enhanced.capture_seo_baseline(db, url, user["id"])


@api.post("/seo/drift/compare")
async def seo_drift_compare(body: dict, user: dict = Depends(get_current_user_doc)):
    """Compare current page state to baseline (drift detection)."""
    url = body.get("url", "")
    if not url:
        raise HTTPException(status_code=400, detail="url is required")
    return await seo_enhanced.compare_seo_drift(db, url, user["id"])


@api.post("/seo/cluster-keywords")
async def seo_cluster_keywords(body: dict, user: dict = Depends(get_current_user_doc)):
    """Group keywords into semantic clusters."""
    keywords = body.get("keywords", [])
    n_clusters = body.get("n_clusters", 5)
    if not keywords:
        raise HTTPException(status_code=400, detail="keywords list is required")
    return seo_enhanced.cluster_keywords(keywords, n_clusters)


# ---------------------------------------------------------------
# Support contact endpoint
# ---------------------------------------------------------------
class SupportContactIn(BaseModel):
    name: str = "Anonymous"
    email: str = "no-email@provided.com"
    message: str
    page: str = ""


@api.post("/support/contact")
@limiter.limit("3/minute")
async def support_contact(request: Request, body: SupportContactIn, response: Response, bg: BackgroundTasks):
    if not is_enabled("support_widget"):
        raise HTTPException(status_code=503, detail="Support is temporarily unavailable")
    doc = {
        "id": str(uuid.uuid4()),
        "name": sanitize_name(body.name),
        "email": body.email,
        "message": sanitize_html(body.message),
        "page": body.page,
        "created_at": now_iso(),
    }
    try:
        await db.support_messages.insert_one(doc)
    except Exception as e:
        logger.warning("Support message DB insert failed: %s", e)

    # Send notification email to support
    bg.add_task(
        _send_email_background,
        to=os.environ.get("SUPPORT_EMAIL", "hello@searchgoodly.com"),
        subject=f"Support: {body.name} — {body.message[:60]}",
        html=email_service.support_notification_html(
            name=body.name,
            email=body.email,
            message=body.message,
            page=body.page,
        ),
    )

    return {"ok": True, "message": "Message received. We'll reply within 2 hours."}


# ---------------------------------------------------------------
# Agency routes
# ---------------------------------------------------------------
class CreateClientIn(BaseModel):
    email: EmailStr
    name: str = Field(min_length=1, max_length=120)
    website: str
    plan: str = "free"


@api.post("/agency/clients")
async def agency_create_client(body: CreateClientIn, user: dict = Depends(get_current_user_doc)):
    """Create a client account under the current agency user."""
    try:
        result = await agency_service.create_client(
            agency_user_id=user["id"],
            email=body.email,
            name=body.name,
            website=body.website,
            plan=body.plan,
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@api.get("/agency/clients")
async def agency_list_clients(user: dict = Depends(get_current_user_doc)):
    """List all clients under the current agency user."""
    return await agency_service.list_clients(user["id"])


@api.get("/agency/clients/{client_id}")
async def agency_get_client(client_id: str, user: dict = Depends(get_current_user_doc)):
    """Get a single client's details."""
    client = await agency_service.get_client(user["id"], client_id)
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


class AgencyAuditIn(BaseModel):
    client_id: str
    url: str
    project_id: Optional[str] = None


@api.post("/agency/audits")
async def agency_run_client_audit(body: AgencyAuditIn, user: dict = Depends(get_current_user_doc)):
    """Run an audit on behalf of a client."""
    try:
        return await agency_service.run_client_audit(
            agency_user_id=user["id"],
            client_id=body.client_id,
            url=body.url,
            project_id=body.project_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@api.get("/agency/dashboard")
async def agency_dashboard(user: dict = Depends(get_current_user_doc)):
    """Get agency-wide dashboard with all client metrics."""
    return await agency_service.get_agency_dashboard(user["id"])


# NOTE: The unauthenticated /setup/stripe-products and /setup/seed-blog-post
# endpoints were removed. Admin-protected equivalents live at
# /api/admin/setup-stripe-products (routes/admin.py) and POST /api/blog/posts
# (routes/blog.py, admin-only).


# ---------------------------------------------------------------
# Mount + middleware
# ---------------------------------------------------------------
# The legacy inline routes on `api` (/api/*) are the production surface.
# The duplicate /api/v1/* mounting was removed: it exposed diverged handlers
# (no login rate limit, missing feature flags) alongside the live ones.
# Only route modules WITHOUT a legacy equivalent are mounted here — the
# frontend depends on them at /api/*.
from routes.admin import router as admin_router        # /admin/users, /admin/stats, /admin/analytics/*
from routes.blog import router as blog_router          # /blog/posts, /blog/categories
from routes.gsc import router as gsc_router            # /gsc/analytics, /gsc/trend

api.include_router(admin_router)
api.include_router(blog_router)
api.include_router(gsc_router)

app.include_router(api)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

cors_origins_raw = os.environ.get("CORS_ORIGINS", "http://localhost:3000")
if cors_origins_raw == "*" and os.environ.get("ENVIRONMENT") == "production":
    cors_origins_raw = os.environ.get("PRODUCTION_DOMAIN", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=cors_origins_raw.split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(SlowAPIMiddleware)

# Request body size limit (prevents DoS via large payloads)
from starlette.middleware.base import BaseHTTPMiddleware as _BaseHTTPMiddleware
class _BodySizeLimitMiddleware(_BaseHTTPMiddleware):
    MAX_BODY = 5 * 1024 * 1024  # 5 MB
    async def dispatch(self, request, call_next):
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > self.MAX_BODY:
            from fastapi.responses import JSONResponse
            return JSONResponse(
                status_code=413,
                content={"detail": "Request body too large. Maximum is 5 MB."},
            )
        return await call_next(request)
app.add_middleware(_BodySizeLimitMiddleware)

# Security headers (HSTS, CSP, X-Frame-Options, etc.)
app.add_middleware(SecurityHeadersMiddleware)

# Request metrics (latency, status codes)
app.add_middleware(MetricsMiddleware)

# API version header
app.add_middleware(VersionHeaderMiddleware, version=__version__)


from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: validate secrets, create indexes, seed users, start scheduler."""
    # Validate critical secrets at startup
    if not os.environ.get("JWT_SECRET"):
        if os.environ.get("ENVIRONMENT") == "production":
            # Fail fast: a per-instance random secret would invalidate sessions
            # across Cloud Run replicas/restarts and silently break auth.
            raise RuntimeError("JWT_SECRET must be set in production")
        logger.warning("JWT_SECRET not set — using a random value (development only)")
        import secrets as _sec
        os.environ["JWT_SECRET"] = _sec.token_urlsafe(32)
    if not os.environ.get("GEMINI_API_KEY"):
        logger.warning("GEMINI_API_KEY not set — AI features will fail")
    if not os.environ.get("STRIPE_API_KEY"):
        logger.warning("STRIPE_API_KEY not set — billing features will fail")
    if not os.environ.get("STRIPE_WEBHOOK_SECRET"):
        logger.warning("STRIPE_WEBHOOK_SECRET not set — webhooks will be rejected")
    if os.environ.get("SENDER_EMAIL", "onboarding@resend.dev") == "onboarding@resend.dev":
        logger.warning("SENDER_EMAIL is still the Resend test default — emails may not deliver")

    # Skip DB operations if no MONGO_URL (serverless cold start)
    if os.environ.get("MONGO_URL"):
        try:
            await db.users.create_index("email", unique=True)
            await db.users.create_index("id", unique=True)
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
            await db.users.create_index("verification_token", sparse=True)
            await db.users.create_index("reset_token", sparse=True)
            # Blog posts collection
            await db.blog_posts.create_index("slug", unique=True)
            await db.blog_posts.create_index("id", unique=True)
            await db.blog_posts.create_index([("published", 1), ("created_at", -1)])
            # TTL indexes for automatic cleanup
            try:
                await db.serp_checks.create_index("created_at", expireAfterSeconds=90 * 24 * 3600)
                await db.ai_history.create_index("created_at", expireAfterSeconds=365 * 24 * 3600)
            except Exception:
                pass  # TTL indexes may not be supported on all MongoDB versions

            await db.users.update_many({"plan": {"$exists": False}}, {"$set": {"plan": "free"}})
            await db.users.update_many({"onboarded": {"$exists": False}}, {"$set": {"onboarded": False}})

            is_production = os.environ.get("ENVIRONMENT") == "production"
            seeds = []

            admin_password = os.environ.get("ADMIN_PASSWORD")
            if admin_password:
                seeds.append({
                    "email": os.environ.get("ADMIN_EMAIL", "admin@searchgoodly.com"),
                    "password": admin_password,
                    "name": "Admin", "role": "admin", "plan": "concierge",
                })
            else:
                # Never auto-generate (or log) an admin password. Without
                # ADMIN_PASSWORD the admin account is simply not seeded.
                logger.warning("ADMIN_PASSWORD not set — skipping admin user seeding")

            demo_password = os.environ.get("DEMO_PASSWORD")
            if demo_password:
                seeds.append({"email": "demo@smallbiz.com", "password": demo_password, "name": "Demo Owner", "role": "user", "plan": "concierge"})
                seeds.append({"email": "hello@searchgoodly.com", "password": demo_password, "name": "Demo Business", "role": "user", "plan": "pro"})
            elif not is_production:
                # Weak defaults are acceptable for local development only.
                seeds.append({"email": "demo@smallbiz.com", "password": "demo1234", "name": "Demo Owner", "role": "user", "plan": "concierge"})
                seeds.append({"email": "hello@searchgoodly.com", "password": "demo1234", "name": "Demo Business", "role": "user", "plan": "pro"})
            for s in seeds:
                existing = await db.users.find_one({"email": s["email"]})
                if not existing:
                    await db.users.insert_one({
                        "id": str(uuid.uuid4()),
                        "email": s["email"],
                        "password_hash": hash_password(s["password"]),
                        "name": s["name"],
                        "role": s["role"],
                        "plan": s["plan"],
                        "onboarded": True,
                        "email_verified": True,
                        "created_at": now_iso(),
                    })
                else:
                    await db.users.update_one(
                        {"email": s["email"]},
                        {"$set": {"password_hash": hash_password(s["password"]), "plan": existing.get("plan") or s["plan"], "onboarded": True, "email_verified": True}},
                    )
            logger.info("Startup complete. Seeded users (if missing).")

            # Seed demo account with pre-loaded data
            try:
                demo_user = await db.users.find_one({"email": "hello@searchgoodly.com"})
                if demo_user:
                    await _seed_demo_experience(demo_user["id"])
            except Exception as e:
                logger.warning("Demo account seeding failed: %s", e)

            # Seed blog posts
            try:
                from blog_service import seed_default_posts
                seeded = await seed_default_posts(db)
                if seeded:
                    logger.info("Seeded %d blog posts", seeded)
            except Exception as e:
                logger.warning("Blog seeding failed: %s", e)

            if os.environ.get("SCHEDULER_ENABLED", "true").lower() in ("1", "true", "yes"):
                scheduler_mod.start(db, lambda: os.environ.get("FRONTEND_URL", _state.get("base_url") or "http://localhost:3000"))
        except Exception as e:
            logger.exception("DB initialization failed: %s", e)
    else:
        logger.warning("MONGO_URL not set — skipping DB initialization")

    yield  # Application runs here

    # Shutdown
    try:
        scheduler_mod.shutdown()
    except Exception:
        pass  # Scheduler shutdown is best-effort
    if _client:
        _client.close()

# Wire lifespan into the app (replaces deprecated on_event)
app.router.lifespan_context = lifespan



_state: dict = {}


def _store_base_url(request: Request) -> str:
    """Return the frontend base URL for constructing links (e.g., verification).

    Uses FRONTEND_URL in production to avoid leaking the internal
    Cloud Run URL. Falls back to request.base_url for dev.
    """
    frontend_url = os.environ.get("FRONTEND_URL", "")
    if frontend_url:
        base = frontend_url.rstrip("/")
    else:
        base = str(request.base_url).rstrip("/")
    _state["base_url"] = base
    return base


@app.middleware("http")
async def _capture_base_url(request: Request, call_next):
    _store_base_url(request)
    return await call_next(request)
