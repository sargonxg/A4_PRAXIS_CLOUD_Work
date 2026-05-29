import pytest
import asyncio

from config import get_settings
from services import cognee_memory
from services.cognee_memory import MemoryScope


@pytest.fixture(autouse=True)
def clear_settings_cache(monkeypatch):
    get_settings.cache_clear()
    monkeypatch.delenv("COGNEE_ENABLED", raising=False)
    monkeypatch.delenv("COGNEE_MODE", raising=False)
    monkeypatch.delenv("COGNEE_BACKEND_URL", raising=False)
    yield
    get_settings.cache_clear()


def test_cognee_disabled_returns_empty_shapes():
    scope = MemoryScope(owner_uid="user-1", case_id="case-1")
    assert scope.dataset == "user-1__case-1"
    assert cognee_memory.dataset_for("user-1", "case-1") == "user-1__case-1"
    assert cognee_memory.is_enabled() is False
    assert asyncio.run(cognee_memory.recall(scope=scope, query="ceasefire")) == {
        "ok": False,
        "status": "disabled",
        "dataset": "user-1__case-1",
        "candidates": [],
    }
    result = asyncio.run(cognee_memory.remember(scope=scope, content="note"))
    assert result["status"] == "queued_disabled"
    improve = asyncio.run(cognee_memory.improve(scope=scope, target_id="turn-1", positive=True))
    assert improve["status"] == "queued_disabled"
    assert improve["dataset"] == "user-1__case-1"


def test_cognee_rejects_non_vertex_provider(monkeypatch):
    monkeypatch.setenv("COGNEE_ENABLED", "true")
    monkeypatch.setenv("COGNEE_MODE", "postgres-kuzu")
    monkeypatch.setenv("COGNEE_LLM_PROVIDER", "openai")
    get_settings.cache_clear()
    health = cognee_memory.health()
    assert health.enabled is True
    assert health.ready is False
    assert "vertex_ai" in (health.reason or "")


def test_cognee_enabled_proxies_to_isolated_service(monkeypatch):
    calls = []

    async def fake_post_service(*, operation, scope, payload):
        calls.append((operation, scope, payload))
        return {
            "ok": True,
            "status": "searched",
            "dataset": scope.dataset,
            "candidates": [
                {
                    "id": "candidate-1",
                    "text": "Advisory memory candidate",
                    "score": 0.91,
                    "sourceId": "source-1",
                }
            ],
        }

    monkeypatch.setenv("COGNEE_ENABLED", "true")
    monkeypatch.setenv("COGNEE_MODE", "postgres-kuzu")
    monkeypatch.setenv("COGNEE_BACKEND_URL", "https://praxis-cognee.example")
    monkeypatch.setenv("COGNEE_LLM_PROVIDER", "vertex_ai")
    monkeypatch.setenv("COGNEE_LLM_API_KEY", "vertex-adc")
    get_settings.cache_clear()
    monkeypatch.setattr(cognee_memory, "_post_service", fake_post_service)

    scope = MemoryScope(owner_uid="user-1", case_id="case-1", session_id="session-1")
    response = asyncio.run(cognee_memory.search(scope=scope, query="ceasefire"))
    hits = cognee_memory.memory_hits_from_response(response)

    assert cognee_memory.is_enabled() is True
    assert response["status"] == "searched"
    assert hits[0].score == 0.6
    assert calls[0][0] == "search"
    assert calls[0][2]["dataset"] == "user-1__case-1"
    assert calls[0][2]["sessionId"] == "session-1"
