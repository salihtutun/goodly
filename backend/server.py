from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import uuid
import logging
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Response, Request
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, EmailStr, Field, ConfigDict
import asyncio

from auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user_id,
)
from seo_analyzer import analyze_url
import ai_service
from billing import PLANS, get_plan, month_key, create_subscription_checkout, make_stripe
from pdf_export import build_audit_pdf
from serp import check_rank
from fastapi.responses import StreamingResponse
import scheduler as scheduler_mod
import stripe as stripe_sdk


# --- Mongo setup ---
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="Goodly API")
api = APIRouter(prefix="/api")

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
    password: str = Field(min_length=6, max_length=128)
    name: Optional[str] = None


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class AuthOut(BaseModel):
    user: dict
    token: str


def _set_auth_cookie(response: Response, token: str):
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=60 * 60 * 24 * 7,
        path="/",
    )


@api.post("/auth/register", response_model=AuthOut)
async def register(body: RegisterIn, response: Response):
    email = body.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists")
    user_doc = {
        "id": str(uuid.uuid4()),
        "email": email,
        "password_hash": hash_password(body.password),
        "name": body.name or email.split("@")[0],
        "role": "user",
        "plan": "free",
        "onboarded": False,
        "created_at": now_iso(),
    }
    await db.users.insert_one(user_doc)
    token = create_access_token(user_doc["id"], email)
    _set_auth_cookie(response, token)
    return {"user": public_user(user_doc), "token": token}


@api.post("/auth/login", response_model=AuthOut)
async def login(body: LoginIn, response: Response):
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
        "name": body.name,
        "url": body.url,
        "description": body.description or "",
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
async def ai_meta_tags(body: MetaTagsIn, user_id: str = Depends(get_current_user_id)):
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
async def ai_keywords(body: KeywordsIn, user_id: str = Depends(get_current_user_id)):
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
async def ai_competitors(body: CompetitorsIn, user_id: str = Depends(get_current_user_id)):
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
# Dashboard summary
# ---------------------------------------------------------------
@api.get("/dashboard/summary")
async def dashboard_summary(user_id: str = Depends(get_current_user_id)):
    projects_count = await db.projects.count_documents({"user_id": user_id})
    audits_count = await db.audits.count_documents({"user_id": user_id})
    # avg score of latest audit per project
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


@api.get("/")
async def root():
    return {"service": "Goodly API", "status": "ok"}


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

    host = str(request.base_url)
    stripe = make_stripe(host)
    try:
        status = await stripe.get_checkout_status(session_id)
    except Exception as e:
        logger.exception("Stripe status fetch failed")
        raise HTTPException(status_code=502, detail=f"Could not check status: {e}")

    update = {
        "status": status.status,
        "payment_status": status.payment_status,
        "updated_at": now_iso(),
    }
    await db.payment_transactions.update_one({"session_id": session_id}, {"$set": update})

    # Apply upgrade exactly once and capture stripe customer id (best-effort)
    if status.payment_status == "paid" and not tx.get("applied"):
        customer_id = None
        try:
            stripe_sdk.api_key = os.environ.get("STRIPE_API_KEY")
            session_obj = await asyncio.to_thread(
                stripe_sdk.checkout.Session.retrieve, session_id
            )
            customer_id = session_obj.get("customer") if isinstance(session_obj, dict) else getattr(session_obj, "customer", None)
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
    """Create a Stripe Customer Portal session so the user can self-manage billing."""
    customer_id = user.get("stripe_customer_id")
    if not customer_id:
        # Try to recover from latest paid transaction
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
    host = str(request.base_url)
    stripe = make_stripe(host)
    try:
        evt = await stripe.handle_webhook(body, sig)
    except Exception as e:
        logger.warning("webhook handle failed: %s", e)
        return {"received": False}

    if evt.payment_status == "paid" and evt.session_id:
        tx = await db.payment_transactions.find_one({"session_id": evt.session_id})
        if tx and not tx.get("applied"):
            await db.users.update_one(
                {"id": tx["user_id"]},
                {"$set": {"plan": tx["plan_id"], "plan_started_at": now_iso()}},
            )
            await db.payment_transactions.update_one(
                {"session_id": evt.session_id},
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
    schedule: str  # 'off' | 'monthly'


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
# Scheduled audits — manual trigger + history
# ---------------------------------------------------------------
@api.post("/scheduler/run-now")
async def scheduler_run_now(request: Request, user: dict = Depends(get_current_user_doc)):
    """Manually run all due scheduled audits. Admins only."""
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

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def on_startup():
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

    # Backfill plan/onboarded on legacy users
    await db.users.update_many({"plan": {"$exists": False}}, {"$set": {"plan": "free"}})
    await db.users.update_many({"onboarded": {"$exists": False}}, {"$set": {"onboarded": False}})

    # Seed admin + demo user (both on Concierge so testers can exercise all features)
    seeds = [
        {"email": os.environ.get("ADMIN_EMAIL", "admin@goodly.app"),
         "password": os.environ.get("ADMIN_PASSWORD", "admin123"),
         "name": "Admin", "role": "admin", "plan": "concierge"},
        {"email": "demo@smallbiz.com", "password": "demo1234", "name": "Demo Owner", "role": "user", "plan": "concierge"},
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
            # ensure existing seeds have plan set
            await db.users.update_one(
                {"email": s["email"]},
                {"$set": {"plan": existing.get("plan") or s["plan"], "onboarded": True}},
            )
    logger.info("Startup complete. Seeded users (if missing).")

    # Start hourly scheduler for due audits
    scheduler_mod.start(db, lambda: _state.get("base_url") or "http://localhost:8001")


@app.on_event("shutdown")
async def on_shutdown():
    scheduler_mod.shutdown()
    client.close()


# Capture the live external base URL (set by /api/scheduler/run-now or any request)
_state: dict = {}


def _store_base_url(request: Request) -> str:
    base = str(request.base_url).rstrip("/")
    _state["base_url"] = base
    return base


@app.middleware("http")
async def _capture_base_url(request: Request, call_next):
    _store_base_url(request)
    return await call_next(request)
