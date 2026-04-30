"""Graph database adapter — supports Neo4j, FalkorDB, and Cloud Spanner Graph.

Users choose their graph backend in Settings → Graph Backend.
The backend reads their preference from Firestore and creates the right adapter.
"""
from __future__ import annotations

import json
import os
import re
from abc import ABC, abstractmethod

import networkx as nx


class GraphAdapter(ABC):
    """Abstract graph database adapter."""

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
    """Neo4j graph backend using the async driver."""

    def __init__(self, uri: str, user: str, password: str, database: str = "neo4j") -> None:
        from neo4j import AsyncGraphDatabase
        self.driver = AsyncGraphDatabase.driver(uri, auth=(user, password))
        self.database = database or "neo4j"

    def _session(self):
        return self.driver.session(database=self.database)

    async def ensure_constraints(self) -> None:
        primitives = ["Actor", "Claim", "Interest", "Constraint",
                      "Leverage", "Commitment", "Event", "Narrative"]
        async with self._session() as session:
            for p in primitives:
                await session.run(
                    f"CREATE CONSTRAINT IF NOT EXISTS FOR (n:{p}) "
                    f"REQUIRE (n.id, n.tenant_id) IS UNIQUE"
                )

    async def push_graph(self, G: nx.Graph, tenant_id: str, situation_id: str) -> dict:
        async with self._session() as session:
            node_count = 0
            for node_id, data in G.nodes(data=True):
                ptype = _safe_cypher_identifier(data.get("primitive_type", "Entity"))
                props = {k: v for k, v in data.items()
                         if isinstance(v, (str, int, float, bool)) and not k.startswith("_")}
                props.update({"id": node_id, "tenant_id": tenant_id, "situation_id": situation_id})
                await session.run(
                    f"MERGE (n:{ptype} {{id: $id, tenant_id: $tid}}) SET n += $props",
                    {"id": node_id, "tid": tenant_id, "props": props}
                )
                node_count += 1

            edge_count = 0
            for u, v, data in G.edges(data=True):
                relation = _safe_cypher_identifier(
                    data.get("relation", "RELATED_TO").upper().split(",")[0].strip(),
                    fallback="RELATED_TO",
                )
                await session.run(
                    f"MATCH (a {{id: $u, tenant_id: $tid}}), (b {{id: $v, tenant_id: $tid}}) "
                    f"MERGE (a)-[r:{relation}]->(b) SET r.weight = $w, r.situation_id = $sid",
                    {"u": u, "v": v, "tid": tenant_id, "sid": situation_id,
                     "w": data.get("weight", 1.0)}
                )
                edge_count += 1
        return {"nodes_pushed": node_count, "edges_pushed": edge_count}

    async def query_situation(self, tenant_id: str, situation_id: str) -> dict:
        async with self._session() as session:
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
                    edges.append({"source": n.element_id, "target": m.element_id,
                                  "relation": record["r"].type, **dict(record["r"])})
        return {"nodes": list(nodes.values()), "edges": edges}

    async def actor_profile(self, tenant_id: str, actor_id: str) -> dict:
        async with self._session() as session:
            result = await session.run(
                "MATCH (a:Actor {id: $aid, tenant_id: $tid}) "
                "OPTIONAL MATCH (a)-[r]-(c) RETURN a, collect({rel: type(r), node: c}) as conns",
                {"aid": actor_id, "tid": tenant_id}
            )
            record = await result.single()
            if not record:
                return {}
            return {"actor": dict(record["a"]), "connections": record["conns"]}

    async def shortest_path(self, tenant_id: str, source_id: str, target_id: str) -> list:
        async with self._session() as session:
            result = await session.run(
                "MATCH (s {id: $src, tenant_id: $tid}), (t {id: $tgt, tenant_id: $tid}), "
                "path = shortestPath((s)-[*]-(t)) RETURN path",
                {"src": source_id, "tgt": target_id, "tid": tenant_id}
            )
            record = await result.single()
            return [dict(n) for n in record["path"].nodes] if record else []

    async def close(self) -> None:
        await self.driver.close()


class FalkorDBAdapter(GraphAdapter):
    """FalkorDB graph backend — Redis-compatible, sub-millisecond latency."""

    def __init__(self, host: str = "localhost", port: int = 6379) -> None:
        from falkordb import FalkorDB
        self.db = FalkorDB(host=host, port=port)
        self.graph = self.db.select_graph("praxis")

    async def ensure_constraints(self) -> None:
        primitives = ["Actor", "Claim", "Interest", "Constraint",
                      "Leverage", "Commitment", "Event", "Narrative"]
        for p in primitives:
            try:
                self.graph.query(f"CREATE INDEX FOR (n:{p}) ON (n.id, n.tenant_id)")
            except Exception:
                pass  # Index may already exist

    async def push_graph(self, G: nx.Graph, tenant_id: str, situation_id: str) -> dict:
        node_count = 0
        for node_id, data in G.nodes(data=True):
            ptype = data.get("primitive_type", "Entity")
            props = {k: v for k, v in data.items()
                     if isinstance(v, (str, int, float, bool)) and not k.startswith("_")}
            props.update({"id": node_id, "tenant_id": tenant_id, "situation_id": situation_id})
            self.graph.query(
                f"MERGE (n:{ptype} {{id: $id, tenant_id: $tid}}) SET n += $props",
                {"id": node_id, "tid": tenant_id, "props": props}
            )
            node_count += 1

        edge_count = 0
        for u, v, data in G.edges(data=True):
            relation = data.get("relation", "RELATED_TO").upper().split(",")[0].strip()
            self.graph.query(
                f"MATCH (a {{id: $u, tenant_id: $tid}}), (b {{id: $v, tenant_id: $tid}}) "
                f"MERGE (a)-[:{relation}]->(b)",
                {"u": u, "v": v, "tid": tenant_id}
            )
            edge_count += 1

        return {"nodes_pushed": node_count, "edges_pushed": edge_count}

    async def query_situation(self, tenant_id: str, situation_id: str) -> dict:
        result = self.graph.query(
            "MATCH (n {tenant_id: $tid, situation_id: $sid}) RETURN n",
            {"tid": tenant_id, "sid": situation_id}
        )
        return {"nodes": [dict(r[0].properties) for r in result.result_set], "edges": []}

    async def actor_profile(self, tenant_id: str, actor_id: str) -> dict:
        result = self.graph.query(
            "MATCH (a:Actor {id: $aid, tenant_id: $tid}) RETURN a",
            {"aid": actor_id, "tid": tenant_id}
        )
        if not result.result_set:
            return {}
        return {"actor": dict(result.result_set[0][0].properties), "connections": []}

    async def shortest_path(self, tenant_id: str, source_id: str, target_id: str) -> list:
        return []  # FalkorDB path queries require additional setup

    async def close(self) -> None:
        pass  # FalkorDB client doesn't need explicit close


class SpannerGraphAdapter(GraphAdapter):
    """Cloud Spanner Graph backend — managed, multi-region, ISO GQL.

    Schema must be applied via backend/migrations/001_spanner_graph_schema.sql
    before use. The google-cloud-spanner import is deferred so the package is
    optional when running Neo4j or FalkorDB.
    """

    def __init__(self, project_id: str, instance_id: str, database_id: str) -> None:
        from google.cloud import spanner  # deferred — optional dependency
        self._spanner = spanner
        self.client = spanner.Client(project=project_id)
        self.instance = self.client.instance(instance_id)
        self.database = self.instance.database(database_id)

    async def ensure_constraints(self) -> None:
        # Schema is managed via migrations, not runtime.
        # Verify the property graph exists by running a no-op GQL query.
        with self.database.snapshot() as snap:
            snap.execute_sql(
                "SELECT 1 FROM INFORMATION_SCHEMA.PROPERTY_GRAPHS"
                " WHERE PROPERTY_GRAPH_NAME = 'praxis_graph'"
            ).one()

    async def push_graph(self, G: nx.Graph, tenant_id: str, situation_id: str) -> dict:
        node_count = 0
        edge_count = 0
        with self.database.batch() as batch:
            for node_id, data in G.nodes(data=True):
                ptype = data.get("primitive_type", "Actor")
                table = f"{ptype}s"  # Pluralize: Actor → Actors
                batch.insert_or_update(
                    table=table,
                    columns=("id", "tenant_id", "situation_id", "label", "properties"),
                    values=[(
                        node_id,
                        tenant_id,
                        situation_id,
                        data.get("label", node_id),
                        json.dumps({
                            k: v for k, v in data.items()
                            if k not in ("primitive_type", "label")
                        }),
                    )],
                )
                node_count += 1
            for u, v, data in G.edges(data=True):
                relation = data.get("relation", "RELATED_TO").upper().split(",")[0].strip()
                batch.insert_or_update(
                    table="Edges",
                    columns=(
                        "tenant_id", "situation_id",
                        "source_id", "target_id",
                        "source_type", "target_type",
                        "relation_type", "weight", "properties",
                    ),
                    values=[(
                        tenant_id,
                        situation_id,
                        u,
                        v,
                        G.nodes[u].get("primitive_type", "Actor"),
                        G.nodes[v].get("primitive_type", "Actor"),
                        relation,
                        float(data.get("weight", 1.0)),
                        json.dumps(data),
                    )],
                )
                edge_count += 1
        return {"nodes_pushed": node_count, "edges_pushed": edge_count}

    async def query_situation(self, tenant_id: str, situation_id: str) -> dict:
        spanner = self._spanner
        sql = """
          GRAPH praxis_graph
          MATCH (n) WHERE n.tenant_id = @tid AND n.situation_id = @sid
          OPTIONAL MATCH (n)-[r]->(m) WHERE m.tenant_id = @tid AND m.situation_id = @sid
          RETURN n.id AS source_id, n.label AS source_label,
                 r.relation_type AS rel,
                 m.id AS target_id, m.label AS target_label
        """
        with self.database.snapshot() as snap:
            results = snap.execute_sql(
                sql,
                params={"tid": tenant_id, "sid": situation_id},
                param_types={
                    "tid": spanner.param_types.STRING,
                    "sid": spanner.param_types.STRING,
                },
            )
            nodes: dict = {}
            edges: list = []
            for row in results:
                nodes[row[0]] = {"id": row[0], "label": row[1]}
                if row[2]:
                    edges.append({"source": row[0], "target": row[3], "relation": row[2]})
                    nodes[row[3]] = {"id": row[3], "label": row[4]}
        return {"nodes": list(nodes.values()), "edges": edges}

    async def actor_profile(self, tenant_id: str, actor_id: str) -> dict:
        spanner = self._spanner
        sql = """
          GRAPH praxis_graph
          MATCH (a:Actor)-[r]-(c) WHERE a.tenant_id = @tid AND a.id = @aid
          RETURN a, r.relation_type AS rel, c
        """
        with self.database.snapshot() as snap:
            results = list(snap.execute_sql(
                sql,
                params={"tid": tenant_id, "aid": actor_id},
                param_types={
                    "tid": spanner.param_types.STRING,
                    "aid": spanner.param_types.STRING,
                },
            ))
        if not results:
            return {}
        actor_data = dict(results[0][0])
        connections = [{"rel": r[1], "node": dict(r[2])} for r in results]
        return {"actor": actor_data, "connections": connections}

    async def shortest_path(self, tenant_id: str, source_id: str, target_id: str) -> list:
        spanner = self._spanner
        sql = """
          GRAPH praxis_graph
          MATCH path = ANY SHORTEST (s)-[*]->(t)
          WHERE s.tenant_id = @tid AND s.id = @src AND t.id = @tgt
          RETURN nodes(path) AS path_nodes
        """
        with self.database.snapshot() as snap:
            results = list(snap.execute_sql(
                sql,
                params={"tid": tenant_id, "src": source_id, "tgt": target_id},
                param_types={
                    "tid": spanner.param_types.STRING,
                    "src": spanner.param_types.STRING,
                    "tgt": spanner.param_types.STRING,
                },
            ))
        if not results:
            return []
        return [dict(n) for n in results[0][0]]

    async def close(self) -> None:
        pass  # Spanner client manages its own connection pool


def create_graph_adapter(provider: str, **kwargs) -> GraphAdapter:
    """Factory: create the right adapter based on user preference."""
    if provider == "spanner":
        return SpannerGraphAdapter(
            project_id=kwargs.get("project_id") or os.environ.get("GCP_PROJECT_ID", "praxisbytacitus"),
            instance_id=kwargs.get("instance_id", "praxis-graph"),
            database_id=kwargs.get("database_id", "praxis-graph-db"),
        )
    if provider == "falkordb":
        return FalkorDBAdapter(
            host=kwargs.get("host", "localhost"),
            port=int(kwargs.get("port", 6379)),
        )
    # Default: Neo4j
    return Neo4jAdapter(
        uri=kwargs.get("uri", ""),
        user=kwargs.get("user") or kwargs.get("username") or "neo4j",
        password=kwargs.get("password", ""),
        database=kwargs.get("database", "neo4j"),
    )


def create_adapter_from_settings(user_settings: dict) -> GraphAdapter | None:
    """Create a graph adapter from the user's Firestore settings."""
    backend_config = user_settings.get("graph_backend", {})
    if not backend_config:
        # Fall back to platform settings
        from config import get_settings
        s = get_settings()
        if s.neo4j_uri:
            return Neo4jAdapter(s.neo4j_uri, s.neo4j_user, s.neo4j_password, s.neo4j_database)
        return None

    provider = backend_config.get("provider", "neo4j")
    return create_graph_adapter(provider, **backend_config)


def _safe_cypher_identifier(value: object, fallback: str = "Entity") -> str:
    sanitized = re.sub(r"[^A-Za-z0-9_]", "_", str(value or fallback))
    if re.match(r"^[A-Za-z_][A-Za-z0-9_]*$", sanitized):
        return sanitized
    return fallback
