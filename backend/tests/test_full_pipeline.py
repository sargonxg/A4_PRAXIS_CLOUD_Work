"""Full pipeline integration test.

Tests the complete ACO extraction → build → cluster → analyze → report flow
using a realistic Sudan conflict fixture.
"""
from __future__ import annotations

import pytest
import asyncio

# ── Sudan conflict fixture ─────────────────────────────────────────────────────

SUDAN_FIXTURE = """
The Sudanese Armed Forces (SAF), led by General Abdel Fattah al-Burhan, have intensified
aerial bombardment of Khartoum and Omdurman following the breakdown of ceasefire negotiations
in Jeddah. The Rapid Support Forces (RSF), commanded by General Mohamed Hamdan Dagalo (Hemedti),
have responded by fortifying positions in densely populated civilian areas, making
kinetic military action increasingly costly in civilian terms.

The African Union's Peace and Security Council has condemned the escalating violence and
demanded an immediate ceasefire. Both parties claim they are acting in self-defense.
The SAF's core interest is restoring centralized state authority and disarming the RSF,
which it views as an illegal militia. The RSF's position is that it constitutes a legitimate
national security force and demands political integration into a civilian transitional government.

Key constraints on resolution include the RSF's control of significant gold mining revenues
in Darfur (estimated $1.5B annually), which provides financial independence from the state,
and the SAF's constitutional mandate as the sole legitimate armed force. The United Arab
Emirates and Egypt are leveraging their relationships with RSF and SAF respectively,
creating an internationalized dimension. UNITAMS has been expelled from Sudan,
severely limiting UN mediation capacity.
"""


# ── GeminiClient mock ─────────────────────────────────────────────────────────

class MockGeminiClient:
    """Minimal mock that returns a fixed ACO extraction for Sudan."""

    async def extract_aco(self, text: str, source_file: str = "") -> dict:
        return {
            "nodes": [
                {"id": "saf", "label": "Sudanese Armed Forces", "primitive_type": "Actor",
                 "description": "State military forces led by General al-Burhan",
                 "confidence": 0.95},
                {"id": "rsf", "label": "Rapid Support Forces", "primitive_type": "Actor",
                 "description": "Paramilitary force commanded by Hemedti",
                 "confidence": 0.95},
                {"id": "burhan", "label": "General al-Burhan", "primitive_type": "Actor",
                 "description": "SAF commander and de facto head of state",
                 "confidence": 0.90},
                {"id": "hemedti", "label": "General Hemedti (Dagalo)", "primitive_type": "Actor",
                 "description": "RSF commander", "confidence": 0.90},
                {"id": "au_psc", "label": "AU Peace and Security Council", "primitive_type": "Actor",
                 "description": "African Union conflict mediation body", "confidence": 0.85},
                {"id": "ceasefire_jeddah", "label": "Jeddah Ceasefire Talks", "primitive_type": "Commitment",
                 "description": "Saudi Arabia-mediated ceasefire negotiations",
                 "confidence": 0.88},
                {"id": "khartoum_bombing", "label": "SAF Aerial Bombardment of Khartoum",
                 "primitive_type": "Event",
                 "description": "Intensified aerial strikes on Khartoum and Omdurman",
                 "confidence": 0.92},
                {"id": "saf_interest_authority", "label": "SAF: Restore Centralized State Authority",
                 "primitive_type": "Interest", "confidence": 0.90},
                {"id": "rsf_interest_integration", "label": "RSF: Political Integration",
                 "primitive_type": "Interest", "confidence": 0.88},
                {"id": "gold_revenue", "label": "RSF Gold Mining Revenue ($1.5B)",
                 "primitive_type": "Leverage",
                 "description": "RSF control of Darfur gold mines provides financial independence",
                 "confidence": 0.85},
                {"id": "uae_support", "label": "UAE Support for RSF", "primitive_type": "Leverage",
                 "confidence": 0.80},
                {"id": "egypt_support", "label": "Egypt Backing for SAF", "primitive_type": "Leverage",
                 "confidence": 0.80},
                {"id": "constraint_saf_mandate", "label": "SAF Constitutional Mandate as Sole Armed Force",
                 "primitive_type": "Constraint", "confidence": 0.92},
                {"id": "constraint_civilian", "label": "Civilian Casualty Constraint",
                 "primitive_type": "Constraint",
                 "description": "RSF positioning in civilian areas limits military options",
                 "confidence": 0.88},
                {"id": "narrative_saf", "label": "SAF Legitimacy Narrative",
                 "primitive_type": "Narrative",
                 "description": "SAF frames RSF as illegal militia requiring disarmament",
                 "confidence": 0.85},
                {"id": "narrative_rsf", "label": "RSF Self-Defense Narrative",
                 "primitive_type": "Narrative",
                 "description": "RSF claims defensive posture and legitimate force status",
                 "confidence": 0.82},
            ],
            "edges": [
                {"source": "saf", "target": "rsf", "relation": "OPPOSES", "weight": 0.95},
                {"source": "burhan", "target": "saf", "relation": "LEADS", "weight": 0.98},
                {"source": "hemedti", "target": "rsf", "relation": "LEADS", "weight": 0.98},
                {"source": "saf", "target": "khartoum_bombing", "relation": "EXECUTES", "weight": 0.92},
                {"source": "au_psc", "target": "ceasefire_jeddah", "relation": "SUPPORTS", "weight": 0.80},
                {"source": "rsf", "target": "gold_revenue", "relation": "CONTROLS", "weight": 0.85},
                {"source": "uae_support", "target": "rsf", "relation": "FUNDS", "weight": 0.75},
                {"source": "egypt_support", "target": "saf", "relation": "SUPPORTS", "weight": 0.78},
                {"source": "saf", "target": "saf_interest_authority", "relation": "PURSUES", "weight": 0.90},
                {"source": "rsf", "target": "rsf_interest_integration", "relation": "PURSUES", "weight": 0.88},
                {"source": "constraint_saf_mandate", "target": "saf", "relation": "CONSTRAINS", "weight": 0.90},
                {"source": "constraint_civilian", "target": "saf", "relation": "CONSTRAINS", "weight": 0.85},
                {"source": "saf", "target": "narrative_saf", "relation": "PROMOTES", "weight": 0.85},
                {"source": "rsf", "target": "narrative_rsf", "relation": "PROMOTES", "weight": 0.82},
            ],
        }


# ── Tests ──────────────────────────────────────────────────────────────────────

def test_build_from_extraction():
    """Test building a NetworkX graph from the mock extraction."""
    from graphify_tacitus.build import build_from_json

    client = MockGeminiClient()
    raw = asyncio.get_event_loop().run_until_complete(client.extract_aco(SUDAN_FIXTURE))

    G = build_from_json(raw)

    assert G.number_of_nodes() > 0, "Graph should have nodes"
    assert G.number_of_edges() > 0, "Graph should have edges"

    node_ids = set(G.nodes())
    assert "saf" in node_ids, "SAF actor should be extracted"
    assert "rsf" in node_ids, "RSF actor should be extracted"


def test_cluster():
    """Test that Leiden/fallback clustering produces community assignments."""
    from graphify_tacitus.build import build_from_json
    from graphify_tacitus.cluster import cluster

    client = MockGeminiClient()
    raw = asyncio.get_event_loop().run_until_complete(client.extract_aco(SUDAN_FIXTURE))

    G = build_from_json(raw)
    communities = cluster(G)

    assert isinstance(communities, dict), "Cluster output should be a dict"
    assert len(communities) > 0, "Should have community assignments"
    # SAF and RSF should be in different communities (they oppose each other)
    if "saf" in communities and "rsf" in communities:
        assert communities["saf"] != communities["rsf"], "SAF and RSF should be in different factions"


def test_escalation_assessment():
    """Test that escalation assessment returns valid Glasl stage for Sudan."""
    from graphify_tacitus.build import build_from_json
    from graphify_tacitus.cluster import cluster
    from graphify_tacitus.analyze import escalation_assessment

    client = MockGeminiClient()
    raw = asyncio.get_event_loop().run_until_complete(client.extract_aco(SUDAN_FIXTURE))

    G = build_from_json(raw)
    escalation = escalation_assessment(G)

    assert "glaslStage" in escalation, "Escalation should have glaslStage"
    stage = escalation["glaslStage"]
    assert isinstance(stage, int), "Glasl stage should be an integer"
    assert 1 <= stage <= 9, "Glasl stage should be between 1 and 9"
    assert stage >= 4, f"Sudan conflict should be at Glasl stage >= 4, got {stage}"


def test_pivot_actors():
    """Test that pivot actors identifies SAF/RSF as high-centrality actors."""
    from graphify_tacitus.build import build_from_json
    from graphify_tacitus.analyze import pivot_actors

    client = MockGeminiClient()
    raw = asyncio.get_event_loop().run_until_complete(client.extract_aco(SUDAN_FIXTURE))

    G = build_from_json(raw)
    actors = pivot_actors(G)

    assert len(actors) > 0, "Should identify pivot actors"
    actor_ids = [a.get("id") for a in actors]
    assert "saf" in actor_ids or "rsf" in actor_ids, "SAF or RSF should be identified as pivot actors"


def test_faction_map():
    """Test that faction_map correctly groups actors by community."""
    from graphify_tacitus.build import build_from_json
    from graphify_tacitus.cluster import cluster
    from graphify_tacitus.analyze import faction_map

    client = MockGeminiClient()
    raw = asyncio.get_event_loop().run_until_complete(client.extract_aco(SUDAN_FIXTURE))

    G = build_from_json(raw)
    communities = cluster(G)
    factions = faction_map(G, communities)

    assert len(factions) > 0, "Should detect at least one faction"


def test_report_generation():
    """Test that render_situation_brief_json produces a valid report dict."""
    from graphify_tacitus.build import build_from_json
    from graphify_tacitus.cluster import cluster
    from graphify_tacitus.analyze import (
        escalation_assessment, faction_map, pivot_actors,
        key_concepts, hidden_linkages, intelligence_gaps, negotiation_space
    )
    from graphify_tacitus.report import render_situation_brief_json

    client = MockGeminiClient()
    raw = asyncio.get_event_loop().run_until_complete(client.extract_aco(SUDAN_FIXTURE))

    G = build_from_json(raw)
    communities = cluster(G)
    community_labels = {cid: f"Faction {cid}" for cid in set(communities.values())}
    analysis = {
        "pivotActors": pivot_actors(G),
        "keyConcepts": key_concepts(G),
        "hiddenLinkages": hidden_linkages(G, communities),
        "intelligenceGaps": intelligence_gaps(G, communities, community_labels),
        "escalationAssessment": escalation_assessment(G),
        "factionMap": {str(k): v for k, v in faction_map(G, communities).items()},
        "negotiationSpace": negotiation_space(G),
    }

    situation = {"name": "Sudan Crisis", "type": "civil", "region": "Sudan"}
    brief = render_situation_brief_json(G, analysis, situation)

    assert isinstance(brief, dict), "Brief should be a dict"
    assert brief.get("situationName") == "Sudan Crisis"
    assert "executive_summary" in brief


def test_graph_adapter_mock():
    """Test the Neo4j-only graph adapter factory rejects removed providers."""
    import sys
    from unittest.mock import MagicMock, patch

    neo4j_mock = MagicMock()
    neo4j_mock.AsyncGraphDatabase.driver.return_value = MagicMock()

    with patch.dict('sys.modules', {'neo4j': neo4j_mock}):
        from services.graph_adapter import create_graph_adapter
        adapter = create_graph_adapter("neo4j", uri="bolt://localhost:7687", user="neo4j", password="pw")
        assert adapter is not None, "Neo4j adapter should be created"
        with pytest.raises(ValueError):
            create_graph_adapter("legacy")


def test_extraction_schema_validation():
    """Test that the extraction result matches the ACO schema."""
    from graphify_tacitus.schemas.aco import ACO_TYPE_MAP, PrimitiveType

    client = MockGeminiClient()
    raw = asyncio.get_event_loop().run_until_complete(client.extract_aco(SUDAN_FIXTURE))

    valid_types = set(ACO_TYPE_MAP.keys())
    for node in raw["nodes"]:
        ptype = node.get("primitive_type", "")
        assert ptype in valid_types, f"Node {node['id']} has invalid primitive_type: {ptype}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
