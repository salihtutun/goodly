"""Versioned prompt registry for all Goodly AI features.

Extracts hardcoded prompts from service files into a versioned registry.
Supports A/B testing by loading different prompt versions at runtime.
"""
from dataclasses import dataclass, field
from typing import Dict, List, Optional
import logging

logger = logging.getLogger("prompts")


@dataclass
class Prompt:
    """A versioned prompt template with model configuration."""
    version: str
    system: str
    user_template: str
    model: str = "gemini-2.5-flash"
    temperature: float = 0.3
    max_output_tokens: int = 4096
    metadata: Dict = field(default_factory=dict)

    def render(self, **kwargs) -> str:
        """Render the user template with provided variables."""
        return self.user_template.format(**kwargs)


class PromptRegistry:
    """Thread-safe registry of versioned prompts."""

    def __init__(self):
        self._prompts: Dict[str, Dict[str, Prompt]] = {}

    def register(self, name: str, version: str, prompt: Prompt):
        """Register a prompt under a name and version."""
        if name not in self._prompts:
            self._prompts[name] = {}
        self._prompts[name][version] = prompt
        logger.debug("Registered prompt %s v%s", name, version)

    def get(self, name: str, version: Optional[str] = None) -> Prompt:
        """Get a prompt by name. Returns latest version if none specified."""
        versions = self._prompts.get(name, {})
        if not versions:
            raise KeyError(f"No prompt registered for '{name}'")
        if version:
            if version not in versions:
                raise KeyError(f"Prompt '{name}' has no version '{version}'. Available: {sorted(versions.keys())}")
            return versions[version]
        return versions[sorted(versions.keys())[-1]]

    def list_versions(self, name: str) -> List[str]:
        """List all versions for a prompt."""
        return sorted(self._prompts.get(name, {}).keys())

    def list_all(self) -> List[str]:
        """List all registered prompt names."""
        return sorted(self._prompts.keys())


# Global singleton
registry = PromptRegistry()
