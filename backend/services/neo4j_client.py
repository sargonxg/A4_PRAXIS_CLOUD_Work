"""Neo4j DIALECTICA client — direct async Neo4j driver (non-adapter version).

For the adapter pattern (Neo4j OR FalkorDB), see services/graph_adapter.py.
This client is used internally by the pipeline when the user has Neo4j configured.
"""
from __future__ import annotations

import networkx as nx
from neo4j import AsyncGraphDatabase


class DialecticaClient:
    """Async Neo4j client for the DIALECTICA conflict knowledge graph."""

    def __init__(self, uri: str, user: str, password: str) -> None:
        self.driver = AsyncGraphDatabase.driver(uri, auth=(user, password))

    async def ensure_constraints(self) -> None:
        """Create uniqueness constraints for all ACO primitive types."""
        primitives = [
            "Actor", "Claim", "Interest", "Constraint",
            "Leverage", "Commitment", "Event", "Narrative",
        ]
        async with self.driver.session() as session:
            for p in primitives:
                await session.run(
                    f"CREATE CONSTRAINT IF NOT EXISTS FOR (n:{p}) "
                    f"REQUIRE (n.id, n.tenant_id) IS UNIQUE"
                )

    async def push_graph(
        self,
        G: nx.Graph,
        tenant_id: str,
        situation_id: str,
    ) -> dict:
        """Push NetworkX graph to Neo4j with ACO labels and tenant isolation."""
        async with self.driver.session() as session:
            node_count = 0
            for node_id, data in G.nodes(data=True):
                ptype = data.get("primitive_type", "Entity")
                props = {
                    k: v for k, v in data.items()
                    if isinstance(v, (str, int, float, bool)) and not k.startswith("_")
                }
                props["id"] = node_id
                props["tenant_id"] = tenant_id
                props["situation_id"] = situation_id

                await session.run(
                    f"MERGE (n:{ptype} {{id: $id, tenant_id: $tid}}) SET n += $props",
                    {"id": node_id, "tid": tenant_id, "props": props}
                )
                node_count += 1

            edge_count = 0
            for u, v, data in G.edges(data=True):
                relation = data.get("relation", "RELATED_TO").upper().split(",")[0].strip()
                await session.run(
                    f"MATCH (a {{id: $u, tenant_id: $tid}}), (b {{id: $v, tenant_id: $tid}}) "
                    f"MERGE (a)-[r:{relation}]->(b) "
                    f"SET r.weight = $weight, r.situation_id = $sid",
                    {"u": u, "v": v, "tid": tenant_id, "sid": situation_id,
                     "weight": data.get("weight", 1.0)}
                )
                edge_count += 1

        return {"nodes_pushed": node_count, "edges_pushed": edge_count}

    async def query_situation_graph(self, tenant_id: str, situation_id: str) -> dict:
        """Return all nodes and edges for a situation."""
        async with self.driver.session() as session:
            result = await session.run(
                "MATCH (n {tenant_id: $tid, situation_id: $sid}) "
                "OPTIONAL MATCH (n)-[r]->(m {tenant_id: $tid, situation_id: $sid}) "
                "RETURN n, r, m",
                {"tid": tenant_id, "sid": situation_id}
            )
            nodes, edges = {}, []
            async for record in result:
                n = record["n"]
                nodes[n.element_id] = dict(n)
                if record["r"] and record["m"]:
                    m = record["m"]
                    edges.append({
                        "source": n.element_id,
                        "target": m.element_id,
                        "relation": record["r"].type,
                        **dict(record["r"]),
                    })
        return {"nodes": list(nodes.values()), "edges": edges}

    async def actor_profile(self, tenant_id: str, actor_id: str) -> dict:
        """Get full actor profile: actor node + all connected entities."""
        async with self.driver.session() as session:
            result = await session.run(
                "MATCH (a:Actor {id: $aid, tenant_id: $tid}) "
                "OPTIONAL MATCH (a)-[r]-(connected) "
                "RETURN a, collect({rel: type(r), node: connected}) as connections",
                {"aid": actor_id, "tid": tenant_id}
            )
            record = await result.single()
            if not record:
                return {}
            return {
                "actor": dict(record["a"]),
                "connections": record["connections"],
            }

    async def shortest_path(self, tenant_id: str, source_id: str, target_id: str) -> list:
        """Find shortest path between two entities."""
        async with self.driver.session() as session:
            result = await session.run(
                "MATCH (s {id: $src, tenant_id: $tid}), (t {id: $tgt, tenant_id: $tid}), "
                "path = shortestPath((s)-[*]-(t)) RETURN path",
                {"src": source_id, "tgt": target_id, "tid": tenant_id}
            )
            record = await result.single()
            if not record:
                return []
            return [dict(node) for node in record["path"].nodes]

    async def close(self) -> None:
        await self.driver.close()
