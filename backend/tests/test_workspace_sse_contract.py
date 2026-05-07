from routers.workspace import _sse, _sse_event_name


def test_workspace_sse_uses_ids_named_events_and_data_payload():
    event = {
        "id": "evt-1",
        "caseId": "case-1",
        "surfaceKey": "workspace",
        "status": "working",
        "message": "Running",
        "createdAt": "2026-05-07T12:00:00Z",
    }

    payload = _sse(event)

    assert payload.startswith("id: evt-1\nevent: progress\n")
    assert "\ndata: " in payload
    assert payload.endswith("\n\n")


def test_workspace_sse_event_name_uses_pre_ship_vocabulary():
    assert _sse_event_name({"status": "complete"}) == "complete"
    assert _sse_event_name({"status": "failed"}) == "fail"
    assert _sse_event_name({"status": "working"}) == "progress"
    assert _sse_event_name({"status": "idle", "payload": {"eventType": "start"}}) == "start"
    assert _sse_event_name({"status": "idle"}) == "step"
