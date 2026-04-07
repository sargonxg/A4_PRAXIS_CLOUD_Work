"""ACO relationship vocabulary — 42 typed edges between conflict primitives.

ACO_RELATIONSHIPS maps relationship name → (source_primitive, target_primitive).
Used for validation, Neo4j label generation, and relationship type checking.
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


# 42 typed relationships: (source_primitive, target_primitive)
ACO_RELATIONSHIPS: dict[str, tuple[str, str]] = {
    # Actor → *
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

    # Claim → *
    "contradicts":               ("Claim", "Claim"),
    "supports_claim":            ("Claim", "Claim"),
    "based_on_interest":         ("Claim", "Interest"),
    "justified_by_narrative":    ("Claim", "Narrative"),
    "constrained_by":            ("Claim", "Constraint"),

    # Interest → *
    "conflicts_with":            ("Interest", "Interest"),
    "aligns_with":               ("Interest", "Interest"),
    "underlying_interest_of":    ("Interest", "Claim"),

    # Constraint → *
    "limits_leverage":           ("Constraint", "Leverage"),
    "blocks_commitment":         ("Constraint", "Commitment"),
    "imposed_by_event":          ("Constraint", "Event"),

    # Leverage → *
    "targets":                   ("Leverage", "Actor"),
    "derived_from_event":        ("Leverage", "Event"),
    "undermined_by":             ("Leverage", "Constraint"),

    # Commitment → *
    "addresses_claim":           ("Commitment", "Claim"),
    "violated_by_event":         ("Commitment", "Event"),
    "supersedes":                ("Commitment", "Commitment"),

    # Event → *
    "triggered_by":              ("Event", "Event"),
    "escalates":                 ("Event", "Event"),
    "de_escalates":              ("Event", "Event"),
    "involves_actor":            ("Event", "Actor"),
    "affects_leverage":          ("Event", "Leverage"),
    "validates_narrative":       ("Event", "Narrative"),
    "contradicts_narrative":     ("Event", "Narrative"),

    # Narrative → *
    "frames_event":              ("Narrative", "Event"),
    "justifies_claim":           ("Narrative", "Claim"),
    "undermines_claim":          ("Narrative", "Claim"),
    "competes_with":             ("Narrative", "Narrative"),
    "reinforces":                ("Narrative", "Narrative"),

    # Cross-type similarity
    "semantically_similar_to":   ("*", "*"),
}
