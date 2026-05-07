from pathlib import Path

from services.notifications.registry import NOTIFICATION_REGISTRY


ROOT = Path(__file__).resolve().parents[1]


SAMPLE_PAYLOADS = {
    "source_ingest_complete": {
        "case_id": "case-1",
        "source_id": "src-1",
        "source_title": "Ceasefire note",
        "candidates_count": 3,
        "embeddings_count": 12,
        "duration": 1.2,
    },
    "source_ingest_failed": {
        "case_id": "case-1",
        "source_id": "src-1",
        "source_title": "Ceasefire note",
        "error_class": "Timeout",
        "retry_count": 2,
    },
    "candidates_ready_batch": {"case_id": "case-1", "count": 10, "primitives": ["Actor", "Claim"]},
    "dedup_suggestion_ready": {"case_id": "case-1", "group_count": 2, "sample_names": ["Ministry", "MoFA"]},
    "thread_idle_nudge": {
        "case_id": "case-1",
        "thread_id": "thread-1",
        "question": "Which actor can credibly convene talks?",
        "last_recall_days_ago": 14,
    },
    "thread_closed_memified": {
        "case_id": "case-1",
        "thread_id": "thread-1",
        "memory_coverage_before": 0.2,
        "memory_coverage_after": 0.45,
    },
    "recipe_complete": {
        "case_id": "case-1",
        "run_id": "run-1",
        "recipe_id": "mediation.zopa-finder",
        "judgment_summary": "A narrow issue package is feasible.",
        "cost": 0.04,
    },
    "briefing_exported": {
        "case_id": "case-1",
        "briefing_id": "brief-1",
        "format": "pdf",
        "download_url": "/downloads/brief-1.pdf",
    },
    "budget_warning": {"case_id": "case-1", "used_tokens": 8000, "budget": 10000},
    "budget_paused": {"case_id": "case-1", "used_tokens": 10000, "resumes_at": "2026-05-08T08:00:00Z"},
    "cognee_degraded": {"queue_depth": 7, "last_failure_reason": "staging unavailable"},
    "ontology_update_available": {
        "slug": "mediation",
        "current_version": "1.0.0",
        "new_version": "1.1.0",
        "changelog_url": "/docs/ontology/mediation",
    },
    "ontology_gap_proposed": {
        "slug": "ceasefire-monitoring",
        "top_patterns": ["monitoring cell", "verification patrol"],
        "sample_quotes": ["monitoring cell proposed"],
    },
    "workspace_shared": {
        "workspace_id": "ws-1",
        "sharer_uid": "user-2",
        "sharer_name": "Analyst",
        "role": "editor",
    },
    "memo_comment": {
        "case_id": "case-1",
        "memo_id": "memo-1",
        "commenter_name": "Analyst",
        "snippet": "Tighten this assumption.",
    },
    "case_milestone": {"case_id": "case-1", "milestone_type": "first_memo"},
}


def test_notification_registry_has_all_typed_events():
    assert set(NOTIFICATION_REGISTRY) == set(SAMPLE_PAYLOADS)
    for event_type, spec in NOTIFICATION_REGISTRY.items():
        parsed = spec.payload_model.model_validate(SAMPLE_PAYLOADS[event_type])
        action_url = spec.action_url(parsed.model_dump())
        assert spec.category.value
        assert spec.default_urgency.value
        assert spec.default_channels
        assert spec.action_verb
        assert "{" not in action_url


def test_notification_schema_and_feedback_persistence_contract():
    migration = (ROOT / "migrations" / "versions" / "0018_notifications_feedback_system.py").read_text()
    for marker in [
        "recipient_uid text",
        "notification_signals",
        "notification_signals_tenant_isolation",
        "dedup_key text",
        "acted_at timestamptz",
        "dismissed_at timestamptz",
    ]:
        assert marker in migration

    service = (ROOT / "services" / "notifications" / "__init__.py").read_text()
    for marker in [
        "DEBOUNCE_WINDOW",
        "quiet_hours",
        "workspace_orchestrator_log",
        "save_interaction=True",
        "positive=signal == \"acted\"",
    ]:
        assert marker in service


def test_notifications_router_and_frontend_wiring_contract():
    router = (ROOT / "routers" / "notifications.py").read_text()
    for marker in [
        '@router.get("/stream")',
        '@router.post("/{notification_id}/signal")',
        '@router.get("/preferences")',
        '@router.put("/preferences")',
        '@router.post("/test")',
    ]:
        assert marker in router

    hook = (ROOT.parents[0] / "src" / "hooks" / "use-live-notifications.ts").read_text()
    assert "EventSource" in hook
    assert "/api/backend/notifications/stream" in hook
    assert "postSignal" in hook
