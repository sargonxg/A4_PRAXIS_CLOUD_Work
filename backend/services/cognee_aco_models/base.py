"""Base PRAXIS ACO data points shared by every case ontology."""
from __future__ import annotations

from typing import ClassVar

from pydantic import BaseModel, ConfigDict, Field


class AcoDataPoint(BaseModel):
    model_config = ConfigDict(extra="allow")

    id: str | None = None
    name: str = Field(..., min_length=1, max_length=240)
    source_quote: str | None = Field(default=None, max_length=4_000)
    confidence: float = Field(default=0.5, ge=0, le=0.6)

    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "source_quote"]}


class Actor(AcoDataPoint):
    subtype: str | None = None
    role: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "subtype", "role"]}


class Claim(AcoDataPoint):
    layer: str = "Claim"
    claim_type: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "claim_type", "source_quote"]}


class Interest(AcoDataPoint):
    holder: str | None = None
    priority: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "holder", "priority"]}


class Constraint(AcoDataPoint):
    applies_to: str | None = None
    provenance: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "applies_to", "provenance"]}


class Leverage(AcoDataPoint):
    holder: str | None = None
    target: str | None = None
    mechanism: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "holder", "target", "mechanism"]}


class Commitment(AcoDataPoint):
    promisor: str | None = None
    beneficiary: str | None = None
    due_date: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "promisor", "beneficiary"]}


class Event(AcoDataPoint):
    valid_from: str | None = None
    valid_to: str | None = None
    location: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "valid_from", "location"]}


class Narrative(AcoDataPoint):
    speaker: str | None = None
    frame: str | None = None
    audience: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "speaker", "frame", "audience"]}


__all__ = [
    "Actor",
    "Claim",
    "Interest",
    "Constraint",
    "Leverage",
    "Commitment",
    "Event",
    "Narrative",
]
