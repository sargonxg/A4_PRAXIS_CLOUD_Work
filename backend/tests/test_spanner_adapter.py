"""Tests for SpannerGraphAdapter — uses mocked google-cloud-spanner."""
from __future__ import annotations

import json
import sys
import types
from unittest.mock import MagicMock, patch, call

import networkx as nx
import pytest


# ---------------------------------------------------------------------------
# Helpers: build a minimal mock of the google.cloud.spanner package so the
# adapter can be imported without the real library installed.
# ---------------------------------------------------------------------------

def _make_spanner_mock():
    """Return a MagicMock that stands in for google.cloud.spanner."""
    spanner_mod = MagicMock()

    # param_types constants used in execute_sql calls
    spanner_mod.param_types.STRING = "STRING"

    # Client → instance → database chain
    db_mock = MagicMock()
    instance_mock = MagicMock()
    instance_mock.database.return_value = db_mock
    client_mock = MagicMock()
    client_mock.instance.return_value = instance_mock
    spanner_mod.Client.return_value = client_mock

    return spanner_mod, db_mock


def _inject_spanner_mock(spanner_mock):
    """Inject google.cloud.spanner into sys.modules so the deferred import resolves."""
    google_mod = sys.modules.get("google", types.ModuleType("google"))
    cloud_mod = sys.modules.get("google.cloud", types.ModuleType("google.cloud"))
    google_mod.cloud = cloud_mod  # type: ignore[attr-defined]
    cloud_mod.spanner = spanner_mock  # type: ignore[attr-defined]
    sys.modules.setdefault("google", google_mod)
    sys.modules["google.cloud"] = cloud_mod
    sys.modules["google.cloud.spanner"] = spanner_mock


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture()
def spanner_mock_and_db():
    spanner_mock, db_mock = _make_spanner_mock()
    _inject_spanner_mock(spanner_mock)
    yield spanner_mock, db_mock
    # Cleanup injected mocks so they don't leak into other tests
    for key in ("google.cloud.spanner",):
        sys.modules.pop(key, None)


@pytest.fixture()
def adapter(spanner_mock_and_db):
    """Return a SpannerGraphAdapter backed by mocked Spanner."""
    from services.graph_adapter import SpannerGraphAdapter
    return SpannerGraphAdapter(
        project_id="test-project",
        instance_id="test-instance",
        database_id="test-db",
    )


@pytest.fixture()
def simple_graph():
    """A minimal NetworkX graph with two Actors and one edge."""
    G = nx.DiGraph()
    G.add_node("actor_a", primitive_type="Actor", label="Actor A")
    G.add_node("actor_b", primitive_type="Actor", label="Actor B")
    G.add_edge("actor_a", "actor_b", relation="opposes", weight=0.8)
    return G


# ---------------------------------------------------------------------------
# Construction tests
# ---------------------------------------------------------------------------

class TestSpannerGraphAdapterInit:
    def test_client_created_with_project(self, spanner_mock_and_db):
        spanner_mock, _ = spanner_mock_and_db
        from services.graph_adapter import SpannerGraphAdapter

        SpannerGraphAdapter("my-project", "my-instance", "my-db")
        spanner_mock.Client.assert_called_once_with(project="my-project")

    def test_instance_and_database_resolved(self, spanner_mock_and_db):
        spanner_mock, _ = spanner_mock_and_db
        from services.graph_adapter import SpannerGraphAdapter

        adapter = SpannerGraphAdapter("proj", "inst", "dbid")
        adapter.instance  # access attribute
        adapter.database  # access attribute
        spanner_mock.Client.return_value.instance.assert_called_once_with("inst")
        spanner_mock.Client.return_value.instance.return_value.database.assert_called_once_with("dbid")


# ---------------------------------------------------------------------------
# ensure_constraints
# ---------------------------------------------------------------------------

class TestEnsureConstraints:
    @pytest.mark.asyncio
    async def test_runs_property_graph_check(self, adapter, spanner_mock_and_db):
        _, db_mock = spanner_mock_and_db
        snap_mock = MagicMock()
        db_mock.snapshot.return_value.__enter__ = MagicMock(return_value=snap_mock)
        db_mock.snapshot.return_value.__exit__ = MagicMock(return_value=False)

        await adapter.ensure_constraints()

        sql_call = snap_mock.execute_sql.call_args[0][0]
        assert "praxis_graph" in sql_call
        assert "PROPERTY_GRAPHS" in sql_call


# ---------------------------------------------------------------------------
# push_graph
# ---------------------------------------------------------------------------

class TestPushGraph:
    @pytest.mark.asyncio
    async def test_returns_node_and_edge_counts(self, adapter, simple_graph, spanner_mock_and_db):
        _, db_mock = spanner_mock_and_db
        batch_mock = MagicMock()
        db_mock.batch.return_value.__enter__ = MagicMock(return_value=batch_mock)
        db_mock.batch.return_value.__exit__ = MagicMock(return_value=False)

        result = await adapter.push_graph(simple_graph, "tenant1", "sit1")

        assert result["nodes_pushed"] == 2
        assert result["edges_pushed"] == 1

    @pytest.mark.asyncio
    async def test_nodes_written_to_correct_tables(self, adapter, simple_graph, spanner_mock_and_db):
        _, db_mock = spanner_mock_and_db
        batch_mock = MagicMock()
        db_mock.batch.return_value.__enter__ = MagicMock(return_value=batch_mock)
        db_mock.batch.return_value.__exit__ = MagicMock(return_value=False)

        await adapter.push_graph(simple_graph, "t1", "s1")

        tables_written = [c.kwargs["table"] for c in batch_mock.insert_or_update.call_args_list]
        # Both Actor nodes → "Actors" table
        assert tables_written.count("Actors") == 2
        # One edge → "Edges" table
        assert "Edges" in tables_written

    @pytest.mark.asyncio
    async def test_edge_relation_normalized_to_uppercase(self, adapter, spanner_mock_and_db):
        _, db_mock = spanner_mock_and_db
        batch_mock = MagicMock()
        db_mock.batch.return_value.__enter__ = MagicMock(return_value=batch_mock)
        db_mock.batch.return_value.__exit__ = MagicMock(return_value=False)

        G = nx.DiGraph()
        G.add_node("a", primitive_type="Actor", label="A")
        G.add_node("b", primitive_type="Actor", label="B")
        G.add_edge("a", "b", relation="allied_with")

        await adapter.push_graph(G, "t", "s")

        edge_calls = [c for c in batch_mock.insert_or_update.call_args_list
                      if c.kwargs["table"] == "Edges"]
        assert len(edge_calls) == 1
        values = edge_calls[0].kwargs["values"][0]
        # relation_type is index 6 in the columns tuple
        assert values[6] == "ALLIED_WITH"

    @pytest.mark.asyncio
    async def test_empty_graph_returns_zeros(self, adapter, spanner_mock_and_db):
        _, db_mock = spanner_mock_and_db
        batch_mock = MagicMock()
        db_mock.batch.return_value.__enter__ = MagicMock(return_value=batch_mock)
        db_mock.batch.return_value.__exit__ = MagicMock(return_value=False)

        result = await adapter.push_graph(nx.DiGraph(), "t", "s")

        assert result == {"nodes_pushed": 0, "edges_pushed": 0}


# ---------------------------------------------------------------------------
# query_situation
# ---------------------------------------------------------------------------

class TestQuerySituation:
    @pytest.mark.asyncio
    async def test_returns_nodes_and_edges(self, adapter, spanner_mock_and_db):
        _, db_mock = spanner_mock_and_db
        snap_mock = MagicMock()
        db_mock.snapshot.return_value.__enter__ = MagicMock(return_value=snap_mock)
        db_mock.snapshot.return_value.__exit__ = MagicMock(return_value=False)

        # Two rows: one node-only row and one with an edge
        snap_mock.execute_sql.return_value = [
            ("n1", "Node One", None, None, None),
            ("n2", "Node Two", "opposes", "n3", "Node Three"),
        ]

        result = await adapter.query_situation("tenant1", "sit1")

        assert len(result["nodes"]) == 3
        assert len(result["edges"]) == 1
        assert result["edges"][0] == {"source": "n2", "target": "n3", "relation": "opposes"}

    @pytest.mark.asyncio
    async def test_empty_result_returns_empty_collections(self, adapter, spanner_mock_and_db):
        _, db_mock = spanner_mock_and_db
        snap_mock = MagicMock()
        db_mock.snapshot.return_value.__enter__ = MagicMock(return_value=snap_mock)
        db_mock.snapshot.return_value.__exit__ = MagicMock(return_value=False)
        snap_mock.execute_sql.return_value = []

        result = await adapter.query_situation("t", "s")

        assert result == {"nodes": [], "edges": []}


# ---------------------------------------------------------------------------
# actor_profile
# ---------------------------------------------------------------------------

class TestActorProfile:
    @pytest.mark.asyncio
    async def test_returns_actor_and_connections(self, adapter, spanner_mock_and_db):
        _, db_mock = spanner_mock_and_db
        snap_mock = MagicMock()
        db_mock.snapshot.return_value.__enter__ = MagicMock(return_value=snap_mock)
        db_mock.snapshot.return_value.__exit__ = MagicMock(return_value=False)

        actor_data = {"id": "actor_a", "label": "Actor A"}
        connected_node = {"id": "actor_b", "label": "Actor B"}
        snap_mock.execute_sql.return_value = [
            (actor_data, "opposes", connected_node),
        ]

        result = await adapter.actor_profile("tenant1", "actor_a")

        assert result["actor"] == actor_data
        assert len(result["connections"]) == 1
        assert result["connections"][0]["rel"] == "opposes"

    @pytest.mark.asyncio
    async def test_returns_empty_dict_when_not_found(self, adapter, spanner_mock_and_db):
        _, db_mock = spanner_mock_and_db
        snap_mock = MagicMock()
        db_mock.snapshot.return_value.__enter__ = MagicMock(return_value=snap_mock)
        db_mock.snapshot.return_value.__exit__ = MagicMock(return_value=False)
        snap_mock.execute_sql.return_value = []

        result = await adapter.actor_profile("t", "unknown")

        assert result == {}


# ---------------------------------------------------------------------------
# shortest_path
# ---------------------------------------------------------------------------

class TestShortestPath:
    @pytest.mark.asyncio
    async def test_returns_path_nodes(self, adapter, spanner_mock_and_db):
        _, db_mock = spanner_mock_and_db
        snap_mock = MagicMock()
        db_mock.snapshot.return_value.__enter__ = MagicMock(return_value=snap_mock)
        db_mock.snapshot.return_value.__exit__ = MagicMock(return_value=False)

        path_nodes = [{"id": "a"}, {"id": "b"}, {"id": "c"}]
        snap_mock.execute_sql.return_value = [(path_nodes,)]

        result = await adapter.shortest_path("t", "a", "c")

        assert result == [{"id": "a"}, {"id": "b"}, {"id": "c"}]

    @pytest.mark.asyncio
    async def test_returns_empty_list_when_no_path(self, adapter, spanner_mock_and_db):
        _, db_mock = spanner_mock_and_db
        snap_mock = MagicMock()
        db_mock.snapshot.return_value.__enter__ = MagicMock(return_value=snap_mock)
        db_mock.snapshot.return_value.__exit__ = MagicMock(return_value=False)
        snap_mock.execute_sql.return_value = []

        result = await adapter.shortest_path("t", "a", "z")

        assert result == []


# ---------------------------------------------------------------------------
# close
# ---------------------------------------------------------------------------

class TestClose:
    @pytest.mark.asyncio
    async def test_close_is_a_no_op(self, adapter):
        # Should complete without raising
        await adapter.close()


# ---------------------------------------------------------------------------
# Factory
# ---------------------------------------------------------------------------

class TestCreateGraphAdapterFactory:
    def test_spanner_provider_returns_spanner_adapter(self, spanner_mock_and_db):
        from services.graph_adapter import create_graph_adapter, SpannerGraphAdapter

        adapter = create_graph_adapter(
            "spanner",
            project_id="proj",
            instance_id="inst",
            database_id="dbid",
        )
        assert isinstance(adapter, SpannerGraphAdapter)

    def test_spanner_defaults_from_env(self, monkeypatch, spanner_mock_and_db):
        monkeypatch.setenv("GCP_PROJECT_ID", "env-project")
        from services.graph_adapter import create_graph_adapter, SpannerGraphAdapter

        adapter = create_graph_adapter("spanner")
        assert isinstance(adapter, SpannerGraphAdapter)

    def test_falkordb_provider_unaffected(self):
        """Ensure existing FalkorDB factory path still works (no Spanner import)."""
        falkor_mock = MagicMock()
        falkor_mod = types.ModuleType("falkordb")
        falkor_mod.FalkorDB = falkor_mock
        sys.modules["falkordb"] = falkor_mod

        from services.graph_adapter import create_graph_adapter, FalkorDBAdapter
        adapter = create_graph_adapter("falkordb", host="localhost", port=6379)
        assert isinstance(adapter, FalkorDBAdapter)

        sys.modules.pop("falkordb", None)
