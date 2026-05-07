"""Cyber and hybrid data points layered on the base ACO primitives."""
from __future__ import annotations

from typing import ClassVar

from services.cognee_aco_models.base import Actor, Claim, Commitment, Event


class ThreatActor(Actor):
    assessed_sponsor: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "assessed_sponsor"]}


class MalwareCampaign(Event):
    malware_family: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "malware_family", "valid_from"]}


class InfrastructureNode(Actor):
    infrastructure_type: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "infrastructure_type"]}


class AttributionClaim(Claim):
    attribution_basis: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "attribution_basis", "source_quote"]}


class HybridOperation(Event):
    operation_domain: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "operation_domain", "valid_from"]}


class IntrusionEvent(Event):
    target_system: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "target_system", "valid_from"]}


class ResilienceCommitment(Commitment):
    control_area: str | None = None
    metadata: ClassVar[dict[str, list[str]]] = {"index_fields": ["name", "control_area", "promisor"]}


__all__ = [
    "ThreatActor",
    "MalwareCampaign",
    "InfrastructureNode",
    "AttributionClaim",
    "HybridOperation",
    "IntrusionEvent",
    "ResilienceCommitment",
]
