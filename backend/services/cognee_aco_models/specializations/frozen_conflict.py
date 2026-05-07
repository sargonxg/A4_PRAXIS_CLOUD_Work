"""Frozen-conflict data points layered on the base ACO primitives."""
from __future__ import annotations

from typing import ClassVar

from services.cognee_aco_models.base import Actor, Claim, Commitment, Constraint, Event


class DeFactoAuthority(Actor):
    claimed_jurisdiction: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "claimed_jurisdiction"]}


class AdministrativeBoundary(Constraint):
    boundary_kind: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "boundary_kind", "provenance"]}


class FrozenLineOfContact(Constraint):
    monitoring_status: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "monitoring_status"]}


class RecognitionClaim(Claim):
    recognized_by: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "recognized_by", "source_quote"]}


class StatusNegotiation(Event):
    format: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "valid_from", "format"]}


class MonitoringMechanism(Commitment):
    mandate: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "mandate", "promisor"]}


__all__ = [
    "DeFactoAuthority",
    "AdministrativeBoundary",
    "FrozenLineOfContact",
    "RecognitionClaim",
    "StatusNegotiation",
    "MonitoringMechanism",
]
