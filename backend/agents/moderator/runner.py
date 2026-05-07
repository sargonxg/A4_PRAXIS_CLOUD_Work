from __future__ import annotations

from backend.agents.analyst_persona.runner import run_persona_contribution


def run_moderated_deliberation(
    *,
    question: str,
    participant_ids: list[str],
    cost_ceiling_usd: float = 1.50,
) -> dict[str, object]:
    turns = []
    estimated_cost = 0.0
    for index, persona_id in enumerate(participant_ids):
        if estimated_cost >= cost_ceiling_usd:
            break
        turns.append(
            run_persona_contribution(
                persona_id=persona_id,
                question=question,
                contribution_id=f"moderated-{index + 1}",
            ).model_dump()
        )
        estimated_cost += 0.035

    return {
        "question": question,
        "turns": turns,
        "cost": {
            "ceilingUsd": cost_ceiling_usd,
            "estimatedUsd": round(estimated_cost, 3),
            "ceilingReached": estimated_cost >= cost_ceiling_usd,
        },
        "status": "foundation-scaffold",
    }
