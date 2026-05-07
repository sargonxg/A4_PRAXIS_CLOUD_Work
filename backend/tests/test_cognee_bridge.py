import pytest
import asyncio

from config import get_settings
from services.cognee_bridge import CogneeCandidate, capped_confidence, write_candidate_links
from services.cognee_memory import MemoryScope


class FakeConnection:
    def __init__(self):
        self.calls = []

    async def fetch(self, query, *params):
        self.calls.append((query, params))
        return [{"id": "link-1", "confidence": params[4], "cognee_node_id": params[2]}]


@pytest.fixture(autouse=True)
def clear_settings_cache(monkeypatch):
    get_settings.cache_clear()
    monkeypatch.delenv("COGNEE_CANDIDATE_FLOOR", raising=False)
    yield
    get_settings.cache_clear()


def test_capped_confidence_never_exceeds_firewall_ceiling():
    assert capped_confidence(0.91) == 0.6
    assert capped_confidence(0.1234) == 0.123


def test_write_candidate_links_filters_and_caps_candidates():
    conn = FakeConnection()
    scope = MemoryScope(owner_uid="user-1", case_id="case-1")
    rows = asyncio.run(write_candidate_links(
        conn,
        scope=scope,
        candidates=[
            CogneeCandidate(cognee_node_id="low", label="Low", internal_score=0.2),
            CogneeCandidate(cognee_node_id="high", label="High", internal_score=0.91, source_chunk_id="chunk-1"),
        ],
    ))

    assert len(rows) == 1
    query, params = conn.calls[0]
    assert "aco_cognee_link" in query
    assert params[0:4] == ("case-1", "user-1", "high", "user-1__case-1")
    assert params[4] == 0.6
    assert params[6] == "chunk-1"
