"""Revenue impact estimation for SEO audit issues.

Translates technical SEO problems into estimated monthly revenue loss.
Based on industry benchmarks for CTR by position, conversion rates,
and average customer value by industry.

All estimates are directional — the UI should display appropriate disclaimers.
"""
from typing import Dict, List, Optional

# ── Industry Benchmarks ───────────────────────────────

# CTR by Google SERP position (Advanced Web Ranking, 2024)
CTR_BY_POSITION = {
    1: 0.285,   # 28.5%
    2: 0.157,   # 15.7%
    3: 0.110,   # 11.0%
    4: 0.080,   # 8.0%
    5: 0.062,   # 6.2%
    6: 0.049,   # 4.9%
    7: 0.039,   # 3.9%
    8: 0.032,   # 3.2%
    9: 0.028,   # 2.8%
    10: 0.025,  # 2.5%
}

# Average conversion rates by industry (WordStream, 2024)
CONVERSION_RATES = {
    "default": 0.025,       # 2.5% — general
    "ecommerce": 0.020,     # 2.0%
    "legal": 0.045,         # 4.5%
    "real_estate": 0.028,   # 2.8%
    "healthcare": 0.038,    # 3.8%
    "home_services": 0.035, # 3.5% — plumbers, electricians, etc.
    "automotive": 0.022,    # 2.2%
    "restaurant": 0.030,    # 3.0%
    "salon_spa": 0.032,     # 3.2%
    "professional": 0.040,  # 4.0% — lawyers, accountants, consultants
    "education": 0.035,     # 3.5%
    "travel": 0.018,        # 1.8%
    "b2b": 0.025,           # 2.5%
}

# Average customer value by industry (annual, USD)
AVERAGE_CUSTOMER_VALUE = {
    "default": 500,
    "ecommerce": 85,
    "legal": 3500,
    "real_estate": 8000,
    "healthcare": 1200,
    "home_services": 600,
    "automotive": 2000,
    "restaurant": 25,
    "salon_spa": 80,
    "professional": 2500,
    "education": 1500,
    "travel": 1200,
    "b2b": 5000,
}

# Monthly search volume estimates for common issue types
# These are conservative estimates of how much traffic each issue affects
ISSUE_TRAFFIC_IMPACT = {
    # Meta tags
    "missing_title": 0.15,       # 15% of organic traffic affected
    "title_too_long": 0.08,
    "title_too_short": 0.05,
    "missing_meta_description": 0.12,
    "meta_description_too_long": 0.06,
    "meta_description_too_short": 0.04,
    "missing_og_tags": 0.03,

    # Headings
    "missing_h1": 0.10,
    "multiple_h1": 0.05,
    "missing_h2": 0.04,
    "heading_structure": 0.06,

    # Content
    "thin_content": 0.20,
    "duplicate_content": 0.15,
    "low_word_count": 0.10,
    "missing_keywords": 0.12,

    # Technical
    "slow_page_speed": 0.18,
    "not_mobile_friendly": 0.22,
    "missing_ssl": 0.08,
    "broken_links": 0.07,
    "missing_canonical": 0.05,
    "missing_robots": 0.02,
    "missing_sitemap": 0.04,

    # Images
    "missing_alt_text": 0.06,
    "large_images": 0.08,
    "missing_image_dimensions": 0.03,

    # Links
    "low_internal_links": 0.05,
    "low_external_links": 0.03,
    "broken_external_links": 0.06,

    # Default
    "default": 0.05,
}


def get_ctr_for_position(position: int) -> float:
    """Get estimated CTR for a SERP position."""
    return CTR_BY_POSITION.get(position, 0.01)


def get_conversion_rate(industry: Optional[str] = None) -> float:
    """Get average conversion rate for an industry."""
    if industry:
        key = industry.lower().replace(" ", "_").replace("-", "_")
        return CONVERSION_RATES.get(key, CONVERSION_RATES["default"])
    return CONVERSION_RATES["default"]


def get_customer_value(industry: Optional[str] = None) -> float:
    """Get average annual customer value for an industry."""
    if industry:
        key = industry.lower().replace(" ", "_").replace("-", "_")
        return AVERAGE_CUSTOMER_VALUE.get(key, AVERAGE_CUSTOMER_VALUE["default"])
    return AVERAGE_CUSTOMER_VALUE["default"]


def classify_issue_type(issue: dict) -> str:
    """Map an issue to a standard type for traffic impact lookup."""
    title = (issue.get("title") or issue.get("message") or "").lower()
    category = (issue.get("category") or "").lower()

    # Meta tags
    if "title" in title and ("missing" in title or "empty" in title):
        return "missing_title"
    if "title" in title and "long" in title:
        return "title_too_long"
    if "title" in title and "short" in title:
        return "title_too_short"
    if "meta description" in title and ("missing" in title or "empty" in title):
        return "missing_meta_description"
    if "meta description" in title and "long" in title:
        return "meta_description_too_long"
    if "og:" in title or "open graph" in title:
        return "missing_og_tags"

    # Headings
    if "h1" in title and ("missing" in title or "empty" in title):
        return "missing_h1"
    if "h1" in title and "multiple" in title:
        return "multiple_h1"
    if "h2" in title and ("missing" in title or "empty" in title):
        return "missing_h2"
    if "heading" in title and "structure" in title:
        return "heading_structure"

    # Content
    if "content" in title and ("thin" in title or "low" in title):
        return "thin_content"
    if "duplicate" in title:
        return "duplicate_content"
    if "word count" in title or "content length" in title:
        return "low_word_count"
    if "keyword" in title and ("missing" in title or "density" in title):
        return "missing_keywords"

    # Technical
    if "speed" in title or "performance" in title or "load" in title:
        return "slow_page_speed"
    if "mobile" in title or "responsive" in title:
        return "not_mobile_friendly"
    if "ssl" in title or "https" in title:
        return "missing_ssl"
    if "broken" in title and "link" in title:
        return "broken_links"
    if "canonical" in title:
        return "missing_canonical"
    if "robots" in title:
        return "missing_robots"
    if "sitemap" in title:
        return "missing_sitemap"

    # Images
    if "alt" in title and ("missing" in title or "empty" in title):
        return "missing_alt_text"
    if "image" in title and ("large" in title or "size" in title):
        return "large_images"
    if "image" in title and "dimension" in title:
        return "missing_image_dimensions"

    # Links
    if "internal link" in title:
        return "low_internal_links"
    if "external link" in title and "broken" in title:
        return "broken_external_links"
    if "external link" in title:
        return "low_external_links"

    return "default"


def estimate_issue_revenue_impact(
    issue: dict,
    *,
    monthly_traffic: int = 1000,
    industry: Optional[str] = None,
    current_position: int = 10,
) -> dict:
    """Estimate monthly revenue impact of a single SEO issue.

    Args:
        issue: The issue dict from the SEO analyzer (must have title/message and severity).
        monthly_traffic: Estimated monthly organic traffic to the page.
        industry: Industry for conversion rate and customer value benchmarks.
        current_position: Current estimated SERP position.

    Returns:
        Dict with estimated monthly revenue loss, traffic loss, and explanation.
    """
    issue_type = classify_issue_type(issue)
    traffic_impact_pct = ISSUE_TRAFFIC_IMPACT.get(issue_type, ISSUE_TRAFFIC_IMPACT["default"])
    severity = (issue.get("severity") or "medium").lower()

    # Severity multiplier
    severity_mult = {"high": 1.5, "medium": 1.0, "low": 0.5}.get(severity, 1.0)

    # Estimated traffic affected
    affected_traffic = int(monthly_traffic * traffic_impact_pct * severity_mult)

    # CTR improvement if fixed (conservative: move up 7 positions)
    current_ctr = get_ctr_for_position(current_position)
    improved_ctr = get_ctr_for_position(max(1, current_position - 7))
    ctr_gain = improved_ctr - current_ctr

    # Additional clicks from fixing this issue
    additional_clicks = int(affected_traffic * ctr_gain)

    # Conversions from additional clicks
    conversion_rate = get_conversion_rate(industry)
    additional_conversions = round(additional_clicks * conversion_rate, 1)

    # Revenue from additional conversions.
    # AVERAGE_CUSTOMER_VALUE is an ANNUAL per-customer figure, so the
    # monthly impact must use value/12 — multiplying monthly conversions by
    # the full annual value inflated estimates ~12x.
    customer_value = get_customer_value(industry)
    monthly_revenue_impact = round(additional_conversions * customer_value / 12)
    annual_revenue_impact = round(additional_conversions * customer_value)

    return {
        "issue_title": issue.get("title") or issue.get("message", "Unknown issue"),
        "issue_type": issue_type,
        "severity": severity,
        "estimated_traffic_affected": affected_traffic,
        "estimated_additional_clicks": additional_clicks,
        "estimated_additional_conversions": additional_conversions,
        "estimated_monthly_revenue_loss": monthly_revenue_impact,
        "estimated_annual_revenue_loss": annual_revenue_impact,
        "explanation": (
            f"This issue affects approximately {affected_traffic} visitors/month. "
            f"Fixing it could bring {additional_clicks} additional clicks, "
            f"leading to ~{additional_conversions} new customers/month "
            f"worth approximately ${monthly_revenue_impact}/month "
            f"(${annual_revenue_impact}/year)."
        ),
        "disclaimer": (
            "Estimates are directional and based on industry averages. "
            "Actual results depend on your market, competition, and implementation quality."
        ),
    }


def estimate_total_revenue_impact(
    issues: List[dict],
    *,
    monthly_traffic: int = 1000,
    industry: Optional[str] = None,
    current_position: int = 10,
) -> dict:
    """Estimate total revenue impact of all issues on a page.

    Returns a summary with per-issue breakdown and cumulative estimates.
    """
    per_issue = []
    total_monthly = 0
    total_annual = 0
    total_clicks = 0
    total_conversions = 0

    for issue in issues:
        impact = estimate_issue_revenue_impact(
            issue,
            monthly_traffic=monthly_traffic,
            industry=industry,
            current_position=current_position,
        )
        per_issue.append(impact)
        total_monthly += impact["estimated_monthly_revenue_loss"]
        total_annual += impact["estimated_annual_revenue_loss"]
        total_clicks += impact["estimated_additional_clicks"]
        total_conversions += impact["estimated_additional_conversions"]

    # Sort by impact (highest first)
    per_issue.sort(key=lambda x: x["estimated_monthly_revenue_loss"], reverse=True)

    # Top 3 quick wins
    quick_wins = per_issue[:3]

    return {
        "total_issues": len(issues),
        "total_estimated_monthly_revenue_loss": total_monthly,
        "total_estimated_annual_revenue_loss": total_annual,
        "total_estimated_additional_clicks": total_clicks,
        "total_estimated_additional_conversions": round(total_conversions, 1),
        "top_quick_wins": [
            {
                "title": w["issue_title"],
                "monthly_impact": w["estimated_monthly_revenue_loss"],
                "explanation": w["explanation"],
            }
            for w in quick_wins
        ],
        "per_issue": per_issue,
        "summary": (
            f"Fixing all {len(issues)} issues could bring approximately "
            f"{total_clicks} additional clicks and {round(total_conversions, 1)} "
            f"new customers per month, worth an estimated "
            f"${total_monthly}/month (${total_annual}/year)."
        ),
        "disclaimer": (
            "All revenue estimates are directional projections based on industry "
            "averages for CTR, conversion rates, and customer value. Individual "
            "results will vary based on your specific market, competition, "
            "implementation quality, and seasonality."
        ),
    }
