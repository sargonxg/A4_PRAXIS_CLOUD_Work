"""v7 Ask PRAXIS runtime persistence.

This router intentionally persists the Ask turn before full AI execution is
cut over. It gives the v7 UI a real owner-scoped thread path without claiming
that the new router is already the calibrated generation runtime.
"""
from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from psycopg.types.json import Jsonb

from auth import verify_firebase_token
from services.ask.executor import execute_ask_turn
from services.ask.router import route_ask
from services.ask.types import AskRunRequest
from services.cores.resolver import record_core_attachments, resolve_ask_core_context
from services.postgres import tenant_session

router = APIRouter()


def _iso(value: Any) -> str:
    return value.isoformat() if hasattr(value, "isoformat") else str(value)


def _thread(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(row["id"]),
        "ownerUid": row["owner_uid"],
        "situationId": row.get("situation_id"),
        "situationCoreId": str(row["situation_core_id"]) if row.get("situation_core_id") else None,
        "title": row["title"],
        "mode": row["mode"],
        "status": row["status"],
        "attachedCoreIds": [str(item) for item in (row.get("attached_core_ids") or [])],
        "createdAt": _iso(row["created_at"]),
        "updatedAt": _iso(row["updated_at"]),
        "archivedAt": _iso(row["archived_at"]) if row.get("archived_at") else None,
        "metadata": row.get("metadata") or {},
    }


def _message(row: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": str(row["id"]),
        "ownerUid": row["owner_uid"],
        "threadId": str(row["thread_id"]),
        "role": row["role"],
        "content": row["content"],
        "sequence": row["sequence"],
        "routeAction": row.get("route_action"),
        "skillId": row.get("skill_id"),
        "subagentId": row.get("subagent_id"),
        "tokenCount": int(row.get("token_count") or 0),
        "costUsd": float(row.get("cost_usd") or 0),
        "createdAt": _iso(row["created_at"]),
        "metadata": row.get("metadata") or {},
    }


def _title(query: str) -> str:
    compact = " ".join(query.strip().split())
    if len(compact) <= 80:
        return compact or "Ask PRAXIS thread"
    return f"{compact[:77]}..."


@router.get("/threads")
async def list_threads(
    situation_id: str | None = Query(default=None, max_length=128),
    token: dict = Depends(verify_firebase_token),
) -> dict[str, Any]:
    async with tenant_session(token["uid"]) as conn:
        if situation_id:
            rows = await conn.fetch(
                """
                SELECT *
                FROM ask_threads
                WHERE owner_uid = %s AND situation_id = %s AND status = 'active'
                ORDER BY updated_at DESC
                LIMIT 50
                """,
                token["uid"],
                situation_id,
            )
        else:
            rows = await conn.fetch(
                """
                SELECT *
                FROM ask_threads
                WHERE owner_uid = %s AND status = 'active'
                ORDER BY updated_at DESC
                LIMIT 50
                """,
                token["uid"],
            )
    return {"threads": [_thread(row) for row in rows]}


@router.post("/run")
async def run_ask(req: AskRunRequest, token: dict = Depends(verify_firebase_token)) -> dict[str, Any]:
    routing = route_ask(req.query, req.mode, req.skill_id)
    async with tenant_session(token["uid"]) as conn:
        core_context = await resolve_ask_core_context(
            conn,
            token["uid"],
            req.situation_id,
            req.attached_core_ids,
        )
        attached_core_ids = core_context.attached_core_ids
        situation_core_id = next(
            (core.id for core in core_context.resolved_cores if core.kind == "situation"),
            None,
        )
        if req.thread_id:
            thread_rows = await conn.fetch(
                """
                UPDATE ask_threads
                SET mode = %s,
                    situation_id = COALESCE(%s, situation_id),
                    situation_core_id = COALESCE(%s::uuid, situation_core_id),
                    attached_core_ids = %s::uuid[],
                    updated_at = now(),
                    metadata = metadata || %s::jsonb
                WHERE owner_uid = %s AND id = %s::uuid AND status = 'active'
                RETURNING *
                """,
                req.mode,
                req.situation_id,
                situation_core_id,
                attached_core_ids,
                Jsonb({"coreContext": core_context.to_dict()}),
                token["uid"],
                str(req.thread_id),
            )
            if not thread_rows:
                raise HTTPException(status_code=404, detail="ask_thread_not_found")
        else:
            thread_rows = await conn.fetch(
                """
                INSERT INTO ask_threads (owner_uid, situation_id, situation_core_id, title, mode, attached_core_ids, metadata)
                VALUES (%s, %s, %s::uuid, %s, %s, %s::uuid[], %s::jsonb)
                RETURNING *
                """,
                token["uid"],
                req.situation_id,
                situation_core_id,
                _title(req.query),
                req.mode,
                attached_core_ids,
                Jsonb({"source": "v7.ask.run", "coreContext": core_context.to_dict()}),
            )
        thread = thread_rows[0]
        await record_core_attachments(conn, token["uid"], token["uid"], str(thread["id"]), core_context)
        next_sequence = await conn.fetchval(
            "SELECT COALESCE(MAX(sequence), -1) + 1 FROM ask_messages WHERE owner_uid = %s AND thread_id = %s::uuid",
            token["uid"],
            str(thread["id"]),
        )
        user_rows = await conn.fetch(
            """
            INSERT INTO ask_messages (owner_uid, thread_id, role, content, sequence, metadata)
            VALUES (%s, %s::uuid, 'user', %s, %s, %s::jsonb)
            RETURNING *
            """,
            token["uid"],
            str(thread["id"]),
            req.query,
            int(next_sequence or 0),
            Jsonb({"mode": req.mode, "attachedCoreIds": attached_core_ids, "coreContext": core_context.to_dict()}),
        )
        execution = await execute_ask_turn(
            req.query,
            req.mode,
            routing,
            core_context,
        )
        assistant_rows = await conn.fetch(
            """
            INSERT INTO ask_messages (
              owner_uid, thread_id, role, content, sequence, route_action, skill_id, subagent_id, token_count, cost_usd, metadata
            )
            VALUES (%s, %s::uuid, 'assistant', %s, %s, %s, %s, %s, %s, %s, %s::jsonb)
            RETURNING *
            """,
            token["uid"],
            str(thread["id"]),
            execution.content,
            int(next_sequence or 0) + 1,
            routing.action,
            routing.skill_id,
            routing.subagent_id,
            execution.token_count,
            execution.cost_usd,
            Jsonb(execution.metadata),
        )
        for citation in execution.citations:
            await conn.execute(
                """
                INSERT INTO ask_message_citations (
                  owner_uid, message_id, citation_index, source_kind, source_id, title, excerpt, confidence, metadata
                )
                VALUES (%s, %s::uuid, %s, %s, %s, %s, %s, %s, %s::jsonb)
                """,
                token["uid"],
                str(assistant_rows[0]["id"]),
                citation["citation_index"],
                citation["source_kind"],
                citation["source_id"],
                citation["title"],
                citation.get("excerpt"),
                citation.get("confidence"),
                Jsonb(citation.get("metadata") or {}),
            )
        updated = await conn.fetch(
            "UPDATE ask_threads SET updated_at = now() WHERE owner_uid = %s AND id = %s::uuid RETURNING *",
            token["uid"],
            str(thread["id"]),
        )
    return {
        "thread": _thread(updated[0]),
        "messages": [_message(user_rows[0]), _message(assistant_rows[0])],
        "route": {**routing.to_dict(), "runtime": execution.runtime},
        "coreContext": core_context.to_dict(),
        "execution": execution.to_dict(),
    }
