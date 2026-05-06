"""Trust Score persistence helpers."""
from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

_TRUST_SCORES: list[dict[str, Any]] = []


async def persist_trust_score(
    tenant_id: str,
    uid: str,
    situation_id: str,
    score: int,
    status: str,
    evidence: dict[str, Any],
    *,
    claim_id: str | None = None,
    claim: str | None = None,
    export_id: str | None = None,
    work_product_id: str | None = None,
    paragraph_id: str | None = None,
) -> dict[str, Any]:
    row = {
        "id": f"trust-{len(_TRUST_SCORES) + 1}",
        "tenant_id": tenant_id,
        "uid": uid,
        "situation_id": situation_id,
        "export_id": export_id,
        "work_product_id": work_product_id,
        "paragraph_id": paragraph_id,
        "claim_id": claim_id,
        "claim": claim,
        "score": max(0, min(100, int(score))),
        "status": status,
        "evidence": evidence,
        "created_at": datetime.now(UTC).isoformat(),
    }
    _TRUST_SCORES.append(row)
    return row


async def recent_trust_scores(tenant_id: str, situation_id: str, limit: int = 20) -> list[dict[str, Any]]:
    rows = [
        row for row in _TRUST_SCORES
        if row["tenant_id"] == tenant_id and row["situation_id"] == situation_id
    ]
    return rows[-limit:]


def clear_trust_scores() -> None:
    _TRUST_SCORES.clear()
