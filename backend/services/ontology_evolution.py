"""Advisory ontology evolution loop for repeated ungrounded patterns.

The loop proposes workspace suggestions only. It does not mutate OWL files,
firewall rules, RLS policy, or substrate rows.
"""
from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from typing import Any

from services.ontology_system import normalize_case_type


ONTOLOGY_EVOLUTION_EVENT = "ontology_evolution_proposed"
ONTOLOGY_EVOLUTION_SURFACE = "ontology.evolution"
ONTOLOGY_EVOLUTION_CONFIDENCE_CAP = 0.55


@dataclass(frozen=True)
class UngroundedPattern:
    case_type: str
    label: str
    suggested_primitive: str
    frequency: int
    sample_quotes: tuple[str, ...]
    suggested_fields: tuple[str, ...]


@dataclass(frozen=True)
class OntologyGapProposal:
    case_type: str
    kind: str
    title: str
    body: str
    confidence: float
    payload: dict[str, Any]


def _candidate_key(candidate: dict[str, Any]) -> tuple[str, str]:
    label = str(
        candidate.get("pattern")
        or candidate.get("label")
        or candidate.get("name")
        or "Ungrounded pattern"
    ).strip()
    primitive = str(
        candidate.get("suggested_primitive")
        or candidate.get("primitive")
        or candidate.get("base_class")
        or "Claim"
    ).strip()
    return (label.lower(), primitive)


def _sample_quotes(candidates: list[dict[str, Any]]) -> tuple[str, ...]:
    quotes: list[str] = []
    for candidate in candidates:
        quote = candidate.get("source_quote") or candidate.get("quote") or candidate.get("text")
        if quote and quote not in quotes:
            quotes.append(str(quote)[:500])
        if len(quotes) == 3:
            break
    return tuple(quotes)


def _suggested_fields(candidates: list[dict[str, Any]]) -> tuple[str, ...]:
    fields: list[str] = []
    for candidate in candidates:
        metadata = candidate.get("metadata") or {}
        raw_fields = candidate.get("suggested_fields") or metadata.get("suggested_fields") or []
        for field in raw_fields:
            value = str(field).strip()
            if value and value not in fields:
                fields.append(value)
    return tuple(fields[:8])


def detect_ontology_gap(
    *,
    case_type: str,
    rejected_candidates: list[dict[str, Any]],
    min_frequency: int = 5,
    steward: str | None = None,
) -> list[OntologyGapProposal]:
    """Create advisory proposals when repeated extraction rejects cluster.

    Rejections usually come from firewall/subtype checks or manual analyst
    review. The proposal is intentionally soft: it can be reviewed by a steward
    but cannot change the ontology by itself.
    """
    normalized_case_type = normalize_case_type(case_type)
    if not normalized_case_type:
        return []

    grouped: dict[tuple[str, str], list[dict[str, Any]]] = defaultdict(list)
    for candidate in rejected_candidates:
        if not candidate:
            continue
        grouped[_candidate_key(candidate)].append(candidate)

    proposals: list[OntologyGapProposal] = []
    for (label_key, primitive), candidates in grouped.items():
        if len(candidates) < min_frequency:
            continue
        label = str(
            candidates[0].get("pattern")
            or candidates[0].get("label")
            or candidates[0].get("name")
            or label_key.title()
        )
        pattern = UngroundedPattern(
            case_type=normalized_case_type,
            label=label,
            suggested_primitive=primitive,
            frequency=len(candidates),
            sample_quotes=_sample_quotes(candidates),
            suggested_fields=_suggested_fields(candidates),
        )
        payload = {
            "event": ONTOLOGY_EVOLUTION_EVENT,
            "case_type": pattern.case_type,
            "pattern": pattern.label,
            "suggested_primitive": pattern.suggested_primitive,
            "frequency": pattern.frequency,
            "sample_quotes": list(pattern.sample_quotes),
            "suggested_fields": list(pattern.suggested_fields),
            "steward": steward or "ontology-steward",
            "review_required": True,
            "mutates_ontology": False,
        }
        proposals.append(
            OntologyGapProposal(
                case_type=pattern.case_type,
                kind=ONTOLOGY_EVOLUTION_EVENT,
                title=f"Review ontology gap: {pattern.label}",
                body=(
                    f"{pattern.frequency} rejected candidates in {pattern.case_type} "
                    f"share a pattern not grounded by the current stack."
                ),
                confidence=ONTOLOGY_EVOLUTION_CONFIDENCE_CAP,
                payload=payload,
            )
        )

    return proposals
