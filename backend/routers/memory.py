"""Cognee memory router.

The route surface is live but disabled-safe. Recall returns empty hits when the
memory layer is off so callers can fall back to the existing vector/context
substrate; writes return 503 to avoid implying persistence happened.
"""
from __future__ import annotations

import logging
import time
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pydantic import BaseModel, Field

from auth import verify_firebase_token
from services import cognee_bridge, cognee_memory
from services.cognee_memory import MemoryScope
from services.postgres import tenant_session

router = APIRouter()
logger = logging.getLogger("praxis.cognee")


def _row_dict(row: Any) -> dict[str, Any]:
    return dict(row)


class RememberRequest(BaseModel):
    case_id: str = Field(..., min_length=1, max_length=128)
    content: str = Field(..., min_length=1, max_length=200_000)
    source: str = Field(..., pattern="^(document|chat|tool_output|feed|aco)$")
    source_id: str = Field(..., min_length=1, max_length=256)
    session_id: str | None = Field(default=None, max_length=128)
    metadata: dict[str, Any] = Field(default_factory=dict)


class RecallRequest(BaseModel):
    case_id: str = Field(..., min_length=1, max_length=128)
    query: str = Field(..., min_length=1, max_length=2_000)
    session_id: str | None = Field(default=None, max_length=128)
    k: int = Field(default=8, ge=1, le=50)
    filters: dict[str, Any] = Field(default_factory=dict)


class PromoteRequest(BaseModel):
    case_id: str = Field(..., min_length=1, max_length=128)
    link_id: str = Field(..., min_length=1, max_length=128)
    aco_node_id: str = Field(..., min_length=1, max_length=128)


class RejectRequest(BaseModel):
    case_id: str = Field(..., min_length=1, max_length=128)
    link_id: str = Field(..., min_length=1, max_length=128)
    notes: str | None = Field(default=None, max_length=2_000)


@router.get("/health")
async def memory_health(token: dict = Depends(verify_firebase_token)) -> dict[str, Any]:
    _ = token
    health = cognee_memory.health()
    return {
        "enabled": health.enabled,
        "mode": health.mode,
        "provider": health.provider,
        "embeddingModel": health.embedding_model,
        "embeddingDimensions": health.embedding_dimensions,
        "ready": health.ready,
        "reason": health.reason,
    }


@router.post("/remember")
async def remember(req: RememberRequest, request: Request, token: dict = Depends(verify_firebase_token)) -> dict[str, Any]:
    if getattr(request.app.state, "cognee_quiesced", False):
        raise HTTPException(status_code=503, detail="memory_layer_quiesced")
    if not cognee_memory.is_enabled():
        raise HTTPException(status_code=503, detail="memory_layer_disabled")
    scope = MemoryScope(owner_uid=token["uid"], case_id=req.case_id, session_id=req.session_id)
    return await cognee_memory.remember(
        scope=scope,
        content=req.content,
        source_id=req.source_id,
        metadata={"source": req.source, **req.metadata},
    )


@router.post("/recall")
async def recall(req: RecallRequest, token: dict = Depends(verify_firebase_token)) -> dict[str, Any]:
    started = time.perf_counter()
    if not cognee_memory.is_enabled():
        logger.info(
            "cognee.recall disabled owner_uid=%s case_id=%s latency_ms=%.2f",
            token["uid"],
            req.case_id,
            (time.perf_counter() - started) * 1000,
        )
        return {"hits": [], "status": "memory_layer_disabled"}
    scope = MemoryScope(owner_uid=token["uid"], case_id=req.case_id, session_id=req.session_id)
    response = await cognee_memory.recall(scope=scope, query=req.query, limit=req.k)
    hits = cognee_memory.memory_hits_from_response(response)
    logger.info(
        "cognee.recall owner_uid=%s case_id=%s hits=%s latency_ms=%.2f",
        token["uid"],
        req.case_id,
        len(hits),
        (time.perf_counter() - started) * 1000,
    )
    return {
        "hits": [hit.__dict__ for hit in hits],
        "cognee": {"ok": response.get("ok", True), "status": response.get("status", "searched")},
    }


@router.delete("/forget")
async def forget(
    case_id: str = Query(..., min_length=1, max_length=128),
    memory_id: str = Query(..., min_length=1, max_length=256),
    token: dict = Depends(verify_firebase_token),
) -> dict[str, Any]:
    scope = MemoryScope(owner_uid=token["uid"], case_id=case_id)
    return await cognee_memory.forget(scope=scope, memory_id=memory_id)


@router.get("/candidates")
async def list_candidates(
    case_id: str = Query(..., min_length=1, max_length=128),
    token: dict = Depends(verify_firebase_token),
) -> dict[str, Any]:
    async with tenant_session(token["uid"]) as conn:
        rows = await conn.fetch(
            """
            SELECT id, cognee_node_id, cognee_dataset, confidence, internal_score,
                   source_chunk_id, label, metadata, model, run_id, created_at, notes
            FROM aco_cognee_link
            WHERE case_id = %s AND owner_uid = %s AND link_kind = 'candidate'
            ORDER BY confidence DESC, created_at DESC
            LIMIT 200
            """,
            case_id,
            token["uid"],
        )
    return {"candidates": [_row_dict(row) for row in rows]}


@router.post("/promote")
async def promote(req: PromoteRequest, token: dict = Depends(verify_firebase_token)) -> dict[str, Any]:
    async with tenant_session(token["uid"]) as conn:
        row = await cognee_bridge.promote_link(
            conn,
            owner_uid=token["uid"],
            case_id=req.case_id,
            link_id=req.link_id,
            aco_node_id=req.aco_node_id,
            reviewed_by=token["uid"],
        )
    return _row_dict(row)


@router.post("/reject")
async def reject(req: RejectRequest, token: dict = Depends(verify_firebase_token)) -> dict[str, Any]:
    async with tenant_session(token["uid"]) as conn:
        row = await cognee_bridge.reject_link(
            conn,
            owner_uid=token["uid"],
            case_id=req.case_id,
            link_id=req.link_id,
            reviewed_by=token["uid"],
            notes=req.notes,
        )
    return _row_dict(row)
