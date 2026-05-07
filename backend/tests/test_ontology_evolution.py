from __future__ import annotations

import asyncio
import sys
from pathlib import Path

ROOT = Path(__file__).parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from services.ontology_evolution import ONTOLOGY_EVOLUTION_EVENT, detect_ontology_gap
from services.workspace_orchestrator.subgraphs.detect_ontology_gap import (
    detect_ontology_gap as detect_ontology_gap_subgraph,
)


def test_repeated_rejected_candidates_create_advisory_gap_proposal():
    candidates = [
        {
            "pattern": "informal shuttle guarantee",
            "suggested_primitive": "Commitment",
            "source_quote": f"Shuttle note {index} records an informal guarantee.",
            "suggested_fields": ["guarantor", "condition"],
        }
        for index in range(5)
    ]

    proposals = detect_ontology_gap(
        case_type="negotiation-mediation",
        rejected_candidates=candidates,
        steward="Giulio",
    )

    assert len(proposals) == 1
    proposal = proposals[0]
    assert proposal.kind == ONTOLOGY_EVOLUTION_EVENT
    assert proposal.confidence <= 0.6
    assert proposal.payload["review_required"] is True
    assert proposal.payload["mutates_ontology"] is False
    assert proposal.payload["frequency"] == 5
    assert proposal.payload["suggested_fields"] == ["guarantor", "condition"]


def test_low_frequency_rejected_candidates_do_not_create_gap_proposal():
    proposals = detect_ontology_gap(
        case_type="negotiation-mediation",
        rejected_candidates=[
            {
                "pattern": "rare procedural phrasing",
                "suggested_primitive": "Claim",
                "source_quote": "Only one rejection is not enough.",
            }
        ],
    )

    assert proposals == []


def test_subgraph_shapes_workspace_suggestion_without_mutating_ontology():
    candidates = [
        {
            "label": "humanitarian deconfliction window",
            "primitive": "Constraint",
            "quote": f"Access note {index} cites a repeated deconfliction window.",
        }
        for index in range(6)
    ]

    suggestions = asyncio.run(
        detect_ontology_gap_subgraph(
            owner_uid="user-1",
            case_id="case-1",
            case_type="humanitarian-crisis",
            rejected_candidates=candidates,
        )
    )

    assert len(suggestions) == 1
    suggestion = suggestions[0]
    assert suggestion["target_chapter"] == "desk"
    assert suggestion["surface_key"] == "ontology.evolution"
    assert suggestion["kind"] == ONTOLOGY_EVOLUTION_EVENT
    assert suggestion["confidence"] <= 0.6
    assert suggestion["payload"]["mutates_ontology"] is False
