"""Bridge between Cognee candidates and the canonical ACO graph.

Cognee-derived data remains probabilistic. This bridge only writes candidate
links and review decisions; canonical graph writes still go through NodeRepo.
"""
from __future__ import annotations

from dataclasses import dataclass, field
import logging
from typing import TYPE_CHECKING, Any

from config import get_settings
from services.cognee_memory import MemoryScope

if TYPE_CHECKING:
    from services.postgres import TenantConnection


logger = logging.getLogger("praxis.cognee")


@dataclass(frozen=True)
class CogneeCandidate:
    cognee_node_id: str
    label: str
    internal_score: float
    source_chunk_id: str | None = None
    metadata: dict[str, Any] = field(default_factory=dict)
    model: str | None = None
    run_id: str | None = None


def capped_confidence(score: float) -> float:
    settings = get_settings()
    return round(max(0.0, min(float(score), settings.cognee_promotion_confidence_ceiling)), 3)


async def write_candidate_links(
    conn: "TenantConnection",
    *,
    scope: MemoryScope,
    candidates: list[CogneeCandidate],
) -> list[dict[str, Any]]:
    settings = get_settings()
    accepted = [
        candidate
        for candidate in candidates
        if candidate.internal_score >= settings.cognee_candidate_floor
    ][: settings.cognee_max_candidates]
    rows: list[dict[str, Any]] = []
    for candidate in accepted:
        inserted = await conn.fetch(
            """
            INSERT INTO aco_cognee_link (
              case_id, owner_uid, cognee_node_id, cognee_dataset, link_kind,
              confidence, internal_score, source_chunk_id, label, metadata, model, run_id
            )
            VALUES (%s, %s, %s, %s, 'candidate', %s, %s, %s, %s, %s::jsonb, %s, %s)
            ON CONFLICT (cognee_dataset, cognee_node_id) DO UPDATE SET
              confidence = LEAST(EXCLUDED.confidence, 0.600),
              internal_score = EXCLUDED.internal_score,
              source_chunk_id = COALESCE(EXCLUDED.source_chunk_id, aco_cognee_link.source_chunk_id),
              label = EXCLUDED.label,
              metadata = EXCLUDED.metadata,
              model = EXCLUDED.model,
              run_id = EXCLUDED.run_id,
              link_kind = CASE
                WHEN aco_cognee_link.link_kind = 'promoted' THEN 'promoted'
                ELSE 'candidate'
              END
            RETURNING *
            """,
            scope.case_id,
            scope.owner_uid,
            candidate.cognee_node_id,
            scope.dataset,
            capped_confidence(candidate.internal_score),
            candidate.internal_score,
            candidate.source_chunk_id,
            candidate.label,
            candidate.metadata,
            candidate.model,
            candidate.run_id,
        )
        rows.extend(inserted)
    if rows:
        logger.info(
            "cognee.candidates.written owner_uid=%s case_id=%s count=%s",
            scope.owner_uid,
            scope.case_id,
            len(rows),
        )
    return rows


async def promote_link(
    conn: "TenantConnection",
    *,
    owner_uid: str,
    case_id: str,
    link_id: str,
    aco_node_id: str,
    reviewed_by: str,
) -> dict[str, Any]:
    rows = await conn.fetch(
        """
        UPDATE aco_cognee_link
        SET link_kind = 'promoted',
            aco_node_id = %s::uuid,
            reviewed_at = now(),
            reviewed_by = %s
        WHERE id = %s::uuid
          AND owner_uid = %s
          AND case_id = %s
          AND confidence <= 0.600
        RETURNING *
        """,
        aco_node_id,
        reviewed_by,
        link_id,
        owner_uid,
        case_id,
    )
    if not rows:
        raise ValueError("No promotable Cognee link found")
    return rows[0]


async def reject_link(
    conn: "TenantConnection",
    *,
    owner_uid: str,
    case_id: str,
    link_id: str,
    reviewed_by: str,
    notes: str | None = None,
) -> dict[str, Any]:
    rows = await conn.fetch(
        """
        UPDATE aco_cognee_link
        SET link_kind = 'rejected',
            reviewed_at = now(),
            reviewed_by = %s,
            notes = %s
        WHERE id = %s::uuid
          AND owner_uid = %s
          AND case_id = %s
        RETURNING *
        """,
        reviewed_by,
        notes,
        link_id,
        owner_uid,
        case_id,
    )
    if not rows:
        raise ValueError("No Cognee link found")
    return rows[0]
