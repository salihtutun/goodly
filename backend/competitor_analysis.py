"""Competitor analysis — compare a site against its top competitors."""

import asyncio
from typing import Dict, List
from seo_analyzer import analyze_url


async def compare_competitors(
    target_url: str,
    competitor_urls: List[str],
) -> Dict:
    """Audit the target site and its competitors, return a comparison report.

    Returns a dict with:
    - target: audit result for the target site
    - competitors: list of audit results for each competitor
    - comparison: head-to-head comparison on key metrics
    - insights: what the top competitor does differently
    - recommendations: specific actions to beat competitors
    """
    # Audit all sites in parallel
    tasks = [analyze_url(target_url)] + [analyze_url(u) for u in competitor_urls]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    target_result = results[0] if not isinstance(results[0], Exception) else None
    competitor_results = [
        r for r in results[1:] if not isinstance(r, Exception)
    ]

    if not target_result or target_result.get("fetch_failed"):
        return {"error": "Could not analyze target site", "target": target_result}

    # Build comparison
    comparison = _build_comparison(target_result, competitor_results)

    # Find the top competitor
    top_competitor = None
    top_score = 0
    for c in competitor_results:
        score = c.get("overall_score", 0)
        if score > top_score:
            top_score = score
            top_competitor = c

    # Generate insights
    insights = _generate_insights(target_result, top_competitor) if top_competitor else []

    return {
        "target": {
            "url": target_result.get("url"),
            "overall_score": target_result.get("overall_score"),
            "categories": target_result.get("categories"),
            "issues": target_result.get("issues", []),
            "load_time_ms": target_result.get("load_time_ms"),
            "word_count": (target_result.get("content") or {}).get("word_count", 0),
        },
        "competitors": [
            {
                "url": c.get("url"),
                "overall_score": c.get("overall_score"),
                "categories": c.get("categories"),
                "load_time_ms": c.get("load_time_ms"),
                "word_count": (c.get("content") or {}).get("word_count", 0),
            }
            for c in competitor_results
        ],
        "comparison": comparison,
        "top_competitor": {
            "url": top_competitor.get("url") if top_competitor else None,
            "overall_score": top_score,
        } if top_competitor else None,
        "insights": insights,
        "recommendations": _generate_recommendations(target_result, top_competitor) if top_competitor else [],
    }


def _build_comparison(target: Dict, competitors: List[Dict]) -> Dict:
    """Build a head-to-head comparison on key metrics."""
    if not competitors:
        return {"message": "No competitors to compare"}

    avg_score = sum(c.get("overall_score", 0) for c in competitors) / len(competitors)
    best_score = max(c.get("overall_score", 0) for c in competitors)
    worst_score = min(c.get("overall_score", 0) for c in competitors)

    target_cats = target.get("categories") or {}
    avg_cats = {}
    for key in target_cats:
        vals = [(c.get("categories") or {}).get(key, 0) for c in competitors]
        avg_cats[key] = int(sum(vals) / len(vals)) if vals else 0

    return {
        "target_score": target.get("overall_score", 0),
        "competitor_avg_score": int(avg_score),
        "competitor_best_score": best_score,
        "competitor_worst_score": worst_score,
        "score_gap_to_best": best_score - target.get("overall_score", 0),
        "target_categories": target_cats,
        "competitor_avg_categories": avg_cats,
        "target_load_ms": target.get("load_time_ms", 0),
        "competitor_avg_load_ms": int(sum(c.get("load_time_ms", 0) for c in competitors) / len(competitors)),
        "target_word_count": (target.get("content") or {}).get("word_count", 0),
        "competitor_avg_word_count": int(sum((c.get("content") or {}).get("word_count", 0) for c in competitors) / len(competitors)),
    }


def _generate_insights(target: Dict, top_competitor: Dict) -> List[str]:
    """Generate specific insights about what the top competitor does differently."""
    insights = []

    target_score = target.get("overall_score", 0)
    top_score = top_competitor.get("overall_score", 0)

    if top_score > target_score:
        insights.append(
            f"The top competitor scores {top_score}/100 — {top_score - target_score} points higher than your {target_score}/100."
        )

    # Compare categories
    target_cats = target.get("categories") or {}
    top_cats = top_competitor.get("categories") or {}

    for cat, label in [
        ("meta_tags", "Meta Tags"),
        ("headings", "Headings"),
        ("performance", "Page Speed"),
        ("mobile", "Mobile Friendliness"),
        ("content", "Content Quality"),
        ("security", "Security"),
    ]:
        t_val = target_cats.get(cat, 0)
        c_val = top_cats.get(cat, 0)
        if c_val > t_val + 10:
            insights.append(
                f"{label}: Your score is {t_val}/100 vs competitor's {c_val}/100. "
                f"This is a {c_val - t_val} point gap you can close."
            )

    # Load time comparison
    target_load = target.get("load_time_ms", 0)
    top_load = top_competitor.get("load_time_ms", 0)
    if top_load < target_load and target_load > 1000:
        insights.append(
            f"Page Speed: Your site loads in {int(target_load)}ms vs competitor's {int(top_load)}ms. "
            f"Faster sites rank higher. Aim for under 1,800ms."
        )

    # Word count comparison
    target_words = (target.get("content") or {}).get("word_count", 0)
    top_words = (top_competitor.get("content") or {}).get("word_count", 0)
    if top_words > target_words + 200:
        insights.append(
            f"Content: Your page has {target_words} words vs competitor's {top_words} words. "
            f"Longer, more detailed content tends to rank better."
        )

    return insights


def _generate_recommendations(target: Dict, top_competitor: Dict) -> List[Dict]:
    """Generate specific, actionable recommendations to beat competitors."""
    recommendations = []

    target_cats = target.get("categories") or {}
    top_cats = top_competitor.get("categories") or {}

    # Find the biggest gaps
    gaps = []
    for cat, label in [
        ("meta_tags", "Meta Tags"),
        ("headings", "Headings"),
        ("performance", "Page Speed"),
        ("mobile", "Mobile Friendliness"),
        ("content", "Content Quality"),
        ("security", "Security"),
    ]:
        gap = (top_cats.get(cat, 0) or 0) - (target_cats.get(cat, 0) or 0)
        if gap > 5:
            gaps.append((cat, label, gap))

    gaps.sort(key=lambda x: x[2], reverse=True)

    for cat, label, gap in gaps[:5]:
        if cat == "meta_tags":
            recommendations.append({
                "category": label,
                "gap": gap,
                "action": "Add or improve your title tag (50-60 chars) and meta description (120-160 chars). The top competitor has better meta tags — this is the easiest win.",
                "effort": "Low",
                "impact": "High",
            })
        elif cat == "headings":
            recommendations.append({
                "category": label,
                "gap": gap,
                "action": "Ensure every page has exactly one H1 heading and use H2/H3 for sub-sections. The top competitor structures their content better.",
                "effort": "Low",
                "impact": "Medium",
            })
        elif cat == "performance":
            recommendations.append({
                "category": label,
                "gap": gap,
                "action": "Compress images, enable browser caching, and consider a CDN. The top competitor's site loads faster — Google rewards speed.",
                "effort": "Medium",
                "impact": "High",
            })
        elif cat == "mobile":
            recommendations.append({
                "category": label,
                "gap": gap,
                "action": "Add a viewport meta tag and test your site on mobile devices. Over 60% of searches are on mobile.",
                "effort": "Low",
                "impact": "High",
            })
        elif cat == "content":
            recommendations.append({
                "category": label,
                "gap": gap,
                "action": "Expand your page content to 600+ words with helpful, original information. The top competitor has more detailed content.",
                "effort": "Medium",
                "impact": "High",
            })
        elif cat == "security":
            recommendations.append({
                "category": label,
                "gap": gap,
                "action": "Install an SSL certificate and force HTTPS. Google marks non-HTTPS sites as 'Not Secure.'",
                "effort": "Low",
                "impact": "Medium",
            })

    return recommendations
