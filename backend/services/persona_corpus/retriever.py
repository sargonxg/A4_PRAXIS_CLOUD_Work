from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class CorpusChunk:
    id: str
    namespace: str
    title: str
    citation: str
    text: str
    similarity: float


def retrieve_persona_corpus(persona_id: str, query: str, top_k: int = 5) -> list[CorpusChunk]:
    """Deterministic local fallback until pgvector/Vector Search is wired in staging.

    The production contract is intentionally the same shape the Agent Engine
    subagents expect: a persona namespace plus ranked chunks with citations.
    """
    namespace = f"persona:canonical:{persona_id}:v1.0.0" if not persona_id.startswith("custom:") else f"persona:{persona_id}:v0.1.0"
    limit = max(1, min(top_k, 5))
    base = query.strip() or "boardroom deliberation"
    return [
        CorpusChunk(
            id=f"{persona_id}-chunk-{index + 1}",
            namespace=namespace,
            title=f"{persona_id} corpus note {index + 1}",
            citation=f"Pack 16 corpus manifest fallback for {persona_id}",
            text=f"Relevant context for {base}: preserve citation discipline, surface uncertainty, and keep synthesized claims advisory.",
            similarity=round(0.82 - index * 0.04, 2),
        )
        for index in range(limit)
    ]
