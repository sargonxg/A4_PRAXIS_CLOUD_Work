from __future__ import annotations

from typing import Any

import networkx as nx

from dialectica.recipes.common import confidence, label, metadata, neighbors_with_relation, nodes_by_type, provenance, source_spans_for_path, typed_node

RULE_ID = "COMMITMENT-CHECK"


def run(graph: nx.MultiDiGraph, params: dict[str, Any]) -> dict[str, Any]:
    del params
    rows: list[dict[str, Any]] = []
    for commitment_id in nodes_by_type(graph, "commitment"):
        data = graph.nodes[commitment_id]
        meta = metadata(data)
        status = str(meta.get("status") or data.get("status") or "active").lower()
        violations = [
            node_id for node_id, edge in neighbors_with_relation(graph, commitment_id, ["VIOLATED", "FRAGILE", "CONSTRAINS"])
            if node_id != commitment_id
        ]
        downstream = [
            node_id for node_id, _ in neighbors_with_relation(graph, commitment_id, ["ADDRESSES", "MADE_COMMITMENT", "DEPENDS", "SUPPORTS"])
            if node_id != commitment_id
        ]
        importance = float(meta.get("importance", data.get("importance", 0.7)) or 0.7)
        status_penalty = 1.0 if status in {"violated", "breached", "fragile", "at_risk"} else (0.35 if violations else 0.15)
        score = round(min(1.0, status_penalty * importance * (1 + len(downstream) / 5)), 4)
        if score < 0.2 and not violations:
            continue
        input_ids = [commitment_id, *violations[:5], *downstream[:5]]
        rows.append({
            "commitment": typed_node(graph, commitment_id),
            "status": status if violations or status != "active" else "fragile_watch",
            "fragility_score": score,
            "violating_events": [typed_node(graph, node_id) for node_id in violations if node_id in graph],
            "downstream_at_risk": [typed_node(graph, node_id) for node_id in downstream if node_id in graph],
            "rationale": f"{label(graph, commitment_id)} is ranked by status={status}, violations={len(violations)}, downstream dependencies={len(downstream)}.",
            "provenance": provenance(RULE_ID, input_ids, min(score, confidence(data)), source_spans_for_path(graph, input_ids)),
        })
    rows.sort(key=lambda item: item["fragility_score"], reverse=True)
    return {"recipe": RULE_ID, "commitments": rows, "provenance": provenance(RULE_ID, [row["commitment"]["node_id"] for row in rows], rows[0]["fragility_score"] if rows else 0.0, [])}
