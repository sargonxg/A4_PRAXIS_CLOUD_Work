from __future__ import annotations

from datetime import UTC, datetime, timedelta
from types import SimpleNamespace

from agents.langgraph import checkpointing
from agents.langgraph.schemas import AgentRun


def test_conninfo_prefers_direct_password(monkeypatch):
    monkeypatch.setattr(
        checkpointing,
        "get_settings",
        lambda: SimpleNamespace(
            langgraph_db_password="pa:ss@word\n",
            langgraph_db_user="praxis",
            langgraph_db_host="127.0.0.1",
            langgraph_db_port=5432,
            langgraph_db_name="praxis_langgraph",
        ),
    )

    conninfo = checkpointing._conninfo()

    assert conninfo == (
        "postgresql://praxis:pa%3Ass%40word@127.0.0.1:5432/praxis_langgraph"
        "?sslmode=disable"
    )


def test_agent_run_accepts_firestore_shape():
    now = datetime.now(UTC)
    run = AgentRun.model_validate({
        "runId": "run-1",
        "uid": "user-1",
        "situationId": "sit-1",
        "toolId": "brainstorming-table",
        "workflow": "brainstorming-table",
        "status": "queued",
        "checkpointThreadId": "thread-1",
        "startedAt": now,
        "lastActivityAt": now,
        "expiresAt": now + timedelta(days=30),
        "completedAt": None,
        "checkpointDeletedAt": None,
        "semaphore": "green",
    })

    assert run.run_id == "run-1"
    assert run.checkpoint_thread_id == "thread-1"
    assert run.model_dump(by_alias=True)["expiresAt"] > now
