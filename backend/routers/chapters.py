"""Workspace chapter routers.

Chapters are work-product panes. They may write their own product records but
must not write substrate tables such as graph_nodes, source chunks, or Cognee
candidate links directly.
"""
from __future__ import annotations

import json
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from auth import verify_firebase_token
from services import cognee_memory
from services.cognee_memory import CogneeSearchMode, MemoryScope, SearchAudit
from services.postgres import tenant_session
from services.workspace_orchestrator import log_orchestrator_event

router = APIRouter()


class DeskAskRequest(BaseModel):
    case_id: str = Field(..., min_length=1, max_length=128)
    question: str = Field(..., min_length=1, max_length=2_000)


class ToolRunRequest(BaseModel):
    case_id: str = Field(..., min_length=1, max_length=128)
    recipe_id: str = Field(..., min_length=1, max_length=128)
    input: dict[str, Any] = Field(default_factory=dict)


class BoardroomBriefingRequest(BaseModel):
    case_id: str = Field(..., min_length=1, max_length=128)
    title: str = Field(default="Untitled briefing", max_length=300)
    sections: list[dict[str, Any]] = Field(default_factory=list)


@router.get("/desk/summary")
async def desk_summary(
    case_id: str = Query(..., min_length=1, max_length=128),
    token: dict = Depends(verify_firebase_token),
) -> dict[str, Any]:
    async with tenant_session(token["uid"]) as conn:
        suggestions = await conn.fetch(
            """
            SELECT id, target_chapter, surface_key, kind, title, body, confidence, created_at
            FROM workspace_suggestions
            WHERE owner_uid = %s AND case_id = %s AND dismissed_at IS NULL
            ORDER BY confidence DESC, created_at DESC
            LIMIT 20
            """,
            token["uid"],
            case_id,
        )
        frame_count = await conn.fetchval(
            "SELECT count(*) FROM situation_frames WHERE owner_uid = %s AND case_id = %s",
            token["uid"],
            case_id,
        )
        source_count = await conn.fetchval(
            "SELECT count(*) FROM source_receipts WHERE owner_uid = %s AND case_id = %s",
            token["uid"],
            case_id,
        )
    return {
        "caseId": case_id,
        "summary": {
            "frames": frame_count or 0,
            "sources": source_count or 0,
            "openSuggestions": len(suggestions),
            "contextHealth": 50,
        },
        "suggestions": suggestions,
    }


@router.post("/desk/ask")
async def desk_ask(req: DeskAskRequest, token: dict = Depends(verify_firebase_token)) -> StreamingResponse:
    async def stream():
        scope = MemoryScope(owner_uid=token["uid"], case_id=req.case_id)
        hits = await cognee_memory.search(
            scope=scope,
            query=req.question,
            mode=CogneeSearchMode.NATURAL_LANGUAGE,
            audit=SearchAudit(mode=CogneeSearchMode.NATURAL_LANGUAGE, surface_key="chapter.desk.ask"),
        )
        yield f"data: {json.dumps({'status': 'working', 'message': 'Searching workspace memory', 'hits': len(hits)})}\n\n"
        yield f"data: {json.dumps({'status': 'idle', 'message': 'Use retrieved context as advisory evidence, then verify receipts before export.'})}\n\n"

    return StreamingResponse(stream(), media_type="text/event-stream")


@router.post("/desk/dismiss-suggestion/{suggestion_id}")
async def dismiss_suggestion(
    suggestion_id: str,
    token: dict = Depends(verify_firebase_token),
) -> dict[str, Any]:
    async with tenant_session(token["uid"]) as conn:
        await conn.execute(
            """
            UPDATE workspace_suggestions
            SET dismissed_at = now()
            WHERE owner_uid = %s AND id = %s::uuid
            """,
            token["uid"],
            suggestion_id,
        )
    return {"ok": True, "suggestionId": suggestion_id}


@router.get("/tools/recipes")
async def list_recipes(token: dict = Depends(verify_firebase_token)) -> dict[str, Any]:
    _ = token
    return {
        "recipes": [
            {"id": "mediation.zopa-finder", "title": "ZOPA Finder", "tokenBudget": 8_000},
            {"id": "conflict.leverage-trace", "title": "Leverage Trace", "tokenBudget": 8_000},
            {"id": "governance.coalition-map", "title": "Coalition Map", "tokenBudget": 8_000},
            {"id": "narrative.frame-cascade", "title": "Frame Cascade", "tokenBudget": 8_000},
        ]
    }


@router.post("/tools/run")
async def run_tool_recipe(req: ToolRunRequest, token: dict = Depends(verify_firebase_token)) -> dict[str, Any]:
    run_id = uuid4().hex
    async with tenant_session(token["uid"]) as conn:
        await log_orchestrator_event(
            conn,
            owner_uid=token["uid"],
            case_id=req.case_id,
            surface_key=f"chapter.tools.{req.recipe_id}",
            event_type="recipe_run_requested",
            status="working",
            payload={"runId": run_id, "input": req.input},
        )
    return {
        "runId": run_id,
        "caseId": req.case_id,
        "recipeId": req.recipe_id,
        "status": "queued",
        "deterministic": True,
    }


@router.get("/tools/runs/{run_id}")
async def get_tool_run(run_id: str, token: dict = Depends(verify_firebase_token)) -> dict[str, Any]:
    async with tenant_session(token["uid"]) as conn:
        rows = await conn.fetch(
            """
            SELECT *
            FROM workspace_orchestrator_log
            WHERE owner_uid = %s AND payload->>'runId' = %s
            ORDER BY created_at DESC
            LIMIT 1
            """,
            token["uid"],
            run_id,
        )
    return {"run": rows[0] if rows else {"runId": run_id, "status": "unknown"}}


@router.post("/tools/runs/{run_id}/save-as-memo")
async def save_run_as_memo(run_id: str, token: dict = Depends(verify_firebase_token)) -> dict[str, Any]:
    _ = token
    return {"ok": True, "runId": run_id, "memoStatus": "staged_for_review"}


@router.get("/boardroom")
async def get_boardroom(
    case_id: str = Query(..., min_length=1, max_length=128),
    token: dict = Depends(verify_firebase_token),
) -> dict[str, Any]:
    async with tenant_session(token["uid"]) as conn:
        rows = await conn.fetch(
            """
            SELECT id, surface_key, event_type, status, payload, created_at
            FROM workspace_orchestrator_log
            WHERE owner_uid = %s AND case_id = %s AND surface_key LIKE 'chapter.boardroom%%'
            ORDER BY created_at DESC
            LIMIT 50
            """,
            token["uid"],
            case_id,
        )
    return {"briefings": rows}


@router.post("/boardroom/briefings")
async def create_boardroom_briefing(req: BoardroomBriefingRequest, token: dict = Depends(verify_firebase_token)) -> dict[str, Any]:
    briefing_id = uuid4().hex
    async with tenant_session(token["uid"]) as conn:
        await log_orchestrator_event(
            conn,
            owner_uid=token["uid"],
            case_id=req.case_id,
            surface_key="chapter.boardroom",
            event_type="briefing_created",
            status="idle",
            payload={"briefingId": briefing_id, "title": req.title, "sections": req.sections},
        )
    return {"briefingId": briefing_id, "status": "staged", "title": req.title}


@router.put("/boardroom/briefings/{briefing_id}")
async def update_boardroom_briefing(
    briefing_id: str,
    req: BoardroomBriefingRequest,
    token: dict = Depends(verify_firebase_token),
) -> dict[str, Any]:
    async with tenant_session(token["uid"]) as conn:
        await log_orchestrator_event(
            conn,
            owner_uid=token["uid"],
            case_id=req.case_id,
            surface_key="chapter.boardroom",
            event_type="briefing_updated",
            status="idle",
            payload={"briefingId": briefing_id, "title": req.title, "sections": req.sections},
        )
    return {"briefingId": briefing_id, "status": "updated"}


@router.post("/boardroom/briefings/{briefing_id}/sections/{section_idx}/synth")
async def synth_boardroom_section(
    briefing_id: str,
    section_idx: int,
    token: dict = Depends(verify_firebase_token),
) -> dict[str, Any]:
    _ = token
    return {
        "briefingId": briefing_id,
        "sectionIndex": section_idx,
        "synthesized": True,
        "confidence": 0.55,
        "text": "Advisory synthesis staged. Verify source receipts before export.",
    }


@router.post("/boardroom/briefings/{briefing_id}/export")
async def export_boardroom_briefing(briefing_id: str, token: dict = Depends(verify_firebase_token)) -> dict[str, Any]:
    _ = token
    return {"briefingId": briefing_id, "exportStatus": "queued", "format": "docx"}
