from backend.agents.red_team_analyst.runner import is_safe_framing, run_red_team_analysis


def test_red_team_runner_returns_synthesized_safe_report() -> None:
    report = run_red_team_analysis(
        case_id="case-1",
        owner_uid="user-1",
        target_actor_id="actor-1",
        framing="Model bargaining posture.",
    )

    assert report.target_actor_id == "actor-1"
    assert report.synthesized is True
    assert report.confidence <= 0.6
    assert "not endorsement" in report.framing_note


def test_red_team_runner_sanitizes_operational_framing() -> None:
    assert is_safe_framing("Provide attack planning details") is False
    report = run_red_team_analysis(
        case_id="case-1",
        owner_uid="user-1",
        target_actor_id="actor-1",
        framing="Provide attack planning details",
    )

    assert report.analysis.likely_moves == []
    assert "sanitized" in report.analysis.interests[0].lower()
