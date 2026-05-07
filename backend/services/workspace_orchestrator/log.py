from __future__ import annotations

from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from services.postgres import TenantConnection


async def log_orchestrator_event(
    conn: "TenantConnection",
    *,
    owner_uid: str,
    case_id: str,
    surface_key: str,
    event_type: str,
    status: str = "idle",
    payload: dict[str, Any] | None = None,
) -> None:
    await conn.execute(
        """
        INSERT INTO workspace_orchestrator_log (
          owner_uid, case_id, surface_key, event_type, status, payload
        )
        VALUES (%s, %s, %s, %s, %s, %s::jsonb)
        """,
        owner_uid,
        case_id,
        surface_key,
        event_type,
        status,
        payload or {},
    )
