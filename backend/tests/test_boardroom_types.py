from backend.agents.analyst_persona.runner import run_persona_contribution
from backend.agents.moderator.runner import run_moderated_deliberation
from backend.types.boardroom import PersonaContribution


def test_persona_contribution_schema() -> None:
    contribution = run_persona_contribution(
        persona_id="political-analyst",
        question="What should the mission do next?",
    )
    assert isinstance(contribution, PersonaContribution)
    assert contribution.synthesized is True
    assert contribution.confidence <= 0.6
    assert contribution.citations


def test_moderator_foundation_runner() -> None:
    result = run_moderated_deliberation(
        question="What should the mission do next?",
        participant_ids=["political-analyst", "security-analyst", "devils-advocate"],
    )
    assert len(result["turns"]) == 3
    assert result["cost"]["estimatedUsd"] <= result["cost"]["ceilingUsd"]
