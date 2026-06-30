"""v1 GBP (Google Business Profile) prompts — extracted from gbp_service.py."""
from .. import registry, Prompt

SYSTEM = (
    "You are an expert Google Business Profile consultant for small businesses. "
    "Your advice must be specific, actionable, and easy for non-technical owners to apply. "
    "When asked for structured data, ALWAYS respond with valid JSON only (no markdown fences, no commentary)."
)

registry.register("gbp_audit", "v1", Prompt(
    version="v1", system=SYSTEM,
    user_template="""Audit this Google Business Profile listing.

Business name: {business_name}
Primary category: {primary_category}
Address: {address}
Service area: {service_area}
Description: {description}
Phone: {phone}
Website: {website}
Hours: {hours_summary}
Photo count: {photo_count}
Reviews count: {reviews_count}
Average rating: {avg_rating}
Response rate: {response_rate}
Posts per month: {posts_per_month}
Booking enabled: {booking_enabled}
Messaging enabled: {messaging_enabled}

Return JSON with this exact shape:
{{
  "overall_score": <int 0-100>,
  "categories": {{
    "completeness": <int 0-100>,
    "photos_and_media": <int 0-100>,
    "reviews_and_engagement": <int 0-100>,
    "posts_and_updates": <int 0-100>,
    "attributes_and_services": <int 0-100>
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

registry.register("gbp_suggestions", "v1", Prompt(
    version="v1", system=SYSTEM,
    user_template="""Generate improvement suggestions for this Google Business Profile.

Business name: {business_name}
Primary category: {primary_category}
Location: {location}
Target customer: {target_customer}
Current description: {current_description}

Return JSON with this exact shape:
{{
  "suggestions": [
    {{"title": "...", "category": "description|photos|posts|reviews|attributes|services|q_and_a", "why": "...", "how": "..."}}
  ],
  "description_options": [
    {{"text": "...", "rationale": "..."}},
    {{"text": "...", "rationale": "..."}}
  ],
  "photo_ideas": ["...", "...", "..."],
  "post_ideas": [
    {{"title": "...", "type": "offer|update|event|product", "caption": "..."}}
  ]
}}

Give 5-8 suggestions, 2 description options, 3-5 photo ideas, 3-5 post ideas.""",
    model="gemini-2.5-flash", temperature=0.4, max_output_tokens=4096,
))

registry.register("gbp_competitors", "v1", Prompt(
    version="v1", system=SYSTEM,
    user_template="""Compare this business against GBP competitors.

Business name: {business_name}
Primary category: {primary_category}
Location: {location}
Competitors: {competitors}

Return JSON with this exact shape:
{{
  "comparison": "2-3 sentence overview of competitive position on Google Maps.",
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
