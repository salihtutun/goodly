"""APScheduler-driven background worker for due scheduled audits.

Runs hourly. For each project with schedule='monthly' whose next_audit_at <= now,
it runs an audit, advances next_audit_at by 30 days, and emails a digest.
Email is sent via Resend (or mocked if RESEND_API_KEY is empty).
"""
import asyncio
import logging
import os
import uuid
from datetime import datetime, timezone, timedelta
from typing import Optional

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from seo_analyzer import analyze_url
import ai_service
import email_service


logger = logging.getLogger("scheduler")
_scheduler: Optional[AsyncIOScheduler] = None


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _iso(d: datetime) -> str:
    return d.isoformat()


async def _previous_score(db, project_id: str) -> Optional[int]:
    last = await db.audits.find(
        {"project_id": project_id},
        {"result.overall_score": 1, "created_at": 1},
    ).sort("created_at", -1).limit(1).to_list(1)
    if not last:
        return None
    return (last[0].get("result") or {}).get("overall_score")


async def _run_one_scheduled_audit(db, project: dict, base_url: str) -> dict:
    user = await db.users.find_one({"id": project["user_id"]})
    if not user:
        return {"skipped": "user_not_found"}

    prev_score = await _previous_score(db, project["id"])
    result = await analyze_url(project["url"])

    ai_recs = None
    if not result.get("fetch_failed"):
        try:
            ai_recs = await ai_service.audit_recommendations(result)
        except Exception as e:
            logger.warning("scheduled AI recs failed: %s", e)
            ai_recs = None

    audit_id = str(uuid.uuid4())
    audit_doc = {
        "id": audit_id,
        "user_id": user["id"],
        "project_id": project["id"],
        "url": result.get("url", project["url"]),
        "created_at": _iso(_now()),
        "month_key": _now().strftime("%Y-%m"),
        "result": result,
        "ai_recommendations": ai_recs,
        "source": "scheduled",
    }
    await db.audits.insert_one(audit_doc)

    next_at = _now() + timedelta(days=30)
    await db.projects.update_one(
        {"id": project["id"]},
        {"$set": {
            "last_audit_at": audit_doc["created_at"],
            "last_score": result.get("overall_score"),
            "next_audit_at": _iso(next_at),
        }},
    )

    # Send digest email
    email_log = {"sent": False, "mocked": True, "error": None}
    if not result.get("fetch_failed"):
        try:
            html = email_service.audit_digest_html(
                name=(user.get("name") or user["email"].split("@")[0]),
                project_name=project["name"],
                url=project["url"],
                overall_score=result.get("overall_score", 0) or 0,
                prev_score=prev_score,
                top_issues=result.get("issues") or [],
                audit_url=f"{base_url.rstrip('/')}/app/audits/{audit_id}",
            )
            send = await email_service.send_html_email(
                to=user["email"],
                subject=f"Your monthly SEO check — {project['name']}",
                html=html,
            )
            email_log = {"sent": not send.get("mocked") and not send.get("error"),
                         "mocked": send.get("mocked"), "error": send.get("error"),
                         "id": send.get("id")}
        except Exception as e:
            logger.exception("email send failed")
            email_log = {"sent": False, "mocked": False, "error": str(e)[:200]}

    await db.scheduled_runs.insert_one({
        "id": str(uuid.uuid4()),
        "project_id": project["id"],
        "audit_id": audit_id,
        "user_id": user["id"],
        "run_at": _iso(_now()),
        "next_at": _iso(next_at),
        "score": result.get("overall_score"),
        "email": email_log,
    })

    return {"audit_id": audit_id, "score": result.get("overall_score"), "email": email_log}


async def run_due_audits(db, base_url: str) -> dict:
    """Find projects whose next_audit_at <= now and run them. Returns a small summary."""
    now_iso = _iso(_now())
    cursor = db.projects.find({
        "schedule": "monthly",
        "next_audit_at": {"$lte": now_iso, "$ne": None},
    })
    due = await cursor.to_list(200)
    logger.info("Scheduler tick: %d due project(s)", len(due))

    summary = {"due": len(due), "ran": 0, "failures": 0}
    for project in due:
        try:
            await _run_one_scheduled_audit(db, project, base_url)
            summary["ran"] += 1
        except Exception:
            logger.exception("scheduled run failed for project %s", project.get("id"))
            summary["failures"] += 1
            # Advance next_audit_at even on failure to prevent infinite retry loop
            from datetime import timedelta as _td
            next_at = _now() + _td(days=30)
            await db.projects.update_one(
                {"id": project["id"]},
                {"$set": {"next_audit_at": _iso(next_at)}},
            )
    return summary


def start(db, base_url_provider) -> AsyncIOScheduler:
    """Start the hourly scheduler. base_url_provider is a callable returning the public base URL."""
    global _scheduler
    if _scheduler is not None:
        return _scheduler
    if os.environ.get("SCHEDULER_ENABLED", "true").lower() not in ("1", "true", "yes"):
        logger.info("Scheduler disabled by SCHEDULER_ENABLED env var")
        return None

    sched = AsyncIOScheduler(timezone="UTC")

    async def tick():
        try:
            await run_due_audits(db, base_url_provider())
        except Exception:
            logger.exception("scheduler tick crashed")

    # Hourly
    sched.add_job(tick, "interval", hours=1, id="scheduled_audits_hourly",
                  next_run_time=datetime.now(timezone.utc) + timedelta(minutes=2))
    sched.start()
    _scheduler = sched
    logger.info("Scheduler started — runs every hour")
    return sched


def shutdown():
    global _scheduler
    if _scheduler:
        _scheduler.shutdown(wait=False)
        _scheduler = None
