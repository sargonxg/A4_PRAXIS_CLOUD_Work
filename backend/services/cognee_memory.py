"""Cognee memory adapter for PRAXIS.

This is the only backend module allowed to import Cognee. The adapter is
disabled by default and returns stable empty shapes until the isolated Cognee
service, database, and tenancy checks are live.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import StrEnum
from typing import Any

from config import get_settings

SUPPORTED_MODES = {"postgres-kuzu", "neo4j", "postgres-only-vector", "disabled"}
COGNEE_DATASET_SEPARATOR = "__"
ACO_ONTOLOGY_FILE = "praxis_aco.owl"


class CogneeSearchMode(StrEnum):
    NATURAL_LANGUAGE = "NATURAL_LANGUAGE"
    GRAPH_COMPLETION = "GRAPH_COMPLETION"
    CODE = "CODE"
    INSIGHTS = "INSIGHTS"
    CHUNKS = "CHUNKS"
    SUMMARIES = "SUMMARIES"


@dataclass(frozen=True)
class MemoryScope:
    owner_uid: str
    case_id: str
    session_id: str | None = None

    @property
    def dataset(self) -> str:
        if not self.owner_uid or not self.case_id:
            raise ValueError("Cognee memory scope requires owner_uid and case_id")
        return f"{self.owner_uid}{COGNEE_DATASET_SEPARATOR}{self.case_id}"


@dataclass(frozen=True)
class MemoryHit:
    id: str
    text: str
    score: float
    source_id: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class MemoryHealth:
    enabled: bool
    mode: str
    provider: str
    embedding_model: str
    embedding_dimensions: int
    ready: bool
    reason: str | None = None


@dataclass(frozen=True)
class SearchAudit:
    mode: CogneeSearchMode
    save_interaction: bool = True
    surface_key: str | None = None


def is_enabled() -> bool:
    settings = get_settings()
    return settings.cognee_enabled and settings.cognee_mode != "disabled"


def _validate_runtime_config() -> None:
    settings = get_settings()
    if settings.cognee_mode not in SUPPORTED_MODES:
        raise RuntimeError(f"Unsupported COGNEE_MODE={settings.cognee_mode}")
    if settings.cognee_llm_provider != "vertex_ai":
        raise RuntimeError("Cognee memory must use vertex_ai provider")
    if settings.cognee_llm_api_key != "vertex-adc":
        raise RuntimeError("Cognee memory must use the vertex-adc sentinel, not a raw provider key")
    if settings.cognee_embedding_dimensions != 768:
        raise RuntimeError("Cognee memory embeddings must be 768-dimensional")


def _load_cognee() -> Any:
    _validate_runtime_config()
    try:
        import cognee  # type: ignore[import-not-found]
    except ImportError as exc:
        raise RuntimeError("Cognee is enabled but the cognee package is not installed") from exc
    return cognee


def health() -> MemoryHealth:
    settings = get_settings()
    if not is_enabled():
        return MemoryHealth(
            enabled=False,
            mode=settings.cognee_mode,
            provider=settings.cognee_llm_provider,
            embedding_model=settings.cognee_embedding_model,
            embedding_dimensions=settings.cognee_embedding_dimensions,
            ready=False,
            reason="disabled",
        )
    try:
        _validate_runtime_config()
        _load_cognee()
    except RuntimeError as exc:
        return MemoryHealth(
            enabled=True,
            mode=settings.cognee_mode,
            provider=settings.cognee_llm_provider,
            embedding_model=settings.cognee_embedding_model,
            embedding_dimensions=settings.cognee_embedding_dimensions,
            ready=False,
            reason=str(exc),
        )
    return MemoryHealth(
        enabled=True,
        mode=settings.cognee_mode,
        provider=settings.cognee_llm_provider,
        embedding_model=settings.cognee_embedding_model,
        embedding_dimensions=settings.cognee_embedding_dimensions,
        ready=True,
    )


async def remember(
    *,
    scope: MemoryScope,
    content: str,
    source_id: str | None = None,
    metadata: dict[str, Any] | None = None,
    run_cognify: bool = True,
) -> dict[str, Any]:
    """Store content in Cognee memory.

    Disabled mode is a no-op. Enabled mode is intentionally not implemented in
    the monolith yet; the next pass wires it through the isolated Cognee service.
    """
    _ = (content, metadata, run_cognify)
    if not is_enabled():
        return {"ok": False, "status": "disabled", "dataset": scope.dataset, "sourceId": source_id}
    _load_cognee()
    raise NotImplementedError("Live Cognee remember is owned by the isolated praxis-cognee service")


async def add(
    *,
    scope: MemoryScope,
    content: bytes | str,
    source_id: str,
    node_set: list[str] | None = None,
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Add a source document to the tenant/case Cognee dataset."""
    _ = (content, metadata)
    node_set = node_set or [f"case_{scope.case_id}"]
    if not is_enabled():
        return {
            "ok": False,
            "status": "queued_disabled",
            "dataset": scope.dataset,
            "sourceId": source_id,
            "nodeSet": node_set,
        }
    _load_cognee()
    raise NotImplementedError("Live Cognee add is owned by the isolated praxis-cognee service")


async def cognify(
    *,
    scope: MemoryScope,
    content: str,
    source_id: str,
    metadata: dict[str, Any] | None = None,
    ontology_file_path: str = ACO_ONTOLOGY_FILE,
    temporal_cognify: bool = True,
) -> dict[str, Any]:
    """Run ontology-grounded extraction for a source payload.

    The disabled path returns a queued shape so callers can keep their UX honest
    without pretending extraction completed.
    """
    if not is_enabled():
        return {
            "ok": False,
            "status": "queued_disabled",
            "dataset": scope.dataset,
            "sourceId": source_id,
            "ontologyFilePath": ontology_file_path,
            "temporalCognify": temporal_cognify,
        }
    _ = (content, metadata)
    _load_cognee()
    raise NotImplementedError("Live Cognee cognify is owned by the isolated praxis-cognee service")


async def memify(
    *,
    scope: MemoryScope,
    thread_id: str,
    turns: list[dict[str, Any]],
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Persist a closed research thread as long-lived memory coverage."""
    if not is_enabled():
        return {"ok": False, "status": "queued_disabled", "dataset": scope.dataset, "threadId": thread_id}
    _ = (turns, metadata)
    _load_cognee()
    raise NotImplementedError("Live Cognee memify is owned by the isolated praxis-cognee service")


async def search(
    *,
    scope: MemoryScope,
    query: str,
    mode: CogneeSearchMode = CogneeSearchMode.NATURAL_LANGUAGE,
    limit: int = 10,
    session_id: str | None = None,
    source_kind: str | None = None,
    positive: bool | None = None,
    signal: str | None = None,
    node_set: list[str] | None = None,
    audit: SearchAudit | None = None,
) -> list[MemoryHit]:
    """Route Cognee search modes with save_interaction=True by default."""
    interaction = audit or SearchAudit(mode=mode)
    if not interaction.save_interaction:
        raise ValueError("Cognee search calls in PRAXIS must use save_interaction=True")
    if not is_enabled():
        return []
    _ = (scope, query, limit, session_id, source_kind, positive, signal, node_set)
    _load_cognee()
    raise NotImplementedError("Live Cognee search is owned by the isolated praxis-cognee service")


async def recall(*, scope: MemoryScope, query: str, limit: int = 10) -> list[MemoryHit]:
    return await search(scope=scope, query=query, limit=limit, mode=CogneeSearchMode.NATURAL_LANGUAGE)


async def recall_provenance(*, scope: MemoryScope, node_name: str, top_k: int = 5) -> list[MemoryHit]:
    return await search(
        scope=scope,
        query=node_name,
        limit=top_k,
        mode=CogneeSearchMode.GRAPH_COMPLETION,
        audit=SearchAudit(mode=CogneeSearchMode.GRAPH_COMPLETION, surface_key="graph.provenance"),
    )


async def forget(*, scope: MemoryScope, memory_id: str) -> dict[str, Any]:
    if not is_enabled():
        return {"ok": False, "status": "disabled", "dataset": scope.dataset, "memoryId": memory_id}
    _load_cognee()
    raise NotImplementedError("Live Cognee forget is owned by the isolated praxis-cognee service")
