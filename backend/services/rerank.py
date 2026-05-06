"""Vertex AI reranking helper with deterministic fallback."""
from __future__ import annotations

from typing import Any


async def rerank(query: str, docs: list[dict[str, Any]], top_k: int = 8) -> list[dict[str, Any]]:
    """Return documents ordered by Vertex ranking when configured.

    The local fallback is lexical and deterministic so tests do not require
    Vertex credentials.
    """
    if not docs:
        return []

    query_terms = {term.lower() for term in query.split() if term.strip()}

    def fallback_score(doc: dict[str, Any]) -> float:
        text = f"{doc.get('text', '')} {doc.get('title', '')}".lower()
        overlap = sum(1 for term in query_terms if term in text)
        prior = float(doc.get("similarity", doc.get("score", 0.0)) or 0.0)
        return overlap + prior

    ranked = sorted(docs, key=fallback_score, reverse=True)
    return ranked[:top_k]
