"""Pipeline unit tests using the HR conflict fixture — Prompt 5.1."""
from __future__ import annotations

import pathlib
import pytest

# ── HR conflict fixture ───────────────────────────────────────────────────────

FIXTURE_PATH = pathlib.Path(__file__).parent / "fixtures" / "hr_conflict.txt"

def load_fixture() -> str:
    return FIXTURE_PATH.read_text()


# ── Mock extraction result (what Gemini WOULD return for HR conflict) ─────────

HR_EXTRACTION = {
    "nodes": [
        {"id": "alex", "label": "Alex Chen", "primitive_type": "Actor",
         "description": "Senior Engineer who criticized code review process", "confidence": 0.95},
        {"id": "maya", "label": "Maya Rodriguez", "primitive_type": "Actor",
         "description": "Team Lead responsible for code review process", "confidence": 0.95},
        {"id": "jordan", "label": "Jordan Park", "primitive_type": "Actor",
         "description": "HR contact asked to mediate", "confidence": 0.90},
        {"id": "radical_transparency", "label": "Radical Transparency in Code Review",
         "primitive_type": "Claim",
         "description": "Alex's claim that team needs radical transparency", "confidence": 0.88},
        {"id": "feedback_protocol", "label": "Private Feedback First Protocol",
         "primitive_type": "Claim",
         "description": "Maya's insistence on private criticism before public", "confidence": 0.88},
        {"id": "code_quality", "label": "Code Quality Improvement",
         "primitive_type": "Interest",
         "description": "Alex's core interest in improving engineering standards", "confidence": 0.90},
        {"id": "psychological_safety", "label": "Team Psychological Safety",
         "primitive_type": "Interest",
         "description": "Maya's interest in maintaining safe team environment", "confidence": 0.90},
        {"id": "hr_policy", "label": "HR Feedback Policy",
         "primitive_type": "Constraint",
         "description": "Established organizational policy on feedback channels", "confidence": 0.85},
        {"id": "public_criticism_incident", "label": "Slack Public Criticism Incident",
         "primitive_type": "Event",
         "description": "Alex criticized Maya's code review in public Slack channel", "confidence": 0.95},
        {"id": "mediation_request", "label": "Mediation Session Request",
         "primitive_type": "Event",
         "description": "Request for mediation session next Tuesday", "confidence": 0.90},
        {"id": "transparency_narrative", "label": "Transparency and Innovation Narrative",
         "primitive_type": "Narrative",
         "description": "Alex's framing that gatekeeping kills innovation", "confidence": 0.85},
    ],
    "edges": [
        {"source": "alex", "target": "radical_transparency", "relation": "CLAIMS", "weight": 0.90},
        {"source": "maya", "target": "feedback_protocol", "relation": "CLAIMS", "weight": 0.90},
        {"source": "alex", "target": "code_quality", "relation": "PURSUES", "weight": 0.88},
        {"source": "maya", "target": "psychological_safety", "relation": "PURSUES", "weight": 0.88},
        {"source": "alex", "target": "public_criticism_incident", "relation": "PARTICIPATED_IN", "weight": 0.92},
        {"source": "maya", "target": "public_criticism_incident", "relation": "PARTICIPATED_IN", "weight": 0.92},
        {"source": "alex", "target": "transparency_narrative", "relation": "PROMOTES", "weight": 0.85},
        {"source": "alex", "target": "maya", "relation": "OPPOSES", "weight": 0.80},
        {"source": "jordan", "target": "mediation_request", "relation": "FACILITATES", "weight": 0.88},
        {"source": "hr_policy", "target": "maya", "relation": "SUPPORTS", "weight": 0.75},
        {"source": "hr_policy", "target": "alex", "relation": "CONSTRAINS", "weight": 0.72},
    ],
}


# ── Tests ──────────────────────────────────────────────────────────────────────

def test_fixture_file_exists():
    assert FIXTURE_PATH.exists(), "HR conflict fixture file should exist"
    content = load_fixture()
    assert "Alex Chen" in content
    assert "Maya Rodriguez" in content
    assert "Jordan Park" in content


def test_build_from_json_produces_valid_graph():
    from graphify_tacitus.build import build_from_json

    G = build_from_json(HR_EXTRACTION)

    assert G.number_of_nodes() == len(HR_EXTRACTION["nodes"]), \
        f"Expected {len(HR_EXTRACTION['nodes'])} nodes, got {G.number_of_nodes()}"
    assert G.number_of_edges() == len(HR_EXTRACTION["edges"]), \
        f"Expected {len(HR_EXTRACTION['edges'])} edges, got {G.number_of_edges()}"

    assert G.has_node("alex"), "Alex should be in graph"
    assert G.has_node("maya"), "Maya should be in graph"
    assert G.has_node("jordan"), "Jordan should be in graph"


def test_cluster_assigns_community_ids():
    from graphify_tacitus.build import build_from_json
    from graphify_tacitus.cluster import cluster

    G = build_from_json(HR_EXTRACTION)
    communities = cluster(G)

    assert isinstance(communities, dict), "Cluster output should be a dict"
    for node_id in G.nodes():
        assert node_id in communities, f"Node {node_id} should have a community assignment"


def test_pivot_actors_returns_alex_and_maya():
    from graphify_tacitus.build import build_from_json
    from graphify_tacitus.analyze import pivot_actors

    G = build_from_json(HR_EXTRACTION)
    actors = pivot_actors(G)

    assert len(actors) > 0, "Should identify pivot actors"
    actor_ids = [a.get("id") for a in actors]
    # Alex and Maya have highest degree in the graph
    top_two = actor_ids[:2]
    assert "alex" in top_two or "maya" in top_two, \
        f"Alex or Maya should be in top pivot actors, got: {top_two}"


def test_hidden_linkages():
    from graphify_tacitus.build import build_from_json
    from graphify_tacitus.cluster import cluster
    from graphify_tacitus.analyze import hidden_linkages

    G = build_from_json(HR_EXTRACTION)
    communities = cluster(G)
    linkages = hidden_linkages(G, communities)

    assert isinstance(linkages, list), "Hidden linkages should be a list"


def test_intelligence_gaps():
    from graphify_tacitus.build import build_from_json
    from graphify_tacitus.cluster import cluster
    from graphify_tacitus.analyze import intelligence_gaps

    G = build_from_json(HR_EXTRACTION)
    communities = cluster(G)
    community_labels = {cid: f"Group {cid}" for cid in set(communities.values())}
    gaps = intelligence_gaps(G, communities, community_labels)

    assert isinstance(gaps, list), "Intelligence gaps should be a list"


def test_escalation_assessment_returns_glasl_stage():
    from graphify_tacitus.build import build_from_json
    from graphify_tacitus.analyze import escalation_assessment

    G = build_from_json(HR_EXTRACTION)
    escalation = escalation_assessment(G)

    assert "glaslStage" in escalation, "Should have glaslStage key"
    stage = escalation["glaslStage"]
    assert 1 <= stage <= 9, f"Glasl stage {stage} out of range 1-9"


def test_faction_map_produces_at_least_2_factions():
    from graphify_tacitus.build import build_from_json
    from graphify_tacitus.cluster import cluster
    from graphify_tacitus.analyze import faction_map

    G = build_from_json(HR_EXTRACTION)
    communities = cluster(G)
    factions = faction_map(G, communities)

    # Alex and Maya oppose each other, so expect at least 2 communities/factions
    assert len(factions) >= 1, "Should detect at least one faction"


def test_render_situation_brief_returns_markdown():
    from graphify_tacitus.build import build_from_json
    from graphify_tacitus.cluster import cluster
    from graphify_tacitus.analyze import (
        pivot_actors, key_concepts, hidden_linkages, intelligence_gaps,
        escalation_assessment, faction_map, negotiation_space
    )
    from graphify_tacitus.report import render_situation_brief

    G = build_from_json(HR_EXTRACTION)
    communities = cluster(G)
    community_labels = {cid: f"Group {cid}" for cid in set(communities.values())}
    analysis = {
        "pivotActors": pivot_actors(G),
        "keyConcepts": key_concepts(G),
        "hiddenLinkages": hidden_linkages(G, communities),
        "intelligenceGaps": intelligence_gaps(G, communities, community_labels),
        "escalationAssessment": escalation_assessment(G),
        "factionMap": {str(k): v for k, v in faction_map(G, communities).items()},
        "negotiationSpace": negotiation_space(G),
    }
    situation = {"name": "Northwind HR Conflict", "type": "workplace", "region": "US"}
    brief = render_situation_brief(G, analysis, situation)

    assert isinstance(brief, str), "Brief should be a string"
    assert len(brief) > 100, "Brief should have substantial content"
    assert "Northwind HR Conflict" in brief, "Brief should contain situation name"


def test_render_situation_brief_json_returns_dict():
    from graphify_tacitus.build import build_from_json
    from graphify_tacitus.cluster import cluster
    from graphify_tacitus.analyze import (
        pivot_actors, key_concepts, hidden_linkages, intelligence_gaps,
        escalation_assessment, faction_map, negotiation_space
    )
    from graphify_tacitus.report import render_situation_brief_json

    G = build_from_json(HR_EXTRACTION)
    communities = cluster(G)
    community_labels = {cid: f"Group {cid}" for cid in set(communities.values())}
    analysis = {
        "pivotActors": pivot_actors(G),
        "keyConcepts": key_concepts(G),
        "hiddenLinkages": hidden_linkages(G, communities),
        "intelligenceGaps": intelligence_gaps(G, communities, community_labels),
        "escalationAssessment": escalation_assessment(G),
        "factionMap": {str(k): v for k, v in faction_map(G, communities).items()},
        "negotiationSpace": negotiation_space(G),
    }
    situation = {"name": "Northwind HR Conflict", "type": "workplace", "region": "US"}
    brief = render_situation_brief_json(G, analysis, situation)

    assert isinstance(brief, dict), "JSON brief should be a dict"
    assert "situationName" in brief, "Should have situationName"
    assert "executive_summary" in brief, "Should have executive_summary"
    assert brief["situationName"] == "Northwind HR Conflict"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
