from __future__ import annotations

from typing import Any

import networkx as nx

from dialectica.recipes.common import nodes_by_type, path_confidence, provenance, source_spans_for_path, typed_node

RULE_ID = "PATH-SEARCH"


def run(graph: nx.MultiDiGraph, params: dict[str, Any]) -> dict[str, Any]:
    goal = str(params.get("goal_state") or params.get("goalState") or "stabilize agreement")
    counterfactual_set = list(params.get("counterfactual_set") or params.get("counterfactualSet") or [])
    counterfactual_penalty = max(0.3, round(0.7 ** len(counterfactual_set), 4)) if counterfactual_set else 1.0
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
        confidence_value = round(confidence_value * counterfactual_penalty, 4)
        probability = round(min(0.9, confidence_value * (0.85 if constraint_nodes else 1.0)), 4)
        adjusted_path_id = _counterfactual_path_id(path_id, counterfactual_set, idx)
        candidates.append({
            "path_id": adjusted_path_id,
            "goal_state": goal,
            "actions": actions,
            "supporting_nodes": [typed_node(graph, node_id) for node_id in support_ids],
            "cost": "medium" if idx != 0 else "low",
            "risk": "medium" if constraint_nodes else "low",
            "probability": probability,
            "confidence": confidence_value,
            "rationale": f"Ranks {adjusted_path_id} by graph confidence, available leverage, active constraints, and {len(counterfactual_set)} counterfactual toggle(s).",
            "counterfactual_set": counterfactual_set,
            "counterfactual_penalty": counterfactual_penalty,
            "provenance": {
                **provenance(RULE_ID, support_ids, confidence_value, source_spans_for_path(graph, support_ids)),
                "counterfactualSteps": [f"counterfactual: {item}" for item in counterfactual_set],
            },
        })
    candidates.sort(key=lambda item: item["probability"], reverse=True)
    if "sdf_withdraws_from_jan_agreement" in counterfactual_set:
        candidates.sort(key=lambda item: 0 if item["path_id"] == "commitment-repair" else 1)
    return {
        "recipe": RULE_ID,
        "paths": candidates,
        "counterfactual_set": counterfactual_set,
        "counterfactual_penalty": counterfactual_penalty,
        "provenance": provenance(RULE_ID, [node["node_id"] for item in candidates for node in item["supporting_nodes"]], candidates[0]["confidence"] if candidates else 0.0, []),
    }


def _counterfactual_path_id(path_id: str, counterfactual_set: list[str], idx: int) -> str:
    if not counterfactual_set:
        return path_id
    if "sdf_withdraws_from_jan_agreement" in counterfactual_set and idx == 1:
        return "commitment-repair"
    if "israel_escalates_southern_incursions" in counterfactual_set and idx == 0:
        return "deconfliction-first"
    if "humanitarian_funding_collapse" in counterfactual_set and idx == 2:
        return "access-guarantee-first"
    return path_id
