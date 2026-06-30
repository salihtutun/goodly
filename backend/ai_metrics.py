"""AI metrics collector — tracks token usage, latency, and costs per feature.

Integrates with the existing llm_client.py ask_json function.
Stores metrics in MongoDB for dashboard visualization.
"""
import time
import logging
from datetime import datetime, timezone, timedelta
from dataclasses import dataclass, field
from typing import Optional

logger = logging.getLogger("ai_metrics")

# Gemini pricing per 1M tokens (as of 2025)
PRICING = {
    "gemini-2.5-flash": {"input": 0.15, "output": 0.60},
    "gemini-2.5-pro": {"input": 1.25, "output": 5.00},
}


@dataclass
class AIMetrics:
    """A single AI call metrics record."""
    feature: str
    prompt_version: str
    model: str
    input_tokens: int
    output_tokens: int
    latency_ms: float
    success: bool
    error: Optional[str] = None
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    @property
    def cost_usd(self) -> float:
        """Calculate cost in USD based on token pricing."""
        pricing = PRICING.get(self.model, {"input": 0.15, "output": 0.60})
        input_cost = (self.input_tokens / 1_000_000) * pricing["input"]
        output_cost = (self.output_tokens / 1_000_000) * pricing["output"]
        return round(input_cost + output_cost, 6)


class AIMetricsCollector:
    """Collects and stores AI call metrics."""

    def __init__(self, db):
        self.db = db

    async def record(self, metrics: AIMetrics):
        """Store a metrics record."""
        try:
            await self.db.ai_metrics.insert_one({
                "feature": metrics.feature,
                "prompt_version": metrics.prompt_version,
                "model": metrics.model,
                "input_tokens": metrics.input_tokens,
                "output_tokens": metrics.output_tokens,
                "latency_ms": metrics.latency_ms,
                "success": metrics.success,
                "error": metrics.error,
                "cost_usd": metrics.cost_usd,
                "timestamp": metrics.timestamp,
            })
        except Exception as e:
            logger.warning("Failed to record AI metrics: %s", e)

    async def summary(self, days: int = 7) -> list:
        """Get cost and usage summary for last N days."""
        cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
        pipeline = [
            {"$match": {"timestamp": {"$gte": cutoff}}},
            {"$group": {
                "_id": "$feature",
                "calls": {"$sum": 1},
                "total_input_tokens": {"$sum": "$input_tokens"},
                "total_output_tokens": {"$sum": "$output_tokens"},
                "avg_latency_ms": {"$avg": "$latency_ms"},
                "total_cost_usd": {"$sum": "$cost_usd"},
                "error_count": {"$sum": {"$cond": [{"$eq": ["$success", False]}, 1, 0]}},
            }},
            {"$sort": {"total_cost_usd": -1}},
        ]
        try:
            return await self.db.ai_metrics.aggregate(pipeline).to_list(100)
        except Exception as e:
            logger.warning("Failed to query AI metrics: %s", e)
            return []

    async def daily_cost(self, days: int = 30) -> list:
        """Get daily cost breakdown."""
        cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
        pipeline = [
            {"$match": {"timestamp": {"$gte": cutoff}}},
            {"$group": {
                "_id": {"$substr": ["$timestamp", 0, 10]},
                "calls": {"$sum": 1},
                "cost_usd": {"$sum": "$cost_usd"},
                "avg_latency_ms": {"$avg": "$latency_ms"},
            }},
            {"$sort": {"_id": 1}},
        ]
        try:
            return await self.db.ai_metrics.aggregate(pipeline).to_list(100)
        except Exception as e:
            logger.warning("Failed to query daily AI costs: %s", e)
            return []


# ---- Timing context manager for easy instrumentation ----

class TimedAICall:
    """Context manager that records timing and token usage for an AI call.

    Usage:
        async with TimedAICall(collector, "seo_meta_tags", "v1", "gemini-2.5-flash") as ctx:
            result = await ask_json(prompt)
            ctx.set_tokens(input_tokens=500, output_tokens=200)
    """

    def __init__(self, collector: AIMetricsCollector, feature: str,
                 prompt_version: str, model: str):
        self.collector = collector
        self.feature = feature
        self.prompt_version = prompt_version
        self.model = model
        self._start = 0.0
        self._input_tokens = 0
        self._output_tokens = 0
        self._success = True
        self._error = None

    async def __aenter__(self):
        self._start = time.time()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        latency_ms = (time.time() - self._start) * 1000
        if exc_type is not None:
            self._success = False
            self._error = str(exc_val)
        metrics = AIMetrics(
            feature=self.feature,
            prompt_version=self.prompt_version,
            model=self.model,
            input_tokens=self._input_tokens,
            output_tokens=self._output_tokens,
            latency_ms=latency_ms,
            success=self._success,
            error=self._error,
        )
        await self.collector.record(metrics)
        return False  # Don't suppress exceptions

    def set_tokens(self, input_tokens: int = 0, output_tokens: int = 0):
        self._input_tokens = input_tokens
        self._output_tokens = output_tokens
