from backend.services.extract_graphrag.aco_adapter import graphrag_to_aco


def test_graphrag_entities_map_to_aco_primitives():
    output = graphrag_to_aco(
        entities=[
            {"id": "actor-1", "type": "organization", "name": "Mediation Team"},
            {"id": "claim-1", "type": "proposition", "name": "Access is the central constraint"},
        ],
        relationships=[],
        communities=[],
    )

    assert [node["primitive_type"] for node in output.nodes] == ["Actor", "Claim"]
    assert all(node["metadata"]["source"] == "graphrag" for node in output.nodes)


def test_graphrag_communities_are_synthesized_review_candidates():
    output = graphrag_to_aco(
        entities=[],
        relationships=[],
        communities=[{"id": "c1", "title": "Access pressure", "summary": "Repeated access constraints.", "confidence": 0.91}],
    )

    [candidate] = output.candidate_summaries
    assert candidate["source"]["kind"] == "graphrag-community-synthesizer"
    assert candidate["synthesized"] is True
    assert candidate["review_status"] == "pending"
    assert candidate["confidence"] == 0.6
