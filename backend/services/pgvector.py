"""Phase 2 pgvector helpers for document chunks and retrieval."""
from __future__ import annotations

import hashlib
import math
from dataclasses import dataclass
from typing import Any

_MEMORY_ROWS: list[dict[str, Any]] = []


@dataclass(frozen=True)
class RetrievedChunk:
    id: str
    text: str
    similarity: float
    metadata: dict[str, Any]

    def as_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "text": self.text,
            "similarity": self.similarity,
            "metadata": self.metadata,
        }


def embed_text(text: str, dimensions: int = 64) -> list[float]:
    """Deterministic local embedding fallback used when Vertex is unavailable."""
    vector = [0.0] * dimensions
    for token in text.lower().split():
        digest = hashlib.sha256(token.encode("utf-8")).digest()
        idx = int.from_bytes(digest[:2], "big") % dimensions
        vector[idx] += 1.0
    norm = math.sqrt(sum(v * v for v in vector)) or 1.0
    return [v / norm for v in vector]


def cosine(a: list[float], b: list[float]) -> float:
    return sum(x * y for x, y in zip(a, b))


async def write_chunk_embeddings(tenant_id: str, situation_id: str, doc_id: str, chunks: list[dict[str, Any] | str]) -> int:
    written = 0
    for index, chunk in enumerate(chunks):
        text = chunk if isinstance(chunk, str) else str(chunk.get("text", ""))
        metadata = {} if isinstance(chunk, str) else dict(chunk.get("metadata", {}))
        row = {
            "id": f"{tenant_id}:{situation_id}:{doc_id}:{index}",
            "tenant_id": tenant_id,
            "situation_id": situation_id,
            "doc_id": doc_id,
            "text": text,
            "metadata": metadata,
            "embedding": embed_text(text),
        }
        _MEMORY_ROWS.append(row)
        written += 1
    return written


async def retrieve(tenant_id: str, situation_id: str, query: str, k: int = 8, filters: dict[str, Any] | None = None) -> list[dict[str, Any]]:
    filters = filters or {}
    query_embedding = embed_text(query)
    candidates = []
    for row in _MEMORY_ROWS:
        if row["tenant_id"] != tenant_id or row["situation_id"] != situation_id:
            continue
        if any(row["metadata"].get(key) != value for key, value in filters.items()):
            continue
        candidates.append(RetrievedChunk(
            id=row["id"],
            text=row["text"],
            similarity=round(cosine(query_embedding, row["embedding"]), 6),
            metadata={**row["metadata"], "doc_id": row["doc_id"]},
        ))
    candidates.sort(key=lambda item: item.similarity, reverse=True)
    return [item.as_dict() for item in candidates[:k]]


def clear_memory_store() -> None:
    _MEMORY_ROWS.clear()
