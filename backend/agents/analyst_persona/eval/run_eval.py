from __future__ import annotations

from backend.agents.analyst_persona.persona_loader import CANONICAL_PERSONA_IDS
from backend.agents.analyst_persona.runner import run_persona_contribution


def test_all_canonical_personas_emit_cited_synthesized_contributions() -> None:
    for persona_id in sorted(CANONICAL_PERSONA_IDS):
        contribution = run_persona_contribution(
            persona_id=persona_id,
            question="What should the mission do next?",
            contribution_id=f"eval-{persona_id}",
        )
        assert contribution.synthesized is True
        assert contribution.confidence <= 0.6
        assert contribution.citations
