from dialectica.runner import run_recipe


def graph():
    return {
        "nodes": [
            {"id": "actor-damascus", "label": "Damascus", "primitive_type": "Actor", "confidence": 0.92, "source_span": {"documentId": "doc-1"}},
            {"id": "actor-sdf", "label": "SDF", "primitive_type": "Actor", "confidence": 0.9, "source_span": {"documentId": "doc-2"}},
            {"id": "lev-revenue", "label": "Revenue centralization", "primitive_type": "Leverage", "confidence": 0.84, "metadata": {"subtype": "economic", "effectiveness": 0.8}, "source_span": {"documentId": "doc-3"}},
        ],
        "edges": [
            {"source": "actor-damascus", "target": "lev-revenue", "relation": "HAS_LEVERAGE", "confidence": 0.8, "source_span": {"documentId": "doc-3"}},
            {"source": "lev-revenue", "target": "actor-sdf", "relation": "CONSTRAINS", "confidence": 0.78, "source_span": {"documentId": "doc-3"}},
        ],
    }


def test_leverage_trace_returns_ranked_path():
    result = run_recipe("leverage-trace", graph(), {"actor_a_id": "actor-damascus", "actor_b_id": "actor-sdf"})
    assert result["paths"]
    assert result["paths"][0]["leverage_type"] == "economic"
    assert result["paths"][0]["confidence"] >= 0.4
    assert result["paths"][0]["provenance"]["ruleId"] == "LEVERAGE-TRACE"
