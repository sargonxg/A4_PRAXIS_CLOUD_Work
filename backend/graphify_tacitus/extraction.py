"""V5 document extraction orchestration.

This module layers GLiNER L1 recall ahead of existing Gemini/ACO extraction so
precision extraction can focus on candidate spans while preserving provenance.
"""
from __future__ import annotations

from dataclasses import asdict
from typing import Any

from backend.services.gliner_pre_pass import detect_entities


def prepare_l1_candidates(text: str, primitives: list[str]) -> list[dict[str, Any]]:
    return [asdict(span) for span in detect_entities(text, primitives)]


async def extract_document_candidates(
    text: str,
    *,
    doc_id: str,
    ontology_ids: list[str],
    primitives: list[str],
    gemini_client: Any | None = None,
) -> dict[str, Any]:
    """Run GLiNER L1 candidates and optional Gemini L2 typed extraction."""
    l1_spans = prepare_l1_candidates(text, primitives)
    if gemini_client is None:
        return {
            "doc_id": doc_id,
            "ontology_ids": ontology_ids,
            "l1_spans": l1_spans,
            "nodes": [],
            "edges": [],
            "mode": "gliner-pre-pass-only",
        }
    prompt_context = {
        "doc_id": doc_id,
        "ontology_ids": ontology_ids,
        "candidate_spans": l1_spans[:200],
        "text": text[:60_000],
    }
    result = await gemini_client.extract_aco(prompt_context)
    result.setdefault("doc_id", doc_id)
    result.setdefault("l1_spans", l1_spans)
    return result
