"""Workspace tab routers.

Tabs are substrate surfaces: Context, Library, Ontology, and Graph. They read
and stage substrate data but keep canonical writes behind the existing graph
promotion/firewall paths.
"""
from __future__ import annotations

import json
from typing import Any

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from auth import verify_firebase_token
from services import cognee_memory
from services.cognee_memory import MemoryScope
from services.postgres import tenant_session
from services.workspace_orchestrator import log_orchestrator_event
from services.workspace_orchestrator.subgraphs.situation_frame import on_situation_frame_saved

router = APIRouter()


class SituationFrameRequest(BaseModel):
    what_happening: str = Field(default="", max_length=8_000)
    why_matters: str = Field(default="", max_length=8_000)
    what_would_change: str = Field(default="", max_length=8_000)
    policy_question: str = Field(default="", max_length=2_000)
    metadata: dict[str, Any] = Field(default_factory=dict)


class CoachRequest(BaseModel):
    case_id: str = Field(..., min_length=1, max_length=128)
    question: str = Field(..., min_length=1, max_length=2_000)
    frame: SituationFrameRequest | None = None


def _row_or_empty(rows: list[dict[str, Any]]) -> dict[str, Any]:
    return rows[0] if rows else {}


async def _queue_cognee_pending(
    conn: Any,
    *,
    owner_uid: str,
    case_id: str,
    source_id: str,
    operation: str,
    payload: dict[str, Any],
    error: str | None = None,
) -> None:
    await conn.execute(
        """
        INSERT INTO cognee_pending_writes (
          owner_uid, case_id, source_id, operation, payload, last_error
        )
        VALUES (%s, %s, %s, %s, %s::jsonb, %s)
        """,
        owner_uid,
        case_id,
        source_id,
        operation,
        payload,
        error,
    )


@router.get("/context/situation-frame")
async def get_situation_frame(
    case_id: str = Query(..., min_length=1, max_length=128),
    token: dict = Depends(verify_firebase_token),
) -> dict[str, Any]:
    async with tenant_session(token["uid"]) as conn:
        rows = await conn.fetch(
            """
            SELECT case_id, what_happening, why_matters, what_would_change,
                   policy_question, metadata, updated_at
            FROM situation_frames
            WHERE owner_uid = %s AND case_id = %s
            """,
            token["uid"],
            case_id,
        )
    return {"frame": _row_or_empty(rows)}


@router.put("/context/situation-frame")
async def put_situation_frame(
    req: SituationFrameRequest,
    case_id: str = Query(..., min_length=1, max_length=128),
    token: dict = Depends(verify_firebase_token),
) -> dict[str, Any]:
    async with tenant_session(token["uid"]) as conn:
        rows = await conn.fetch(
            """
            INSERT INTO situation_frames (
              owner_uid, case_id, what_happening, why_matters,
              what_would_change, policy_question, metadata
            )
            VALUES (%s, %s, %s, %s, %s, %s, %s::jsonb)
            ON CONFLICT (owner_uid, case_id) DO UPDATE SET
              what_happening = EXCLUDED.what_happening,
              why_matters = EXCLUDED.why_matters,
              what_would_change = EXCLUDED.what_would_change,
              policy_question = EXCLUDED.policy_question,
              metadata = EXCLUDED.metadata,
              updated_at = now()
            RETURNING *
            """,
            token["uid"],
            case_id,
            req.what_happening,
            req.why_matters,
            req.what_would_change,
            req.policy_question,
            req.metadata,
        )
        suggestions = await on_situation_frame_saved(owner_uid=token["uid"], case_id=case_id, frame=req.model_dump())
        for suggestion in suggestions:
            await conn.execute(
                """
                INSERT INTO workspace_suggestions (
                  owner_uid, case_id, target_chapter, surface_key, kind,
                  title, body, confidence, payload
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb)
                """,
                token["uid"],
                case_id,
                suggestion["target_chapter"],
                suggestion["surface_key"],
                suggestion["kind"],
                suggestion["title"],
                suggestion["body"],
                suggestion["confidence"],
                suggestion,
            )
        await log_orchestrator_event(
            conn,
            owner_uid=token["uid"],
            case_id=case_id,
            surface_key="context.situation_frame",
            event_type="situation_frame_upserted",
            status="idle",
            payload={"suggestions": len(suggestions)},
        )

    scope = MemoryScope(owner_uid=token["uid"], case_id=case_id)
    frame_source_id = f"situation-frame:{case_id}"
    try:
        cognee_status = await cognee_memory.remember(
            scope=scope,
            content=json.dumps(req.model_dump()),
            source_id=frame_source_id,
            metadata={"source": "situation_frame", "dataPoint": "Situation"},
            run_cognify=False,
        )
    except Exception as exc:
        cognee_status = {"ok": False, "status": "queued_retry", "error": str(exc)}
    if not cognee_status.get("ok"):
        async with tenant_session(token["uid"]) as conn:
            await _queue_cognee_pending(
                conn,
                owner_uid=token["uid"],
                case_id=case_id,
                source_id=frame_source_id,
                operation="remember_situation_frame",
                payload=req.model_dump(),
                error=cognee_status.get("error") or cognee_status.get("status"),
            )
    return {"frame": _row_or_empty(rows), "suggestions": suggestions, "cognee": cognee_status}


@router.post("/context/coach")
async def coach_context(req: CoachRequest, token: dict = Depends(verify_firebase_token)) -> StreamingResponse:
    async def stream():
      _ = token
      yield f"data: {json.dumps({'status': 'working', 'message': 'Reviewing situation frame'})}\n\n"
      yield f"data: {json.dumps({'status': 'idle', 'message': 'Clarify actors, receipts, and the decision line before heavy generation.'})}\n\n"

    return StreamingResponse(stream(), media_type="text/event-stream")


@router.post("/library/ingest")
async def ingest_library_source(
    case_id: str = Query(..., min_length=1, max_length=128),
    file: UploadFile = File(...),
    token: dict = Depends(verify_firebase_token),
) -> dict[str, Any]:
    content = await file.read()
    title = file.filename or "Untitled source"
    async with tenant_session(token["uid"]) as conn:
        rows = await conn.fetch(
            """
            INSERT INTO source_receipts (
              owner_uid, case_id, title, source_type, receipt_status, metadata
            )
            VALUES (%s, %s, %s, %s, 'uploading', %s::jsonb)
            RETURNING *
            """,
            token["uid"],
            case_id,
            title,
            file.content_type or "document",
            {"filename": title, "bytes": len(content)},
        )
        source_id = str(rows[0]["id"])

    scope = MemoryScope(owner_uid=token["uid"], case_id=case_id)
    try:
        add_status = await cognee_memory.add(
            scope=scope,
            content=content,
            source_id=source_id,
            node_set=[f"case_{case_id}"],
            metadata={"filename": title, "contentType": file.content_type},
        )
    except Exception as exc:
        add_status = {"ok": False, "status": "queued_retry", "error": str(exc)}
    try:
        cognify_status = await cognee_memory.cognify(
            scope=scope,
            content=content.decode("utf-8", errors="ignore")[:200_000],
            source_id=source_id,
            metadata={"filename": title, "source": "library_upload"},
        )
    except Exception as exc:
        cognify_status = {"ok": False, "status": "queued_retry", "error": str(exc)}
    status = "cognee_disabled" if not add_status.get("ok") or not cognify_status.get("ok") else "ingested"
    async with tenant_session(token["uid"]) as conn:
        await conn.execute(
            """
            UPDATE source_receipts
            SET receipt_status = %s,
                cognee_document_id = %s,
                metadata = metadata || %s::jsonb,
                updated_at = now()
            WHERE owner_uid = %s AND case_id = %s AND id = %s::uuid
            """,
            status,
            source_id,
            {"add": add_status, "cognify": cognify_status},
            token["uid"],
            case_id,
            source_id,
        )
        if status != "ingested":
            await _queue_cognee_pending(
                conn,
                owner_uid=token["uid"],
                case_id=case_id,
                source_id=source_id,
                operation="library_add_cognify",
                payload={"add": add_status, "cognify": cognify_status},
                error=status,
            )
        await log_orchestrator_event(
            conn,
            owner_uid=token["uid"],
            case_id=case_id,
            surface_key="library.ingest",
            event_type="source_receipt_ingested",
            status="idle",
            payload={"sourceId": source_id, "status": status},
        )

    return {"sourceId": source_id, "status": status, "cognee": {"add": add_status, "cognify": cognify_status}}


@router.get("/library")
@router.get("/library/sources")
async def list_sources(
    case_id: str = Query(..., min_length=1, max_length=128),
    token: dict = Depends(verify_firebase_token),
) -> dict[str, Any]:
    async with tenant_session(token["uid"]) as conn:
        rows = await conn.fetch(
            """
            SELECT id, title, source_uri, source_type, receipt_status,
                   cognee_document_id, embeddings_count, nodes_extracted,
                   ontology_valid_pct, metadata, created_at, updated_at
            FROM source_receipts
            WHERE owner_uid = %s AND case_id = %s
            ORDER BY created_at DESC
            LIMIT 200
            """,
            token["uid"],
            case_id,
        )
    return {"sources": rows}


@router.get("/library/{source_id}")
async def get_source_detail(source_id: str, token: dict = Depends(verify_firebase_token)) -> dict[str, Any]:
    async with tenant_session(token["uid"]) as conn:
        rows = await conn.fetch(
            "SELECT * FROM source_receipts WHERE owner_uid = %s AND id = %s::uuid",
            token["uid"],
            source_id,
        )
    if not rows:
        raise HTTPException(status_code=404, detail="source_receipt_not_found")
    return {"source": rows[0]}


@router.post("/library/{source_id}/re-extract")
async def reextract_source(
    source_id: str,
    case_id: str = Query(..., min_length=1, max_length=128),
    token: dict = Depends(verify_firebase_token),
) -> dict[str, Any]:
    scope = MemoryScope(owner_uid=token["uid"], case_id=case_id)
    try:
        status = await cognee_memory.cognify(
            scope=scope,
            content=f"Re-extract source receipt {source_id}",
            source_id=source_id,
            metadata={"source": "library_reextract"},
        )
    except Exception as exc:
        status = {"ok": False, "status": "queued_retry", "error": str(exc)}
    async with tenant_session(token["uid"]) as conn:
        await log_orchestrator_event(
            conn,
            owner_uid=token["uid"],
            case_id=case_id,
            surface_key="library.reextract",
            event_type="source_reextract_requested",
            status="idle",
            payload={"sourceId": source_id, "cognee": status},
        )
        if not status.get("ok"):
            await _queue_cognee_pending(
                conn,
                owner_uid=token["uid"],
                case_id=case_id,
                source_id=source_id,
                operation="library_reextract",
                payload={"cognee": status},
                error=status.get("status"),
            )
    return {"sourceId": source_id, "cognee": status}


@router.delete("/library/{source_id}")
async def delete_source(
    source_id: str,
    case_id: str = Query(..., min_length=1, max_length=128),
    token: dict = Depends(verify_firebase_token),
) -> dict[str, Any]:
    scope = MemoryScope(owner_uid=token["uid"], case_id=case_id)
    try:
        forget_status = await cognee_memory.forget(scope=scope, memory_id=source_id)
    except Exception as exc:
        forget_status = {"ok": False, "status": "delete_pending", "error": str(exc)}
    async with tenant_session(token["uid"]) as conn:
        await conn.execute(
            """
            UPDATE source_receipts
            SET receipt_status = 'deleted', metadata = metadata || %s::jsonb, updated_at = now()
            WHERE owner_uid = %s AND case_id = %s AND id = %s::uuid
            """,
            {"forget": forget_status},
            token["uid"],
            case_id,
            source_id,
        )
    return {"ok": True, "sourceId": source_id, "cognee": forget_status}


@router.get("/ontology/candidates")
async def list_ontology_candidates(
    case_id: str = Query(..., min_length=1, max_length=128),
    token: dict = Depends(verify_firebase_token),
) -> dict[str, Any]:
    async with tenant_session(token["uid"]) as conn:
        rows = await conn.fetch(
            """
            SELECT id, cognee_node_id, confidence, internal_score, label,
                   metadata, model, run_id, created_at, notes
            FROM aco_cognee_link
            WHERE owner_uid = %s AND case_id = %s AND link_kind = 'candidate'
            ORDER BY confidence DESC, created_at DESC
            LIMIT 200
            """,
            token["uid"],
            case_id,
        )
    return {"candidates": rows}


@router.post("/ontology/merge")
async def merge_ontology_candidates(token: dict = Depends(verify_firebase_token)) -> dict[str, Any]:
    _ = token
    raise HTTPException(status_code=501, detail="ontology_merge_requires_review_pipeline")


@router.get("/graph")
async def get_tab_graph(
    case_id: str = Query(..., min_length=1, max_length=128),
    include_candidates: bool = Query(default=False),
    primitives: str | None = Query(default=None),
    token: dict = Depends(verify_firebase_token),
) -> dict[str, Any]:
    async with tenant_session(token["uid"]) as conn:
        nodes = await conn.fetch(
            """
            SELECT id, primitive, label, layer, confidence, metadata, created_at
            FROM graph_nodes
            WHERE owner_uid = %s AND case_id = %s
            ORDER BY created_at DESC
            LIMIT 500
            """,
            token["uid"],
            case_id,
        )
        edges = await conn.fetch(
            """
            SELECT id, source_node_id, target_node_id, relation, confidence, metadata, created_at
            FROM graph_edges
            WHERE owner_uid = %s AND case_id = %s
            ORDER BY created_at DESC
            LIMIT 750
            """,
            token["uid"],
            case_id,
        )
        candidates = []
        if include_candidates:
            candidates = await conn.fetch(
                """
                SELECT id, cognee_node_id, label, confidence, metadata, created_at
                FROM aco_cognee_link
                WHERE owner_uid = %s AND case_id = %s AND link_kind = 'candidate'
                ORDER BY confidence DESC
                LIMIT 200
                """,
                token["uid"],
                case_id,
            )
    return {
        "nodes": nodes,
        "edges": edges,
        "candidates": candidates,
        "filters": {"includeCandidates": include_candidates, "primitives": primitives},
    }


@router.get("/graph/node/{node_id}")
async def get_graph_node(node_id: str, token: dict = Depends(verify_firebase_token)) -> dict[str, Any]:
    async with tenant_session(token["uid"]) as conn:
        rows = await conn.fetch(
            "SELECT * FROM graph_nodes WHERE owner_uid = %s AND id = %s::uuid",
            token["uid"],
            node_id,
        )
    if not rows:
        raise HTTPException(status_code=404, detail="graph_node_not_found")
    return {"node": rows[0]}


@router.get("/graph/timeline")
async def get_graph_timeline(
    case_id: str = Query(..., min_length=1, max_length=128),
    token: dict = Depends(verify_firebase_token),
) -> dict[str, Any]:
    async with tenant_session(token["uid"]) as conn:
        rows = await conn.fetch(
            """
            SELECT id, primitive, label, valid_from, valid_to, created_at
            FROM graph_nodes
            WHERE owner_uid = %s AND case_id = %s AND valid_from IS NOT NULL
            ORDER BY valid_from DESC
            LIMIT 200
            """,
            token["uid"],
            case_id,
        )
    return {"timeline": rows}
