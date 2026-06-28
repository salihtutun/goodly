"""Lightweight SERP rank checker using DuckDuckGo's HTML endpoint.

Caveat: this is a best-effort free implementation. For production accuracy you
should switch to a dedicated SERP API (SerpAPI, DataForSEO, etc.). DuckDuckGo
results are close enough to Google for relative ranking signals on most queries.
"""
from urllib.parse import urlparse, urlencode
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


async def check_rank(keyword: str, domain: str, max_results: int = 30) -> dict:
    target = _normalize_domain(domain)
    if not target:
        return {"keyword": keyword, "domain": domain, "rank": None, "results": [], "error": "Invalid domain"}

    params = {"q": keyword, "kl": "us-en"}
    url = f"https://html.duckduckgo.com/html/?{urlencode(params)}"
    headers = {"User-Agent": USER_AGENT, "Accept": "text/html"}

    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=15.0, headers=headers) as client:
            resp = await client.post(url, data=params)
    except Exception as e:
        return {"keyword": keyword, "domain": domain, "rank": None, "results": [], "error": f"Search failed: {e}"[:200]}

    soup = BeautifulSoup(resp.text, "lxml")
    results = []
    found_rank = None
    pos = 0

    for a in soup.select("a.result__a, a.result__url"):
        href = a.get("href") or ""
        # DDG sometimes wraps real URL inside `uddg` param
        if "uddg=" in href:
            from urllib.parse import parse_qs, urlparse as up
            parsed = up(href)
            real = parse_qs(parsed.query).get("uddg", [""])[0]
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
            "position": pos,
            "title": title[:160],
            "url": href,
            "domain": host,
            "is_match": is_match,
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
        "results": results[:10],  # only return top 10 to the UI
        "engine": "duckduckgo",
    }
