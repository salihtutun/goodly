"""Unit tests for ai_metrics.py, evals, and logging_config — push to 80%+/100%/100%."""
import os, sys, pytest, asyncio, logging
from unittest.mock import patch, MagicMock, AsyncMock
from io import StringIO

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "backend"))


def _arun(coro):
    loop = asyncio.new_event_loop()
    try: return loop.run_until_complete(coro)
    finally: loop.close()


# ═══ AI_METRICS: 56% → 80%+ ═══
class TestAIMetrics:
    def test_collector_record(self):
        from ai_metrics import AIMetricsCollector, AIMetrics
        mock_db = MagicMock(); mock_db.ai_metrics = MagicMock(); mock_db.ai_metrics.insert_one = AsyncMock()
        c = AIMetricsCollector(mock_db)
        m = AIMetrics(feature="t", prompt_version="v1", model="gemini-2.5-flash",
                      input_tokens=100, output_tokens=50, latency_ms=500, success=True)
        _arun(c.record(m))
        mock_db.ai_metrics.insert_one.assert_called_once()

    def test_collector_record_error(self):
        from ai_metrics import AIMetricsCollector, AIMetrics
        mock_db = MagicMock(); mock_db.ai_metrics = MagicMock()
        mock_db.ai_metrics.insert_one = AsyncMock(side_effect=Exception("DB down"))
        c = AIMetricsCollector(mock_db)
        _arun(c.record(AIMetrics(feature="t", prompt_version="v1", model="g",
                                  input_tokens=0, output_tokens=0, latency_ms=0, success=True)))

    def test_collector_summary(self):
        from ai_metrics import AIMetricsCollector
        mock_db = MagicMock(); mock_db.ai_metrics = MagicMock()
        mock_db.ai_metrics.aggregate = MagicMock(return_value=MagicMock(
            to_list=AsyncMock(return_value=[{"_id": "t", "calls": 10, "total_cost_usd": 0.05}])))
        assert len(_arun(AIMetricsCollector(mock_db).summary(7))) == 1

    def test_collector_summary_error(self):
        from ai_metrics import AIMetricsCollector
        mock_db = MagicMock(); mock_db.ai_metrics = MagicMock()
        mock_db.ai_metrics.aggregate = MagicMock(side_effect=Exception("DB down"))
        assert _arun(AIMetricsCollector(mock_db).summary(7)) == []

    def test_collector_daily_cost(self):
        from ai_metrics import AIMetricsCollector
        mock_db = MagicMock(); mock_db.ai_metrics = MagicMock()
        mock_db.ai_metrics.aggregate = MagicMock(return_value=MagicMock(
            to_list=AsyncMock(return_value=[{"_id": "2026-01-01", "calls": 5, "cost_usd": 0.01}])))
        assert len(_arun(AIMetricsCollector(mock_db).daily_cost(30))) == 1

    def test_collector_daily_cost_error(self):
        from ai_metrics import AIMetricsCollector
        mock_db = MagicMock(); mock_db.ai_metrics = MagicMock()
        mock_db.ai_metrics.aggregate = MagicMock(side_effect=Exception("DB down"))
        assert _arun(AIMetricsCollector(mock_db).daily_cost(30)) == []

    def test_timed_ai_call_success(self):
        from ai_metrics import TimedAICall, AIMetricsCollector
        mock_db = MagicMock(); mock_db.ai_metrics = MagicMock(); mock_db.ai_metrics.insert_one = AsyncMock()
        c = AIMetricsCollector(mock_db)
        async def t():
            async with TimedAICall(c, "f", "v1", "gemini-2.5-flash") as ctx:
                ctx.set_tokens(500, 200)
            return True
        assert _arun(t()) == True
        mock_db.ai_metrics.insert_one.assert_called_once()

    def test_timed_ai_call_exception(self):
        from ai_metrics import TimedAICall, AIMetricsCollector
        mock_db = MagicMock(); mock_db.ai_metrics = MagicMock(); mock_db.ai_metrics.insert_one = AsyncMock()
        c = AIMetricsCollector(mock_db)
        async def t():
            async with TimedAICall(c, "f", "v1", "gemini-2.5-flash"):
                raise ValueError("test error")
        try: _arun(t())
        except ValueError: pass
        mock_db.ai_metrics.insert_one.assert_called_once()
        assert mock_db.ai_metrics.insert_one.call_args[0][0]["success"] == False


# ═══ EVALS: 89% → 100% ═══
class TestEvals:
    def test_eval_result_latency(self):
        from evals import EvalResult
        r = EvalResult("t"); r.latency_ms = [100, 200, 300]
        assert r.avg_latency_ms == 200

    def test_eval_result_summary_with_failures(self):
        from evals import EvalResult
        r = EvalResult("t"); r.total = 5; r.passed = 3; r.failed = 2
        r.failures = ["missing key 'x'"]
        assert "60.0%" in r.summary() and "missing key" in r.summary()

    def test_run_eval_assertion_error(self):
        from evals import run_eval, EvalCase
        async def fn(**kw): return {"x": 1}
        def bad(output): raise RuntimeError("crash")
        r = _arun(run_eval(fn, [EvalCase(name="c", input={}, assertions=[bad])], "t"))
        assert r.errors >= 1

    def test_run_eval_latency_tracking(self):
        from evals import run_eval, EvalCase
        async def fn(**kw): return {"ok": True}
        r = _arun(run_eval(fn, [EvalCase(name="c", input={})], "t"))
        assert len(r.latency_ms) == 1 and r.latency_ms[0] > 0


# ═══ LOGGING: 96% → 100% ═══
class TestLogging:
    def test_setup_logging_clears_handlers(self):
        from logging_config import setup_logging
        root = logging.getLogger()
        root.handlers.clear()
        root.addHandler(logging.StreamHandler(StringIO()))
        assert len(root.handlers) == 1
        setup_logging()
        assert len(root.handlers) == 1
