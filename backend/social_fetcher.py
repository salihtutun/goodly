"""Best-effort public-profile fetcher for social platforms.

Public scraping of these platforms is fragile — they aggressively block bots and
change markup often. We do a quick attempt for verification + follower count,
then let Claude do the heavy lifting using the user-provided bio / caption / niche.
"""
import re
import httpx
from bs4 import BeautifulSoup


UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
)


def _strip_handle(handle: str) -> str:
    """Strip @ and path separators, reject suspicious characters."""
    cleaned = (handle or "").strip().lstrip("@").split("/")[0]
    # Reject handles with path traversal or control characters
    if not cleaned or any(c in cleaned for c in ("..", "\0", "\n", "\r", "<", ">", "\\")):
        return ""
    return cleaned


def _parse_followers(text: str):
    # "1,234 Followers" / "1.2K Followers" / "12M followers"
    m = re.search(r"([\d.,]+\s*[KMB]?)\s+[Ff]ollower", text or "")
    return m.group(1).strip() if m else None


async def fetch_profile_signals(platform: str, handle: str) -> dict:
    """Returns whatever signals we can detect; never raises. Retries once on transient failures."""
    handle = _strip_handle(handle)
    if not handle:
        return {"fetched": False, "reason": "Empty handle"}

    if platform == "instagram":
        url = f"https://www.instagram.com/{handle}/"
    elif platform == "tiktok":
        url = f"https://www.tiktok.com/@{handle}"
    elif platform == "youtube":
        # Try as a channel handle
        url = f"https://www.youtube.com/@{handle}"
    else:
        return {"fetched": False, "reason": "Unknown platform"}

    last_error = None
    for attempt in range(2):
        try:
            async with httpx.AsyncClient(follow_redirects=True, timeout=10.0,
                                         headers={"User-Agent": UA, "Accept-Language": "en"}) as client:
                resp = await client.get(url)
            break  # success — exit retry loop
        except Exception as e:
            last_error = e
            if attempt == 0:
                import asyncio
                await asyncio.sleep(1.0)  # brief backoff before retry
    else:
        # All retries exhausted
        return {"fetched": False, "reason": "Profile not reachable", "url": url}

    if resp.status_code >= 400:
        return {"fetched": False, "status": resp.status_code, "reason": "Profile not reachable", "url": url}

    soup = BeautifulSoup(resp.text, "lxml")
    og_title = (soup.find("meta", property="og:title") or {}).get("content", "") if soup.find("meta", property="og:title") else ""
    og_desc = (soup.find("meta", property="og:description") or {}).get("content", "") if soup.find("meta", property="og:description") else ""
    title = (soup.find("title").get_text(strip=True) if soup.find("title") else "") or ""

    followers = _parse_followers(og_desc) or _parse_followers(title)
    return {
        "fetched": True,
        "url": url,
        "status": resp.status_code,
        "og_title": og_title[:200] if og_title else None,
        "og_description": og_desc[:400] if og_desc else None,
        "page_title": title[:200] if title else None,
        "followers_estimate": followers,
    }
