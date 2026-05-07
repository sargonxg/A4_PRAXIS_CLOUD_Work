"""Map Microsoft GraphRAG-style output onto PRAXIS ACO primitives."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


ENTITY_TO_ACO = {
    "person": "Actor",
    "organization": "Actor",
    "org": "Actor",
    "state": "Actor",
    "event": "Event",
    "claim": "Claim",
    "proposition": "Claim",
    "goal": "Interest",
    "interest": "Interest",
    "rule": "Constraint",
    "policy": "Constraint",
    "constraint": "Constraint",
    "tool": "Leverage",
    "lever": "Leverage",
    "promise": "Commitment",
    "agreement": "Commitment",
    "narrative": "Narrative",
    "frame": "Narrative",
}


@dataclass(frozen=True)
class AcoOutput:
    nodes: list[dict[str, Any]] = field(default_factory=list)
    edges: list[dict[str, Any]] = field(default_factory=list)
    candidate_summaries: list[dict[str, Any]] = field(default_factory=list)


def graphrag_to_aco(
    entities: list[dict[str, Any]],
    relationships: list[dict[str, Any]],
    communities: list[dict[str, Any]],
) -> AcoOutput:
    nodes = [_entity_to_node(entity) for entity in entities]
    id_map = {
        str(entity.get("id") or entity.get("title") or entity.get("name") or index): node["id"]
        for index, (entity, node) in enumerate(zip(entities, nodes, strict=False))
    }
    known_ids = set(id_map.values())
    edges = [
        _relationship_to_edge(relationship, id_map)
        for relationship in relationships
        if _mapped_id(relationship.get("source"), id_map) in known_ids and _mapped_id(relationship.get("target"), id_map) in known_ids
    ]
    summaries = [_community_to_review_block(community) for community in communities]
    return AcoOutput(nodes=nodes, edges=edges, candidate_summaries=summaries)


def _entity_to_node(entity: dict[str, Any]) -> dict[str, Any]:
    raw_type = str(entity.get("type", entity.get("entity_type", "claim"))).lower()
    primitive = ENTITY_TO_ACO.get(raw_type, "Claim")
    label = str(entity.get("title") or entity.get("name") or entity.get("id") or "GraphRAG entity")
    return {
        "id": _stable_id(label),
        "external_id": str(entity.get("id") or ""),
        "label": label,
        "primitive_type": primitive,
        "confidence": "ASSESSED",
        "metadata": {
            "source": "graphrag",
            "graphrag_type": raw_type,
            "description": entity.get("description", ""),
        },
    }


def _relationship_to_edge(relationship: dict[str, Any], id_map: dict[str, str]) -> dict[str, Any]:
    return {
        "source": _mapped_id(relationship.get("source"), id_map),
        "target": _mapped_id(relationship.get("target"), id_map),
        "relation": str(relationship.get("type") or relationship.get("relationship") or "semantically_similar_to"),
        "confidence": "ASSESSED",
        "description": str(relationship.get("description", "")),
        "source_file": "graphrag-community-synthesizer",
    }


def _community_to_review_block(community: dict[str, Any]) -> dict[str, Any]:
    title = str(community.get("title") or community.get("community") or "Corpus community")
    summary = str(community.get("summary") or community.get("description") or "")
    return {
        "title": title,
        "content": summary,
        "source": {"kind": "graphrag-community-synthesizer", "community_id": community.get("id")},
        "synthesized": True,
        "confidence": min(float(community.get("confidence", 0.6) or 0.6), 0.6),
        "review_status": "pending",
    }


def _stable_id(label: str) -> str:
    return "".join(ch if ch.isalnum() else "_" for ch in label.lower()).strip("_")


def _mapped_id(value: Any, id_map: dict[str, str]) -> str:
    raw = str(value or "")
    return id_map.get(raw, _stable_id(raw))
