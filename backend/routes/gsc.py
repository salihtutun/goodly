"""Google Search Console API routes."""

from fastapi import APIRouter, Depends, HTTPException, Request
from auth import get_current_user_id
import gsc_service
from limiter import limiter

router = APIRouter(tags=["gsc"])


@router.get("/gsc/sites")
@limiter.limit("30/minute")
async def list_gsc_sites(request: Request, user_id: str = Depends(get_current_user_id)):
    """List all GSC sites the service account can access."""
    if not gsc_service.is_configured():
        raise HTTPException(status_code=501, detail="Google Search Console integration is not configured")
    sites = await gsc_service.list_sites()
    return {"sites": sites}


@router.get("/gsc/analytics")
@limiter.limit("30/minute")
async def get_gsc_analytics(
    request: Request,
    site_url: str,
    days: int = 28,
    limit: int = 100,
    dimension: str = "query",
    user_id: str = Depends(get_current_user_id),
):
    """Fetch search analytics for a GSC property."""
    if not gsc_service.is_configured():
        raise HTTPException(status_code=501, detail="Google Search Console integration is not configured")
    return await gsc_service.fetch_search_analytics(
        site_url, days=days, limit=limit, dimension=dimension
    )


@router.get("/gsc/top-queries")
@limiter.limit("30/minute")
async def get_top_queries(
    request: Request,
    site_url: str,
    days: int = 28,
    limit: int = 20,
    user_id: str = Depends(get_current_user_id),
):
    """Get top performing queries for a site."""
    if not gsc_service.is_configured():
        raise HTTPException(status_code=501, detail="Google Search Console integration is not configured")
    return await gsc_service.get_top_queries(site_url, days=days, limit=limit)


@router.get("/gsc/top-pages")
@limiter.limit("30/minute")
async def get_top_pages(
    request: Request,
    site_url: str,
    days: int = 28,
    limit: int = 20,
    user_id: str = Depends(get_current_user_id),
):
    """Get top performing pages for a site."""
    if not gsc_service.is_configured():
        raise HTTPException(status_code=501, detail="Google Search Console integration is not configured")
    return await gsc_service.get_top_pages(site_url, days=days, limit=limit)


@router.get("/gsc/trend")
@limiter.limit("30/minute")
async def get_performance_trend(
    request: Request,
    site_url: str,
    days: int = 90,
    user_id: str = Depends(get_current_user_id),
):
    """Get daily performance trend for a site."""
    if not gsc_service.is_configured():
        raise HTTPException(status_code=501, detail="Google Search Console integration is not configured")
    return await gsc_service.get_performance_trend(site_url, days=days)
