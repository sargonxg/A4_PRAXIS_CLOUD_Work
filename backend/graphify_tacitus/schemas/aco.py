# GENERATED FILE - DO NOT EDIT.
# Source: schemas/conflict-grammar-v1.json
# Regenerate with: npm run schema:gen
from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


CONFLICT_GRAMMAR_VERSION = "1.0.0"


class ConfidenceLevel(str, Enum):
    extracted = "EXTRACTED"  # Directly stated in the source text.
    inferred = "INFERRED"  # Reasonable deduction from explicit text.
    ambiguous = "AMBIGUOUS"  # Multiple interpretations possible; flag for analyst review.
    assessed = "ASSESSED"  # Analyst or AI judgment based on pattern recognition.


class PrimitiveType(str, Enum):
    actor = "Actor"
    claim = "Claim"
    interest = "Interest"
    constraint = "Constraint"
    leverage = "Leverage"
    commitment = "Commitment"
    event = "Event"
    narrative = "Narrative"


CORE_PRIMITIVES = {
    PrimitiveType.actor,
    PrimitiveType.claim,
    PrimitiveType.interest,
    PrimitiveType.constraint,
    PrimitiveType.leverage,
    PrimitiveType.commitment,
    PrimitiveType.event,
    PrimitiveType.narrative,
}

EXTENDED_PRIMITIVES: set[PrimitiveType] = set()


class SourceSpan(BaseModel):
    documentId: str = ""
    charStart: int = Field(default=0, ge=0)
    charEnd: int = Field(default=0, ge=0)
    excerpt: str = Field(default="", max_length=500)
    retrievedAt: str = ""
    retrievalMethod: str = "manual"


class ACONode(BaseModel):
    model_config = ConfigDict(extra="allow")

    id: str
    label: str
    description: str = ""
    primitive_type: PrimitiveType = PrimitiveType.actor
    source_file: str = ""
    source_location: str = ""
    confidence: float = Field(default=0.75, ge=0, le=1)
    confidence_level: ConfidenceLevel = ConfidenceLevel.extracted
    extractor_version: str = CONFLICT_GRAMMAR_VERSION
    source_span: SourceSpan | None = None
    tenant_id: str = ""
    situation_id: str = ""
    extracted_at: datetime = Field(default_factory=datetime.utcnow)
    metadata: dict[str, Any] = Field(default_factory=dict)
    valid_from: str = ""
    valid_until: str = ""
    validFrom: str | None = None
    validTo: str | None = None
    assertedFrom: str | None = None
    assertedTo: str | None = None
    last_verified: str = ""
    provenance: list[str] = Field(default_factory=list)


class Actor(ACONode):
    primitive_type: PrimitiveType = PrimitiveType.actor
    actor_type: str = ""
    affiliation: str = ""
    capabilities: list[str] = Field(default_factory=list)
    stated_position: str = ""


class Claim(ACONode):
    primitive_type: PrimitiveType = PrimitiveType.claim
    claim_type: str = ""
    content: str = ""
    legitimacy_basis: str = ""


class Interest(ACONode):
    primitive_type: PrimitiveType = PrimitiveType.interest
    interest_type: str = ""
    salience: float = Field(default=0.5, ge=0, le=1)
    is_negotiable: bool = True


class Constraint(ACONode):
    primitive_type: PrimitiveType = PrimitiveType.constraint
    constraint_type: str = ""
    severity: str = "soft"
    imposed_by: str = ""


class Leverage(ACONode):
    primitive_type: PrimitiveType = PrimitiveType.leverage
    leverage_type: str = ""
    holder: str = ""
    target: str = ""
    effectiveness: float = Field(default=0.5, ge=0, le=1)
    sustainability: str = ""


class Commitment(ACONode):
    primitive_type: PrimitiveType = PrimitiveType.commitment
    commitment_type: str = ""
    status: str = "pending"
    parties: list[str] = Field(default_factory=list)
    date_made: str = ""


class Event(ACONode):
    primitive_type: PrimitiveType = PrimitiveType.event
    event_type: str = ""
    date: str = ""
    location: str = ""
    casualties: int | None = None
    escalation_impact: float = Field(default=0.0, ge=-1, le=1)


class Narrative(ACONode):
    primitive_type: PrimitiveType = PrimitiveType.narrative
    narrative_type: str = ""
    framing: str = ""
    propagated_by: str = ""
    reach: str = "local"


class ACOEdge(BaseModel):
    model_config = ConfigDict(extra="allow")

    source: str
    target: str
    relation: str
    confidence: float = Field(default=0.75, ge=0, le=1)
    confidence_level: ConfidenceLevel = ConfidenceLevel.extracted
    source_file: str = ""
    source_location: str = ""
    source_span: SourceSpan | None = None
    weight: float = 1.0
    tenant_id: str = ""
    situation_id: str = ""
    metadata: dict[str, Any] = Field(default_factory=dict)
    valid_from: str = ""
    valid_until: str = ""
    validFrom: str | None = None
    validTo: str | None = None
    assertedFrom: str | None = None
    assertedTo: str | None = None


ACO_TYPE_MAP: dict[str, type[ACONode]] = {
    "Actor": Actor,
    "Claim": Claim,
    "Interest": Interest,
    "Constraint": Constraint,
    "Leverage": Leverage,
    "Commitment": Commitment,
    "Event": Event,
    "Narrative": Narrative,
}


def make_aco_node(data: dict) -> ACONode:
    """Deserialize a dict into the correct ACONode subclass."""
    ptype = data.get("primitive_type", "Actor")
    cls = ACO_TYPE_MAP.get(ptype)
    payload = dict(data)
    if cls is None:
        payload.pop("primitive_type", None)
        cls = Actor
    return cls(**payload)
