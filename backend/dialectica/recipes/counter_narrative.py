from __future__ import annotations

from typing import Any

import networkx as nx

from dialectica.recipes.common import label, neighbors_with_relation, node_type, provenance, source_spans_for_path, typed_node

RULE_ID = "COUNTER-NARRATIVE"


def run(graph: nx.MultiDiGraph, params: dict[str, Any]) -> dict[str, Any]:
    input_id = str(params.get("event_id") or params.get("claim_id") or params.get("node_id") or "")
    if input_id not in graph:
        return {"recipe": RULE_ID, "narratives": [], "divergence_score": 0.0, "provenance": provenance(RULE_ID, [input_id], 0.0, [])}
    narrative_ids = [
        node_id for node_id, edge in neighbors_with_relation(graph, input_id, ["FRAMES", "JUSTIFIES", "CONTESTS", "SUPPORTS"])
        if node_type(graph.nodes[node_id]) == "narrative"
    ]
    rows: list[dict[str, Any]] = []
    citation_sets: list[set[str]] = []
    for narrative_id in sorted(set(narrative_ids)):
        actors = [
            node_id for node_id, _ in neighbors_with_relation(graph, narrative_id, ["PROPAGATES", "CLAIMS", "SUPPORTS"])
            if node_type(graph.nodes[node_id]) == "actor"
        ]
        spans = source_spans_for_path(graph, [input_id, narrative_id, *actors])
        citation_ids = {str(span.get("documentId")) for span in spans if span.get("documentId")}
        citation_sets.append(citation_ids)
        rows.append({
            "narrative": typed_node(graph, narrative_id),
            "propagating_actors": [typed_node(graph, node_id) for node_id in actors],
            "claim": label(graph, narrative_id),
            "citations": sorted(citation_ids),
            "provenance": provenance(RULE_ID, [input_id, narrative_id, *actors], 0.75, spans),
        })
    divergence = _jaccard_divergence(citation_sets)
    return {"recipe": RULE_ID, "target": typed_node(graph, input_id), "narratives": rows, "divergence_score": divergence, "provenance": provenance(RULE_ID, [input_id, *narrative_ids], 1 - divergence if rows else 0.0, [])}


def _jaccard_divergence(sets: list[set[str]]) -> float:
    if len(sets) < 2:
        return 0.0
    union = set().union(*sets)
    intersection = set.intersection(*sets) if all(sets) else set()
    if not union:
        return 0.0
    return round(1 - (len(intersection) / len(union)), 4)
