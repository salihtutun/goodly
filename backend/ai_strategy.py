"""AI Content Strategy Engine — plans, repurposing, and visual content.

Three major features:
1. Content Strategy Generator — 90-day content calendar with topic clusters
2. Content Repurposing Engine — one input → six outputs
3. AI Image Prompt Generator — ready-to-use prompts for Midjourney/DALL-E/Canva
"""

from llm_client import ask_json

SYSTEM: str = (
    "You are an expert content strategist and creative director for small businesses. "
    "You create actionable content plans, repurpose content across platforms, "
    "and write detailed image generation prompts. "
    "Your output is immediately useful — no theory, just ready-to-execute plans. "
    "ALWAYS respond with valid JSON only — no markdown fences, no commentary."
)


# ──────────────────────────────────────────────
# 1. Content Strategy Generator
# ──────────────────────────────────────────────

async def generate_content_strategy(
    *,
    business_name: str,
    industry: str,
    location: str = "",
    target_audience: str = "local customers",
    goals: str = "more customers and better Google ranking",
    competitors: str = "",
    existing_content: str = "",
) -> dict:
    """Generate a 90-day content calendar with topic clusters, keywords, and publishing schedule."""
    prompt = f"""Create a 90-day content strategy for a small business.

BUSINESS: {business_name}
INDUSTRY: {industry}
LOCATION: {location or 'Online/national'}
TARGET AUDIENCE: {target_audience}
GOALS: {goals}
COMPETITORS: {competitors or 'Not specified'}
EXISTING CONTENT: {existing_content or 'Starting from scratch'}

Return JSON with this EXACT shape:
{{
  "strategy_overview": "2-3 paragraph strategy summary — what we're doing, why, and expected results",
  "brand_voice": {{
    "tone": "3-5 adjectives describing the voice",
    "do": ["3-5 things this brand's content should do"],
    "dont": ["3-5 things to avoid"]
  }},
  "topic_clusters": [
    {{
      "cluster_name": "Name of this topic cluster (e.g., 'Local SEO Basics', 'Customer Success Stories')",
      "pillar_topic": "The main comprehensive topic this cluster revolves around",
      "target_keywords": ["primary keyword", "secondary", "long-tail"],
      "why_it_matters": "Why this cluster drives business results"
    }}
  ],
  "content_calendar": [
    {{
      "week": <int 1-12>,
      "theme": "Weekly theme that ties content together",
      "blog_post": {{
        "title": "SEO-optimized blog post title",
        "target_keyword": "Primary keyword to rank for",
        "outline": "3-5 bullet point outline",
        "cta": "What action the reader should take"
      }},
      "social_posts": [
        {{
          "platform": "instagram|facebook|linkedin|tiktok",
          "content_type": "feed post|story|reel|carousel|poll",
          "hook": "Attention-grabbing first line",
          "topic": "What this post is about",
          "hashtags": ["#relevant", "#tags"]
        }}
      ],
      "email": {{
        "subject_line": "Compelling subject line",
        "type": "newsletter|promo|educational|nurture",
        "goal": "What this email should achieve"
      }},
      "local_seo_action": "One local SEO action to take this week (update GMB, get a review, build a citation, etc.)"
    }}
  ],
  "quick_start_plan": {{
    "week_1_priority": "The ONE thing to publish first for maximum impact",
    "first_blog_post": "Title and outline of the first blog post to write",
    "first_social_post": "Exact text of the first social media post to publish",
    "first_email": "Subject line and preview of the first email to send"
  }},
  "success_metrics": {{
    "30_days": "What success looks like after 30 days",
    "60_days": "What success looks like after 60 days",
    "90_days": "What success looks like after 90 days"
  }},
  "tools_recommended": ["Free/low-cost tools to help execute this plan"]
}}

RULES:
- Every piece of content must have a clear purpose tied to business goals.
- Blog topics must target specific keywords that real customers search for.
- Social posts must be platform-specific (IG ≠ LinkedIn ≠ TikTok).
- Include at least 2 local SEO actions if location is provided.
- The quick_start_plan must be something they can execute TODAY.
- Be realistic about what a small business owner can actually do (they're busy!).
- Do NOT include markdown fences around the JSON."""

    return await ask_json(prompt, system_message=SYSTEM)


# ──────────────────────────────────────────────
# 2. Content Repurposing Engine
# ──────────────────────────────────────────────

async def repurpose_content(
    *,
    business_name: str,
    source_content: str,
    source_type: str,
    target_platforms: list[str] | None = None,
    tone: str = "friendly and professional",
) -> dict:
    """Take one piece of content and repurpose it for multiple platforms.

    Args:
        source_content: The original content to repurpose
        source_type: 'blog_post', 'video_script', 'podcast_transcript', 'customer_review', 'case_study'
        target_platforms: List of platforms to generate for (default: all)
    """
    platforms = target_platforms or ["instagram", "facebook", "linkedin", "tiktok", "email", "twitter"]

    platform_list = ", ".join(platforms)

    prompt = f"""Repurpose this {source_type} into content for multiple platforms.

BUSINESS: {business_name}
SOURCE TYPE: {source_type}
TONE: {tone}

SOURCE CONTENT:
{source_content[:2500]}

TARGET PLATFORMS: {platform_list}

Return JSON with this EXACT shape:
{{
  "source_summary": "One sentence summary of the original content",
  "repurposed": {{
    "instagram": {{
      "feed_caption": "Instagram feed post caption with emojis and line breaks (use \\\\n)",
      "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5"],
      "story_idea": "What to put in an Instagram Story promoting this",
      "reel_hook": "First 3 seconds hook for a Reel version",
      "visual_idea": "What image/video would work best"
    }},
    "facebook": {{
      "post_text": "Facebook post text (conversation starter)",
      "hashtags": ["#tag1", "#tag2"],
      "best_time": "Best time to post this on Facebook"
    }},
    "linkedin": {{
      "post_text": "LinkedIn post with professional tone and line breaks",
      "hashtags": ["#tag1", "#tag2", "#tag3"],
      "hook": "Opening hook for LinkedIn (first 2 lines are critical)"
    }},
    "tiktok": {{
      "caption": "Short, punchy TikTok caption (max 150 chars)",
      "hashtags": ["#tag1", "#tag2", "#tag3"],
      "hook": "First 3 seconds hook",
      "trend_angle": "How to tie this to a current trend"
    }},
    "email": {{
      "subject_line": "Email subject line",
      "preview_text": "Preview text for inbox",
      "body_summary": "2-3 sentence email body summary",
      "cta": "Call to action"
    }},
    "twitter": {{
      "tweet_text": "Tweet (max 280 chars)",
      "thread_idea": "If this could be a thread, what would the 3-4 tweets cover?",
      "hashtags": ["#tag1", "#tag2"]
    }}
  }},
  "best_platform": "Which platform this content works BEST on and why",
  "one_liner": "A single sentence version that works anywhere (elevator pitch style)"
}}

RULES:
- Only include platforms that were requested in the target list.
- Each platform's content must follow that platform's best practices.
- Instagram: visual-first, emoji-friendly, hashtag-heavy.
- LinkedIn: professional, thought-leadership, line breaks for readability.
- TikTok: short, punchy, trend-aware, lowercase casual.
- Twitter: concise, witty, thread-worthy.
- Email: compelling subject line, clear CTA.
- The repurposed content must feel native to each platform, not like a copy-paste.
- Do NOT include markdown fences around the JSON."""

    return await ask_json(prompt, system_message=SYSTEM)


# ──────────────────────────────────────────────
# 3. AI Image Prompt Generator
# ──────────────────────────────────────────────

async def generate_image_prompts(
    *,
    business_name: str,
    content_type: str,
    content_description: str,
    brand_colors: str = "",
    style: str = "professional and warm",
    platform: str = "website",
    count: int = 3,
) -> dict:
    """Generate ready-to-use image prompts for AI image generators.

    Args:
        content_type: 'blog_header', 'social_post', 'email_hero', 'product', 'team', 'storefront', 'abstract'
        content_description: What the image is for / what it should convey
        brand_colors: Brand color palette (e.g., 'forest green #2D3E32, terracotta #E07A5F')
        style: Visual style direction
        platform: Where the image will be used (affects aspect ratio and style)
    """
    platform_specs = {
        "website": "16:9 or 4:3, horizontal, clean and professional",
        "instagram": "1:1 square or 4:5 vertical, visually striking, scroll-stopping",
        "facebook": "1.91:1 link image or 1:1 feed, warm and shareable",
        "linkedin": "1.91:1, professional, clean backgrounds",
        "tiktok": "9:16 vertical, bold, eye-catching, trend-aware",
        "email": "600-800px wide, horizontal, lightweight feel",
        "blog": "1200x630px, horizontal, text-safe area on right third",
        "youtube": "16:9, 1280x720, bold text overlay area, high contrast",
    }

    specs = platform_specs.get(platform, platform_specs["website"])

    prompt = f"""Generate detailed image prompts for AI image generators (Midjourney, DALL-E, Canva AI).

BUSINESS: {business_name}
CONTENT TYPE: {content_type}
WHAT THE IMAGE IS FOR: {content_description}
BRAND COLORS: {brand_colors or 'Not specified — use warm, professional colors'}
VISUAL STYLE: {style}
PLATFORM: {platform} ({specs})
NUMBER OF PROMPTS: {count}

Return JSON with this EXACT shape:
{{
  "visual_direction": "2-3 sentence creative direction for the visual style",
  "prompts": [
    {{
      "prompt_number": 1,
      "midjourney_prompt": "Detailed Midjourney prompt with style parameters (--ar aspect ratio, --style, --v 6). Include camera/lens specs if relevant, lighting, composition, mood. Make it specific enough that someone who's never used Midjourney could copy-paste and get a great result.",
      "dalle_prompt": "DALL-E 3 optimized prompt (more natural language, less technical). Focus on what should be in the image, style, and mood.",
      "canva_prompt": "Canva AI image generator prompt (simpler, more accessible). Focus on the subject and overall feel.",
      "description": "What the generated image will look like (so they know what to expect)",
      "best_for": "What this image works best for (hero, thumbnail, background, etc.)"
    }}
  ],
  "design_tips": ["3-5 practical tips for making these images look professional"],
  "free_alternatives": ["2-3 free tools/ways to create similar images without AI generators"],
  "brand_consistency_tips": "How to keep all images consistent with the brand"
}}

RULES:
- Midjourney prompts must include technical details: aspect ratio (--ar), style (--style raw for photorealistic), version (--v 6), lighting, camera angle, composition.
- DALL-E prompts should be natural language, descriptive, and focus on what to include (not what to exclude).
- Canva prompts should be simple and accessible for non-designers.
- Every prompt must be unique — different angles, compositions, or concepts.
- If brand colors are provided, incorporate them into the prompts.
- For blog headers, leave space for text overlay (negative space on one side).
- For social media, make it scroll-stopping and platform-appropriate.
- Do NOT include markdown fences around the JSON."""

    return await ask_json(prompt, system_message=SYSTEM)


# ──────────────────────────────────────────────
# 4. Industry Content Packs
# ──────────────────────────────────────────────

INDUSTRY_TEMPLATES = {
    "restaurant": {
        "keywords": ["best [cuisine] near me", "[city] restaurant", "[city] dinner", "food delivery [city]"],
        "faq_patterns": ["Do you take reservations?", "What are your hours?", "Do you have gluten-free options?", "Is there parking?"],
        "content_themes": ["Behind the scenes in our kitchen", "Meet our chef", "Seasonal menu spotlight", "Customer favorites"],
    },
    "salon": {
        "keywords": ["hair salon [city]", "best haircut [city]", "[city] barber", "nail salon near me"],
        "faq_patterns": ["How do I book?", "What's the cancellation policy?", "Do you do walk-ins?", "What products do you use?"],
        "content_themes": ["Before/after transformations", "Stylist spotlight", "Seasonal hair trends", "Self-care tips"],
    },
    "dentist": {
        "keywords": ["dentist [city]", "emergency dentist [city]", "teeth whitening [city]", "family dentist near me"],
        "faq_patterns": ["Do you take my insurance?", "Is teeth whitening safe?", "How often should I get a cleaning?", "Do you see children?"],
        "content_themes": ["Patient smile stories", "Dental health tips", "What to expect at your first visit", "Insurance and payment options"],
    },
    "plumber": {
        "keywords": ["plumber [city]", "emergency plumber [city]", "water heater repair [city]", "drain cleaning near me"],
        "faq_patterns": ["Do you do emergency calls?", "What's your hourly rate?", "Are you licensed and insured?", "How quickly can you come?"],
        "content_themes": ["Common plumbing problems and fixes", "When to call a pro vs DIY", "Water-saving tips", "Seasonal maintenance checklist"],
    },
    "contractor": {
        "keywords": ["general contractor [city]", "home renovation [city]", "kitchen remodel [city]", "bathroom remodel cost"],
        "faq_patterns": ["How long will my project take?", "Do you provide free estimates?", "Are you licensed and bonded?", "Can I see past projects?"],
        "content_themes": ["Project before/after", "Choosing the right contractor", "Renovation ROI guide", "Permit and planning tips"],
    },
    "lawyer": {
        "keywords": ["[practice area] lawyer [city]", "best attorney [city]", "free consultation [city]", "[practice area] law firm near me"],
        "faq_patterns": ["Do you offer free consultations?", "What's your success rate?", "How long will my case take?", "What are your fees?"],
        "content_themes": ["Understanding your legal rights", "What to expect in a consultation", "Recent case results", "Legal FAQ series"],
    },
    "realestate": {
        "keywords": ["realtor [city]", "homes for sale [city]", "[city] real estate agent", "best neighborhoods [city]"],
        "faq_patterns": ["How's the market right now?", "Should I buy or rent?", "What's my home worth?", "How long does closing take?"],
        "content_themes": ["Neighborhood guides", "Market updates", "Home buying/selling tips", "Client success stories"],
    },
    "fitness": {
        "keywords": ["gym [city]", "personal trainer [city]", "yoga studio [city]", "fitness classes near me"],
        "faq_patterns": ["Do you offer a free trial?", "What's included in membership?", "Do you have personal training?", "What are your hours?"],
        "content_themes": ["Member transformations", "Workout tips", "Nutrition advice", "Class spotlights"],
    },
    "retail": {
        "keywords": ["[product] store [city]", "best [product] shop [city]", "local [product] store", "gift shop [city]"],
        "faq_patterns": ["Do you ship?", "What's your return policy?", "Do you offer gift wrapping?", "Are you locally owned?"],
        "content_themes": ["Product spotlights", "Gift guides", "Behind the scenes", "Customer stories"],
    },
    "automotive": {
        "keywords": ["auto repair [city]", "car mechanic [city]", "oil change [city]", "brake repair near me"],
        "faq_patterns": ["How much will it cost?", "How long will it take?", "Do you offer a warranty?", "Do you work on [brand]?"],
        "content_themes": ["Car maintenance tips", "Warning signs not to ignore", "Seasonal car care", "Meet our mechanics"],
    },
}


async def get_industry_pack(industry: str) -> dict:
    """Get pre-built content templates for a specific industry."""
    industry = industry.lower().strip()

    # Try exact match first
    if industry in INDUSTRY_TEMPLATES:
        return {"industry": industry, **INDUSTRY_TEMPLATES[industry]}

    # Try partial match
    for key, value in INDUSTRY_TEMPLATES.items():
        if key in industry or industry in key:
            return {"industry": key, **value}

    # Return generic template
    return {
        "industry": industry,
        "keywords": [f"best {industry} near me", f"{industry} [city]", f"top {industry} [city]"],
        "faq_patterns": [
            "What are your hours?",
            "How do I book/schedule?",
            "What's your pricing?",
            "Do you have reviews I can see?",
            "What areas do you serve?",
        ],
        "content_themes": [
            "Why choose us",
            "Customer success stories",
            "Tips and advice",
            "Behind the scenes",
        ],
    }
