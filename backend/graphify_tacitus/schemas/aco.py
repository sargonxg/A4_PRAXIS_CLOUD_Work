"""ACO — TACITUS Agentic Conflict Ontology Pydantic v2 models.

8 conflict primitives, each extending ACONode with type-specific fields.
Confidence levels track how each entity was sourced.
"""
from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, Field


class ConfidenceLevel(str, Enum):
    EXTRACTED = "EXTRACTED"    # Directly stated in source
    INFERRED = "INFERRED"      # Reasonable deduction from source
    AMBIGUOUS = "AMBIGUOUS"    # Uncertain — multiple interpretations
    ASSESSED = "ASSESSED"      # Analyst judgment / AI assessment


class PrimitiveType(str, Enum):
    Actor = "Actor"
    Claim = "Claim"
    Interest = "Interest"
    Constraint = "Constraint"
    Leverage = "Leverage"
    Commitment = "Commitment"
    Event = "Event"
    Narrative = "Narrative"


class ACONode(BaseModel):
    id: str
    label: str
    primitive_type: PrimitiveType
    source_file: str = ""
    source_location: str = ""
    confidence: ConfidenceLevel = ConfidenceLevel.EXTRACTED
    tenant_id: str = ""
    situation_id: str = ""
    extracted_at: datetime = Field(default_factory=datetime.utcnow)
    metadata: dict[str, Any] = Field(default_factory=dict)


class Actor(ACONode):
    primitive_type: PrimitiveType = PrimitiveType.Actor
    actor_type: str = ""        # state / non-state / individual / institution / armed_group
    affiliation: str = ""
    capabilities: list[str] = Field(default_factory=list)
    stated_position: str = ""


class Claim(ACONode):
    primitive_type: PrimitiveType = PrimitiveType.Claim
    claim_type: str = ""        # territorial / legal / political / economic / identity
    content: str = ""
    legitimacy_basis: str = ""


class Interest(ACONode):
    primitive_type: PrimitiveType = PrimitiveType.Interest
    interest_type: str = ""     # stated / unstated / security / economic / identity / survival
    salience: float = 0.5       # 0–1
    is_negotiable: bool = True


class Constraint(ACONode):
    primitive_type: PrimitiveType = PrimitiveType.Constraint
    constraint_type: str = ""   # legal / political / resource / temporal / normative
    severity: str = "soft"      # hard / soft
    imposed_by: str = ""


class Leverage(ACONode):
    primitive_type: PrimitiveType = PrimitiveType.Leverage
    leverage_type: str = ""     # military / economic / diplomatic / informational / moral
    holder: str = ""
    target: str = ""
    effectiveness: float = 0.5  # 0–1
    sustainability: str = ""


class Commitment(ACONode):
    primitive_type: PrimitiveType = PrimitiveType.Commitment
    commitment_type: str = ""   # ceasefire / treaty / verbal / written / binding
    status: str = "pending"     # active / violated / expired / pending
    parties: list[str] = Field(default_factory=list)
    date_made: str = ""


class Event(ACONode):
    primitive_type: PrimitiveType = PrimitiveType.Event
    event_type: str = ""        # military / diplomatic / humanitarian / political / protest
    date: str = ""
    location: str = ""
    casualties: int | None = None
    escalation_impact: float = 0.0  # -1 (de-escalation) to +1 (escalation)


class Narrative(ACONode):
    primitive_type: PrimitiveType = PrimitiveType.Narrative
    narrative_type: str = ""    # media / propaganda / historical / identity / victimhood
    framing: str = ""
    propagated_by: str = ""
    reach: str = "local"        # local / national / international


# Map primitive_type string → model class for deserialization
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
    cls = ACO_TYPE_MAP.get(ptype, ACONode)
    return cls(**data)
