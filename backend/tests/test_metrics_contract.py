from __future__ import annotations

import asyncio
import sys
from pathlib import Path

ROOT = Path(__file__).parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from services import cognee_memory
from services.cognee_memory import CogneeSearchMode, MemoryScope
from services.metrics import record_tenant_session_reset, render_prometheus, reset_metrics_for_tests


def test_metrics_render_prometheus_contract():
    reset_metrics_for_tests()
    record_tenant_session_reset()

    body = render_prometheus()

    assert "# TYPE tenant_session_resets_total counter" in body
    assert "tenant_session_resets_total 1" in body
    assert "# TYPE cognee_calls_total counter" in body
    assert "# TYPE cognee_latency_seconds summary" in body


def test_disabled_cognee_calls_emit_metrics():
    reset_metrics_for_tests()
    scope = MemoryScope(owner_uid="user-1", case_id="case-1")

    asyncio.run(cognee_memory.search(scope=scope, query="test", mode=CogneeSearchMode.CHUNKS))
    asyncio.run(cognee_memory.remember(scope=scope, content="Frame", source_id="frame-1"))

    body = render_prometheus()

    assert 'cognee_calls_total{mode="CHUNKS",operation="search",status="disabled"} 1' in body
    assert 'cognee_calls_total{mode="none",operation="remember",status="disabled"} 1' in body
    assert 'cognee_latency_seconds_count{mode="CHUNKS",operation="search"} 1' in body
