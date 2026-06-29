"""On-page SEO analyzer. Fetches a URL, parses it, scores key SEO signals."""
import re
import time
from typing import Dict, List, Tuple
from urllib.parse import urlparse, urljoin
import httpx
from bs4 import BeautifulSoup


USER_AGENT = "Mozilla/5.0 (compatible; GoodlyBot/1.0; +https://goodly.app)"
TIMEOUT = 15.0


def _normalize_url(url: str) -> str:
    url = url.strip()
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    return url


async def fetch_page(url: str) -> Tuple[str, int, float, Dict[str, str]]:
    """Returns (html, status_code, load_time_ms, response_headers)."""
    headers = {"User-Agent": USER_AGENT, "Accept": "text/html,application/xhtml+xml"}
    start = time.perf_counter()
    async with httpx.AsyncClient(follow_redirects=True, timeout=TIMEOUT, headers=headers) as client:
        resp = await client.get(url)
        load_ms = (time.perf_counter() - start) * 1000.0
        return resp.text, resp.status_code, load_ms, dict(resp.headers)


def _score(value: int, thresholds: List[int]) -> int:
    """Score 0-100 based on whether value falls in good/ok/poor bands."""
    if value >= thresholds[0]:
        return 100
    if value >= thresholds[1]:
        return 70
    if value >= thresholds[2]:
        return 40
    return 15


async def analyze_url(raw_url: str) -> Dict:
    url = _normalize_url(raw_url)
    parsed = urlparse(url)

    try:
        html, status, load_ms, headers = await fetch_page(url)
    except Exception as e:
        return {
            "url": url,
            "error": f"Could not fetch URL: {str(e)[:200]}",
            "fetch_failed": True,
        }

    soup = BeautifulSoup(html, "lxml")

    # --- Meta tags ---
    title_tag = soup.find("title")
    title = title_tag.get_text(strip=True) if title_tag else ""
    meta_desc_tag = soup.find("meta", attrs={"name": re.compile("^description$", re.I)})
    meta_desc = (meta_desc_tag.get("content") or "").strip() if meta_desc_tag else ""

    og_title = soup.find("meta", attrs={"property": "og:title"})
    og_desc = soup.find("meta", attrs={"property": "og:description"})
    og_image = soup.find("meta", attrs={"property": "og:image"})

    canonical = soup.find("link", attrs={"rel": "canonical"})
    canonical_href = canonical.get("href") if canonical else None

    viewport = soup.find("meta", attrs={"name": "viewport"})
    has_viewport = viewport is not None

    robots = soup.find("meta", attrs={"name": "robots"})
    robots_content = (robots.get("content") or "") if robots else ""

    # --- Headings ---
    h1s = [h.get_text(strip=True) for h in soup.find_all("h1")]
    h2s = [h.get_text(strip=True) for h in soup.find_all("h2")]
    h3s = [h.get_text(strip=True) for h in soup.find_all("h3")]

    # --- Images ---
    imgs = soup.find_all("img")
    imgs_total = len(imgs)
    imgs_missing_alt = sum(1 for i in imgs if not (i.get("alt") or "").strip())

    # --- Links ---
    base = f"{parsed.scheme}://{parsed.netloc}"
    internal_links, external_links = [], []
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if href.startswith("#") or href.startswith("mailto:") or href.startswith("tel:"):
            continue
        absolute = urljoin(base, href)
        host = urlparse(absolute).netloc
        if host == parsed.netloc or not host:
            internal_links.append(absolute)
        else:
            external_links.append(absolute)

    # --- Text content ---
    for tag in soup(["script", "style", "noscript"]):
        tag.decompose()
    text = soup.get_text(separator=" ", strip=True)
    word_count = len(text.split())

    # --- HTTPS ---
    is_https = parsed.scheme == "https"

    # --- Structured data ---
    has_schema = bool(soup.find_all("script", attrs={"type": "application/ld+json"}))

    # --- Compute category scores (0-100) ---
    title_score = 100 if 30 <= len(title) <= 60 else (70 if 10 <= len(title) <= 75 else (40 if title else 0))
    desc_score = 100 if 120 <= len(meta_desc) <= 160 else (70 if 50 <= len(meta_desc) <= 200 else (40 if meta_desc else 0))
    headings_score = 100 if len(h1s) == 1 else (60 if len(h1s) > 1 else (20 if not h1s else 70))
    if h2s:
        headings_score = min(100, headings_score + 10)
    headings_score = min(100, headings_score)

    img_score = 100 if imgs_total == 0 or imgs_missing_alt == 0 else max(20, int(100 * (1 - imgs_missing_alt / max(imgs_total, 1))))

    perf_score = 100 if load_ms < 800 else (80 if load_ms < 1800 else (50 if load_ms < 3500 else 20))
    if status >= 400:
        perf_score = 0

    mobile_score = 100 if has_viewport else 30

    onpage_score = _score(word_count, [600, 300, 100])

    social_score = 0
    if og_title:
        social_score += 35
    if og_desc:
        social_score += 35
    if og_image:
        social_score += 30
    social_score = min(100, social_score)

    security_score = 100 if is_https else 30

    # --- Issues list (actionable) ---
    issues: List[Dict] = []

    def add(severity, category, message, fix):
        issues.append({"severity": severity, "category": category, "message": message, "fix": fix})

    if not title:
        add("high", "Meta Tags", "Missing <title> tag", "Add a descriptive 50-60 char title.")
    elif len(title) > 60:
        add("medium", "Meta Tags", f"Title is {len(title)} characters (too long)", "Shorten to 50-60 characters to avoid truncation in search results.")
    elif len(title) < 30:
        add("medium", "Meta Tags", f"Title is only {len(title)} characters (too short)", "Expand title to 30-60 characters for better keyword targeting.")

    if not meta_desc:
        add("high", "Meta Tags", "Missing meta description", "Add a 120-160 character description that summarises this page.")
    elif len(meta_desc) > 160:
        add("low", "Meta Tags", f"Meta description is {len(meta_desc)} characters (long)", "Trim to 120-160 characters.")

    if len(h1s) == 0:
        add("high", "Headings", "No <h1> heading found", "Add exactly one H1 that describes the page topic.")
    elif len(h1s) > 1:
        add("medium", "Headings", f"{len(h1s)} <h1> tags found", "Use only one H1 per page.")

    if imgs_missing_alt > 0:
        add("medium", "Accessibility", f"{imgs_missing_alt} of {imgs_total} images missing alt text",
            "Add descriptive alt attributes for accessibility & image SEO.")

    if not has_viewport:
        add("high", "Mobile", "Missing viewport meta tag", "Add <meta name='viewport' content='width=device-width, initial-scale=1'>.")

    if not is_https:
        add("high", "Security", "Site not served over HTTPS", "Install an SSL certificate and force HTTPS.")

    if not canonical_href:
        add("low", "Indexing", "No canonical link tag", "Add <link rel='canonical' href='...'> to avoid duplicate content.")

    if "noindex" in robots_content.lower():
        add("high", "Indexing", "Page has noindex directive", "Remove 'noindex' if you want this page in search results.")

    if not og_title or not og_desc:
        add("low", "Social", "Missing OpenGraph tags", "Add og:title, og:description, og:image for richer social shares.")

    if load_ms > 3500:
        add("high", "Performance", f"Slow page load: {int(load_ms)} ms", "Optimize images, enable caching, use a CDN.")
    elif load_ms > 1800:
        add("medium", "Performance", f"Page load is {int(load_ms)} ms", "Aim for under 1.8s. Compress images, reduce JS.")

    if word_count < 300:
        add("medium", "Content", f"Thin content: only {word_count} words", "Expand the page with helpful, original content (target 600+ words).")

    if not has_schema:
        add("low", "Structured Data", "No JSON-LD schema found", "Add structured data (Organization, Article, Product, etc.) for rich results.")

    # --- Overall score (weighted) ---
    weights = {
        "title_score": 0.13, "desc_score": 0.13, "headings_score": 0.12,
        "img_score": 0.08, "perf_score": 0.18, "mobile_score": 0.10,
        "onpage_score": 0.10, "social_score": 0.06, "security_score": 0.10,
    }
    scores = {
        "title_score": title_score, "desc_score": desc_score, "headings_score": headings_score,
        "img_score": img_score, "perf_score": perf_score, "mobile_score": mobile_score,
        "onpage_score": onpage_score, "social_score": social_score, "security_score": security_score,
    }
    overall = int(sum(scores[k] * weights[k] for k in weights))

    return {
        "url": url,
        "fetch_failed": False,
        "status_code": status,
        "load_time_ms": int(load_ms),
        "overall_score": overall,
        "categories": {
            "meta_tags": int((title_score + desc_score) / 2),
            "headings": headings_score,
            "performance": perf_score,
            "mobile": mobile_score,
            "accessibility": img_score,
            "content": onpage_score,
            "social": social_score,
            "security": security_score,
        },
        "metadata": {
            "title": title,
            "title_length": len(title),
            "description": meta_desc,
            "description_length": len(meta_desc),
            "canonical": canonical_href,
            "robots": robots_content,
            "has_viewport": has_viewport,
            "is_https": is_https,
            "has_schema": has_schema,
            "og_title": og_title.get("content") if og_title else None,
            "og_description": og_desc.get("content") if og_desc else None,
            "og_image": og_image.get("content") if og_image else None,
        },
        "headings": {
            "h1": h1s[:10],
            "h2": h2s[:15],
            "h3": h3s[:15],
            "h1_count": len(h1s),
            "h2_count": len(h2s),
            "h3_count": len(h3s),
        },
        "images": {
            "total": imgs_total,
            "missing_alt": imgs_missing_alt,
        },
        "links": {
            "internal": len(internal_links),
            "external": len(external_links),
        },
        "content": {
            "word_count": word_count,
            "text_preview": text[:500],
        },
        "issues": issues,
    }
