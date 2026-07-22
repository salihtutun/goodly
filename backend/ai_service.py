"""Google Gemini powered AI helpers for SEO tasks."""
import json
from typing import Dict, List

from llm_client import ask_json


SYSTEM_MESSAGE: str = (
    "You are an expert SEO strategist for small businesses. "
    "Your advice must be specific, actionable, and easy for non-technical owners to apply. "
    "When asked for structured data, ALWAYS respond with valid JSON only (no markdown fences, no commentary)."
)


async def generate_meta_tags(business_name: str, description: str, target_keywords: str = "") -> Dict:
    prompt = f"""Generate optimized SEO meta tags for this business.

Business name: {business_name}
What they do: {description}
Target keywords (optional): {target_keywords or "(none provided — infer the best ones)"}

Return JSON with this exact shape:
{{
  "title_options": [
    {{"text": "...", "length": <int>, "rationale": "..."}},
    {{"text": "...", "length": <int>, "rationale": "..."}},
    {{"text": "...", "length": <int>, "rationale": "..."}}
  ],
  "description_options": [
    {{"text": "...", "length": <int>, "rationale": "..."}},
    {{"text": "...", "length": <int>, "rationale": "..."}}
  ],
  "og_title": "...",
  "og_description": "...",
  "focus_keywords": ["...", "...", "..."]
}}

Rules: titles 50-60 chars, descriptions 130-155 chars. Be specific, include the business location if implied, and use action language."""
    return await ask_json(prompt, system_message=SYSTEM_MESSAGE)


async def keyword_research(seed_topic: str, industry: str = "", location: str = "") -> Dict:
    prompt = f"""Do keyword research for a small business.

Seed topic / niche: {seed_topic}
Industry: {industry or "(infer)"}
Location: {location or "(none / global)"}

Return JSON with this exact shape:
{{
  "primary_keywords": [
    {{"keyword": "...", "intent": "informational|commercial|transactional|navigational", "difficulty": "low|medium|high", "monthly_volume_estimate": "low|medium|high", "why": "..."}}
  ],
  "long_tail_opportunities": [
    {{"keyword": "...", "intent": "...", "difficulty": "low", "why": "..."}}
  ],
  "local_keywords": [
    {{"keyword": "...", "why": "..."}}
  ],
  "questions_people_ask": ["...", "..."],
  "content_ideas": [
    {{"title": "...", "format": "blog|landing page|FAQ|guide", "target_keyword": "..."}}
  ]
}}

Give 6 primary, 8 long-tail, 5 local (only if location was provided), 6 questions, 5 content ideas."""
    return await ask_json(prompt, system_message=SYSTEM_MESSAGE)


async def competitor_analysis(your_site: str, competitors: List[str], industry: str = "") -> Dict:
    comp_list = "\n".join(f"- {c}" for c in competitors if c.strip())
    prompt = f"""Compare a small business website against its competitors for SEO.

Your site: {your_site}
Competitors:
{comp_list}
Industry: {industry or "(infer)"}

Return JSON with this exact shape:
{{
  "overview": "2-3 sentences plain-English summary of the competitive landscape.",
  "competitor_strengths": [
    {{"competitor": "...", "strengths": ["...", "..."], "likely_keyword_focus": ["..."]}}
  ],
  "your_opportunities": [
    {{"opportunity": "...", "why_it_matters": "...", "first_step": "..."}}
  ],
  "content_gaps": [
    {{"topic": "...", "why": "..."}}
  ],
  "quick_wins": ["...", "...", "..."]
}}

Be honest and concrete. Give at least 3 opportunities, 3 content gaps, 5 quick wins."""
    return await ask_json(prompt, system_message=SYSTEM_MESSAGE)


async def audit_recommendations(audit_payload: Dict) -> Dict:
    """Turn an audit JSON into prioritized human recommendations."""
    summary = {
        "url": audit_payload.get("url"),
        "overall_score": audit_payload.get("overall_score"),
        "categories": audit_payload.get("categories"),
        "metadata": audit_payload.get("metadata"),
        "headings": {k: v for k, v in (audit_payload.get("headings") or {}).items() if k.endswith("_count")},
        "issues": audit_payload.get("issues"),
    }
    prompt = f"""You just received an automated SEO audit. Turn it into a prioritized action plan a small business owner can follow.

AUDIT DATA:
{json.dumps(summary, indent=2)}

Return JSON with this exact shape:
{{
  "summary": "2-3 plain English sentences. What's the headline?",
  "priority_actions": [
    {{"title": "...", "why": "...", "how": "...", "estimated_impact": "high|medium|low", "estimated_effort": "low|medium|high"}}
  ],
  "wins": ["What this site is already doing well — 2-3 bullets."],
  "next_30_days": ["...", "...", "..."],
  "suggested_title": "A rewritten page title (max 60 chars) with the business's main keyword — better than the current one in AUDIT DATA metadata",
  "suggested_description": "A rewritten meta description (150-160 chars) that is compelling, keyword-rich, and ends with a call to action"
}}

Give 5-7 priority actions, ordered most impactful first.
The suggested_title and suggested_description must be concrete, ready to paste — infer the business type and location from the audit data."""
    return await ask_json(prompt, system_message=SYSTEM_MESSAGE)
