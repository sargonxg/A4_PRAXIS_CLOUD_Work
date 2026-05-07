"""Strategic-competition data points layered on the base ACO primitives."""
from __future__ import annotations

from typing import ClassVar

from services.cognee_aco_models.base import Actor, Claim, Commitment, Constraint, Event, Leverage


class StrategicActor(Actor):
    theater: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "theater", "role"]}


class InfluenceAsset(Leverage):
    domain: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "domain", "holder"]}


class RedLine(Constraint):
    threshold: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "threshold", "provenance"]}


class DeterrenceClaim(Claim):
    deterrence_logic: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "deterrence_logic", "source_quote"]}


class AllianceCommitment(Commitment):
    partner: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "partner", "promisor"]}


class SignalingEvent(Event):
    signal_type: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "signal_type", "valid_from"]}


class EscalationLadder(Constraint):
    rung: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "rung", "provenance"]}


__all__ = [
    "StrategicActor",
    "InfluenceAsset",
    "RedLine",
    "DeterrenceClaim",
    "AllianceCommitment",
    "SignalingEvent",
    "EscalationLadder",
]
