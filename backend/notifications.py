"""Proactive notification service for Goodly.

Sends email alerts for:
- Weekly SEO digest (score changes, new issues, top recommendations)
- Rank change alerts (keyword moved up/down significantly)
- Competitor alerts (new competitor appeared, competitor outranking you)
- Audit reminders (scheduled audit completed, time to re-audit)
"""
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

from database import db
import email_service

logger = logging.getLogger("notifications")


async def send_weekly_digest(user_id: str, base_url: str) -> dict:
    """Generate and send a weekly SEO digest email for a user.

    Includes: current scores, changes from last week, top issues, recommendations.
    """
    user = await db.users.find_one({"id": user_id})
    if not user:
        return {"skipped": "user_not_found"}

    # Get latest audit
    latest = await db.audits.find_one(
        {"user_id": user_id},
        sort=[("created_at", -1)],
    )
    if not latest:
        return {"skipped": "no_audits"}

    # Get previous week's audit for comparison
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    previous = await db.audits.find_one(
        {"user_id": user_id, "created_at": {"$lt": week_ago}},
        sort=[("created_at", -1)],
    )

    current_score = (latest.get("result") or {}).get("overall_score", 0)
    prev_score = (previous.get("result") or {}).get("overall_score") if previous else None
    score_delta = current_score - prev_score if prev_score else None

    # Get top issues
    issues = (latest.get("result") or {}).get("issues") or []
    critical = [i for i in issues if i.get("severity") == "high"][:3]

    # Get AI recommendations
    recs = latest.get("ai_recommendations") or {}
    priority = recs.get("priority_actions", [])[:3]

    # Build email
    name = user.get("name", "there")
    subject = f"Your weekly SEO digest — {current_score}/100"
    html = email_service.weekly_digest_html(
        name=name,
        current_score=current_score,
        prev_score=prev_score,
        score_delta=score_delta,
        critical_issues=critical,
        priority_actions=priority,
        audit_url=f"{base_url}/app/audits/{latest['id']}",
    )

    try:
        await email_service.send_html_email(
            to=user["email"],
            subject=subject,
            html=html,
        )
        return {"sent": True, "score": current_score}
    except Exception as e:
        logger.warning("Weekly digest email failed for %s: %s", user_id, e)
        return {"sent": False, "error": str(e)[:200]}


async def send_rank_change_alert(
    user_id: str,
    keyword: str,
    old_rank: Optional[int],
    new_rank: int,
    base_url: str,
) -> dict:
    """Alert user when a tracked keyword changes position significantly."""
    user = await db.users.find_one({"id": user_id})
    if not user:
        return {"skipped": "user_not_found"}

    # Only alert on significant changes (3+ positions)
    if old_rank and abs(new_rank - old_rank) < 3:
        return {"skipped": "insignificant_change"}

    name = user.get("name", "there")
    direction = "up" if (old_rank and new_rank < old_rank) or not old_rank else "down"
    emoji = "🚀" if direction == "up" else "📉"

    subject = f"{emoji} '{keyword}' moved {direction} to position #{new_rank}"
    html = email_service.keyword_rank_change_html(
        name=name,
        keyword=keyword,
        old_rank=old_rank,
        new_rank=new_rank,
        direction=direction,
        serp_url=f"{base_url}/app/serp",
    )

    try:
        await email_service.send_html_email(
            to=user["email"],
            subject=subject,
            html=html,
        )
        return {"sent": True, "keyword": keyword, "new_rank": new_rank}
    except Exception as e:
        logger.warning("Rank change alert failed for %s: %s", user_id, e)
        return {"sent": False, "error": str(e)[:200]}


async def send_competitor_alert(
    user_id: str,
    competitor_name: str,
    competitor_score: int,
    your_score: int,
    base_url: str,
) -> dict:
    """Alert user when a competitor is outranking them."""
    user = await db.users.find_one({"id": user_id})
    if not user:
        return {"skipped": "user_not_found"}

    name = user.get("name", "there")
    gap = competitor_score - your_score

    subject = f"⚠️ {competitor_name} is outranking you by {gap} points"
    html = email_service.competitor_alert_html(
        name=name,
        competitor_name=competitor_name,
        competitor_score=competitor_score,
        your_score=your_score,
        gap=gap,
        competitors_url=f"{base_url}/app/competitors",
    )

    try:
        await email_service.send_html_email(
            to=user["email"],
            subject=subject,
            html=html,
        )
        return {"sent": True, "competitor": competitor_name, "gap": gap}
    except Exception as e:
        logger.warning("Competitor alert failed for %s: %s", user_id, e)
        return {"sent": False, "error": str(e)[:200]}


async def send_audit_reminder(user_id: str, base_url: str) -> dict:
    """Remind user to re-audit if it's been more than 30 days."""
    user = await db.users.find_one({"id": user_id})
    if not user:
        return {"skipped": "user_not_found"}

    latest = await db.audits.find_one(
        {"user_id": user_id},
        sort=[("created_at", -1)],
    )
    if not latest:
        return {"skipped": "no_audits"}

    last_audit_date = latest.get("created_at", "")
    try:
        last_date = datetime.fromisoformat(last_audit_date.replace("Z", "+00:00"))
        days_since = (datetime.now(timezone.utc) - last_date).days
    except Exception:
        return {"skipped": "invalid_date"}

    if days_since < 30:
        return {"skipped": f"only_{days_since}_days"}

    name = user.get("name", "there")
    subject = f"It's been {days_since} days since your last SEO audit"
    html = email_service.audit_reminder_html(
        name=name,
        days_since=days_since,
        last_score=(latest.get("result") or {}).get("overall_score", 0),
        audit_url=f"{base_url}/app/audit",
    )

    try:
        await email_service.send_html_email(
            to=user["email"],
            subject=subject,
            html=html,
        )
        return {"sent": True, "days_since": days_since}
    except Exception as e:
        logger.warning("Audit reminder failed for %s: %s", user_id, e)
        return {"sent": False, "error": str(e)[:200]}


async def run_daily_notifications(db, base_url: str) -> dict:
    """Run all daily notification checks for all users with scheduled audits.

    Called by the scheduler. Processes users in batches to avoid overload.
    """
    summary = {"digests": 0, "reminders": 0, "errors": 0}

    # Get users with scheduled audits enabled
    projects = await db.projects.find(
        {"schedule": {"$ne": "off"}},
        {"user_id": 1},
    ).to_list(1000)

    user_ids = list(set(p["user_id"] for p in projects))

    for uid in user_ids[:50]:  # Limit to 50 per run
        try:
            result = await send_audit_reminder(uid, base_url)
            if result.get("sent"):
                summary["reminders"] += 1
        except Exception as e:
            logger.warning("Notification for %s failed: %s", uid, e)
            summary["errors"] += 1

    return summary
