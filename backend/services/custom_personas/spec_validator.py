from __future__ import annotations

from backend.types.boardroom import PersonaSpec


MAX_CUSTOM_PERSONAS_PER_WORKSPACE = 10
MAX_CORPUS_DOCUMENTS = 50


def validate_custom_persona_spec(spec: PersonaSpec) -> PersonaSpec:
    if not spec.id.startswith("custom:"):
        raise ValueError("custom persona ids must start with 'custom:'")

    corpus = spec.corpus
    manifest = corpus.get("manifest")
    if not isinstance(manifest, list) or len(manifest) == 0:
        raise ValueError("custom personas require at least one corpus manifest entry")
    if len(manifest) > MAX_CORPUS_DOCUMENTS:
        raise ValueError(f"custom personas are capped at {MAX_CORPUS_DOCUMENTS} corpus documents")

    tools = spec.tools.get("proficientToolIds")
    if not isinstance(tools, list) or not all(isinstance(tool, str) and tool for tool in tools):
        raise ValueError("custom personas must declare at least one allowed tool")

    return spec
