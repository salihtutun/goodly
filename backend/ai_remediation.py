"""AI Remediation Engine — audit results → ready-to-paste fixes.

The "Fix My Website" feature. Takes audit findings and generates
actual corrected code/content that business owners can copy-paste:
- Corrected meta tags (title, description, OG, Twitter)
- Fixed heading structure
- Schema markup (JSON-LD)
- Improved page copy
- Alt text for images
- Mobile-friendly fixes
- Speed optimization suggestions
"""

from llm_client import ask_json, DEFAULT_MODEL

SYSTEM: str = (
    "You are an expert SEO technician and web developer. "
    "You fix websites. Given audit findings, you produce the EXACT corrected "
    "code/content that should replace the broken version. "
    "Your output is ready to copy-paste into a CMS, HTML file, or website builder. "
    "Be specific, be correct, be immediately useful. "
    "ALWAYS respond with valid JSON only — no markdown fences, no commentary."
)


async def generate_fixes(
    *,
    business_name: str,
    website_url: str,
    audit_issues: list[dict],
    current_meta: dict | None = None,
    industry: str = "",
    location: str = "",
) -> dict:
    """Generate ready-to-paste fixes for every issue found in an audit.

    Args:
        business_name: Name of the business
        website_url: URL that was audited
        audit_issues: List of issues from the audit, each with {title, severity, description, category}
        current_meta: Current meta tags found on the site (title, description, og_title, etc.)
        industry: Business industry/category
        location: Business location for local SEO
    """
    issues_text = "\n".join(
        f"- [{i.get('severity', 'medium').upper()}] {i.get('title', 'Issue')}: {i.get('description', '')} (category: {i.get('category', 'general')})"
        for i in audit_issues
    )

    meta_context = ""
    if current_meta:
        meta_context = f"""
CURRENT META TAGS FOUND ON SITE:
- Title: {current_meta.get('title', 'Not found')}
- Meta Description: {current_meta.get('description', 'Not found')}
- OG Title: {current_meta.get('og_title', 'Not found')}
- OG Description: {current_meta.get('og_description', 'Not found')}
- H1: {current_meta.get('h1', 'Not found')}
- Canonical: {current_meta.get('canonical', 'Not found')}
- Viewport: {current_meta.get('viewport', 'Not found')}
"""

    prompt = f"""You are fixing a small business website. Generate the EXACT corrected code/content for every issue found.

BUSINESS: {business_name}
WEBSITE: {website_url}
INDUSTRY: {industry or 'General small business'}
LOCATION: {location or 'Not specified'}

{meta_context}

AUDIT ISSUES FOUND:
{issues_text}

Return JSON with this EXACT shape:
{{
  "summary": "2-3 sentence summary of what was fixed and why it matters for their Google ranking",
  "priority_fixes": [
    {{
      "issue": "What was wrong (from the audit)",
      "fix_type": "meta_tags|heading|schema|content|image|speed|mobile|other",
      "what_to_do": "One sentence explaining the fix in plain English",
      "code_to_paste": "The EXACT corrected HTML/code. For meta tags, provide the full <title> and <meta> tags. For headings, provide the corrected <h1>-<h6>. For schema, provide complete JSON-LD script tag. For content, provide the improved copy. This is what they literally copy-paste.",
      "where_to_paste": "Specific location: '<head> section', 'replace the first <h1>', 'before </body>', etc.",
      "impact": "high|medium|low — how much this fix improves SEO"
    }}
  ],
  "complete_head_section": "If meta tags were an issue, provide the COMPLETE corrected <head> section with all tags (title, description, OG, Twitter, canonical, viewport, robots). Ready to replace their entire <head>. If no meta issues, leave empty string.",
  "complete_schema_markup": "If schema was missing/broken, provide complete JSON-LD LocalBusiness schema markup as a <script> tag. Include business name, address, phone, hours, geo coordinates if location provided. If no schema issues, leave empty string.",
  "improved_homepage_copy": "If content was thin/missing, provide improved homepage copy (hero headline + subheadline + 2-3 value prop paragraphs). If content was fine, leave empty string.",
  "quick_wins": ["3-5 one-sentence tips they can do in under 5 minutes that aren't code changes"],
  "estimated_ranking_impact": "Realistic estimate of how these fixes could improve their Google ranking (e.g., 'Could move from page 3 to page 1 for local searches within 2-4 weeks')"
}}

RULES:
- Every fix must be COMPLETE and READY TO USE. No placeholders, no "[insert X here]".
- Meta tags must be SEO-optimized with target keywords naturally included.
- Schema markup must be valid JSON-LD that Google can parse.
- Headings must follow proper hierarchy (one H1, then H2s, etc.).
- Content must sound like a real business, not AI-generated fluff.
- Include the business name and location naturally in meta tags and content.
- For local businesses, include city/region in title tags and descriptions.
- Do NOT include markdown fences around the JSON."""

    return await ask_json(prompt, system_message=SYSTEM)


async def generate_single_fix(
    *,
    business_name: str,
    website_url: str,
    issue_title: str,
    issue_description: str,
    issue_category: str,
    current_value: str = "",
) -> dict:
    """Generate a fix for a single specific issue. Lighter-weight than generate_fixes."""
    prompt = f"""Fix this specific SEO issue for a small business website.

BUSINESS: {business_name}
WEBSITE: {website_url}
ISSUE: {issue_title}
DESCRIPTION: {issue_description}
CATEGORY: {issue_category}
CURRENT VALUE: {current_value or 'Not available'}

Return JSON with this EXACT shape:
{{
  "diagnosis": "One sentence explaining the problem in plain English",
  "fix": "The EXACT corrected code/content to paste in",
  "where_to_paste": "Where exactly to put this fix",
  "why_it_matters": "One sentence on how this helps their Google ranking",
  "difficulty": "easy|medium|hard"
}}

RULES:
- The fix must be complete and ready to use. No placeholders.
- Be specific about where to paste it.
- Do NOT include markdown fences around the JSON."""

    return await ask_json(prompt, system_message=SYSTEM)


async def generate_content_grader(
    *,
    business_name: str,
    page_url: str,
    page_content: str,
    target_keywords: str = "",
) -> dict:
    """Grade existing content and provide line-by-line improvement suggestions."""
    prompt = f"""Grade this webpage content for SEO and provide specific improvements.

BUSINESS: {business_name}
PAGE URL: {page_url}
TARGET KEYWORDS: {target_keywords or 'Infer from content'}

PAGE CONTENT:
{page_content[:3000]}

Return JSON with this EXACT shape:
{{
  "overall_grade": "A+|A|B|C|D|F",
  "overall_score": <int 0-100>,
  "summary": "2-3 sentence overall assessment",
  "strengths": ["What's working well — 2-4 items"],
  "weaknesses": ["What needs improvement — 2-4 items"],
  "line_by_line": [
    {{
      "original_text": "The exact text that needs improvement (quote it)",
      "issue": "What's wrong (thin content, missing keyword, too salesy, no CTA, etc.)",
      "improved_version": "The rewritten version that fixes the issue",
      "reason": "Why this change improves SEO or user experience"
    }}
  ],
  "keyword_usage": {{
    "primary_keyword": "Main keyword identified",
    "density": "approx percentage",
    "in_title": true/false,
    "in_first_paragraph": true/false,
    "in_headings": true/false,
    "suggestions": ["How to improve keyword usage"]
  }},
  "readability": {{
    "flesch_estimate": "Easy|Fairly Easy|Standard|Fairly Difficult|Difficult",
    "avg_sentence_length": <int>,
    "suggestions": ["How to improve readability"]
  }},
  "action_items": ["3-5 prioritized things to fix, most important first"]
}}

RULES:
- Be honest but constructive. Small businesses need real feedback.
- Every suggestion must be actionable.
- Quote the original text exactly so they can find it.
- Do NOT include markdown fences around the JSON."""

    return await ask_json(prompt, system_message=SYSTEM)
