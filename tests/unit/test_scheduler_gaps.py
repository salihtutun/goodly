"""Scheduler 95%→100% — 4 missed lines."""
import os, pytest
from unittest.mock import MagicMock

def test_start_already_running():
    import scheduler as s
    s._scheduler = MagicMock()
    try:
        assert s.start(MagicMock(), lambda: "x") is s._scheduler
    finally:
        s._scheduler = None

def test_start_disabled():
    old = os.environ.get("SCHEDULER_ENABLED")
    os.environ["SCHEDULER_ENABLED"] = "false"
    try:
        import scheduler as s
        s._scheduler = None
        assert s.start(MagicMock(), lambda: "x") is None
    finally:
        if old is not None: os.environ["SCHEDULER_ENABLED"] = old
        else: os.environ.pop("SCHEDULER_ENABLED", None)

def test_shutdown_with():
    import scheduler as s
    m = MagicMock(); s._scheduler = m; s.shutdown()
    m.shutdown.assert_called_once_with(wait=False)
    assert s._scheduler is None

def test_shutdown_without():
    import scheduler as s
    s._scheduler = None; s.shutdown()
