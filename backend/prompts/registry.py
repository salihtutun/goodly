"""Prompt registry initialization — registers all v1 prompts.

Import this module to populate the global registry with all current prompts.
"""
from prompts import registry
from prompts.v1 import seo, social, gbp, ai_visibility  # noqa: F401 — registers prompts

# Re-export
__all__ = ["registry"]
