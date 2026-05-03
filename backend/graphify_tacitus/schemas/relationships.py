# GENERATED FILE - DO NOT EDIT.
# Source: schemas/conflict-grammar-v1.json
# Regenerate with: npm run schema:gen
from __future__ import annotations

from .aco import ACOEdge


ACO_RELATIONSHIPS: dict[str, dict[str, list[str] | str]] = {
    "CLAIMS": {"canonical": "claims", "source_types": ["Actor"], "target_types": ["Claim"], "description": "Actor asserts a claim."},
    "HAS_INTEREST": {"canonical": "has_interest", "source_types": ["Actor"], "target_types": ["Interest"], "description": "Actor has an underlying interest."},
    "FACES_CONSTRAINT": {"canonical": "faces_constraint", "source_types": ["Actor"], "target_types": ["Constraint"], "description": "Actor is limited by a constraint."},
    "HOLDS_LEVERAGE": {"canonical": "holds_leverage", "source_types": ["Actor"], "target_types": ["Leverage"], "description": "Actor holds a leverage source."},
    "MADE_COMMITMENT": {"canonical": "made_commitment", "source_types": ["Actor"], "target_types": ["Commitment"], "description": "Actor made or joined a commitment."},
    "PARTICIPATED_IN": {"canonical": "participated_in", "source_types": ["Actor"], "target_types": ["Event"], "description": "Actor participated in an event."},
    "PROPAGATES_NARRATIVE": {"canonical": "propagates_narrative", "source_types": ["Actor"], "target_types": ["Narrative"], "description": "Actor propagates a narrative."},
    "ALLIED_WITH": {"canonical": "allied_with", "source_types": ["Actor"], "target_types": ["Actor"], "description": "Actor is allied with another actor."},
    "OPPOSES": {"canonical": "opposes", "source_types": ["Actor"], "target_types": ["Actor"], "description": "Actor opposes another actor."},
    "MEDIATES_BETWEEN": {"canonical": "mediates_between", "source_types": ["Actor"], "target_types": ["Actor"], "description": "Actor mediates between actors."},
    "SPONSORS": {"canonical": "sponsors", "source_types": ["Actor"], "target_types": ["Actor"], "description": "Actor sponsors another actor."},
    "SUBORDINATE_TO": {"canonical": "subordinate_to", "source_types": ["Actor"], "target_types": ["Actor"], "description": "Actor is subordinate to another actor."},
    "CONTRADICTS": {"canonical": "contradicts", "source_types": ["Claim"], "target_types": ["Claim"], "description": "Claim contradicts another claim."},
    "SUPPORTS_CLAIM": {"canonical": "supports_claim", "source_types": ["Claim"], "target_types": ["Claim"], "description": "Claim supports another claim."},
    "BASED_ON_INTEREST": {"canonical": "based_on_interest", "source_types": ["Claim"], "target_types": ["Interest"], "description": "Claim is based on an underlying interest."},
    "JUSTIFIED_BY_NARRATIVE": {"canonical": "justified_by_narrative", "source_types": ["Claim"], "target_types": ["Narrative"], "description": "Claim is justified by a narrative."},
    "CONSTRAINED_BY": {"canonical": "constrained_by", "source_types": ["Claim"], "target_types": ["Constraint"], "description": "Claim is limited by a constraint."},
    "CONFLICTS_WITH": {"canonical": "conflicts_with", "source_types": ["Interest"], "target_types": ["Interest"], "description": "Interest conflicts with another interest."},
    "ALIGNS_WITH": {"canonical": "aligns_with", "source_types": ["Interest"], "target_types": ["Interest"], "description": "Interest aligns with another interest."},
    "UNDERLYING_INTEREST_OF": {"canonical": "underlying_interest_of", "source_types": ["Interest"], "target_types": ["Claim"], "description": "Interest underlies a claim."},
    "LIMITS_LEVERAGE": {"canonical": "limits_leverage", "source_types": ["Constraint"], "target_types": ["Leverage"], "description": "Constraint limits leverage."},
    "BLOCKS_COMMITMENT": {"canonical": "blocks_commitment", "source_types": ["Constraint"], "target_types": ["Commitment"], "description": "Constraint blocks a commitment."},
    "IMPOSED_BY_EVENT": {"canonical": "imposed_by_event", "source_types": ["Constraint"], "target_types": ["Event"], "description": "Constraint is imposed by an event."},
    "TARGETS": {"canonical": "targets", "source_types": ["Leverage"], "target_types": ["Actor"], "description": "Leverage targets an actor."},
    "DERIVED_FROM_EVENT": {"canonical": "derived_from_event", "source_types": ["Leverage"], "target_types": ["Event"], "description": "Leverage derives from an event."},
    "UNDERMINED_BY": {"canonical": "undermined_by", "source_types": ["Leverage"], "target_types": ["Constraint"], "description": "Leverage is undermined by a constraint."},
    "ADDRESSES_CLAIM": {"canonical": "addresses_claim", "source_types": ["Commitment"], "target_types": ["Claim"], "description": "Commitment addresses a claim."},
    "VIOLATED_BY_EVENT": {"canonical": "violated_by_event", "source_types": ["Commitment"], "target_types": ["Event"], "description": "Commitment is violated or stressed by an event."},
    "SUPERSEDES": {"canonical": "supersedes", "source_types": ["Commitment"], "target_types": ["Commitment"], "description": "Commitment supersedes another commitment."},
    "TRIGGERED_BY": {"canonical": "triggered_by", "source_types": ["Event"], "target_types": ["Event"], "description": "Event is triggered by another event."},
    "ESCALATES": {"canonical": "escalates", "source_types": ["Event"], "target_types": ["Event"], "description": "Event escalates another event or sequence."},
    "DE_ESCALATES": {"canonical": "de_escalates", "source_types": ["Event"], "target_types": ["Event"], "description": "Event de-escalates another event or sequence."},
    "INVOLVES_ACTOR": {"canonical": "involves_actor", "source_types": ["Event"], "target_types": ["Actor"], "description": "Event involves an actor."},
    "AFFECTS_LEVERAGE": {"canonical": "affects_leverage", "source_types": ["Event"], "target_types": ["Leverage"], "description": "Event affects leverage."},
    "VALIDATES_NARRATIVE": {"canonical": "validates_narrative", "source_types": ["Event"], "target_types": ["Narrative"], "description": "Event validates a narrative."},
    "CONTRADICTS_NARRATIVE": {"canonical": "contradicts_narrative", "source_types": ["Event"], "target_types": ["Narrative"], "description": "Event contradicts a narrative."},
    "FRAMES_EVENT": {"canonical": "frames_event", "source_types": ["Narrative"], "target_types": ["Event"], "description": "Narrative frames an event."},
    "JUSTIFIES_CLAIM": {"canonical": "justifies_claim", "source_types": ["Narrative"], "target_types": ["Claim"], "description": "Narrative justifies a claim."},
    "UNDERMINES_CLAIM": {"canonical": "undermines_claim", "source_types": ["Narrative"], "target_types": ["Claim"], "description": "Narrative undermines a claim."},
    "COMPETES_WITH": {"canonical": "competes_with", "source_types": ["Narrative"], "target_types": ["Narrative"], "description": "Narrative competes with another narrative."},
    "REINFORCES": {"canonical": "reinforces", "source_types": ["Narrative"], "target_types": ["Narrative"], "description": "Narrative reinforces another narrative."},
    "SEMANTICALLY_SIMILAR_TO": {"canonical": "semantically_similar_to", "source_types": ["*"], "target_types": ["*"], "description": "Nodes are semantically similar or likely duplicate references."},
}

_CANONICAL_TO_NAME = {v["canonical"]: k for k, v in ACO_RELATIONSHIPS.items()}


def normalize_relation(relation: str) -> str:
    """Normalize a relationship type to the canonical uppercase enum key."""
    raw = relation.strip()
    if raw in ACO_RELATIONSHIPS:
        return raw
    normalized = raw.lower().replace(" ", "_").replace("-", "_").strip("_")
    if normalized in _CANONICAL_TO_NAME:
        return _CANONICAL_TO_NAME[normalized]
    upper = normalized.upper()
    if upper in ACO_RELATIONSHIPS:
        return upper
    return upper


def canonical_relation(relation: str) -> str:
    """Return the snake-case relation label used by LLM prompts and UI edges."""
    key = normalize_relation(relation)
    rel = ACO_RELATIONSHIPS.get(key)
    return str(rel["canonical"]) if rel else relation.strip().lower()


def validate_relation(relation: str, source_type: str, target_type: str) -> tuple[bool, str]:
    """Validate a relationship against the 42-edge ACO vocabulary."""
    key = normalize_relation(relation)
    rel = ACO_RELATIONSHIPS.get(key)
    if rel is None:
        return False, key
    source_types = rel["source_types"]
    target_types = rel["target_types"]
    source_ok = "*" in source_types or source_type in source_types
    target_ok = "*" in target_types or target_type in target_types
    return source_ok and target_ok, key


RELATIONSHIP_CATEGORIES: dict[str, list[str]] = {
    "causal": ["TRIGGERED_BY", "ESCALATES", "DE_ESCALATES", "DERIVED_FROM_EVENT", "IMPOSED_BY_EVENT"],
    "structural": ["SUBORDINATE_TO", "FACES_CONSTRAINT", "CONSTRAINED_BY"],
    "antagonistic": ["OPPOSES", "CONTRADICTS", "CONFLICTS_WITH", "UNDERMINES_CLAIM", "UNDERMINED_BY", "VIOLATED_BY_EVENT"],
    "cooperative": ["ALLIED_WITH", "SUPPORTS_CLAIM", "ALIGNS_WITH", "MADE_COMMITMENT", "ADDRESSES_CLAIM", "REINFORCES"],
    "foundational": ["HAS_INTEREST", "CLAIMS", "BASED_ON_INTEREST", "UNDERLYING_INTEREST_OF"],
}
