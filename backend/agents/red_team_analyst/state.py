"""State contracts for the Red Team Analyst graph scaffold."""
from __future__ import annotations

from typing import Any, TypedDict


class RedTeamAnalystState(TypedDict, total=False):
    case_id: str
    owner_uid: str
    target_actor_id: str
    framing: str
    actor_context: dict[str, Any]
    safety_flags: list[str]
    report: dict[str, Any]
