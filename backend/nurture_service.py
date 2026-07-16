"""Nurture email sequence for public audit leads.

Schedules a 3-email drip:
  - Email 1 (immediate): Here's what we found
  - Email 2 (day 2): 3 quick fixes
  - Email 3 (day 5): What Pro users get + social proof

Uses APScheduler to schedule future emails. Falls back gracefully
if scheduler isn't running (emails are logged but not sent).
"""
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Optional

logger = logging.getLogger("nurture_service")


async def schedule_nurture_sequence(
    *,
    email: str,
    score: int,
    issues_count: int,
    top_issue: str,
    issues: List[dict],
    frontend_url: Optional[str] = None,
) -> dict:
    """Schedule the 3-email nurture sequence for a public audit lead.

    Email 1 is sent immediately. Emails 2 and 3 are scheduled for
    +2 days and +5 days respectively.
    """
    import os
    from email_service import (
        nurture_email_1_html,
        send_html_email,
    )

    base_url = frontend_url or os.environ.get("FRONTEND_URL", "http://localhost:3000")
    audit_url = f"{base_url}/audit"
    signup_url = f"{base_url}/register"

    name = email.split("@")[0]

    # Email 1: Send immediately
    try:
        html1 = nurture_email_1_html(
            name=name,
            score=score,
            issues_count=issues_count,
            top_issue=top_issue,
            audit_url=audit_url,
        )
        result1 = await send_html_email(
            to=email,
            subject=f"Your website scored {score}/100 — see what to fix",
            html=html1,
        )
        logger.info("Nurture email 1 sent to %s: %s", email, result1.get("id") or "mocked")
    except Exception as e:
        logger.warning("Nurture email 1 failed for %s: %s", email, e)

    # Email 2: Schedule for +2 days
    try:
        _schedule_email_2(email=email, name=name, score=score, issues=issues, signup_url=signup_url)
    except Exception as e:
        logger.warning("Nurture email 2 scheduling failed for %s: %s", email, e)

    # Email 3: Schedule for +5 days
    try:
        _schedule_email_3(email=email, name=name, signup_url=signup_url)
    except Exception as e:
        logger.warning("Nurture email 3 scheduling failed for %s: %s", email, e)

    return {"ok": True, "email": email, "sequence": "started"}


def _schedule_email_2(*, email: str, name: str, score: int, issues: list, signup_url: str) -> None:
    """Schedule email 2 for +2 days from now."""
    from email_service import nurture_email_2_html, send_html_email

    # Build quick wins from issues. seo_analyzer issues use "message" (summary)
    # and "fix" (how to fix) — there is no "title" key.
    quick_wins = []
    for issue in issues[:3]:
        quick_wins.append({
            "title": issue.get("message") or issue.get("title") or "SEO issue detected",
            "detail": (issue.get("fix") or issue.get("message") or "")[:200],
        })

    async def _send():
        try:
            html = nurture_email_2_html(
                name=name,
                score=score,
                quick_wins=quick_wins,
                signup_url=signup_url,
            )
            result = await send_html_email(
                to=email,
                subject="3 quick fixes for your website (under 15 min each)",
                html=html,
            )
            logger.info("Nurture email 2 sent to %s: %s", email, result.get("id") or "mocked")
        except Exception as e:
            logger.warning("Nurture email 2 failed for %s: %s", email, e)

    _schedule_async(_send, hours=48)


def _schedule_email_3(*, email: str, name: str, signup_url: str) -> None:
    """Schedule email 3 for +5 days from now."""
    from email_service import nurture_email_3_html, send_html_email

    async def _send():
        try:
            html = nurture_email_3_html(name=name, signup_url=signup_url)
            result = await send_html_email(
                to=email,
                subject="How small businesses are getting found on Google",
                html=html,
            )
            logger.info("Nurture email 3 sent to %s: %s", email, result.get("id") or "mocked")
        except Exception as e:
            logger.warning("Nurture email 3 failed for %s: %s", email, e)

    _schedule_async(_send, hours=120)


def _schedule_async(coro_fn, *, hours: int) -> None:
    """Schedule an async function to run after a delay using APScheduler if available."""
    try:
        from apscheduler.triggers.date import DateTrigger

        # Use the running scheduler instance (module exposes it via get_scheduler)
        import scheduler as scheduler_mod
        sched = scheduler_mod.get_scheduler()
        if sched and hasattr(sched, "add_job"):
            run_time = datetime.now(timezone.utc) + timedelta(hours=hours)
            sched.add_job(
                coro_fn,
                trigger=DateTrigger(run_date=run_time),
                id=f"nurture_{hours}h_{id(coro_fn)}",
                replace_existing=True,
            )
            logger.info("Scheduled nurture email for +%dh", hours)
            return
    except Exception as e:
        logger.warning("APScheduler not available for nurture: %s", e)

    # Fallback: log that it would have been sent
    logger.info("Nurture email scheduled for +%dh (no scheduler — logged only)", hours)
