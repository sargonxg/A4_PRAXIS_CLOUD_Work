from __future__ import annotations

from typing import TypedDict


class AnalystPersonaState(TypedDict, total=False):
    persona_id: str
    question: str
    phase: str
    case_id: str
    owner_uid: str
    contribution_id: str
