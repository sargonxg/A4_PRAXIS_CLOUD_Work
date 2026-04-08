"""ACO — TACITUS Agentic Conflict Ontology v2.0 Pydantic v2 models.

14 conflict entity types grounded in established conflict analysis frameworks:

Core 8 Primitives (original):
  Actor, Claim, Interest, Constraint, Leverage, Commitment, Event, Narrative

Extended 6 Types (promoted to first-class):
  Institution, Norm, Resource, Risk, Policy, Grievance

Theoretical grounding:
  - Fisher-Ury (Getting to Yes): Position → Interest → Need hierarchy
  - Burton (Basic Human Needs): Grievance as unmet need driver
  - Glasl (Conflict Escalation): Event sequencing and escalation dynamics
  - Zartman (Ripeness Theory): Windows of opportunity via Commitment/Constraint
  - Stedman (Spoiler Theory): Actor typology and leverage dynamics
  - CAMEO (Conflict and Mediation Event Observations): Event classification
  - Lederach (Conflict Transformation): Multi-level actor/institution mapping
  - Galtung (Structural Violence): Resource/Institution/Norm triad

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
    # Core 8
    Actor = "Actor"
    Claim = "Claim"
    Interest = "Interest"
    Constraint = "Constraint"
    Leverage = "Leverage"
    Commitment = "Commitment"
    Event = "Event"
    Narrative = "Narrative"
    # Extended 6
    Institution = "Institution"
    Norm = "Norm"
    Resource = "Resource"
    Risk = "Risk"
    Policy = "Policy"
    Grievance = "Grievance"


# Subset of the 8 original primitives for backwards compatibility
CORE_PRIMITIVES = {
    PrimitiveType.Actor, PrimitiveType.Claim, PrimitiveType.Interest,
    PrimitiveType.Constraint, PrimitiveType.Leverage, PrimitiveType.Commitment,
    PrimitiveType.Event, PrimitiveType.Narrative,
}

EXTENDED_PRIMITIVES = {
    PrimitiveType.Institution, PrimitiveType.Norm, PrimitiveType.Resource,
    PrimitiveType.Risk, PrimitiveType.Policy, PrimitiveType.Grievance,
}


class ACONode(BaseModel):
    id: str
    label: str
    description: str = ""        # Human-readable description of this entity in context
    primitive_type: PrimitiveType
    source_file: str = ""
    source_location: str = ""
    confidence: ConfidenceLevel = ConfidenceLevel.EXTRACTED
    tenant_id: str = ""
    situation_id: str = ""
    extracted_at: datetime = Field(default_factory=datetime.utcnow)
    metadata: dict[str, Any] = Field(default_factory=dict)
    # Temporal fields for graph evolution
    valid_from: str = ""         # ISO date when entity became relevant
    valid_until: str = ""        # ISO date when entity ceased to be relevant (empty = ongoing)
    last_verified: str = ""      # ISO date of last source verification
    provenance: list[str] = Field(default_factory=list)  # Source URLs/references


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


# ── Extended 6 types (promoted to first-class in ACO v2.0) ────────────────


class Institution(ACONode):
    """Formal or informal structures that shape conflict dynamics.

    Grounded in Lederach's multi-level peacebuilding and Galtung's structural
    violence frameworks. Institutions include governments, courts, militaries,
    international organizations, tribal councils, and informal power structures.
    """
    primitive_type: PrimitiveType = PrimitiveType.Institution
    institution_type: str = ""   # government / judiciary / military / international_org / traditional / religious / civil_society
    jurisdiction: str = ""       # geographic or thematic scope
    legitimacy: str = "contested"  # legitimate / contested / illegitimate / transitional
    capacity: str = "functional"   # functional / degraded / collapsed / reforming
    parent_institution: str = ""   # hierarchical relationship


class Norm(ACONode):
    """Legal, customary, or ethical rules that constrain or enable behavior.

    Maps to Galtung's cultural violence framework and international humanitarian
    law (IHL). Norms include UN resolutions, treaties, customary law, religious
    edicts, and community rules of engagement.
    """
    primitive_type: PrimitiveType = PrimitiveType.Norm
    norm_type: str = ""          # legal / customary / religious / ethical / political / IHL
    binding_level: str = "soft"  # binding / soft / aspirational / contested
    enforcement: str = ""        # who enforces and how
    scope: str = "national"      # local / national / regional / international
    compliance: str = "partial"  # full / partial / violated / unenforced


class Resource(ACONode):
    """Tangible or intangible assets that fuel, sustain, or motivate conflict.

    Covers natural resources (oil, minerals, water, land), financial flows
    (aid, remittances, illicit finance), human resources (fighters, diaspora),
    and strategic assets (territory, infrastructure, trade routes).
    """
    primitive_type: PrimitiveType = PrimitiveType.Resource
    resource_type: str = ""      # natural / financial / human / strategic / informational
    control: str = ""            # who controls the resource
    contestation: str = ""       # how the resource is contested
    economic_value: str = ""     # relative economic significance
    scarcity: str = "moderate"   # abundant / moderate / scarce / depleted


class Risk(ACONode):
    """Identifiable threats to stability, life, or peace processes.

    Grounded in the INFORM Risk Index methodology combining hazard exposure,
    vulnerability, and coping capacity. Risks are forward-looking assessments
    of what could go wrong.
    """
    primitive_type: PrimitiveType = PrimitiveType.Risk
    risk_type: str = ""          # security / humanitarian / political / economic / environmental / social
    probability: str = "medium"  # high / medium / low
    impact: str = "medium"       # catastrophic / severe / moderate / minor
    timeframe: str = ""          # imminent / short-term / medium-term / long-term
    mitigating_factors: list[str] = Field(default_factory=list)
    aggravating_factors: list[str] = Field(default_factory=list)


class Policy(ACONode):
    """Deliberate courses of action by actors to address or exploit conflict.

    Covers sanctions, peace plans, military strategies, humanitarian corridors,
    transitional justice mechanisms, DDR programs, and diplomatic initiatives.
    Maps to Putnam's two-level game theory (domestic vs. international).
    """
    primitive_type: PrimitiveType = PrimitiveType.Policy
    policy_type: str = ""        # sanctions / peace_plan / military / humanitarian / governance / economic
    status: str = "proposed"     # proposed / active / suspended / expired / failed
    sponsor: str = ""            # who is behind this policy
    target: str = ""             # who is affected
    effectiveness: str = ""      # assessment of impact


class Grievance(ACONode):
    """Perceived injustices or unmet needs that drive conflict motivation.

    Rooted in Burton's Basic Human Needs theory and Gurr's relative deprivation
    theory. Grievances are the subjective experience of harm, injustice, or
    deprivation that motivates actors to engage in conflict. Distinguished from
    Interest by its emotional/identity valence and from Claim by its experiential
    basis rather than legal/political framing.
    """
    primitive_type: PrimitiveType = PrimitiveType.Grievance
    grievance_type: str = ""     # identity / economic / political / historical / territorial / security
    affected_group: str = ""     # who experiences the grievance
    root_cause: str = ""         # underlying structural cause
    intensity: str = "moderate"  # latent / moderate / acute / existential
    addressed: bool = False      # whether any process is addressing this
    linked_needs: list[str] = Field(default_factory=list)  # Burton's needs: security, identity, recognition, participation


# Map primitive_type string → model class for deserialization
ACO_TYPE_MAP: dict[str, type[ACONode]] = {
    # Core 8
    "Actor": Actor,
    "Claim": Claim,
    "Interest": Interest,
    "Constraint": Constraint,
    "Leverage": Leverage,
    "Commitment": Commitment,
    "Event": Event,
    "Narrative": Narrative,
    # Extended 6
    "Institution": Institution,
    "Norm": Norm,
    "Resource": Resource,
    "Risk": Risk,
    "Policy": Policy,
    "Grievance": Grievance,
}


def make_aco_node(data: dict) -> ACONode:
    """Deserialize a dict into the correct ACONode subclass."""
    ptype = data.get("primitive_type", "Actor")
    cls = ACO_TYPE_MAP.get(ptype, ACONode)
    return cls(**data)
