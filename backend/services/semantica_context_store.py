"""Semantica Context Core promotion into the PRAXIS graph contract.

The Next.js app creates and stores a compact Semantica-compatible graph seed.
This module is the backend bridge that lets a worker promote that seed into the
Postgres `graph_nodes` / `graph_edges` contract without inventing another graph
schema.
"""
from __future__ import annotations

import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import TYPE_CHECKING, Any
from uuid import NAMESPACE_URL, uuid5

BACKEND_ROOT = Path(__file__).resolve().parents[1]
if str(BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(BACKEND_ROOT))

if TYPE_CHECKING:
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


def _stable_graph_uuid(case_id: str, semantica_id: str) -> str:
    return str(uuid5(NAMESPACE_URL, f"praxis:{case_id}:semantica:{semantica_id}"))


def _node_subtype(node_type: str) -> tuple[str, str]:
    if node_type == "context_core":
        return ("context", "situation_context_core")
    if node_type == "user_core":
        return ("actor", "user_core")
    if node_type in {"domain_ontology", "work_ontology"}:
        return ("ontology", node_type)
    if node_type == "case_type":
        return ("ontology", "case_type")
    if node_type == "frame_statement":
        return ("claim", "frame_statement")
    return ("entity", node_type or "semantica_entity")


def _confidence(item: dict[str, Any]) -> float:
    provenance = item.get("provenance")
    if isinstance(provenance, dict):
        value = provenance.get("confidence")
        if isinstance(value, (int, float)):
            return max(0.0, min(1.0, float(value)))
    return 1.0


def semantica_graph_to_records(
    *,
    owner_uid: str,
    case_id: str,
    graph: dict[str, Any],
) -> tuple[list[GraphNodeRecord], list[GraphEdgeRecord]]:
    entities = graph.get("entities") if isinstance(graph.get("entities"), list) else []
    relationships = graph.get("relationships") if isinstance(graph.get("relationships"), list) else []
    ontology_id = _primary_ontology_id(graph)

    node_ids: dict[str, str] = {}
    nodes: list[GraphNodeRecord] = []
    for raw in entities:
        if not isinstance(raw, dict):
            continue
        semantica_id = str(raw.get("id") or "").strip()
        label = str(raw.get("label") or semantica_id).strip()
        node_type = str(raw.get("type") or "semantica_entity").strip()
        if not semantica_id or not label:
            continue
        node_id = _stable_graph_uuid(case_id, semantica_id)
        node_ids[semantica_id] = node_id
        primitive, subtype = _node_subtype(node_type)
        nodes.append(GraphNodeRecord(
            id=node_id,
            case_id=case_id,
            owner_uid=owner_uid,
            ontology_id=ontology_id,
            primitive=primitive,
            subtype=subtype,
            label=label,
            layer="Source" if node_type == "frame_statement" else "Claim",
            confidence=_confidence(raw),
            description=str(raw.get("text") or "") or None,
            provenance=[raw.get("provenance")] if isinstance(raw.get("provenance"), dict) else [],
            metadata={
                "semanticaId": semantica_id,
                "semanticaType": node_type,
                "properties": raw.get("properties") if isinstance(raw.get("properties"), dict) else {},
                "source": "semantica-context-core-seed",
            },
            created_by="praxis-semantica-context-store",
        ))

    edges: list[GraphEdgeRecord] = []
    for raw in relationships:
        if not isinstance(raw, dict):
            continue
        source = str(raw.get("sourceId") or "").strip()
        target = str(raw.get("targetId") or "").strip()
        if source not in node_ids or target not in node_ids:
            continue
        relation_type = str(raw.get("type") or "related_to").strip()
        semantica_edge_id = str(raw.get("id") or f"{source}:{relation_type}:{target}")
        edges.append(GraphEdgeRecord(
            id=_stable_graph_uuid(case_id, semantica_edge_id),
            case_id=case_id,
            owner_uid=owner_uid,
            ontology_id=ontology_id,
            relation_type=relation_type,
            source_id=node_ids[source],
            target_id=node_ids[target],
            confidence=_confidence(raw),
            provenance=[raw.get("provenance")] if isinstance(raw.get("provenance"), dict) else [],
            metadata={
                "semanticaId": semantica_edge_id,
                "label": raw.get("label"),
                "properties": raw.get("properties") if isinstance(raw.get("properties"), dict) else {},
                "source": "semantica-context-core-seed",
            },
            created_by="praxis-semantica-context-store",
        ))

    return nodes, edges


async def promote_semantica_context_graph(
    conn: "TenantConnection",
    *,
    owner_uid: str,
    case_id: str,
    graph: dict[str, Any],
) -> dict[str, int]:
    from services.kg_repositories import EdgeRepo, NodeRepo

    nodes, edges = semantica_graph_to_records(owner_uid=owner_uid, case_id=case_id, graph=graph)
    node_repo = NodeRepo(conn)
    edge_repo = EdgeRepo(conn)
    for node in nodes:
        await node_repo.upsert(node)
    for edge in edges:
        await edge_repo.upsert(edge)
    return {"nodes": len(nodes), "edges": len(edges)}


def _primary_ontology_id(graph: dict[str, Any]) -> str:
    for raw in graph.get("entities", []):
        if not isinstance(raw, dict):
            continue
        properties = raw.get("properties")
        if isinstance(properties, dict):
            ontology_id = properties.get("ontologyId") or properties.get("domainId")
            if isinstance(ontology_id, str) and ontology_id:
                return ontology_id
    return "context-core"
