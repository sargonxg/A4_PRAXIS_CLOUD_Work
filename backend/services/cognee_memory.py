"""Cognee memory adapter for PRAXIS.

This is the only backend module allowed to import Cognee. The adapter is
disabled by default and returns stable empty shapes until the isolated Cognee
service, database, and tenancy checks are live.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from config import get_settings

SUPPORTED_MODES = {"postgres-kuzu", "neo4j", "postgres-only-vector", "disabled"}
COGNEE_DATASET_SEPARATOR = "__"


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


async def recall(*, scope: MemoryScope, query: str, limit: int = 10) -> list[MemoryHit]:
    _ = (scope, query, limit)
    if not is_enabled():
        return []
    _load_cognee()
    raise NotImplementedError("Live Cognee recall is owned by the isolated praxis-cognee service")


async def forget(*, scope: MemoryScope, memory_id: str) -> dict[str, Any]:
    if not is_enabled():
        return {"ok": False, "status": "disabled", "dataset": scope.dataset, "memoryId": memory_id}
    _load_cognee()
    raise NotImplementedError("Live Cognee forget is owned by the isolated praxis-cognee service")
