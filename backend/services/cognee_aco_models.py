"""ACO DataPoint shapes for Cognee cognify runs.

These Pydantic models intentionally mirror PRAXIS ACO primitives without
granting Cognee permission to write canonical graph tables. Cognee output stays
probabilistic until the review/promotion bridge accepts it.
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, Field


class ACODataPoint(BaseModel):
    case_id: str
    owner_uid: str
    label: str
    description: str | None = None
    confidence: float = Field(default=0.5, ge=0.0, le=0.6)
    synthesized: bool = True
    provenance: dict[str, Any] = Field(default_factory=dict)


class Situation(ACODataPoint):
    primitive: Literal["Situation"] = "Situation"
    what_is_happening: str
    why_it_matters: str
    what_would_change_the_line: str
    policy_question: str


class Actor(ACODataPoint):
    primitive: Literal["Actor"] = "Actor"
    subtype: str
    role: str | None = None


class Event(ACODataPoint):
    primitive: Literal["Event"] = "Event"
    valid_from: datetime
    valid_to: datetime | None = None


class Claim(ACODataPoint):
    primitive: Literal["Claim"] = "Claim"
    layer: Literal["Source", "Claim", "Evidence", "Verdict"] = "Claim"
    polarity: Literal["supports", "contests", "neutral"] = "neutral"


class Constraint(ACODataPoint):
    primitive: Literal["Constraint"] = "Constraint"
    constraint_type: str
    source_ref: str


class Commitment(ACODataPoint):
    primitive: Literal["Commitment"] = "Commitment"
    actor_label: str
    commitment_type: str


class Position(ACODataPoint):
    primitive: Literal["Position"] = "Position"
    held_by_actor: str


class Interest(ACODataPoint):
    primitive: Literal["Interest"] = "Interest"
    actor_label: str
    salience: Literal["low", "medium", "high"] = "medium"


ACO_COGNEE_DATA_POINTS = [
    Situation,
    Actor,
    Event,
    Claim,
    Constraint,
    Commitment,
    Position,
    Interest,
]
