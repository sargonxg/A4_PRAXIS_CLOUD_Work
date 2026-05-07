"""Gemini precision extraction helper with optional GLiNER recall candidates."""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from backend.graphify_tacitus.extract import ACO_EXTRACTION_PROMPT, _parse_llm_response


@dataclass(frozen=True)
class NerEntity:
    text: str
    label: str
    start: int
    end: int
    confidence: float


def build_verification_prompt(text: str, ner_candidates: list[NerEntity], ontology_ids: list[str]) -> str:
    candidates = "\n".join(
        f"- {candidate.label}: {candidate.text} [{candidate.start}:{candidate.end}] confidence={candidate.confidence:.2f}"
        for candidate in ner_candidates[:200]
    )
    return (
        f"{ACO_EXTRACTION_PROMPT}\n\n"
        "GLiNER produced high-recall candidate spans. Verify them, reject false positives, "
        "link them into ACO nodes/edges, and add only source-grounded assertions.\n"
        f"ONTOLOGIES: {', '.join(ontology_ids)}\n"
        f"CANDIDATE SPANS:\n{candidates}\n\nSOURCE TEXT:\n{text[:30000]}"
    )


def build_full_extraction_prompt(text: str, ontology_ids: list[str]) -> str:
    return f"{ACO_EXTRACTION_PROMPT}\n\nONTOLOGIES: {', '.join(ontology_ids)}\n\nSOURCE TEXT:\n{text[:30000]}"


async def extract_structured_claims(
    text: str,
    ontology_ids: list[str],
    *,
    gemini_client: Any,
    ner_candidates: list[NerEntity] | None = None,
    source_file: str = "document",
    tenant_id: str = "",
    situation_id: str = "",
):
    prompt = build_verification_prompt(text, ner_candidates, ontology_ids) if ner_candidates else build_full_extraction_prompt(text, ontology_ids)
    raw = await gemini_client.generate(prompt)
    return _parse_llm_response(raw, source_file, tenant_id, situation_id)
