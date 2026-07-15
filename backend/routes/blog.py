"""Blog API routes.

Reads are public; writes require an admin user.
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import Optional, List

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from database import db
from dependencies import get_current_user_doc
from sanitize import sanitize_html
import blog_service
from limiter import limiter

logger = logging.getLogger("seo_framework")
router = APIRouter(tags=["blog"])


async def require_admin(user: dict = Depends(get_current_user_doc)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return user


class BlogPostIn(BaseModel):
    title: str
    slug: str
    excerpt: str
    content: str
    author: str = "Goodly Team"
    category: str = "SEO"
    tags: Optional[List[str]] = None
    image_url: Optional[str] = None
    published: bool = True


class BlogPostUpdate(BaseModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    excerpt: Optional[str] = None
    content: Optional[str] = None
    author: Optional[str] = None
    category: Optional[str] = None
    tags: Optional[List[str]] = None
    image_url: Optional[str] = None
    published: Optional[bool] = None


@router.get("/blog/posts")
@limiter.limit("60/minute")
async def list_posts(
    request: Request,
    category: Optional[str] = None,
    tag: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
):
    """List published blog posts."""
    posts = await blog_service.list_posts(
        db, category=category, tag=tag, limit=limit, offset=offset
    )
    return JSONResponse(content=posts)


@router.get("/blog/posts/{slug}")
@limiter.limit("60/minute")
async def get_post(request: Request, slug: str):
    """Get a single blog post by slug."""
    post = await blog_service.get_post(db, slug)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return JSONResponse(content=post)


@router.get("/blog/categories")
@limiter.limit("60/minute")
async def get_categories(request: Request):
    """Get all blog categories."""
    return JSONResponse(content={"categories": await blog_service.get_categories(db)})


@router.post("/blog/posts")
@limiter.limit("20/minute")
async def create_post(request: Request, body: BlogPostIn, user: dict = Depends(require_admin)):
    """Create a new blog post (admin only)."""
    existing = await db.blog_posts.find_one({"slug": body.slug})
    if existing:
        raise HTTPException(status_code=409, detail=f"Slug '{body.slug}' already exists")

    now = datetime.now(timezone.utc).isoformat()
    post = {
        "id": str(uuid.uuid4()),
        "title": sanitize_html(body.title),
        "slug": body.slug,
        "excerpt": sanitize_html(body.excerpt),
        "content": body.content,
        "author": sanitize_html(body.author),
        "category": sanitize_html(body.category),
        "tags": body.tags or [],
        "image_url": body.image_url,
        "published": body.published,
        "created_at": now,
        "updated_at": now,
    }
    await db.blog_posts.insert_one(post)
    post.pop("_id", None)
    return post


@router.put("/blog/posts/{post_id}")
@limiter.limit("20/minute")
async def update_post(request: Request, post_id: str, body: BlogPostUpdate, user: dict = Depends(require_admin)):
    """Update a blog post (admin only)."""
    updates = {k: v for k, v in body.model_dump().items() if v is not None}
    # Sanitize text fields
    for field in ("title", "excerpt", "author", "category"):
        if field in updates and isinstance(updates[field], str):
            updates[field] = sanitize_html(updates[field])
    post = await blog_service.update_post(db, post_id, **updates)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    return post


@router.delete("/blog/posts/{post_id}")
@limiter.limit("20/minute")
async def delete_post(request: Request, post_id: str, user: dict = Depends(require_admin)):
    """Delete a blog post (admin only)."""
    deleted = await blog_service.delete_post(db, post_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Post not found")
    return {"ok": True}
