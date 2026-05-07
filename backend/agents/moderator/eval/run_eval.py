from __future__ import annotations

from backend.agents.moderator.runner import run_moderated_deliberation


def test_moderator_enforces_cost_ceiling_and_returns_turns() -> None:
    result = run_moderated_deliberation(
        question="What should the mission do next?",
        participant_ids=["political-analyst", "security-analyst", "devils-advocate"],
    )
    assert result["turns"]
    cost = result["cost"]
    assert cost["estimatedUsd"] <= cost["ceilingUsd"]
