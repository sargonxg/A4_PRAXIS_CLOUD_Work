from backend.services.vertex_rag import VertexRagClient, VertexRagConfig


def test_vertex_rag_client_is_disabled_safe_by_default(monkeypatch):
    monkeypatch.delenv("VERTEX_RAG_ENABLED", raising=False)
    client = VertexRagClient(config=VertexRagConfig(project_id="p", location="us-central1"))

    result = client.retrieve_contexts(query="policy issue", corpus_names=["corpus"], top_k=3)

    assert result.status == "disabled"
    assert result.contexts == []
    assert "VERTEX_RAG_ENABLED" in result.reason


def test_vertex_rag_client_builds_retrieve_contexts_payload():
    client = VertexRagClient(config=VertexRagConfig(project_id="p", location="us-central1"))

    payload = client.build_retrieve_contexts_payload(
        query="policy issue",
        corpus_names=["projects/p/locations/us-central1/ragCorpora/c1"],
        top_k=4,
    )

    assert payload == {
        "vertexRagStore": {
            "ragResources": [
                {"ragCorpus": "projects/p/locations/us-central1/ragCorpora/c1"}
            ],
            "similarityTopK": 4,
        },
        "query": {"text": "policy issue"},
    }
