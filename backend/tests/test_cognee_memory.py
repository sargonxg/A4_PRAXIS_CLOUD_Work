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
    yield
    get_settings.cache_clear()


def test_cognee_disabled_returns_empty_shapes():
    scope = MemoryScope(owner_uid="user-1", case_id="case-1")
    assert scope.dataset == "user-1__case-1"
    assert cognee_memory.is_enabled() is False
    assert asyncio.run(cognee_memory.recall(scope=scope, query="ceasefire")) == []
    result = asyncio.run(cognee_memory.remember(scope=scope, content="note"))
    assert result["status"] == "disabled"


def test_cognee_rejects_non_vertex_provider(monkeypatch):
    monkeypatch.setenv("COGNEE_ENABLED", "true")
    monkeypatch.setenv("COGNEE_MODE", "postgres-kuzu")
    monkeypatch.setenv("COGNEE_LLM_PROVIDER", "openai")
    get_settings.cache_clear()
    health = cognee_memory.health()
    assert health.enabled is True
    assert health.ready is False
    assert "vertex_ai" in (health.reason or "")
