from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class CorpusIngestPlan:
    namespace: str
    source_count: int
    chunk_table: str = "persona_corpus_chunks"
    embedding_task_kind: str = "embeddings_text"


def plan_persona_corpus_ingest(persona_id: str, source_count: int) -> CorpusIngestPlan:
    if source_count < 1:
        raise ValueError("persona corpus ingest requires at least one source")
    if source_count > 50:
        raise ValueError("persona corpus ingest is capped at 50 sources per persona")
    namespace = f"persona:canonical:{persona_id}:v1.0.0" if not persona_id.startswith("custom:") else f"persona:{persona_id}:v0.1.0"
    return CorpusIngestPlan(namespace=namespace, source_count=source_count)
