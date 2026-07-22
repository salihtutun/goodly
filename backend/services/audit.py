"""Shared audit helpers used by registration and other entry points.

Kept outside server.py so callers can `from services import run_audit`
without circular imports.
"""
from __future__ import annotations

import logging
import uuid
from typing import Optional

from billing import month_key
from database import db
from dependencies import now_iso
from seo_analyzer import analyze_url

logger = logging.getLogger(__name__)


async def run_audit(*, url: str, user_id: str, project_id: Optional[str] = None) -> dict:
    """Fetch + score a URL and persist the audit for the user.

    AI recommendations are skipped here so signup stays fast — owners land
    on the audit detail page immediately and can refresh for AI later.
    """
    result = await analyze_url(url)

    audit_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "project_id": project_id,
        "url": result.get("url", url),
        "created_at": now_iso(),
        "month_key": month_key(),
        "result": result,
        "ai_recommendations": None,
        "revenue_impact": None,
    }
    await db.audits.insert_one(audit_doc)

    if project_id:
        await db.projects.update_one(
            {"id": project_id, "user_id": user_id},
            {"$set": {"last_audit_at": audit_doc["created_at"], "last_score": result.get("overall_score")}},
        )

    audit_doc.pop("_id", None)
    return audit_doc
