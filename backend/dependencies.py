"""Shared dependencies and helpers for Goodly API route modules.

Extracted from server.py to avoid circular imports and keep routes thin.
"""
import os
import uuid
from datetime import datetime, timezone

from fastapi import HTTPException, Depends, Request

from auth import get_current_user_id
from billing import get_plan, month_key
from database import db
from cache import dashboard_cache


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


def _invalidate_dashboard_cache(user_id: str) -> None:
    """Clear cached dashboard data for a user after mutations."""
    dashboard_cache.delete(f"summary:{user_id}")
    dashboard_cache.delete(f"achievements:{user_id}")
    dashboard_cache.delete(f"visibility:{user_id}")
    dashboard_cache.delete(f"notifications:{user_id}")


def _store_base_url(request: Request) -> str:
    """Return the frontend base URL for constructing links (e.g., verification).

    Uses FRONTEND_URL in production to avoid leaking the internal
    Cloud Run URL. Falls back to request.base_url for dev.
    """
    frontend_url = os.environ.get("FRONTEND_URL", "")
    if frontend_url:
        return frontend_url.rstrip("/")
    return str(request.base_url).rstrip("/")
