"""Network analytics for PRAXIS case graphs.

NetworkX runs in-process because the workload is CPU-only and bounded for v1
case sizes. Database writes are delegated to firewall_metrics_writer so this
module can be unit-tested without Postgres.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import networkx as nx

try:
    import community as community_louvain  # type: ignore[import-not-found]
except Exception:  # pragma: no cover - optional dependency fallback
    community_louvain = None

@dataclass(frozen=True)
class RankedNode:
    node_id: str
    label: str
    score: float


@dataclass(frozen=True)
class NetworkAnalysisResult:
    node_count: int
    edge_count: int
    community_count: int
    top_brokers: list[RankedNode]
    top_prestige: list[RankedNode]
    backbone_size: int
    louvain_seed: int
    metrics: dict[str, dict[str, Any]]


def graph_from_records(nodes: list[dict[str, Any]], edges: list[dict[str, Any]]) -> nx.MultiDiGraph:
    graph = nx.MultiDiGraph()
    for node in nodes:
        graph.add_node(
            str(node["id"]),
            label=str(node.get("label") or node["id"]),
            primitive=node.get("primitive"),
            ontology_id=node.get("ontology_id"),
            metadata=node.get("metadata") or {},
        )
    for edge in edges:
        source = str(edge.get("source_id"))
        target = str(edge.get("target_id"))
        if source not in graph or target not in graph:
            continue
        metadata = edge.get("metadata") or {}
        graph.add_edge(
            source,
            target,
            relation_type=edge.get("relation_type"),
            weight=float(metadata.get("weight", 1.0) or 1.0),
        )
    return graph


async def load_case_graph(case_id: str, owner_uid: str) -> nx.MultiDiGraph:
    from services.kg_repositories import EdgeRepo, NodeRepo
    from services.postgres import tenant_session

    async with tenant_session(owner_uid) as conn:
        nodes = await NodeRepo(conn).list_committed(owner_uid=owner_uid, case_id=case_id)
        edges = await EdgeRepo(conn).list_committed(owner_uid=owner_uid, case_id=case_id)
    return graph_from_records(nodes, edges)


def compute_centrality(graph: nx.MultiDiGraph) -> dict[str, dict[str, float]]:
    simple = _to_weighted_digraph(graph)
    if simple.number_of_nodes() == 0:
        return {}
    betweenness = nx.betweenness_centrality(simple, weight="weight", normalized=True)
    pagerank = nx.pagerank(simple, weight="weight")
    closeness = nx.closeness_centrality(simple)
    try:
        eigenvector = nx.eigenvector_centrality(simple, max_iter=1000, weight="weight")
    except nx.NetworkXException:
        eigenvector = {node: 0.0 for node in simple.nodes}
    return {
        str(node): {
            "betweenness": float(betweenness.get(node, 0.0)),
            "eigenvector": float(eigenvector.get(node, 0.0)),
            "pagerank": float(pagerank.get(node, 0.0)),
            "closeness": float(closeness.get(node, 0.0)),
        }
        for node in simple.nodes
    }


def detect_communities(graph: nx.MultiDiGraph, *, seed: int = 42) -> dict[str, int]:
    undirected = _to_simple_undirected(graph)
    if undirected.number_of_nodes() == 0:
        return {}
    if community_louvain is not None:
        return {str(node): int(label) for node, label in community_louvain.best_partition(undirected, random_state=seed).items()}
    communities = nx.community.louvain_communities(undirected, seed=seed, weight="weight")
    partition: dict[str, int] = {}
    for label, community in enumerate(communities):
        for node in community:
            partition[str(node)] = label
    return partition


def k_core_decomposition(graph: nx.MultiDiGraph) -> dict[str, int]:
    undirected = _to_simple_undirected(graph)
    if undirected.number_of_nodes() == 0:
        return {}
    without_self_loops = nx.Graph(undirected)
    without_self_loops.remove_edges_from(nx.selfloop_edges(without_self_loops))
    if without_self_loops.number_of_edges() == 0:
        return {str(node): 0 for node in without_self_loops.nodes}
    return {str(node): int(core) for node, core in nx.core_number(without_self_loops).items()}


def analyze_graph(graph: nx.MultiDiGraph, *, louvain_seed: int = 42) -> NetworkAnalysisResult:
    centrality = compute_centrality(graph)
    communities = detect_communities(graph, seed=louvain_seed)
    cores = k_core_decomposition(graph)
    metrics = {
        node_id: {
            "centrality": centrality.get(node_id, {}),
            "community": communities.get(node_id),
            "core_number": cores.get(node_id, 0),
            "provenance": {"algorithm": "networkx-louvain", "louvain_seed": louvain_seed},
        }
        for node_id in graph.nodes
    }
    return NetworkAnalysisResult(
        node_count=graph.number_of_nodes(),
        edge_count=graph.number_of_edges(),
        community_count=len(set(communities.values())),
        top_brokers=top_n_by_metric(graph, centrality, "betweenness"),
        top_prestige=top_n_by_metric(graph, centrality, "eigenvector"),
        backbone_size=sum(1 for value in cores.values() if value >= 3),
        louvain_seed=louvain_seed,
        metrics=metrics,
    )


async def run_network_analysis(case_id: str, owner_uid: str, *, louvain_seed: int = 42) -> NetworkAnalysisResult:
    graph = await load_case_graph(case_id, owner_uid)
    result = analyze_graph(graph, louvain_seed=louvain_seed)
    from services.analytics.firewall_metrics_writer import write_metrics_to_graph_nodes

    await write_metrics_to_graph_nodes(case_id=case_id, owner_uid=owner_uid, metrics=result.metrics, louvain_seed=louvain_seed)
    return result


def top_n_by_metric(graph: nx.MultiDiGraph, centrality: dict[str, dict[str, float]], metric: str, *, n: int = 5) -> list[RankedNode]:
    ranked = sorted(centrality.items(), key=lambda item: item[1].get(metric, 0.0), reverse=True)[:n]
    return [
        RankedNode(node_id=node_id, label=str(graph.nodes[node_id].get("label", node_id)), score=round(values.get(metric, 0.0), 6))
        for node_id, values in ranked
    ]


def _to_weighted_digraph(graph: nx.MultiDiGraph) -> nx.DiGraph:
    simple = nx.DiGraph()
    simple.add_nodes_from(graph.nodes(data=True))
    for source, target, data in graph.edges(data=True):
        weight = float(data.get("weight", 1.0) or 1.0)
        if simple.has_edge(source, target):
            simple[source][target]["weight"] += weight
        else:
            simple.add_edge(source, target, weight=weight)
    return simple


def _to_simple_undirected(graph: nx.MultiDiGraph) -> nx.Graph:
    simple = nx.Graph()
    simple.add_nodes_from(graph.nodes(data=True))
    for source, target, data in graph.edges(data=True):
        weight = float(data.get("weight", 1.0) or 1.0)
        if simple.has_edge(source, target):
            simple[source][target]["weight"] += weight
        else:
            simple.add_edge(source, target, weight=weight)
    return simple
