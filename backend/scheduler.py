"""APScheduler-driven background worker for due scheduled audits.

Runs hourly. For each project with schedule='monthly' whose next_audit_at <= now,
it runs an audit, advances next_audit_at by 30 days, and emails a digest.
Email is sent via Resend (or mocked if RESEND_API_KEY is empty).
"""
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

    # Check for rank changes and send alerts
    if prev_score is not None:
        score_delta = (result.get("overall_score") or 0) - prev_score
        if abs(score_delta) >= 5:
            try:
                direction = "up" if score_delta > 0 else "down"
                emoji = "🎉" if score_delta > 0 else "⚠️"
                await email_service.send_html_email(
                    to=user["email"],
                    subject=f"{emoji} Your SEO score {direction} by {abs(score_delta)} points — {project['name']}",
                    html=email_service.rank_change_html(
                        name=(user.get("name") or user["email"].split("@")[0]),
                        project_name=project["name"],
                        score_delta=score_delta,
                        current_score=result.get("overall_score") or 0,
                        audit_url=f"{base_url.rstrip('/')}/app/audits/{audit_id}",
                    ),
                )
                # Create in-app notification
                await db.notifications.insert_one({
                    "id": str(uuid.uuid4()),
                    "user_id": user["id"],
                    "type": "rank_up" if score_delta > 0 else "rank_down",
                    "title": f"Score {direction} by {abs(score_delta)} points",
                    "body": f"{project['name']} went from {prev_score} to {result.get('overall_score') or 0}.",
                    "read": False,
                    "created_at": _iso(_now()),
                })
            except Exception:
                pass  # Non-critical

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
        # Run daily notifications (only once per day, at ~2am UTC)
        try:
            now = datetime.now(timezone.utc)
            if now.hour == 2:
                from notifications import run_daily_notifications
                await run_daily_notifications(db, base_url_provider())
                # Run trial-end checks
                await _check_trial_end_notifications(db, base_url_provider())
                # Run re-engagement emails for inactive users
                await _send_reengagement_emails(db, base_url_provider())
                # Run monthly ROI reports (1st of month)
                if now.day == 1:
                    await _send_monthly_roi_reports(db, base_url_provider())
        except Exception:
            logger.exception("daily notifications crashed")

    # Hourly
    sched.add_job(tick, "interval", hours=1, id="scheduled_audits_hourly",
                  next_run_time=datetime.now(timezone.utc) + timedelta(minutes=2))
    sched.start()
    _scheduler = sched
    logger.info("Scheduler started — runs every hour")
    return sched


def get_scheduler() -> Optional[AsyncIOScheduler]:
    """Return the running scheduler instance (or None if not started)."""
    return _scheduler


def shutdown():
    global _scheduler
    if _scheduler:
        _scheduler.shutdown(wait=False)
        _scheduler = None


async def _check_trial_end_notifications(db, base_url: str) -> None:
    """Check for users whose trial is ending soon or has ended, and notify them.

    Only users explicitly flagged `on_trial: True` are considered. Matching on
    plan_started_at age alone would send "trial ending/expired" emails to every
    long-term paid subscriber.
    """
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()

    trial_users = await db.users.find({
        "plan": {"$nin": ["free", None]},
        "plan_started_at": {"$ne": None},
        "on_trial": True,
    }).to_list(1000)

    for user in trial_users:
        try:
            plan_started = user.get("plan_started_at", "")
            if not plan_started:
                continue

            started = datetime.fromisoformat(plan_started.replace("Z", "+00:00"))
            days_on_plan = (now - started).days
            plan = user.get("plan", "starter")
            plan_name = plan.capitalize()
            name = user.get("name") or user["email"].split("@")[0]
            billing_url = f"{base_url.rstrip('/')}/app/billing"

            # Trial ending in 2 days (day 5 of 7-day trial)
            if days_on_plan == 5:
                trial_end_notified = user.get("trial_end_notified")
                if not trial_end_notified:
                    html = email_service.trial_ending_html(
                        name=name, plan_name=plan_name,
                        days_left=2, billing_url=billing_url,
                    )
                    await email_service.send_html_email(
                        to=user["email"],
                        subject=f"Your {plan_name} trial ends in 2 days",
                        html=html,
                    )
                    await db.users.update_one(
                        {"id": user["id"]},
                        {"$set": {"trial_end_notified": now_iso}},
                    )
                    logger.info("Trial ending notification sent to %s", user["email"])

            # Trial expired (day 7+)
            if days_on_plan >= 7:
                trial_expired_notified = user.get("trial_expired_notified")
                if not trial_expired_notified:
                    html = email_service.trial_expired_html(
                        name=name, plan_name=plan_name,
                        billing_url=billing_url,
                    )
                    await email_service.send_html_email(
                        to=user["email"],
                        subject=f"Your {plan_name} trial has ended",
                        html=html,
                    )
                    await db.users.update_one(
                        {"id": user["id"]},
                        {"$set": {"trial_expired_notified": now_iso}},
                    )
                    logger.info("Trial expired notification sent to %s", user["email"])

        except Exception as e:
            logger.warning("Trial check failed for %s: %s", user.get("email"), e)


async def _send_monthly_roi_reports(db, base_url: str) -> None:
    """Send monthly ROI reports to all paying users on the 1st of each month."""
    paying_users = await db.users.find({
        "plan": {"$nin": ["free", None]},
    }).to_list(5000)

    for user in paying_users:
        try:
            name = user.get("name") or user["email"].split("@")[0]

            # Get current month's audits
            month = datetime.now(timezone.utc).strftime("%Y-%m")
            audits_this_month = await db.audits.count_documents({
                "user_id": user["id"],
                "month_key": month,
            })

            # Get latest score
            latest = await db.audits.find_one(
                {"user_id": user["id"]},
                sort=[("created_at", -1)],
            )
            current_score = (latest.get("result") or {}).get("overall_score", 0) if latest else 0

            # Get previous month's score for delta
            prev_month = (datetime.now(timezone.utc) - timedelta(days=30)).strftime("%Y-%m")
            prev = await db.audits.find_one(
                {"user_id": user["id"], "month_key": prev_month},
                sort=[("created_at", -1)],
            )
            prev_score = (prev.get("result") or {}).get("overall_score", 0) if prev else current_score
            score_delta = current_score - prev_score

            # Estimate revenue saved (rough: $500 per point improvement)
            estimated_revenue_saved = max(0, score_delta * 500) if score_delta > 0 else 0

            # Count issues fixed (approximate from score improvement)
            issues_fixed = max(0, score_delta // 5)

            html = email_service.monthly_roi_html(
                name=name,
                current_score=current_score,
                score_delta=score_delta,
                estimated_revenue_saved=estimated_revenue_saved,
                audits_run=audits_this_month,
                issues_fixed=issues_fixed,
                dashboard_url=f"{base_url.rstrip('/')}/app",
            )
            await email_service.send_html_email(
                to=user["email"],
                subject=f"📈 Your monthly SEO report — {current_score}/100",
                html=html,
            )
            logger.info("Monthly ROI report sent to %s", user["email"])

        except Exception as e:
            logger.warning("Monthly ROI report failed for %s: %s", user.get("email"), e)


async def _send_reengagement_emails(db, base_url: str) -> None:
    """Send re-engagement emails to users inactive for 14+ days."""
    cutoff = (datetime.now(timezone.utc) - timedelta(days=14)).isoformat()

    # Find users with no recent audits
    active_pipeline = [
        {"$match": {"created_at": {"$gte": cutoff}}},
        {"$group": {"_id": "$user_id"}},
    ]
    active_results = await db.audits.aggregate(active_pipeline).to_list(5000)
    active_ids = {doc["_id"] for doc in active_results}

    # Get all users who signed up more than 14 days ago
    all_users = await db.users.find({
        "created_at": {"$lte": cutoff},
    }).to_list(5000)

    for user in all_users:
        if user["id"] in active_ids:
            continue

        # Check if already notified recently
        last_reengagement = user.get("reengagement_sent_at", "")
        if last_reengagement:
            try:
                last_date = datetime.fromisoformat(last_reengagement.replace("Z", "+00:00"))
                if (datetime.now(timezone.utc) - last_date).days < 30:
                    continue  # Don't spam — once per 30 days
            except Exception:
                pass  # Date parsing is best-effort for re-engagement

        try:
            name = user.get("name") or user["email"].split("@")[0]

            # Get last audit score
            last_audit = await db.audits.find_one(
                {"user_id": user["id"]},
                sort=[("created_at", -1)],
            )
            last_score = (last_audit.get("result") or {}).get("overall_score", 0) if last_audit else 0

            # Calculate days since last audit
            days_inactive = 14
            if last_audit:
                try:
                    last_date = datetime.fromisoformat(
                        last_audit["created_at"].replace("Z", "+00:00")
                    )
                    days_inactive = (datetime.now(timezone.utc) - last_date).days
                except Exception:
                    pass

            html = email_service.reengagement_html(
                name=name,
                days_inactive=days_inactive,
                last_score=last_score,
                dashboard_url=f"{base_url.rstrip('/')}/app",
            )
            await email_service.send_html_email(
                to=user["email"],
                subject=f"We miss you, {name} — your SEO score was {last_score}/100",
                html=html,
            )
            await db.users.update_one(
                {"id": user["id"]},
                {"$set": {"reengagement_sent_at": datetime.now(timezone.utc).isoformat()}},
            )
            logger.info("Re-engagement email sent to %s (%d days inactive)", user["email"], days_inactive)

        except Exception as e:
            logger.warning("Re-engagement email failed for %s: %s", user.get("email"), e)
