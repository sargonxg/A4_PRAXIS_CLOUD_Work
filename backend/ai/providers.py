"""Central model constants for PRAXIS backend AI calls.

The frontend has the canonical JSON matrix at src/lib/ai/MODEL_MATRIX.json.
This Python module mirrors the current production-safe rows so backend Genkit,
google-genai, and Agent Runtime code do not hardcode model IDs in call sites.
"""

from __future__ import annotations

MODEL_FLASH = "gemini-2.5-flash"
MODEL_PRO = "gemini-2.5-pro"
MODEL_EMBED = "text-embedding-005"

COGNEE_VERTEX_PROVIDER = "vertex_ai"
COGNEE_LLM_PROVIDER = "vertex_ai"
COGNEE_LLM_API_KEY = "vertex-adc"
COGNEE_MODEL_PRO = "vertex_ai/gemini-3.1-pro-preview"
COGNEE_MODEL_FLASH = "vertex_ai/gemini-3-flash"
COGNEE_EMBED_MODEL = "vertex_ai/text-embedding-005"
COGNEE_EMBEDDING_MODEL = "vertex_ai/text-embedding-005"
COGNEE_EMBED_DIMENSIONS = 768
COGNEE_EMBEDDING_DIMENSIONS = 768

GENKIT_MODEL_FLASH = f"googleai/{MODEL_FLASH}"
GENKIT_MODEL_PRO = f"googleai/{MODEL_PRO}"

TASK_MODEL_MAP = {
    "balanced": MODEL_FLASH,
    "cheap_classify": MODEL_FLASH,
    "complex_reasoning": MODEL_PRO,
    "long_context": MODEL_PRO,
    "writing_quality": MODEL_PRO,
    "embeddings_text": MODEL_EMBED,
    "embeddings_long": MODEL_EMBED,
}

GENKIT_CATEGORY_MODEL_MAP = {
    "fast_analysis": GENKIT_MODEL_FLASH,
    "deep_analysis": GENKIT_MODEL_PRO,
    "creative_drafting": GENKIT_MODEL_PRO,
    "research": GENKIT_MODEL_FLASH,
}


def model_for_task(task_kind: str) -> str:
    """Return the backend model ID for a task kind."""
    return TASK_MODEL_MAP.get(task_kind, MODEL_FLASH)


def genkit_model_for_category(category: str) -> str:
    """Return a Genkit googleai/* model ID for a user preference category."""
    return GENKIT_CATEGORY_MODEL_MAP.get(category, GENKIT_MODEL_FLASH)
