"""Negotiation and mediation data points layered on the base ACO primitives."""
from __future__ import annotations

from typing import ClassVar

from services.cognee_aco_models.base import Actor, Commitment, Constraint, Event, Interest as BaseInterest


class Party(Actor):
    mandate: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "mandate", "role"]}


class Mediator(Actor):
    convening_authority: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "convening_authority"]}


class Position(BaseInterest):
    stated_demand: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "holder", "stated_demand"]}


class MediationInterest(BaseInterest):
    underlying_need: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "holder", "underlying_need"]}


class BATNA(Constraint):
    party: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "party", "provenance"]}


class ZOPA(Constraint):
    issue_area: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "issue_area"]}


class AgendaItem(Event):
    agenda_owner: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "agenda_owner", "valid_from"]}


class ConfidenceBuildingMeasure(Commitment):
    verification: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "verification", "promisor"]}


class MediationSession(Event):
    venue: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "venue", "valid_from"]}


__all__ = [
    "Party",
    "Mediator",
    "Position",
    "MediationInterest",
    "BATNA",
    "ZOPA",
    "AgendaItem",
    "ConfidenceBuildingMeasure",
    "MediationSession",
]
