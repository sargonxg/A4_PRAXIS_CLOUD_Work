"""ACO v2.0 relationship vocabulary — 72 typed edges between conflict primitives.

ACO_RELATIONSHIPS maps relationship name → (source_primitive, target_primitive).
Used for validation, Neo4j/FalkorDB label generation, and relationship type checking.

Covers all 14 entity types:
  Core 8:    Actor, Claim, Interest, Constraint, Leverage, Commitment, Event, Narrative
  Extended 6: Institution, Norm, Resource, Risk, Policy, Grievance

Theoretical grounding for relationship types:
  - Fisher-Ury: Claim→Interest→Need/Grievance hierarchy
  - Glasl: Event→Event escalation/de-escalation chains
  - Lederach: Actor→Institution multi-level mapping
  - Galtung: Resource/Institution/Norm structural violence triad
  - Stedman: Actor spoiler dynamics via Leverage/Commitment
  - CAMEO: Event classification and actor-event relationships
"""
from pydantic import BaseModel, Field

from .aco import ConfidenceLevel


class ACOEdge(BaseModel):
    source: str
    target: str
    relation: str
    confidence: ConfidenceLevel = ConfidenceLevel.EXTRACTED
    source_file: str = ""
    source_location: str = ""
    weight: float = 1.0
    tenant_id: str = ""
    situation_id: str = ""
    metadata: dict = Field(default_factory=dict)
    # Temporal fields for edge evolution
    valid_from: str = ""
    valid_until: str = ""


# 72 typed relationships: (source_primitive, target_primitive)
ACO_RELATIONSHIPS: dict[str, tuple[str, str]] = {

    # ── Actor → * (12 original + 6 new) ──────────────────────────────────────
    "claims":                    ("Actor", "Claim"),
    "has_interest":              ("Actor", "Interest"),
    "faces_constraint":          ("Actor", "Constraint"),
    "holds_leverage":            ("Actor", "Leverage"),
    "made_commitment":           ("Actor", "Commitment"),
    "participated_in":           ("Actor", "Event"),
    "propagates_narrative":      ("Actor", "Narrative"),
    "allied_with":               ("Actor", "Actor"),
    "opposes":                   ("Actor", "Actor"),
    "mediates_between":          ("Actor", "Actor"),
    "sponsors":                  ("Actor", "Actor"),
    "subordinate_to":            ("Actor", "Actor"),
    # New: Actor → Extended types
    "member_of":                 ("Actor", "Institution"),
    "controls_resource":         ("Actor", "Resource"),
    "subject_to_norm":           ("Actor", "Norm"),
    "expresses_grievance":       ("Actor", "Grievance"),
    "implements_policy":         ("Actor", "Policy"),
    "exposed_to_risk":           ("Actor", "Risk"),

    # ── Claim → * (5 original + 2 new) ──────────────────────────────────────
    "contradicts":               ("Claim", "Claim"),
    "supports_claim":            ("Claim", "Claim"),
    "based_on_interest":         ("Claim", "Interest"),
    "justified_by_narrative":    ("Claim", "Narrative"),
    "constrained_by":            ("Claim", "Constraint"),
    # New
    "rooted_in_grievance":       ("Claim", "Grievance"),
    "demands_resource":          ("Claim", "Resource"),

    # ── Interest → * (3 original + 2 new) ───────────────────────────────────
    "conflicts_with":            ("Interest", "Interest"),
    "aligns_with":               ("Interest", "Interest"),
    "underlying_interest_of":    ("Interest", "Claim"),
    # New
    "driven_by_grievance":       ("Interest", "Grievance"),
    "requires_resource":         ("Interest", "Resource"),

    # ── Constraint → * (3 original + 2 new) ─────────────────────────────────
    "limits_leverage":           ("Constraint", "Leverage"),
    "blocks_commitment":         ("Constraint", "Commitment"),
    "imposed_by_event":          ("Constraint", "Event"),
    # New
    "imposed_by_institution":    ("Constraint", "Institution"),
    "derived_from_norm":         ("Constraint", "Norm"),

    # ── Leverage → * (3 original + 1 new) ───────────────────────────────────
    "targets":                   ("Leverage", "Actor"),
    "derived_from_event":        ("Leverage", "Event"),
    "undermined_by":             ("Leverage", "Constraint"),
    # New
    "based_on_resource":         ("Leverage", "Resource"),

    # ── Commitment → * (3 original + 2 new) ─────────────────────────────────
    "addresses_claim":           ("Commitment", "Claim"),
    "violated_by_event":         ("Commitment", "Event"),
    "supersedes":                ("Commitment", "Commitment"),
    # New
    "codified_in_norm":          ("Commitment", "Norm"),
    "brokered_by_institution":   ("Commitment", "Institution"),

    # ── Event → * (7 original + 3 new) ──────────────────────────────────────
    "triggered_by":              ("Event", "Event"),
    "escalates":                 ("Event", "Event"),
    "de_escalates":              ("Event", "Event"),
    "involves_actor":            ("Event", "Actor"),
    "affects_leverage":          ("Event", "Leverage"),
    "validates_narrative":       ("Event", "Narrative"),
    "contradicts_narrative":     ("Event", "Narrative"),
    # New
    "damages_resource":          ("Event", "Resource"),
    "triggers_risk":             ("Event", "Risk"),
    "violates_norm":             ("Event", "Norm"),

    # ── Narrative → * (5 original) ──────────────────────────────────────────
    "frames_event":              ("Narrative", "Event"),
    "justifies_claim":           ("Narrative", "Claim"),
    "undermines_claim":          ("Narrative", "Claim"),
    "competes_with":             ("Narrative", "Narrative"),
    "reinforces":                ("Narrative", "Narrative"),

    # ── Institution → * (new) ───────────────────────────────────────────────
    "governs":                   ("Institution", "Actor"),
    "enforces_norm":             ("Institution", "Norm"),
    "manages_resource":          ("Institution", "Resource"),
    "enacts_policy":             ("Institution", "Policy"),
    "parent_of":                 ("Institution", "Institution"),
    "competes_with_institution": ("Institution", "Institution"),

    # ── Norm → * (new) ──────────────────────────────────────────────────────
    "regulates":                 ("Norm", "Actor"),
    "protects_resource":         ("Norm", "Resource"),
    "mitigates_risk":            ("Norm", "Risk"),
    "conflicts_with_norm":       ("Norm", "Norm"),

    # ── Resource → * (new) ──────────────────────────────────────────────────
    "contested_by":              ("Resource", "Actor"),
    "fuels_grievance":           ("Resource", "Grievance"),
    "enables_leverage":          ("Resource", "Leverage"),

    # ── Risk → * (new) ─────────────────────────────────────────────────────
    "threatens_actor":           ("Risk", "Actor"),
    "threatens_commitment":      ("Risk", "Commitment"),
    "exacerbated_by":            ("Risk", "Event"),

    # ── Policy → * (new) ───────────────────────────────────────────────────
    "addresses_grievance":       ("Policy", "Grievance"),
    "addresses_risk":            ("Policy", "Risk"),
    "allocates_resource":        ("Policy", "Resource"),

    # ── Grievance → * (new) ────────────────────────────────────────────────
    "motivates_actor":           ("Grievance", "Actor"),
    "generates_claim":           ("Grievance", "Claim"),
    "escalated_by_event":        ("Grievance", "Event"),

    # ── Cross-type ──────────────────────────────────────────────────────────
    "semantically_similar_to":   ("*", "*"),
}


def normalize_relation(relation: str) -> str:
    """Normalize a relationship type to the canonical snake_case form.

    Handles common extraction issues:
    - UPPERCASE → lowercase (CLAIMS → claims)
    - Spaces → underscores (has interest → has_interest)
    - Hyphens → underscores (allied-with → allied_with)
    - Close matches via fuzzy lookup
    """
    normalized = relation.strip().lower().replace(" ", "_").replace("-", "_")
    if normalized in ACO_RELATIONSHIPS:
        return normalized
    # Try without leading/trailing underscores
    stripped = normalized.strip("_")
    if stripped in ACO_RELATIONSHIPS:
        return stripped
    return normalized


def validate_relation(relation: str, source_type: str, target_type: str) -> tuple[bool, str]:
    """Validate a relationship against the ACO vocabulary.

    Returns (is_valid, normalized_relation).
    Wildcards (*,*) always match via semantically_similar_to.
    """
    norm = normalize_relation(relation)
    if norm not in ACO_RELATIONSHIPS:
        return False, norm

    expected_source, expected_target = ACO_RELATIONSHIPS[norm]
    if expected_source == "*" and expected_target == "*":
        return True, norm
    if expected_source != "*" and expected_source != source_type:
        return False, norm
    if expected_target != "*" and expected_target != target_type:
        return False, norm
    return True, norm


# Relationship categories for UI grouping and analysis
RELATIONSHIP_CATEGORIES: dict[str, list[str]] = {
    "causal": [
        "triggered_by", "escalates", "de_escalates", "derived_from_event",
        "imposed_by_event", "generates_claim", "motivates_actor",
        "fuels_grievance", "escalated_by_event", "triggers_risk",
    ],
    "structural": [
        "member_of", "subordinate_to", "parent_of", "governs",
        "controls_resource", "manages_resource", "enforces_norm",
    ],
    "antagonistic": [
        "opposes", "contradicts", "conflicts_with", "undermines_claim",
        "undermined_by", "violated_by_event", "violates_norm",
        "competes_with", "competes_with_institution", "conflicts_with_norm",
    ],
    "cooperative": [
        "allied_with", "supports_claim", "aligns_with", "made_commitment",
        "addresses_claim", "brokered_by_institution", "reinforces",
        "addresses_grievance", "addresses_risk", "mitigates_risk",
    ],
    "foundational": [
        "has_interest", "claims", "based_on_interest", "underlying_interest_of",
        "rooted_in_grievance", "driven_by_grievance", "expresses_grievance",
        "requires_resource", "demands_resource",
    ],
}
