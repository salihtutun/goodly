"""SERP rank checker. Uses SerpAPI when SERPAPI_KEY is configured, otherwise
falls back to scraping DuckDuckGo's HTML endpoint (best-effort, free).
"""
import os
from urllib.parse import urlparse, urlencode, parse_qs
import httpx
from bs4 import BeautifulSoup


USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)


def _normalize_domain(url_or_domain: str) -> str:
    s = url_or_domain.strip().lower()
    if not s.startswith(("http://", "https://")):
        s = "https://" + s
    host = urlparse(s).netloc
    return host[4:] if host.startswith("www.") else host


async def _check_via_serpapi(keyword: str, target: str, max_results: int = 30) -> dict:
    api_key = os.environ.get("SERPAPI_KEY")
    params = {"engine": "google", "q": keyword, "num": min(max_results, 30), "api_key": api_key}
    async with httpx.AsyncClient(timeout=20.0) as client:
        resp = await client.get("https://serpapi.com/search.json", params=params)
        resp.raise_for_status()
        data = resp.json()

    organic = data.get("organic_results") or []
    results = []
    found_rank = None
    for r in organic[:max_results]:
        pos = r.get("position")
        link = r.get("link") or ""
        host = urlparse(link).netloc.lower()
        host = host[4:] if host.startswith("www.") else host
        is_match = host == target or host.endswith("." + target)
        results.append({
            "position": pos,
            "title": (r.get("title") or "")[:160],
            "url": link,
            "domain": host,
            "is_match": is_match,
        })
        if is_match and found_rank is None:
            found_rank = pos
    return {
        "keyword": keyword,
        "domain": target,
        "rank": found_rank,
        "total_results_checked": len(organic),
        "results": results[:10],
        "engine": "google (serpapi)",
    }


async def _check_via_duckduckgo(keyword: str, target: str, max_results: int = 30) -> dict:
    params = {"q": keyword, "kl": "us-en"}
    url = f"https://html.duckduckgo.com/html/?{urlencode(params)}"
    headers = {"User-Agent": USER_AGENT, "Accept": "text/html"}
    async with httpx.AsyncClient(follow_redirects=True, timeout=15.0, headers=headers) as client:
        resp = await client.post(url, data=params)

    soup = BeautifulSoup(resp.text, "lxml")
    results = []
    found_rank = None
    pos = 0
    for a in soup.select("a.result__a, a.result__url"):
        href = a.get("href") or ""
        if "uddg=" in href:
            real = parse_qs(urlparse(href).query).get("uddg", [""])[0]
            if real:
                href = real
        if not href.startswith(("http://", "https://")):
            continue
        title = a.get_text(strip=True)
        host = urlparse(href).netloc.lower()
        host = host[4:] if host.startswith("www.") else host
        pos += 1
        is_match = host == target or host.endswith("." + target)
        results.append({
            "position": pos, "title": title[:160], "url": href,
            "domain": host, "is_match": is_match,
        })
        if is_match and found_rank is None:
            found_rank = pos
        if pos >= max_results:
            break

    return {
        "keyword": keyword,
        "domain": target,
        "rank": found_rank,
        "total_results_checked": pos,
        "results": results[:10],
        "engine": "duckduckgo",
    }


async def check_rank(keyword: str, domain: str, max_results: int = 30) -> dict:
    target = _normalize_domain(domain)
    if not target:
        return {"keyword": keyword, "domain": domain, "rank": None, "results": [], "error": "Invalid domain"}

    use_serpapi = bool(os.environ.get("SERPAPI_KEY"))
    try:
        if use_serpapi:
            return await _check_via_serpapi(keyword, target, max_results)
        return await _check_via_duckduckgo(keyword, target, max_results)
    except Exception:
        # If SerpAPI fails for any reason, fall back to DDG
        if use_serpapi:
            try:
                return await _check_via_duckduckgo(keyword, target, max_results)
            except Exception:
                return {"keyword": keyword, "domain": target, "rank": None, "results": [],
                        "error": "Search is temporarily unavailable. Please try again."}
        return {"keyword": keyword, "domain": target, "rank": None, "results": [],
                "error": "Search is temporarily unavailable. Please try again."}
