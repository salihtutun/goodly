"""Analytics service for Goodly — user behavior, conversion funnel, cohorts, MRR.

Admin-facing business intelligence over users/audits/plans collections
(``/api/admin/analytics/*``). Distinct from ``product_analytics`` which
tracks discrete events into ``analytics_events``.
"""
import logging
from datetime import datetime, timezone, timedelta

from database import db

logger = logging.getLogger("analytics")


async def get_funnel_metrics(days: int = 30) -> dict:
    """Get user acquisition funnel: landing → signup → first audit → upgrade.

    Args:
        days: Lookback window in days.

    Returns:
        Dict with funnel stages and conversion rates.
    """
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

    # Stage 1: Total signups in period
    total_signups = await db.users.count_documents({"created_at": {"$gte": cutoff}})

    # Stage 2: Users who ran at least one audit
    users_with_audits_pipeline = [
        {"$match": {"created_at": {"$gte": cutoff}}},
        {"$group": {"_id": "$user_id"}},
        {"$count": "count"},
    ]
    audit_result = await db.audits.aggregate(users_with_audits_pipeline).to_list(1)
    users_with_audits = audit_result[0]["count"] if (audit_result and len(audit_result) > 0 and "count" in audit_result[0]) else 0

    # Stage 3: Users who upgraded from free
    upgraded_users = await db.users.count_documents({
        "created_at": {"$gte": cutoff},
        "plan": {"$ne": "free"},
    })

    # Stage 4: Users who submitted concierge briefs
    concierge_users = await db.concierge_briefs.count_documents({
        "created_at": {"$gte": cutoff},
    })

    return {
        "period_days": days,
        "cutoff": cutoff,
        "funnel": {
            "signups": total_signups,
            "ran_audit": users_with_audits,
            "upgraded": upgraded_users,
            "concierge": concierge_users,
        },
        "conversion_rates": {
            "signup_to_audit": round(users_with_audits / total_signups * 100, 1) if total_signups else 0,
            "audit_to_upgrade": round(upgraded_users / users_with_audits * 100, 1) if users_with_audits else 0,
            "signup_to_upgrade": round(upgraded_users / total_signups * 100, 1) if total_signups else 0,
        },
    }


async def get_mrr() -> dict:
    """Calculate Monthly Recurring Revenue from plan distribution."""
    plan_prices = {
        "free": 0,
        "starter": 49,
        "pro": 149,
        "concierge": 1000,
    }

    pipeline = [
        {"$group": {"_id": "$plan", "count": {"$sum": 1}}},
    ]
    results = await db.users.aggregate(pipeline).to_list(10)

    mrr = 0
    plan_breakdown = {}
    total_paying = 0

    for doc in results:
        plan = doc["_id"] or "free"
        count = doc["count"]
        price = plan_prices.get(plan, 0)
        revenue = count * price
        mrr += revenue
        plan_breakdown[plan] = {
            "users": count,
            "price_per_user": price,
            "revenue": revenue,
        }
        if plan != "free":
            total_paying += count

    return {
        "mrr": mrr,
        "arr": mrr * 12,
        "total_users": sum(d["users"] for d in plan_breakdown.values()),
        "total_paying_users": total_paying,
        "arpu": round(mrr / total_paying, 2) if total_paying else 0,
        "plan_breakdown": plan_breakdown,
    }


async def get_churn_indicators(days_inactive: int = 14) -> dict:
    """Identify users at risk of churning (no activity for N days)."""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days_inactive)).isoformat()

    # Users who haven't logged in recently (approximated by no recent audits)
    active_user_ids_pipeline = [
        {"$match": {"created_at": {"$gte": cutoff}}},
        {"$group": {"_id": "$user_id"}},
    ]
    active_results = await db.audits.aggregate(active_user_ids_pipeline).to_list(1000)
    active_ids = {doc["_id"] for doc in active_results}

    # Also check social, GBP, AI visibility activity
    for collection in [db.social_audits, db.gbp_audits, db.ai_visibility_checks]:
        results = await collection.aggregate([
            {"$match": {"created_at": {"$gte": cutoff}}},
            {"$group": {"_id": "$user_id"}},
        ]).to_list(1000)
        active_ids.update(doc["_id"] for doc in results)

    # All paying users
    paying_users = await db.users.find(
        {"plan": {"$ne": "free"}},
        {"_id": 0, "id": 1, "email": 1, "name": 1, "plan": 1, "created_at": 1},
    ).to_list(5000)

    at_risk = []
    for user in paying_users:
        if user["id"] not in active_ids:
            at_risk.append({
                "user_id": user["id"],
                "email": user["email"],
                "name": user.get("name", ""),
                "plan": user.get("plan", "free"),
                "days_inactive": days_inactive,
            })

    return {
        "total_paying_users": len(paying_users),
        "at_risk_count": len(at_risk),
        "at_risk_rate": round(len(at_risk) / len(paying_users) * 100, 1) if paying_users else 0,
        "days_inactive_threshold": days_inactive,
        "at_risk_users": at_risk[:50],  # Limit to 50 for response size
    }


async def get_feature_adoption() -> dict:
    """Get feature adoption metrics across all users."""
    total_users = await db.users.count_documents({})

    features = {
        "seo_audit": db.audits,
        "social_audit": db.social_audits,
        "gbp_audit": db.gbp_audits,
        "ai_visibility": db.ai_visibility_checks,
        "serp_tracking": db.serp_checks,
        "ai_tools": db.ai_history,
        "concierge": db.concierge_briefs,
        "referrals": None,  # referrals collection not yet created
    }

    adoption = {}
    for name, collection in features.items():
        if collection is None:
            adoption[name] = {"users": 0, "adoption_pct": 0}
            continue
        pipeline = [
            {"$group": {"_id": "$user_id"}},
            {"$count": "count"},
        ]
        result = await collection.aggregate(pipeline).to_list(1)
        count = result[0]["count"] if (result and len(result) > 0 and "count" in result[0]) else 0
        adoption[name] = {
            "users": count,
            "adoption_pct": round(count / total_users * 100, 1) if total_users else 0,
        }

    return {
        "total_users": total_users,
        "features": adoption,
    }


async def get_daily_metrics(days: int = 30) -> dict:
    """Get daily signup and audit counts for the last N days."""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

    # Daily signups
    signup_pipeline = [
        {"$match": {"created_at": {"$gte": cutoff}}},
        {"$group": {
            "_id": {"$substr": ["$created_at", 0, 10]},
            "count": {"$sum": 1},
        }},
        {"$sort": {"_id": 1}},
    ]
    signups = await db.users.aggregate(signup_pipeline).to_list(100)
    signup_by_day = {doc["_id"]: doc["count"] for doc in signups}

    # Daily audits
    audit_pipeline = [
        {"$match": {"created_at": {"$gte": cutoff}}},
        {"$group": {
            "_id": {"$substr": ["$created_at", 0, 10]},
            "count": {"$sum": 1},
        }},
        {"$sort": {"_id": 1}},
    ]
    audits = await db.audits.aggregate(audit_pipeline).to_list(100)
    audit_by_day = {doc["_id"]: doc["count"] for doc in audits}

    # Build daily array
    daily = []
    for i in range(days):
        day = (datetime.now(timezone.utc) - timedelta(days=days - 1 - i)).strftime("%Y-%m-%d")
        daily.append({
            "date": day,
            "signups": signup_by_day.get(day, 0),
            "audits": audit_by_day.get(day, 0),
        })

    return {
        "period_days": days,
        "daily": daily,
        "totals": {
            "signups": sum(d["signups"] for d in daily),
            "audits": sum(d["audits"] for d in daily),
        },
    }
