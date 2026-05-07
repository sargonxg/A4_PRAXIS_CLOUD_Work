"""Pydantic mirrors for PRAXIS ontology definitions."""
from __future__ import annotations

from typing import Literal

from pydantic import BaseModel

CorePrimitive = Literal[
    "Actor",
    "Claim",
    "Interest",
    "Constraint",
    "Leverage",
    "Commitment",
    "Event",
    "Narrative",
]


class OntologyNodeType(BaseModel):
    id: str
    label: str
    primitive: CorePrimitive
    description: str


class OntologyEdgeType(BaseModel):
    id: str
    label: str
    from_: list[CorePrimitive]
    to: list[CorePrimitive]
    description: str


class OntologyValidator(BaseModel):
    id: str
    label: str
    severity: Literal["info", "warn"]
    description: str


class CaseOntologyDefinition(BaseModel):
    id: str
    version: str
    label: str
    description: str
    domains: list[str]
    node_types: list[OntologyNodeType]
    edge_types: list[OntologyEdgeType]
    validators: list[OntologyValidator]
    recommended_tool_ids: list[str]
