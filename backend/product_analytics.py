"""Lightweight product analytics for Goodly.

Tracks key events and provides *event-stream* funnel metrics.
Stores events in MongoDB with TTL-based retention.

This module is distinct from ``analytics.py`` (business BI over users/audits
collections, used by ``/api/admin/analytics/*``). Overlapping names were
renamed here (``get_event_*``) so callers cannot confuse the two APIs.

Events tracked:
  - page_view: user visits a page
  - signup: new user registration
  - audit_run: user runs an audit (public or authenticated)
  - upgrade: user upgrades plan
  - feature_use: user uses a specific feature
"""

import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

logger = logging.getLogger("product_analytics")


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def track_event(
    db,
    *,
    event: str,
    user_id: Optional[str] = None,
    properties: Optional[dict] = None,
    session_id: Optional[str] = None,
) -> None:
    """Track an analytics event. Non-blocking — failures are logged and swallowed."""
    try:
        doc = {
            "id": str(uuid.uuid4()),
            "event": event,
            "user_id": user_id,
            "session_id": session_id,
            "properties": properties or {},
            "created_at": _now_iso(),
        }
        await db.analytics_events.insert_one(doc)
    except Exception as e:
        logger.debug("Analytics event dropped: %s", e)


async def get_event_funnel_metrics(db, *, days: int = 30) -> dict:
    """Conversion funnel from ``analytics_events`` (not user/audit collections).

    Prefer ``analytics.get_funnel_metrics`` for admin BI over signups/audits/plans.
    """
    since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

    visitors = await db.analytics_events.count_documents({
        "event": "page_view",
        "created_at": {"$gte": since},
    })

    audit_runs = await db.analytics_events.count_documents({
        "event": "audit_run",
        "created_at": {"$gte": since},
    })

    signups = await db.analytics_events.count_documents({
        "event": "signup",
        "created_at": {"$gte": since},
    })

    upgrades = await db.analytics_events.count_documents({
        "event": "upgrade",
        "created_at": {"$gte": since},
    })

    pipeline = [
        {"$match": {"event": "signup", "created_at": {"$gte": since}}},
        {"$group": {"_id": "$user_id"}},
        {"$count": "count"},
    ]
    unique_signups = 0
    try:
        result = await db.analytics_events.aggregate(pipeline).to_list(1)
        unique_signups = result[0]["count"] if result else 0
    except Exception:
        logger.debug("Analytics event dropped — non-critical")

    return {
        "period_days": days,
        "visitors": visitors,
        "audit_runs": audit_runs,
        "signups": signups,
        "unique_signups": unique_signups,
        "upgrades": upgrades,
        "conversion_rates": {
            "visitor_to_audit": round(audit_runs / visitors * 100, 1) if visitors > 0 else 0,
            "audit_to_signup": round(signups / audit_runs * 100, 1) if audit_runs > 0 else 0,
            "signup_to_upgrade": round(upgrades / signups * 100, 1) if signups > 0 else 0,
        },
    }


# Back-compat alias — prefer get_event_funnel_metrics.
get_funnel_metrics = get_event_funnel_metrics


async def get_event_feature_adoption(db, *, days: int = 30) -> dict:
    """Feature usage from ``analytics_events.feature_use`` (event stream).

    Prefer ``analytics.get_feature_adoption`` for collection-based adoption BI.
    """
    since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

    features = [
        "audit_run", "serp_track", "competitor_analysis",
        "social_audit", "ai_visibility", "gbp_audit",
        "pdf_export", "scheduled_audit",
    ]

    adoption = {}
    for feature in features:
        count = await db.analytics_events.count_documents({
            "event": "feature_use",
            "properties.feature": feature,
            "created_at": {"$gte": since},
        })
        adoption[feature] = count

    return {"period_days": days, "feature_usage": adoption}


get_feature_adoption = get_event_feature_adoption


async def get_event_daily_metrics(db, *, days: int = 30) -> dict:
    """Daily event counts from ``analytics_events``.

    Prefer ``analytics.get_daily_metrics`` for signup/audit daily BI.
    """
    since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

    pipeline = [
        {"$match": {"created_at": {"$gte": since}}},
        {"$group": {
            "_id": {
                "date": {"$substr": ["$created_at", 0, 10]},
                "event": "$event",
            },
            "count": {"$sum": 1},
        }},
        {"$sort": {"_id.date": 1}},
    ]

    try:
        rows = await db.analytics_events.aggregate(pipeline).to_list(500)
    except Exception:
        rows = []

    daily = {}
    for row in rows:
        date = row["_id"]["date"]
        event = row["_id"]["event"]
        if date not in daily:
            daily[date] = {}
        daily[date][event] = row["count"]

    return {"period_days": days, "daily": daily}


get_daily_metrics = get_event_daily_metrics


async def get_mrr_estimate(db) -> dict:
    """Estimate MRR from user plans (lightweight; admin BI uses ``analytics.get_mrr``)."""
    pipeline = [
        {"$group": {
            "_id": "$plan",
            "count": {"$sum": 1},
        }},
    ]
    try:
        rows = await db.users.aggregate(pipeline).to_list(10)
    except Exception:
        rows = []

    plan_prices = {"free": 0, "starter": 49, "pro": 149, "concierge": 1000}
    mrr = 0
    plan_counts = {}
    for row in rows:
        plan = row["_id"] or "free"
        count = row["count"]
        plan_counts[plan] = count
        mrr += plan_prices.get(plan, 0) * count

    return {
        "estimated_mrr": mrr,
        "plan_distribution": plan_counts,
        "total_users": sum(plan_counts.values()),
    }
