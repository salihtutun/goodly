"""Custom exceptions for AI service errors.

Provides granular error types so the API can return appropriate
HTTP status codes instead of generic 502 for all AI failures.
"""


class AIServiceError(Exception):
    """Base class for all AI service errors."""
    status_code: int = 502
    detail: str = "AI service error"


class AIServiceUnavailable(AIServiceError):
    """The AI provider (Gemini) is unreachable or returning 5xx."""
    status_code = 503
    detail = "AI service is temporarily unavailable. Please try again in a few minutes."


class AIInputInvalid(AIServiceError):
    """The input to the AI service was invalid or rejected."""
    status_code = 400
    detail = "The provided input was rejected by the AI service."


class AIRateLimited(AIServiceError):
    """The AI provider rate-limited the request."""
    status_code = 429
    detail = "AI service rate limit reached. Please wait and try again."


class AITimeout(AIServiceError):
    """The AI provider took too long to respond."""
    status_code = 504
    detail = "AI service timed out. Please try again."


class AIResponseInvalid(AIServiceError):
    """The AI returned a response that couldn't be parsed as valid JSON."""
    status_code = 502
    detail = "AI service returned an invalid response."


def classify_ai_error(error: Exception) -> AIServiceError:
    """Classify a raw exception into a specific AI error type.

    Examines the exception message and type to determine the best
    error category for the API response.
    """
    msg = str(error).lower()

    # JSON parse failure — check BEFORE "invalid" to avoid misclassification
    if isinstance(error, (ValueError, TypeError)):
        return AIResponseInvalid(str(error))

    # Rate limiting
    if any(kw in msg for kw in ("rate limit", "quota", "too many requests", "429", "resource_exhausted")):
        return AIRateLimited(str(error))

    # Timeout
    if any(kw in msg for kw in ("timeout", "timed out", "deadline exceeded", "504")):
        return AITimeout(str(error))

    # Invalid input
    if any(kw in msg for kw in ("invalid", "bad request", "400", "unsafe", "blocked", "safety")):
        return AIInputInvalid(str(error))

    # Unavailable
    if any(kw in msg for kw in ("unavailable", "503", "500", "internal", "connection", "refused", "dns")):
        return AIServiceUnavailable(str(error))

    # Default
    return AIServiceError(str(error))
