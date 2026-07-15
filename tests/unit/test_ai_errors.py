"""Unit tests for ai_errors.py — AI error classification."""
import pytest
from ai_errors import (
    AIServiceError,
    AIServiceUnavailable,
    AIInputInvalid,
    AIRateLimited,
    AITimeout,
    AIResponseInvalid,
    classify_ai_error,
)


class TestAIErrors:
    def test_base_error_defaults(self):
        err = AIServiceError("test")
        assert err.status_code == 502
        assert "AI service error" in err.detail

    def test_unavailable_status(self):
        err = AIServiceUnavailable("down")
        assert err.status_code == 503

    def test_input_invalid_status(self):
        err = AIInputInvalid("bad input")
        assert err.status_code == 400

    def test_rate_limited_status(self):
        err = AIRateLimited("quota")
        assert err.status_code == 429

    def test_timeout_status(self):
        err = AITimeout("slow")
        assert err.status_code == 504

    def test_response_invalid_status(self):
        err = AIResponseInvalid("bad json")
        assert err.status_code == 502

    def test_inheritance(self):
        assert issubclass(AIServiceUnavailable, AIServiceError)
        assert issubclass(AIRateLimited, AIServiceError)
        assert issubclass(AITimeout, AIServiceError)
        assert issubclass(AIInputInvalid, AIServiceError)
        assert issubclass(AIResponseInvalid, AIServiceError)


class TestClassifyAIError:
    def test_classify_rate_limit(self):
        err = classify_ai_error(Exception("rate limit exceeded"))
        assert isinstance(err, AIRateLimited)

    def test_classify_quota(self):
        err = classify_ai_error(Exception("quota exceeded"))
        assert isinstance(err, AIRateLimited)

    def test_classify_429(self):
        err = classify_ai_error(Exception("HTTP 429"))
        assert isinstance(err, AIRateLimited)

    def test_classify_resource_exhausted(self):
        err = classify_ai_error(Exception("resource_exhausted"))
        assert isinstance(err, AIRateLimited)

    def test_classify_timeout(self):
        err = classify_ai_error(Exception("request timed out"))
        assert isinstance(err, AITimeout)

    def test_classify_deadline_exceeded(self):
        err = classify_ai_error(Exception("deadline exceeded"))
        assert isinstance(err, AITimeout)

    def test_classify_invalid_input(self):
        err = classify_ai_error(Exception("invalid request"))
        assert isinstance(err, AIInputInvalid)

    def test_classify_safety_blocked(self):
        err = classify_ai_error(Exception("content blocked by safety"))
        assert isinstance(err, AIInputInvalid)

    def test_classify_unavailable(self):
        err = classify_ai_error(Exception("service unavailable"))
        assert isinstance(err, AIServiceUnavailable)

    def test_classify_connection_refused(self):
        err = classify_ai_error(Exception("connection refused"))
        assert isinstance(err, AIServiceUnavailable)

    def test_classify_dns_error(self):
        err = classify_ai_error(Exception("dns resolution failed"))
        assert isinstance(err, AIServiceUnavailable)

    def test_classify_default(self):
        err = classify_ai_error(Exception("something weird happened"))
        assert isinstance(err, AIServiceError)
        assert err.status_code == 502

    def test_classify_value_error_json(self):
        err = classify_ai_error(ValueError("invalid json"))
        assert isinstance(err, AIResponseInvalid)
