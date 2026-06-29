"""Google Gemini powered Google Business Profile auditor.

GBP is the highest-impact channel for any business with a physical location or
service area — it owns the Google Maps panel + the "near me" results.
"""
import json
import re
from typing import List, Optional
from llm_client import ask_json, DEFAULT_MODEL


SYSTEM = (
    "You are a Google Business Profile / local-SEO expert helping small startups "
    "get found in Google Maps and the local pack. Your advice is concrete and easy "
    "to apply in under 30 minutes per item. ALWAYS respond with valid JSON only."
)

GBP_BEST_PRACTICES = [
    "Business name = real-world name only (no keyword stuffing — triggers Google penalty)",
    "Primary category is the most important field for ranking",
    "Add up to 9 secondary categories that genuinely apply",
    "Description should be 600-750 chars (max 750), use natural language with local + category signals",
    "Photos: aim for 30+, refresh monthly, include exterior, interior, team, product, before/after",
    "Reviews: respond to EVERY review (positive + negative) within 48 hours",
    "Google Posts: publish 1-2 per week (offers, events, updates)",
    "Hours: keep accurate, set holiday hours in advance",
    "Q&A: seed with 3-5 owner answers; monitor for new questions",
    "Service area: define precisely for service-area businesses",
    "Attributes: enable EVERY truthful attribute (wheelchair accessible, free Wi-Fi, etc.)",
    "Booking / messaging: enable if applicable — Google ranks active profiles higher",
]


def _bp_block() -> str:
    return "\n".join("- " + b for b in GBP_BEST_PRACTICES)


async def audit_listing(
    *,
    business_name: str,
    primary_category: str,
    address: str = "",
    service_area: str = "",
    description: str = "",
    phone: str = "",
    website: str = "",
    hours_summary: str = "",
    photo_count: Optional[int] = None,
    reviews_count: Optional[int] = None,
    avg_rating: Optional[float] = None,
    response_rate: Optional[str] = None,
    posts_per_month: Optional[int] = None,
    booking_enabled: Optional[bool] = None,
    messaging_enabled: Optional[bool] = None,
) -> dict:
    prompt = f"""\
Audit this Google Business Profile for a small startup. Score honestly based on
what was provided + the best practices below.

LISTING:
- Business name: {business_name}
- Primary category: {primary_category}
- Address: {address or '(not provided)'}
- Service area: {service_area or '(not provided)'}
- Description (verbatim): {description or '(empty)'}
- Phone: {phone or '(not provided)'}
- Website: {website or '(not provided)'}
- Hours summary: {hours_summary or '(not provided)'}
- Photo count: {photo_count if photo_count is not None else '(unknown)'}
- Reviews count: {reviews_count if reviews_count is not None else '(unknown)'}
- Average rating: {avg_rating if avg_rating is not None else '(unknown)'}
- Owner response rate to reviews: {response_rate or '(unknown)'}
- Google Posts per month: {posts_per_month if posts_per_month is not None else '(unknown)'}
- Booking enabled: {booking_enabled if booking_enabled is not None else '(unknown)'}
- Messaging enabled: {messaging_enabled if messaging_enabled is not None else '(unknown)'}

GOOGLE BUSINESS PROFILE BEST PRACTICES:
{_bp_block()}

Return JSON in this EXACT shape:
{{
  "overall_score": <int 0-100>,
  "headline": "<2 sentence plain-English diagnosis>",
  "categories": {{
    "completeness": <int 0-100>,
    "description_quality": <int 0-100>,
    "photos": <int 0-100>,
    "reviews": <int 0-100>,
    "posts_freshness": <int 0-100>,
    "engagement_features": <int 0-100>
  }},
  "issues": [
    {{"severity": "high|medium|low", "category": "...", "message": "...", "fix": "..."}}
  ],
  "quick_wins": ["...", "...", "..."]
}}

Be honest. Score completeness based on filled-vs-empty fields. Score description_quality based on length, local signals, category keywords. Photos: 30+ = good, 10-29 = mid, <10 = poor. Reviews: combine count + rating + response_rate. Give 4-7 issues, at least 3 quick wins."""
    return await ask_json(prompt, system_message=SYSTEM)


async def suggestions(
    *,
    business_name: str,
    primary_category: str,
    location: str = "",
    target_customer: str = "",
    current_description: str = "",
) -> dict:
    prompt = f"""\
Generate concrete Google Business Profile improvements for a small startup.

Business: {business_name}
Category: {primary_category}
Location: {location or '(none)'}
Ideal customer: {target_customer or '(unspecified)'}
Current description (if any): {current_description or '(empty)'}

GBP MAX DESCRIPTION LENGTH: 750 characters. Aim for 600-750.

Return JSON in this EXACT shape:
{{
  "description_rewrites": [
    {{"text": "...", "length": <int>, "rationale": "..."}},
    {{"text": "...", "length": <int>, "rationale": "..."}},
    {{"text": "...", "length": <int>, "rationale": "..."}}
  ],
  "post_ideas": [
    {{"type": "Offer|Event|Update|Product", "title": "...", "body": "...", "cta": "..."}}
  ],
  "review_response_templates": [
    {{"scenario": "5-star happy customer", "text": "..."}},
    {{"scenario": "1-star unhappy customer", "text": "..."}},
    {{"scenario": "3-star neutral feedback", "text": "..."}}
  ],
  "attribute_recommendations": ["...", "...", "..."],
  "photo_checklist": ["...", "...", "..."]
}}

3 description rewrites (each ≤750 chars), 5 post ideas, 3 review templates, 5-8 attributes, 6-10 photo types to capture."""
    return await ask_json(prompt, system_message=SYSTEM)


async def compare_competitors(
    *,
    business_name: str,
    primary_category: str,
    location: str = "",
    competitors: List[str],
) -> dict:
    comp_list = "\n".join(f"- {c.strip()}" for c in competitors if c.strip())
    prompt = f"""\
Compare a small startup's Google Business Profile against competitors in the same local market.

Your business: {business_name}
Category: {primary_category}
Location: {location or '(unspecified)'}
Competitors:
{comp_list or '(none provided)'}

Return JSON in this EXACT shape:
{{
  "overview": "2-3 plain-English sentences about the local landscape.",
  "competitor_summaries": [
    {{"name": "...", "likely_strengths": ["...", "..."], "likely_review_count": "low|mid|high", "differentiation_angle": "..."}}
  ],
  "your_opportunities": [
    {{"opportunity": "...", "why": "...", "first_step": "..."}}
  ],
  "differentiators_to_emphasize": ["...", "...", "..."],
  "quick_wins": ["...", "...", "..."]
}}

Be honest about local SEO realities. At least 3 opportunities, 4 differentiators, 5 quick wins."""
    return await ask_json(prompt, system_message=SYSTEM)
