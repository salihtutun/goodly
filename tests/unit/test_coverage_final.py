"""Final coverage gap tests — evals 96%→100%, logging 96%→100%, scheduler 95%→100%."""
import os, sys, pytest, json, logging, inspect
from unittest.mock import patch, MagicMock, AsyncMock

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "backend"))


class TestEvalsGaps:
    """Cover the 4 missed lines in evals/__init__.py (124-126, 161)."""

    def test_has_valid_score_non_numeric(self):
        """Cover line 161: non-numeric type check in has_valid_score."""
        from evals import has_valid_score
        check = has_valid_score("score")
        ok, msg = check({"score": "not_a_number"})
        assert not ok
        assert "not numeric" in msg

    @pytest.mark.asyncio
    async def test_run_eval_assertion_fails(self):
        """Cover lines 124-126: assertion failure path in run_eval."""
        from evals import run_eval, EvalCase
        from evals import has_min_items

        async def fn(**kwargs):
            return {"items": [1]}  # only 1 item, min is 3

        cases = [
            EvalCase(name="case1", input={}, assertions=[has_min_items("items", 3)])
        ]
        result = await run_eval(fn, cases, "test_prompt")
        assert result.failed >= 1
        assert len(result.failures) >= 1
        assert "case1" in result.failures[0]


class TestLoggingConfigGaps:
    """Cover the 1 missed line in logging_config.py (line 29: extra_fields)."""

    def test_structured_formatter_with_extra_fields(self):
        """Cover line 29: extra_fields path in StructuredFormatter.format."""
        from logging_config import StructuredFormatter
        fmt = StructuredFormatter()
        record = logging.LogRecord(
            "test", logging.INFO, "test.py", 42, "hello world", (), None
        )
        record.extra_fields = {"user_id": "abc123", "request_id": "req-456"}
        output = fmt.format(record)
        parsed = json.loads(output)
        assert parsed["user_id"] == "abc123"
        assert parsed["request_id"] == "req-456"


class TestSchedulerGaps:
    """Cover the 4 missed lines in scheduler.py (162-165: inner tick function)."""

    @pytest.mark.asyncio
    async def test_start_scheduler_creates_tick_job(self):
        """Cover lines 162-165: inner tick() function in start()."""
        import scheduler as sched_mod
        import asyncio

        # Reset global singleton
        sched_mod._scheduler = None

        with patch("scheduler.AsyncIOScheduler") as mock_sched_cls, \
             patch("scheduler.run_due_audits") as mock_run:
            mock_sched = MagicMock()
            mock_sched_cls.return_value = mock_sched
            mock_db = MagicMock()
            mock_run.return_value = {"audited": 0}

            sched_mod.start(mock_db, lambda: "http://localhost:8000")

            # Verify add_job was called
            mock_sched.add_job.assert_called()
            call_args = mock_sched.add_job.call_args
            # First positional arg is the tick function
            tick_fn = call_args[0][0]
            assert inspect.iscoroutinefunction(tick_fn)
            # Verify it's an interval job
            assert call_args[1].get("id") == "scheduled_audits_hourly"

            # Actually call the tick function to get coverage of lines 162-165
            await tick_fn()
            mock_run.assert_called_once_with(mock_db, "http://localhost:8000")

        # Clean up global
        sched_mod._scheduler = None

    @pytest.mark.asyncio
    async def test_tick_exception_handler(self):
        """Cover lines 164-165: exception handler in tick()."""
        import scheduler as sched_mod
        import asyncio

        # Reset the global singleton so start() doesn't short-circuit
        sched_mod._scheduler = None

        with patch("scheduler.AsyncIOScheduler") as mock_sched_cls, \
             patch("scheduler.run_due_audits") as mock_run, \
             patch("scheduler.logger") as mock_logger:
            mock_sched = MagicMock()
            mock_sched_cls.return_value = mock_sched
            mock_db = MagicMock()
            mock_run.side_effect = RuntimeError("db down")

            sched_mod.start(mock_db, lambda: "http://localhost:8000")
            call_args = mock_sched.add_job.call_args
            tick_fn = call_args[0][0]

            # This should not raise — exception is caught
            await tick_fn()
            mock_logger.exception.assert_called_once_with("scheduler tick crashed")
