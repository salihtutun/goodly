from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import FastAPI, APIRouter, HTTPException, Depends, Response, Request
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator
import asyncio

from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user_id,
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
from logging_config import setup_logging
from metrics import MetricsMiddleware
from security_headers import SecurityHeadersMiddleware

# Structured JSON logging for Cloud Logging
setup_logging()


# --- Mongo setup (lazy for serverless) ---
_client = None
_db = None

def _get_db():
    global _client, _db
    if _client is None:
        mongo_url = os.environ.get("MONGO_URL")
        if not mongo_url:
            raise RuntimeError("MONGO_URL not configured")
        _client = AsyncIOMotorClient(mongo_url)
        _db = _client[os.environ.get("DB_NAME", "goodly")]
    return _db

# Proxy object that lazily resolves to db
class _LazyDB:
    def __getattr__(self, name):
        return getattr(_get_db(), name)
    def __getitem__(self, key):
        return _get_db()[key]

db = _LazyDB()

app = FastAPI(title="Goodly API")
api = APIRouter(prefix="/api")
limiter = Limiter(key_func=get_remote_address, default_limits=["200/minute"])

logger = logging.getLogger("seo_framework")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s | %(message)s")


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


# ---------------------------------------------------------------
# Auth models / endpoints
# ---------------------------------------------------------------
class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    name: Optional[str] = None

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


class AuthOut(BaseModel):
    user: dict
    token: str


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


@api.post("/auth/register", response_model=AuthOut)
@limiter.limit("3/minute")
async def register(request: Request, body: RegisterIn, response: Response):
    email = body.email.lower().strip()
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

    # Send verification email (best-effort, don't block registration)
    try:
        verify_link = f"{_store_base_url(request)}/api/auth/verify/{user_doc['verification_token']}"
        await email_service.send_html_email(
            to=email,
            subject="Verify your email — Goodly",
            html=email_service.verify_email_html(name=user_doc["name"], verify_link=verify_link),
        )
    except Exception as e:
        logger.warning("Verification email failed: %s", e)

    token = create_access_token(user_doc["id"], email)
    _set_auth_cookie(response, token)
    return {"user": public_user(user_doc), "token": token}


@api.post("/auth/login", response_model=AuthOut)
@limiter.limit("5/minute")
async def login(request: Request, body: LoginIn, response: Response):
    email = body.email.lower().strip()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token(user["id"], email)
    _set_auth_cookie(response, token)
    return {"user": public_user(user), "token": token}


@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}


@api.get("/auth/me")
async def me(user_id: str = Depends(get_current_user_id)):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return public_user(user)


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
async def resend_verification(request: Request, user: dict = Depends(get_current_user_doc)):
    if user.get("email_verified"):
        return {"ok": True, "message": "Email already verified"}
    token = str(uuid.uuid4())
    await db.users.update_one({"id": user["id"]}, {"$set": {"verification_token": token}})
    verify_link = f"{_store_base_url(request)}/api/auth/verify/{token}"
    try:
        await email_service.send_html_email(
            to=user["email"],
            subject="Verify your email — Goodly",
            html=email_service.verify_email_html(name=user.get("name", ""), verify_link=verify_link),
        )
    except Exception as e:
        logger.warning("Resend verification failed: %s", e)
    return {"ok": True}


@api.post("/auth/forgot-password")
@limiter.limit("3/minute")
async def forgot_password(body: ForgotPasswordIn, request: Request):
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
    try:
        await email_service.send_html_email(
            to=email,
            subject="Reset your password — Goodly",
            html=email_service.reset_password_html(name=user.get("name", ""), reset_link=reset_link),
        )
    except Exception as e:
        logger.warning("Reset email failed: %s", e)

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
        "target_keywords": body.target_keywords or "",
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
    doc = await db.projects.find_one({"id": project_id}, {"_id": 0})
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

    audit_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "project_id": body.project_id,
        "url": result.get("url", body.url),
        "created_at": now_iso(),
        "month_key": month_key(),
        "result": result,
        "ai_recommendations": ai_recs,
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


@api.post("/public/audit")
@limiter.limit("10/minute")
async def public_audit(request: Request, body: PublicAuditIn):
    """Run a free SEO audit without authentication. Returns score + top issues only."""
    result = await analyze_url(body.url)
    return {
        "url": result.get("url", body.url),
        "overall_score": result.get("overall_score"),
        "categories": result.get("categories"),
        "issues": result.get("issues", []),
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


@api.delete("/audits/{audit_id}")
async def delete_audit(audit_id: str, user_id: str = Depends(get_current_user_id)):
    res = await db.audits.delete_one({"id": audit_id, "user_id": user_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Audit not found")
    return {"ok": True}


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
    except Exception as e:
        logger.exception("meta tags failed")
        raise HTTPException(status_code=502, detail=f"AI service error: {e}")


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
    except Exception as e:
        logger.exception("keywords failed")
        raise HTTPException(status_code=502, detail=f"AI service error: {e}")


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
    except Exception as e:
        logger.exception("competitors failed")
        raise HTTPException(status_code=502, detail=f"AI service error: {e}")


# ---------------------------------------------------------------
# Health check
# ---------------------------------------------------------------
@api.get("/")
async def root():
    return {"service": "Goodly API", "status": "ok"}


@api.get("/health")
async def health():
    health_status = {"status": "ok", "service": "Goodly API", "version": "1.7.0"}
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
    return {
        "projects_count": projects_count,
        "audits_count": audits_count,
        "average_score": avg_score,
        "recent_audits": recent_audits,
    }


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
    except Exception as e:
        logger.exception("Stripe checkout creation failed")
        raise HTTPException(status_code=502, detail=f"Could not create checkout session: {e}")

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
    except Exception as e:
        logger.exception("Stripe status fetch failed")
        raise HTTPException(status_code=502, detail=f"Could not check status: {e}")

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
    except Exception as e:
        logger.exception("Stripe portal session failed")
        raise HTTPException(status_code=502, detail=f"Portal session error: {e}")


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
        import stripe as stripe_lib
        evt = stripe_lib.Webhook.construct_event(
            body, sig, webhook_secret
        )
        data = evt.get("data", {}).get("object", {}) if isinstance(evt, dict) else {}
        payment_status = data.get("payment_status", "") if isinstance(data, dict) else ""
        session_id = data.get("id", "") if isinstance(data, dict) else ""
    except Exception as e:
        logger.warning("webhook handle failed: %s", e)
        return {"received": False}

    if payment_status == "paid" and session_id:
        tx = await db.payment_transactions.find_one({"session_id": session_id})
        if tx and not tx.get("applied"):
            await db.users.update_one(
                {"id": tx["user_id"]},
                {"$set": {"plan": tx["plan_id"], "plan_started_at": now_iso()}},
            )
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"applied": True, "payment_status": "paid", "status": "complete", "updated_at": now_iso()}},
            )
    return {"received": True}


# ---------------------------------------------------------------
# PDF export
# ---------------------------------------------------------------
@api.get("/audits/{audit_id}/pdf")
async def audit_pdf(audit_id: str, user: dict = Depends(get_current_user_doc)):
    plan = get_plan(user.get("plan"))
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
    try:
        result = await gbp_service.audit_listing(**{k: v for k, v in body.model_dump().items() if k != "project_id"})
    except Exception as e:
        logger.exception("gbp audit failed")
        raise HTTPException(status_code=502, detail=f"AI service error: {e}")
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
async def gbp_suggestions(body: GBPSuggestionsIn, user: dict = Depends(get_current_user_doc)):
    try:
        result = await gbp_service.suggestions(**body.model_dump())
    except Exception as e:
        logger.exception("gbp suggestions failed")
        raise HTTPException(status_code=502, detail=f"AI service error: {e}")
    await db.ai_history.insert_one({
        "id": str(uuid.uuid4()), "user_id": user["id"], "kind": "gbp_suggestions",
        "input": body.model_dump(), "result": result, "created_at": now_iso(),
    })
    return result


@api.post("/gbp/competitors")
async def gbp_competitors(body: GBPCompetitorsIn, user: dict = Depends(get_current_user_doc)):
    try:
        result = await gbp_service.compare_competitors(**body.model_dump())
    except Exception as e:
        logger.exception("gbp competitors failed")
        raise HTTPException(status_code=502, detail=f"AI service error: {e}")
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
        raise HTTPException(status_code=502, detail=f"AI service error: {e}")

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
        raise HTTPException(status_code=502, detail=f"AI service error: {e}")

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
async def social_suggestions(body: SocialSuggestionsIn, user: dict = Depends(get_current_user_doc)):
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
        raise HTTPException(status_code=502, detail=f"AI service error: {e}")
    await db.ai_history.insert_one({
        "id": str(uuid.uuid4()), "user_id": user["id"], "kind": f"social_suggestions_{body.platform}",
        "input": body.model_dump(), "result": result, "created_at": now_iso(),
    })
    return result


@api.post("/social/competitors")
async def social_competitors(body: SocialCompetitorIn, user: dict = Depends(get_current_user_doc)):
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
        raise HTTPException(status_code=502, detail=f"AI service error: {e}")
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
# Scheduled audits — manual trigger + history
# ---------------------------------------------------------------
@api.post("/scheduler/run-now")
async def scheduler_run_now(request: Request, user: dict = Depends(get_current_user_doc)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
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
# Mount + middleware
# ---------------------------------------------------------------
app.include_router(api)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

cors_origins_raw = os.environ.get("CORS_ORIGINS", "http://localhost:3000")
if cors_origins_raw == "*" and os.environ.get("ENVIRONMENT") == "production":
    cors_origins_raw = os.environ.get("PRODUCTION_DOMAIN", "https://goodly.app")
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=cors_origins_raw.split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(SlowAPIMiddleware)

# Security headers (HSTS, CSP, X-Frame-Options, etc.)
app.add_middleware(SecurityHeadersMiddleware)

# Request metrics (latency, status codes)
app.add_middleware(MetricsMiddleware)


from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: validate secrets, create indexes, seed users, start scheduler."""
    # Validate critical secrets at startup
    if not os.environ.get("JWT_SECRET"):
        if os.environ.get("ENVIRONMENT") == "production":
            logger.warning("JWT_SECRET not set — using random value for this instance")
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
        # TTL indexes for automatic cleanup
        try:
            await db.serp_checks.create_index("created_at", expireAfterSeconds=90 * 24 * 3600)
            await db.ai_history.create_index("created_at", expireAfterSeconds=365 * 24 * 3600)
        except Exception:
            pass  # TTL indexes may not be supported on all MongoDB versions

        await db.users.update_many({"plan": {"$exists": False}}, {"$set": {"plan": "free"}})
        await db.users.update_many({"onboarded": {"$exists": False}}, {"$set": {"onboarded": False}})

        import secrets as _secrets
        admin_password = os.environ.get("ADMIN_PASSWORD")
        if not admin_password:
            admin_password = _secrets.token_urlsafe(16)
            logger.warning("ADMIN_PASSWORD not set — generated random admin password: %s", admin_password)
        demo_password = os.environ.get("DEMO_PASSWORD", "demo1234")
        seeds = [
            {"email": os.environ.get("ADMIN_EMAIL", "admin@goodly.app"),
             "password": admin_password,
             "name": "Admin", "role": "admin", "plan": "concierge"},
            {"email": "demo@smallbiz.com", "password": demo_password, "name": "Demo Owner", "role": "user", "plan": "concierge"},
        ]
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
                    "created_at": now_iso(),
                })
            else:
                await db.users.update_one(
                    {"email": s["email"]},
                    {"$set": {"plan": existing.get("plan") or s["plan"], "onboarded": True}},
                )
        logger.info("Startup complete. Seeded users (if missing).")

        if os.environ.get("SCHEDULER_ENABLED", "true").lower() in ("1", "true", "yes"):
            scheduler_mod.start(db, lambda: _state.get("base_url") or "http://localhost:8001")
    else:
        logger.warning("MONGO_URL not set — skipping DB initialization")

    yield  # Application runs here

    # Shutdown
    try:
        scheduler_mod.shutdown()
    except Exception:
        pass
    if _client:
        _client.close()

# Wire lifespan into the app (replaces deprecated on_event)
app.router.lifespan_context = lifespan


_state: dict = {}


def _store_base_url(request: Request) -> str:
    base = str(request.base_url).rstrip("/")
    _state["base_url"] = base
    return base


@app.middleware("http")
async def _capture_base_url(request: Request, call_next):
    _store_base_url(request)
    return await call_next(request)
