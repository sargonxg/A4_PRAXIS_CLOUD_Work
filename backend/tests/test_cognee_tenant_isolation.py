import asyncio

from services.cognee_bridge import CogneeCandidate, write_candidate_links
from services.cognee_memory import MemoryScope


class FakeConnection:
    def __init__(self):
        self.calls = []

    async def fetch(self, query, *params):
        self.calls.append((query, params))
        return [{"id": "link-1", "owner_uid": params[1], "case_id": params[0]}]


def test_memory_scope_requires_user_and_case():
    assert MemoryScope(owner_uid="user-1", case_id="case-1").dataset == "user-1__case-1"

    import pytest

    with pytest.raises(ValueError):
        _ = MemoryScope(owner_uid="", case_id="case-1").dataset
    with pytest.raises(ValueError):
        _ = MemoryScope(owner_uid="user-1", case_id="").dataset


def test_bridge_insert_is_owner_case_and_dataset_scoped():
    conn = FakeConnection()
    scope = MemoryScope(owner_uid="user-1", case_id="case-1")
    rows = asyncio.run(
        write_candidate_links(
            conn,
            scope=scope,
            candidates=[
                CogneeCandidate(
                    cognee_node_id="candidate-1",
                    label="Candidate",
                    internal_score=0.8,
                    source_chunk_id="chunk-1",
                )
            ],
        )
    )

    assert rows == [{"id": "link-1", "owner_uid": "user-1", "case_id": "case-1"}]
    query, params = conn.calls[0]
    assert "case_id, owner_uid, cognee_node_id, cognee_dataset" in query
    assert "ON CONFLICT (cognee_dataset, cognee_node_id)" in query
    assert params[:4] == ("case-1", "user-1", "candidate-1", "user-1__case-1")
