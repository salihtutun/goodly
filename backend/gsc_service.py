"""Google Search Console integration for Goodly.

Provides real search data (clicks, impressions, CTR, average position)
instead of estimated data. Uses the Google Search Console API via
service account or OAuth.

Setup:
  1. Create a Google Cloud project with Search Console API enabled
  2. Create a service account and download JSON key
  3. Add the service account email as a user in Search Console
  4. Set GOOGLE_SERVICE_ACCOUNT_JSON env var (base64-encoded JSON key)
"""

import os
import json
import base64
import asyncio
import logging
from datetime import datetime, timezone, timedelta
from typing import List

logger = logging.getLogger("gsc_service")

# Cache the service account credentials
_credentials = None


def _get_credentials():
    """Load service account credentials from env var."""
    global _credentials
    if _credentials is not None:
        return _credentials

    encoded = os.environ.get("GOOGLE_SERVICE_ACCOUNT_JSON")
    if not encoded:
        logger.debug("GOOGLE_SERVICE_ACCOUNT_JSON not configured")
        return None

    try:
        key_data = json.loads(base64.b64decode(encoded).decode("utf-8"))
        from google.oauth2 import service_account
        _credentials = service_account.Credentials.from_service_account_info(
            key_data,
            scopes=["https://www.googleapis.com/auth/webmasters.readonly"],
        )
        return _credentials
    except Exception as e:
        logger.warning("Failed to load GSC credentials: %s", e)
        return None


def is_configured() -> bool:
    """Check if GSC integration is available."""
    return _get_credentials() is not None


async def fetch_search_analytics(
    site_url: str,
    *,
    days: int = 28,
    limit: int = 100,
    dimension: str = "query",
) -> dict:
    """Fetch search analytics data from Google Search Console.

    Args:
        site_url: The property URL in GSC (e.g., 'https://example.com/' or 'sc-domain:example.com')
        days: Number of days of data to fetch (max 16 months)
        limit: Max rows to return
        dimension: 'query', 'page', 'country', or 'device'

    Returns:
        Dict with rows of search data and summary stats.
    """
    creds = _get_credentials()
    if not creds:
        return {"error": "GSC not configured", "rows": [], "summary": {}}

    try:
        end_date = datetime.now(timezone.utc).date()
        start_date = end_date - timedelta(days=min(days, 480))  # GSC max is 16 months

        request_body = {
            "startDate": start_date.isoformat(),
            "endDate": end_date.isoformat(),
            "dimensions": [dimension],
            "rowLimit": limit,
            "aggregationType": "auto",
        }

        def _query():
            # build() + execute() are synchronous HTTP calls — keep them off
            # the event loop.
            from googleapiclient.discovery import build
            service = build("searchconsole", "v1", credentials=creds)
            return service.searchanalytics().query(
                siteUrl=site_url,
                body=request_body,
            ).execute()

        response = await asyncio.to_thread(_query)

        rows = response.get("rows", [])

        # Calculate summary stats
        total_clicks = sum(r.get("clicks", 0) for r in rows)
        total_impressions = sum(r.get("impressions", 0) for r in rows)
        avg_ctr = (total_clicks / total_impressions * 100) if total_impressions > 0 else 0
        avg_position = (
            sum(r.get("position", 0) * r.get("impressions", 0) for r in rows) / total_impressions
        ) if total_impressions > 0 else 0

        # Format rows for the frontend
        formatted_rows = []
        for row in rows:
            keys = row.get("keys", [])
            formatted_rows.append({
                dimension: keys[0] if keys else "",
                "clicks": row.get("clicks", 0),
                "impressions": row.get("impressions", 0),
                "ctr": round(row.get("ctr", 0) * 100, 1),
                "position": round(row.get("position", 0), 1),
            })

        return {
            "rows": formatted_rows,
            "summary": {
                "total_clicks": total_clicks,
                "total_impressions": total_impressions,
                "avg_ctr": round(avg_ctr, 1),
                "avg_position": round(avg_position, 1),
                "date_range": {
                    "start": start_date.isoformat(),
                    "end": end_date.isoformat(),
                },
            },
        }

    except Exception as e:
        logger.exception("GSC fetch failed for %s", site_url)
        return {"error": str(e)[:300], "rows": [], "summary": {}}


async def list_sites() -> List[dict]:
    """List all sites the service account has access to in Search Console."""
    creds = _get_credentials()
    if not creds:
        return []

    try:
        def _list():
            from googleapiclient.discovery import build
            service = build("searchconsole", "v1", credentials=creds)
            return service.sites().list().execute()

        sites = await asyncio.to_thread(_list)
        return sites.get("siteEntry", [])
    except Exception as e:
        logger.warning("GSC list sites failed: %s", e)
        return []


async def get_top_queries(site_url: str, *, days: int = 28, limit: int = 20) -> dict:
    """Get top performing queries for a site."""
    return await fetch_search_analytics(site_url, days=days, limit=limit, dimension="query")


async def get_top_pages(site_url: str, *, days: int = 28, limit: int = 20) -> dict:
    """Get top performing pages for a site."""
    return await fetch_search_analytics(site_url, days=days, limit=limit, dimension="page")


async def get_performance_trend(site_url: str, *, days: int = 90) -> dict:
    """Get daily performance trend (clicks, impressions, position over time)."""
    creds = _get_credentials()
    if not creds:
        return {"error": "GSC not configured", "daily": []}

    try:
        end_date = datetime.now(timezone.utc).date()
        start_date = end_date - timedelta(days=min(days, 480))

        request_body = {
            "startDate": start_date.isoformat(),
            "endDate": end_date.isoformat(),
            "dimensions": ["date"],
            "rowLimit": 500,
        }

        def _query():
            from googleapiclient.discovery import build
            service = build("searchconsole", "v1", credentials=creds)
            return service.searchanalytics().query(
                siteUrl=site_url,
                body=request_body,
            ).execute()

        response = await asyncio.to_thread(_query)

        daily = []
        for row in response.get("rows", []):
            daily.append({
                "date": row.get("keys", [""])[0],
                "clicks": row.get("clicks", 0),
                "impressions": row.get("impressions", 0),
                "ctr": round(row.get("ctr", 0) * 100, 1),
                "position": round(row.get("position", 0), 1),
            })

        return {"daily": sorted(daily, key=lambda x: x["date"])}

    except Exception as e:
        logger.exception("GSC trend fetch failed for %s", site_url)
        return {"error": str(e)[:300], "daily": []}
