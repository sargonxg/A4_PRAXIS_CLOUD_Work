"""Graph builder — adapted from Graphify's build.py.

Takes extraction dicts (or lists thereof) and produces a NetworkX graph.
All ACO metadata is stored as node/edge attributes.
"""
import networkx as nx

from .validate import validate_extraction


def build_from_json(extraction: dict) -> nx.Graph:
    """Build a NetworkX undirected graph from a single extraction dict.

    Node attributes include all metadata fields from the extraction.
    Edge attributes include relation, confidence, weight, and source/target
    stored as _src/_tgt for directed queries on the undirected graph.
    """
    warnings = validate_extraction(extraction)
    # Warnings are informational — log them but don't abort
    for w in warnings:
        pass  # In production, route these to logging

    G = nx.Graph()

    for node in extraction.get("nodes", []):
        node_id = node.get("id")
        if not node_id:
            continue
        attrs = {k: v for k, v in node.items() if k != "id"}
        # Flatten metadata dict into node attrs for easy access
        for mk, mv in attrs.pop("metadata", {}).items():
            if mk not in attrs:
                attrs[mk] = mv
        G.add_node(node_id, **attrs)

    for edge in extraction.get("edges", []):
        src = edge.get("source")
        tgt = edge.get("target")
        if not src or not tgt:
            continue
        attrs = {
            "relation": edge.get("relation", "semantically_similar_to"),
            "confidence": edge.get("confidence", "EXTRACTED"),
            "weight": float(edge.get("weight", 1.0)),
            "source_file": edge.get("source_file", ""),
            "_src": src,
            "_tgt": tgt,
        }
        if G.has_edge(src, tgt):
            # Merge: keep highest weight, record all relations
            existing = G[src][tgt]
            existing["weight"] = max(existing["weight"], attrs["weight"])
            existing["relation"] = existing.get("relation", "") + "," + attrs["relation"]
        else:
            G.add_edge(src, tgt, **attrs)

    # Handle hyperedges (group relationships — e.g. a ceasefire involving 3+ parties)
    for hedge in extraction.get("hyperedges", []):
        members = hedge.get("members", [])
        label = hedge.get("label", "group_relation")
        for i in range(len(members)):
            for j in range(i + 1, len(members)):
                if not G.has_edge(members[i], members[j]):
                    G.add_edge(members[i], members[j], relation=label, weight=0.5, _src=members[i], _tgt=members[j])

    return G


def build(extractions: list[dict]) -> nx.Graph:
    """Merge multiple extraction dicts into a single graph.

    Nodes with the same ID are merged (later extractions overwrite earlier attrs).
    Edges are merged by increasing weight for duplicate source→target pairs.
    """
    G = nx.Graph()
    for extraction in extractions:
        sub = build_from_json(extraction)
        for node_id, attrs in sub.nodes(data=True):
            if G.has_node(node_id):
                G.nodes[node_id].update(attrs)
            else:
                G.add_node(node_id, **attrs)
        for u, v, attrs in sub.edges(data=True):
            if G.has_edge(u, v):
                G[u][v]["weight"] = G[u][v].get("weight", 1.0) + attrs.get("weight", 0.5)
            else:
                G.add_edge(u, v, **attrs)
    return G
