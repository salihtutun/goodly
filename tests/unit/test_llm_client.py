"""Unit tests for llm_client.py — Gemini LLM client utilities."""
import os
import json
import pytest
from unittest.mock import patch, MagicMock

from conftest import AsyncMock

from llm_client import (
    extract_json,
    get_client,
    _get_client,
    ask_json,
    DEFAULT_MODEL,
    PRO_MODEL,
    MAX_RETRIES,
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
# extract_json
# ---------------------------------------------------------------------------

def test_extract_json_valid():
    """extract_json parses a plain JSON object string."""
    result = extract_json('{"key": "value", "num": 42}')
    assert result == {"key": "value", "num": 42}


def test_extract_json_valid_list():
    """extract_json parses a JSON array string."""
    result = extract_json('[1, 2, 3]')
    assert result == [1, 2, 3]


def test_extract_json_with_fences():
    """extract_json strips ```json fences before parsing."""
    result = extract_json('```json\n{"a": 1}\n```')
    assert result == {"a": 1}


def test_extract_json_with_fences_no_lang():
    """extract_json strips ``` fences without language specifier."""
    result = extract_json('```\n{"b": 2}\n```')
    assert result == {"b": 2}


def test_extract_json_fallback_regex():
    """extract_json falls back to regex extraction when text has extra content."""
    result = extract_json('Here is the result: {"x": 10} and some more text.')
    assert result == {"x": 10}


def test_extract_json_fallback_regex_array():
    """extract_json regex fallback works for arrays embedded in text."""
    result = extract_json('Output: [1, 2, 3] done.')
    assert result == [1, 2, 3]


def test_extract_json_invalid_raises():
    """extract_json raises an exception for completely invalid input."""
    with pytest.raises(Exception):
        extract_json("This is not JSON at all, no braces anywhere.")


def test_extract_json_nested_object():
    """extract_json handles nested JSON objects."""
    result = extract_json('{"outer": {"inner": [1, 2, 3]}}')
    assert result == {"outer": {"inner": [1, 2, 3]}}


def test_extract_json_empty_object():
    """extract_json parses an empty JSON object."""
    result = extract_json("{}")
    assert result == {}


# ---------------------------------------------------------------------------
# get_client / _get_client
# ---------------------------------------------------------------------------

def test_get_client_requires_api_key():
    """_get_client raises RuntimeError when GEMINI_API_KEY is not set."""
    _clear_env("GEMINI_API_KEY")
    with pytest.raises(RuntimeError, match="GEMINI_API_KEY not configured"):
        _get_client()


def test_get_client_caches():
    """get_client returns the same instance on repeated calls (caching)."""
    _set_env(GEMINI_API_KEY="test-key")
    try:
        with patch("llm_client._get_client") as mock_get:
            mock_client = MagicMock()
            mock_get.return_value = mock_client

            # Reset module-level cache
            import llm_client
            llm_client._client = None

            c1 = get_client()
            c2 = get_client()
            assert c1 is c2
            assert mock_get.call_count == 1
    finally:
        _clear_env("GEMINI_API_KEY")


def test_get_client_import_error():
    """_get_client raises RuntimeError with install message on ImportError."""
    _set_env(GEMINI_API_KEY="test-key")
    try:
        import llm_client
        llm_client._client = None
        
        # Patch the import inside _get_client to raise ImportError
        with patch.dict('sys.modules', {'google.genai': None}):
            # Also need to make the import fail
            with patch('builtins.__import__', side_effect=ImportError("No module named google")):
                with pytest.raises(RuntimeError, match="google-genai package not installed"):
                    llm_client._get_client()
    finally:
        _clear_env("GEMINI_API_KEY")


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

def test_default_model_is_flash():
    """DEFAULT_MODEL is gemini-2.5-flash."""
    assert DEFAULT_MODEL == "gemini-2.5-flash"


def test_pro_model_is_pro():
    """PRO_MODEL is gemini-2.5-pro."""
    assert PRO_MODEL == "gemini-2.5-pro"


def test_max_retries_is_positive():
    """MAX_RETRIES is a positive integer."""
    assert MAX_RETRIES > 0
    assert isinstance(MAX_RETRIES, int)


# ---------------------------------------------------------------------------
# ask_json
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_ask_json_returns_parsed_dict():
    """ask_json sends a prompt and returns parsed JSON."""
    _set_env(GEMINI_API_KEY="test-key")
    try:
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.text = '{"result": "success"}'
        mock_client.models.generate_content.return_value = mock_response

        with patch("llm_client.get_client", return_value=mock_client):
            result = await ask_json("Test prompt")
            assert result == {"result": "success"}
    finally:
        _clear_env("GEMINI_API_KEY")


@pytest.mark.asyncio
async def test_ask_json_uses_custom_model():
    """ask_json passes the model parameter to generate_content."""
    _set_env(GEMINI_API_KEY="test-key")
    try:
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.text = '{"ok": true}'
        mock_client.models.generate_content.return_value = mock_response

        with patch("llm_client.get_client", return_value=mock_client):
            await ask_json("prompt", model="gemini-2.5-pro")
            call_kwargs = mock_client.models.generate_content.call_args[1]
            assert call_kwargs["model"] == "gemini-2.5-pro"
    finally:
        _clear_env("GEMINI_API_KEY")


@pytest.mark.asyncio
async def test_ask_json_retries_on_failure():
    """ask_json retries up to MAX_RETRIES times on transient failures."""
    _set_env(GEMINI_API_KEY="test-key")
    try:
        mock_client = MagicMock()
        mock_client.models.generate_content.side_effect = [
            Exception("Transient error"),
            Exception("Transient error"),
            MagicMock(text='{"final": true}'),
        ]

        with patch("llm_client.get_client", return_value=mock_client):
            with patch("asyncio.sleep", new=AsyncMock()):
                result = await ask_json("prompt")
                assert result == {"final": True}
                assert mock_client.models.generate_content.call_count == 3
    finally:
        _clear_env("GEMINI_API_KEY")


@pytest.mark.asyncio
async def test_ask_json_exhausts_retries():
    """ask_json raises RuntimeError after MAX_RETRIES failures."""
    _set_env(GEMINI_API_KEY="test-key")
    try:
        mock_client = MagicMock()
        mock_client.models.generate_content.side_effect = Exception("Persistent error")

        with patch("llm_client.get_client", return_value=mock_client):
            with patch("asyncio.sleep", new=AsyncMock()):
                with pytest.raises(RuntimeError, match="Gemini API error"):
                    await ask_json("prompt")
                assert mock_client.models.generate_content.call_count == MAX_RETRIES
    finally:
        _clear_env("GEMINI_API_KEY")


@pytest.mark.asyncio
async def test_ask_json_passes_temperature():
    """ask_json passes temperature in the config."""
    _set_env(GEMINI_API_KEY="test-key")
    try:
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.text = '{"t": 0.7}'
        mock_client.models.generate_content.return_value = mock_response

        with patch("llm_client.get_client", return_value=mock_client):
            await ask_json("prompt", temperature=0.7)
            call_kwargs = mock_client.models.generate_content.call_args[1]
            assert call_kwargs["config"]["temperature"] == 0.7
    finally:
        _clear_env("GEMINI_API_KEY")


@pytest.mark.asyncio
async def test_ask_json_passes_max_output_tokens():
    """ask_json passes max_output_tokens in the config."""
    _set_env(GEMINI_API_KEY="test-key")
    try:
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.text = '{"ok": true}'
        mock_client.models.generate_content.return_value = mock_response

        with patch("llm_client.get_client", return_value=mock_client):
            await ask_json("prompt", max_output_tokens=2048)
            call_kwargs = mock_client.models.generate_content.call_args[1]
            assert call_kwargs["config"]["max_output_tokens"] == 2048
    finally:
        _clear_env("GEMINI_API_KEY")


@pytest.mark.asyncio
async def test_ask_json_combines_system_message():
    """ask_json combines system_message and prompt in the contents."""
    _set_env(GEMINI_API_KEY="test-key")
    try:
        mock_client = MagicMock()
        mock_response = MagicMock()
        mock_response.text = '{"ok": true}'
        mock_client.models.generate_content.return_value = mock_response

        with patch("llm_client.get_client", return_value=mock_client):
            await ask_json("User prompt", system_message="Be helpful.")
            call_kwargs = mock_client.models.generate_content.call_args[1]
            assert "Be helpful." in call_kwargs["contents"]
            assert "User prompt" in call_kwargs["contents"]
    finally:
        _clear_env("GEMINI_API_KEY")


def test_get_client_success_path():
    """Cover line 34: genai.Client(api_key=api_key) success path."""
    os.environ["GEMINI_API_KEY"] = "test-key"
    import llm_client
    llm_client._client = None
    mock_c = MagicMock()
    with patch.dict("sys.modules", {"google": MagicMock(), "google.genai": MagicMock()}):
        import google.genai
        google.genai.Client = MagicMock(return_value=mock_c)
        result = llm_client._get_client()
        assert result is not None
    llm_client._client = None
