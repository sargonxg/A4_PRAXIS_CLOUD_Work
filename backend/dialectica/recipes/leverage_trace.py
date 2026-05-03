from __future__ import annotations

from typing import Any

import networkx as nx

from dialectica.recipes.common import label, metadata, node_type, nodes_by_type, path_confidence, provenance, source_spans_for_path, typed_node

RULE_ID = "LEVERAGE-TRACE"


def run(graph: nx.MultiDiGraph, params: dict[str, Any]) -> dict[str, Any]:
    actor_a = str(params.get("actor_a_id") or params.get("actorAId") or "")
    actor_b = str(params.get("actor_b_id") or params.get("actorBId") or "")
    if not actor_a or not actor_b:
        actors = nodes_by_type(graph, "actor")
        if len(actors) >= 2:
            actor_a = actor_a or actors[0]
            actor_b = actor_b or actors[1]
    if actor_a not in graph or actor_b not in graph:
        return {"recipe": RULE_ID, "paths": [], "provenance": provenance(RULE_ID, [actor_a, actor_b], 0.0, [])}

    simple_graph = nx.DiGraph(graph)
    paths: list[list[str]] = []
    try:
        paths.extend(nx.all_simple_paths(simple_graph, actor_a, actor_b, cutoff=4))
    except nx.NetworkXNoPath:
        pass
    if not paths:
        undirected = nx.Graph(graph)
        try:
            paths.extend(nx.all_simple_paths(undirected, actor_a, actor_b, cutoff=4))
        except nx.NetworkXNoPath:
            pass

    rows: list[dict[str, Any]] = []
    for path in paths:
        leverage_nodes = [node_id for node_id in path if node_type(graph.nodes[node_id]) == "leverage"]
        if not leverage_nodes:
            continue
        score = path_confidence(graph, path)
        leverage_meta = metadata(graph.nodes[leverage_nodes[0]])
        leverage_type = str(leverage_meta.get("subtype") or leverage_meta.get("domain") or "diplomatic")
        effectiveness = float(leverage_meta.get("effectiveness", 0.75) or 0.75)
        score = round(score * max(0.1, min(1.0, effectiveness)), 4)
        rows.append({
            "actor_a": label(graph, actor_a),
            "actor_b": label(graph, actor_b),
            "leverage_type": leverage_type,
            "chain": [typed_node(graph, node_id) for node_id in path],
            "confidence": score,
            "rationale": f"{label(graph, actor_a)} can affect {label(graph, actor_b)} through {label(graph, leverage_nodes[0])}.",
            "counter_leverage": _counter_leverage(graph, actor_b, actor_a),
            "provenance": provenance(RULE_ID, path, score, source_spans_for_path(graph, path)),
        })

    rows.sort(key=lambda item: item["confidence"], reverse=True)
    return {"recipe": RULE_ID, "paths": rows[:15], "provenance": provenance(RULE_ID, [actor_a, actor_b], rows[0]["confidence"] if rows else 0.0, [])}


def _counter_leverage(graph: nx.MultiDiGraph, source: str, target: str) -> list[str]:
    counter: list[str] = []
    for path in nx.all_simple_paths(nx.Graph(graph), source, target, cutoff=3):
        counter.extend(node_id for node_id in path if node_type(graph.nodes[node_id]) == "leverage")
    return sorted(set(counter))[:5]
