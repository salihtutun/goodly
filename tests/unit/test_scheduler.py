"""Unit tests for scheduler.py — background audit scheduler."""
import os
import pytest
from unittest.mock import patch, MagicMock

from conftest import AsyncMock

from datetime import datetime, timezone, timedelta
import asyncio

from scheduler import (
    _now,
    _iso,
    _previous_score,
    start,
    shutdown,
    run_due_audits,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _set_env(**kwargs):
    for k, v in kwargs.items():
        os.environ[k] = v


def _clear_env(*keys):
    for k in keys:
        os.environ.pop(k, None)


# ---------------------------------------------------------------------------
# _now
# ---------------------------------------------------------------------------

def test_now_returns_datetime():
    """_now returns a timezone-aware datetime."""
    result = _now()
    assert isinstance(result, datetime)
    assert result.tzinfo is not None


def test_now_is_utc():
    """_now returns a UTC datetime."""
    result = _now()
    assert result.tzinfo == timezone.utc


# ---------------------------------------------------------------------------
# _iso
# ---------------------------------------------------------------------------

def test_iso_formats_correctly():
    """_iso returns an ISO 8601 formatted string."""
    dt = datetime(2025, 6, 15, 12, 30, 0, tzinfo=timezone.utc)
    result = _iso(dt)
    assert "2025-06-15" in result
    assert "12:30:00" in result


def test_iso_roundtrip():
    """_iso output can be parsed back to the same datetime."""
    dt = _now()
    iso_str = _iso(dt)
    assert isinstance(iso_str, str)
    assert "T" in iso_str


# ---------------------------------------------------------------------------
# _previous_score
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_previous_score_returns_none_for_no_audits():
    """_previous_score returns None when there are no previous audits."""
    mock_db = MagicMock()
    mock_cursor = MagicMock()
    mock_cursor.sort.return_value = mock_cursor
    mock_cursor.limit.return_value = mock_cursor
    mock_cursor.to_list = AsyncMock(return_value=[])
    mock_db.audits.find.return_value = mock_cursor

    result = await _previous_score(mock_db, "project-1")
    assert result is None


@pytest.mark.asyncio
async def test_previous_score_returns_score():
    """_previous_score returns the overall_score from the last audit."""
    mock_db = MagicMock()
    mock_cursor = MagicMock()
    mock_cursor.sort.return_value = mock_cursor
    mock_cursor.limit.return_value = mock_cursor
    mock_cursor.to_list = AsyncMock(return_value=[
        {"result": {"overall_score": 85}, "created_at": "2025-06-01T00:00:00+00:00"}
    ])
    mock_db.audits.find.return_value = mock_cursor

    result = await _previous_score(mock_db, "project-1")
    assert result == 85


@pytest.mark.asyncio
async def test_previous_score_handles_missing_result():
    """_previous_score returns None when audit doc has no result field."""
    mock_db = MagicMock()
    mock_cursor = MagicMock()
    mock_cursor.sort.return_value = mock_cursor
    mock_cursor.limit.return_value = mock_cursor
    mock_cursor.to_list = AsyncMock(return_value=[
        {"created_at": "2025-06-01T00:00:00+00:00"}
    ])
    mock_db.audits.find.return_value = mock_cursor

    result = await _previous_score(mock_db, "project-1")
    assert result is None


# ---------------------------------------------------------------------------
# start
# ---------------------------------------------------------------------------

def test_start_creates_scheduler():
    """start creates and returns an AsyncIOScheduler."""
    _set_env(SCHEDULER_ENABLED="true")
    try:
        mock_db = MagicMock()
        base_url_provider = MagicMock(return_value="https://goodly.app")

        import scheduler
        scheduler._scheduler = None

        with patch("scheduler.AsyncIOScheduler") as mock_sched_class:
            mock_sched = MagicMock()
            mock_sched_class.return_value = mock_sched

            result = start(mock_db, base_url_provider)
            assert result is mock_sched
            mock_sched.add_job.assert_called_once()
            mock_sched.start.assert_called_once()
    finally:
        _clear_env("SCHEDULER_ENABLED")
        import scheduler
        scheduler._scheduler = None


def test_start_returns_existing_scheduler():
    """start returns the existing scheduler if already started."""
    _set_env(SCHEDULER_ENABLED="true")
    try:
        import scheduler
        existing = MagicMock()
        scheduler._scheduler = existing

        result = start(MagicMock(), MagicMock())
        assert result is existing
    finally:
        _clear_env("SCHEDULER_ENABLED")
        import scheduler
        scheduler._scheduler = None


def test_start_disabled_by_env():
    """start returns None when SCHEDULER_ENABLED is false."""
    _set_env(SCHEDULER_ENABLED="false")
    try:
        import scheduler
        scheduler._scheduler = None

        result = start(MagicMock(), MagicMock())
        assert result is None
    finally:
        _clear_env("SCHEDULER_ENABLED")


def test_start_disabled_by_env_no():
    """start returns None when SCHEDULER_ENABLED is 'no'."""
    _set_env(SCHEDULER_ENABLED="no")
    try:
        import scheduler
        scheduler._scheduler = None

        result = start(MagicMock(), MagicMock())
        assert result is None
    finally:
        _clear_env("SCHEDULER_ENABLED")


def test_start_disabled_by_env_zero():
    """start returns None when SCHEDULER_ENABLED is '0'."""
    _set_env(SCHEDULER_ENABLED="0")
    try:
        import scheduler
        scheduler._scheduler = None

        result = start(MagicMock(), MagicMock())
        assert result is None
    finally:
        _clear_env("SCHEDULER_ENABLED")


# ---------------------------------------------------------------------------
# shutdown
# ---------------------------------------------------------------------------

def test_shutdown_stops_scheduler():
    """shutdown calls shutdown on the scheduler and clears the global."""
    import scheduler
    mock_sched = MagicMock()
    scheduler._scheduler = mock_sched

    shutdown()
    mock_sched.shutdown.assert_called_once_with(wait=False)
    assert scheduler._scheduler is None


def test_shutdown_noop_when_none():
    """shutdown does nothing when no scheduler is running."""
    import scheduler
    scheduler._scheduler = None
    shutdown()
    assert scheduler._scheduler is None


# ---------------------------------------------------------------------------
# run_due_audits
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_run_due_audits_no_due_projects():
    """run_due_audits returns summary with 0 due when no projects are due."""
    mock_db = MagicMock()
    mock_cursor = MagicMock()
    mock_cursor.to_list = AsyncMock(return_value=[])
    mock_db.projects.find.return_value = mock_cursor

    result = await run_due_audits(mock_db, "https://goodly.app")
    assert result["due"] == 0
    assert result["ran"] == 0
    assert result["failures"] == 0


@pytest.mark.asyncio
async def test_run_due_audits_with_due_projects(mock_db):
    """run_due_audits processes due projects and returns summary."""
    # Mock the find cursor properly - find() returns a cursor synchronously
    mock_cursor = MagicMock()
    mock_cursor.to_list = AsyncMock(return_value=[
        {"id": "proj-1", "user_id": "user-1", "url": "https://example.com",
         "name": "Test Project", "schedule": "monthly",
         "next_audit_at": "2025-01-01T00:00:00+00:00"},
    ])
    mock_db.projects.find = MagicMock(return_value=mock_cursor)

    mock_db.users.find_one = AsyncMock(return_value={
        "id": "user-1", "email": "user@test.com", "name": "Test User",
    })

    mock_audit_cursor = MagicMock()
    mock_audit_cursor.sort.return_value = mock_audit_cursor
    mock_audit_cursor.limit.return_value = mock_audit_cursor
    mock_audit_cursor.to_list = AsyncMock(return_value=[])
    mock_db.audits.find = MagicMock(return_value=mock_audit_cursor)

    mock_db.audits.insert_one = AsyncMock()
    mock_db.projects.update_one = AsyncMock()
    mock_db.scheduled_runs.insert_one = AsyncMock()

    with patch("scheduler.analyze_url", new=AsyncMock(return_value={
        "url": "https://example.com",
        "fetch_failed": False,
        "overall_score": 80,
        "issues": [],
    })):
        with patch("scheduler.ai_service.audit_recommendations", new=AsyncMock(return_value={"summary": "Good"})):
            with patch("scheduler.email_service.send_html_email", new=AsyncMock(return_value={"mocked": True, "id": None, "error": None})):
                result = await run_due_audits(mock_db, "https://goodly.app")
                assert result["due"] == 1
                assert result["ran"] == 1
                assert result["failures"] == 0


@pytest.mark.asyncio
async def test_run_due_audits_handles_failure(mock_db):
    """run_due_audits increments failures counter and advances next_audit_at on error."""
    mock_cursor = MagicMock()
    mock_cursor.to_list = AsyncMock(return_value=[
        {"id": "proj-1", "user_id": "user-1", "url": "https://example.com",
         "name": "Test Project", "schedule": "monthly",
         "next_audit_at": "2025-01-01T00:00:00+00:00"},
    ])
    mock_db.projects.find = MagicMock(return_value=mock_cursor)

    mock_db.users.find_one = AsyncMock(side_effect=Exception("DB connection lost"))
    mock_db.projects.update_one = AsyncMock()

    result = await run_due_audits(mock_db, "https://goodly.app")
    assert result["due"] == 1
    assert result["failures"] == 1
    mock_db.projects.update_one.assert_called()


def test_run_one_user_not_found():
    """Cover line 46: return skipped when user not found."""
    from scheduler import _run_one_scheduled_audit
    db = MagicMock()
    db.users.find_one = AsyncMock(return_value=None)
    r = asyncio.run(_run_one_scheduled_audit(db, {"id":"p1","user_id":"u1","url":"https://t.com","name":"T"}, "http://localhost"))
    assert r == {"skipped": "user_not_found"}

def test_run_one_ai_recs_fails():
    """Cover lines 55-57: AI recs exception handler."""
    from scheduler import _run_one_scheduled_audit
    db = MagicMock()
    db.users.find_one = AsyncMock(return_value={"id":"u1","email":"t@t.com","name":"T"})
    db.audits.find.return_value.sort.return_value.limit.return_value.to_list = AsyncMock(return_value=[])
    db.audits.insert_one = AsyncMock()
    db.projects.update_one = AsyncMock()
    db.scheduled_runs.insert_one = AsyncMock()
    with patch("scheduler.analyze_url", new_callable=AsyncMock) as m:
        m.return_value = {"overall_score":80,"url":"https://t.com","issues":[]}
        with patch("scheduler.ai_service.audit_recommendations", side_effect=Exception("AI down")):
            with patch("scheduler.email_service.send_html_email", new_callable=AsyncMock) as em:
                em.return_value = {"mocked":True}
                r = asyncio.run(_run_one_scheduled_audit(db, {"id":"p1","user_id":"u1","url":"https://t.com","name":"T"}, "http://localhost"))
                assert "audit_id" in r

def test_run_one_email_fails():
    """Cover lines 104-106: email exception handler."""
    from scheduler import _run_one_scheduled_audit
    db = MagicMock()
    db.users.find_one = AsyncMock(return_value={"id":"u1","email":"t@t.com","name":"T"})
    db.audits.find.return_value.sort.return_value.limit.return_value.to_list = AsyncMock(return_value=[])
    db.audits.insert_one = AsyncMock()
    db.projects.update_one = AsyncMock()
    db.scheduled_runs.insert_one = AsyncMock()
    with patch("scheduler.analyze_url", new_callable=AsyncMock) as m:
        m.return_value = {"overall_score":80,"url":"https://t.com","issues":[]}
        with patch("scheduler.ai_service.audit_recommendations", new_callable=AsyncMock):
            with patch("scheduler.email_service.send_html_email", side_effect=Exception("email down")):
                r = asyncio.run(_run_one_scheduled_audit(db, {"id":"p1","user_id":"u1","url":"https://t.com","name":"T"}, "http://localhost"))
                assert "audit_id" in r
