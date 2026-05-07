from backend.services.persona_corpus.ingester import plan_persona_corpus_ingest
from backend.services.persona_corpus.retriever import retrieve_persona_corpus


def test_persona_corpus_retrieval_returns_ranked_cited_chunks():
    chunks = retrieve_persona_corpus("political-analyst", "audience costs and coalition constraints", top_k=3)

    assert len(chunks) == 3
    assert chunks[0].namespace == "persona:canonical:political-analyst:v1.0.0"
    assert chunks[0].similarity > chunks[-1].similarity
    assert chunks[0].citation


def test_persona_corpus_ingest_plan_enforces_caps():
    plan = plan_persona_corpus_ingest("custom:sudan-adviser", 5)

    assert plan.namespace == "persona:custom:sudan-adviser:v0.1.0"
    assert plan.chunk_table == "persona_corpus_chunks"
