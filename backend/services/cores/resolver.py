"""Context Core resolution for v7 Ask PRAXIS.

This service keeps cores useful before the full cores router ships. It resolves
the implicit User/Situation cores plus explicit Ask attachments into a compact
snapshot that can be persisted, displayed, and later fed into calibration.
"""
from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Any
from uuid import UUID

from psycopg.types.json import Jsonb

from services.postgres import TenantConnection


@dataclass(frozen=True)
class ResolvedCore:
    id: str
    kind: str
    name: str
    status: str
    ontology_id: str | None
    ontology_version: str | None
    tags: list[str]
    summary: str
    metadata_keys: list[str]
    implicit: bool = False

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


@dataclass(frozen=True)
class CoreContextSnapshot:
    attached_core_ids: list[str]
    implicit_core_ids: list[str]
    resolved_cores: list[ResolvedCore]
    missing_core_ids: list[str]
    ontology_binding: dict[str, Any] | None
    context_health: int
    advisories: list[str]

    def to_dict(self) -> dict[str, Any]:
        return {
            "attachedCoreIds": self.attached_core_ids,
            "implicitCoreIds": self.implicit_core_ids,
            "resolvedCores": [core.to_dict() for core in self.resolved_cores],
            "missingCoreIds": self.missing_core_ids,
            "ontologyBinding": self.ontology_binding,
            "contextHealth": self.context_health,
            "advisories": self.advisories,
        }


async def resolve_ask_core_context(
    conn: TenantConnection,
    owner_uid: str,
    situation_id: str | None,
    attached_core_ids: list[UUID],
) -> CoreContextSnapshot:
    explicit_ids = [str(core_id) for core_id in attached_core_ids]
    rows_by_id: dict[str, dict[str, Any]] = {}
    implicit_ids: list[str] = []
    advisories: list[str] = []

    if explicit_ids:
        explicit_rows = await conn.fetch(
            """
            SELECT *
            FROM cores
            WHERE owner_uid = %s
              AND status = 'active'
              AND id = ANY(%s::uuid[])
            """,
            owner_uid,
            explicit_ids,
        )
        rows_by_id.update({str(row["id"]): row for row in explicit_rows})

    user_rows = await conn.fetch(
        """
        SELECT *
        FROM cores
        WHERE owner_uid = %s AND kind = 'user' AND status = 'active'
        ORDER BY updated_at DESC
        LIMIT 1
        """,
        owner_uid,
    )
    if user_rows:
        user_id = str(user_rows[0]["id"])
        rows_by_id.setdefault(user_id, user_rows[0])
        implicit_ids.append(user_id)
    else:
        advisories.append("User Core is not materialized yet; Ask will use the legacy analyst profile fallback.")

    situation_core_id: str | None = None
    if situation_id:
        situation_rows = await conn.fetch(
            """
            SELECT *
            FROM cores
            WHERE owner_uid = %s
              AND kind = 'situation'
              AND status = 'active'
              AND (
                metadata->>'situation_id' = %s
                OR metadata->>'case_id' = %s
                OR metadata->>'caseId' = %s
                OR metadata->>'slug' = %s
              )
            ORDER BY updated_at DESC
            LIMIT 1
            """,
            owner_uid,
            situation_id,
            situation_id,
            situation_id,
            situation_id,
        )
        if situation_rows:
            situation_core_id = str(situation_rows[0]["id"])
            rows_by_id.setdefault(situation_core_id, situation_rows[0])
            implicit_ids.append(situation_core_id)
        else:
            advisories.append("Situation Core is not linked yet; Ask saved the case id and will use legacy situation context.")

    missing_ids = [core_id for core_id in explicit_ids if core_id not in rows_by_id]
    if missing_ids:
        advisories.append(f"{len(missing_ids)} attached core(s) were not found or not readable by this user.")

    resolved = [
        _resolved_core(row, implicit=str(row["id"]) in set(implicit_ids))
        for row in sorted(rows_by_id.values(), key=_core_sort_key)
    ]
    ontology_binding = _ontology_binding(resolved)
    context_health = _context_health(resolved, situation_id)

    return CoreContextSnapshot(
        attached_core_ids=[core.id for core in resolved],
        implicit_core_ids=implicit_ids,
        resolved_cores=resolved,
        missing_core_ids=missing_ids,
        ontology_binding=ontology_binding,
        context_health=context_health,
        advisories=advisories,
    )


async def record_core_attachments(
    conn: TenantConnection,
    owner_uid: str,
    actor_uid: str,
    thread_id: str,
    snapshot: CoreContextSnapshot,
) -> None:
    for core in snapshot.resolved_cores:
        await conn.execute(
            """
            INSERT INTO core_audit (owner_uid, core_id, actor_uid, action, after, metadata)
            VALUES (%s, %s::uuid, %s, 'attach', %s::jsonb, %s::jsonb)
            """,
            owner_uid,
            core.id,
            actor_uid,
            Jsonb({"threadId": thread_id, "surface": "ask"}),
            Jsonb({"source": "v7.ask.run"}),
        )


def _resolved_core(row: dict[str, Any], implicit: bool) -> ResolvedCore:
    metadata = row.get("metadata") or {}
    return ResolvedCore(
        id=str(row["id"]),
        kind=str(row["kind"]),
        name=str(row["name"]),
        status=str(row["status"]),
        ontology_id=row.get("ontology_id") or metadata.get("ontology_id"),
        ontology_version=row.get("ontology_version") or metadata.get("ontology_version"),
        tags=list(row.get("tags") or []),
        summary=_summary(str(row["kind"]), metadata),
        metadata_keys=sorted(str(key) for key in metadata.keys())[:12],
        implicit=implicit,
    )


def _summary(kind: str, metadata: dict[str, Any]) -> str:
    if kind == "user":
        role = metadata.get("role") or "analyst"
        style = metadata.get("style") or {}
        return f"{role}; {style.get('citation_density', 'medium')} citation density"
    if kind == "situation":
        frame = metadata.get("frame") or {}
        policy_question = frame.get("policy_question") or frame.get("what_is_happening")
        if policy_question:
            return str(policy_question)[:180]
        return "Situation frame available"
    if kind == "source":
        return f"{metadata.get('source_receipts_count', 0)} source receipt(s)"
    if kind == "document":
        return f"{metadata.get('document_count', 0)} document(s)"
    if kind == "graph":
        return f"Ontology {metadata.get('ontology_id', 'unbound')}; confidence floor {metadata.get('confidence_floor', 0.45)}"
    if kind == "output":
        return f"{metadata.get('output_count', 0)} output(s)"
    return "Core metadata available"


def _ontology_binding(resolved: list[ResolvedCore]) -> dict[str, Any] | None:
    for core in resolved:
        if core.kind in {"situation", "graph"} and core.ontology_id:
            return {
                "coreId": core.id,
                "ontologyId": core.ontology_id,
                "ontologyVersion": core.ontology_version,
            }
    return None


def _context_health(resolved: list[ResolvedCore], situation_id: str | None) -> int:
    kinds = {core.kind for core in resolved}
    score = 20
    if "user" in kinds:
        score += 20
    if "situation" in kinds or situation_id:
        score += 20
    if "source" in kinds or "document" in kinds:
        score += 20
    if "graph" in kinds:
        score += 10
    if "output" in kinds:
        score += 10
    return min(score, 100)


def _core_sort_key(row: dict[str, Any]) -> tuple[int, str]:
    order = {
        "praxis": 0,
        "user": 1,
        "team": 2,
        "situation": 3,
        "source": 4,
        "document": 5,
        "graph": 6,
        "output": 7,
    }
    return (order.get(str(row.get("kind")), 99), str(row.get("name", "")))
