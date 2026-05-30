import pytest

from services.kg_repositories import EdgeRepo, EmbeddingRepo, GraphEdgeRecord, GraphNodeRecord, GraphTraversalRepo, NodeRepo


class FakeConnection:
    def __init__(self, rows=None):
        self.rows = rows or [{"id": "node-1", "path": ["node-1", "node-2"]}]
        self.calls = []

    async def fetch(self, query, *params):
        self.calls.append((query, params))
        return self.rows


@pytest.mark.asyncio
async def test_node_repo_scopes_upsert_by_owner_and_case():
    conn = FakeConnection()
    repo = NodeRepo(conn)
    await repo.upsert(
        GraphNodeRecord(
            case_id="case-1",
            owner_uid="user-1",
            ontology_id="conflict",
            primitive="Actor",
            subtype="state",
            label="Government",
            layer="Claim",
            confidence=0.8,
            created_by="user-1",
        )
    )

    query, params = conn.calls[0]
    assert "WHERE graph_nodes.owner_uid = EXCLUDED.owner_uid" in query
    assert "AND graph_nodes.case_id = EXCLUDED.case_id" in query
    assert "user-1" in params
    assert "case-1" in params


@pytest.mark.asyncio
async def test_edge_repo_uses_parameterized_owner_scoped_upsert():
    conn = FakeConnection()
    repo = EdgeRepo(conn)
    await repo.upsert(
        GraphEdgeRecord(
            case_id="case-1",
            owner_uid="user-1",
            ontology_id="conflict",
            relation_type="supports",
            source_id="00000000-0000-0000-0000-000000000001",
            target_id="00000000-0000-0000-0000-000000000002",
            confidence=0.7,
            created_by="user-1",
        )
    )

    query, params = conn.calls[0]
    assert "graph_edges.owner_uid = EXCLUDED.owner_uid" in query
    assert "%s::uuid" in query
    assert params[1:4] == ("case-1", "user-1", "conflict")


@pytest.mark.asyncio
async def test_traversal_repo_requires_owner_and_case_predicates():
    conn = FakeConnection(rows=[])
    repo = GraphTraversalRepo(conn)
    await repo.n_hop_neighborhood(
        owner_uid="user-1",
        case_id="case-1",
        start_node_id="00000000-0000-0000-0000-000000000001",
    )

    query, params = conn.calls[0]
    assert "e.owner_uid = %s" in query
    assert "e.case_id = %s" in query
    assert "n.owner_uid = %s" in query
    assert "n.case_id = %s" in query
    assert params.count("user-1") == 2
    assert params.count("case-1") == 2


@pytest.mark.asyncio
async def test_embedding_repo_filters_semantic_search_by_owner_and_case():
    conn = FakeConnection(rows=[])
    repo = EmbeddingRepo(conn)
    embedding = [0.1] * 768
    await repo.semantic_search(owner_uid="user-1", case_id="case-1", embedding=embedding, limit=5)

    query, params = conn.calls[0]
    assert "n.owner_uid = %s" in query
    assert "n.case_id = %s" in query
    assert params == (embedding, "user-1", "case-1", embedding, 5)
