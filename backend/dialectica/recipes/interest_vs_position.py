from __future__ import annotations

from typing import Any

import networkx as nx

from dialectica.recipes.common import label, neighbors_with_relation, node_type, path_confidence, provenance, source_spans_for_path, typed_node

RULE_ID = "INTEREST-vs-POSITION"


def run(graph: nx.MultiDiGraph, params: dict[str, Any]) -> dict[str, Any]:
    actor_ids = [str(item) for item in params.get("actor_ids", params.get("actorIds", []))]
    actor_ids = [node_id for node_id in actor_ids if node_id in graph]
    if not actor_ids:
        actor_ids = [node_id for node_id, data in graph.nodes(data=True) if node_type(data) == "actor"][:6]

    actor_profiles = {actor_id: _profile(graph, actor_id) for actor_id in actor_ids}
    candidates: list[dict[str, Any]] = []
    for idx, actor_a in enumerate(actor_ids):
        for actor_b in actor_ids[idx + 1:]:
            shared_interests = _shared_terms(actor_profiles[actor_a]["interests"], actor_profiles[actor_b]["interests"])
            if not shared_interests:
                continue
            confidence_value = round(min(_avg_conf(graph, actor_profiles[actor_a]["interest_ids"]), _avg_conf(graph, actor_profiles[actor_b]["interest_ids"])), 4)
            input_ids = [actor_a, actor_b, *actor_profiles[actor_a]["interest_ids"], *actor_profiles[actor_b]["interest_ids"]]
            candidates.append({
                "actors": [typed_node(graph, actor_a), typed_node(graph, actor_b)],
                "opening": f"Shared interest language around {', '.join(shared_interests[:3])}.",
                "position_tension": _position_tension(actor_profiles[actor_a]["claims"], actor_profiles[actor_b]["claims"]),
                "zopa_score": confidence_value,
                "confidence": confidence_value,
                "provenance": provenance(RULE_ID, input_ids, confidence_value, source_spans_for_path(graph, input_ids)),
            })
    candidates.sort(key=lambda item: item["zopa_score"], reverse=True)
    return {"recipe": RULE_ID, "zopa_candidates": candidates[:10], "actors": actor_profiles, "provenance": provenance(RULE_ID, actor_ids, candidates[0]["confidence"] if candidates else 0.0, [])}


def _profile(graph: nx.MultiDiGraph, actor_id: str) -> dict[str, Any]:
    claims: list[str] = []
    interests: list[str] = []
    claim_ids: list[str] = []
    interest_ids: list[str] = []
    for node_id, _edge in neighbors_with_relation(graph, actor_id):
        kind = node_type(graph.nodes[node_id])
        if kind == "claim":
            claims.append(label(graph, node_id))
            claim_ids.append(node_id)
        if kind == "interest":
            interests.append(label(graph, node_id))
            interest_ids.append(node_id)
    return {"label": label(graph, actor_id), "claims": claims, "interests": interests, "claim_ids": claim_ids, "interest_ids": interest_ids}


def _shared_terms(left: list[str], right: list[str]) -> list[str]:
    left_terms = {token.lower().strip(".,;:") for text in left for token in text.split() if len(token) > 4}
    right_terms = {token.lower().strip(".,;:") for text in right for token in text.split() if len(token) > 4}
    return sorted(left_terms & right_terms)


def _avg_conf(graph: nx.MultiDiGraph, node_ids: list[str]) -> float:
    if not node_ids:
        return 0.5
    return sum(path_confidence(graph, [node_id]) for node_id in node_ids) / len(node_ids)


def _position_tension(left: list[str], right: list[str]) -> str:
    if not left or not right:
        return "low-evidence"
    return "positions differ, but interest overlap suggests a negotiable opening"
