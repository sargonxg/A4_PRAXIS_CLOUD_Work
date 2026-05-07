from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import UTC, datetime
from typing import Any, Literal
from uuid import uuid4


WorkspaceStatus = Literal["idle", "working", "paused", "error"]


@dataclass(frozen=True)
class WorkspaceEvent:
    case_id: str
    surface_key: str
    status: WorkspaceStatus
    message: str
    payload: dict[str, Any] = field(default_factory=dict)
    id: str = field(default_factory=lambda: uuid4().hex)
    created_at: str = field(default_factory=lambda: datetime.now(UTC).isoformat())

    def to_api(self) -> dict[str, Any]:
        body = asdict(self)
        body["caseId"] = body.pop("case_id")
        body["surfaceKey"] = body.pop("surface_key")
        body["createdAt"] = body.pop("created_at")
        return body


def orchestrator_heartbeat(case_id: str, surface_key: str = "workspace") -> WorkspaceEvent:
    return WorkspaceEvent(
        case_id=case_id,
        surface_key=surface_key,
        status="idle",
        message="Workspace orchestrator is idle.",
    )
