from __future__ import annotations

from typing import Any

import networkx as nx

from dialectica.recipes.common import nodes_by_type, path_confidence, provenance, source_spans_for_path, typed_node

RULE_ID = "PATH-SEARCH"


def run(graph: nx.MultiDiGraph, params: dict[str, Any]) -> dict[str, Any]:
    goal = str(params.get("goal_state") or params.get("goalState") or "stabilize agreement")
    leverage_nodes = nodes_by_type(graph, "leverage")[:4]
    commitment_nodes = nodes_by_type(graph, "commitment")[:4]
    constraint_nodes = nodes_by_type(graph, "constraint")[:4]
    actors = nodes_by_type(graph, "actor")[:4]

    candidates: list[dict[str, Any]] = []
    templates = [
        ("verification-first", ["technical verification mission", "quiet bilateral pressure", "public reporting cadence"]),
        ("commitment-repair", ["map commitment gaps", "sequence implementation guarantees", "monitor compliance events"]),
        ("constraint-aware", ["identify hard constraints", "route around spoilers", "pair incentives with access guarantees"]),
    ]
    for idx, (path_id, actions) in enumerate(templates):
        support_ids = [*(actors[idx:idx + 2]), *(leverage_nodes[idx:idx + 1]), *(commitment_nodes[idx:idx + 1]), *(constraint_nodes[:1])]
        support_ids = [node_id for node_id in support_ids if node_id in graph]
        confidence_value = path_confidence(graph, support_ids) if support_ids else 0.45
        probability = round(min(0.9, confidence_value * (0.85 if constraint_nodes else 1.0)), 4)
        candidates.append({
            "path_id": path_id,
            "goal_state": goal,
            "actions": actions,
            "supporting_nodes": [typed_node(graph, node_id) for node_id in support_ids],
            "cost": "medium" if idx != 0 else "low",
            "risk": "medium" if constraint_nodes else "low",
            "probability": probability,
            "confidence": confidence_value,
            "rationale": f"Ranks {path_id} by graph confidence, available leverage, and active constraints.",
            "provenance": provenance(RULE_ID, support_ids, confidence_value, source_spans_for_path(graph, support_ids)),
        })
    candidates.sort(key=lambda item: item["probability"], reverse=True)
    return {"recipe": RULE_ID, "paths": candidates, "provenance": provenance(RULE_ID, [node["node_id"] for item in candidates for node in item["supporting_nodes"]], candidates[0]["confidence"] if candidates else 0.0, [])}
