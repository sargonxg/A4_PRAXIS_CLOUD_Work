from __future__ import annotations

from collections.abc import Iterable
from math import prod
from typing import Any

import networkx as nx

GraphPayload = dict[str, list[dict[str, Any]]]


def build_graph(payload: GraphPayload) -> nx.MultiDiGraph:
    graph = nx.MultiDiGraph()
    for raw in payload.get("nodes", []):
        node_id = str(raw.get("id") or raw.get("node_id") or raw.get("label"))
        graph.add_node(node_id, **raw)
    for idx, raw in enumerate(payload.get("edges", [])):
        source = str(raw.get("source") or raw.get("from") or "")
        target = str(raw.get("target") or raw.get("to") or "")
        if not source or not target or source not in graph or target not in graph:
            continue
        key = str(raw.get("id") or f"edge-{idx}")
        graph.add_edge(source, target, key=key, **raw)
    return graph


def node_type(data: dict[str, Any]) -> str:
    return str(data.get("primitive_type") or data.get("type") or "").lower()


def relation(data: dict[str, Any]) -> str:
    return str(data.get("relation") or data.get("type") or data.get("label") or "RELATED_TO").upper()


def confidence(data: dict[str, Any]) -> float:
    value = data.get("confidence", data.get("confidence_score", 0.65))
    try:
        return max(0.0, min(1.0, float(value)))
    except (TypeError, ValueError):
        return 0.65


def metadata(data: dict[str, Any]) -> dict[str, Any]:
    raw = data.get("metadata") or data.get("properties") or {}
    return raw if isinstance(raw, dict) else {}


def label(graph: nx.MultiDiGraph, node_id: str) -> str:
    data = graph.nodes[node_id]
    return str(data.get("label") or data.get("name") or node_id)


def typed_node(graph: nx.MultiDiGraph, node_id: str) -> dict[str, str]:
    data = graph.nodes[node_id]
    return {"node_id": node_id, "type": node_type(data), "label": label(graph, node_id)}


def source_spans_for_path(graph: nx.MultiDiGraph, path: list[str]) -> list[dict[str, Any]]:
    spans: list[dict[str, Any]] = []
    seen: set[str] = set()
    for node_id in path:
        span = graph.nodes[node_id].get("source_span")
        key = str(span) if span else ""
        if isinstance(span, dict) and key not in seen:
            spans.append(span)
            seen.add(key)
    for source, target in zip(path, path[1:]):
        for edge_data in graph.get_edge_data(source, target, default={}).values():
            span = edge_data.get("source_span")
            key = str(span) if span else ""
            if isinstance(span, dict) and key not in seen:
                spans.append(span)
                seen.add(key)
    return spans[:8]


def path_confidence(graph: nx.MultiDiGraph, path: list[str]) -> float:
    if not path:
        return 0.0
    node_floor = min(confidence(graph.nodes[node_id]) for node_id in path)
    edge_scores: list[float] = []
    for source, target in zip(path, path[1:]):
        edge_data = graph.get_edge_data(source, target, default={})
        edge_scores.append(max((confidence(data) for data in edge_data.values()), default=0.5))
    return round(node_floor * prod(edge_scores or [1.0]), 4)


def nodes_by_type(graph: nx.MultiDiGraph, primitive: str) -> list[str]:
    wanted = primitive.lower()
    return [node_id for node_id, data in graph.nodes(data=True) if node_type(data) == wanted]


def neighbors_with_relation(
    graph: nx.MultiDiGraph,
    node_id: str,
    relation_terms: Iterable[str] | None = None,
) -> list[tuple[str, dict[str, Any]]]:
    wanted = {term.upper() for term in relation_terms or []}
    items: list[tuple[str, dict[str, Any]]] = []
    for _, target, data in graph.out_edges(node_id, data=True):
        if not wanted or any(term in relation(data) for term in wanted):
            items.append((target, data))
    for source, _, data in graph.in_edges(node_id, data=True):
        if not wanted or any(term in relation(data) for term in wanted):
            items.append((source, data))
    return items


def provenance(rule_id: str, input_node_ids: list[str], confidence_value: float, source_spans: list[dict[str, Any]]) -> dict[str, Any]:
    return {
        "ruleId": rule_id,
        "inputNodeIds": input_node_ids,
        "modelVersion": "deterministic-networkx-v1",
        "confidence": round(confidence_value, 4),
        "sourceSpans": source_spans,
    }
