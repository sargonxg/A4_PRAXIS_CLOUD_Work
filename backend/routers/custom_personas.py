from __future__ import annotations

from backend.services.custom_personas import (
    CustomPersonaSandbox,
    generate_system_prompt,
    validate_custom_persona_spec,
)
from backend.types.boardroom import PersonaSpec


def prepare_custom_persona(spec: PersonaSpec) -> dict[str, object]:
    validated = validate_custom_persona_spec(spec)
    sandbox = CustomPersonaSandbox.from_spec(validated)
    return {
        "persona": validated.model_dump(),
        "systemPrompt": generate_system_prompt(validated),
        "sandbox": {
            "personaId": sandbox.persona_id,
            "allowedToolIds": sorted(sandbox.allowed_tool_ids),
            "corpusNamespace": sandbox.corpus_namespace,
        },
    }
