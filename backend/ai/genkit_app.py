"""PRAXIS Genkit AI application — Gemini-only, user-key-aware.

Platform-level instance uses GOOGLE_API_KEY or Vertex AI ADC.
get_ai_for_user() creates a user-specific instance with their own keys.
"""
from __future__ import annotations


def _build_genkit(google_key: str | None = None):
    """Build a Genkit instance with the given provider configurations."""
    try:
        from genkit import Genkit
        from genkit_google_genai import GoogleGenAI

        plugins = []

        if google_key:
            plugins.append(GoogleGenAI(api_key=google_key))
        else:
            plugins.append(GoogleGenAI())  # Falls back to GOOGLE_API_KEY env or Vertex AI ADC

        return Genkit(plugins=plugins)
    except ImportError:
        # Genkit not installed — return None, callers fall back to raw google-genai
        return None


# Platform-level Genkit instance (uses platform API keys / Vertex AI ADC)
try:
    ai = _build_genkit()
except Exception:
    ai = None


def get_ai_for_user(user_settings: dict):
    """Create a Genkit instance with user's own API keys if provided.

    Falls back to platform keys for any provider the user hasn't configured.
    Returns None if Genkit is not installed.
    """
    api_keys = user_settings.get("api_keys", {})
    return _build_genkit(
        google_key=api_keys.get("google_ai_key") or None,
    )


def get_model_for_category(user_settings: dict, category: str) -> str:
    """Return the preferred model ID for a given tool category.

    Categories: fast_analysis, deep_analysis, creative_drafting, research
    """
    prefs = user_settings.get("model_preferences", {})
    defaults = {
        "fast_analysis": "googleai/gemini-2.5-flash",
        "deep_analysis": "googleai/gemini-2.5-pro",
        "creative_drafting": "googleai/gemini-2.5-pro",
        "research": "googleai/gemini-2.5-flash",
    }
    return prefs.get(category, defaults.get(category, "googleai/gemini-2.5-flash"))
