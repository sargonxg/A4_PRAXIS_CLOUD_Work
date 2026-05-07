"""Sanctions and economic-statecraft data points layered on the base ACO primitives."""
from __future__ import annotations

from typing import ClassVar

from services.cognee_aco_models.base import Actor, Claim, Commitment, Constraint, Event


class SanctionedActor(Actor):
    designation_basis: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "designation_basis"]}


class SanctionsMeasure(Constraint):
    measure_type: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "measure_type", "provenance"]}


class EvasionRoute(Constraint):
    route_type: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "route_type", "provenance"]}


class EconomicPressureClaim(Claim):
    pressure_channel: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "pressure_channel", "source_quote"]}


class DesignationEvent(Event):
    authority: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "authority", "valid_from"]}


class ComplianceCommitment(Commitment):
    reporting_line: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "reporting_line", "promisor"]}


__all__ = [
    "SanctionedActor",
    "SanctionsMeasure",
    "EvasionRoute",
    "EconomicPressureClaim",
    "DesignationEvent",
    "ComplianceCommitment",
]
