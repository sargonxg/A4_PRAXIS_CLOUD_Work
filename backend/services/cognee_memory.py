"""Cognee memory adapter for PRAXIS.

This is the only backend module allowed to import Cognee. The adapter is
disabled by default and returns stable empty shapes until the isolated Cognee
service, database, and tenancy checks are live.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from enum import StrEnum
import logging
import time
from typing import Any

import httpx

from config import get_settings
from services.metrics import record_cognee_call
from services.ontology_system import (
    BASE_ONTOLOGY_FILE,
    data_point_class_names,
    data_point_classes_for_case_types,
    ontology_resolver_descriptor,
    ontology_stack_for_case_types,
)

SUPPORTED_MODES = {"postgres-kuzu", "neo4j", "postgres-only-vector", "disabled"}
COGNEE_DATASET_SEPARATOR = "__"
ACO_ONTOLOGY_FILE = BASE_ONTOLOGY_FILE
logger = logging.getLogger("praxis.cognee")


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
        return dataset_for(self.owner_uid, self.case_id)


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


@dataclass(frozen=True)
class OntologyRuntime:
    ontology_file_paths: tuple[str, ...]
    data_point_classes: tuple[type[Any], ...]
    resolver: dict[str, Any]

    @property
    def data_point_class_names(self) -> tuple[str, ...]:
        return tuple(cls.__name__ for cls in self.data_point_classes)


def _ontology_stack(
    *,
    case_type: str | None,
    case_type_secondary: str | None,
    ontology_file_path: str,
) -> tuple[str, ...]:
    if case_type or case_type_secondary or ontology_file_path == ACO_ONTOLOGY_FILE:
        return ontology_stack_for_case_types(case_type, case_type_secondary)
    return (ontology_file_path,)


def get_resolver(
    *,
    case_type: str | None = None,
    case_type_secondary: str | None = None,
) -> dict[str, Any]:
    return ontology_resolver_descriptor(case_type, case_type_secondary)


def get_data_points(
    *,
    case_type: str | None = None,
    case_type_secondary: str | None = None,
) -> tuple[type[Any], ...]:
    return data_point_classes_for_case_types(case_type, case_type_secondary)


def dataset_for(owner_uid: str, case_id: str) -> str:
    """Return the only allowed Cognee dataset name shape for PRAXIS."""
    if not owner_uid or not case_id:
        raise ValueError("Cognee memory scope requires owner_uid and case_id")
    return f"{owner_uid}{COGNEE_DATASET_SEPARATOR}{case_id}"


def is_enabled() -> bool:
    settings = get_settings()
    return (
        settings.cognee_enabled
        and settings.cognee_mode != "disabled"
        and bool(settings.cognee_backend_url.strip())
    )


def _finish_call(
    *,
    operation: str,
    scope: MemoryScope,
    start: float,
    status: str,
    mode: CogneeSearchMode | None = None,
) -> None:
    latency = time.perf_counter() - start
    record_cognee_call(
        operation=operation,
        status=status,
        seconds=latency,
        mode=mode.value if mode else None,
    )
    logger.info(
        "cognee.%s dataset=%s mode=%s status=%s latency_ms=%.1f",
        operation,
        scope.dataset,
        mode.value if mode else None,
        status,
        latency * 1000,
    )


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
    if not settings.cognee_backend_url.strip():
        raise RuntimeError("Cognee memory requires COGNEE_BACKEND_URL for the isolated praxis-cognee service")


def _load_cognee() -> Any:
    _validate_runtime_config()
    try:
        import cognee  # type: ignore[import-not-found]
    except ImportError as exc:
        raise RuntimeError("Cognee is enabled but the cognee package is not installed") from exc
    return cognee


def _service_base_url() -> str:
    settings = get_settings()
    return settings.cognee_backend_url.rstrip("/")


def _service_headers(scope: MemoryScope) -> dict[str, str]:
    return {
        "content-type": "application/json",
        "x-praxis-owner-uid": scope.owner_uid,
        "x-praxis-case-id": scope.case_id,
        "x-praxis-cognee-dataset": scope.dataset,
    }


async def _post_service(*, operation: str, scope: MemoryScope, payload: dict[str, Any]) -> dict[str, Any]:
    url = f"{_service_base_url()}/v1/memory/{operation}"
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(url, json=payload, headers=_service_headers(scope))
        response.raise_for_status()
        data = response.json()
    if not isinstance(data, dict):
        raise RuntimeError(f"Cognee service returned non-object response for {operation}")
    return data


def _base_payload(scope: MemoryScope) -> dict[str, Any]:
    return {
        "ownerUid": scope.owner_uid,
        "caseId": scope.case_id,
        "sessionId": scope.session_id,
        "dataset": scope.dataset,
    }


def _service_unavailable(*, operation: str, scope: MemoryScope, exc: Exception, candidates: bool = False) -> dict[str, Any]:
    logger.warning(
        "cognee.%s service_unavailable dataset=%s error=%s",
        operation,
        scope.dataset,
        exc,
    )
    result: dict[str, Any] = {
        "ok": False,
        "status": "service_unavailable",
        "dataset": scope.dataset,
        "error": str(exc),
    }
    if candidates:
        result["candidates"] = []
    return result


def _candidate_text(candidate: dict[str, Any]) -> str:
    for key in ("text", "content", "summary", "label", "title"):
        value = candidate.get(key)
        if value:
            return str(value)
    return ""


def _candidate_score(candidate: dict[str, Any]) -> float:
    for key in ("score", "confidence", "internalScore", "internal_score"):
        value = candidate.get(key)
        if value is not None:
            try:
                return round(max(0.0, min(float(value), 0.6)), 3)
            except (TypeError, ValueError):
                return 0.0
    return 0.0


def _candidate_id(candidate: dict[str, Any]) -> str:
    for key in ("id", "memoryId", "memory_id", "nodeId", "node_id", "cogneeNodeId", "cognee_node_id"):
        value = candidate.get(key)
        if value:
            return str(value)
    return "cognee-candidate"


def _candidate_source_id(candidate: dict[str, Any]) -> str | None:
    for key in ("sourceId", "source_id", "sourceChunkId", "source_chunk_id"):
        value = candidate.get(key)
        if value:
            return str(value)
    return None


def _candidate_metadata(candidate: dict[str, Any]) -> dict[str, Any]:
    metadata = candidate.get("metadata")
    if isinstance(metadata, dict):
        return metadata
    return {}


def _candidate_to_hit(candidate: Any) -> MemoryHit | None:
    if isinstance(candidate, MemoryHit):
        return MemoryHit(
            id=candidate.id,
            text=candidate.text,
            score=round(max(0.0, min(float(candidate.score), 0.6)), 3),
            source_id=candidate.source_id,
            metadata=candidate.metadata,
        )
    if not isinstance(candidate, dict):
        return None
    return MemoryHit(
        id=_candidate_id(candidate),
        text=_candidate_text(candidate),
        score=_candidate_score(candidate),
        source_id=_candidate_source_id(candidate),
        metadata=_candidate_metadata(candidate),
    )


def memory_hits_from_response(response: dict[str, Any] | list[Any]) -> list[MemoryHit]:
    candidates: Any
    if isinstance(response, list):
        candidates = response
    else:
        candidates = response.get("candidates")
        if candidates is None:
            candidates = response.get("hits", [])
    if not isinstance(candidates, list):
        return []
    hits = [_candidate_to_hit(candidate) for candidate in candidates]
    return [hit for hit in hits if hit is not None]


def _normalize_search_response(response: dict[str, Any], *, scope: MemoryScope) -> dict[str, Any]:
    candidates = response.get("candidates")
    if candidates is None:
        candidates = response.get("hits", [])
    if not isinstance(candidates, list):
        candidates = []
    normalized = {
        **response,
        "ok": response.get("ok", True),
        "status": response.get("status", "searched"),
        "dataset": response.get("dataset", scope.dataset),
        "candidates": [hit.__dict__ for hit in memory_hits_from_response({"candidates": candidates})],
    }
    return normalized


def health() -> MemoryHealth:
    settings = get_settings()
    if not is_enabled():
        reason = "disabled"
        if settings.cognee_enabled and settings.cognee_mode != "disabled" and not settings.cognee_backend_url.strip():
            reason = "missing_backend_url"
        return MemoryHealth(
            enabled=False,
            mode=settings.cognee_mode,
            provider=settings.cognee_llm_provider,
            embedding_model=settings.cognee_embedding_model,
            embedding_dimensions=settings.cognee_embedding_dimensions,
            ready=False,
            reason=reason,
        )
    try:
        _validate_runtime_config()
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
    """Store content in advisory memory through the isolated Cognee service."""
    start = time.perf_counter()
    if not is_enabled():
        _finish_call(operation="remember", scope=scope, start=start, status="queued_disabled")
        return {"ok": False, "status": "queued_disabled", "dataset": scope.dataset, "sourceId": source_id}
    try:
        result = await _post_service(
            operation="remember",
            scope=scope,
            payload={
                **_base_payload(scope),
                "content": content,
                "sourceId": source_id,
                "metadata": metadata or {},
                "runCognify": run_cognify,
            },
        )
    except Exception as exc:
        result = _service_unavailable(operation="remember", scope=scope, exc=exc)
    _finish_call(operation="remember", scope=scope, start=start, status=str(result.get("status", "proxied")))
    return {**result, "dataset": result.get("dataset", scope.dataset), "sourceId": result.get("sourceId", source_id)}


async def add(
    *,
    scope: MemoryScope,
    content: bytes | str,
    source_id: str,
    node_set: list[str] | None = None,
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Add a source document to the tenant/case Cognee dataset."""
    start = time.perf_counter()
    _ = (content, metadata)
    node_set = node_set or [f"case_{scope.case_id}"]
    if not is_enabled():
        _finish_call(operation="add", scope=scope, start=start, status="queued_disabled")
        return {
            "ok": False,
            "status": "queued_disabled",
            "dataset": scope.dataset,
            "sourceId": source_id,
            "nodeSet": node_set,
        }
    payload_content: str
    payload_encoding: str | None = None
    if isinstance(content, bytes):
        payload_content = content.decode("utf-8", errors="replace")
        payload_encoding = "utf-8-replacement"
    else:
        payload_content = content
    try:
        result = await _post_service(
            operation="add",
            scope=scope,
            payload={
                **_base_payload(scope),
                "content": payload_content,
                "contentEncoding": payload_encoding,
                "sourceId": source_id,
                "nodeSet": node_set,
                "metadata": metadata or {},
            },
        )
    except Exception as exc:
        result = _service_unavailable(operation="add", scope=scope, exc=exc)
    _finish_call(operation="add", scope=scope, start=start, status=str(result.get("status", "proxied")))
    return {**result, "dataset": result.get("dataset", scope.dataset), "sourceId": result.get("sourceId", source_id)}


async def cognify(
    *,
    scope: MemoryScope,
    content: str,
    source_id: str,
    metadata: dict[str, Any] | None = None,
    ontology_file_path: str = ACO_ONTOLOGY_FILE,
    temporal_cognify: bool = True,
    case_type: str | None = None,
    case_type_secondary: str | None = None,
    custom_data_points: list[type[Any]] | None = None,
) -> dict[str, Any]:
    """Run ontology-grounded extraction for a source payload.

    The disabled path returns a queued shape so callers can keep their UX honest
    without pretending extraction completed.
    """
    start = time.perf_counter()
    ontology_file_paths = _ontology_stack(
        case_type=case_type,
        case_type_secondary=case_type_secondary,
        ontology_file_path=ontology_file_path,
    )
    data_point_names = data_point_class_names(case_type, case_type_secondary)
    if custom_data_points:
        data_point_names = data_point_names + tuple(cls.__name__ for cls in custom_data_points)
    resolver = get_resolver(case_type=case_type, case_type_secondary=case_type_secondary)
    if not is_enabled():
        _finish_call(operation="cognify", scope=scope, start=start, status="queued_disabled")
        return {
            "ok": False,
            "status": "queued_disabled",
            "dataset": scope.dataset,
            "sourceId": source_id,
            "ontologyFilePath": ontology_file_paths[0],
            "ontologyFilePaths": list(ontology_file_paths),
            "dataPointClasses": list(data_point_names),
            "resolver": resolver,
            "temporalCognify": temporal_cognify,
        }
    try:
        result = await _post_service(
            operation="cognify",
            scope=scope,
            payload={
                **_base_payload(scope),
                "content": content,
                "sourceId": source_id,
                "metadata": metadata or {},
                "ontologyFilePath": ontology_file_paths[0],
                "ontologyFilePaths": list(ontology_file_paths),
                "dataPointClasses": list(data_point_names),
                "resolver": resolver,
                "temporalCognify": temporal_cognify,
            },
        )
    except Exception as exc:
        result = _service_unavailable(operation="cognify", scope=scope, exc=exc)
    _finish_call(operation="cognify", scope=scope, start=start, status=str(result.get("status", "proxied")))
    return {**result, "dataset": result.get("dataset", scope.dataset), "sourceId": result.get("sourceId", source_id)}


async def memify(
    *,
    scope: MemoryScope,
    thread_id: str,
    turns: list[dict[str, Any]],
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Persist a closed research thread as long-lived memory coverage."""
    start = time.perf_counter()
    if not is_enabled():
        _finish_call(operation="memify", scope=scope, start=start, status="queued_disabled")
        return {"ok": False, "status": "queued_disabled", "dataset": scope.dataset, "threadId": thread_id}
    try:
        result = await _post_service(
            operation="memify",
            scope=scope,
            payload={**_base_payload(scope), "threadId": thread_id, "turns": turns, "metadata": metadata or {}},
        )
    except Exception as exc:
        result = _service_unavailable(operation="memify", scope=scope, exc=exc)
    _finish_call(operation="memify", scope=scope, start=start, status=str(result.get("status", "proxied")))
    return {**result, "dataset": result.get("dataset", scope.dataset), "threadId": result.get("threadId", thread_id)}


async def improve(
    *,
    scope: MemoryScope,
    target_id: str,
    positive: bool,
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    """Persist analyst feedback for interaction-level learning.

    Disabled mode returns a stable shape so callers can keep the UI honest
    without implying the live Cognee interaction log has been updated.
    """
    start = time.perf_counter()
    if not is_enabled():
        _finish_call(operation="improve", scope=scope, start=start, status="queued_disabled")
        return {
            "ok": False,
            "status": "queued_disabled",
            "dataset": scope.dataset,
            "targetId": target_id,
            "positive": positive,
        }
    try:
        result = await _post_service(
            operation="improve",
            scope=scope,
            payload={**_base_payload(scope), "targetId": target_id, "positive": positive, "metadata": metadata or {}},
        )
    except Exception as exc:
        result = _service_unavailable(operation="improve", scope=scope, exc=exc)
    _finish_call(operation="improve", scope=scope, start=start, status=str(result.get("status", "proxied")))
    return {**result, "dataset": result.get("dataset", scope.dataset), "targetId": result.get("targetId", target_id)}


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
) -> dict[str, Any]:
    """Route advisory Cognee search through the isolated service.

    Disabled mode returns an explicit empty candidate envelope instead of a raw
    empty list so callers can distinguish disabled memory from no results.
    """
    start = time.perf_counter()
    interaction = audit or SearchAudit(mode=mode)
    if not interaction.save_interaction:
        _finish_call(operation="search", scope=scope, start=start, status="invalid_interaction", mode=mode)
        raise ValueError("Cognee search calls in PRAXIS must use save_interaction=True")
    if not is_enabled():
        _finish_call(operation="search", scope=scope, start=start, status="disabled", mode=mode)
        return {"ok": False, "status": "disabled", "dataset": scope.dataset, "candidates": []}
    try:
        result = await _post_service(
            operation="search",
            scope=scope,
            payload={
                **_base_payload(scope),
                "query": query,
                "mode": mode.value,
                "limit": limit,
                "sessionId": session_id,
                "sourceKind": source_kind,
                "positive": positive,
                "signal": signal,
                "nodeSet": node_set or [],
                "audit": {
                    "mode": interaction.mode.value,
                    "saveInteraction": interaction.save_interaction,
                    "surfaceKey": interaction.surface_key,
                },
            },
        )
        result = _normalize_search_response(result, scope=scope)
    except Exception as exc:
        result = _service_unavailable(operation="search", scope=scope, exc=exc, candidates=True)
    _finish_call(operation="search", scope=scope, start=start, status=str(result.get("status", "proxied")), mode=mode)
    return result


async def recall(*, scope: MemoryScope, query: str, limit: int = 10) -> dict[str, Any]:
    return await search(scope=scope, query=query, limit=limit, mode=CogneeSearchMode.NATURAL_LANGUAGE)


async def recall_provenance(*, scope: MemoryScope, node_name: str, top_k: int = 5) -> dict[str, Any]:
    return await search(
        scope=scope,
        query=node_name,
        limit=top_k,
        mode=CogneeSearchMode.CHUNKS,
        audit=SearchAudit(mode=CogneeSearchMode.CHUNKS, surface_key="tab.graph.provenance"),
    )


async def forget(*, scope: MemoryScope, memory_id: str) -> dict[str, Any]:
    start = time.perf_counter()
    if not is_enabled():
        _finish_call(operation="forget", scope=scope, start=start, status="queued_disabled")
        return {"ok": False, "status": "queued_disabled", "dataset": scope.dataset, "memoryId": memory_id}
    try:
        result = await _post_service(
            operation="forget",
            scope=scope,
            payload={**_base_payload(scope), "memoryId": memory_id},
        )
    except Exception as exc:
        result = _service_unavailable(operation="forget", scope=scope, exc=exc)
    _finish_call(operation="forget", scope=scope, start=start, status=str(result.get("status", "proxied")))
    return {**result, "dataset": result.get("dataset", scope.dataset), "memoryId": result.get("memoryId", memory_id)}
