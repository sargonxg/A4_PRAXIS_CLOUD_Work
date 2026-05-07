"""Humanitarian-crisis data points layered on the base ACO primitives."""
from __future__ import annotations

from typing import ClassVar

from services.cognee_aco_models.base import Actor, Claim, Commitment, Constraint, Event


class AffectedPopulation(Actor):
    population_group: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "population_group"]}


class AccessCorridor(Constraint):
    route: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "route", "provenance"]}


class ProtectionRisk(Claim):
    risk_type: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "risk_type", "source_quote"]}


class NeedsAssessment(Claim):
    sector: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "sector", "source_quote"]}


class DeliveryConstraint(Constraint):
    bottleneck: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "bottleneck", "provenance"]}


class DisplacementEvent(Event):
    estimated_people: int | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "valid_from", "location"]}


class AidDeliveryCommitment(Commitment):
    delivery_window: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "promisor", "delivery_window"]}


__all__ = [
    "AffectedPopulation",
    "AccessCorridor",
    "ProtectionRisk",
    "NeedsAssessment",
    "DeliveryConstraint",
    "DisplacementEvent",
    "AidDeliveryCommitment",
]
