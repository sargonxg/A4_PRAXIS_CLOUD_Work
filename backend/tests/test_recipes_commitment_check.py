from dialectica.runner import run_recipe


def test_commitment_check_flags_fragility_from_violation_event():
    graph = {
        "nodes": [
            {"id": "commitment-jan30", "label": "30 January integration agreement", "primitive_type": "Commitment", "confidence": 0.86, "metadata": {"status": "active", "importance": 0.9}, "source_span": {"documentId": "doc-agreement"}},
            {"id": "event-delay", "label": "Implementation timeline delayed", "primitive_type": "Event", "confidence": 0.82, "source_span": {"documentId": "doc-un"}},
        ],
        "edges": [
            {"source": "event-delay", "target": "commitment-jan30", "relation": "VIOLATED_BY_EVENT", "confidence": 0.74, "source_span": {"documentId": "doc-un"}},
        ],
    }
    result = run_recipe("commitment-check", graph, {})
    assert result["commitments"]
    assert result["commitments"][0]["commitment"]["node_id"] == "commitment-jan30"
    assert result["commitments"][0]["violating_events"][0]["node_id"] == "event-delay"
