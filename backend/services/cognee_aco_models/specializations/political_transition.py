"""Political-transition data points layered on the base ACO primitives."""
from __future__ import annotations

from typing import ClassVar

from services.cognee_aco_models.base import Actor, Claim, Commitment, Event


class TransitionalAuthority(Actor):
    mandate_source: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "mandate_source"]}


class ElectoralActor(Actor):
    constituency: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "constituency"]}


class LegitimacyClaim(Claim):
    legitimacy_basis: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "legitimacy_basis", "source_quote"]}


class ConstitutionalMilestone(Event):
    milestone_type: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "milestone_type", "valid_from"]}


class PowerSharingCommitment(Commitment):
    allocation: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "allocation", "promisor"]}


class InstitutionalReformEvent(Event):
    institution: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "institution", "valid_from"]}


__all__ = [
    "TransitionalAuthority",
    "ElectoralActor",
    "LegitimacyClaim",
    "ConstitutionalMilestone",
    "PowerSharingCommitment",
    "InstitutionalReformEvent",
]
