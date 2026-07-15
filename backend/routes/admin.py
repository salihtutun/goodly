"""Admin routes — user management, stats, support messages, analytics."""
import logging
from fastapi import APIRouter, HTTPException, Depends, Request, Query
from pydantic import BaseModel
from typing import Optional

from database import db
from dependencies import get_current_user_doc
# Business BI (users/audits/plans) — not product_analytics event-stream helpers.
import analytics
from limiter import limiter

logger = logging.getLogger("seo_framework")
router = APIRouter()


class AdminUserUpdate(BaseModel):
    plan: Optional[str] = None
    role: Optional[str] = None
    name: Optional[str] = None


@router.get("/admin/users")
@limiter.limit("30/minute")
async def admin_list_users(request: Request, user: dict = Depends(get_current_user_doc)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    docs = await db.users.find({}, {"password_hash": 0, "_id": 0}).sort("created_at", -1).to_list(500)
    return docs


@router.get("/admin/stats")
@limiter.limit("30/minute")
async def admin_stats(request: Request, user: dict = Depends(get_current_user_doc)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    total_users = await db.users.count_documents({})
    total_audits = await db.audits.count_documents({})
    total_projects = await db.projects.count_documents({})
    total_support = await db.support_messages.count_documents({})
    total_briefs = await db.concierge_briefs.count_documents({})
    plan_counts = {}
    async for doc in db.users.aggregate([
        {"$group": {"_id": "$plan", "count": {"$sum": 1}}}
    ]):
        plan_counts[doc["_id"] or "free"] = doc["count"]
    role_counts = {}
    async for doc in db.users.aggregate([
        {"$group": {"_id": "$role", "count": {"$sum": 1}}}
    ]):
        role_counts[doc["_id"] or "user"] = doc["count"]
    recent_users = await db.users.find({}, {"password_hash": 0, "_id": 0}).sort("created_at", -1).limit(5).to_list(5)
    return {
        "total_users": total_users,
        "total_audits": total_audits,
        "total_projects": total_projects,
        "total_support_messages": total_support,
        "total_concierge_briefs": total_briefs,
        "plans": plan_counts,
        "roles": role_counts,
        "recent_users": recent_users,
    }


@router.get("/admin/support-messages")
@limiter.limit("30/minute")
async def admin_support_messages(request: Request, user: dict = Depends(get_current_user_doc)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    docs = await db.support_messages.find({}, {"_id": 0}).sort("created_at", -1).limit(100).to_list(100)
    return docs


@router.delete("/admin/users/{user_id}")
@limiter.limit("10/minute")
async def admin_delete_user(request: Request, user_id: str, user: dict = Depends(get_current_user_doc)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    result = await db.users.delete_one({"id": user_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"ok": True, "deleted": user_id}


@router.patch("/admin/users/{user_id}")
@limiter.limit("10/minute")
async def admin_update_user(request: Request, user_id: str, body: AdminUserUpdate, user: dict = Depends(get_current_user_doc)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    update = {k: v for k, v in body.model_dump().items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="No valid fields to update")
    result = await db.users.update_one({"id": user_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    return {"ok": True, "updated": user_id, "fields": list(update.keys())}


# ── Analytics endpoints ────────────────────────────────

@router.get("/admin/analytics/funnel")
@limiter.limit("30/minute")
async def admin_funnel(request: Request, days: int = Query(default=30, ge=1, le=365), user: dict = Depends(get_current_user_doc)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return await analytics.get_funnel_metrics(days)


@router.get("/admin/analytics/mrr")
@limiter.limit("30/minute")
async def admin_mrr(request: Request, user: dict = Depends(get_current_user_doc)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return await analytics.get_mrr()


@router.get("/admin/analytics/churn")
@limiter.limit("30/minute")
async def admin_churn(request: Request, days: int = Query(default=14, ge=1, le=90), user: dict = Depends(get_current_user_doc)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return await analytics.get_churn_indicators(days)


@router.get("/admin/analytics/features")
@limiter.limit("30/minute")
async def admin_features(request: Request, user: dict = Depends(get_current_user_doc)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return await analytics.get_feature_adoption()


@router.get("/admin/analytics/daily")
@limiter.limit("30/minute")
async def admin_daily(request: Request, days: int = Query(default=30, ge=1, le=365), user: dict = Depends(get_current_user_doc)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return await analytics.get_daily_metrics(days)


# ── Setup / bootstrap endpoints ────────────────────────

@router.post("/admin/setup-stripe-products")
@limiter.limit("5/minute")
async def admin_setup_stripe(request: Request, user: dict = Depends(get_current_user_doc)):
    """Create all Stripe products and price IDs. Returns the IDs for Secret Manager."""
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    import stripe as stripe_sdk
    import os

    stripe_sdk.api_key = os.environ.get("STRIPE_API_KEY")
    if not stripe_sdk.api_key:
        raise HTTPException(status_code=500, detail="STRIPE_API_KEY not configured")

    products_config = [
        {"name": "Goodly Starter", "description": "10 audits/month, SERP tracking, PDF reports, Instagram audit", "prices": [
            {"currency": "usd", "unit_amount": 4900, "recurring": {"interval": "month"}, "nickname": "Starter Monthly"},
            {"currency": "usd", "unit_amount": 49000, "recurring": {"interval": "year"}, "nickname": "Starter Annual"},
        ]},
        {"name": "Goodly Pro", "description": "Unlimited audits, all channels, competitor analysis, white-label PDFs", "prices": [
            {"currency": "usd", "unit_amount": 14900, "recurring": {"interval": "month"}, "nickname": "Pro Monthly"},
            {"currency": "usd", "unit_amount": 149000, "recurring": {"interval": "year"}, "nickname": "Pro Annual"},
        ]},
        {"name": "Goodly Concierge", "description": "Done-for-you SEO, dedicated specialist, content writing, backlink outreach", "prices": [
            {"currency": "usd", "unit_amount": 100000, "recurring": {"interval": "month"}, "nickname": "Concierge Monthly"},
        ]},
    ]

    results = []
    for prod_cfg in products_config:
        try:
            existing = stripe_sdk.Product.list(limit=1, active=True, shippable=False)
            product = None
            for p in existing.data:
                if p.name == prod_cfg["name"]:
                    product = p
                    break

            if not product:
                product = stripe_sdk.Product.create(
                    name=prod_cfg["name"],
                    description=prod_cfg["description"],
                    active=True,
                )

            price_ids = {}
            for price_cfg in prod_cfg["prices"]:
                existing_prices = stripe_sdk.Price.list(
                    product=product.id, active=True, limit=5
                )
                price = None
                for ep in existing_prices.data:
                    if ep.nickname == price_cfg["nickname"]:
                        price = ep
                        break

                if not price:
                    price = stripe_sdk.Price.create(
                        product=product.id,
                        currency=price_cfg["currency"],
                        unit_amount=price_cfg["unit_amount"],
                        recurring=price_cfg["recurring"],
                        nickname=price_cfg["nickname"],
                    )

                price_ids[price_cfg["nickname"]] = price.id

            results.append({
                "product": prod_cfg["name"],
                "product_id": product.id,
                "price_ids": price_ids,
            })

        except Exception as e:
            results.append({
                "product": prod_cfg["name"],
                "error": str(e)[:300],
            })

    env_mapping = {}
    for r in results:
        if "price_ids" in r:
            pids = r["price_ids"]
            if "Starter Monthly" in pids:
                env_mapping["STRIPE_PRICE_ID_STARTER"] = pids["Starter Monthly"]
            if "Starter Annual" in pids:
                env_mapping["STRIPE_PRICE_ID_STARTER_ANNUAL"] = pids["Starter Annual"]
            if "Pro Monthly" in pids:
                env_mapping["STRIPE_PRICE_ID_PRO"] = pids["Pro Monthly"]
            if "Pro Annual" in pids:
                env_mapping["STRIPE_PRICE_ID_PRO_ANNUAL"] = pids["Pro Annual"]
            if "Concierge Monthly" in pids:
                env_mapping["STRIPE_PRICE_ID_CONCIERGE"] = pids["Concierge Monthly"]

    return {
        "ok": True,
        "results": results,
        "env_vars_to_set": env_mapping,
        "instructions": "Add these to Google Secret Manager or cloudrun-env.yaml and redeploy.",
    }
