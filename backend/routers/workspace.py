"""Workspace-level APIs."""
from __future__ import annotations

import json
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from auth import verify_firebase_token
from services.workspace_orchestrator import orchestrator_heartbeat
from services.postgres import tenant_session

router = APIRouter()


class SuggestionActionRequest(BaseModel):
    case_id: str = Field(..., min_length=1, max_length=128)
    payload: dict[str, Any] = Field(default_factory=dict)


def _event_from_suggestion(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(row["id"]),
        "caseId": row["case_id"],
        "surfaceKey": row["surface_key"],
        "status": "idle",
        "message": row["title"],
        "createdAt": row["created_at"].isoformat() if hasattr(row["created_at"], "isoformat") else str(row["created_at"]),
        "payload": {
            "kind": "suggestion",
            "targetChapter": row.get("target_chapter"),
            "title": row["title"],
            "body": row.get("body") or "",
            "confidence": float(row["confidence"]) if row.get("confidence") is not None else None,
            "data": row.get("payload") or {},
        },
    }


def _event_from_log(row: dict[str, Any]) -> dict[str, Any]:
    payload = row.get("payload") or {}
    return {
        "id": str(row["id"]),
        "caseId": row["case_id"],
        "surfaceKey": row["surface_key"],
        "status": row.get("status") or "idle",
        "message": payload.get("message") or row["event_type"].replace("_", " "),
        "createdAt": row["created_at"].isoformat() if hasattr(row["created_at"], "isoformat") else str(row["created_at"]),
        "payload": {"kind": "log", "eventType": row["event_type"], "data": payload},
    }


@router.get("/events")
async def workspace_events(
    case_id: str = Query(..., min_length=1, max_length=128),
    surface_key: str = Query(default="workspace", max_length=128),
    token: dict = Depends(verify_firebase_token),
) -> StreamingResponse:
    async def stream():
        async with tenant_session(token["uid"]) as conn:
            suggestions = await conn.fetch(
                """
                SELECT id, case_id, target_chapter, surface_key, kind, title, body,
                       confidence, payload, created_at
                FROM workspace_suggestions
                WHERE owner_uid = %s
                  AND case_id = %s
                  AND dismissed_at IS NULL
                  AND (%s = 'workspace' OR surface_key = %s)
                ORDER BY created_at DESC
                LIMIT 10
                """,
                token["uid"],
                case_id,
                surface_key,
                surface_key,
            )
            logs = await conn.fetch(
                """
                SELECT id, case_id, surface_key, event_type, status, payload, created_at
                FROM workspace_orchestrator_log
                WHERE owner_uid = %s
                  AND case_id = %s
                  AND (%s = 'workspace' OR surface_key = %s)
                ORDER BY created_at DESC
                LIMIT 10
                """,
                token["uid"],
                case_id,
                surface_key,
                surface_key,
            )
        for row in suggestions:
            yield f"data: {json.dumps(_event_from_suggestion(dict(row)))}\n\n"
        for row in logs:
            yield f"data: {json.dumps(_event_from_log(dict(row)))}\n\n"
        yield f"data: {json.dumps(orchestrator_heartbeat(case_id=case_id, surface_key=surface_key).to_api())}\n\n"

    return StreamingResponse(stream(), media_type="text/event-stream")


@router.post("/suggestions/{suggestion_id}/dismiss")
async def dismiss_workspace_suggestion(
    suggestion_id: str,
    req: SuggestionActionRequest,
    token: dict = Depends(verify_firebase_token),
) -> dict[str, Any]:
    async with tenant_session(token["uid"]) as conn:
        rows = await conn.fetch(
            """
            UPDATE workspace_suggestions
            SET dismissed_at = now()
            WHERE owner_uid = %s AND case_id = %s AND id = %s::uuid
            RETURNING id, case_id, surface_key
            """,
            token["uid"],
            req.case_id,
            suggestion_id,
        )
    if not rows:
        raise HTTPException(status_code=404, detail="suggestion_not_found")
    return {"ok": True, "suggestionId": suggestion_id}


@router.post("/suggestions/{suggestion_id}/confirm")
async def confirm_workspace_suggestion(
    suggestion_id: str,
    req: SuggestionActionRequest,
    token: dict = Depends(verify_firebase_token),
) -> dict[str, Any]:
    async with tenant_session(token["uid"]) as conn:
        rows = await conn.fetch(
            """
            SELECT id, case_id, surface_key, target_chapter, payload
            FROM workspace_suggestions
            WHERE owner_uid = %s AND case_id = %s AND id = %s::uuid AND dismissed_at IS NULL
            """,
            token["uid"],
            req.case_id,
            suggestion_id,
        )
        if not rows:
            raise HTTPException(status_code=404, detail="suggestion_not_found")
        await conn.execute(
            """
            INSERT INTO workspace_orchestrator_log (
              owner_uid, case_id, surface_key, event_type, status, payload
            )
            VALUES (%s, %s, %s, 'suggestion_confirmed', 'working', %s::jsonb)
            """,
            token["uid"],
            req.case_id,
            rows[0]["surface_key"],
            {"suggestionId": suggestion_id, "request": req.payload, "suggestion": rows[0]["payload"] or {}},
        )
    return {"ok": True, "suggestionId": suggestion_id, "status": "confirmed"}
