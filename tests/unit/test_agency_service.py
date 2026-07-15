"""Unit tests for agency_service.py — client management for agency users."""
import pytest
from unittest.mock import AsyncMock, patch, MagicMock


class TestCreateClient:
    """Tests for create_client()."""

    @pytest.mark.asyncio
    async def test_creates_client_successfully(self):
        # hash_password is imported inside create_client via `from auth import hash_password`
        with patch("agency_service.db") as mock_db, patch("auth.hash_password") as mock_hash:
            from agency_service import create_client
            # First find_one: email check (returns None = not taken)
            # Second find_one: agency lookup (returns agency user)
            mock_db.users.find_one = AsyncMock(side_effect=[None, {"id": "agency1", "plan": "pro"}])
            mock_db.users.count_documents = AsyncMock(return_value=0)
            mock_db.users.insert_one = AsyncMock()
            mock_db.projects.insert_one = AsyncMock()
            mock_hash.return_value = "hashed_pw"
            result = await create_client(
                agency_user_id="agency1",
                email="client@test.com",
                name="Client Name",
                website="https://client.com",
            )
            assert result["client"]["email"] == "client@test.com"
            assert result["client"]["role"] == "user"
            assert result["client"]["parent_user_id"] == "agency1"

    @pytest.mark.asyncio
    async def test_rejects_duplicate_email(self):
        with patch("agency_service.db") as mock_db:
            from agency_service import create_client
            mock_db.users.find_one = AsyncMock(return_value={"id": "existing"})
            with pytest.raises(ValueError, match="already exists"):
                await create_client(
                    agency_user_id="agency1",
                    email="existing@test.com",
                    name="Client",
                    website="https://client.com",
                )

    @pytest.mark.asyncio
    async def test_rejects_agency_not_found(self):
        with patch("agency_service.db") as mock_db:
            from agency_service import create_client
            mock_db.users.find_one = AsyncMock(side_effect=[None, None])
            with pytest.raises(ValueError, match="Agency user not found"):
                await create_client(
                    agency_user_id="agency1",
                    email="client@test.com",
                    name="Client",
                    website="https://client.com",
                )

    @pytest.mark.asyncio
    async def test_rejects_client_limit_reached(self):
        with patch("agency_service.db") as mock_db:
            from agency_service import create_client
            mock_db.users.find_one = AsyncMock(side_effect=[
                None,  # email check
                {"id": "agency1", "plan": "starter"},  # agency lookup
            ])
            mock_db.users.count_documents = AsyncMock(return_value=3)  # starter limit is 3
            with pytest.raises(ValueError, match="Client limit reached"):
                await create_client(
                    agency_user_id="agency1",
                    email="client@test.com",
                    name="Client",
                    website="https://client.com",
                )


class TestListClients:
    """Tests for list_clients()."""

    @pytest.mark.asyncio
    async def test_lists_clients(self):
        with patch("agency_service.db") as mock_db:
            from agency_service import list_clients
            mock_db.users.find.return_value.sort.return_value.to_list = AsyncMock(return_value=[
                {"id": "c1", "email": "c1@test.com", "name": "Client 1"},
                {"id": "c2", "email": "c2@test.com", "name": "Client 2"},
            ])
            mock_db.audits.find.return_value.sort.return_value.limit.return_value.to_list = AsyncMock(return_value=[])
            mock_db.projects.count_documents = AsyncMock(return_value=0)
            mock_db.audits.count_documents = AsyncMock(return_value=0)
            result = await list_clients("agency1")
            assert len(result) == 2
            assert result[0]["id"] == "c1"

    @pytest.mark.asyncio
    async def test_returns_empty_list(self):
        with patch("agency_service.db") as mock_db:
            from agency_service import list_clients
            mock_db.users.find.return_value.sort.return_value.to_list = AsyncMock(return_value=[])
            result = await list_clients("agency1")
            assert result == []


class TestGetClient:
    """Tests for get_client()."""

    @pytest.mark.asyncio
    async def test_returns_client_with_audits(self):
        with patch("agency_service.db") as mock_db:
            from agency_service import get_client
            mock_db.users.find_one = AsyncMock(return_value={
                "id": "c1", "email": "c1@test.com", "name": "Client 1",
                "parent_user_id": "agency1", "plan": "free",
            })
            mock_db.audits.find.return_value.sort.return_value.limit.return_value.to_list = AsyncMock(return_value=[
                {"result": {"overall_score": 75}},
            ])
            mock_db.projects.find.return_value.sort.return_value.to_list = AsyncMock(return_value=[])
            result = await get_client("agency1", "c1")
            assert result["id"] == "c1"
            assert result["last_score"] == 75

    @pytest.mark.asyncio
    async def test_client_not_found(self):
        with patch("agency_service.db") as mock_db:
            from agency_service import get_client
            mock_db.users.find_one = AsyncMock(return_value=None)
            result = await get_client("agency1", "c1")
            assert result is None

    @pytest.mark.asyncio
    async def test_wrong_agency_returns_none(self):
        with patch("agency_service.db") as mock_db:
            from agency_service import get_client
            mock_db.users.find_one = AsyncMock(return_value=None)
            result = await get_client("agency1", "c1")
            assert result is None


class TestRunClientAudit:
    """Tests for run_client_audit()."""

    @pytest.mark.asyncio
    async def test_client_not_found(self):
        with patch("agency_service.db") as mock_db:
            from agency_service import run_client_audit
            mock_db.users.find_one = AsyncMock(return_value=None)
            with pytest.raises(ValueError, match="Client not found"):
                await run_client_audit(
                    agency_user_id="agency1",
                    client_id="c1",
                    url="https://example.com",
                )


class TestGetAgencyDashboard:
    """Tests for get_agency_dashboard()."""

    @pytest.mark.asyncio
    async def test_returns_dashboard(self):
        with patch("agency_service.list_clients") as mock_list:
            from agency_service import get_agency_dashboard
            from datetime import datetime, timezone, timedelta
            recent = (datetime.now(timezone.utc) - timedelta(days=5)).isoformat()
            mock_list.return_value = [
                {"id": "c1", "last_score": 80, "project_count": 2, "audit_count": 5, "last_audit_at": recent},
                {"id": "c2", "last_score": 40, "project_count": 1, "audit_count": 2, "last_audit_at": recent},
            ]
            result = await get_agency_dashboard("agency1")
            assert result["total_clients"] == 2
            assert result["total_projects"] == 3
            assert result["total_audits"] == 7
            assert result["average_score"] == 60
            # c2 has score 40 (< 50) so needs attention; c1 has score 80 and recent audit so doesn't
            assert result["clients_needing_attention"] == 1

    @pytest.mark.asyncio
    async def test_no_clients(self):
        with patch("agency_service.list_clients") as mock_list:
            from agency_service import get_agency_dashboard
            mock_list.return_value = []
            result = await get_agency_dashboard("agency1")
            assert result["total_clients"] == 0
            assert result["average_score"] is None


class TestGetMaxClients:
    """Tests for _get_max_clients()."""

    def test_plan_limits(self):
        from agency_service import _get_max_clients
        assert _get_max_clients("free") == 0
        assert _get_max_clients("starter") == 3
        assert _get_max_clients("pro") == 15
        assert _get_max_clients("concierge") == 50

    def test_unknown_plan(self):
        from agency_service import _get_max_clients
        assert _get_max_clients("unknown") == 0
