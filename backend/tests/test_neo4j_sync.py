import pytest

from services.firestore_to_neo4j_sync import sync_situation
from services.neo4j_client import Neo4jClient


@pytest.mark.asyncio
async def test_sync_creates_nodes(monkeypatch):
    calls = []

    class FakeDoc:
        def to_dict(self):
            return {"nodes": [{"id": "n1", "label": "Actor", "name": "State A"}], "edges": []}

    class FakeDocument:
        async def get(self):
            return FakeDoc()

    class FakeCollection:
        def document(self, _id):
            return FakeDocument()

    class FakeSituation:
        def collection(self, _name):
            return FakeCollection()

    class FakeSituations:
        def document(self, _id):
            return FakeSituation()

    class FakeUser:
        def collection(self, _name):
            return FakeSituations()

    class FakeUsers:
        def document(self, _id):
            return FakeUser()

    class FakeFirestore:
        def collection(self, _name):
            return FakeUsers()

    class FakeNeo4j:
        async def merge_node(self, label, props, tenant_id):
            calls.append((label, props["id"], tenant_id))

        async def merge_edge(self, *args):
            raise AssertionError("no edges expected")

    monkeypatch.setattr("services.firestore_to_neo4j_sync.firestore.AsyncClient", lambda: FakeFirestore())
    result = await sync_situation("alice", "sit1", client=FakeNeo4j())
    assert result == {"nodes": 1, "edges": 0}
    assert calls == [("Actor", "n1", "alice")]


@pytest.mark.asyncio
async def test_tenant_isolation_rejects_writes_in_query():
    client = Neo4jClient.__new__(Neo4jClient)
    with pytest.raises(ValueError):
        await client.query("MATCH (n) DELETE n", params={}, tenant_id="alice")
