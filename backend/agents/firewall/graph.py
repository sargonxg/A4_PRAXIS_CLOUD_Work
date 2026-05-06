"""Symbolic firewall claim verification.

Phase 2 policy: user-visible claims must be graph-grounded, inferred from a
source receipt, or rejected.
"""
from __future__ import annotations

import re
from dataclasses import dataclass
from typing import Any, Literal

from services.pgvector import retrieve
from services.trust_scores import persist_trust_score

ClaimStatus = Literal["GRAPH_GROUNDED", "INFERRED", "REJECTED"]


@dataclass(frozen=True)
class FirewallDecision:
    claim: str
    status: ClaimStatus
    score: int
    evidence: dict[str, Any]

    def as_dict(self) -> dict[str, Any]:
        return {
            "claim": self.claim,
            "status": self.status,
            "score": self.score,
            "evidence": self.evidence,
        }


def validate_cypher(cypher: str) -> None:
    tokens = {token.upper() for token in re.split(r"[^A-Za-z_]+", cypher)}
    forbidden = {"CREATE", "MERGE", "SET", "DELETE", "REMOVE", "DROP", "DETACH", "LOAD", "CALL"}
    if tokens & forbidden:
        raise ValueError("Cypher must be read-only")
    if "MATCH" not in tokens or "RETURN" not in tokens:
        raise ValueError("Cypher must contain MATCH and RETURN")


async def verify_claim(
    tenant_id: str,
    uid: str,
    situation_id: str,
    claim: str,
    *,
    neo4j_client: Any | None = None,
    source_receipts: list[dict[str, Any]] | None = None,
    claim_id: str | None = None,
) -> dict[str, Any]:
    graph_rows: list[dict[str, Any]] = []
    if neo4j_client is not None:
        cypher = "MATCH (n) WHERE toLower(coalesce(n.name, n.label, n.id, '')) CONTAINS toLower($needle) RETURN n LIMIT 5"
        validate_cypher(cypher)
        needle = _needle(claim)
        graph_rows = await neo4j_client.query(cypher, {"needle": needle}, tenant_id=tenant_id)

    if graph_rows:
        decision = FirewallDecision(
            claim=claim,
            status="GRAPH_GROUNDED",
            score=95,
            evidence={"graph_rows": graph_rows[:5]},
        )
    else:
        receipts = source_receipts or await retrieve(tenant_id, situation_id, claim, k=3, filters={})
        strong = [receipt for receipt in receipts if float(receipt.get("similarity", receipt.get("reliabilityScore", 0.0)) or 0.0) >= 0.25]
        if strong:
            score = min(89, 60 + int(20 * max(float(r.get("similarity", r.get("reliabilityScore", 0.0)) or 0.0) for r in strong)))
            decision = FirewallDecision(
                claim=claim,
                status="INFERRED",
                score=score,
                evidence={"source_receipts": strong[:3]},
            )
        else:
            decision = FirewallDecision(
                claim=claim,
                status="REJECTED",
                score=0,
                evidence={"reason": "No graph match or strong source receipt"},
            )

    await persist_trust_score(
        tenant_id=tenant_id,
        uid=uid,
        situation_id=situation_id,
        claim_id=claim_id,
        claim=claim,
        score=decision.score,
        status=decision.status,
        evidence=decision.evidence,
    )
    return decision.as_dict()


def _needle(claim: str) -> str:
    words = [word for word in re.findall(r"[A-Za-z][A-Za-z0-9_-]+", claim) if len(word) > 3]
    return " ".join(words[:4]) or claim[:64]
