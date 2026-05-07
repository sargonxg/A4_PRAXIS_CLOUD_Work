"""Notification service for PRAXIS analyst-facing communication."""
from __future__ import annotations

import json
from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import UUID

from services.cognee_memory import CogneeSearchMode, MemoryScope, SearchAudit, search
from services.postgres import TenantConnection

from .delivery import dispatch_pending_deliveries, initial_channel_status
from .registry import NOTIFICATION_REGISTRY, NotificationChannel, NotificationUrgency, get_spec


DEBOUNCE_WINDOW = timedelta(minutes=5)


def _now() -> datetime:
    return datetime.now(UTC)


def _json(value: Any) -> str:
    return json.dumps(value, default=str)


def _title_for(notification_type: str, payload: dict[str, Any]) -> str:
    if notification_type == "source_ingest_complete":
        return f"{payload['candidates_count']} candidates ready for review"
    if notification_type == "source_ingest_failed":
        return f"Source ingest failed: {payload['source_title']}"
    if notification_type == "candidates_ready_batch":
        return f"{payload['count']} ontology candidates ready"
    if notification_type == "dedup_suggestion_ready":
        return f"{payload['group_count']} duplicate groups may be ready"
    if notification_type == "thread_idle_nudge":
        return "Research thread has been idle"
    if notification_type == "thread_closed_memified":
        return "Research thread saved to memory"
    if notification_type == "recipe_complete":
        return f"{payload['recipe_id']} completed"
    if notification_type == "briefing_exported":
        return f"{payload['format'].upper()} briefing export ready"
    if notification_type == "budget_warning":
        return "Token budget is at 80%"
    if notification_type == "budget_paused":
        return "Token budget paused this case"
    if notification_type == "cognee_degraded":
        return "Cognee queue needs attention"
    if notification_type == "ontology_update_available":
        return f"Ontology update available: {payload['slug']}"
    if notification_type == "ontology_gap_proposed":
        return f"Ontology gap proposed: {payload['slug']}"
    if notification_type == "workspace_shared":
        return f"{payload['sharer_name']} shared a workspace"
    if notification_type == "memo_comment":
        return f"{payload['commenter_name']} commented on a memo"
    if notification_type == "case_milestone":
        return "Case milestone reached"
    return get_spec(notification_type).description


def _body_for(notification_type: str, payload: dict[str, Any]) -> str:
    if notification_type == "source_ingest_complete":
        return f"{payload['source_title']} finished with {payload['embeddings_count']} embeddings."
    if notification_type == "source_ingest_failed":
        return f"{payload['error_class']} after {payload['retry_count']} retries."
    if notification_type == "recipe_complete":
        return payload["judgment_summary"][:280]
    if notification_type == "briefing_exported":
        return "The exported work product is ready."
    if notification_type == "cognee_degraded":
        return f"{payload['queue_depth']} pending writes. Last failure: {payload['last_failure_reason']}"
    return get_spec(notification_type).description


async def _preferences(conn: TenantConnection, recipient_uid: str) -> dict[str, Any]:
    rows = await conn.fetch(
        """
        SELECT channels, event_types, quiet_hours, do_not_disturb, timezone, per_type
        FROM notification_preferences
        WHERE owner_uid = %s AND recipient_uid = %s
        ORDER BY updated_at DESC
        LIMIT 1
        """,
        recipient_uid,
        recipient_uid,
    )
    return rows[0] if rows else {}


def _preference_mode(prefs: dict[str, Any], notification_type: str) -> str:
    per_type = prefs.get("per_type") or prefs.get("event_types") or {}
    value = per_type.get(notification_type)
    if isinstance(value, str):
        return value
    if isinstance(value, dict):
        return str(value.get("mode") or value.get("urgency") or "default")
    return "default"


def _quiet_hours_active(prefs: dict[str, Any], now: datetime) -> bool:
    quiet = prefs.get("quiet_hours") or {}
    if not quiet or prefs.get("do_not_disturb") is True:
        return bool(prefs.get("do_not_disturb") is True)
    if quiet.get("enabled") is not True:
        return False
    start = str(quiet.get("start") or "")
    end = str(quiet.get("end") or "")
    current = now.strftime("%H:%M")
    if start <= end:
        return start <= current < end
    return current >= start or current < end


async def notify(
    conn: TenantConnection,
    *,
    recipient_uid: str,
    notification_type: str,
    payload: dict[str, Any],
    dedup_key: str,
    workspace_id: str | None = None,
    case_id: str | None = None,
) -> dict[str, Any]:
    spec = get_spec(notification_type)
    parsed = spec.payload_model.model_validate(payload)
    payload_dict = parsed.model_dump()
    case_id = case_id or payload_dict.get("case_id")
    now = _now()
    prefs = await _preferences(conn, recipient_uid)
    preference_mode = _preference_mode(prefs, notification_type)
    muted = preference_mode == "off"
    quiet = _quiet_hours_active(prefs, now)
    state = "dismissed" if muted else ("pending" if quiet else "delivered")
    channels = [
        {"channel": channel.value, "status": initial_channel_status(channel.value, muted=muted, quiet=quiet)}
        for channel in spec.default_channels
    ]
    if preference_mode == "digest":
        state = "pending"
        channels = [{"channel": NotificationChannel.EMAIL_DIGEST.value, "status": "queued"}]
    elif preference_mode == "immediate" and NotificationChannel.IN_APP not in spec.default_channels:
        channels = [{"channel": NotificationChannel.IN_APP.value, "status": "delivered"}] + channels

    existing = await conn.fetch(
        """
        SELECT id, payload, created_at
        FROM notifications
        WHERE owner_uid = %s
          AND recipient_uid = %s
          AND type = %s
          AND dedup_key = %s
          AND state IN ('pending','delivered')
          AND created_at >= now() - interval '5 minutes'
        ORDER BY created_at DESC
        LIMIT 1
        """,
        recipient_uid,
        recipient_uid,
        notification_type,
        dedup_key,
    )
    if existing:
        prior = existing[0].get("payload") or {}
        bundled = {**prior, **payload_dict, "bundle_count": int(prior.get("bundle_count") or 1) + 1}
        rows = await conn.fetch(
            """
            UPDATE notifications
            SET payload = %s::jsonb,
                title = %s,
                body = %s,
                channels = %s::jsonb
            WHERE owner_uid = %s AND id = %s::uuid
            RETURNING *
            """,
            _json(bundled),
            _title_for(notification_type, bundled),
            _body_for(notification_type, bundled),
            _json(channels),
            recipient_uid,
            str(existing[0]["id"]),
        )
        row = rows[0]
        decision = "bundled"
    else:
        rows = await conn.fetch(
            """
            INSERT INTO notifications (
              owner_uid, recipient_uid, workspace_id, case_id, event_type, type,
              category, urgency, channel, channels, title, body, status, state,
              payload, dedup_key, action_url, delivered_at, expires_at
            )
            VALUES (
              %s, %s, %s, %s, %s, %s,
              %s, %s, 'in_app', %s::jsonb, %s, %s, %s, %s,
              %s::jsonb, %s, %s, %s, %s
            )
            RETURNING *
            """,
            recipient_uid,
            recipient_uid,
            workspace_id,
            case_id,
            notification_type,
            notification_type,
            spec.category.value,
            spec.default_urgency.value,
            _json(channels),
            _title_for(notification_type, payload_dict),
            _body_for(notification_type, payload_dict),
            state,
            state,
            _json(payload_dict),
            dedup_key,
            spec.action_url(payload_dict),
            None if state == "pending" else now,
            now + timedelta(days=30),
        )
        row = rows[0]
        decision = "created"

    await conn.execute(
        """
        INSERT INTO workspace_orchestrator_log (
          owner_uid, case_id, surface_key, event_type, status, payload
        )
        VALUES (%s, %s, 'notifications', 'notify_decision', %s, %s::jsonb)
        """,
        recipient_uid,
        case_id or "global",
        "idle" if state != "pending" else "working",
        {
            "notificationId": str(row["id"]),
            "type": notification_type,
            "dedupKey": dedup_key,
            "decision": decision,
            "state": state,
            "preferenceMode": preference_mode,
            "quietHours": quiet,
            "channels": channels,
        },
    )
    return dict(row)


async def list_notifications(conn: TenantConnection, *, recipient_uid: str, limit: int = 50) -> list[dict[str, Any]]:
    return await conn.fetch(
        """
        SELECT *
        FROM notifications
        WHERE owner_uid = %s
          AND recipient_uid = %s
          AND state NOT IN ('dismissed','expired')
        ORDER BY created_at DESC
        LIMIT %s
        """,
        recipient_uid,
        recipient_uid,
        limit,
    )


async def record_signal(
    conn: TenantConnection,
    *,
    recipient_uid: str,
    notification_id: str,
    signal: str,
    metadata: dict[str, Any] | None = None,
) -> dict[str, Any]:
    rows = await conn.fetch(
        "SELECT * FROM notifications WHERE owner_uid = %s AND recipient_uid = %s AND id = %s::uuid",
        recipient_uid,
        recipient_uid,
        notification_id,
    )
    if not rows:
        raise KeyError("notification_not_found")
    notification = rows[0]
    timestamp_column = {
        "read": "read_at",
        "acted": "acted_at",
        "dismissed": "dismissed_at",
        "ignored": None,
    }.get(signal)
    new_state = {"read": "read", "acted": "acted", "dismissed": "dismissed"}.get(signal, notification["state"])
    if timestamp_column:
        await conn.execute(
            f"UPDATE notifications SET {timestamp_column} = now(), state = %s WHERE owner_uid = %s AND id = %s::uuid",
            new_state,
            recipient_uid,
            notification_id,
        )
    await conn.execute(
        """
        INSERT INTO notification_signals (
          owner_uid, recipient_uid, notification_id, type, signal, dedup_key, metadata
        )
        VALUES (%s, %s, %s::uuid, %s, %s, %s, %s::jsonb)
        """,
        recipient_uid,
        recipient_uid,
        notification_id,
        notification["type"],
        signal,
        notification.get("dedup_key"),
        metadata or {},
    )
    if signal in {"acted", "dismissed"} and notification.get("case_id"):
        try:
            scope = MemoryScope(owner_uid=recipient_uid, case_id=notification["case_id"])
            await search(
                scope=scope,
                query=f"notification feedback {notification['type']} {signal}",
                mode=CogneeSearchMode.INSIGHTS,
                limit=1,
                signal=notification["type"],
                positive=signal == "acted",
                audit=SearchAudit(
                    mode=CogneeSearchMode.INSIGHTS,
                    save_interaction=True,
                    surface_key="notifications.feedback",
                ),
            )
        except Exception:
            # Feedback should never block the user's notification action.
            pass
    return {"ok": True, "notificationId": notification_id, "signal": signal}


__all__ = [
    "NOTIFICATION_REGISTRY",
    "NotificationUrgency",
    "notify",
    "list_notifications",
    "record_signal",
    "dispatch_pending_deliveries",
]
