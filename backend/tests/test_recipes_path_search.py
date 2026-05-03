from dialectica.runner import run_recipe


def test_path_search_returns_ranked_intervention_paths():
    graph = {
        "nodes": [
            {"id": "actor-un", "label": "UN", "primitive_type": "Actor", "confidence": 0.9},
            {"id": "actor-damascus", "label": "Damascus", "primitive_type": "Actor", "confidence": 0.88},
            {"id": "lev-verification", "label": "Technical verification mission", "primitive_type": "Leverage", "confidence": 0.82},
            {"id": "commitment-jan30", "label": "30 January agreement", "primitive_type": "Commitment", "confidence": 0.84},
            {"id": "constraint-spoilers", "label": "Spoiler incentives", "primitive_type": "Constraint", "confidence": 0.73},
        ],
        "edges": [
            {"source": "actor-un", "target": "lev-verification", "relation": "HAS_LEVERAGE", "confidence": 0.8},
            {"source": "lev-verification", "target": "commitment-jan30", "relation": "SUPPORTS_COMMITMENT", "confidence": 0.78},
        ],
    }
    result = run_recipe("path-search", graph, {"goal_state": "preserve agreement"})
    assert result["paths"]
    assert result["paths"][0]["actions"]
    assert result["paths"][0]["provenance"]["ruleId"] == "PATH-SEARCH"


def test_path_search_applies_counterfactual_confidence_penalty():
    graph = {
        "nodes": [
            {"id": "actor-un", "label": "UN", "primitive_type": "Actor", "confidence": 0.9},
            {"id": "actor-damascus", "label": "Damascus", "primitive_type": "Actor", "confidence": 0.88},
            {"id": "lev-verification", "label": "Technical verification mission", "primitive_type": "Leverage", "confidence": 0.82},
            {"id": "commitment-jan30", "label": "30 January agreement", "primitive_type": "Commitment", "confidence": 0.84},
            {"id": "constraint-spoilers", "label": "Spoiler incentives", "primitive_type": "Constraint", "confidence": 0.73},
        ],
        "edges": [
            {"source": "actor-un", "target": "lev-verification", "relation": "HAS_LEVERAGE", "confidence": 0.8},
            {"source": "lev-verification", "target": "commitment-jan30", "relation": "SUPPORTS_COMMITMENT", "confidence": 0.78},
        ],
    }
    baseline = run_recipe("path-search", graph, {"goal_state": "preserve agreement"})
    counterfactual = run_recipe("path-search", graph, {
        "goal_state": "preserve agreement",
        "counterfactual_set": ["sdf_withdraws_from_jan_agreement"],
    })
    assert counterfactual["counterfactual_penalty"] == 0.7
    assert counterfactual["paths"][0]["path_id"] == "commitment-repair"
    assert counterfactual["paths"][0]["confidence"] <= baseline["paths"][0]["confidence"]
