"""Forced-displacement data points layered on the base ACO primitives."""
from __future__ import annotations

from typing import ClassVar

from services.cognee_aco_models.base import Actor, Claim, Commitment, Constraint, Event


class DisplacedGroup(Actor):
    origin_area: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "origin_area"]}


class HostCommunity(Actor):
    host_area: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "host_area"]}


class ReturnConstraint(Constraint):
    constraint_type: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "constraint_type", "provenance"]}


class ProtectionClaim(Claim):
    protection_issue: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "protection_issue", "source_quote"]}


class Route(Constraint):
    route_name: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "route_name", "provenance"]}


class CrossingEvent(Event):
    crossing_point: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "crossing_point", "valid_from"]}


class DurableSolutionCommitment(Commitment):
    solution_type: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "solution_type", "promisor"]}


__all__ = [
    "DisplacedGroup",
    "HostCommunity",
    "ReturnConstraint",
    "ProtectionClaim",
    "Route",
    "CrossingEvent",
    "DurableSolutionCommitment",
]
