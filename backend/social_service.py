"""Claude Sonnet 4.6 powered social presence auditor (Instagram, TikTok, YouTube)."""
import os
import json
import re
import uuid
from typing import Optional, List
from emergentintegrations.llm.chat import LlmChat, UserMessage


SYSTEM = (
    "You are an expert social media strategist for small startups. "
    "Your advice is concrete, kind, and easy to apply in under 30 minutes. "
    "When asked for structured data, ALWAYS respond with valid JSON only — no markdown fences, no commentary."
)


PLATFORM_HINTS = {
    "instagram": {
        "what_matters": [
            "Bio clarity (50-150 chars, says what you do + where + for whom)",
            "Link in bio quality (single link tools, landing pages)",
            "Niche signal (hashtags, category, content themes)",
            "Visual consistency (cover photos, color palette)",
            "Posting cadence and recency",
            "CTA presence (DM, link, swipe-up, comment-to-DM)",
        ],
        "limits": "Bio is 150 characters max; 30 hashtags max per post but 5-10 ideal.",
    },
    "tiktok": {
        "what_matters": [
            "Bio clarity (80 chars max — say what you teach/sell)",
            "Niche tags and FYP signals (consistent topic across last 9 videos)",
            "Hook quality in first 1.5 seconds",
            "Post cadence (3-5 posts/week minimum for FYP)",
            "Trends + sounds — using trending audio",
            "Watch-time signals (length 21-34s tends to do well in 2026)",
        ],
        "limits": "Bio is 80 characters max; 3-5 hashtags ideal.",
    },
    "youtube": {
        "what_matters": [
            "Channel name + handle clarity",
            "Channel description (first 125 chars matter most for search)",
            "Thumbnail consistency (face + text + bold contrast)",
            "Title formula (curiosity + keyword + benefit)",
            "Upload cadence (weekly minimum to stay in algorithm)",
            "Shorts + long-form mix (Shorts feed new viewers, long-form retains)",
            "Playlists structured by viewer goal",
        ],
        "limits": "Title 60 chars ideal, description 5000 chars max, tags deprecated.",
    },
}


def _make_chat() -> LlmChat:
    api_key = os.environ.get("EMERGENT_LLM_KEY")
    if not api_key:
        raise RuntimeError("EMERGENT_LLM_KEY not configured")
    return LlmChat(
        api_key=api_key,
        session_id=str(uuid.uuid4()),
        system_message=SYSTEM,
    ).with_model("anthropic", "claude-sonnet-4-6")


def _parse_json(text: str):
    cleaned = re.sub(r"^```(?:json)?\s*", "", text.strip())
    cleaned = re.sub(r"\s*```$", "", cleaned)
    try:
        return json.loads(cleaned)
    except Exception:
        m = re.search(r"(\{.*\}|\[.*\])", cleaned, re.DOTALL)
        if m:
            return json.loads(m.group(1))
        raise


async def _ask_json(prompt: str):
    chat = _make_chat()
    resp = await chat.send_message(UserMessage(text=prompt))
    return _parse_json(resp if isinstance(resp, str) else str(resp))


async def audit_profile(
    *,
    platform: str,
    handle: str,
    bio: str,
    niche: str,
    location: str = "",
    followers: str = "",
    recent_caption: str = "",
    posts_per_week: str = "",
    fetched_signals: Optional[dict] = None,
) -> dict:
    hints = PLATFORM_HINTS.get(platform, PLATFORM_HINTS["instagram"])

    fetched_block = ""
    if fetched_signals and fetched_signals.get("fetched"):
        fetched_block = (
            f"\nWe ALSO pulled these public signals from the profile page (may be incomplete):\n"
            f"- og:title: {fetched_signals.get('og_title')}\n"
            f"- og:description: {fetched_signals.get('og_description')}\n"
            f"- followers_estimate: {fetched_signals.get('followers_estimate')}\n"
        )

    prompt = f"""\
Audit this {platform.upper()} presence for a small startup.

Handle: @{handle}
Bio (verbatim from the user): {bio or '(not provided)'}
Niche / what they do: {niche or '(unspecified)'}
Location: {location or '(global)'}
Self-reported followers: {followers or '(unknown)'}
Recent caption / video description: {recent_caption or '(not provided)'}
Posting cadence the user reports: {posts_per_week or '(unknown)'}{fetched_block}

WHAT MATTERS ON THIS PLATFORM:
{chr(10).join("- " + s for s in hints['what_matters'])}
PLATFORM LIMITS: {hints['limits']}

Return JSON with this EXACT shape:
{{
  "overall_score": <int 0-100>,
  "headline": "<2 sentence plain-English diagnosis>",
  "categories": {{
    "bio_clarity": <int 0-100>,
    "niche_signal": <int 0-100>,
    "cta_presence": <int 0-100>,
    "content_quality": <int 0-100>,
    "consistency": <int 0-100>,
    "discoverability": <int 0-100>
  }},
  "issues": [
    {{"severity": "high|medium|low", "category": "...", "message": "...", "fix": "..."}}
  ],
  "quick_wins": ["...", "...", "..."]
}}

Score honestly — if the bio is empty or generic, score bio_clarity low. Give at least 3 quick_wins and 4-7 issues. Do not invent metrics — score based on what was provided + platform best practices."""
    return await _ask_json(prompt)


async def suggestions(
    *,
    platform: str,
    handle: str,
    bio: str,
    niche: str,
    location: str = "",
    target_customer: str = "",
) -> dict:
    hints = PLATFORM_HINTS.get(platform, PLATFORM_HINTS["instagram"])
    prompt = f"""\
Generate concrete improvements for this {platform.upper()} profile.

Handle: @{handle}
Current bio: {bio or '(empty)'}
Niche: {niche or '(unspecified)'}
Location: {location or '(global)'}
Ideal customer: {target_customer or '(unspecified)'}

PLATFORM LIMITS: {hints['limits']}

Return JSON with this EXACT shape:
{{
  "bio_rewrites": [
    {{"text": "...", "length": <int>, "rationale": "..."}},
    {{"text": "...", "length": <int>, "rationale": "..."}},
    {{"text": "...", "length": <int>, "rationale": "..."}}
  ],
  "hashtag_sets": [
    {{"theme": "broad reach", "tags": ["#...", "#..."]}},
    {{"theme": "niche", "tags": ["#...", "#..."]}},
    {{"theme": "local", "tags": ["#...", "#..."]}}
  ],
  "content_ideas": [
    {{"title": "...", "format": "Reel|Carousel|Story|Short|Long-form|Live", "hook": "...", "why": "..."}}
  ],
  "cta_examples": ["...", "...", "..."]
}}

Make the bio rewrites fit the platform's character limit. Give exactly 3 bio rewrites, 3 hashtag sets, 6 content ideas, 3 CTAs."""
    return await _ask_json(prompt)


async def compare_competitors(
    *,
    platform: str,
    your_handle: str,
    your_niche: str,
    competitors: List[str],
) -> dict:
    comp_list = "\n".join(f"- @{c.lstrip('@')}" for c in competitors if c.strip())
    prompt = f"""\
Compare a small startup's {platform.upper()} presence against competitors.

Your handle: @{your_handle.lstrip('@')}
Your niche: {your_niche or '(unspecified)'}
Competitors:
{comp_list or '(none provided)'}

Return JSON with this EXACT shape:
{{
  "overview": "2-3 plain-English sentences about the competitive landscape.",
  "competitor_summaries": [
    {{"handle": "...", "likely_strengths": ["...", "..."], "likely_content_style": "...", "estimated_audience": "small|mid|large"}}
  ],
  "your_opportunities": [
    {{"opportunity": "...", "why": "...", "first_step": "..."}}
  ],
  "content_gaps": [
    {{"topic": "...", "format": "Reel|Carousel|Short|Long-form|...", "why": "..."}}
  ],
  "quick_wins": ["...", "...", "..."]
}}

Give honest, specific advice. At least 3 opportunities, 3 content gaps, 5 quick wins."""
    return await _ask_json(prompt)
