"""
Enhanced SEO module — integrates best practices from claude-seo.

Adds to Goodly's existing SEO stack:
- Schema.org JSON-LD generation (20+ business types)
- PageSpeed Insights / Core Web Vitals analysis
- NLP content quality scoring (E-E-A-T)
- IndexNow instant indexing
- SEO drift monitoring
- Semantic keyword clustering
"""

import os
import json
import logging
import asyncio
import hashlib
from datetime import datetime, timezone
from typing import Optional, Dict, List, Any
from urllib.parse import urlparse

logger = logging.getLogger("seo_enhanced")

# ── Schema.org JSON-LD Templates ───────────────────────

SCHEMA_TEMPLATES: Dict[str, dict] = {
    "local_business": {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": "{name}",
        "url": "{url}",
        "telephone": "{phone}",
        "address": {
            "@type": "PostalAddress",
            "streetAddress": "{street}",
            "addressLocality": "{city}",
            "addressRegion": "{state}",
            "postalCode": "{zip}",
            "addressCountry": "{country}",
        },
        "geo": {
            "@type": "GeoCoordinates",
            "latitude": "{lat}",
            "longitude": "{lng}",
        },
        "openingHoursSpecification": [],
        "sameAs": [],
    },
    "restaurant": {
        "@context": "https://schema.org",
        "@type": "Restaurant",
        "name": "{name}",
        "url": "{url}",
        "servesCuisine": "{cuisine}",
        "priceRange": "{price_range}",
        "acceptsReservations": "True",
    },
    "service": {
        "@context": "https://schema.org",
        "@type": "Service",
        "name": "{name}",
        "provider": {"@type": "LocalBusiness", "name": "{business_name}"},
        "areaServed": {"@type": "City", "name": "{city}"},
        "description": "{description}",
    },
    "faq": {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [],
    },
    "article": {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "{title}",
        "author": {"@type": "Person", "name": "{author}"},
        "datePublished": "{date}",
        "dateModified": "{date}",
    },
    "product": {
        "@context": "https://schema.org",
        "@type": "Product",
        "name": "{name}",
        "description": "{description}",
        "offers": {
            "@type": "Offer",
            "price": "{price}",
            "priceCurrency": "USD",
        },
    },
    "review": {
        "@context": "https://schema.org",
        "@type": "Review",
        "itemReviewed": {"@type": "LocalBusiness", "name": "{business_name}"},
        "reviewRating": {"@type": "Rating", "ratingValue": "{rating}"},
        "author": {"@type": "Person", "name": "{author}"},
    },
    "organization": {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "{name}",
        "url": "{url}",
        "logo": "{logo_url}",
        "sameAs": [],
    },
    "website": {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "{name}",
        "url": "{url}",
        "potentialAction": {
            "@type": "SearchAction",
            "target": "{url}/search?q={search_term_string}",
            "query-input": "required name=search_term_string",
        },
    },
    "breadcrumb": {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [],
    },
    "how_to": {
        "@context": "https://schema.org",
        "@type": "HowTo",
        "name": "{name}",
        "step": [],
    },
    "event": {
        "@context": "https://schema.org",
        "@type": "Event",
        "name": "{name}",
        "startDate": "{start_date}",
        "location": {"@type": "Place", "name": "{location}"},
    },
    "job_posting": {
        "@context": "https://schema.org",
        "@type": "JobPosting",
        "title": "{title}",
        "hiringOrganization": {"@type": "Organization", "name": "{company}"},
        "datePosted": "{date}",
    },
    "video": {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        "name": "{name}",
        "description": "{description}",
        "thumbnailUrl": "{thumbnail}",
        "uploadDate": "{date}",
    },
    "course": {
        "@context": "https://schema.org",
        "@type": "Course",
        "name": "{name}",
        "description": "{description}",
        "provider": {"@type": "Organization", "name": "{provider}"},
    },
    "software_application": {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "{name}",
        "applicationCategory": "BusinessApplication",
        "operatingSystem": "Web",
    },
}


def generate_schema(schema_type: str, **kwargs) -> dict:
    """Generate a Schema.org JSON-LD object from a template.

    Args:
        schema_type: One of the SCHEMA_TEMPLATES keys.
        **kwargs: Values to fill into the template.

    Returns:
        A populated JSON-LD dict ready for embedding in HTML.
    """
    import copy
    template = SCHEMA_TEMPLATES.get(schema_type)
    if not template:
        raise ValueError(f"Unknown schema type: {schema_type}. Available: {list(SCHEMA_TEMPLATES.keys())}")

    # Deep copy and format
    schema = copy.deepcopy(template)
    raw = json.dumps(schema)
    for key, value in kwargs.items():
        raw = raw.replace("{" + key + "}", str(value))
    return json.loads(raw)


def generate_schema_html(schema_type: str, **kwargs) -> str:
    """Generate Schema.org JSON-LD as an HTML script tag."""
    schema = generate_schema(schema_type, **kwargs)
    return f'<script type="application/ld+json">\n{json.dumps(schema, indent=2)}\n</script>'


# ── PageSpeed Insights / Core Web Vitals ────────────────

async def check_pagespeed(url: str, strategy: str = "mobile") -> dict:
    """Run PageSpeed Insights via the Google API.

    Requires GOOGLE_API_KEY env var (same key used for Gemini).

    Args:
        url: The URL to analyze.
        strategy: 'mobile' or 'desktop'.

    Returns:
        Dict with performance score, Core Web Vitals, and opportunities.
    """
    api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {"error": "No API key configured", "score": None}

    import httpx
    api_url = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"
    params = {
        "url": url,
        "key": api_key,
        "strategy": strategy,
        "category": ["performance", "accessibility", "best-practices", "seo"],
    }

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.get(api_url, params=params)
            data = resp.json()

        lighthouse = data.get("lighthouseResult", {})
        categories = lighthouse.get("categories", {})
        audits = lighthouse.get("audits", {})

        # Core Web Vitals
        cwv = {}
        for metric in ["largest-contentful-paint", "cumulative-layout-shift",
                        "interaction-to-next-paint", "first-contentful-paint",
                        "total-blocking-time", "speed-index"]:
            audit = audits.get(metric, {})
            cwv[metric] = {
                "displayValue": audit.get("displayValue", "N/A"),
                "score": audit.get("score", None),
            }

        return {
            "url": url,
            "strategy": strategy,
            "performance_score": int(categories.get("performance", {}).get("score", 0) * 100),
            "accessibility_score": int(categories.get("accessibility", {}).get("score", 0) * 100),
            "best_practices_score": int(categories.get("best-practices", {}).get("score", 0) * 100),
            "seo_score": int(categories.get("seo", {}).get("score", 0) * 100),
            "core_web_vitals": cwv,
            "loading_experience": data.get("loadingExperience", {}),
        }
    except Exception as e:
        logger.warning("PageSpeed check failed for %s: %s", url, e)
        return {"error": str(e), "score": None}


# ── NLP Content Quality (E-E-A-T) ──────────────────────

def analyze_content_quality(html: str, text_content: str) -> dict:
    """Analyze content quality signals for E-E-A-T.

    Checks: word count, readability, heading structure, entity mentions,
    author signals, freshness, external citations.

    Args:
        html: Raw HTML of the page.
        text_content: Extracted text content.

    Returns:
        Dict with quality scores and recommendations.
    """
    import re
    from collections import Counter

    words = text_content.split()
    word_count = len(words)
    sentences = [s.strip() for s in re.split(r'[.!?]+', text_content) if s.strip()]
    sentence_count = len(sentences)

    # Readability (Flesch-Kincaid approximation)
    if sentence_count > 0 and word_count > 0:
        avg_words_per_sentence = word_count / sentence_count
        # Rough Flesch: higher = easier to read
        flesch = max(0, min(100, 206.835 - 1.015 * avg_words_per_sentence - 84.6 * 0.15))
    else:
        avg_words_per_sentence = 0
        flesch = 0

    # Heading structure
    h1_count = len(re.findall(r'<h1[^>]*>', html, re.IGNORECASE))
    h2_count = len(re.findall(r'<h2[^>]*>', html, re.IGNORECASE))
    h3_count = len(re.findall(r'<h3[^>]*>', html, re.IGNORECASE))

    # Entity mentions (brands, people, organizations)
    entity_patterns = {
        "email": r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b',
        "phone": r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',
        "address": r'\b\d+\s+[A-Za-z]+\s+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Boulevard|Blvd)\b',
        "social_link": r'(?:facebook|twitter|instagram|linkedin|youtube)\.com',
    }
    entities = {}
    for name, pattern in entity_patterns.items():
        entities[name] = len(re.findall(pattern, text_content, re.IGNORECASE))

    # External links (citations)
    external_links = len(re.findall(r'href="https?://(?!{})[^"]*"'.format(
        re.escape(urlparse(html[:200] if 'http' in html[:200] else '').netloc or 'example.com')
    ), html, re.IGNORECASE)) if html else 0

    # Author signals
    has_author = bool(re.search(r'author|byline|written by', html, re.IGNORECASE))
    has_date = bool(re.search(r'published|updated|date', html, re.IGNORECASE))

    # Scoring
    quality_score = 0
    issues = []

    if word_count < 300:
        issues.append({"severity": "high", "message": f"Thin content: only {word_count} words. Aim for 500+ words."})
    elif word_count < 500:
        issues.append({"severity": "medium", "message": f"Content is short: {word_count} words. Consider expanding to 500+."})
    else:
        quality_score += 20

    if flesch < 30:
        issues.append({"severity": "medium", "message": f"Content is very difficult to read (Flesch: {flesch:.0f}). Simplify language."})
    elif flesch > 70:
        quality_score += 10
    else:
        quality_score += 15

    if h1_count == 0:
        issues.append({"severity": "high", "message": "Missing H1 heading."})
    elif h1_count > 1:
        issues.append({"severity": "medium", "message": f"Multiple H1s ({h1_count}). Use exactly one."})
    else:
        quality_score += 10

    if h2_count < 2:
        issues.append({"severity": "low", "message": "Few H2 subheadings. Add more to structure content."})
    else:
        quality_score += 10

    if external_links < 2:
        issues.append({"severity": "low", "message": "Few external citations. Link to authoritative sources."})
    else:
        quality_score += 10

    if not has_author:
        issues.append({"severity": "low", "message": "No author byline detected. Add author information for E-E-A-T."})
    else:
        quality_score += 5

    if not has_date:
        issues.append({"severity": "low", "message": "No publish date detected. Add dates for freshness signals."})
    else:
        quality_score += 5

    if entities.get("email") or entities.get("phone") or entities.get("address"):
        quality_score += 10

    return {
        "quality_score": min(100, quality_score),
        "word_count": word_count,
        "sentence_count": sentence_count,
        "readability_flesch": round(flesch, 1),
        "avg_words_per_sentence": round(avg_words_per_sentence, 1),
        "headings": {"h1": h1_count, "h2": h2_count, "h3": h3_count},
        "entities_detected": entities,
        "external_citations": external_links,
        "has_author": has_author,
        "has_date": has_date,
        "issues": issues,
    }


# ── IndexNow ───────────────────────────────────────────

async def submit_indexnow(url: str, key: str = None) -> dict:
    """Submit a URL to search engines via IndexNow protocol.

    IndexNow notifies Bing, Yandex, Seznam, and Naver instantly.
    Google doesn't support IndexNow but monitors sitemaps.

    Args:
        url: The URL to submit.
        key: IndexNow API key (generated if not provided).

    Returns:
        Dict with submission results.
    """
    import httpx

    if not key:
        # Generate a deterministic key from the domain
        domain = urlparse(url).netloc
        key = hashlib.sha256(domain.encode()).hexdigest()[:32]

    endpoints = [
        "https://api.indexnow.org/indexnow",
        "https://www.bing.com/indexnow",
        "https://search.seznam.cz/indexnow",
        "https://yandex.com/indexnow",
    ]

    payload = {
        "host": urlparse(url).netloc,
        "key": key,
        "urlList": [url],
    }

    results = {}
    async with httpx.AsyncClient(timeout=10) as client:
        for endpoint in endpoints:
            try:
                resp = await client.post(endpoint, json=payload)
                results[endpoint] = resp.status_code
            except Exception as e:
                results[endpoint] = str(e)

    return {
        "submitted_url": url,
        "key": key,
        "results": results,
        "success": any(
            isinstance(v, int) and 200 <= v < 300
            for v in results.values()
        ),
    }


# ── SEO Drift Monitoring ────────────────────────────────

async def capture_seo_baseline(db, url: str, user_id: str) -> dict:
    """Capture a baseline snapshot of a page's SEO state for drift monitoring.

    Stores: title, meta description, H1, word count, schema types,
    canonical URL, robots directives, and a content hash.
    """
    import httpx
    from bs4 import BeautifulSoup

    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
            resp = await client.get(url, headers={"User-Agent": "GoodlyBot/1.0"})
            html = resp.text
    except Exception as e:
        return {"error": str(e)}

    soup = BeautifulSoup(html, "html.parser")

    # Extract key SEO signals
    title = soup.title.string.strip() if soup.title else ""
    meta_desc = ""
    meta_tag = soup.find("meta", attrs={"name": "description"})
    if meta_tag:
        meta_desc = meta_tag.get("content", "")

    h1_tags = [h.get_text(strip=True) for h in soup.find_all("h1")]
    h1 = h1_tags[0] if h1_tags else ""

    # Schema types present
    schema_types = []
    for script in soup.find_all("script", type="application/ld+json"):
        try:
            data = json.loads(script.string)
            if isinstance(data, dict):
                schema_types.append(data.get("@type", "Unknown"))
            elif isinstance(data, list):
                for item in data:
                    if isinstance(item, dict):
                        schema_types.append(item.get("@type", "Unknown"))
        except Exception:
            pass

    # Canonical
    canonical = ""
    canon_tag = soup.find("link", rel="canonical")
    if canon_tag:
        canonical = canon_tag.get("href", "")

    # Robots
    robots = ""
    robots_tag = soup.find("meta", attrs={"name": "robots"})
    if robots_tag:
        robots = robots_tag.get("content", "")

    # Text content
    text = soup.get_text(separator=" ", strip=True)
    word_count = len(text.split())

    # Content hash for detecting changes
    content_hash = hashlib.sha256(text.encode()).hexdigest()

    baseline = {
        "url": url,
        "user_id": user_id,
        "captured_at": datetime.now(timezone.utc).isoformat(),
        "title": title,
        "meta_description": meta_desc,
        "h1": h1,
        "word_count": word_count,
        "schema_types": schema_types,
        "canonical_url": canonical,
        "robots_directive": robots,
        "content_hash": content_hash,
        "status_code": resp.status_code,
    }

    # Store in DB
    await db.seo_baselines.insert_one(baseline)
    return baseline


async def compare_seo_drift(db, url: str, user_id: str) -> dict:
    """Compare current page state to the most recent baseline.

    Returns a drift report showing what changed.
    """
    # Get latest baseline
    baseline = await db.seo_baselines.find_one(
        {"url": url, "user_id": user_id},
        sort=[("captured_at", -1)],
    )
    if not baseline:
        return {"error": "No baseline found. Run capture_seo_baseline first."}

    # Capture current state
    current = await capture_seo_baseline(db, url, user_id)
    if "error" in current:
        return current

    # Compare
    changes = []
    for field in ["title", "meta_description", "h1", "word_count",
                   "canonical_url", "robots_directive", "content_hash"]:
        old_val = baseline.get(field)
        new_val = current.get(field)
        if old_val != new_val:
            changes.append({
                "field": field,
                "before": old_val,
                "after": new_val,
            })

    # Schema changes
    old_schemas = set(baseline.get("schema_types", []))
    new_schemas = set(current.get("schema_types", []))
    added = new_schemas - old_schemas
    removed = old_schemas - new_schemas
    if added:
        changes.append({"field": "schema_types_added", "before": [], "after": list(added)})
    if removed:
        changes.append({"field": "schema_types_removed", "before": list(removed), "after": []})

    return {
        "url": url,
        "baseline_captured": baseline["captured_at"],
        "current_captured": current["captured_at"],
        "changes": changes,
        "has_changes": len(changes) > 0,
        "baseline": baseline,
        "current": current,
    }


# ── Semantic Keyword Clustering ─────────────────────────

def cluster_keywords(keywords: List[str], n_clusters: int = 5) -> dict:
    """Group related keywords into semantic clusters.

    Uses simple word-overlap clustering (no external deps).
    For production, swap in sentence-transformers for better results.

    Args:
        keywords: List of keyword strings.
        n_clusters: Number of clusters to create.

    Returns:
        Dict with cluster assignments and cluster keywords.
    """
    from collections import defaultdict
    import re

    # Tokenize keywords
    tokenized = []
    for kw in keywords:
        tokens = set(re.findall(r'\b[a-z]{3,}\b', kw.lower()))
        tokenized.append(tokens)

    # Simple greedy clustering by token overlap
    clusters = defaultdict(list)
    cluster_keywords = defaultdict(list)

    for i, (kw, tokens) in enumerate(zip(keywords, tokenized)):
        best_cluster = -1
        best_overlap = 0

        for cid, cwords in cluster_keywords.items():
            overlap = len(tokens & cwords)
            if overlap > best_overlap:
                best_overlap = overlap
                best_cluster = cid

        if best_overlap > 0 and best_cluster >= 0:
            clusters[best_cluster].append(kw)
            cluster_keywords[best_cluster] |= tokens
        else:
            # New cluster
            cid = len(clusters)
            if cid < n_clusters:
                clusters[cid].append(kw)
                cluster_keywords[cid] = tokens
            else:
                # Assign to smallest cluster
                smallest = min(clusters.keys(), key=lambda k: len(clusters[k]))
                clusters[smallest].append(kw)
                cluster_keywords[smallest] |= tokens

    return {
        "n_clusters": len(clusters),
        "clusters": [
            {
                "id": cid,
                "keywords": kws,
                "count": len(kws),
                "primary_keyword": max(kws, key=len) if kws else "",
            }
            for cid, kws in sorted(clusters.items())
        ],
    }
