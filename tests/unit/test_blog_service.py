"""Unit tests for blog_service.py — CRUD, categories, seeding."""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock


class TestCreatePost:
    """Tests for create_post()."""

    @pytest.mark.asyncio
    async def test_creates_post_successfully(self):
        from blog_service import create_post
        mock_db = MagicMock()
        mock_db.blog_posts = MagicMock()
        mock_db.blog_posts.find_one = AsyncMock(return_value=None)
        mock_db.blog_posts.insert_one = AsyncMock()
        result = await create_post(mock_db, title="Test Post", slug="test-post",
                                    excerpt="An excerpt", content="Content here")
        assert result["title"] == "Test Post"
        assert result["slug"] == "test-post"
        assert result["published"] is True
        mock_db.blog_posts.insert_one.assert_called_once()

    @pytest.mark.asyncio
    async def test_rejects_duplicate_slug(self):
        from blog_service import create_post
        mock_db = MagicMock()
        mock_db.blog_posts = MagicMock()
        mock_db.blog_posts.find_one = AsyncMock(return_value={"id": "existing"})
        with pytest.raises(ValueError, match="already exists"):
            await create_post(mock_db, title="Test", slug="duplicate",
                              excerpt="excerpt", content="content")

    @pytest.mark.asyncio
    async def test_default_values(self):
        from blog_service import create_post
        mock_db = MagicMock()
        mock_db.blog_posts = MagicMock()
        mock_db.blog_posts.find_one = AsyncMock(return_value=None)
        mock_db.blog_posts.insert_one = AsyncMock()
        result = await create_post(mock_db, title="T", slug="s", excerpt="e", content="c")
        assert result["author"] == "Goodly Team"
        assert result["category"] == "SEO"
        assert result["tags"] == []

    @pytest.mark.asyncio
    async def test_custom_tags_and_image(self):
        from blog_service import create_post
        mock_db = MagicMock()
        mock_db.blog_posts = MagicMock()
        mock_db.blog_posts.find_one = AsyncMock(return_value=None)
        mock_db.blog_posts.insert_one = AsyncMock()
        result = await create_post(mock_db, title="T", slug="s", excerpt="e", content="c",
                                    tags=["seo", "tips"], image_url="https://img.com/pic.jpg")
        assert result["tags"] == ["seo", "tips"]
        assert result["image_url"] == "https://img.com/pic.jpg"


class TestGetPost:
    """Tests for get_post() and get_post_by_id()."""

    @pytest.mark.asyncio
    async def test_get_post_by_slug(self):
        from blog_service import get_post
        mock_db = MagicMock()
        mock_db.blog_posts = MagicMock()
        mock_db.blog_posts.find_one = AsyncMock(return_value={"title": "Found", "slug": "test"})
        result = await get_post(mock_db, "test")
        assert result["title"] == "Found"

    @pytest.mark.asyncio
    async def test_get_post_not_found(self):
        from blog_service import get_post
        mock_db = MagicMock()
        mock_db.blog_posts = MagicMock()
        mock_db.blog_posts.find_one = AsyncMock(return_value=None)
        result = await get_post(mock_db, "nonexistent")
        assert result is None

    @pytest.mark.asyncio
    async def test_get_post_by_id(self):
        from blog_service import get_post_by_id
        mock_db = MagicMock()
        mock_db.blog_posts = MagicMock()
        mock_db.blog_posts.find_one = AsyncMock(return_value={"title": "Found", "id": "p1"})
        result = await get_post_by_id(mock_db, "p1")
        assert result["title"] == "Found"


class TestListPosts:
    """Tests for list_posts()."""

    @pytest.mark.asyncio
    async def test_lists_published_posts(self):
        from blog_service import list_posts
        mock_db = MagicMock()
        mock_db.blog_posts = MagicMock()
        mock_db.blog_posts.count_documents = AsyncMock(return_value=2)
        mock_db.blog_posts.find.return_value.sort.return_value.skip.return_value.limit.return_value.to_list = AsyncMock(return_value=[
            {"title": "Post 1"}, {"title": "Post 2"}
        ])
        result = await list_posts(mock_db)
        assert result["total"] == 2
        assert len(result["posts"]) == 2

    @pytest.mark.asyncio
    async def test_filters_by_category(self):
        from blog_service import list_posts
        mock_db = MagicMock()
        mock_db.blog_posts = MagicMock()
        mock_db.blog_posts.count_documents = AsyncMock(return_value=1)
        mock_db.blog_posts.find.return_value.sort.return_value.skip.return_value.limit.return_value.to_list = AsyncMock(return_value=[
            {"title": "SEO Post"}
        ])
        result = await list_posts(mock_db, category="SEO")
        assert result["total"] == 1

    @pytest.mark.asyncio
    async def test_filters_by_tag(self):
        from blog_service import list_posts
        mock_db = MagicMock()
        mock_db.blog_posts = MagicMock()
        mock_db.blog_posts.count_documents = AsyncMock(return_value=1)
        mock_db.blog_posts.find.return_value.sort.return_value.skip.return_value.limit.return_value.to_list = AsyncMock(return_value=[
            {"title": "Tagged Post"}
        ])
        result = await list_posts(mock_db, tag="seo")
        assert result["total"] == 1

    @pytest.mark.asyncio
    async def test_includes_drafts_when_requested(self):
        from blog_service import list_posts
        mock_db = MagicMock()
        mock_db.blog_posts = MagicMock()
        mock_db.blog_posts.count_documents = AsyncMock(return_value=3)
        mock_db.blog_posts.find.return_value.sort.return_value.skip.return_value.limit.return_value.to_list = AsyncMock(return_value=[
            {"title": "Draft"}, {"title": "Published"}, {"title": "Another"}
        ])
        result = await list_posts(mock_db, published_only=False)
        assert result["total"] == 3


class TestUpdatePost:
    """Tests for update_post()."""

    @pytest.mark.asyncio
    async def test_updates_post(self):
        from blog_service import update_post
        mock_db = MagicMock()
        mock_db.blog_posts = MagicMock()
        mock_db.blog_posts.update_one = AsyncMock(return_value=MagicMock(matched_count=1))
        mock_db.blog_posts.find_one = AsyncMock(return_value={"id": "p1", "title": "Updated"})
        result = await update_post(mock_db, "p1", title="Updated")
        assert result["title"] == "Updated"

    @pytest.mark.asyncio
    async def test_post_not_found(self):
        from blog_service import update_post
        mock_db = MagicMock()
        mock_db.blog_posts = MagicMock()
        mock_db.blog_posts.update_one = AsyncMock(return_value=MagicMock(matched_count=0))
        result = await update_post(mock_db, "nonexistent", title="X")
        assert result is None


class TestDeletePost:
    """Tests for delete_post()."""

    @pytest.mark.asyncio
    async def test_deletes_post(self):
        from blog_service import delete_post
        mock_db = MagicMock()
        mock_db.blog_posts = MagicMock()
        mock_db.blog_posts.delete_one = AsyncMock(return_value=MagicMock(deleted_count=1))
        result = await delete_post(mock_db, "p1")
        assert result is True

    @pytest.mark.asyncio
    async def test_post_not_found(self):
        from blog_service import delete_post
        mock_db = MagicMock()
        mock_db.blog_posts = MagicMock()
        mock_db.blog_posts.delete_one = AsyncMock(return_value=MagicMock(deleted_count=0))
        result = await delete_post(mock_db, "nonexistent")
        assert result is False


class TestGetCategories:
    """Tests for get_categories()."""

    @pytest.mark.asyncio
    async def test_returns_categories(self):
        from blog_service import get_categories
        mock_db = MagicMock()
        mock_db.blog_posts = MagicMock()
        mock_db.blog_posts.aggregate.return_value.to_list = AsyncMock(return_value=[
            {"_id": "SEO", "count": 5},
            {"_id": "Local SEO", "count": 3},
        ])
        result = await get_categories(mock_db)
        assert len(result) == 2
        assert result[0]["name"] == "SEO"
        assert result[0]["count"] == 5

    @pytest.mark.asyncio
    async def test_no_categories(self):
        from blog_service import get_categories
        mock_db = MagicMock()
        mock_db.blog_posts = MagicMock()
        mock_db.blog_posts.aggregate.return_value.to_list = AsyncMock(return_value=[])
        result = await get_categories(mock_db)
        assert result == []


class TestSeedDefaultPosts:
    """Tests for seed_default_posts()."""

    @pytest.mark.asyncio
    async def test_seeds_when_empty(self):
        from blog_service import seed_default_posts
        mock_db = MagicMock()
        mock_db.blog_posts = MagicMock()
        # New logic uses find() with projection instead of count_documents
        mock_cursor = MagicMock()
        mock_cursor.__aiter__.return_value = iter([])
        mock_db.blog_posts.find = MagicMock(return_value=mock_cursor)
        mock_db.blog_posts.insert_one = AsyncMock()
        result = await seed_default_posts(mock_db)
        # 4 original + 6 new + 5 industry = 15 total seed posts
        assert result == 15
        assert mock_db.blog_posts.insert_one.call_count == 15

    @pytest.mark.asyncio
    async def test_skips_when_posts_exist(self):
        from blog_service import seed_default_posts
        mock_db = MagicMock()
        mock_db.blog_posts = MagicMock()
        # All slugs already exist
        mock_cursor = MagicMock()
        mock_cursor.__aiter__.return_value = iter([
            {"slug": "google-maps-small-business-guide"},
            {"slug": "website-not-showing-on-google"},
            {"slug": "local-seo-2026"},
            {"slug": "seo-roi-calculator"},
            {"slug": "instagram-for-small-business-guide"},
            {"slug": "mobile-friendly-website-guide"},
            {"slug": "google-business-profile-setup-2026"},
            {"slug": "get-more-google-reviews"},
            {"slug": "ai-search-optimization-small-business"},
            {"slug": "content-marketing-small-business"},
            {"slug": "restaurant-seo-guide"},
            {"slug": "plumber-marketing-guide"},
            {"slug": "salon-marketing-guide"},
            {"slug": "dental-seo-guide"},
            {"slug": "retail-store-marketing-guide"},
        ])
        mock_db.blog_posts.find = MagicMock(return_value=mock_cursor)
        result = await seed_default_posts(mock_db)
        assert result == 0
        mock_db.blog_posts.insert_one.assert_not_called()
