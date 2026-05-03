from dialectica.runner import run_recipe


def test_interest_vs_position_finds_shared_interest_opening():
    graph = {
        "nodes": [
            {"id": "actor-damascus", "label": "Damascus", "primitive_type": "Actor", "confidence": 0.9},
            {"id": "actor-sdf", "label": "SDF", "primitive_type": "Actor", "confidence": 0.9},
            {"id": "interest-security-a", "label": "Counter-ISIL security continuity", "primitive_type": "Interest", "confidence": 0.8},
            {"id": "interest-security-b", "label": "Security continuity for counter-ISIL operations", "primitive_type": "Interest", "confidence": 0.8},
            {"id": "claim-central", "label": "Central command is non-negotiable", "primitive_type": "Claim", "confidence": 0.75},
            {"id": "claim-autonomy", "label": "Local autonomy must be preserved", "primitive_type": "Claim", "confidence": 0.75},
        ],
        "edges": [
            {"source": "actor-damascus", "target": "interest-security-a", "relation": "HAS_INTEREST", "confidence": 0.8},
            {"source": "actor-sdf", "target": "interest-security-b", "relation": "HAS_INTEREST", "confidence": 0.8},
            {"source": "actor-damascus", "target": "claim-central", "relation": "MAKES_CLAIM", "confidence": 0.8},
            {"source": "actor-sdf", "target": "claim-autonomy", "relation": "MAKES_CLAIM", "confidence": 0.8},
        ],
    }
    result = run_recipe("interest-vs-position", graph, {"actor_ids": ["actor-damascus", "actor-sdf"]})
    assert result["zopa_candidates"]
    assert "security" in result["zopa_candidates"][0]["opening"]
