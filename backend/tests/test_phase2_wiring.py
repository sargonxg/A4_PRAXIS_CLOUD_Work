import pytest

from agents.checkpointer import close_checkpointer, init_checkpointer
from agents.registry import build_registry
from services.agent_memory import clear_memory_store as clear_agent_memory
from services.agent_memory import recall, remember
from services.pgvector import clear_memory_store as clear_pgvector
from services.pgvector import retrieve, write_chunk_embeddings
from services.rerank import rerank


@pytest.fixture(autouse=True)
async def clear_stores():
    clear_pgvector()
    clear_agent_memory()
    await close_checkpointer()
    yield
    clear_pgvector()
    clear_agent_memory()
    await close_checkpointer()


@pytest.mark.asyncio
async def test_checkpointer_initializes_memory_mode():
    saver = await init_checkpointer("memory://phase2")
    assert saver is not None
    assert getattr(saver, "ready", True)


@pytest.mark.asyncio
async def test_registry_builds_required_flows():
    saver = await init_checkpointer("memory://phase2")
    flows = build_registry(saver)
    assert set(flows) == {
        "document_extraction",
        "boardroom",
        "deep_research",
        "symbolic_firewall",
        "gdelt_monitor",
    }


@pytest.mark.asyncio
async def test_pgvector_roundtrip():
    await write_chunk_embeddings(
        "alice",
        "sit1",
        "doc1",
        [
            {"text": "State A leverage depends on fuel corridors.", "metadata": {"subject_type": "doc_chunk"}},
            {"text": "Unrelated humanitarian overview.", "metadata": {"subject_type": "doc_chunk"}},
        ],
    )
    results = await retrieve("alice", "sit1", "State A leverage", k=3, filters={"subject_type": "doc_chunk"})
    assert len(results) <= 3
    assert results[0]["similarity"] > 0


@pytest.mark.asyncio
async def test_agent_memory_recall_weighted_by_importance():
    await remember("alice", "boardroom_principal", "situation", "sit1", "Past synthesis: De-escalation works", {}, importance=5)
    await remember("alice", "boardroom_principal", "situation", "sit1", "Past synthesis: Sanctions escalate", {}, importance=1)
    results = await recall("alice", "boardroom_principal", "situation", "sit1", "How do we de-escalate?", k=2)
    assert "De-escalation" in results[0]["summary"]


@pytest.mark.asyncio
async def test_rerank_fallback_orders_by_query_overlap():
    docs = [
        {"id": "1", "text": "commodity prices"},
        {"id": "2", "text": "ceasefire monitoring and de-escalation"},
    ]
    ranked = await rerank("ceasefire de-escalation", docs, top_k=2)
    assert ranked[0]["id"] == "2"
