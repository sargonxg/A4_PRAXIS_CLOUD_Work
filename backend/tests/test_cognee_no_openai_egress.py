import ast
from pathlib import Path

from config import get_settings
from services import cognee_memory


ROOT = Path(__file__).resolve().parents[1]


def test_cognee_adapter_has_no_openai_or_anthropic_egress():
    source = (ROOT / "services" / "cognee_memory.py").read_text(encoding="utf-8")
    tree = ast.parse(source)
    imports = []
    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            imports.extend(alias.name for alias in node.names)
        elif isinstance(node, ast.ImportFrom) and node.module:
            imports.append(node.module)

    lowered = "\n".join(imports).lower()
    assert "openai" not in lowered
    assert "anthropic" not in lowered


def test_disabled_remember_does_not_load_cognee_or_provider(monkeypatch):
    get_settings.cache_clear()
    monkeypatch.delenv("COGNEE_ENABLED", raising=False)
    monkeypatch.delenv("COGNEE_MODE", raising=False)

    def fail_load():
        raise AssertionError("disabled Cognee remember must not load SDKs or providers")

    monkeypatch.setattr(cognee_memory, "_load_cognee", fail_load)
    scope = cognee_memory.MemoryScope(owner_uid="user-1", case_id="case-1")

    import asyncio

    result = asyncio.run(cognee_memory.remember(scope=scope, content="memo", source_id="doc-1"))
    assert result["status"] == "queued_disabled"


def test_enabled_config_rejects_raw_provider_key(monkeypatch):
    monkeypatch.setenv("COGNEE_ENABLED", "true")
    monkeypatch.setenv("COGNEE_MODE", "postgres-kuzu")
    monkeypatch.setenv("COGNEE_LLM_PROVIDER", "vertex_ai")
    monkeypatch.setenv("COGNEE_LLM_API_KEY", "sk-real-key")
    get_settings.cache_clear()

    health = cognee_memory.health()
    assert health.ready is False
    assert "vertex-adc" in (health.reason or "")

    get_settings.cache_clear()
