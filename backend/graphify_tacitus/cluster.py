"""Community detection — adapted from Graphify's cluster.py.

Uses graspologic's Leiden algorithm. Falls back to NetworkX's greedy
modularity communities if graspologic is not installed.
"""
import networkx as nx


def cohesion_score(G: nx.Graph, community_nodes: list) -> float:
    """Compute intra-community edge density (0–1).

    Higher = more tightly connected community (reliable faction structure).
    """
    if len(community_nodes) < 2:
        return 1.0
    subgraph = G.subgraph(community_nodes)
    possible = len(community_nodes) * (len(community_nodes) - 1) / 2
    actual = subgraph.number_of_edges()
    return actual / possible if possible > 0 else 0.0


def cluster(G: nx.Graph) -> dict[str, int]:
    """Run community detection on the graph.

    Returns a dict mapping node_id → community_id (int).
    Also sets G.nodes[n]['community'] attribute in-place.
    """
    if G.number_of_nodes() == 0:
        return {}

    communities: dict[str, int] = {}

    # Try graspologic Leiden (preferred — higher quality)
    try:
        from graspologic.partition import leiden
        community_map = leiden(G)
        communities = {str(node): int(cid) for node, cid in community_map.items()}
    except (ImportError, Exception):
        # Fallback: NetworkX greedy modularity
        try:
            from networkx.algorithms.community import greedy_modularity_communities
            community_sets = list(greedy_modularity_communities(G))
            for cid, nodes in enumerate(community_sets):
                for node in nodes:
                    communities[str(node)] = cid
        except Exception:
            # Last resort: everyone in community 0
            communities = {str(n): 0 for n in G.nodes()}

    # Write community ID as node attribute
    for node_id, cid in communities.items():
        if G.has_node(node_id):
            G.nodes[node_id]["community"] = cid

    return communities
