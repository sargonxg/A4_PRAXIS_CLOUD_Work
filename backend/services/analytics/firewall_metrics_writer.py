"""Additive metrics writer for graph analytics.

The symbolic firewall permits this path because it only writes additive metrics
metadata on existing owner-scoped graph nodes. It never creates claims, edges,
or verdict-layer assertions.
"""
from __future__ import annotations

from typing import Any

from services.postgres import tenant_session


async def write_metrics_to_graph_nodes(*, case_id: str, owner_uid: str, metrics: dict[str, dict[str, Any]], louvain_seed: int) -> int:
    if not case_id or not owner_uid:
        raise ValueError("case_id and owner_uid are required")
    if not metrics:
        return 0
    async with tenant_session(owner_uid) as conn:
        rows = await conn.fetch(
            """
            UPDATE graph_nodes AS node
            SET
              metrics = COALESCE(node.metrics, '{}'::jsonb) || update_payload.metrics,
              metadata = jsonb_set(
                COALESCE(node.metadata, '{}'::jsonb),
                '{analytics}',
                COALESCE(node.metadata->'analytics', '{}'::jsonb) || update_payload.metrics,
                true
              ),
              updated_at = now()
            FROM (
              SELECT key::uuid AS node_id, value::jsonb AS metrics
              FROM jsonb_each(%s::jsonb)
            ) AS update_payload
            WHERE node.id = update_payload.node_id
              AND node.case_id = %s
              AND node.owner_uid = %s
              AND node.status = 'committed'
            RETURNING node.id
            """,
            metrics,
            case_id,
            owner_uid,
        )
        await conn.execute(
            """
            INSERT INTO graph_audit (case_id, owner_uid, operation, target_kind, target_id, payload, created_by)
            SELECT %s, %s, 'analytics.network.metrics.write', 'node', key::uuid,
                   jsonb_build_object('metrics', value::jsonb, 'louvain_seed', %s),
                   %s
            FROM jsonb_each(%s::jsonb)
            """,
            case_id,
            owner_uid,
            louvain_seed,
            owner_uid,
            metrics,
        )
    return len(rows)

