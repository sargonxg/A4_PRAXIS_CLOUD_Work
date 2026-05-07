from __future__ import annotations


CANONICAL_PERSONA_IDS = {
    "political-analyst",
    "security-analyst",
    "humanitarian-analyst",
    "legal-adviser",
    "mediation-strategist",
    "media-analyst",
    "economist",
    "regional-expert",
    "devils-advocate",
    "synthesis-lead",
}


def load_persona_summary(persona_id: str) -> dict[str, str]:
    if persona_id not in CANONICAL_PERSONA_IDS and not persona_id.startswith("custom:"):
        raise ValueError(f"unknown persona_id: {persona_id}")
    label = persona_id.replace("-", " ").title()
    return {
        "id": persona_id,
        "displayName": label,
        "shortRole": label,
        "corpusNamespace": f"persona:canonical:{persona_id}:v1.0.0",
    }
