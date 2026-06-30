"""v1 SEO prompts — extracted from ai_service.py."""
from .. import registry, Prompt

SYSTEM = (
    "You are an expert SEO strategist for small businesses. "
    "Your advice must be specific, actionable, and easy for non-technical owners to apply. "
    "When asked for structured data, ALWAYS respond with valid JSON only (no markdown fences, no commentary)."
)

registry.register("seo_meta_tags", "v1", Prompt(
    version="v1", system=SYSTEM,
    user_template="""Generate optimized SEO meta tags for this business.

Business name: {business_name}
What they do: {description}
Target keywords (optional): {target_keywords}

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

Rules: titles 50-60 chars, descriptions 130-155 chars. Be specific, include the business location if implied, and use action language.""",
    model="gemini-2.5-flash", temperature=0.3, max_output_tokens=2048,
))

registry.register("seo_keyword_research", "v1", Prompt(
    version="v1", system=SYSTEM,
    user_template="""Do keyword research for a small business.

Seed topic / niche: {seed_topic}
Industry: {industry}
Location: {location}

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

Give 6 primary, 8 long-tail, 5 local (only if location was provided), 6 questions, 5 content ideas.""",
    model="gemini-2.5-flash", temperature=0.3, max_output_tokens=4096,
))

registry.register("seo_competitor_analysis", "v1", Prompt(
    version="v1", system=SYSTEM,
    user_template="""Compare a small business website against its competitors for SEO.

Your site: {your_site}
Competitors:
{competitors}
Industry: {industry}

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

Be honest and concrete. Give at least 3 opportunities, 3 content gaps, 5 quick wins.""",
    model="gemini-2.5-flash", temperature=0.3, max_output_tokens=4096,
))

registry.register("seo_audit_recommendations", "v1", Prompt(
    version="v1", system=SYSTEM,
    user_template="""You just received an automated SEO audit. Turn it into a prioritized action plan a small business owner can follow.

AUDIT DATA:
{audit_json}

Return JSON with this exact shape:
{{
  "summary": "2-3 plain English sentences. What's the headline?",
  "priority_actions": [
    {{"title": "...", "why": "...", "how": "...", "estimated_impact": "high|medium|low", "estimated_effort": "low|medium|high"}}
  ],
  "wins": ["What this site is already doing well — 2-3 bullets."],
  "next_30_days": ["...", "...", "..."]
}}

Give 5-7 priority actions, ordered most impactful first.""",
    model="gemini-2.5-flash", temperature=0.3, max_output_tokens=4096,
))
