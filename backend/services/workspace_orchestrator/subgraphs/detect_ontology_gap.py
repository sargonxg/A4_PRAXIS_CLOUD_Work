"""Workspace subgraph wrapper for ontology evolution proposals."""
from __future__ import annotations

from typing import Any

from services.ontology_evolution import (
    ONTOLOGY_EVOLUTION_CONFIDENCE_CAP,
    ONTOLOGY_EVOLUTION_EVENT,
    ONTOLOGY_EVOLUTION_SURFACE,
    detect_ontology_gap as detect_service_ontology_gap,
)


async def detect_ontology_gap(
    *,
    owner_uid: str,
    case_id: str,
    case_type: str,
    rejected_candidates: list[dict[str, Any]],
    steward: str | None = None,
) -> list[dict[str, Any]]:
    proposals = detect_service_ontology_gap(
        case_type=case_type,
        rejected_candidates=rejected_candidates,
        steward=steward,
    )
    return [
        {
            "owner_uid": owner_uid,
            "case_id": case_id,
            "target_chapter": "desk",
            "surface_key": ONTOLOGY_EVOLUTION_SURFACE,
            "kind": ONTOLOGY_EVOLUTION_EVENT,
            "title": proposal.title,
            "body": proposal.body,
            "confidence": min(proposal.confidence, ONTOLOGY_EVOLUTION_CONFIDENCE_CAP),
            "payload": proposal.payload,
        }
        for proposal in proposals
    ]
