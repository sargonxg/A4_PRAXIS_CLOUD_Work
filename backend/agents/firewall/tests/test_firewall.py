import pytest

from agents.firewall import verify_claim
from agents.firewall.graph import validate_cypher
from services.pgvector import clear_memory_store, write_chunk_embeddings
from services.trust_scores import clear_trust_scores, recent_trust_scores


@pytest.fixture(autouse=True)
def clear_state():
    clear_memory_store()
    clear_trust_scores()
    yield
    clear_memory_store()
    clear_trust_scores()


class FakeNeo4j:
    async def query(self, cypher, params, tenant_id):
        if "mars" in params.get("needle", "").lower():
            return []
        return [{"id": "actor-a", "name": "State A"}]


@pytest.mark.asyncio
async def test_graph_grounded_claim_passes():
    result = await verify_claim("alice", "alice", "sit1", "State A controls the border crossing", neo4j_client=FakeNeo4j())
    assert result["status"] == "GRAPH_GROUNDED"
    assert result["score"] >= 90


@pytest.mark.asyncio
async def test_source_receipt_claim_is_inferred():
    await write_chunk_embeddings("alice", "sit1", "doc1", ["Ceasefire monitors reported a verified withdrawal."])
    result = await verify_claim("alice", "alice", "sit1", "verified withdrawal by ceasefire monitors")
    assert result["status"] == "INFERRED"
    assert result["score"] > 0


@pytest.mark.asyncio
async def test_unsupported_claim_is_rejected_and_persisted():
    result = await verify_claim("alice", "alice", "sit1", "State A controls Mars", neo4j_client=FakeNeo4j())
    assert result["status"] == "REJECTED"
    scores = await recent_trust_scores("alice", "sit1")
    assert scores[-1]["status"] == "REJECTED"


def test_cypher_injection_is_blocked():
    with pytest.raises(ValueError):
        validate_cypher("MATCH (n) DETACH DELETE n RETURN n")
