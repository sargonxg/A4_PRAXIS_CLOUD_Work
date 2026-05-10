"""Google Grounded Search facade for the v5 research pipeline."""
from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class GroundedResult:
    text: str
    url: str
    snippet: str
    citations: list[str] = field(default_factory=list)
    tier: str = "T5"


def grounded_search(query: str, max_results: int = 10) -> list[GroundedResult]:
    """Run Vertex/Gemini grounded search when configured, else honest fallback."""
    if not query.strip():
        return []
    try:
        # Runtime implementation is intentionally isolated to provider config.
        from backend.ai.providers import call_grounded_search  # type: ignore
    except Exception:
        return [_fallback_result(query)]
    raw = call_grounded_search(query=query, max_results=max_results)
    return [
        GroundedResult(
            text=str(item.get("text") or item.get("title") or query),
            url=str(item.get("url") or ""),
            snippet=str(item.get("snippet") or item.get("summary") or ""),
            citations=[str(cite) for cite in item.get("citations", [])],
            tier="T5",
        )
        for item in raw[:max_results]
    ]


def _fallback_result(query: str) -> GroundedResult:
    return GroundedResult(
        text=f"Grounded search unavailable locally for: {query}",
        url="",
        snippet="Production uses Vertex AI Gemini grounding; local fallback does not fabricate sources.",
        citations=[],
        tier="T5",
    )
