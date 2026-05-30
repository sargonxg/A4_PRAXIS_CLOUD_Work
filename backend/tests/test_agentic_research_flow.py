from backend.ai.flows import (
    build_agentic_research_flow_plan,
    run_agentic_research_flow,
    verify_agentic_research_claims,
)


def test_agentic_flow_plan_has_ordered_phases():
    plan = build_agentic_research_flow_plan(
        query="What changed in the sanctions regime?",
        capsule={"id": "sanctions", "sourcing": {"minSourcesPerClaim": 2}},
    )

    assert [step["phase"] for step in plan["steps"]] == [
        "plan",
        "source",
        "retrieve",
        "verify",
        "synthesize",
    ]
    assert plan["minSourcesPerClaim"] == 2


def test_verify_agentic_research_claims_enforces_thresholds():
    result = verify_agentic_research_claims(
        claims=[
            {"id": "c1", "text": "Supported", "sourceIds": ["s1", "s2"]},
            {"id": "c2", "text": "Unsupported", "sourceIds": []},
        ],
        min_sources_per_claim=2,
        max_ungrounded_claims=0,
    )

    assert result["status"] == "fail"
    assert result["unsupportedClaims"] == ["c2"]
    assert result["failures"] == ["1 claim(s) have no supporting sources; maximum allowed is 0."]


def test_run_agentic_research_flow_persists_agent_run_events():
    events = []
    output = run_agentic_research_flow(
        {
            "agentRunId": "run-1",
            "query": "What changed?",
            "capsule": {"id": "capsule-1", "sourcing": {"minSourcesPerClaim": 1}},
            "sourceReceipts": [{"id": "s1", "title": "Source", "snippet": "Evidence"}],
            "claims": [{"id": "c1", "text": "Claim", "sourceIds": ["s1"]}],
        },
        persist_event=events.append,
    )

    assert output["status"] == "ready"
    assert [event["phase"] for event in events] == ["plan", "source", "retrieve", "verify", "synthesize"]
    assert all(event["agentRunId"] == "run-1" for event in events)
