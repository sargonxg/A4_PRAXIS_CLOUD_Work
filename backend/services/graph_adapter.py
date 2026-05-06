"""Graph adapter factory.

Phase 1 standardizes the graph index on Neo4j Aura. Firestore remains the
canonical store; this adapter is only for the read/query graph index.
"""
from __future__ import annotations

from abc import ABC, abstractmethod

import networkx as nx


class GraphAdapter(ABC):
    @abstractmethod
    async def ensure_constraints(self) -> None: ...

    @abstractmethod
    async def push_graph(self, G: nx.Graph, tenant_id: str, situation_id: str) -> dict: ...

    @abstractmethod
    async def query_situation(self, tenant_id: str, situation_id: str) -> dict: ...

    @abstractmethod
    async def actor_profile(self, tenant_id: str, actor_id: str) -> dict: ...

    @abstractmethod
    async def shortest_path(self, tenant_id: str, source_id: str, target_id: str) -> list: ...

    @abstractmethod
    async def close(self) -> None: ...


class Neo4jAdapter(GraphAdapter):
    def __init__(self, uri: str, user: str, password: str, database: str = "neo4j") -> None:
        from neo4j import AsyncGraphDatabase

        self.driver = AsyncGraphDatabase.driver(uri, auth=(user, password))
        self.database = database or "neo4j"

    def _session(self):
        return self.driver.session(database=self.database)

    async def ensure_constraints(self) -> None:
        labels = [
            "Actor", "Claim", "Interest", "Constraint",
            "Leverage", "Commitment", "Event", "Narrative",
        ]
        async with self._session() as session:
            for label in labels:
                await session.run(
                    f"CREATE CONSTRAINT {label.lower()}_id IF NOT EXISTS "
                    f"FOR (n:{label}) REQUIRE n.id IS UNIQUE"
                )
                await session.run(f"CREATE INDEX {label.lower()}_tenant IF NOT EXISTS FOR (n:{label}) ON (n.tenantId)")

    async def push_graph(self, G: nx.Graph, tenant_id: str, situation_id: str) -> dict:
        async with self._session() as session:
            node_count = 0
            for node_id, data in G.nodes(data=True):
                label = _safe_cypher_identifier(data.get("primitive_type", "Entity"))
                props = {
                    key: value
                    for key, value in data.items()
                    if isinstance(value, (str, int, float, bool)) and not key.startswith("_")
                }
                props.update({
                    "id": node_id,
                    "tenantId": tenant_id,
                    "tenant_id": tenant_id,
                    "situationId": situation_id,
                    "situation_id": situation_id,
                    "assertedFrom": props.get("assertedFrom") or props.get("createdAt"),
                    "assertedTo": props.get("assertedTo"),
                    "validFrom": props.get("validFrom"),
                    "validTo": props.get("validTo"),
                })
                await session.run(
                    f"MERGE (n:{label} {{id: $id, tenantId: $tenantId}}) SET n += $props",
                    {"id": node_id, "tenantId": tenant_id, "props": props},
                )
                node_count += 1

            edge_count = 0
            for source, target, data in G.edges(data=True):
                relation = _safe_cypher_identifier(
                    data.get("relation", "RELATED_TO").upper().split(",")[0].strip(),
                    fallback="RELATED_TO",
                )
                props = {
                    key: value
                    for key, value in data.items()
                    if isinstance(value, (str, int, float, bool)) and not key.startswith("_")
                }
                props.update({
                    "tenantId": tenant_id,
                    "tenant_id": tenant_id,
                    "situationId": situation_id,
                    "situation_id": situation_id,
                    "assertedFrom": props.get("assertedFrom") or props.get("createdAt"),
                    "assertedTo": props.get("assertedTo"),
                    "validFrom": props.get("validFrom"),
                    "validTo": props.get("validTo"),
                })
                await session.run(
                    f"MATCH (a {{id: $source, tenantId: $tenantId}}), (b {{id: $target, tenantId: $tenantId}}) "
                    f"MERGE (a)-[r:{relation}]->(b) SET r += $props",
                    {"source": source, "target": target, "tenantId": tenant_id, "props": props},
                )
                edge_count += 1
        return {"nodes_pushed": node_count, "edges_pushed": edge_count}

    async def query_situation(self, tenant_id: str, situation_id: str) -> dict:
        async with self._session() as session:
            result = await session.run(
                "MATCH (n {tenantId: $tenantId, situationId: $situationId}) "
                "OPTIONAL MATCH (n)-[r]->(m {tenantId: $tenantId, situationId: $situationId}) "
                "RETURN n, r, m",
                {"tenantId": tenant_id, "situationId": situation_id},
            )
            nodes, edges = {}, []
            async for record in result:
                n = record["n"]
                nodes[n.element_id] = dict(n)
                if record["r"] and record["m"]:
                    m = record["m"]
                    edges.append({"source": n.element_id, "target": m.element_id, "relation": record["r"].type, **dict(record["r"])})
        return {"nodes": list(nodes.values()), "edges": edges}

    async def actor_profile(self, tenant_id: str, actor_id: str) -> dict:
        async with self._session() as session:
            result = await session.run(
                "MATCH (a:Actor {id: $actorId, tenantId: $tenantId}) "
                "OPTIONAL MATCH (a)-[r]-(connected {tenantId: $tenantId}) "
                "RETURN a, collect({rel: type(r), node: connected}) AS connections",
                {"actorId": actor_id, "tenantId": tenant_id},
            )
            record = await result.single()
            if not record:
                return {}
            return {"actor": dict(record["a"]), "connections": record["connections"]}

    async def shortest_path(self, tenant_id: str, source_id: str, target_id: str) -> list:
        async with self._session() as session:
            result = await session.run(
                "MATCH (s {id: $sourceId, tenantId: $tenantId}), (t {id: $targetId, tenantId: $tenantId}), "
                "path = shortestPath((s)-[*]-(t)) RETURN path",
                {"sourceId": source_id, "targetId": target_id, "tenantId": tenant_id},
            )
            record = await result.single()
            return [dict(node) for node in record["path"].nodes] if record else []

    async def close(self) -> None:
        await self.driver.close()


def _safe_cypher_identifier(value: str | None, fallback: str = "Entity") -> str:
    raw = (value or fallback).strip()
    if not raw.replace("_", "").isalnum() or raw[0].isdigit():
        return fallback
    return raw


def create_graph_adapter(provider: str = "neo4j", **kwargs) -> GraphAdapter:
    if provider.lower() != "neo4j":
        raise ValueError("Neo4j Aura is the only supported graph index")
    return Neo4jAdapter(
        uri=kwargs.get("uri") or kwargs.get("neo4j_uri") or "",
        user=kwargs.get("user") or kwargs.get("neo4j_user") or "neo4j",
        password=kwargs.get("password") or kwargs.get("neo4j_password") or "",
        database=kwargs.get("database") or kwargs.get("neo4j_database") or "neo4j",
    )
