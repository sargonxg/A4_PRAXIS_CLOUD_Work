"""Active-conflict data points layered on the base ACO primitives."""
from __future__ import annotations

from typing import ClassVar

from services.cognee_aco_models.base import Actor, Claim, Commitment, Constraint, Event


class State(Actor):
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "role", "subtype"]}


class NonStateArmedGroup(Actor):
    operating_area: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "operating_area"]}


class Frontline(Constraint):
    geography: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "geography", "provenance"]}


class TerritorialClaim(Claim):
    territory: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "territory", "source_quote"]}


class CeasefireCommitment(Commitment):
    monitoring_mechanism: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "promisor", "monitoring_mechanism"]}


class EscalationEvent(Event):
    trigger: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "valid_from", "trigger"]}


class HumanitarianAccessConstraint(Constraint):
    affected_population: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "affected_population", "provenance"]}


__all__ = [
    "State",
    "NonStateArmedGroup",
    "Frontline",
    "TerritorialClaim",
    "CeasefireCommitment",
    "EscalationEvent",
    "HumanitarianAccessConstraint",
]
