"""Minimal read-only PRAXIS MCP tool surface.

This module is intentionally framework-light so the deployment can wrap these
functions with the preferred MCP server runtime without changing business
logic. Tool functions do not write canonical tables.
"""
from __future__ import annotations

from typing import Any

from services import cognee_memory
from services.cognee_memory import MemoryScope
from services.postgres import tenant_session


async def list_cases(owner_uid: str) -> dict[str, Any]:
    async with tenant_session(owner_uid) as conn:
        frames = await conn.fetch(
            """
            SELECT case_id, policy_question, updated_at
            FROM situation_frames
            WHERE owner_uid = %s
            ORDER BY updated_at DESC
            LIMIT 100
            """,
            owner_uid,
        )
    return {"cases": frames}


async def recall(owner_uid: str, case_id: str, query: str, limit: int = 8) -> dict[str, Any]:
    scope = MemoryScope(owner_uid=owner_uid, case_id=case_id)
    response = await cognee_memory.recall(scope=scope, query=query, limit=limit)
    hits = cognee_memory.memory_hits_from_response(response)
    return {"hits": [hit.__dict__ for hit in hits]}


async def get_situation_frame(owner_uid: str, case_id: str) -> dict[str, Any]:
    async with tenant_session(owner_uid) as conn:
        rows = await conn.fetch(
            """
            SELECT case_id, what_happening, why_matters, what_would_change,
                   policy_question, metadata, updated_at
            FROM situation_frames
            WHERE owner_uid = %s AND case_id = %s
            """,
            owner_uid,
            case_id,
        )
    return {"frame": rows[0] if rows else None}


async def list_sources(owner_uid: str, case_id: str) -> dict[str, Any]:
    async with tenant_session(owner_uid) as conn:
        rows = await conn.fetch(
            """
            SELECT id, title, source_uri, source_type, receipt_status, created_at
            FROM source_receipts
            WHERE owner_uid = %s AND case_id = %s
            ORDER BY created_at DESC
            LIMIT 200
            """,
            owner_uid,
            case_id,
        )
    return {"sources": rows}


async def list_ontology_candidates(owner_uid: str, case_id: str) -> dict[str, Any]:
    async with tenant_session(owner_uid) as conn:
        rows = await conn.fetch(
            """
            SELECT id, cognee_node_id, label, confidence, internal_score, created_at
            FROM aco_cognee_link
            WHERE owner_uid = %s AND case_id = %s AND link_kind = 'candidate'
            ORDER BY confidence DESC
            LIMIT 200
            """,
            owner_uid,
            case_id,
        )
    return {"candidates": rows}


async def get_graph(owner_uid: str, case_id: str, include_candidates: bool = False) -> dict[str, Any]:
    async with tenant_session(owner_uid) as conn:
        nodes = await conn.fetch(
            "SELECT id, primitive, label, layer, confidence FROM graph_nodes WHERE owner_uid = %s AND case_id = %s LIMIT 500",
            owner_uid,
            case_id,
        )
        edges = await conn.fetch(
            "SELECT id, source_node_id, target_node_id, relation, confidence FROM graph_edges WHERE owner_uid = %s AND case_id = %s LIMIT 750",
            owner_uid,
            case_id,
        )
        candidates = []
        if include_candidates:
            candidates = (await list_ontology_candidates(owner_uid, case_id))["candidates"]
    return {"nodes": nodes, "edges": edges, "candidates": candidates}


async def get_graph_subgraph(owner_uid: str, case_id: str, node_id: str, depth: int = 1) -> dict[str, Any]:
    _ = depth
    async with tenant_session(owner_uid) as conn:
        node = await conn.fetch(
            "SELECT id, primitive, label, layer, confidence FROM graph_nodes WHERE owner_uid = %s AND case_id = %s AND id = %s::uuid",
            owner_uid,
            case_id,
            node_id,
        )
        edges = await conn.fetch(
            """
            SELECT id, source_node_id, target_node_id, relation, confidence
            FROM graph_edges
            WHERE owner_uid = %s AND case_id = %s
              AND (source_node_id = %s::uuid OR target_node_id = %s::uuid)
            LIMIT 100
            """,
            owner_uid,
            case_id,
            node_id,
            node_id,
        )
    return {"nodes": node, "edges": edges}


async def list_research_threads(owner_uid: str, case_id: str) -> dict[str, Any]:
    async with tenant_session(owner_uid) as conn:
        rows = await conn.fetch(
            """
            SELECT id, question, status, memory_coverage, updated_at
            FROM research_threads
            WHERE owner_uid = %s AND case_id = %s
            ORDER BY updated_at DESC
            LIMIT 100
            """,
            owner_uid,
            case_id,
        )
    return {"threads": rows}


async def list_memos(owner_uid: str, case_id: str) -> dict[str, Any]:
    async with tenant_session(owner_uid) as conn:
        rows = await conn.fetch(
            """
            SELECT id, title, source_kind, pinned, updated_at
            FROM memos
            WHERE owner_uid = %s AND case_id = %s
            ORDER BY pinned DESC, updated_at DESC
            LIMIT 100
            """,
            owner_uid,
            case_id,
        )
    return {"memos": rows}


async def list_drafts(owner_uid: str, case_id: str) -> dict[str, Any]:
    async with tenant_session(owner_uid) as conn:
        rows = await conn.fetch(
            """
            SELECT id, title, jsonb_array_length(citations) AS citation_count, updated_at
            FROM drafts
            WHERE owner_uid = %s AND case_id = %s
            ORDER BY updated_at DESC
            LIMIT 100
            """,
            owner_uid,
            case_id,
        )
    return {"drafts": rows}


async def list_briefings(owner_uid: str, case_id: str) -> dict[str, Any]:
    async with tenant_session(owner_uid) as conn:
        rows = await conn.fetch(
            """
            SELECT id, title, audience, export_status, updated_at
            FROM briefings
            WHERE owner_uid = %s AND case_id = %s
            ORDER BY updated_at DESC
            LIMIT 100
            """,
            owner_uid,
            case_id,
        )
    return {"briefings": rows}


async def list_dialectica_runs(owner_uid: str, case_id: str) -> dict[str, Any]:
    async with tenant_session(owner_uid) as conn:
        rows = await conn.fetch(
            """
            SELECT id, recipe_id, status, created_at, updated_at
            FROM dialectica_runs
            WHERE owner_uid = %s AND case_id = %s
            ORDER BY created_at DESC
            LIMIT 100
            """,
            owner_uid,
            case_id,
        )
    return {"runs": rows}


TOOL_REGISTRY = {
    "praxis.list_cases": list_cases,
    "praxis.get_situation_frame": get_situation_frame,
    "praxis.list_sources": list_sources,
    "praxis.list_ontology_candidates": list_ontology_candidates,
    "praxis.get_graph": get_graph,
    "praxis.recall": recall,
    "praxis.list_research_threads": list_research_threads,
    "praxis.list_memos": list_memos,
    "praxis.list_drafts": list_drafts,
    "praxis.list_briefings": list_briefings,
    "praxis.list_dialectica_runs": list_dialectica_runs,
}
