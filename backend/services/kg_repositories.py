"""Postgres knowledge graph repositories.

The repository layer keeps every read and write scoped by owner UID and case ID.
It is intentionally small: all graph business logic should call these methods
instead of issuing ad hoc SQL against the graph tables.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from services.postgres import TenantConnection


@dataclass(frozen=True)
class GraphNodeRecord:
    case_id: str
    owner_uid: str
    ontology_id: str
    primitive: str
    subtype: str
    label: str
    layer: str
    confidence: float
    created_by: str
    id: str | None = None
    ontology_version: str = "1.0.0"
    description: str | None = None
    provenance: list[dict[str, Any]] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)
    status: str = "committed"


@dataclass(frozen=True)
class GraphEdgeRecord:
    case_id: str
    owner_uid: str
    ontology_id: str
    relation_type: str
    source_id: str
    target_id: str
    confidence: float
    created_by: str
    id: str | None = None
    provenance: list[dict[str, Any]] = field(default_factory=list)
    metadata: dict[str, Any] = field(default_factory=dict)
    status: str = "committed"


class NodeRepo:
    def __init__(self, conn: TenantConnection) -> None:
        self.conn = conn

    async def upsert(self, node: GraphNodeRecord) -> dict[str, Any]:
        rows = await self.conn.fetch(
            """
            INSERT INTO graph_nodes (
              id, case_id, owner_uid, ontology_id, ontology_version, primitive,
              subtype, label, description, layer, confidence, provenance,
              metadata, status, created_by
            )
            VALUES (
              COALESCE(%s::uuid, gen_random_uuid()), %s, %s, %s, %s, %s,
              %s, %s, %s, %s, %s, %s::jsonb, %s::jsonb, %s, %s
            )
            ON CONFLICT (id) DO UPDATE SET
              label = EXCLUDED.label,
              description = EXCLUDED.description,
              confidence = EXCLUDED.confidence,
              provenance = EXCLUDED.provenance,
              metadata = EXCLUDED.metadata,
              status = EXCLUDED.status,
              updated_at = now()
            WHERE graph_nodes.owner_uid = EXCLUDED.owner_uid
              AND graph_nodes.case_id = EXCLUDED.case_id
            RETURNING *
            """,
            node.id,
            node.case_id,
            node.owner_uid,
            node.ontology_id,
            node.ontology_version,
            node.primitive,
            node.subtype,
            node.label,
            node.description,
            node.layer,
            node.confidence,
            node.provenance,
            node.metadata,
            node.status,
            node.created_by,
        )
        return rows[0]

    async def list_committed(self, *, owner_uid: str, case_id: str) -> list[dict[str, Any]]:
        return await self.conn.fetch(
            """
            SELECT *
            FROM graph_nodes
            WHERE owner_uid = %s AND case_id = %s AND status = 'committed'
            ORDER BY primitive, label
            """,
            owner_uid,
            case_id,
        )


class EdgeRepo:
    def __init__(self, conn: TenantConnection) -> None:
        self.conn = conn

    async def upsert(self, edge: GraphEdgeRecord) -> dict[str, Any]:
        rows = await self.conn.fetch(
            """
            INSERT INTO graph_edges (
              id, case_id, owner_uid, ontology_id, relation_type, source_id,
              target_id, confidence, provenance, metadata, status, created_by
            )
            VALUES (
              COALESCE(%s::uuid, gen_random_uuid()), %s, %s, %s, %s,
              %s::uuid, %s::uuid, %s, %s::jsonb, %s::jsonb, %s, %s
            )
            ON CONFLICT (id) DO UPDATE SET
              relation_type = EXCLUDED.relation_type,
              confidence = EXCLUDED.confidence,
              provenance = EXCLUDED.provenance,
              metadata = EXCLUDED.metadata,
              status = EXCLUDED.status
            WHERE graph_edges.owner_uid = EXCLUDED.owner_uid
              AND graph_edges.case_id = EXCLUDED.case_id
            RETURNING *
            """,
            edge.id,
            edge.case_id,
            edge.owner_uid,
            edge.ontology_id,
            edge.relation_type,
            edge.source_id,
            edge.target_id,
            edge.confidence,
            edge.provenance,
            edge.metadata,
            edge.status,
            edge.created_by,
        )
        return rows[0]


class GraphTraversalRepo:
    def __init__(self, conn: TenantConnection) -> None:
        self.conn = conn

    async def n_hop_neighborhood(self, *, owner_uid: str, case_id: str, start_node_id: str, depth: int = 2) -> list[dict[str, Any]]:
        return await self.conn.fetch(
            """
            WITH RECURSIVE walk(node_id, depth, path) AS (
              SELECT %s::uuid, 0, ARRAY[%s::uuid]
              UNION ALL
              SELECT
                CASE WHEN e.source_id = walk.node_id THEN e.target_id ELSE e.source_id END,
                walk.depth + 1,
                path || CASE WHEN e.source_id = walk.node_id THEN e.target_id ELSE e.source_id END
              FROM walk
              JOIN graph_edges e
                ON e.owner_uid = %s
               AND e.case_id = %s
               AND e.status = 'committed'
               AND (e.source_id = walk.node_id OR e.target_id = walk.node_id)
              WHERE walk.depth < %s
                AND NOT (CASE WHEN e.source_id = walk.node_id THEN e.target_id ELSE e.source_id END = ANY(path))
            )
            SELECT n.*, min(walk.depth) AS distance
            FROM walk
            JOIN graph_nodes n
              ON n.id = walk.node_id
             AND n.owner_uid = %s
             AND n.case_id = %s
             AND n.status = 'committed'
            GROUP BY n.id
            ORDER BY distance, n.label
            """,
            start_node_id,
            start_node_id,
            owner_uid,
            case_id,
            depth,
            owner_uid,
            case_id,
        )

    async def shortest_path(self, *, owner_uid: str, case_id: str, source_id: str, target_id: str, max_depth: int = 6) -> list[dict[str, Any]]:
        rows = await self.conn.fetch(
            """
            WITH RECURSIVE path_walk(node_id, depth, path) AS (
              SELECT %s::uuid, 0, ARRAY[%s::uuid]
              UNION ALL
              SELECT
                CASE WHEN e.source_id = path_walk.node_id THEN e.target_id ELSE e.source_id END,
                path_walk.depth + 1,
                path || CASE WHEN e.source_id = path_walk.node_id THEN e.target_id ELSE e.source_id END
              FROM path_walk
              JOIN graph_edges e
                ON e.owner_uid = %s
               AND e.case_id = %s
               AND e.status = 'committed'
               AND (e.source_id = path_walk.node_id OR e.target_id = path_walk.node_id)
              WHERE path_walk.depth < %s
                AND NOT (CASE WHEN e.source_id = path_walk.node_id THEN e.target_id ELSE e.source_id END = ANY(path))
            )
            SELECT path
            FROM path_walk
            WHERE node_id = %s::uuid
            ORDER BY depth ASC
            LIMIT 1
            """,
            source_id,
            source_id,
            owner_uid,
            case_id,
            max_depth,
            target_id,
        )
        if not rows:
            return []
        return await self.conn.fetch(
            """
            SELECT *
            FROM graph_nodes
            WHERE owner_uid = %s AND case_id = %s AND id = ANY(%s::uuid[])
            ORDER BY array_position(%s::uuid[], id)
            """,
            owner_uid,
            case_id,
            rows[0]["path"],
            rows[0]["path"],
        )


class EmbeddingRepo:
    def __init__(self, conn: TenantConnection) -> None:
        self.conn = conn

    async def semantic_search(self, *, owner_uid: str, case_id: str, embedding: list[float], limit: int = 10) -> list[dict[str, Any]]:
        return await self.conn.fetch(
            """
            SELECT n.*, 1 - (e.embedding <=> %s::vector) AS similarity
            FROM graph_embeddings e
            JOIN graph_nodes n
              ON n.id = e.node_id
             AND n.owner_uid = %s
             AND n.case_id = %s
             AND n.status = 'committed'
            ORDER BY e.embedding <=> %s::vector
            LIMIT %s
            """,
            embedding,
            owner_uid,
            case_id,
            embedding,
            limit,
        )
