"""
Enhanced SEO module — integrates best practices from claude-seo.

Adds to Goodly's existing SEO stack:
- Schema.org JSON-LD generation (20+ business types)
- PageSpeed Insights / Core Web Vitals analysis
- NLP content quality scoring (E-E-A-T)
- IndexNow instant indexing
- SEO drift monitoring
- Semantic keyword clustering
- AI content humanizer (46 AI-pattern replacements)
- Preload / Speculation Rules / bfcache audit
- Google NLP entity + sentiment analysis
- LCP sub-parts breakdown (CrUX API)
- Parasite SEO risk detection
"""

import os
import json
import logging
import hashlib
from datetime import datetime, timezone
from typing import Dict, List
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

    # External links (citations) — count distinct absolute-URL domains.
    # We don't know the page's own domain here, so counting unique domains
    # approximates "cites external sources" without inventing an exclusion.
    link_domains = {
        urlparse(href).netloc
        for href in re.findall(r'href=["\'](https?://[^"\']+)["\']', html, re.IGNORECASE)
    } if html else set()
    external_links = len(link_domains)

    # Author signals
    has_author = bool(re.search(r'author|byline|written by', html, re.IGNORECASE))
    has_date = bool(re.search(r'published|updated|date', html, re.IGNORECASE))

    # Scoring — weighted across 6 dimensions (max 100)
    # Word count: 0-25 points (proportional, max at 1000+ words)
    # Readability: 0-20 points
    # Heading structure: 0-20 points     (requires html)
    # External citations: 0-15 points    (requires html)
    # Author/date signals: 0-10 points   (requires html)
    # Entity/trust signals: 0-10 points
    #
    # When called with text only (no html), the 45 html-dependent points are
    # unreachable, so the final score is rescaled over the 55 achievable
    # points — otherwise good text could never score above 55/100.
    has_html = bool(html and html.strip())
    quality_score = 0
    issues = []

    # Word count (0-25 pts): proportional, not binary
    if word_count >= 1000:
        quality_score += 25
    elif word_count >= 500:
        quality_score += 20
    elif word_count >= 300:
        quality_score += 15
    elif word_count >= 150:
        quality_score += 10
    elif word_count >= 50:
        quality_score += 5
    else:
        quality_score += 2  # at least something for having content

    if word_count < 150:
        issues.append({"severity": "high", "message": f"Very thin content: only {word_count} words. Aim for 300+ words."})
    elif word_count < 300:
        issues.append({"severity": "medium", "message": f"Content is short: {word_count} words. Consider expanding to 500+."})

    # Readability (0-20 pts)
    if flesch < 30:
        quality_score += 5
        issues.append({"severity": "medium", "message": f"Content is very difficult to read (Flesch: {flesch:.0f}). Simplify language."})
    elif flesch < 50:
        quality_score += 12
    elif flesch < 70:
        quality_score += 16
    else:
        quality_score += 20

    # Heading structure (0-20 pts) — only meaningful when html was provided;
    # complaining about a missing H1 in a plain-text snippet is noise.
    if has_html:
        if h1_count == 0:
            issues.append({"severity": "high", "message": "Missing H1 heading."})
        elif h1_count > 1:
            quality_score += 5
            issues.append({"severity": "medium", "message": f"Multiple H1s ({h1_count}). Use exactly one."})
        else:
            quality_score += 10

        if h2_count >= 3:
            quality_score += 10
        elif h2_count >= 1:
            quality_score += 5
        else:
            issues.append({"severity": "low", "message": "No H2 subheadings. Add more to structure content."})

        # External citations (0-15 pts)
        if external_links >= 5:
            quality_score += 15
        elif external_links >= 2:
            quality_score += 10
        elif external_links >= 1:
            quality_score += 5
        else:
            issues.append({"severity": "low", "message": "No external citations. Link to authoritative sources."})

        # Author/date signals (0-10 pts)
        if has_author:
            quality_score += 5
        else:
            issues.append({"severity": "low", "message": "No author byline detected. Add author information for E-E-A-T."})

        if has_date:
            quality_score += 5
        else:
            issues.append({"severity": "low", "message": "No publish date detected. Add dates for freshness signals."})

    # Entity/trust signals (0-10 pts)
    entity_count = sum(1 for v in entities.values() if v > 0)
    if entity_count >= 3:
        quality_score += 10
    elif entity_count >= 1:
        quality_score += 5

    # Rescale text-only scores over the 55 achievable points so the 0-100
    # range means the same thing regardless of whether html was supplied.
    if not has_html:
        quality_score = round(quality_score * 100 / 55)

    return {
        "quality_score": min(100, quality_score),
        "scored_dimensions": "all" if has_html else "text_only",
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

    # Extract key SEO signals. get_text() instead of .string — .string is
    # None when <title> has nested markup, which crashed with AttributeError.
    title = soup.title.get_text(strip=True) if soup.title else ""
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

    # Store in DB. insert_one mutates the dict by adding a Mongo ObjectId
    # under _id, which FastAPI can't JSON-serialize — pop it before returning
    # (this was the cause of the drift endpoints' 500s).
    await db.seo_baselines.insert_one(baseline)
    baseline.pop("_id", None)
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
    baseline.pop("_id", None)  # ObjectId isn't JSON-serializable

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

    Uses TF-IDF-weighted token overlap clustering.
    Common words across many keywords are downweighted to prevent
    chain-merging of diverse keywords into a single cluster.

    Args:
        keywords: List of keyword strings.
        n_clusters: Number of clusters to create.

    Returns:
        Dict with cluster assignments and cluster keywords.
    """
    from collections import defaultdict, Counter
    import re
    import math

    # Tokenize keywords
    tokenized = []
    for kw in keywords:
        tokens = set(re.findall(r'\b[a-z]{3,}\b', kw.lower()))
        tokenized.append(tokens)

    # Compute IDF-like weights: common tokens get lower weight
    n_docs = len(keywords)
    token_df = Counter()
    for tokens in tokenized:
        for t in tokens:
            token_df[t] += 1

    def token_weight(token):
        """IDF-like: rare tokens get higher weight."""
        df = token_df.get(token, 1)
        return math.log((n_docs + 1) / (df + 1)) + 1

    # Weighted overlap clustering
    clusters = defaultdict(list)
    cluster_keywords = defaultdict(dict)  # cid -> {token: weight}

    for i, (kw, tokens) in enumerate(zip(keywords, tokenized)):
        best_cluster = -1
        best_overlap = 0.0

        for cid, cweights in cluster_keywords.items():
            # Weighted Jaccard-like overlap
            shared = tokens & set(cweights.keys())
            if not shared:
                continue
            overlap = sum(token_weight(t) for t in shared)
            if overlap > best_overlap:
                best_overlap = overlap
                best_cluster = cid

        # Require minimum overlap to join existing cluster
        MIN_OVERLAP = 1.5
        if best_overlap >= MIN_OVERLAP and best_cluster >= 0:
            clusters[best_cluster].append(kw)
            for t in tokens:
                cluster_keywords[best_cluster][t] = cluster_keywords[best_cluster].get(t, 0) + token_weight(t)
        else:
            # New cluster
            cid = len(clusters)
            if cid < n_clusters:
                clusters[cid].append(kw)
                cluster_keywords[cid] = {t: token_weight(t) for t in tokens}
            else:
                # Assign to smallest cluster
                smallest = min(clusters.keys(), key=lambda k: len(clusters[k]))
                clusters[smallest].append(kw)
                for t in tokens:
                    cluster_keywords[smallest][t] = cluster_keywords[smallest].get(t, 0) + token_weight(t)

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


# ── AI Content Humanizer ───────────────────────────────
# 46 AI-pattern replacements from claude-seo's content_humanize.py.
# Attribution: Wikipedia "AI Cleanup" catalogue (CC BY-SA 4.0) and
# ivankuznetsov/claude-seo's 24-pattern list (MIT).

import re as _re

_HUMANIZE_PATTERNS: list = [
    (_re.compile(p, _re.IGNORECASE), repl, label)
    for p, repl, label in [
        (r"\bdelve\s+deeper\s+into\b", "explore", "delve-deeper-into"),
        (r"\bdelve\s+into\b", "explore", "delve-into"),
        (r"\bin\s+the\s+ever-evolving\s+landscape\s+of\b", "in", "ever-evolving-landscape"),
        (r"\bin\s+the\s+ever-evolving\s+world\s+of\b", "in", "ever-evolving-world"),
        (r"\bever-evolving\b", "changing", "ever-evolving"),
        (r"\bever-changing\b", "changing", "ever-changing"),
        (r"\bnavigating\s+the\s+complexities\s+of\b", "handling", "navigating-complexities"),
        (r"\btapestry\s+of\b", "range of", "tapestry-of"),
        (r"\b(rich|intricate|complex)\s+tapestry\b", "range", "rich-tapestry"),
        (r"\bembark\s+on\s+a\s+journey\b", "begin", "embark-journey"),
        (r"\ba\s+testament\s+to\b", "evidence of", "testament-to"),
        (r"\ba\s+beacon\s+of\b", "a leader in", "beacon-of"),
        (r"\b(the\s+|a\s+)?cornerstone\s+of\b", "central to", "cornerstone-of"),
        (r"\bat\s+the\s+heart\s+of\b", "central to", "at-the-heart-of"),
        (r"\bin\s+essence,\s*", "", "in-essence"),
        (r"\bin\s+conclusion,\s*", "", "in-conclusion"),
        (r"\bultimately,\s*", "", "ultimately-comma"),
        (r"\bmoreover,\s*", "", "moreover-comma"),
        (r"\bfurthermore,\s*", "", "furthermore-comma"),
        (r"\bhowever,\s+it'?s\s+worth\s+noting\s+that\b", "however,", "worth-noting-clause"),
        (r"\bit'?s\s+worth\s+noting\s+that\b", "note:", "worth-noting"),
        (r"\bby\s+leveraging\b", "by using", "by-leveraging"),
        (r"\bleverage\s+the\s+power\s+of\b", "use", "leverage-power"),
        (r"\bleveraging\s+the\s+power\s+of\b", "using", "leveraging-power"),
        (r"\bharness\s+the\s+power\s+of\b", "use", "harness-power"),
        (r"\bunlock\s+(?:the\s+(?:full\s+)?)?potential\b", "use", "unlock-potential"),
        (r"\bopen\s+up\s+a\s+world\s+of\b", "enable", "open-world"),
        (r"\ba\s+world\s+of\s+possibilities\b", "options", "world-possibilities"),
        (r"\belevate\s+your\b", "improve your", "elevate-your"),
        (r"\btransform\s+your\b", "improve your", "transform-your"),
        (r"\brevolutionize\s+the\s+way\b", "change how", "revolutionize-the-way"),
        (r"\bgame-?changer\b", "important", "game-changer"),
        (r"\bcutting-?edge\b", "modern", "cutting-edge"),
        (r"\bstate-of-the-art\b", "modern", "state-of-the-art"),
        (r"\bin\s+summary,\s*", "", "in-summary"),
        (r"\bto\s+summarize,\s*", "", "to-summarize"),
        (r"\bto\s+put\s+it\s+simply,\s*", "", "to-put-simply"),
        (r"\bin\s+a\s+nutshell,\s*", "", "in-nutshell"),
        (r"\bit'?s\s+important\s+to\s+note\s+that\b", "note:", "important-note"),
        (r"\bin\s+today'?s\s+(fast-paced|digital|competitive)\s+(world|age|landscape)\b", "today", "today-cliche"),
        (r"\bneedless\s+to\s+say,?\s*", "", "needless-to-say"),
        (r"\bat\s+the\s+end\s+of\s+the\s+day\b", "ultimately", "end-of-the-day"),
        (r"\bwhen\s+it\s+comes\s+to\b", "for", "when-it-comes-to"),
        (r"\bfirst\s+and\s+foremost,?\s*", "first,", "first-and-foremost"),
        (r"\blast\s+but\s+not\s+least,?\s*", "finally,", "last-but-not-least"),
        (r"\blet'?s\s+dive\s+(in|into)\b", "starting with", "let-us-dive"),
        (r"\blet\s+us\s+dive\s+(in|into)\b", "starting with", "let-us-dive"),
        (r"\blet'?s\s+take\s+a\s+(closer|deeper)\s+look\b", "look at", "let-us-take-look"),
    ]
]


def humanize_content(text: str) -> dict:
    """Remove AI-typical filler phrases from content.

    Applies 46 deterministic 1:1 replacements for phrases like
    "delve into", "ever-evolving landscape", "game-changer", etc.
    Returns cleaned text + change log.

    Args:
        text: The content to humanize.

    Returns:
        Dict with 'cleaned' text, 'changes' list, and 'change_count'.
    """
    changes = []
    cleaned = text

    for pattern, replacement, label in _HUMANIZE_PATTERNS:
        def _make_repl(repl, lbl):
            def _repl(match):
                original = match.group(0)
                new = repl
                if original and original[0].isupper() and repl and not repl[0].isupper():
                    new = repl[0].upper() + repl[1:]
                changes.append({"label": lbl, "from": original, "to": new})
                return new
            return _repl
        cleaned = pattern.sub(_make_repl(replacement, label), cleaned)

    cleaned = _re.sub(r"  +", " ", cleaned)
    cleaned = _re.sub(r" ([,.;:!?])", r"\1", cleaned)

    return {"cleaned": cleaned, "changes": changes, "change_count": len(changes)}


# ── Preload / Speculation Rules / bfcache Audit ────────
# From claude-seo's preload_check.py

_SPECULATION_BLOCK_RE = _re.compile(
    r'<script\b[^>]*\btype\s*=\s*["\']speculationrules["\'][^>]*>(?P<body>.*?)</script>',
    _re.IGNORECASE | _re.DOTALL,
)
_PRELOAD_LINK_RE = _re.compile(
    r'<link\b[^>]*\brel\s*=\s*["\']preload["\'][^>]*>', _re.IGNORECASE,
)
_PRERENDER_LINK_RE = _re.compile(
    r'<link\b[^>]*\brel\s*=\s*["\']prerender["\'][^>]*>', _re.IGNORECASE,
)
_FETCHPRIORITY_HIGH_RE = _re.compile(
    r'\bfetchpriority\s*=\s*["\']high["\']', _re.IGNORECASE,
)
_LCP_IMG_HINT_RE = _re.compile(
    r'<(?:img|video|source)\b[^>]*\bfetchpriority\s*=\s*["\']high["\']',
    _re.IGNORECASE,
)
_UNLOAD_LISTENER_RE = _re.compile(
    r'\b(?:addEventListener|on)\s*\(\s*["\']?unload["\']?', _re.IGNORECASE,
)
_BEFOREUNLOAD_LISTENER_RE = _re.compile(
    r'\b(?:addEventListener|on)\s*\(\s*["\']?beforeunload["\']?', _re.IGNORECASE,
)


def audit_preload_signals(html: str, headers: dict = None) -> dict:
    """Audit Speculation Rules, bfcache, prerender, and LCP preload signals.

    Checks for:
    - <script type="speculationrules"> blocks (Chrome 121+)
    - Speculation-Rules HTTP header (Chrome 122+)
    - <link rel="preload"> hints
    - Deprecated <link rel="prerender">
    - bfcache killers: Cache-Control: no-store, unload listeners
    - LCP resource hints: fetchpriority=high on images

    Args:
        html: Raw HTML of the page.
        headers: Optional dict of response headers.

    Returns:
        Dict with score (0-100) and recommendations.
    """
    headers = headers or {}
    speculation_blocks = list(_SPECULATION_BLOCK_RE.finditer(html))
    actions = set()
    for m in speculation_blocks:
        try:
            payload = json.loads(m.group("body").strip())
            for action_kind in ("prefetch", "prerender"):
                if isinstance(payload.get(action_kind), list):
                    actions.add(action_kind)
        except json.JSONDecodeError:
            pass

    speculation_header = "speculation-rules" in {k.lower() for k in headers}
    preload_count = len(_PRELOAD_LINK_RE.findall(html))
    prerender_count = len(_PRERENDER_LINK_RE.findall(html))
    fetchpriority_count = len(_FETCHPRIORITY_HIGH_RE.findall(html))
    lcp_img_hint = bool(_LCP_IMG_HINT_RE.search(html))

    cc_value = ""
    for key, value in headers.items():
        if key.lower() == "cache-control":
            cc_value = value or ""
            break
    cache_control_no_store = "no-store" in cc_value.lower()
    has_unload = bool(_UNLOAD_LISTENER_RE.search(html))
    has_beforeunload = bool(_BEFOREUNLOAD_LISTENER_RE.search(html))

    score = 0
    recs = []

    if speculation_blocks or speculation_header:
        score += 25
    else:
        recs.append("Add <script type=\"speculationrules\"> for prefetch+prerender on top user-paths.")

    if lcp_img_hint:
        score += 25
    else:
        recs.append("Mark the LCP hero image with fetchpriority=\"high\".")

    if not cache_control_no_store and not has_unload:
        score += 25
    else:
        if cache_control_no_store:
            recs.append("Cache-Control: no-store disqualifies the page from bfcache. Remove it.")
        if has_unload:
            recs.append("Unload listener disqualifies the page from bfcache. Switch to pagehide.")

    if prerender_count == 0:
        score += 25
    else:
        recs.append(f"Found {prerender_count} <link rel=\"prerender\"> (deprecated). Migrate to speculation rules.")

    return {
        "speculation_rules": {
            "inline_blocks": len(speculation_blocks),
            "header_present": speculation_header,
            "actions": sorted(actions),
        },
        "preload_hints": preload_count,
        "prerender_links": prerender_count,
        "bfcache_signals": {
            "cache_control_no_store": cache_control_no_store,
            "unload_listener": has_unload,
            "beforeunload_listener": has_beforeunload,
        },
        "lcp_resource_hints": {
            "preload_lcp_candidate": lcp_img_hint,
            "fetchpriority_high": fetchpriority_count,
        },
        "score": score,
        "recommendations": recs,
    }


# ── Google NLP Entity + Sentiment Analysis ─────────────
# From claude-seo's nlp_analyze.py

async def analyze_nlp(text: str, features: list = None) -> dict:
    """Analyze text using Google Cloud Natural Language API.

    Extracts entities (with salience, type, sentiment), document sentiment,
    content classification categories, and moderation flags.

    Uses the same GOOGLE_API_KEY / GEMINI_API_KEY as other services.

    Args:
        text: Text content to analyze (max 100K chars sent to API).
        features: List of features: entities, sentiment, classify, moderate.

    Returns:
        Dict with entities, sentiment, categories, and moderation results.
    """
    import httpx

    api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {"error": "No API key configured", "entities": [], "sentiment": None}

    if features is None:
        features = ["entities", "sentiment", "classify"]

    result = {
        "text_length": len(text),
        "entities": [],
        "sentiment": None,
        "categories": [],
        "moderation": [],
        "error": None,
    }

    document = {"type": "PLAIN_TEXT", "content": text[:100000], "languageCode": "en"}

    # Entities via v1 (returns Knowledge Graph metadata + salience)
    if "entities" in features:
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(
                    "https://language.googleapis.com/v1/documents:analyzeEntities",
                    json={"document": document, "encodingType": "UTF8"},
                    params={"key": api_key},
                )
                if resp.status_code == 200:
                    entity_data = resp.json()
                    for entity in entity_data.get("entities", []):
                        mentions = entity.get("mentions", [])
                        result["entities"].append({
                            "name": entity.get("name", ""),
                            "type": entity.get("type", "UNKNOWN"),
                            "salience": round(entity.get("salience", 0), 4),
                            "sentiment_score": entity.get("sentiment", {}).get("score"),
                            "sentiment_magnitude": entity.get("sentiment", {}).get("magnitude"),
                            "mention_count": len(mentions),
                            "metadata": entity.get("metadata", {}),
                        })
                    result["entities"].sort(key=lambda e: e["salience"], reverse=True)
                elif resp.status_code == 403:
                    result["error"] = "NLP API not enabled. Enable Cloud Natural Language API in GCP Console."
                    return result
        except Exception as e:
            logger.warning("NLP entities failed: %s", e)

    # Sentiment + classify + moderate via v2 annotateText
    feature_map = {}
    for f in features:
        if f == "sentiment":
            feature_map["extractDocumentSentiment"] = True
        elif f == "classify":
            feature_map["classifyText"] = True
        elif f == "moderate":
            feature_map["moderateText"] = True

    if feature_map:
        try:
            async with httpx.AsyncClient(timeout=30) as client:
                resp = await client.post(
                    "https://language.googleapis.com/v2/documents:annotateText",
                    json={"document": document, "features": feature_map, "encodingType": "UTF8"},
                    params={"key": api_key},
                )
                if resp.status_code == 200:
                    data = resp.json()

                    doc_sentiment = data.get("documentSentiment", {})
                    if doc_sentiment:
                        score = doc_sentiment.get("score", 0)
                        magnitude = doc_sentiment.get("magnitude", 0)
                        if score > 0.25:
                            tone = "positive"
                        elif score < -0.25:
                            tone = "negative"
                        else:
                            tone = "neutral"
                        result["sentiment"] = {
                            "score": round(score, 3),
                            "magnitude": round(magnitude, 3),
                            "tone": tone,
                        }

                    for cat in data.get("categories", []):
                        result["categories"].append({
                            "name": cat.get("name", ""),
                            "confidence": round(cat.get("confidence", 0), 4),
                        })

                    for mod in data.get("moderationCategories", []):
                        if mod.get("confidence", 0) > 0.5:
                            result["moderation"].append({
                                "name": mod.get("name", ""),
                                "confidence": round(mod.get("confidence", 0), 4),
                            })
        except Exception as e:
            logger.warning("NLP annotate failed: %s", e)

    return result


# ── LCP Sub-parts Breakdown (CrUX API) ─────────────────
# From claude-seo's lcp_subparts.py

async def analyze_lcp_subparts(url: str, form_factor: str = "PHONE") -> dict:
    """Break down LCP into 4 sub-metrics via Chrome UX Report API.

    Decomposes slow LCP into: TTFB, resource load delay, load duration,
    and element render delay. Uses the same GOOGLE_API_KEY.

    Args:
        url: Full URL to analyze (must be in CrUX dataset).
        form_factor: 'PHONE' or 'DESKTOP'.

    Returns:
        Dict with LCP sub-part timings in milliseconds.
    """
    import httpx

    api_key = os.environ.get("GOOGLE_API_KEY") or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {"error": "No API key configured"}

    lcp_metrics = [
        "largest_contentful_paint_image_time_to_first_byte",
        "largest_contentful_paint_image_resource_load_delay",
        "largest_contentful_paint_image_resource_load_duration",
        "largest_contentful_paint_image_element_render_delay",
    ]

    payload = {
        "url": url,
        "formFactor": form_factor,
        "metrics": lcp_metrics + ["largest_contentful_paint"],
    }

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                "https://chromeuxreport.googleapis.com/v1/records:queryRecord",
                json=payload,
                params={"key": api_key},
            )
            if resp.status_code != 200:
                return {"error": f"CrUX API error: {resp.status_code}", "url": url}

            data = resp.json()
            record = data.get("record", {})
            metrics = record.get("metrics", {})

            result = {"url": url, "form_factor": form_factor}

            for metric_name in lcp_metrics + ["largest_contentful_paint"]:
                metric = metrics.get(metric_name, {})
                p75 = metric.get("percentiles", {}).get("p75")
                if p75 is not None:
                    result[metric_name.replace("largest_contentful_paint_image_", "")] = p75
                result[f"{metric_name}_histogram"] = metric.get("histogram", [])

            # Calculate phase breakdown
            ttfb = result.get("time_to_first_byte", 0)
            load_delay = result.get("resource_load_delay", 0)
            load_duration = result.get("resource_load_duration", 0)
            render_delay = result.get("element_render_delay", 0)
            total = ttfb + load_delay + load_duration + render_delay

            result["phase_breakdown"] = {
                "ttfb_pct": round(ttfb / total * 100, 1) if total else 0,
                "load_delay_pct": round(load_delay / total * 100, 1) if total else 0,
                "load_duration_pct": round(load_duration / total * 100, 1) if total else 0,
                "render_delay_pct": round(render_delay / total * 100, 1) if total else 0,
                "total_ms": total,
            }

            return result
    except Exception as e:
        return {"error": str(e), "url": url}


# ── Parasite SEO Risk Detection ────────────────────────
# From claude-seo's parasite_risk.py

_THIRD_PARTY_BYLINE_RE = _re.compile(
    r"\b(?:Partner\s+Content|Sponsored\s+Content|Sponsored\s+by|Brand\s+Studio|"
    r"In\s+Partnership\s+With|Advertisement|Advertorial|Paid\s+Post|Promoted|"
    r"Paid\s+Content)\b",
    _re.IGNORECASE,
)

_COMMERCE_SIGNALS_RE = _re.compile(
    r"\b(?:Buy\s+Now|Shop\s+Now|Add\s+to\s+Cart|Compare\s+Prices|"
    r"Best\s+\w+\s+Deals?|Promo\s+Code|Coupon\s+Code|Discount\s+Code|"
    r"Affiliate\s+Link|Price\s+Comparison)\b",
    _re.IGNORECASE,
)

_AFFILIATE_LINK_RE = _re.compile(
    r'href="[^"]*(?:amazon\.com|ebay\.com|walmart\.com|target\.com|'
    r'bestbuy\.com|homedepot\.com|lowes\.com|wayfair\.com|'
    r'clickbank|shareasale|cj\.com|rakuten|impact\.com|partnerize|'
    r'awin1|flexoffers|pepperjam)[^"]*"',
    _re.IGNORECASE,
)


def detect_parasite_risk(html: str, url: str = "", primary_topic: str = "") -> dict:
    """Detect parasite-SEO risk signals in page content.

    Per Google's 2024-11-19 policy clarification, section-level manual
    actions target third-party content on editorial domains. This scanner
    identifies three risk signals:

    1. Third-party authorship density (sponsored/partner bylines)
    2. Commercial-intent skew (buy now, deals, coupons)
    3. Affiliate link density

    Args:
        html: Raw HTML of the page.
        url: Optional URL for context.
        primary_topic: Optional site's primary topic for drift detection.

    Returns:
        Dict with risk level and contributing signals.
    """
    from urllib.parse import urlparse

    third_party_hits = len(_THIRD_PARTY_BYLINE_RE.findall(html))
    commerce_hits = len(_COMMERCE_SIGNALS_RE.findall(html))
    affiliate_links = len(_AFFILIATE_LINK_RE.findall(html))

    # Extract subfolder from URL
    subfolder = "/"
    if url:
        parsed = urlparse(url)
        path = parsed.path.strip("/")
        if path:
            parts = path.split("/")
            subfolder = "/" + parts[0] + "/"

    # Risk scoring
    risk_score = 0
    signals = []

    if third_party_hits > 0:
        risk_score += 30
        signals.append({
            "signal": "third_party_bylines",
            "count": third_party_hits,
            "detail": "Partner/Sponsored/Advertorial content markers detected.",
        })

    if commerce_hits > 3:
        risk_score += 25
        signals.append({
            "signal": "commercial_intent",
            "count": commerce_hits,
            "detail": "High density of commercial CTAs (buy now, deals, coupons).",
        })
    elif commerce_hits > 0:
        risk_score += 10
        signals.append({
            "signal": "commercial_intent",
            "count": commerce_hits,
            "detail": "Some commercial CTAs detected.",
        })

    if affiliate_links > 5:
        risk_score += 30
        signals.append({
            "signal": "affiliate_links",
            "count": affiliate_links,
            "detail": "High density of affiliate/merchant links.",
        })
    elif affiliate_links > 0:
        risk_score += 15
        signals.append({
            "signal": "affiliate_links",
            "count": affiliate_links,
            "detail": "Some affiliate links detected.",
        })

    # Risk level
    if risk_score >= 60:
        risk_level = "high"
    elif risk_score >= 30:
        risk_level = "medium"
    elif risk_score > 0:
        risk_level = "low"
    else:
        risk_level = "none"

    return {
        "url": url,
        "subfolder": subfolder,
        "risk_level": risk_level,
        "risk_score": risk_score,
        "signals": signals,
        "third_party_byline_hits": third_party_hits,
        "commerce_signal_hits": commerce_hits,
        "affiliate_link_count": affiliate_links,
        "disclaimer": "Advisory only — cannot determine contractual relationships. "
                      "Per Google's 2024-11-19 policy, section-level risk is the operational unit.",
    }
