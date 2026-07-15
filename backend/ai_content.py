"""AI Content Generator — done-for-you content for small businesses.

Unlike the analysis/recommendation features in ai_service.py, this module
generates ACTUAL content that business owners can copy-paste and use immediately:
- Blog posts (full article with SEO structure)
- Review responses (professional, on-brand replies)
- FAQ pages (content + JSON-LD schema markup)
- Website copy (homepage, about page, services pages)
- Email copy (welcome, promo, follow-up, newsletter)
- Social captions (Instagram, Facebook, LinkedIn, TikTok)
"""

from llm_client import ask_json, DEFAULT_MODEL

SYSTEM: str = (
    "You are an expert content writer for small businesses. "
    "Your writing is warm, professional, and speaks directly to customers. "
    "You avoid jargon and write like a helpful human, not a corporate robot. "
    "When asked for structured data, ALWAYS respond with valid JSON only — "
    "no markdown fences, no commentary."
)


async def generate_blog_post(
    *,
    business_name: str,
    topic: str,
    keywords: str = "",
    tone: str = "friendly and helpful",
    target_audience: str = "small business customers",
) -> dict:
    """Generate a complete, SEO-optimized blog post ready to publish."""
    prompt = f"""Write a complete blog post for a small business.

BUSINESS: {business_name}
TOPIC: {topic}
TARGET KEYWORDS: {keywords or "(infer the best ones)"}
TONE: {tone}
TARGET AUDIENCE: {target_audience}

Return JSON with this EXACT shape:
{{
  "title": "Compelling SEO title (50-60 chars)",
  "meta_description": "Meta description (130-155 chars) with primary keyword",
  "slug": "url-friendly-slug",
  "featured_image_idea": "What kind of image would work best for this post",
  "introduction": "2-3 sentence hook that makes the reader want to continue",
  "body": "Full blog post body in HTML. Use <h2> for subheadings, <p> for paragraphs, <ul>/<li> for lists, <strong> for emphasis. Aim for 800-1200 words. Include practical examples and actionable advice.",
  "conclusion": "2-3 sentence wrap-up with a natural call-to-action",
  "read_time_minutes": <int>,
  "target_keywords_used": ["keyword1", "keyword2"],
  "internal_linking_ideas": ["suggestion1", "suggestion2"]
}}

RULES:
- Write like a real person, not AI. Use contractions, vary sentence length, include specific examples.
- The body must be complete HTML ready to paste into a CMS.
- Include at least 3 subheadings (<h2>).
- Make the advice genuinely useful — something the reader can act on today.
- Do NOT include markdown fences around the JSON."""

    return await ask_json(prompt, system_message=SYSTEM)


async def generate_review_response(
    *,
    business_name: str,
    reviewer_name: str,
    rating: int,
    review_text: str,
    tone: str = "professional and warm",
) -> dict:
    """Generate a professional response to a customer review."""
    stars = "★" * rating + "☆" * (5 - rating)

    prompt = f"""Write a professional response to a customer review for a small business.

BUSINESS: {business_name}
REVIEWER: {reviewer_name}
RATING: {stars} ({rating}/5)
REVIEW TEXT: "{review_text}"
TONE: {tone}

Return JSON with this EXACT shape:
{{
  "response": "The complete response text. 2-4 sentences. Thank them by name. If positive, express genuine gratitude and invite them back. If negative, apologize sincerely, take responsibility, and offer to make it right (provide an email or phone). If neutral, thank them and address their specific point.",
  "tone_used": "grateful|apologetic|appreciative|professional",
  "key_points_addressed": ["point1", "point2"],
  "follow_up_action": "What the business should actually do after posting this response"
}}

RULES:
- Never sound defensive or argumentative, even for negative reviews.
- Always use the reviewer's name.
- For negative reviews: acknowledge the specific complaint, apologize, and offer a concrete resolution path.
- Keep it under 150 words.
- Do NOT include markdown fences around the JSON."""

    return await ask_json(prompt, system_message=SYSTEM)


async def generate_faq(
    *,
    business_name: str,
    category: str,
    location: str = "",
    services: str = "",
) -> dict:
    """Generate FAQ content with JSON-LD schema markup for rich results."""
    prompt = f"""Generate a complete FAQ page for a small business website.

BUSINESS: {business_name}
CATEGORY / INDUSTRY: {category}
LOCATION: {location or "(not specified)"}
SERVICES OFFERED: {services or "(infer from category)"}

Return JSON with this EXACT shape:
{{
  "page_title": "FAQ page title (include business name + location if provided)",
  "meta_description": "Meta description for the FAQ page (130-155 chars)",
  "introduction": "1-2 sentence warm introduction to the FAQ section",
  "questions": [
    {{
      "question": "A real question customers actually ask",
      "answer": "Clear, helpful answer in 2-4 sentences. Use natural language.",
      "category": "pricing|services|process|location|general"
    }}
  ],
  "json_ld_schema": "Complete JSON-LD FAQPage schema as a JSON string (with @context, @type, mainEntity array)",
  "categories_covered": ["pricing", "services"]
}}

RULES:
- Generate 8-12 questions that REAL customers would ask. Think like someone who just found this business.
- Include at least 2 location-specific questions if location is provided.
- Include at least 2 pricing/value questions.
- Include at least 2 process/timeline questions.
- Answers should be genuinely helpful, not salesy.
- The json_ld_schema must be valid JSON-LD that Google can parse for rich results.
- Do NOT include markdown fences around the JSON."""

    return await ask_json(prompt, system_message=SYSTEM)


async def generate_website_copy(
    *,
    business_name: str,
    description: str,
    page_type: str,
    keywords: str = "",
    location: str = "",
    tone: str = "warm and professional",
) -> dict:
    """Generate website copy for a specific page type."""
    page_hints = {
        "homepage": "Hero headline + subheadline + 3 value proposition sections + social proof section + CTA. Focus on the transformation the customer gets, not features.",
        "about": "Founder/team story + mission + values + what makes this business different. Be authentic, not corporate.",
        "services": "Service descriptions with benefits (not just features) + pricing transparency + process overview + FAQ section + CTA for each service.",
        "contact": "Warm invitation to reach out + what happens after they contact you + response time promise + map/directions if local.",
        "landing": "Single-focused sales page. Hero + problem agitation + solution + social proof + pricing/offer + urgency + CTA. One clear action.",
    }

    hint = page_hints.get(page_type, page_hints["homepage"])

    prompt = f"""Write website copy for a small business {page_type} page.

BUSINESS: {business_name}
WHAT THEY DO: {description}
PAGE TYPE: {page_type}
TARGET KEYWORDS: {keywords or "(infer the best ones)"}
LOCATION: {location or "(not specified)"}
TONE: {tone}

PAGE STRUCTURE TO FOLLOW: {hint}

Return JSON with this EXACT shape:
{{
  "page_title": "SEO page title (50-60 chars)",
  "meta_description": "Meta description (130-155 chars)",
  "sections": [
    {{
      "section_name": "hero|value_prop|services|about|testimonials|cta|contact|faq",
      "headline": "Section headline (if applicable)",
      "body": "Section body copy. For hero sections, include both headline and subheadline. Use <h2>/<h3> for subheadings, <p> for paragraphs. Write complete, ready-to-use copy.",
      "cta_text": "Call-to-action button text (if applicable)",
      "cta_link_type": "contact|signup|call|book|learn"
    }}
  ],
  "seo_keywords_used": ["keyword1", "keyword2"],
  "tone_notes": "Brief note on the tone and voice used"
}}

RULES:
- Write complete, ready-to-publish copy. No placeholders, no "[insert X here]".
- Each section's body should be the actual copy, not instructions.
- Use the business name naturally throughout.
- Include location in copy if provided (important for local SEO).
- Make the CTA specific and compelling.
- Do NOT include markdown fences around the JSON."""

    return await ask_json(prompt, system_message=SYSTEM)


async def generate_email(
    *,
    business_name: str,
    email_type: str,
    topic: str = "",
    tone: str = "warm and professional",
    target_audience: str = "customers",
) -> dict:
    """Generate email copy for marketing campaigns."""
    type_hints = {
        "welcome": "Welcome new subscribers/customers. Introduce the business, set expectations, include a warm offer or next step.",
        "promo": "Promotional email for a sale, offer, or new product/service. Create urgency, highlight value, clear CTA.",
        "follow_up": "Follow up after a purchase, inquiry, or event. Check in, ask for feedback, suggest next steps.",
        "newsletter": "Monthly/quarterly newsletter. Share updates, tips, behind-the-scenes, and a soft CTA.",
        "abandoned_cart": "Recover abandoned bookings/inquiries. Remind them what they left, address objections, offer help.",
    }

    hint = type_hints.get(email_type, type_hints["promo"])

    prompt = f"""Write a marketing email for a small business.

BUSINESS: {business_name}
EMAIL TYPE: {email_type}
TOPIC: {topic or "(infer from email type)"}
TONE: {tone}
TARGET AUDIENCE: {target_audience}

EMAIL PURPOSE: {hint}

Return JSON with this EXACT shape:
{{
  "subject_line": "Email subject line (40-60 chars, compelling, not spammy)",
  "preheader": "Preview text that appears next to subject in inbox (40-90 chars)",
  "greeting": "Warm opening greeting",
  "body": "Full email body in HTML. Use <p> for paragraphs, <strong> for emphasis, <ul>/<li> for lists. Keep it warm and personal. 150-300 words.",
  "cta_text": "Call-to-action button text",
  "cta_link_text": "What the link should say (e.g., 'Book now', 'Shop the sale')",
  "sign_off": "Warm closing with business name",
  "ps_line": "Optional P.S. line for extra engagement (can be empty)",
  "spam_score_notes": "Brief note on why this won't trigger spam filters"
}}

RULES:
- Write like a real person emailing their customers, not a marketing robot.
- Subject line must be compelling but not clickbait.
- Include ONE clear CTA, not multiple.
- Keep paragraphs short (2-3 sentences max) for mobile readability.
- Do NOT include markdown fences around the JSON."""

    return await ask_json(prompt, system_message=SYSTEM)


async def generate_social_captions(
    *,
    business_name: str,
    platform: str,
    topic: str,
    tone: str = "friendly and engaging",
    goal: str = "engagement",
) -> dict:
    """Generate social media captions with hashtags for a specific platform."""
    platform_hints = {
        "instagram": "Visual-first. Caption 125-150 words. Use emojis naturally. Include 5-10 hashtags (mix of broad + niche). Strong hook in first line (IG truncates after 2 lines). End with CTA or question.",
        "facebook": "Conversation-first. Caption 50-100 words. Ask questions to drive comments. Less hashtag-heavy (1-3 max). Can be slightly longer and more detailed than IG.",
        "linkedin": "Professional tone. Caption 100-200 words. Start with a bold statement or question. Use line breaks for readability. 3-5 hashtags. End with a discussion prompt.",
        "tiktok": "Short, punchy, trend-aware. Caption 10-50 words max. Hook in first 3 words. 3-5 hashtags including one trending. Use lowercase, casual language. Include a call to action.",
    }

    hint = platform_hints.get(platform, platform_hints["instagram"])

    prompt = f"""Write social media captions for a small business.

BUSINESS: {business_name}
PLATFORM: {platform}
TOPIC: {topic}
TONE: {tone}
GOAL: {goal}

PLATFORM BEST PRACTICES: {hint}

Return JSON with this EXACT shape:
{{
  "captions": [
    {{
      "text": "Full caption text with emojis and line breaks (use \\n for newlines)",
      "hashtags": ["#tag1", "#tag2", "#tag3"],
      "best_for": "feed|story|reel|carousel|poll",
      "hook": "The attention-grabbing first line"
    }}
  ],
  "visual_ideas": ["idea1", "idea2", "idea3"],
  "best_posting_time": "Suggested best time to post on this platform",
  "engagement_tip": "One specific tip to boost engagement on this post"
}}

RULES:
- Generate 3 caption variations with different angles.
- Hashtags must be relevant, not spammy. Mix of popular + niche.
- Captions should sound like a real person, not a brand account.
- Include emojis naturally where appropriate.
- Do NOT include markdown fences around the JSON."""

    return await ask_json(prompt, system_message=SYSTEM)
