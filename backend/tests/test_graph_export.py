"""Tests for graph export endpoint helpers."""
import io

import networkx as nx
import pytest


def make_test_graph() -> nx.DiGraph:
    G = nx.DiGraph()
    G.add_node("a1", label="Actor One", primitive_type="Actor")
    G.add_node("a2", label="Actor Two", primitive_type="Actor")
    G.add_edge("a1", "a2", relation="OPPOSED_BY", weight=0.8)
    return G


def test_graphml_roundtrip():
    G = make_test_graph()
    buf = io.BytesIO()
    nx.write_graphml(G, buf)
    buf.seek(0)
    G2 = nx.read_graphml(buf)
    assert len(G2.nodes) == 2
    assert len(G2.edges) == 1


def test_gexf_roundtrip():
    G = make_test_graph()
    buf = io.BytesIO()
    nx.write_gexf(G, buf)
    buf.seek(0)
    G2 = nx.read_gexf(buf)
    assert len(G2.nodes) == 2
    assert len(G2.edges) == 1


def test_json_roundtrip():
    from networkx.readwrite import json_graph
    import json

    G = make_test_graph()
    data = json_graph.node_link_data(G)
    payload = json.dumps(data)
    G2 = json_graph.node_link_graph(json.loads(payload), directed=True)
    assert len(G2.nodes) == 2
    assert len(G2.edges) == 1


def test_to_cypher_contains_merge():
    from graphify_tacitus.cypher_export import to_cypher as _to_cypher

    G = make_test_graph()
    cypher = _to_cypher(G, tenant_id="user1", situation_id="sit1")
    assert "MERGE (:Actor" in cypher or "MERGE (:Entity" in cypher
    assert "MERGE (a)-[:" in cypher
    assert "user1" in cypher
    assert "sit1" in cypher


def test_to_cypher_idempotent_merge():
    """Verify MERGE (not CREATE) is used for both nodes and edges."""
    from graphify_tacitus.cypher_export import to_cypher as _to_cypher

    G = make_test_graph()
    cypher = _to_cypher(G, tenant_id="tenant42", situation_id="s99")
    lines = cypher.splitlines()
    # All non-comment, non-empty lines must start with MERGE or MATCH
    for line in lines:
        stripped = line.strip()
        if stripped and not stripped.startswith("//"):
            assert stripped.startswith("MERGE") or stripped.startswith("MATCH"), (
                f"Expected MERGE/MATCH statement, got: {stripped}"
            )


def test_to_cypher_edge_relation_uppercase():
    """Relation labels must be uppercased in Cypher."""
    from graphify_tacitus.cypher_export import to_cypher as _to_cypher

    G = nx.DiGraph()
    G.add_node("n1", label="Node1", primitive_type="Actor")
    G.add_node("n2", label="Node2", primitive_type="Actor")
    G.add_edge("n1", "n2", relation="allied_with", weight=1.0)
    cypher = _to_cypher(G, tenant_id="u1", situation_id="s1")
    assert "ALLIED_WITH" in cypher


def test_to_cypher_default_relation():
    """Edges without a relation get RELATED_TO as default."""
    from graphify_tacitus.cypher_export import to_cypher as _to_cypher

    G = nx.DiGraph()
    G.add_node("x", label="X", primitive_type="Actor")
    G.add_node("y", label="Y", primitive_type="Actor")
    G.add_edge("x", "y")  # no relation attr
    cypher = _to_cypher(G, tenant_id="u1", situation_id="s1")
    assert "RELATED_TO" in cypher
