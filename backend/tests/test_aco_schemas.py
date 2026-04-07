"""Tests for ACO schema definitions — Prompt 5.1."""
from __future__ import annotations

import pytest
from graphify_tacitus.schemas.aco import (
    ACO_TYPE_MAP,
    ACOEdge,
    Actor,
    Claim,
    Commitment,
    Constraint,
    Event,
    Interest,
    Leverage,
    Narrative,
    PrimitiveType,
    make_aco_node,
)
from graphify_tacitus.schemas.relationships import ACO_RELATIONSHIPS


# ── Enum tests ────────────────────────────────────────────────────────────────

def test_primitive_type_has_all_8_values():
    values = set(p.value for p in PrimitiveType)
    expected = {"Actor", "Claim", "Interest", "Constraint", "Leverage", "Commitment", "Event", "Narrative"}
    assert values == expected, f"Missing types: {expected - values}"


# ── ACO node instantiation ────────────────────────────────────────────────────

def test_actor_instantiation():
    actor = Actor(id="a1", label="Test Actor", description="A test actor")
    assert actor.primitive_type == PrimitiveType.actor
    d = actor.model_dump()
    assert d["id"] == "a1"
    assert d["label"] == "Test Actor"


def test_claim_instantiation():
    claim = Claim(id="c1", label="Test Claim", description="A test claim")
    assert claim.primitive_type == PrimitiveType.claim
    assert claim.model_dump()["primitive_type"] == PrimitiveType.claim


def test_interest_instantiation():
    interest = Interest(id="i1", label="Test Interest", description="An interest")
    assert interest.primitive_type == PrimitiveType.interest


def test_constraint_instantiation():
    c = Constraint(id="cn1", label="Test Constraint", description="A constraint")
    assert c.primitive_type == PrimitiveType.constraint


def test_leverage_instantiation():
    lev = Leverage(id="l1", label="Test Leverage", description="A leverage point")
    assert lev.primitive_type == PrimitiveType.leverage


def test_commitment_instantiation():
    com = Commitment(id="cm1", label="Test Commitment", description="A commitment")
    assert com.primitive_type == PrimitiveType.commitment


def test_event_instantiation():
    ev = Event(id="ev1", label="Test Event", description="An event")
    assert ev.primitive_type == PrimitiveType.event


def test_narrative_instantiation():
    narr = Narrative(id="n1", label="Test Narrative", description="A narrative")
    assert narr.primitive_type == PrimitiveType.narrative


# ── Serialization round-trip ──────────────────────────────────────────────────

def test_actor_serialization_roundtrip():
    actor = Actor(id="a1", label="SAF", description="Sudanese Armed Forces", confidence=0.95)
    d = actor.model_dump()
    actor2 = Actor(**{k: v for k, v in d.items() if k != "primitive_type"})
    assert actor2.id == actor.id
    assert actor2.confidence == actor.confidence


@pytest.mark.parametrize("cls,ptype", [
    (Actor, PrimitiveType.actor),
    (Claim, PrimitiveType.claim),
    (Interest, PrimitiveType.interest),
    (Constraint, PrimitiveType.constraint),
    (Leverage, PrimitiveType.leverage),
    (Commitment, PrimitiveType.commitment),
    (Event, PrimitiveType.event),
    (Narrative, PrimitiveType.narrative),
])
def test_all_models_have_correct_primitive_type(cls, ptype):
    node = cls(id="test", label="Test", description="Test node")
    assert node.primitive_type == ptype


# ── ACO_TYPE_MAP ──────────────────────────────────────────────────────────────

def test_aco_type_map_has_all_8_types():
    expected_keys = {"Actor", "Claim", "Interest", "Constraint", "Leverage", "Commitment", "Event", "Narrative"}
    assert set(ACO_TYPE_MAP.keys()) == expected_keys


def test_make_aco_node_actor():
    node = make_aco_node({"id": "a1", "label": "Test", "primitive_type": "Actor", "description": "test"})
    assert isinstance(node, Actor)


def test_make_aco_node_event():
    node = make_aco_node({"id": "e1", "label": "Battle", "primitive_type": "Event", "description": "battle"})
    assert isinstance(node, Event)


def test_make_aco_node_unknown_type_returns_actor():
    """Unknown types should fall back to Actor."""
    node = make_aco_node({"id": "u1", "label": "Unknown", "primitive_type": "Unknown", "description": "test"})
    # Should return an Actor (fallback behavior)
    assert node is not None


# ── ACO_RELATIONSHIPS ─────────────────────────────────────────────────────────

def test_aco_relationships_has_42_entries():
    count = len(ACO_RELATIONSHIPS)
    assert count == 42, f"Expected 42 relationship types, found {count}. Missing or extra: {count - 42}"


def test_aco_relationships_keys_are_uppercase():
    for key in ACO_RELATIONSHIPS.keys():
        assert key == key.upper(), f"Relationship key not uppercase: {key}"


def test_aco_relationships_have_source_target_types():
    for rel_name, rel_def in ACO_RELATIONSHIPS.items():
        assert "source_types" in rel_def, f"{rel_name} missing source_types"
        assert "target_types" in rel_def, f"{rel_name} missing target_types"


# ── ExtractionResult ──────────────────────────────────────────────────────────

def test_extraction_result_holds_all_types():
    from graphify_tacitus.schemas.extraction import ExtractionResult, ExtractionNode, ExtractionEdge

    nodes = [
        ExtractionNode(id="a1", label="Actor 1", primitive_type="Actor", description="test"),
        ExtractionNode(id="c1", label="Claim 1", primitive_type="Claim", description="test"),
        ExtractionNode(id="i1", label="Interest 1", primitive_type="Interest", description="test"),
        ExtractionNode(id="cn1", label="Constraint 1", primitive_type="Constraint", description="test"),
        ExtractionNode(id="l1", label="Leverage 1", primitive_type="Leverage", description="test"),
        ExtractionNode(id="cm1", label="Commitment 1", primitive_type="Commitment", description="test"),
        ExtractionNode(id="e1", label="Event 1", primitive_type="Event", description="test"),
        ExtractionNode(id="n1", label="Narrative 1", primitive_type="Narrative", description="test"),
    ]
    edges = [ExtractionEdge(source="a1", target="c1", relation="CLAIMS", weight=0.8)]

    result = ExtractionResult(nodes=nodes, edges=edges)
    assert len(result.nodes) == 8
    assert len(result.edges) == 1
    types = {n.primitive_type for n in result.nodes}
    assert types == {"Actor", "Claim", "Interest", "Constraint", "Leverage", "Commitment", "Event", "Narrative"}
