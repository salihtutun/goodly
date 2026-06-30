"""Unit tests for new infrastructure modules."""
import os, sys, pytest, json, logging
from unittest.mock import patch, MagicMock, AsyncMock
from io import StringIO

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "..", "backend"))


class TestLoggingConfig:
    def test_setup_logging(self):
        from logging_config import setup_logging, StructuredFormatter
        root = setup_logging()
        assert root.level == logging.INFO
        assert len(root.handlers) == 1
        assert isinstance(root.handlers[0].formatter, StructuredFormatter)

    def test_structured_formatter(self):
        from logging_config import StructuredFormatter
        fmt = StructuredFormatter()
        record = logging.LogRecord(
            "test", logging.INFO, "test.py", 42, "hello world", (), None
        )
        output = fmt.format(record)
        parsed = json.loads(output)
        assert parsed["level"] == "INFO"
        assert parsed["message"] == "hello world"
        assert parsed["module"] == "test"
        assert parsed["line"] == 42

    def test_structured_formatter_with_exception(self):
        from logging_config import StructuredFormatter
        fmt = StructuredFormatter()
        try:
            raise ValueError("test error")
        except ValueError:
            record = logging.LogRecord(
                "test", logging.ERROR, "test.py", 1, "error msg", (), None
            )
            record.exc_info = (ValueError, ValueError("test error"), None)
            output = fmt.format(record)
            parsed = json.loads(output)
            assert parsed["level"] == "ERROR"
            assert "test error" in parsed["exception"]


class TestMetrics:
    def test_metrics_middleware_import(self):
        from metrics import MetricsMiddleware
        assert MetricsMiddleware is not None

    def test_metrics_middleware_is_middleware(self):
        from metrics import MetricsMiddleware
        from starlette.middleware.base import BaseHTTPMiddleware
        assert issubclass(MetricsMiddleware, BaseHTTPMiddleware)


class TestSecurityHeaders:
    def test_security_headers_import(self):
        from security_headers import SecurityHeadersMiddleware
        assert SecurityHeadersMiddleware is not None

    def test_security_headers_is_middleware(self):
        from security_headers import SecurityHeadersMiddleware
        from starlette.middleware.base import BaseHTTPMiddleware
        assert issubclass(SecurityHeadersMiddleware, BaseHTTPMiddleware)


class TestPrompts:
    def test_registry_singleton(self):
        from prompts import registry
        from prompts import PromptRegistry
        assert isinstance(registry, PromptRegistry)

    def test_prompt_dataclass(self):
        from prompts import Prompt
        p = Prompt(
            version="v1", system="You are helpful.",
            user_template="Hello {name}", model="gemini-2.5-flash",
        )
        assert p.version == "v1"
        assert p.model == "gemini-2.5-flash"
        assert p.temperature == 0.3
        assert p.max_output_tokens == 4096

    def test_prompt_render(self):
        from prompts import Prompt
        p = Prompt(
            version="v1", system="SYS",
            user_template="Hello {name}, your site is {url}",
        )
        result = p.render(name="John", url="https://example.com")
        assert "John" in result
        assert "https://example.com" in result

    def test_registry_register_and_get(self):
        from prompts import registry, Prompt
        registry.register("test_prompt", "v1", Prompt(
            version="v1", system="SYS", user_template="Hello {name}",
        ))
        p = registry.get("test_prompt")
        assert p.version == "v1"
        assert p.system == "SYS"

    def test_registry_get_latest(self):
        from prompts import registry, Prompt
        registry.register("multi_ver", "v1", Prompt(
            version="v1", system="v1 sys", user_template="v1 {x}",
        ))
        registry.register("multi_ver", "v2", Prompt(
            version="v2", system="v2 sys", user_template="v2 {x}",
        ))
        p = registry.get("multi_ver")
        assert p.version == "v2"

    def test_registry_get_specific_version(self):
        from prompts import registry, Prompt
        registry.register("specific", "v1", Prompt(
            version="v1", system="v1", user_template="{x}",
        ))
        registry.register("specific", "v2", Prompt(
            version="v2", system="v2", user_template="{x}",
        ))
        p = registry.get("specific", "v1")
        assert p.version == "v1"

    def test_registry_get_missing(self):
        from prompts import registry
        with pytest.raises(KeyError):
            registry.get("nonexistent_prompt_xyz")

    def test_registry_get_wrong_version(self):
        from prompts import registry, Prompt
        registry.register("wrong_ver", "v1", Prompt(
            version="v1", system="S", user_template="{x}",
        ))
        with pytest.raises(KeyError):
            registry.get("wrong_ver", "v99")

    def test_registry_list_versions(self):
        from prompts import registry, Prompt
        registry.register("list_test", "v1", Prompt(
            version="v1", system="S", user_template="{x}",
        ))
        registry.register("list_test", "v3", Prompt(
            version="v3", system="S", user_template="{x}",
        ))
        versions = registry.list_versions("list_test")
        assert "v1" in versions
        assert "v3" in versions

    def test_registry_list_all(self):
        from prompts import registry
        import prompts.v1.seo, prompts.v1.social, prompts.v1.gbp, prompts.v1.ai_visibility  # noqa
        names = registry.list_all()
        assert "seo_meta_tags" in names
        assert "social_audit" in names
        assert "gbp_audit" in names
        assert "ai_visibility_check" in names

    def test_seo_prompts_registered(self):
        from prompts import registry
        import prompts.v1.seo  # noqa
        for name in ["seo_meta_tags", "seo_keyword_research", "seo_competitor_analysis", "seo_audit_recommendations"]:
            p = registry.get(name)
            assert p.model == "gemini-2.5-flash"

    def test_social_prompts_registered(self):
        from prompts import registry
        import prompts.v1.social  # noqa
        for name in ["social_audit", "social_suggestions", "social_competitors"]:
            p = registry.get(name)
            assert p.model == "gemini-2.5-flash"

    def test_gbp_prompts_registered(self):
        from prompts import registry
        import prompts.v1.gbp  # noqa
        for name in ["gbp_audit", "gbp_suggestions", "gbp_competitors"]:
            p = registry.get(name)
            assert p.model == "gemini-2.5-flash"

    def test_ai_visibility_prompt_registered(self):
        from prompts import registry
        import prompts.v1.ai_visibility  # noqa
        p = registry.get("ai_visibility_check")
        assert p.model == "gemini-2.5-pro"
        assert "ChatGPT" in p.metadata.get("assistants", [])

    def test_prompt_metadata(self):
        from prompts import registry
        import prompts.v1.ai_visibility  # noqa
        p = registry.get("ai_visibility_check")
        assert "assistants" in p.metadata
        assert len(p.metadata["assistants"]) == 4


class TestEvals:
    def test_eval_case_creation(self):
        from evals import EvalCase
        case = EvalCase(
            name="test_case",
            input={"x": 1},
            expected_keys=["result"],
            key_types={"result": int},
            key_ranges={"result": (0, 100)},
        )
        assert case.name == "test_case"
        assert case.input == {"x": 1}

    def test_eval_result(self):
        from evals import EvalResult
        r = EvalResult("test_prompt")
        r.total = 10
        r.passed = 8
        r.failed = 2
        assert r.pass_rate == 0.8
        summary = r.summary()
        assert "test_prompt" in summary
        assert "80.0%" in summary

    def test_eval_result_zero(self):
        from evals import EvalResult
        r = EvalResult("empty")
        assert r.pass_rate == 0.0
        assert r.avg_latency_ms == 0.0

    def test_has_min_items(self):
        from evals import has_min_items
        check = has_min_items("items", 3)
        ok, msg = check({"items": [1, 2, 3, 4]})
        assert ok
        ok, msg = check({"items": [1]})
        assert not ok

    def test_has_valid_score(self):
        from evals import has_valid_score
        check = has_valid_score("score")
        ok, msg = check({"score": 75})
        assert ok
        ok, msg = check({"score": 150})
        assert not ok
        ok, msg = check({"score": -5})
        assert not ok
        ok, msg = check({})
        assert not ok

    def test_has_non_empty_string(self):
        from evals import has_non_empty_string
        check = has_non_empty_string("name")
        ok, msg = check({"name": "John"})
        assert ok
        ok, msg = check({"name": ""})
        assert not ok
        ok, msg = check({})
        assert not ok

    @pytest.mark.asyncio
    async def test_run_eval_success(self):
        from evals import run_eval, EvalCase
        async def good_fn(**kwargs):
            return {"result": 50, "name": "test"}
        cases = [
            EvalCase(
                name="case1", input={},
                expected_keys=["result", "name"],
                key_types={"result": int},
                key_ranges={"result": (0, 100)},
            )
        ]
        result = await run_eval(good_fn, cases, "test_prompt")
        assert result.passed >= 1
        assert result.failed == 0

    @pytest.mark.asyncio
    async def test_run_eval_missing_key(self):
        from evals import run_eval, EvalCase
        async def bad_fn(**kwargs):
            return {"result": 50}
        cases = [
            EvalCase(name="case1", input={}, expected_keys=["result", "missing_key"])
        ]
        result = await run_eval(bad_fn, cases, "test_prompt")
        assert result.failed >= 1

    @pytest.mark.asyncio
    async def test_run_eval_wrong_type(self):
        from evals import run_eval, EvalCase
        async def bad_fn(**kwargs):
            return {"score": "not_a_number"}
        cases = [
            EvalCase(name="case1", input={}, key_types={"score": int})
        ]
        result = await run_eval(bad_fn, cases, "test_prompt")
        assert result.failed >= 1

    @pytest.mark.asyncio
    async def test_run_eval_out_of_range(self):
        from evals import run_eval, EvalCase
        async def bad_fn(**kwargs):
            return {"score": 999}
        cases = [
            EvalCase(name="case1", input={}, key_ranges={"score": (0, 100)})
        ]
        result = await run_eval(bad_fn, cases, "test_prompt")
        assert result.failed >= 1

    @pytest.mark.asyncio
    async def test_run_eval_exception(self):
        from evals import run_eval, EvalCase
        async def crash_fn(**kwargs):
            raise RuntimeError("boom")
        cases = [EvalCase(name="case1", input={})]
        result = await run_eval(crash_fn, cases, "test_prompt")
        assert result.errors >= 1

    @pytest.mark.asyncio
    async def test_run_eval_custom_assertion(self):
        from evals import run_eval, EvalCase
        async def fn(**kwargs):
            return {"items": [1, 2, 3]}
        from evals import has_min_items
        cases = [
            EvalCase(name="case1", input={}, assertions=[has_min_items("items", 2)])
        ]
        result = await run_eval(fn, cases, "test_prompt")
        assert result.passed >= 1


class TestAIMetrics:
    def test_ai_metrics_dataclass(self):
        from ai_metrics import AIMetrics
        m = AIMetrics(
            feature="seo_meta_tags", prompt_version="v1",
            model="gemini-2.5-flash", input_tokens=500,
            output_tokens=200, latency_ms=1200, success=True,
        )
        assert m.feature == "seo_meta_tags"
        assert m.input_tokens == 500
        assert m.output_tokens == 200
        assert m.success is True
        assert m.cost_usd > 0

    def test_ai_metrics_cost_calculation(self):
        from ai_metrics import AIMetrics
        m = AIMetrics(
            feature="test", prompt_version="v1",
            model="gemini-2.5-flash", input_tokens=1_000_000,
            output_tokens=1_000_000, latency_ms=1000, success=True,
        )
        # Flash: $0.15/1M input + $0.60/1M output = $0.75
        assert abs(m.cost_usd - 0.75) < 0.01

    def test_ai_metrics_pro_cost(self):
        from ai_metrics import AIMetrics
        m = AIMetrics(
            feature="test", prompt_version="v1",
            model="gemini-2.5-pro", input_tokens=1_000_000,
            output_tokens=1_000_000, latency_ms=1000, success=True,
        )
        # Pro: $1.25/1M input + $5.00/1M output = $6.25
        assert abs(m.cost_usd - 6.25) < 0.01

    def test_ai_metrics_error(self):
        from ai_metrics import AIMetrics
        m = AIMetrics(
            feature="test", prompt_version="v1",
            model="gemini-2.5-flash", input_tokens=0,
            output_tokens=0, latency_ms=500, success=False,
            error="API timeout",
        )
        assert m.success is False
        assert m.error == "API timeout"

    def test_timed_ai_call(self):
        from ai_metrics import TimedAICall, AIMetricsCollector
        collector = AIMetricsCollector(MagicMock())
        ctx = TimedAICall(collector, "test_feature", "v1", "gemini-2.5-flash")
        assert ctx.feature == "test_feature"
        assert ctx.model == "gemini-2.5-flash"

    def test_pricing_table(self):
        from ai_metrics import PRICING
        assert "gemini-2.5-flash" in PRICING
        assert "gemini-2.5-pro" in PRICING
        assert PRICING["gemini-2.5-flash"]["input"] == 0.15
        assert PRICING["gemini-2.5-pro"]["output"] == 5.00
