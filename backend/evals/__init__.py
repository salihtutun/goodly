"""AI evaluation framework for Goodly prompts.

Measures prompt quality with automated test cases.
Run with: python -m evals.runner
"""
from dataclasses import dataclass, field
from typing import List, Dict, Callable, Any, Optional
import json
import time
import logging

logger = logging.getLogger("evals")


@dataclass
class EvalCase:
    """A single evaluation test case."""
    name: str
    input: Dict[str, Any]
    expected_keys: List[str] = field(default_factory=list)
    assertions: List[Callable] = field(default_factory=list)
    # Optional: expected output shape validators
    key_types: Dict[str, type] = field(default_factory=dict)
    key_ranges: Dict[str, tuple] = field(default_factory=dict)  # (min, max) for numeric keys


class EvalResult:
    """Results from running a set of eval cases."""

    def __init__(self, prompt_name: str):
        self.prompt_name = prompt_name
        self.total = 0
        self.passed = 0
        self.failed = 0
        self.errors = 0
        self.failures: List[str] = []
        self.latency_ms: List[float] = []

    @property
    def pass_rate(self) -> float:
        if self.total == 0:
            return 0.0
        return self.passed / self.total

    @property
    def avg_latency_ms(self) -> float:
        if not self.latency_ms:
            return 0.0
        return sum(self.latency_ms) / len(self.latency_ms)

    def summary(self) -> str:
        lines = [
            f"Eval: {self.prompt_name}",
            f"  Total: {self.total}, Passed: {self.passed}, Failed: {self.failed}, Errors: {self.errors}",
            f"  Pass rate: {self.pass_rate:.1%}",
            f"  Avg latency: {self.avg_latency_ms:.0f}ms",
        ]
        if self.failures:
            lines.append("  Failures:")
            for f in self.failures[:10]:
                lines.append(f"    - {f}")
        return "\n".join(lines)


async def run_eval(
    prompt_fn: Callable,
    cases: List[EvalCase],
    prompt_name: str = "unknown",
) -> EvalResult:
    """Run a set of eval cases against a prompt function.

    Args:
        prompt_fn: Async function that takes input dict and returns output dict.
        cases: List of EvalCase to run.
        prompt_name: Name for reporting.

    Returns:
        EvalResult with pass/fail counts and details.
    """
    result = EvalResult(prompt_name)

    for case in cases:
        result.total += 1
        try:
            start = time.time()
            output = await prompt_fn(**case.input)
            elapsed = (time.time() - start) * 1000
            result.latency_ms.append(elapsed)

            case_passed = True

            # Check expected keys
            for key in case.expected_keys:
                if key not in output:
                    result.failed += 1
                    result.failures.append(f"{case.name}: missing key '{key}'")
                    case_passed = False

            # Check key types
            for key, expected_type in case.key_types.items():
                if key in output and not isinstance(output[key], expected_type):
                    result.failed += 1
                    result.failures.append(
                        f"{case.name}: key '{key}' expected {expected_type.__name__}, got {type(output[key]).__name__}"
                    )
                    case_passed = False

            # Check key ranges
            for key, (lo, hi) in case.key_ranges.items():
                if key in output:
                    val = output[key]
                    if isinstance(val, (int, float)) and (val < lo or val > hi):
                        result.failed += 1
                        result.failures.append(
                            f"{case.name}: key '{key}' = {val}, expected [{lo}, {hi}]"
                        )
                        case_passed = False

            # Run custom assertions
            for assertion in case.assertions:
                try:
                    ok, msg = assertion(output)
                    if not ok:
                        result.failed += 1
                        result.failures.append(f"{case.name}: {msg}")
                        case_passed = False
                except Exception as e:
                    result.errors += 1
                    result.failures.append(f"{case.name}: assertion error: {e}")
                    case_passed = False

            if case_passed:
                result.passed += 1

        except Exception as e:
            result.errors += 1
            result.failures.append(f"{case.name}: execution error: {e}")

    return result


# ---- Built-in assertion helpers ----

def has_min_items(key: str, min_count: int):
    """Assert that a list key has at least min_count items."""
    def check(output):
        items = output.get(key, [])
        if len(items) < min_count:
            return False, f"key '{key}' has {len(items)} items, expected >= {min_count}"
        return True, ""
    return check


def has_valid_score(key: str = "overall_score"):
    """Assert that a score key is between 0 and 100."""
    def check(output):
        score = output.get(key)
        if score is None:
            return False, f"key '{key}' is missing"
        if not isinstance(score, (int, float)):
            return False, f"key '{key}' is not numeric: {type(score).__name__}"
        if score < 0 or score > 100:
            return False, f"key '{key}' = {score}, expected 0-100"
        return True, ""
    return check


def has_non_empty_string(key: str):
    """Assert that a string key is non-empty."""
    def check(output):
        val = output.get(key, "")
        if not val or not isinstance(val, str):
            return False, f"key '{key}' is empty or not a string"
        return True, ""
    return check
