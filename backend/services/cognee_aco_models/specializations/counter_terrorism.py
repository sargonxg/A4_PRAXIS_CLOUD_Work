"""Counter-terrorism data points layered on the base ACO primitives."""
from __future__ import annotations

from typing import ClassVar

from services.cognee_aco_models.base import Actor, Claim, Constraint, Event, Leverage


class Cell(Actor):
    locality: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "locality"]}


class NetworkNode(Actor):
    network_role: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "network_role"]}


class ThreatClaim(Claim):
    threat_vector: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "threat_vector", "source_quote"]}


class FinancingChannel(Leverage):
    channel_type: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "channel_type", "target"]}


class OperationalCapability(Constraint):
    capability_area: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "capability_area", "provenance"]}


class DesignationEvent(Event):
    authority: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "authority", "valid_from"]}


class DisruptionOperation(Event):
    operation_type: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "operation_type", "valid_from"]}


__all__ = [
    "Cell",
    "NetworkNode",
    "ThreatClaim",
    "FinancingChannel",
    "OperationalCapability",
    "DesignationEvent",
    "DisruptionOperation",
]
