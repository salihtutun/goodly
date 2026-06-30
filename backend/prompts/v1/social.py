"""v1 Social prompts — extracted from social_service.py."""
from .. import registry, Prompt

SYSTEM = (
    "You are an expert social media strategist for small businesses. "
    "Your advice must be specific, actionable, and easy for non-technical owners to apply. "
    "When asked for structured data, ALWAYS respond with valid JSON only (no markdown fences, no commentary)."
)

registry.register("social_audit", "v1", Prompt(
    version="v1", system=SYSTEM,
    user_template="""Audit this {platform} profile for a small business.

Handle: {handle}
Bio: {bio}
Niche: {niche}
Location: {location}
Followers: {followers}
Recent caption: {recent_caption}
Posts per week: {posts_per_week}
Fetched signals: {fetched_signals}

Return JSON with this exact shape:
{{
  "overall_score": <int 0-100>,
  "categories": {{
    "bio_optimization": <int 0-100>,
    "content_quality": <int 0-100>,
    "engagement_signals": <int 0-100>,
    "consistency": <int 0-100>,
    "discoverability": <int 0-100>
  }},
  "issues": [
    {{"category": "...", "title": "...", "severity": "high|medium|low", "suggestion": "..."}}
  ],
  "strengths": ["...", "..."],
  "summary": "2-3 sentence overall assessment."
}}

Be honest and specific. Give 5-8 issues with concrete suggestions.""",
    model="gemini-2.5-flash", temperature=0.3, max_output_tokens=4096,
))

registry.register("social_suggestions", "v1", Prompt(
    version="v1", system=SYSTEM,
    user_template="""Generate content and strategy suggestions for this {platform} account.

Handle: {handle}
Bio: {bio}
Niche: {niche}
Location: {location}
Target customer: {target_customer}

Return JSON with this exact shape:
{{
  "suggestions": [
    {{"title": "...", "category": "content|bio|hashtags|engagement|posting_schedule", "why": "...", "how": "..."}}
  ],
  "content_calendar_ideas": [
    {{"day": "Monday", "format": "reel|carousel|story|post", "topic": "...", "caption_hook": "..."}}
  ],
  "hashtag_sets": [
    {{"theme": "...", "hashtags": ["...", "..."]}}
  ]
}}

Give 5-8 suggestions, 5 content calendar ideas, 3 hashtag sets.""",
    model="gemini-2.5-flash", temperature=0.4, max_output_tokens=4096,
))

registry.register("social_competitors", "v1", Prompt(
    version="v1", system=SYSTEM,
    user_template="""Compare this {platform} account against competitors.

Your handle: {your_handle}
Your niche: {your_niche}
Competitors: {competitors}

Return JSON with this exact shape:
{{
  "comparison": "2-3 sentence overview of competitive position.",
  "competitor_insights": [
    {{"competitor": "...", "what_they_do_well": ["...", "..."], "what_you_can_learn": "..."}}
  ],
  "your_advantages": ["...", "..."],
  "action_items": [
    {{"action": "...", "why": "...", "effort": "low|medium|high"}}
  ]
}}

Be specific and actionable. Give 3-5 action items.""",
    model="gemini-2.5-flash", temperature=0.3, max_output_tokens=4096,
))
