"""v7 Context Core read API."""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from psycopg.types.json import Jsonb
from pydantic import BaseModel, Field

from auth import verify_firebase_token
from services.postgres import tenant_session

router = APIRouter()

CORE_KINDS = {"praxis", "user", "team", "situation", "source", "document", "graph", "output"}
GRANT_ROLES = {"owner", "editor", "commenter", "viewer"}
GRANT_PRINCIPALS = {"user", "team", "link", "public"}


class CoreCreateRequest(BaseModel):
    kind: str = "situation"
    name: str
    description: str | None = None
    parent_core_id: str | None = Field(default=None, alias="parentCoreId")
    tags: list[str] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)
    ontology_id: str | None = Field(default=None, alias="ontologyId")
    ontology_version: str | None = Field(default=None, alias="ontologyVersion")


class CoreForkRequest(BaseModel):
    name: str
    inherit: dict[str, bool] = Field(default_factory=dict)


class CoreGrantRequest(BaseModel):
    principal_kind: str = Field(default="user", alias="principalKind")
    principal_id: str = Field(alias="principalId")
    role: str = "viewer"
    expires_at: str | None = Field(default=None, alias="expiresAt")


def _iso(value: Any) -> str:
    return value.isoformat() if hasattr(value, "isoformat") else str(value)


def _core(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(row["id"]),
        "kind": row["kind"],
        "name": row["name"],
        "description": row.get("description"),
        "ownerUid": row["owner_uid"],
        "teamId": row.get("team_id"),
        "parentCoreId": str(row["parent_core_id"]) if row.get("parent_core_id") else None,
        "version": int(row["version"]),
        "status": row["status"],
        "tags": list(row.get("tags") or []),
        "metadata": row.get("metadata") or {},
        "ontologyId": row.get("ontology_id"),
        "ontologyVersion": row.get("ontology_version"),
        "createdAt": _iso(row["created_at"]),
        "updatedAt": _iso(row["updated_at"]),
        "createdBy": row["created_by"],
    }


async def _ensure_user_core(conn: Any, token: dict[str, Any]) -> dict[str, Any]:
    uid = token["uid"]
    rows = await conn.fetch(
        """
        SELECT *
        FROM cores
        WHERE owner_uid = %s
          AND kind = 'user'
          AND status = 'active'
        ORDER BY updated_at DESC
        LIMIT 1
        """,
        uid,
    )
    if rows:
        return rows[0]

    display_name = token.get("name") or token.get("email") or "My Core"
    rows = await conn.fetch(
        """
        INSERT INTO cores (kind, name, description, owner_uid, created_by, metadata)
        VALUES ('user', %s, %s, %s, %s, %s::jsonb)
        RETURNING *
        """,
        display_name,
        "User Core",
        uid,
        uid,
        Jsonb({"source": "v7.inline_user_core"}),
    )
    row = rows[0]
    await conn.execute(
        """
        INSERT INTO core_audit (owner_uid, core_id, actor_uid, action, after, metadata)
        VALUES (%s, %s::uuid, %s, 'create', %s::jsonb, %s::jsonb)
        """,
        uid,
        str(row["id"]),
        uid,
        Jsonb(_core(row)),
        Jsonb({"source": "v7.inline_user_core"}),
    )
    return row


@router.get("")
async def list_cores(
    kind: str | None = Query(default=None),
    status: str = Query(default="active"),
    token: dict = Depends(verify_firebase_token),
) -> dict[str, Any]:
    current_user = token["uid"]
    if kind and kind not in CORE_KINDS:
        raise HTTPException(status_code=400, detail="invalid_core_kind")
    async with tenant_session(current_user) as conn:
        if kind:
            rows = await conn.fetch(
                """
                SELECT *
                FROM cores
                WHERE status = %s
                  AND kind = %s
                  AND (
                    owner_uid = %s
                    OR owner_uid = 'platform'
                    OR EXISTS (
                      SELECT 1
                      FROM core_grants
                      WHERE core_grants.core_id = cores.id
                        AND core_grants.revoked_at IS NULL
                        AND core_grants.principal_kind = 'user'
                        AND core_grants.principal_id = %s
                    )
                  )
                ORDER BY updated_at DESC
                LIMIT 100
                """,
                status,
                kind,
                current_user,
                current_user,
            )
        else:
            rows = await conn.fetch(
                """
                SELECT *
                FROM cores
                WHERE status = %s
                  AND (
                    owner_uid = %s
                    OR owner_uid = 'platform'
                    OR EXISTS (
                      SELECT 1
                      FROM core_grants
                      WHERE core_grants.core_id = cores.id
                        AND core_grants.revoked_at IS NULL
                        AND core_grants.principal_kind = 'user'
                        AND core_grants.principal_id = %s
                    )
                  )
                ORDER BY
                  CASE kind
                    WHEN 'user' THEN 1
                    WHEN 'team' THEN 2
                    WHEN 'situation' THEN 3
                    WHEN 'source' THEN 4
                    WHEN 'document' THEN 5
                    WHEN 'graph' THEN 6
                    WHEN 'output' THEN 7
                    ELSE 8
                  END,
                  updated_at DESC
                LIMIT 100
                """,
                status,
                current_user,
                current_user,
            )
    return {"cores": [_core(row) for row in rows]}


@router.post("")
async def create_core(payload: CoreCreateRequest, token: dict = Depends(verify_firebase_token)) -> dict[str, Any]:
    current_user = token["uid"]
    if payload.kind not in CORE_KINDS or payload.kind == "praxis":
        raise HTTPException(status_code=400, detail="invalid_core_kind")
    async with tenant_session(current_user) as conn:
        rows = await conn.fetch(
            """
            INSERT INTO cores (
              kind, name, description, owner_uid, created_by, parent_core_id,
              tags, metadata, ontology_id, ontology_version
            )
            VALUES (%s, %s, %s, %s, %s, %s::uuid, %s, %s::jsonb, %s, %s)
            RETURNING *
            """,
            payload.kind,
            payload.name,
            payload.description,
            current_user,
            current_user,
            payload.parent_core_id,
            payload.tags,
            Jsonb(payload.metadata),
            payload.ontology_id,
            payload.ontology_version,
        )
        row = rows[0]
        await conn.execute(
            """
            INSERT INTO core_audit (owner_uid, core_id, actor_uid, action, after, metadata)
            VALUES (%s, %s::uuid, %s, 'create', %s::jsonb, %s::jsonb)
            """,
            current_user,
            str(row["id"]),
            current_user,
            Jsonb(_core(row)),
            Jsonb({"source": "v7.inline_core_create"}),
        )
    return {"core": _core(row), "ok": True}


@router.get("/me")
async def get_my_core(token: dict = Depends(verify_firebase_token)) -> dict[str, Any]:
    current_user = token["uid"]
    async with tenant_session(current_user) as conn:
        row = await _ensure_user_core(conn, token)
        await conn.execute(
            """
            INSERT INTO core_audit (owner_uid, core_id, actor_uid, action, after, metadata)
            VALUES (%s, %s::uuid, %s, 'read', %s::jsonb, %s::jsonb)
            """,
            current_user,
            str(row["id"]),
            current_user,
            Jsonb({"surface": "cores_me"}),
            Jsonb({"source": "v7.inline_user_core"}),
        )
    return {"core": _core(row)}


@router.patch("/me")
async def patch_my_core(payload: dict[str, Any], token: dict = Depends(verify_firebase_token)) -> dict[str, Any]:
    current_user = token["uid"]
    allowed = {
        "name",
        "role",
        "mandate",
        "language",
        "jurisdiction",
        "formality",
        "citationDensity",
        "structure",
        "quickModel",
        "deepModel",
        "memoModel",
        "costCeiling",
        "defaultAttachedCoreIds",
    }
    filtered = {key: value for key, value in payload.items() if key in allowed}
    async with tenant_session(current_user) as conn:
        before_row = await _ensure_user_core(conn, token)
        before = _core(before_row)
        metadata = dict(before_row.get("metadata") or {})
        metadata["profile"] = {
            "name": filtered.get("name", before_row["name"]),
            "role": filtered.get("role"),
            "mandate": filtered.get("mandate"),
            "language": filtered.get("language"),
            "jurisdiction": filtered.get("jurisdiction"),
        }
        metadata["style"] = {
            "formality": filtered.get("formality"),
            "citationDensity": filtered.get("citationDensity"),
            "structure": filtered.get("structure"),
        }
        metadata["models"] = {
            "quick": filtered.get("quickModel"),
            "deep": filtered.get("deepModel"),
            "memo": filtered.get("memoModel"),
            "costCeiling": filtered.get("costCeiling"),
        }
        if "defaultAttachedCoreIds" in filtered:
            metadata["defaultAttachedCoreIds"] = filtered["defaultAttachedCoreIds"]
        rows = await conn.fetch(
            """
            UPDATE cores
            SET name = %s,
                description = %s,
                metadata = %s::jsonb,
                version = version + 1,
                updated_at = now()
            WHERE id = %s::uuid
              AND owner_uid = %s
              AND kind = 'user'
            RETURNING *
            """,
            str(filtered.get("name") or before_row["name"]),
            str(filtered.get("role") or before_row.get("description") or "User Core"),
            Jsonb(metadata),
            str(before_row["id"]),
            current_user,
        )
        after_row = rows[0]
        await conn.execute(
            """
            INSERT INTO core_audit (owner_uid, core_id, actor_uid, action, before, after, metadata)
            VALUES (%s, %s::uuid, %s, 'update', %s::jsonb, %s::jsonb, %s::jsonb)
            """,
            current_user,
            str(after_row["id"]),
            current_user,
            Jsonb(before),
            Jsonb(_core(after_row)),
            Jsonb({"source": "v7.inline_user_core", "fields": sorted(filtered.keys())}),
        )
    return {"core": _core(after_row), "ok": True}


@router.get("/{core_id}")
async def get_core(core_id: str, token: dict = Depends(verify_firebase_token)) -> dict[str, Any]:
    current_user = token["uid"]
    async with tenant_session(current_user) as conn:
        rows = await conn.fetch(
            """
            SELECT *
            FROM cores
            WHERE id = %s::uuid
              AND (
                owner_uid = %s
                OR owner_uid = 'platform'
                OR EXISTS (
                  SELECT 1
                  FROM core_grants
                  WHERE core_grants.core_id = cores.id
                    AND core_grants.revoked_at IS NULL
                    AND core_grants.principal_kind = 'user'
                    AND core_grants.principal_id = %s
                )
              )
            LIMIT 1
            """,
            core_id,
            current_user,
            current_user,
        )
        if not rows:
            raise HTTPException(status_code=404, detail="core_not_found")
        await conn.execute(
            """
            INSERT INTO core_audit (owner_uid, core_id, actor_uid, action, after, metadata)
            VALUES (%s, %s::uuid, %s, 'read', %s::jsonb, %s::jsonb)
            """,
            current_user,
            core_id,
            current_user,
            Jsonb({"surface": "cores_api"}),
            Jsonb({"source": "v7.cores.detail"}),
        )
    return {"core": _core(rows[0])}


@router.patch("/{core_id}")
async def patch_core(core_id: str, payload: dict[str, Any], token: dict = Depends(verify_firebase_token)) -> dict[str, Any]:
    current_user = token["uid"]
    async with tenant_session(current_user) as conn:
        rows = await conn.fetch(
            """
            SELECT *
            FROM cores
            WHERE id = %s::uuid
              AND owner_uid = %s
              AND status = 'active'
            LIMIT 1
            """,
            core_id,
            current_user,
        )
        if not rows:
            raise HTTPException(status_code=404, detail="core_not_found")
        before_row = rows[0]
        before = _core(before_row)
        metadata = dict(before_row.get("metadata") or {})
        metadata.update({key: value for key, value in payload.items() if key not in {"name", "description", "tags"}})
        update_rows = await conn.fetch(
            """
            UPDATE cores
            SET name = %s,
                description = %s,
                tags = %s,
                metadata = %s::jsonb,
                version = version + 1,
                updated_at = now()
            WHERE id = %s::uuid
              AND owner_uid = %s
            RETURNING *
            """,
            str(payload.get("name") or before_row["name"]),
            payload.get("description", before_row.get("description")),
            payload.get("tags", before_row.get("tags") or []),
            Jsonb(metadata),
            core_id,
            current_user,
        )
        after_row = update_rows[0]
        await conn.execute(
            """
            INSERT INTO core_audit (owner_uid, core_id, actor_uid, action, before, after, metadata)
            VALUES (%s, %s::uuid, %s, 'update', %s::jsonb, %s::jsonb, %s::jsonb)
            """,
            current_user,
            str(after_row["id"]),
            current_user,
            Jsonb(before),
            Jsonb(_core(after_row)),
            Jsonb({"source": "v7.inline_core_drawer"}),
        )
    return {"core": _core(after_row), "ok": True}


@router.post("/{core_id}/fork")
async def fork_core(core_id: str, payload: CoreForkRequest, token: dict = Depends(verify_firebase_token)) -> dict[str, Any]:
    current_user = token["uid"]
    async with tenant_session(current_user) as conn:
        rows = await conn.fetch(
            """
            SELECT *
            FROM cores
            WHERE id = %s::uuid
              AND status = 'active'
              AND (
                owner_uid = %s
                OR EXISTS (
                  SELECT 1
                  FROM core_grants
                  WHERE core_grants.core_id = cores.id
                    AND core_grants.revoked_at IS NULL
                    AND core_grants.principal_kind = 'user'
                    AND core_grants.principal_id = %s
                )
              )
            LIMIT 1
            """,
            core_id,
            current_user,
            current_user,
        )
        if not rows:
            raise HTTPException(status_code=404, detail="core_not_found")
        source = rows[0]
        metadata = dict(source.get("metadata") or {})
        metadata["forkedFrom"] = core_id
        metadata["inherit"] = payload.inherit
        fork_rows = await conn.fetch(
            """
            INSERT INTO cores (
              kind, name, description, owner_uid, created_by, parent_core_id,
              tags, metadata, ontology_id, ontology_version
            )
            VALUES (%s, %s, %s, %s, %s, %s::uuid, %s, %s::jsonb, %s, %s)
            RETURNING *
            """,
            source["kind"],
            payload.name,
            source.get("description"),
            current_user,
            current_user,
            core_id,
            source.get("tags") or [],
            Jsonb(metadata),
            source.get("ontology_id"),
            source.get("ontology_version"),
        )
        forked = fork_rows[0]
        await conn.execute(
            """
            INSERT INTO core_audit (owner_uid, core_id, actor_uid, action, before, after, metadata)
            VALUES (%s, %s::uuid, %s, 'fork', %s::jsonb, %s::jsonb, %s::jsonb)
            """,
            current_user,
            str(forked["id"]),
            current_user,
            Jsonb(_core(source)),
            Jsonb(_core(forked)),
            Jsonb({"source": "v7.inline_core_fork", "parentCoreId": core_id}),
        )
    return {"core": _core(forked), "ok": True}


@router.post("/{core_id}/grants")
async def create_core_grant(core_id: str, payload: CoreGrantRequest, token: dict = Depends(verify_firebase_token)) -> dict[str, Any]:
    current_user = token["uid"]
    if payload.principal_kind not in GRANT_PRINCIPALS:
        raise HTTPException(status_code=400, detail="invalid_principal_kind")
    if payload.role not in GRANT_ROLES or payload.role == "owner":
        raise HTTPException(status_code=400, detail="invalid_grant_role")
    if payload.principal_kind in {"public", "link"}:
        raise HTTPException(status_code=400, detail="public_link_grants_disabled_in_v7")
    async with tenant_session(current_user) as conn:
        rows = await conn.fetch(
            """
            SELECT *
            FROM cores
            WHERE id = %s::uuid
              AND owner_uid = %s
              AND status = 'active'
            LIMIT 1
            """,
            core_id,
            current_user,
        )
        if not rows:
            raise HTTPException(status_code=404, detail="core_not_found")
        grant_rows = await conn.fetch(
            """
            INSERT INTO core_grants (
              owner_uid, core_id, principal_kind, principal_id, role, granted_by, expires_at, metadata
            )
            VALUES (%s, %s::uuid, %s, %s, %s, %s, %s::timestamptz, %s::jsonb)
            RETURNING *
            """,
            current_user,
            core_id,
            payload.principal_kind,
            payload.principal_id,
            payload.role,
            current_user,
            payload.expires_at,
            Jsonb({"source": "v7.inline_core_share"}),
        )
        grant = grant_rows[0]
        await conn.execute(
            """
            INSERT INTO core_audit (owner_uid, core_id, actor_uid, action, after, metadata)
            VALUES (%s, %s::uuid, %s, 'share', %s::jsonb, %s::jsonb)
            """,
            current_user,
            core_id,
            current_user,
            Jsonb({"grantId": str(grant["id"]), "principalId": payload.principal_id, "role": payload.role}),
            Jsonb({"source": "v7.inline_core_share"}),
        )
    return {
        "grant": {
            "id": str(grant["id"]),
            "coreId": core_id,
            "principalKind": grant["principal_kind"],
            "principalId": grant["principal_id"],
            "role": grant["role"],
        },
        "ok": True,
    }


@router.delete("/{core_id}/grants/{grant_id}")
async def revoke_core_grant(core_id: str, grant_id: str, token: dict = Depends(verify_firebase_token)) -> dict[str, Any]:
    current_user = token["uid"]
    async with tenant_session(current_user) as conn:
        rows = await conn.fetch(
            """
            UPDATE core_grants
            SET revoked_at = now()
            WHERE id = %s::uuid
              AND core_id = %s::uuid
              AND owner_uid = %s
              AND revoked_at IS NULL
            RETURNING *
            """,
            grant_id,
            core_id,
            current_user,
        )
        if not rows:
            raise HTTPException(status_code=404, detail="grant_not_found")
        await conn.execute(
            """
            INSERT INTO core_audit (owner_uid, core_id, actor_uid, action, after, metadata)
            VALUES (%s, %s::uuid, %s, 'unshare', %s::jsonb, %s::jsonb)
            """,
            current_user,
            core_id,
            current_user,
            Jsonb({"grantId": grant_id}),
            Jsonb({"source": "v7.inline_core_share"}),
        )
    return {"ok": True}
