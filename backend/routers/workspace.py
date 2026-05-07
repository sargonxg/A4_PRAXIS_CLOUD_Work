"""Workspace-level APIs."""
from __future__ import annotations

import json

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse

from auth import verify_firebase_token
from services.workspace_orchestrator import orchestrator_heartbeat

router = APIRouter()


@router.get("/events")
async def workspace_events(
    case_id: str = Query(..., min_length=1, max_length=128),
    surface_key: str = Query(default="workspace", max_length=128),
    token: dict = Depends(verify_firebase_token),
) -> StreamingResponse:
    async def stream():
        _ = token
        event = orchestrator_heartbeat(case_id=case_id, surface_key=surface_key)
        yield f"data: {json.dumps(event.to_api())}\n\n"

    return StreamingResponse(stream(), media_type="text/event-stream")
