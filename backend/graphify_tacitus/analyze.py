"""Conflict-specific graph analysis — adapted from Graphify's analyze.py.

Provides conflict intelligence functions: pivot actors, hidden linkages,
intelligence gaps, escalation assessment, faction map, negotiation space.
All functions are pure — they take G + communities and return dicts.
"""
from __future__ import annotations

import networkx as nx


# ── Primitive type helpers ────────────────────────────────────────────────────

def _is_primitive(G: nx.Graph, node_id: str, ptype: str) -> bool:
    return G.nodes[node_id].get("primitive_type") == ptype


def _is_file_node(G: nx.Graph, node_id: str) -> bool:
    """Legacy Graphify compat — not used for ACO but kept for composability."""
    return G.nodes[node_id].get("_is_file", False)


def _is_concept_node(G: nx.Graph, node_id: str) -> bool:
    return not _is_file_node(G, node_id)


def _node_community_map(communities: dict[str, int]) -> dict[int, list[str]]:
    """Invert communities dict: community_id → [node_ids]."""
    result: dict[int, list[str]] = {}
    for node_id, cid in communities.items():
        result.setdefault(cid, []).append(node_id)
    return result


def graph_diff(G_old: nx.Graph, G_new: nx.Graph) -> dict:
    """Compare two graph snapshots and return added/removed nodes/edges."""
    old_nodes = set(G_old.nodes())
    new_nodes = set(G_new.nodes())
    old_edges = set(G_old.edges())
    new_edges = set(G_new.edges())
    return {
        "added_nodes": list(new_nodes - old_nodes),
        "removed_nodes": list(old_nodes - new_nodes),
        "added_edges": [list(e) for e in new_edges - old_edges],
        "removed_edges": [list(e) for e in old_edges - new_edges],
    }


# ── Core analysis functions ───────────────────────────────────────────────────

def pivot_actors(G: nx.Graph, top_n: int = 10) -> list[dict]:
    """Highest-degree Actor nodes — the most connected parties in the conflict.

    Analogous to Graphify's god_nodes but filtered to primitive_type == 'Actor'.
    """
    actors = [
        n for n in G.nodes()
        if _is_primitive(G, n, "Actor")
    ]
    actors_by_degree = sorted(actors, key=lambda n: G.degree(n), reverse=True)[:top_n]

    return [
        {
            "id": n,
            "label": G.nodes[n].get("label", n),
            "edges": G.degree(n),
            "actor_type": G.nodes[n].get("actor_type", ""),
            "community": G.nodes[n].get("community"),
            "affiliation": G.nodes[n].get("affiliation", ""),
            "stated_position": G.nodes[n].get("stated_position", ""),
        }
        for n in actors_by_degree
    ]


def key_concepts(G: nx.Graph, top_n: int = 5) -> list[dict]:
    """Highest-degree non-Actor nodes — Claims, Interests, Narratives everything connects through."""
    non_actors = [
        n for n in G.nodes()
        if not _is_primitive(G, n, "Actor") and _is_concept_node(G, n)
    ]
    top = sorted(non_actors, key=lambda n: G.degree(n), reverse=True)[:top_n]
    return [
        {
            "id": n,
            "label": G.nodes[n].get("label", n),
            "primitive_type": G.nodes[n].get("primitive_type"),
            "edges": G.degree(n),
            "community": G.nodes[n].get("community"),
        }
        for n in top
    ]


def hidden_linkages(G: nx.Graph, communities: dict[str, int], top_n: int = 5) -> list[dict]:
    """Cross-community edges with high conflict significance.

    Scores each cross-faction edge with bonuses for:
    - Actor↔Actor cross-faction: potential back-channel (+3)
    - Interest alignment across opposing factions: potential ZOPA (+4)
    - Leverage targeting an allied actor: spoiler dynamic (+2)
    - Narrative contradicting same-faction Claim: internal incoherence (+3)
    """
    results = []
    for u, v, data in G.edges(data=True):
        c_u = communities.get(u)
        c_v = communities.get(v)
        if c_u is None or c_v is None or c_u == c_v:
            continue

        score = 1.0
        why = "Cross-community connection"
        conflict_significance = "structural_bridge"

        u_type = G.nodes[u].get("primitive_type", "")
        v_type = G.nodes[v].get("primitive_type", "")
        relation = data.get("relation", "")

        if u_type == "Actor" and v_type == "Actor":
            score += 3
            why = "Actors from opposing factions are connected — potential back-channel"
            conflict_significance = "back_channel"
        elif u_type == "Interest" and v_type == "Interest" and relation == "aligns_with":
            score += 4
            why = "Interests across opposing factions align — potential ZOPA"
            conflict_significance = "zopa_signal"
        elif u_type == "Leverage" and v_type == "Actor" and communities.get(data.get("_src")) == communities.get(v):
            score += 2
            why = "Leverage targeting an allied actor — spoiler dynamic"
            conflict_significance = "spoiler_risk"
        elif u_type == "Narrative" and v_type == "Claim" and relation == "undermines_claim":
            if communities.get(u) == communities.get(v):
                score += 3
                why = "Narrative undermining a same-faction claim — internal incoherence"
                conflict_significance = "internal_incoherence"

        results.append({
            "source": u,
            "target": v,
            "source_label": G.nodes[u].get("label", u),
            "target_label": G.nodes[v].get("label", v),
            "relation": relation,
            "source_community": c_u,
            "target_community": c_v,
            "score": round(score, 2),
            "why": why,
            "conflict_significance": conflict_significance,
        })

    results.sort(key=lambda x: x["score"], reverse=True)
    return results[:top_n]


def intelligence_gaps(
    G: nx.Graph,
    communities: dict[str, int],
    community_labels: dict[int, str],
    top_n: int = 7,
) -> list[dict]:
    """Identify what we DON'T know — gaps, blind spots, and ambiguities in the graph.

    Adapted from Graphify's suggest_questions, reframed for conflict intelligence.
    """
    gaps = []
    community_map = _node_community_map(communities)

    # 1. Ambiguous edges → Unverified Intelligence
    for u, v, data in G.edges(data=True):
        if data.get("confidence") == "AMBIGUOUS":
            gaps.append({
                "type": "Unverified Intelligence",
                "description": f"Relationship between '{G.nodes[u].get('label', u)}' and '{G.nodes[v].get('label', v)}' is ambiguous",
                "nodes": [u, v],
                "priority": 3,
            })

    # 2. High-degree nodes connecting communities → Gatekeeper Analysis
    for n in G.nodes():
        neighbors = list(G.neighbors(n))
        neighbor_communities = {communities.get(nb) for nb in neighbors if communities.get(nb) is not None}
        if len(neighbor_communities) >= 3:
            gaps.append({
                "type": "Gatekeeper Analysis",
                "description": f"'{G.nodes[n].get('label', n)}' connects {len(neighbor_communities)} factions — critical node requires deeper analysis",
                "nodes": [n],
                "priority": 4,
            })

    # 3. INFERRED high-degree nodes → Assessment Validation
    for n in G.nodes():
        if G.nodes[n].get("confidence") == "INFERRED" and G.degree(n) > 2:
            gaps.append({
                "type": "Assessment Validation",
                "description": f"'{G.nodes[n].get('label', n)}' has {G.degree(n)} connections but is based on inference — requires source verification",
                "nodes": [n],
                "priority": 3,
            })

    # 4. Isolated nodes → Blind Spots
    for n in G.nodes():
        if G.degree(n) == 0:
            gaps.append({
                "type": "Blind Spot",
                "description": f"'{G.nodes[n].get('label', n)}' is isolated — no known relationships",
                "nodes": [n],
                "priority": 2,
            })

    # 5. Small communities → Fragile Coalition
    for cid, members in community_map.items():
        if 1 < len(members) <= 3:
            label = community_labels.get(cid, f"Faction {cid}")
            gaps.append({
                "type": "Fragile Coalition",
                "description": f"Faction '{label}' has only {len(members)} members — coalition stability is uncertain",
                "nodes": members,
                "priority": 2,
            })

    # 6. High-impact Events → Escalation Risk
    for n in G.nodes():
        if _is_primitive(G, n, "Event"):
            impact = G.nodes[n].get("escalation_impact", 0)
            if isinstance(impact, (int, float)) and abs(impact) > 0.5:
                connected_actors = [nb for nb in G.neighbors(n) if _is_primitive(G, nb, "Actor")]
                if len(connected_actors) > 1:
                    gaps.append({
                        "type": "Escalation Risk",
                        "description": f"Event '{G.nodes[n].get('label', n)}' (impact={impact:.2f}) involves multiple actors — requires monitoring",
                        "nodes": [n] + connected_actors,
                        "priority": 5,
                    })

    gaps.sort(key=lambda x: x["priority"], reverse=True)
    return gaps[:top_n]


def escalation_assessment(G: nx.Graph) -> dict:
    """Compute Glasl escalation stage (1-9) and trajectory from Event nodes.

    Stage mapping:
      1-3 (Win-Win zone): avg escalation_impact < 0.3
      4-6 (Win-Lose zone): 0.3 ≤ avg < 0.6
      7-9 (Lose-Lose zone): avg ≥ 0.6
    """
    events = [n for n in G.nodes() if _is_primitive(G, n, "Event")]
    if not events:
        return {
            "glaslStage": 1,
            "trajectory": "stable",
            "escalation_chains": [],
            "event_count": 0,
            "average_impact": 0.0,
        }

    impacts = []
    for n in events:
        impact = G.nodes[n].get("escalation_impact", 0)
        if isinstance(impact, (int, float)):
            impacts.append(float(impact))

    avg_impact = sum(impacts) / len(impacts) if impacts else 0.0

    if avg_impact < 0.3:
        stage = 2
    elif avg_impact < 0.5:
        stage = 5
    elif avg_impact < 0.7:
        stage = 7
    else:
        stage = 9

    # Detect escalation chains (Event→triggered_by→Event)
    chains = []
    for u, v, data in G.edges(data=True):
        if data.get("relation") in ("triggered_by", "escalates") and _is_primitive(G, u, "Event") and _is_primitive(G, v, "Event"):
            chains.append({
                "trigger": G.nodes[v].get("label", v),
                "result": G.nodes[u].get("label", u),
                "relation": data.get("relation"),
            })

    # Trajectory based on recent vs older event impacts
    positive = sum(1 for i in impacts if i > 0.1)
    negative = sum(1 for i in impacts if i < -0.1)
    if positive > negative:
        trajectory = "escalating"
    elif negative > positive:
        trajectory = "de-escalating"
    else:
        trajectory = "stable"

    return {
        "glaslStage": stage,
        "trajectory": trajectory,
        "escalation_chains": chains[:5],
        "event_count": len(events),
        "average_impact": round(avg_impact, 3),
    }


def faction_map(G: nx.Graph, communities: dict[str, int]) -> dict[int, dict]:
    """Build a faction map: community_id → {actors, claims, interests, leverage, narratives}.

    Each faction is characterized by its dominant actors, shared claims/interests,
    held leverage, and propagated narratives.
    """
    community_map = _node_community_map(communities)
    result = {}

    for cid, members in community_map.items():
        actors = [
            {"id": n, "label": G.nodes[n].get("label", n), "degree": G.degree(n)}
            for n in members if _is_primitive(G, n, "Actor")
        ]
        claims = [G.nodes[n].get("label", n) for n in members if _is_primitive(G, n, "Claim")]
        interests = [G.nodes[n].get("label", n) for n in members if _is_primitive(G, n, "Interest")]
        leverage = [G.nodes[n].get("label", n) for n in members if _is_primitive(G, n, "Leverage")]
        narratives = [G.nodes[n].get("label", n) for n in members if _is_primitive(G, n, "Narrative")]

        # Faction name: label of highest-degree actor
        actors_sorted = sorted(actors, key=lambda a: a["degree"], reverse=True)
        faction_name = actors_sorted[0]["label"] if actors_sorted else f"Faction {cid}"

        result[cid] = {
            "id": cid,
            "name": faction_name,
            "actors": actors_sorted,
            "claims": claims,
            "interests": interests,
            "leverage": leverage,
            "narratives": narratives,
            "member_count": len(members),
        }

    return result


def negotiation_space(G: nx.Graph) -> dict:
    """Identify negotiation opportunities from the graph structure.

    - ZOPA: Interest nodes that appear connected to actors in multiple factions
    - Hard constraints: Constraint nodes with severity == 'hard'
    - Leverage asymmetries: which faction holds more Leverage nodes
    """
    # ZOPA candidates: Interest nodes connected to actors in 2+ different communities
    zopa = []
    for n in G.nodes():
        if not _is_primitive(G, n, "Interest"):
            continue
        actor_communities = set()
        for nb in G.neighbors(n):
            if _is_primitive(G, nb, "Actor"):
                c = G.nodes[nb].get("community")
                if c is not None:
                    actor_communities.add(c)
        if len(actor_communities) >= 2:
            zopa.append({
                "interest": G.nodes[n].get("label", n),
                "id": n,
                "shared_across_factions": list(actor_communities),
                "salience": G.nodes[n].get("salience", 0.5),
            })

    # Hard constraints
    hard_constraints = [
        {
            "id": n,
            "label": G.nodes[n].get("label", n),
            "constraint_type": G.nodes[n].get("constraint_type", ""),
            "imposed_by": G.nodes[n].get("imposed_by", ""),
        }
        for n in G.nodes()
        if _is_primitive(G, n, "Constraint") and G.nodes[n].get("severity") == "hard"
    ]

    # Leverage asymmetries: count leverage per community
    leverage_by_community: dict[int, int] = {}
    for n in G.nodes():
        if _is_primitive(G, n, "Leverage"):
            c = G.nodes[n].get("community")
            if c is not None:
                leverage_by_community[c] = leverage_by_community.get(c, 0) + 1

    leverage_asymmetries = [
        {"community": cid, "leverage_count": count}
        for cid, count in sorted(leverage_by_community.items(), key=lambda x: x[1], reverse=True)
    ]

    return {
        "zopa": zopa,
        "hardConstraints": hard_constraints,
        "leverageAsymmetries": leverage_asymmetries,
    }
