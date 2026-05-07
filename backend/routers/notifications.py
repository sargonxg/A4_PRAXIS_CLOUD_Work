"""User notification APIs."""
from __future__ import annotations

import json
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from auth import verify_firebase_token
from services.notifications import (
    NOTIFICATION_REGISTRY,
    dispatch_pending_deliveries,
    list_notifications,
    notify,
    record_signal,
)
from services.postgres import tenant_session

router = APIRouter()


class SignalRequest(BaseModel):
    signal: str = Field(..., pattern="^(read|acted|dismissed|ignored)$")
    metadata: dict[str, Any] = Field(default_factory=dict)


class TestNotificationRequest(BaseModel):
    case_id: str = Field(default="test-case", min_length=1, max_length=128)
    notification_type: str = Field(default="source_ingest_complete")


class PreferencesRequest(BaseModel):
    channels: dict[str, bool] = Field(default_factory=dict)
    per_type: dict[str, str] = Field(default_factory=dict)
    quiet_hours: dict[str, Any] = Field(default_factory=dict)
    timezone: str = Field(default="America/New_York", max_length=64)
    digest_time: str = Field(default="08:00", max_length=8)
    do_not_disturb: bool = False


class DispatchRequest(BaseModel):
    limit: int = Field(default=100, ge=1, le=500)


def _serialize(row: dict[str, Any]) -> dict[str, Any]:
    payload = row.get("payload") or {}
    return {
        "id": str(row["id"]),
        "notificationId": str(row["id"]),
        "type": row.get("type") or row.get("event_type"),
        "category": row.get("category") or "operational",
        "urgency": row.get("urgency") or "immediate",
        "title": row.get("title") or "",
        "body": row.get("body") or "",
        "caseId": row.get("case_id"),
        "workspaceId": row.get("workspace_id"),
        "state": row.get("state") or row.get("status") or "delivered",
        "read": bool(row.get("read_at") or row.get("state") in {"read", "acted"}),
        "actionUrl": row.get("action_url"),
        "actionVerb": NOTIFICATION_REGISTRY.get(row.get("type") or "", None).action_verb
        if row.get("type") in NOTIFICATION_REGISTRY
        else "Open",
        "channels": row.get("channels") or [],
        "payload": payload,
        "createdAt": row["created_at"].isoformat() if hasattr(row.get("created_at"), "isoformat") else str(row.get("created_at")),
    }


@router.get("")
async def get_notifications(
    limit: int = Query(default=50, ge=1, le=100),
    token: dict = Depends(verify_firebase_token),
) -> dict[str, Any]:
    async with tenant_session(token["uid"]) as conn:
        rows = await list_notifications(conn, recipient_uid=token["uid"], limit=limit)
    return {"notifications": [_serialize(row) for row in rows]}


@router.get("/stream")
async def stream_notifications(
    limit: int = Query(default=50, ge=1, le=100),
    token: dict = Depends(verify_firebase_token),
) -> StreamingResponse:
    async def stream():
        async with tenant_session(token["uid"]) as conn:
            rows = await list_notifications(conn, recipient_uid=token["uid"], limit=limit)
        yield f"event: snapshot\ndata: {json.dumps({'notifications': [_serialize(row) for row in rows]})}\n\n"
        yield f"event: heartbeat\ndata: {json.dumps({'status': 'idle'})}\n\n"

    return StreamingResponse(stream(), media_type="text/event-stream")


@router.post("/{notification_id}/signal")
async def signal_notification(
    notification_id: str,
    req: SignalRequest,
    token: dict = Depends(verify_firebase_token),
) -> dict[str, Any]:
    async with tenant_session(token["uid"]) as conn:
        try:
            return await record_signal(
                conn,
                recipient_uid=token["uid"],
                notification_id=notification_id,
                signal=req.signal,
                metadata=req.metadata,
            )
        except KeyError as exc:
            raise HTTPException(status_code=404, detail="notification_not_found") from exc


@router.post("/test")
async def send_test_notification(
    req: TestNotificationRequest,
    token: dict = Depends(verify_firebase_token),
) -> dict[str, Any]:
    if req.notification_type not in NOTIFICATION_REGISTRY:
        raise HTTPException(status_code=400, detail="unknown_notification_type")
    payload_by_type: dict[str, dict[str, Any]] = {
        "source_ingest_complete": {
            "case_id": req.case_id,
            "source_id": "test-source",
            "source_title": "Test source",
            "candidates_count": 12,
            "embeddings_count": 40,
            "duration": 3.2,
        },
        "source_ingest_failed": {
            "case_id": req.case_id,
            "source_id": "test-source",
            "source_title": "Test source",
            "error_class": "SyntheticTest",
            "retry_count": 3,
        },
        "candidates_ready_batch": {"case_id": req.case_id, "count": 12, "primitives": ["Actor", "Claim"]},
        "thread_closed_memified": {
            "case_id": req.case_id,
            "thread_id": "test-thread",
            "memory_coverage_before": 0.2,
            "memory_coverage_after": 0.4,
        },
        "briefing_exported": {
            "case_id": req.case_id,
            "briefing_id": "test-briefing",
            "format": "pdf",
            "download_url": f"/app/workbench/{req.case_id}?chapter=boardroom",
        },
    }
    payload = payload_by_type.get(req.notification_type)
    if payload is None:
        payload = {"case_id": req.case_id, "run_id": "test-run", "recipe_id": "test", "judgment_summary": "Test notification", "cost": 0}
    async with tenant_session(token["uid"]) as conn:
        row = await notify(
            conn,
            recipient_uid=token["uid"],
            notification_type=req.notification_type,
            payload=payload,
            dedup_key=f"test:{req.notification_type}:{req.case_id}",
            case_id=req.case_id,
        )
    return {"notification": _serialize(row)}


@router.post("/dispatch")
async def dispatch_notification_deliveries(
    req: DispatchRequest,
    token: dict = Depends(verify_firebase_token),
) -> dict[str, Any]:
    async with tenant_session(token["uid"]) as conn:
        result = await dispatch_pending_deliveries(conn, recipient_uid=token["uid"], limit=req.limit)
    return {"dispatch": result}


@router.get("/registry")
async def notification_registry(token: dict = Depends(verify_firebase_token)) -> dict[str, Any]:
    _ = token
    return {
        "types": [
            {
                "type": spec.type,
                "category": spec.category.value,
                "urgency": spec.default_urgency.value,
                "channels": [channel.value for channel in spec.default_channels],
                "actionVerb": spec.action_verb,
                "description": spec.description,
            }
            for spec in NOTIFICATION_REGISTRY.values()
        ]
    }


@router.get("/preferences")
async def get_notification_preferences(token: dict = Depends(verify_firebase_token)) -> dict[str, Any]:
    async with tenant_session(token["uid"]) as conn:
        rows = await conn.fetch(
            """
            SELECT channels, per_type, quiet_hours, timezone, digest_time, do_not_disturb
            FROM notification_preferences
            WHERE owner_uid = %s AND recipient_uid = %s
            ORDER BY updated_at DESC
            LIMIT 1
            """,
            token["uid"],
            token["uid"],
        )
    if rows:
        return {"preferences": rows[0]}
    return {
        "preferences": {
            "channels": {"in_app": True, "email_digest": False, "email_immediate": False, "browser_push": False, "webhook": False},
            "per_type": {},
            "quiet_hours": {"enabled": False, "start": "22:00", "end": "07:00"},
            "timezone": "America/New_York",
            "digest_time": "08:00",
            "do_not_disturb": False,
        }
    }


@router.put("/preferences")
async def put_notification_preferences(
    req: PreferencesRequest,
    token: dict = Depends(verify_firebase_token),
) -> dict[str, Any]:
    async with tenant_session(token["uid"]) as conn:
        existing = await conn.fetch(
            """
            SELECT id
            FROM notification_preferences
            WHERE owner_uid = %s AND recipient_uid = %s AND workspace_id IS NULL
            ORDER BY updated_at DESC
            LIMIT 1
            """,
            token["uid"],
            token["uid"],
        )
        if existing:
            rows = await conn.fetch(
                """
                UPDATE notification_preferences
                SET channels = %s::jsonb,
                    per_type = %s::jsonb,
                    quiet_hours = %s::jsonb,
                    timezone = %s,
                    digest_time = %s,
                    do_not_disturb = %s,
                    updated_at = now()
                WHERE owner_uid = %s AND id = %s::uuid
                RETURNING channels, per_type, quiet_hours, timezone, digest_time, do_not_disturb
                """,
                req.channels,
                req.per_type,
                req.quiet_hours,
                req.timezone,
                req.digest_time,
                req.do_not_disturb,
                token["uid"],
                str(existing[0]["id"]),
            )
        else:
            rows = await conn.fetch(
                """
                INSERT INTO notification_preferences (
                  owner_uid, recipient_uid, channels, per_type, quiet_hours,
                  timezone, digest_time, do_not_disturb
                )
                VALUES (%s, %s, %s::jsonb, %s::jsonb, %s::jsonb, %s, %s, %s)
                RETURNING channels, per_type, quiet_hours, timezone, digest_time, do_not_disturb
                """,
                token["uid"],
                token["uid"],
                req.channels,
                req.per_type,
                req.quiet_hours,
                req.timezone,
                req.digest_time,
                req.do_not_disturb,
            )
    return {"preferences": rows[0]}
