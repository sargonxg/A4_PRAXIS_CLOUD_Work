from __future__ import annotations

from typing import TypedDict


class ModeratorState(TypedDict, total=False):
    deliberation_id: str
    question: str
    participant_ids: list[str]
    current_phase: str
    estimated_cost_usd: float
    cost_ceiling_usd: float
