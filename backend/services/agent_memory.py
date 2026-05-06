"""Agent memory recall/write helpers for Phase 2."""
from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from services.pgvector import cosine, embed_text

_MEMORIES: list[dict[str, Any]] = []


async def remember(
    tenant_id: str,
    agent_kind: str,
    scope: str,
    scope_id: str,
    summary: str,
    payload: dict[str, Any] | None = None,
    importance: float = 1.0,
) -> dict[str, Any]:
    row = {
        "id": f"mem-{len(_MEMORIES) + 1}",
        "tenant_id": tenant_id,
        "agent_kind": agent_kind,
        "scope": scope,
        "scope_id": scope_id,
        "summary": summary,
        "payload": payload or {},
        "importance": float(importance),
        "embedding": embed_text(summary),
        "created_at": datetime.now(UTC).isoformat(),
    }
    _MEMORIES.append(row)
    return {key: value for key, value in row.items() if key != "embedding"}


async def recall(
    tenant_id: str,
    agent_kind: str,
    scope: str,
    scope_id: str,
    query: str,
    k: int = 5,
) -> list[dict[str, Any]]:
    query_embedding = embed_text(query)
    scored = []
    for row in _MEMORIES:
        if row["tenant_id"] != tenant_id or row["agent_kind"] != agent_kind:
            continue
        if row["scope"] != scope or row["scope_id"] != scope_id:
            continue
        similarity = cosine(query_embedding, row["embedding"])
        score = similarity * (1.0 + row["importance"] / 10.0)
        scored.append((score, similarity, row))
    scored.sort(key=lambda item: item[0], reverse=True)
    return [
        {
            "id": row["id"],
            "summary": row["summary"],
            "payload": row["payload"],
            "importance": row["importance"],
            "similarity": round(similarity, 6),
            "score": round(score, 6),
        }
        for score, similarity, row in scored[:k]
    ]


async def decay(factor: float = 0.98) -> int:
    for row in _MEMORIES:
        row["importance"] = max(0.1, float(row["importance"]) * factor)
    return len(_MEMORIES)


def clear_memory_store() -> None:
    _MEMORIES.clear()
