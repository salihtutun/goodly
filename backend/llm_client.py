"""Shared Google Gemini LLM client for Goodly AI services.

Uses the Google AI Python SDK (google-genai) to call Gemini models.
Supports Gemini 2.5 Flash (fast, cheap) and Gemini 2.5 Pro (reasoning-heavy).
All AI service modules import from here.
"""
import os
import json
import re
import asyncio
import logging

from ai_errors import classify_ai_error, AIServiceError

logger = logging.getLogger("llm_client")

# Default model — fast and cost-effective for structured JSON tasks
DEFAULT_MODEL = "gemini-2.5-flash"
# For complex reasoning tasks (competitor analysis, visibility simulation).
# gemini-2.5-pro is closed to new API keys ("no longer available to new users")
# — use 3.5 Flash which still has strong reasoning on the current key.
PRO_MODEL = "gemini-3.5-flash"

# Retry configuration
MAX_RETRIES = 3
BASE_DELAY = 1.0  # seconds
TIMEOUT_SECONDS = 90  # per-request timeout


def _get_client():
    """Lazy-init the Gemini client. Cached after first call."""
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY not configured — set it in .env or Cloud Run env vars")
    try:
        from google import genai
        return genai.Client(api_key=api_key)
    except ImportError:
        raise RuntimeError(
            "google-genai package not installed. Run: pip install google-genai"
        )


# Module-level cache for the client
_client = None


def get_client():
    global _client
    if _client is None:
        _client = _get_client()
    return _client


def extract_json(text: str):
    """Strip code fences and return parsed JSON. Falls back to regex match."""
    cleaned = text.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    try:
        return json.loads(cleaned)
    except Exception:
        match = re.search(r"(\{.*\}|\[.*\])", cleaned, re.DOTALL)
        if match:
            return json.loads(match.group(1))
        raise


async def ask_json(
    prompt: str,
    *,
    system_message: str = "You are an expert assistant. Always respond with valid JSON only — no markdown fences, no commentary.",
    model: str = DEFAULT_MODEL,
    temperature: float = 0.3,
    max_output_tokens: int = 4096,
):
    """Send a prompt to Gemini and parse the response as JSON.

    Includes exponential backoff retry for transient failures.
    Raises AIServiceError subclasses for granular error handling.

    Args:
        prompt: The user prompt to send.
        system_message: System instruction for the model.
        model: Model name (gemini-2.5-flash or gemini-2.5-pro).
        temperature: 0.0-1.0, lower = more deterministic.
        max_output_tokens: Max tokens in response.

    Returns:
        Parsed JSON dict or list.

    Raises:
        AIServiceUnavailable: Gemini API is down.
        AIRateLimited: Gemini rate limit hit.
        AITimeout: Gemini took too long.
        AIInputInvalid: Input rejected by safety filters.
        AIResponseInvalid: Response couldn't be parsed as JSON.
        AIServiceError: Other AI failures.
    """
    client = get_client()

    # Combine system message and prompt
    full_prompt = f"{system_message}\n\n{prompt}"

    last_error = None
    for attempt in range(MAX_RETRIES):
        try:
            # generate_content is synchronous — run it off the event loop and
            # enforce the per-request timeout (otherwise a slow Gemini call
            # blocks every other request on this worker).
            response = await asyncio.wait_for(
                asyncio.to_thread(
                    client.models.generate_content,
                    model=model,
                    contents=full_prompt,
                    config={
                        "temperature": temperature,
                        "max_output_tokens": max_output_tokens,
                    },
                ),
                timeout=TIMEOUT_SECONDS,
            )
            text = response.text
            if text is None:
                # Safety-blocked or empty responses have no text
                raise ValueError("Gemini returned an empty response (possibly safety-blocked)")

            # Log token usage
            if hasattr(response, 'usage_metadata'):
                usage = response.usage_metadata
                logger.info(
                    "Gemini API: model=%s tokens_in=%s tokens_out=%s",
                    model,
                    getattr(usage, 'prompt_token_count', '?'),
                    getattr(usage, 'candidates_token_count', '?'),
                )

            return extract_json(text)

        except AIServiceError:
            raise  # Don't retry on classified errors

        except Exception as e:
            last_error = e
            # Classify the error for better logging
            classified = classify_ai_error(e)
            if attempt < MAX_RETRIES - 1:
                delay = BASE_DELAY * (2 ** attempt)
                logger.warning(
                    "Gemini API attempt %d/%d failed: %s (%s). Retrying in %.1fs...",
                    attempt + 1, MAX_RETRIES, classified.__class__.__name__, e, delay,
                )
                await asyncio.sleep(delay)
            else:
                logger.exception("Gemini API failed after %d attempts", MAX_RETRIES)

    # After all retries exhausted, raise the classified error
    raise classify_ai_error(last_error) if last_error else AIServiceError("Unknown AI error")
