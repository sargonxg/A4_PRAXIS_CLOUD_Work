import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import networkx as nx

from services.analytics.network_metrics import analyze_graph, compute_centrality, detect_communities, graph_from_records, k_core_decomposition


def test_network_metrics_compute_expected_shapes():
    graph = nx.MultiDiGraph()
    graph.add_node("a", label="Broker")
    graph.add_node("b", label="Left")
    graph.add_node("c", label="Right")
    graph.add_edge("b", "a", weight=1)
    graph.add_edge("a", "c", weight=1)
    graph.add_edge("b", "c", weight=5)

    centrality = compute_centrality(graph)

    assert set(centrality) == {"a", "b", "c"}
    assert centrality["a"]["betweenness"] > 0
    assert all("pagerank" in metrics for metrics in centrality.values())


def test_louvain_is_deterministic_with_fixed_seed():
    graph = nx.karate_club_graph()
    multi = nx.MultiDiGraph()
    multi.add_nodes_from((str(node), {"label": str(node)}) for node in graph.nodes)
    multi.add_edges_from((str(source), str(target)) for source, target in graph.edges)

    assert detect_communities(multi, seed=42) == detect_communities(multi, seed=42)


def test_k_core_and_result_summary():
    records = [{"id": str(index), "label": f"Node {index}", "primitive": "Actor", "ontology_id": "conflict"} for index in range(4)]
    edges = [
        {"source_id": "0", "target_id": "1", "metadata": {"weight": 1}},
        {"source_id": "1", "target_id": "2", "metadata": {"weight": 1}},
        {"source_id": "2", "target_id": "3", "metadata": {"weight": 1}},
        {"source_id": "3", "target_id": "0", "metadata": {"weight": 1}},
    ]
    graph = graph_from_records(records, edges)
    result = analyze_graph(graph, louvain_seed=7)

    assert result.node_count == 4
    assert result.edge_count == 4
    assert result.louvain_seed == 7
    assert k_core_decomposition(graph)["0"] >= 2
