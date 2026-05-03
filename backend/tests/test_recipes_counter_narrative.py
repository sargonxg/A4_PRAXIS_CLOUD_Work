from dialectica.runner import run_recipe


def test_counter_narrative_returns_divergent_citation_sets():
    graph = {
        "nodes": [
            {"id": "event-south", "label": "Southern Syria flashpoint", "primitive_type": "Event", "confidence": 0.8, "source_span": {"documentId": "doc-event"}},
            {"id": "nar-sovereignty", "label": "Sovereignty restoration narrative", "primitive_type": "Narrative", "confidence": 0.82, "source_span": {"documentId": "doc-damascus"}},
            {"id": "nar-protection", "label": "Civilian protection narrative", "primitive_type": "Narrative", "confidence": 0.79, "source_span": {"documentId": "doc-israel"}},
            {"id": "actor-damascus", "label": "Damascus", "primitive_type": "Actor", "confidence": 0.9},
            {"id": "actor-israel", "label": "Israel", "primitive_type": "Actor", "confidence": 0.9},
        ],
        "edges": [
            {"source": "nar-sovereignty", "target": "event-south", "relation": "FRAMES_EVENT", "confidence": 0.76},
            {"source": "nar-protection", "target": "event-south", "relation": "FRAMES_EVENT", "confidence": 0.76},
            {"source": "actor-damascus", "target": "nar-sovereignty", "relation": "PROPAGATES_NARRATIVE", "confidence": 0.76},
            {"source": "actor-israel", "target": "nar-protection", "relation": "PROPAGATES_NARRATIVE", "confidence": 0.76},
        ],
    }
    result = run_recipe("counter-narrative", graph, {"event_id": "event-south"})
    assert len(result["narratives"]) == 2
    assert result["divergence_score"] > 0
