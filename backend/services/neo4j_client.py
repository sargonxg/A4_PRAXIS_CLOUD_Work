"""Neo4j DIALECTICA client — direct async Neo4j driver (non-adapter version).

For the adapter pattern (Neo4j OR FalkorDB), see services/graph_adapter.py.
This client is used internally by the pipeline when the user has Neo4j configured.
"""
from __future__ import annotations

import networkx as nx
from neo4j import AsyncGraphDatabase


class Neo4jClient:
    """Tenant-scoped Neo4j Aura client used by Phase 1 sync and Phase 2 reads."""

    def __init__(self, uri: str | None = None, user: str | None = None, password: str | None = None, database: str = "neo4j") -> None:
        from config import get_settings

        settings = get_settings()
        self.database = database or settings.neo4j_database
        self.driver = AsyncGraphDatabase.driver(
            uri or settings.neo4j_uri,
            auth=(user or settings.neo4j_user, password or settings.neo4j_password),
        )

    async def merge_node(self, label: str, props: dict, tenant_id: str) -> None:
        safe_label = _safe_label(label)
        payload = _with_bitemporal({**props, "tenantId": tenant_id, "tenant_id": tenant_id})
        async with self.driver.session(database=self.database) as session:
            await session.run(
                f"MERGE (n:{safe_label} {{id: $id, tenantId: $tenantId}}) SET n += $props",
                {"id": payload["id"], "tenantId": tenant_id, "props": payload},
            )

    async def merge_edge(self, from_id: str, to_id: str, relation_type: str, props: dict, tenant_id: str) -> None:
        safe_type = _safe_label(relation_type.upper(), fallback="RELATED_TO")
        payload = _with_bitemporal({**props, "tenantId": tenant_id, "tenant_id": tenant_id})
        async with self.driver.session(database=self.database) as session:
            await session.run(
                f"MATCH (a {{id: $fromId, tenantId: $tenantId}}), (b {{id: $toId, tenantId: $tenantId}}) "
                f"MERGE (a)-[r:{safe_type}]->(b) SET r += $props",
                {"fromId": from_id, "toId": to_id, "tenantId": tenant_id, "props": payload},
            )

    async def query(self, cypher: str, params: dict | None, tenant_id: str) -> list[dict]:
        if not _is_read_only_cypher(cypher):
            raise ValueError("Only read-only tenant-scoped Cypher is allowed")
        scoped = (
            "MATCH (n) WHERE n.tenantId = $tenantId "
            "WITH n "
            + cypher
        ) if "tenantId" not in cypher else cypher
        async with self.driver.session(database=self.database, default_access_mode="READ") as session:
            result = await session.run(scoped, {**(params or {}), "tenantId": tenant_id})
            return [dict(record) async for record in result]

    async def close(self) -> None:
        await self.driver.close()


def _with_bitemporal(props: dict) -> dict:
    created = props.get("createdAt") or props.get("created_at")
    return {
        **props,
        "assertedFrom": props.get("assertedFrom") or created,
        "assertedTo": props.get("assertedTo"),
        "validFrom": props.get("validFrom"),
        "validTo": props.get("validTo"),
    }


def _safe_label(value: str | None, fallback: str = "Entity") -> str:
    raw = (value or fallback).strip().replace("-", "_")
    if not raw or raw[0].isdigit() or not raw.replace("_", "").isalnum():
        return fallback
    return raw


def _is_read_only_cypher(cypher: str) -> bool:
    forbidden = {"DELETE", "CREATE", "MERGE", "SET", "REMOVE", "DETACH", "DROP", "CALL"}
    tokens = {token.upper() for token in cypher.replace("(", " ").replace(")", " ").split()}
    return not (tokens & forbidden)


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
