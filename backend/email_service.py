"""Resend-based email service with graceful fallback when no API key is configured.

When RESEND_API_KEY is empty, emails are logged + persisted as 'mocked' instead
of being sent — this lets the rest of the system (scheduler, history) run
end-to-end before the user provides a real key.
"""
import os
import asyncio
import logging
from typing import Optional

logger = logging.getLogger("email_service")


def is_configured() -> bool:
    return bool(os.environ.get("RESEND_API_KEY"))


async def send_html_email(*, to: str, subject: str, html: str) -> dict:
    """Returns {'mocked': bool, 'id': str | None, 'error': str | None}."""
    api_key = os.environ.get("RESEND_API_KEY")
    sender = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")

    if not api_key:
        logger.info("RESEND_API_KEY missing — emails are MOCKED. Would send to %s: %s", to, subject)
        return {"mocked": True, "id": None, "error": None}

    try:
        import resend
        resend.api_key = api_key
        params = {"from": sender, "to": [to], "subject": subject, "html": html}
        result = await asyncio.to_thread(resend.Emails.send, params)
        return {"mocked": False, "id": result.get("id"), "error": None}
    except Exception as e:
        logger.exception("Resend send failed")
        return {"mocked": False, "id": None, "error": str(e)[:300]}


def verify_email_html(*, name: str, verify_link: str) -> str:
    return f"""\
<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#FDFBF7;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;color:#1A201A">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FDFBF7;padding:32px 16px">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border:1px solid #E5E0D8;border-radius:24px;overflow:hidden">
        <tr><td style="padding:32px 32px 0 32px">
          <h1 style="margin:0;font-size:24px;color:#1A201A">Verify your email</h1>
          <p style="margin:16px 0 0;color:#5C685C;font-size:15px;line-height:1.55">
            Hi{(' ' + name) if name else ''},<br/><br/>
            Thanks for signing up for Goodly. Click the button below to verify your email address and unlock all features.
          </p>
        </td></tr>
        <tr><td style="padding:24px 32px 32px 32px" align="center">
          <a href="{verify_link}" style="display:inline-block;background:#2D3E32;color:#FDFBF7;text-decoration:none;padding:14px 32px;border-radius:999px;font-weight:500;font-size:15px">Verify email</a>
          <p style="margin:20px 0 0;color:#5C685C;font-size:12px">If you didn't create this account, you can safely ignore this email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>
"""


def reset_password_html(*, name: str, reset_link: str) -> str:
    return f"""\
<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#FDFBF7;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;color:#1A201A">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FDFBF7;padding:32px 16px">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border:1px solid #E5E0D8;border-radius:24px;overflow:hidden">
        <tr><td style="padding:32px 32px 0 32px">
          <h1 style="margin:0;font-size:24px;color:#1A201A">Reset your password</h1>
          <p style="margin:16px 0 0;color:#5C685C;font-size:15px;line-height:1.55">
            Hi{(' ' + name) if name else ''},<br/><br/>
            Someone requested a password reset for your Goodly account. Click the button below to choose a new password. This link expires in 1 hour.
          </p>
        </td></tr>
        <tr><td style="padding:24px 32px 32px 32px" align="center">
          <a href="{reset_link}" style="display:inline-block;background:#2D3E32;color:#FDFBF7;text-decoration:none;padding:14px 32px;border-radius:999px;font-weight:500;font-size:15px">Reset password</a>
          <p style="margin:20px 0 0;color:#5C685C;font-size:12px">If you didn't request this, you can safely ignore this email. Your password won't change.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>
"""


def audit_digest_html(*, name: str, project_name: str, url: str,
                      overall_score: int, prev_score: Optional[int],
                      top_issues: list, audit_url: str) -> str:
    """Inline-styled HTML email for a monthly audit digest."""
    delta = ""
    if prev_score is not None:
        diff = overall_score - prev_score
        if diff > 0:
            delta = f"<span style='color:#81B29A;font-weight:600'>↑ {diff} pts vs last month</span>"
        elif diff < 0:
            delta = f"<span style='color:#E07A5F;font-weight:600'>↓ {abs(diff)} pts vs last month</span>"
        else:
            delta = "<span style='color:#5C685C'>No change vs last month</span>"

    issues_html = ""
    for it in top_issues[:5]:
        sev = (it.get("severity") or "low").upper()
        color = "#E07A5F" if sev == "HIGH" else ("#E6A57E" if sev == "MEDIUM" else "#81B29A")
        issues_html += (
            f"<tr><td style='padding:10px 14px;border-bottom:1px solid #E5E0D8'>"
            f"<span style='display:inline-block;padding:2px 8px;border-radius:999px;background:{color}22;color:{color};font-size:11px;font-weight:600;letter-spacing:.1em'>{sev}</span>"
            f"<div style='margin-top:6px;color:#1A201A;font-size:14px'>{it.get('message','')}</div>"
            f"<div style='margin-top:4px;color:#5C685C;font-size:13px'>{it.get('fix','')}</div>"
            f"</td></tr>"
        )

    return f"""\
<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#FDFBF7;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;color:#1A201A">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FDFBF7;padding:32px 16px">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border:1px solid #E5E0D8;border-radius:24px;overflow:hidden">
        <tr><td style="padding:28px 32px 0 32px">
          <div style="font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:#5C685C">Your monthly digest</div>
          <h1 style="margin:8px 0 0;font-size:26px;line-height:1.15;color:#1A201A">{project_name}</h1>
          <a href="{url}" style="color:#5C685C;text-decoration:none;font-size:13px">{url}</a>
        </td></tr>
        <tr><td style="padding:24px 32px">
          <table cellpadding="0" cellspacing="0" style="background:#F3F0E9;border-radius:16px;width:100%">
            <tr>
              <td style="padding:24px;width:35%" align="center">
                <div style="font-size:48px;font-weight:700;color:#2D3E32;line-height:1">{overall_score}</div>
                <div style="font-size:12px;color:#5C685C;margin-top:4px">/100 health</div>
              </td>
              <td style="padding:24px;color:#1A201A;font-size:14px;line-height:1.55">
                Hi {name},<br/><br/>
                Your scheduled audit for <strong>{project_name}</strong> just ran. {delta}
              </td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:8px 32px 0 32px">
          <div style="font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:#5C685C">Top issues</div>
        </td></tr>
        <tr><td style="padding:8px 16px 8px 16px">
          <table cellpadding="0" cellspacing="0" width="100%" style="background:#FFFFFF">
            {issues_html or '<tr><td style="padding:14px;color:#5C685C">No issues found — nice work!</td></tr>'}
          </table>
        </td></tr>
        <tr><td style="padding:24px 32px 32px 32px" align="center">
          <a href="{audit_url}" style="display:inline-block;background:#2D3E32;color:#FDFBF7;text-decoration:none;padding:14px 28px;border-radius:999px;font-weight:500;font-size:14px">Open full report</a>
        </td></tr>
        <tr><td style="padding:0 32px 28px 32px;color:#5C685C;font-size:11px;line-height:1.5" align="center">
          You're getting this because you turned on monthly audits for this project in Goodly.<br/>
          Disable anytime from the project page.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>
"""


def post_audit_html(*, name: str, url: str, overall_score: int,
                    high_issues: int, audit_url: str) -> str:
    """Email sent immediately after a user runs their first audit."""
    return f"""\
<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#FDFBF7;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;color:#1A201A">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FDFBF7;padding:32px 16px">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border:1px solid #E5E0D8;border-radius:24px;overflow:hidden">
        <tr><td style="padding:32px 32px 0 32px">
          <h1 style="margin:0;font-size:24px;color:#1A201A">Your SEO score is {overall_score}/100</h1>
          <p style="margin:16px 0 0;color:#5C685C;font-size:15px;line-height:1.55">
            Hi {name},<br/><br/>
            We just finished auditing <strong>{url}</strong>. Here's what we found:
          </p>
        </td></tr>
        <tr><td style="padding:24px 32px">
          <table cellpadding="0" cellspacing="0" style="background:#F3F0E9;border-radius:16px;width:100%">
            <tr>
              <td style="padding:24px;width:35%" align="center">
                <div style="font-size:48px;font-weight:700;color:#2D3E32;line-height:1">{overall_score}</div>
                <div style="font-size:12px;color:#5C685C;margin-top:4px">/100 health</div>
              </td>
              <td style="padding:24px;color:#1A201A;font-size:14px;line-height:1.55">
                <strong>{high_issues}</strong> critical issues found.<br/>
                <span style="color:#5C685C">View your full report to see the step-by-step fix plan.</span>
              </td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:24px 32px 32px 32px" align="center">
          <a href="{audit_url}" style="display:inline-block;background:#2D3E32;color:#FDFBF7;text-decoration:none;padding:14px 32px;border-radius:999px;font-weight:500;font-size:15px">View my full report</a>
          <p style="margin:20px 0 0;color:#5C685C;font-size:12px">You're getting this because you ran an audit on Goodly. We'll send you tips to improve your score.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>
"""


def weekly_tips_html(*, name: str, tips: list, dashboard_url: str) -> str:
    """Weekly email with SEO tips and upgrade prompt."""
    tips_html = ""
    for tip in tips[:3]:
        tips_html += (
            f"<tr><td style='padding:12px 16px;border-bottom:1px solid #E5E0D8'>"
            f"<div style='color:#1A201A;font-size:14px;font-weight:500'>{tip.get('title','')}</div>"
            f"<div style='color:#5C685C;font-size:13px;margin-top:4px'>{tip.get('body','')}</div>"
            f"</td></tr>"
        )

    return f"""\
<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#FDFBF7;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;color:#1A201A">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FDFBF7;padding:32px 16px">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border:1px solid #E5E0D8;border-radius:24px;overflow:hidden">
        <tr><td style="padding:32px 32px 0 32px">
          <h1 style="margin:0;font-size:24px;color:#1A201A">Your weekly SEO tips</h1>
          <p style="margin:16px 0 0;color:#5C685C;font-size:15px;line-height:1.55">
            Hi {name},<br/><br/>
            Here are this week's tips to improve your visibility:
          </p>
        </td></tr>
        <tr><td style="padding:8px 16px 8px 16px">
          <table cellpadding="0" cellspacing="0" width="100%" style="background:#FFFFFF">
            {tips_html or '<tr><td style="padding:14px;color:#5C685C">Run an audit to get personalized tips!</td></tr>'}
          </table>
        </td></tr>
        <tr><td style="padding:24px 32px 32px 32px" align="center">
          <a href="{dashboard_url}" style="display:inline-block;background:#2D3E32;color:#FDFBF7;text-decoration:none;padding:14px 32px;border-radius:999px;font-weight:500;font-size:15px">Go to dashboard</a>
          <p style="margin:20px 0 0;color:#5C685C;font-size:12px">Want more? Upgrade to Starter for $49/mo and get weekly automated audits + SERP tracking.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>
"""


def referral_invite_html(*, referrer_name: str, referral_link: str) -> str:
    """Email sent when a user invites a friend via the referral system."""
    return f"""\
<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#FDFBF7;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;color:#1A201A">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FDFBF7;padding:32px 16px">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border:1px solid #E5E0D8;border-radius:24px;overflow:hidden">
        <tr><td style="padding:32px 32px 0 32px">
          <h1 style="margin:0;font-size:24px;color:#1A201A">{referrer_name} thinks you should try Goodly</h1>
          <p style="margin:16px 0 0;color:#5C685C;font-size:15px;line-height:1.55">
            {referrer_name} uses Goodly to get found on Google, Instagram, TikTok, and YouTube — and they thought you'd benefit too.
          </p>
        </td></tr>
        <tr><td style="padding:24px 32px">
          <table cellpadding="0" cellspacing="0" style="background:#F3F0E9;border-radius:16px;width:100%">
            <tr>
              <td style="padding:24px" align="center">
                <div style="font-size:18px;font-weight:600;color:#1A201A;margin-bottom:8px">Get a free SEO audit</div>
                <div style="color:#5C685C;font-size:14px;line-height:1.55">Paste your website URL and get a score in 10 seconds. No signup. No credit card.</div>
              </td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:24px 32px 32px 32px" align="center">
          <a href="{referral_link}" style="display:inline-block;background:#2D3E32;color:#FDFBF7;text-decoration:none;padding:14px 32px;border-radius:999px;font-weight:500;font-size:15px">Get my free audit</a>
          <p style="margin:20px 0 0;color:#5C685C;font-size:12px">Goodly helps small businesses get found online. Real SEO, no jargon.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>
"""


def support_notification_html(*, name: str, email: str, message: str, page: str) -> str:
    """Internal notification when a user submits a support request."""
    return f"""\
<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#FDFBF7;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;color:#1A201A">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FDFBF7;padding:32px 16px">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border:1px solid #E5E0D8;border-radius:24px;overflow:hidden">
        <tr><td style="padding:32px 32px 0 32px">
          <h1 style="margin:0;font-size:20px;color:#1A201A">New support request</h1>
        </td></tr>
        <tr><td style="padding:24px 32px">
          <table cellpadding="0" cellspacing="0" style="width:100%">
            <tr><td style="padding:8px 0;color:#5C685C;font-size:13px">From</td><td style="padding:8px 0;color:#1A201A;font-size:14px">{name} ({email})</td></tr>
            <tr><td style="padding:8px 0;color:#5C685C;font-size:13px">Page</td><td style="padding:8px 0;color:#1A201A;font-size:14px">{page or 'Unknown'}</td></tr>
            <tr><td style="padding:8px 0;color:#5C685C;font-size:13px" colspan="2">Message</td></tr>
            <tr><td style="padding:12px;background:#F3F0E9;border-radius:12px;color:#1A201A;font-size:14px;line-height:1.55" colspan="2">{message}</td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:24px 32px 32px 32px" align="center">
          <a href="mailto:{email}" style="display:inline-block;background:#2D3E32;color:#FDFBF7;text-decoration:none;padding:14px 32px;border-radius:999px;font-weight:500;font-size:15px">Reply to {name}</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>
"""


def onboarding_welcome_html(*, name: str, dashboard_url: str) -> str:
    """Day 0: Welcome email sent immediately after signup."""
    return f"""\
<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#FDFBF7;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;color:#1A201A">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FDFBF7;padding:32px 16px">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border:1px solid #E5E0D8;border-radius:24px;overflow:hidden">
        <tr><td style="padding:32px 32px 0 32px">
          <h1 style="margin:0;font-size:24px;color:#1A201A">Welcome to Goodly, {name}!</h1>
          <p style="margin:16px 0 0;color:#5C685C;font-size:15px;line-height:1.55">
            You just took the first step to getting your business found online. Here's what to do next:
          </p>
        </td></tr>
        <tr><td style="padding:24px 32px">
          <table cellpadding="0" cellspacing="0" style="width:100%">
            <tr><td style="padding:12px 0;border-bottom:1px solid #E5E0D8">
              <div style="font-weight:600;color:#1A201A;font-size:15px">1. Run your first audit</div>
              <div style="color:#5C685C;font-size:13px;margin-top:4px">Paste your website URL and get a score in 30 seconds.</div>
            </td></tr>
            <tr><td style="padding:12px 0;border-bottom:1px solid #E5E0D8">
              <div style="font-weight:600;color:#1A201A;font-size:15px">2. Read your action plan</div>
              <div style="color:#5C685C;font-size:13px;margin-top:4px">We'll tell you exactly what to fix — in plain English.</div>
            </td></tr>
            <tr><td style="padding:12px 0">
              <div style="font-weight:600;color:#1A201A;font-size:15px">3. Watch your score climb</div>
              <div style="color:#5C685C;font-size:13px;margin-top:4px">Re-audit anytime and track your progress.</div>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:24px 32px 32px 32px" align="center">
          <a href="{dashboard_url}" style="display:inline-block;background:#2D3E32;color:#FDFBF7;text-decoration:none;padding:14px 32px;border-radius:999px;font-weight:500;font-size:15px">Run my first audit</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>
"""


def onboarding_howto_html(*, name: str, dashboard_url: str) -> str:
    """Day 1: How to read your audit report."""
    return f"""\
<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#FDFBF7;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;color:#1A201A">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FDFBF7;padding:32px 16px">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border:1px solid #E5E0D8;border-radius:24px;overflow:hidden">
        <tr><td style="padding:32px 32px 0 32px">
          <h1 style="margin:0;font-size:24px;color:#1A201A">How to read your audit report</h1>
          <p style="margin:16px 0 0;color:#5C685C;font-size:15px;line-height:1.55">
            Hi {name},<br/><br/>
            Your audit report has three parts:
          </p>
        </td></tr>
        <tr><td style="padding:24px 32px">
          <table cellpadding="0" cellspacing="0" style="width:100%">
            <tr><td style="padding:12px 0;border-bottom:1px solid #E5E0D8">
              <div style="font-weight:600;color:#1A201A;font-size:15px">Overall Score (0-100)</div>
              <div style="color:#5C685C;font-size:13px;margin-top:4px">A quick health check. Above 80 is great, 60-80 needs work, below 60 needs immediate attention.</div>
            </td></tr>
            <tr><td style="padding:12px 0;border-bottom:1px solid #E5E0D8">
              <div style="font-weight:600;color:#1A201A;font-size:15px">Category Breakdown</div>
              <div style="color:#5C685C;font-size:13px;margin-top:4px">See which areas are strong (meta tags, mobile, speed) and which need work.</div>
            </td></tr>
            <tr><td style="padding:12px 0">
              <div style="font-weight:600;color:#1A201A;font-size:15px">Issue List with Fixes</div>
              <div style="color:#5C685C;font-size:13px;margin-top:4px">Every issue comes with a plain-English fix. Start with the red (critical) ones.</div>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:24px 32px 32px 32px" align="center">
          <a href="{dashboard_url}" style="display:inline-block;background:#2D3E32;color:#FDFBF7;text-decoration:none;padding:14px 32px;border-radius:999px;font-weight:500;font-size:15px">View my report</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>
"""


def onboarding_quickwins_html(*, name: str, dashboard_url: str) -> str:
    """Day 3: 3 quick wins to boost your score."""
    return f"""\
<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#FDFBF7;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;color:#1A201A">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FDFBF7;padding:32px 16px">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border:1px solid #E5E0D8;border-radius:24px;overflow:hidden">
        <tr><td style="padding:32px 32px 0 32px">
          <h1 style="margin:0;font-size:24px;color:#1A201A">3 quick wins to boost your score today</h1>
          <p style="margin:16px 0 0;color:#5C685C;font-size:15px;line-height:1.55">
            Hi {name},<br/><br/>
            Most small businesses can boost their score by 15-20 points in an afternoon. Here's how:
          </p>
        </td></tr>
        <tr><td style="padding:24px 32px">
          <table cellpadding="0" cellspacing="0" style="width:100%">
            <tr><td style="padding:12px 0;border-bottom:1px solid #E5E0D8">
              <div style="font-weight:600;color:#1A201A;font-size:15px">1. Add a meta description</div>
              <div style="color:#5C685C;font-size:13px;margin-top:4px">This is the text that shows under your link on Google. 120-160 characters that describe your page. Takes 2 minutes.</div>
            </td></tr>
            <tr><td style="padding:12px 0;border-bottom:1px solid #E5E0D8">
              <div style="font-weight:600;color:#1A201A;font-size:15px">2. Add alt text to your images</div>
              <div style="color:#5C685C;font-size:13px;margin-top:4px">Every image should have a short description. Helps Google understand your page AND makes it accessible.</div>
            </td></tr>
            <tr><td style="padding:12px 0">
              <div style="font-weight:600;color:#1A201A;font-size:15px">3. Make sure you have one H1 heading</div>
              <div style="color:#5C685C;font-size:13px;margin-top:4px">Your main heading tells Google what the page is about. One clear H1 per page.</div>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:24px 32px 32px 32px" align="center">
          <a href="{dashboard_url}" style="display:inline-block;background:#2D3E32;color:#FDFBF7;text-decoration:none;padding:14px 32px;border-radius:999px;font-weight:500;font-size:15px">Re-audit my site</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>
"""


def onboarding_competitors_html(*, name: str, dashboard_url: str) -> str:
    """Day 5: See how you compare to competitors."""
    return f"""\
<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#FDFBF7;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;color:#1A201A">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FDFBF7;padding:32px 16px">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border:1px solid #E5E0D8;border-radius:24px;overflow:hidden">
        <tr><td style="padding:32px 32px 0 32px">
          <h1 style="margin:0;font-size:24px;color:#1A201A">See how you compare to competitors</h1>
          <p style="margin:16px 0 0;color:#5C685C;font-size:15px;line-height:1.55">
            Hi {name},<br/><br/>
            Want to know what your competitors are doing right? Upgrade to Pro and we'll show you exactly how you stack up — and how to beat them.
          </p>
        </td></tr>
        <tr><td style="padding:24px 32px">
          <table cellpadding="0" cellspacing="0" style="background:#F3F0E9;border-radius:16px;width:100%">
            <tr><td style="padding:20px">
              <div style="font-weight:600;color:#1A201A;font-size:15px;margin-bottom:8px">Pro plan includes:</div>
              <div style="color:#5C685C;font-size:13px;line-height:1.8">✓ Competitor analysis (3 competitors)<br/>✓ Daily automated re-audits<br/>✓ All social platforms<br/>✓ AI visibility monitoring<br/>✓ Google Business Profile audit</div>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:24px 32px 32px 32px" align="center">
          <a href="{dashboard_url}" style="display:inline-block;background:#E07A5F;color:#FDFBF7;text-decoration:none;padding:14px 32px;border-radius:999px;font-weight:500;font-size:15px">Upgrade to Pro — $149/mo</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>
"""


def onboarding_upgrade_html(*, name: str, billing_url: str) -> str:
    """Day 7: Upgrade to unlock SERP tracking."""
    return f"""\
<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#FDFBF7;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;color:#1A201A">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FDFBF7;padding:32px 16px">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border:1px solid #E5E0D8;border-radius:24px;overflow:hidden">
        <tr><td style="padding:32px 32px 0 32px">
          <h1 style="margin:0;font-size:24px;color:#1A201A">You've used your 3 free audits this month</h1>
          <p style="margin:16px 0 0;color:#5C685C;font-size:15px;line-height:1.55">
            Hi {name},<br/><br/>
            Hope you're seeing results! To keep auditing and unlock more features, upgrade to Starter:
          </p>
        </td></tr>
        <tr><td style="padding:24px 32px">
          <table cellpadding="0" cellspacing="0" style="background:#F3F0E9;border-radius:16px;width:100%">
            <tr><td style="padding:20px">
              <div style="font-weight:600;color:#1A201A;font-size:15px;margin-bottom:8px">Starter — $49/mo</div>
              <div style="color:#5C685C;font-size:13px;line-height:1.8">✓ 10 audits per month<br/>✓ Track 5 keywords on Google<br/>✓ Weekly automated re-audits<br/>✓ PDF reports<br/>✓ Instagram audit<br/>✓ 7-day free trial — cancel anytime</div>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:24px 32px 32px 32px" align="center">
          <a href="{billing_url}" style="display:inline-block;background:#2D3E32;color:#FDFBF7;text-decoration:none;padding:14px 32px;border-radius:999px;font-weight:500;font-size:15px">Start 7-day free trial</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>
"""


def rank_change_html(*, name: str, project_name: str, score_delta: int, current_score: int, audit_url: str) -> str:
    """Email alert when a scheduled audit detects a significant score change."""
    direction = "up" if score_delta > 0 else "down"
    emoji = "🎉" if score_delta > 0 else "⚠️"
    color = "#81B29A" if score_delta > 0 else "#E07A5F"
    return f"""\
<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#FDFBF7;font-family:-apple-system,'Segoe UI',Roboto,sans-serif;color:#1A201A">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FDFBF7;padding:32px 16px">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border:1px solid #E5E0D8;border-radius:24px;overflow:hidden">
        <tr><td style="padding:32px 32px 0 32px">
          <h1 style="margin:0;font-size:24px;color:#1A201A">{emoji} Your SEO score went {direction}!</h1>
          <p style="margin:16px 0 0;color:#5C685C;font-size:15px;line-height:1.55">
            Hi {name},<br/><br/>
            Your scheduled audit for <strong>{project_name}</strong> just ran and your score changed significantly.
          </p>
        </td></tr>
        <tr><td style="padding:24px 32px">
          <table cellpadding="0" cellspacing="0" style="background:#F3F0E9;border-radius:16px;width:100%">
            <tr>
              <td style="padding:24px;width:35%" align="center">
                <div style="font-size:48px;font-weight:700;color:{color};line-height:1">{current_score}</div>
                <div style="font-size:12px;color:#5C685C;margin-top:4px">/100 current</div>
              </td>
              <td style="padding:24px;color:#1A201A;font-size:14px;line-height:1.55">
                <strong>{'+' if score_delta > 0 else ''}{score_delta} points</strong> {direction} since your last audit.<br/>
                <span style="color:#5C685C">View your full report to see what changed.</span>
              </td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:24px 32px 32px 32px" align="center">
          <a href="{audit_url}" style="display:inline-block;background:#2D3E32;color:#FDFBF7;text-decoration:none;padding:14px 32px;border-radius:999px;font-weight:500;font-size:15px">View full report</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>
"""
