from __future__ import annotations

from datetime import UTC, datetime

from backend.agents.analyst_persona.persona_loader import load_persona_summary
from backend.types.boardroom import Citation, PersonaContribution


def run_persona_contribution(
    *,
    persona_id: str,
    question: str,
    phase: str = "initial_takes",
    contribution_id: str = "persona-turn",
) -> PersonaContribution:
    persona = load_persona_summary(persona_id)
    text = (
        f"{persona['shortRole']} contribution on '{question}'. "
        "This foundation runner only emits advisory synthesized text with a corpus citation; "
        "live Agent Engine execution is a Pack 16 deployment follow-up."
    )
    return PersonaContribution(
        id=contribution_id,
        personaId=persona_id,
        personaName=persona["displayName"],
        phase=phase,  # type: ignore[arg-type]
        contributionType="initial_take",
        text=text,
        citations=[
            Citation(
                id=f"{persona_id}-foundation-corpus",
                label="Canonical persona corpus manifest",
                sourceType="corpus",
                sourceRef=persona["corpusNamespace"],
            )
        ],
        toolUses=[],
        wordCount=len(text.split()),
        confidence=0.6,
        synthesized=True,
        createdAt=datetime.now(UTC).isoformat(),
    )
