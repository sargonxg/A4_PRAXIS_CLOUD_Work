"""Graph router — /api/v1/graph/*

Read endpoints for graph data (usually from Firestore for speed,
Neo4j for complex graph queries).
"""
from __future__ import annotations

import io
import json
import json as json_lib
from datetime import datetime, timezone

import networkx as nx
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import HTMLResponse, Response, StreamingResponse
from networkx.readwrite import json_graph
from pydantic import BaseModel

from auth import verify_firebase_token
from graphify_tacitus.build import build_from_json
from graphify_tacitus.cypher_export import to_cypher as _to_cypher
from graphify_tacitus.export import to_html
from services.firestore_sync import FirestoreSync
from services.graph_adapter import create_graph_adapter

router = APIRouter()


class GraphBackendConfig(BaseModel):
    provider: str = "neo4j"
    uri: str = ""
    host: str = "localhost"
    port: str = "6379"
    user: str = "neo4j"
    password: str = ""


@router.post("/test-connection")
async def test_connection(config: GraphBackendConfig):
    """Test graph backend connection without auth (used from Settings UI)."""
    try:
        adapter = create_graph_adapter(
            provider=config.provider,
            uri=config.uri,
            host=config.host,
            port=int(config.port) if config.port else 6379,
            user=config.user,
            password=config.password,
        )
        await adapter.ensure_constraints()
        await adapter.close()
        return {"ok": True, "message": f"Connected to {config.provider} successfully."}
    except Exception as exc:
        return {"ok": False, "message": str(exc)}


@router.get("/{situation_id}")
async def get_graph(
    situation_id: str,
    token: dict = Depends(verify_firebase_token),
):
    """Return the full graph snapshot from Firestore (faster than Neo4j for UI reads)."""
    uid = token["uid"]
    fs = FirestoreSync()
    snapshot = await fs.read_graph_snapshot(uid, situation_id)
    analysis = await fs.read_analysis(uid, situation_id)
    return {"nodes": snapshot.get("nodes", []), "edges": snapshot.get("edges", []), "analysis": analysis}


class GraphQueryRequest(BaseModel):
    question: str
    mode: str = "bfs"
    depth: int = 3
    token_budget: int = 2000


@router.post("/{situation_id}/query")
async def query_graph(
    situation_id: str,
    req: GraphQueryRequest,
    token: dict = Depends(verify_firebase_token),
):
    """Keyword-based BFS/DFS traversal of the graph to answer a question."""
    uid = token["uid"]
    fs = FirestoreSync()
    snapshot = await fs.read_graph_snapshot(uid, situation_id)

    if not snapshot.get("nodes"):
        raise HTTPException(status_code=404, detail="No graph data for this situation")

    G = build_from_json(snapshot)
    keywords = req.question.lower().split()

    # Score nodes by keyword match
    scores: dict[str, float] = {}
    for node_id, data in G.nodes(data=True):
        label = data.get("label", "").lower()
        score = sum(1 for kw in keywords if kw in label)
        if score > 0:
            scores[node_id] = score

    if not scores:
        return {"results": [], "message": "No matching entities found"}

    # BFS from top-scoring nodes
    start_nodes = sorted(scores.keys(), key=lambda n: scores[n], reverse=True)[:3]
    visited: set = set()
    results = []
    queue = [(n, 0) for n in start_nodes]

    while queue and len(results) < req.token_budget // 50:
        node_id, depth = queue.pop(0)
        if node_id in visited or depth > req.depth:
            continue
        visited.add(node_id)
        data = dict(G.nodes[node_id])
        results.append({"id": node_id, "depth": depth, **data})

        if req.mode == "bfs":
            for nb in G.neighbors(node_id):
                if nb not in visited:
                    queue.append((nb, depth + 1))

    return {"results": results, "query": req.question, "start_nodes": start_nodes}


@router.get("/{situation_id}/actor/{actor_id}")
async def get_actor_profile(
    situation_id: str,
    actor_id: str,
    token: dict = Depends(verify_firebase_token),
):
    """Return actor profile with all connected entities from the graph."""
    uid = token["uid"]
    fs = FirestoreSync()
    snapshot = await fs.read_graph_snapshot(uid, situation_id)
    G = build_from_json(snapshot)

    if not G.has_node(actor_id):
        raise HTTPException(status_code=404, detail=f"Actor '{actor_id}' not found in graph")

    actor_data = dict(G.nodes[actor_id])
    connections = [
        {
            "id": nb,
            "label": G.nodes[nb].get("label", nb),
            "primitive_type": G.nodes[nb].get("primitive_type"),
            "relation": G[actor_id][nb].get("relation", "related"),
            "weight": G[actor_id][nb].get("weight", 1.0),
        }
        for nb in G.neighbors(actor_id)
    ]

    return {"actor": actor_data, "connections": connections}


@router.get("/{situation_id}/path")
async def get_path(
    situation_id: str,
    source: str = Query(...),
    target: str = Query(...),
    token: dict = Depends(verify_firebase_token),
):
    """Find shortest path between two entities.

    Uses the user's configured graph adapter if available; falls back to NetworkX.
    """
    uid = token["uid"]
    fs = FirestoreSync()

    # Try graph adapter (Neo4j shortest path is more accurate for large graphs)
    user_settings = await fs.read_user_settings(uid)
    from services.graph_adapter import create_adapter_from_settings
    adapter = create_adapter_from_settings(user_settings)
    if adapter is not None:
        try:
            path_nodes = await adapter.shortest_path(uid, source, target)
            await adapter.close()
            if path_nodes:
                return {"path": path_nodes, "length": len(path_nodes) - 1}
        except Exception:
            pass
        finally:
            try:
                await adapter.close()
            except Exception:
                pass

    # Fallback: NetworkX in-memory path
    snapshot = await fs.read_graph_snapshot(uid, situation_id)
    G = build_from_json(snapshot)

    if not G.has_node(source) or not G.has_node(target):
        raise HTTPException(status_code=404, detail="One or both nodes not found")

    try:
        import networkx as nx
        path = nx.shortest_path(G, source, target)
        return {
            "path": [{"id": n, **dict(G.nodes[n])} for n in path],
            "length": len(path) - 1,
        }
    except Exception:
        return {"path": [], "length": -1, "message": "No path found"}


@router.get("/{situation_id}/visualization", response_class=HTMLResponse)
async def get_visualization(
    situation_id: str,
    token: dict = Depends(verify_firebase_token),
):
    """Generate and return interactive HTML graph visualization."""
    uid = token["uid"]
    fs = FirestoreSync()
    snapshot = await fs.read_graph_snapshot(uid, situation_id)
    analysis = await fs.read_analysis(uid, situation_id)

    if not snapshot.get("nodes"):
        return HTMLResponse("<h1 style='font-family:sans-serif'>No graph data yet. Run the pipeline first.</h1>")

    G = build_from_json(snapshot)

    communities: dict[str, int] = {}
    for node_id, data in G.nodes(data=True):
        c = data.get("community")
        if c is not None:
            communities[node_id] = int(c)

    community_labels = {cid: f"Faction {cid}" for cid in set(communities.values())}
    factions = analysis.get("factionMap", {})
    for cid_str, faction in factions.items():
        try:
            community_labels[int(cid_str)] = faction.get("name", f"Faction {cid_str}")
        except ValueError:
            pass

    html = to_html(G, communities, community_labels, analysis)
    return HTMLResponse(html)


# ── Graph export ──────────────────────────────────────────────────────────────

@router.get("/{situation_id}/export")
async def export_graph(
    situation_id: str,
    format: str = Query(default="graphml", regex="^(graphml|gexf|cypher|json)$"),
    token: dict = Depends(verify_firebase_token),
):
    """Export the situation graph in the requested format. Reads from Firestore.

    Supported formats:
    - graphml  — NetworkX GraphML (importable into Gephi, yEd, etc.)
    - gexf     — Graph Exchange XML Format (Gephi native)
    - json     — node-link JSON (D3 / NetworkX compatible)
    - cypher   — idempotent MERGE script for Neo4j import
    """
    uid = token["uid"]
    fs = FirestoreSync()
    snapshot = await fs.read_graph_snapshot(uid, situation_id)

    G: nx.DiGraph = nx.DiGraph()
    for node in snapshot.get("nodes", []):
        nid = node.get("id", "")
        if not nid:
            continue
        G.add_node(nid, **{k: v for k, v in node.items() if k != "id"})
    for edge in snapshot.get("edges", []):
        src = edge.get("source", "")
        tgt = edge.get("target", "")
        if not src or not tgt:
            continue
        G.add_edge(src, tgt, **{k: v for k, v in edge.items() if k not in ("source", "target")})

    if not G.nodes:
        raise HTTPException(status_code=404, detail="No graph data for this situation")

    if format == "graphml":
        buf = io.BytesIO()
        nx.write_graphml(G, buf)
        buf.seek(0)
        return StreamingResponse(
            buf,
            media_type="application/xml",
            headers={"Content-Disposition": f'attachment; filename="{situation_id}.graphml"'},
        )

    if format == "gexf":
        buf = io.BytesIO()
        nx.write_gexf(G, buf)
        buf.seek(0)
        return StreamingResponse(
            buf,
            media_type="application/xml",
            headers={"Content-Disposition": f'attachment; filename="{situation_id}.gexf"'},
        )

    if format == "json":
        data = json_graph.node_link_data(G)
        return Response(
            content=json_lib.dumps(data, indent=2),
            media_type="application/json",
            headers={"Content-Disposition": f'attachment; filename="{situation_id}.json"'},
        )

    # format == "cypher"
    cypher = _to_cypher(G, tenant_id=uid, situation_id=situation_id)
    return Response(
        content=cypher,
        media_type="text/plain",
        headers={"Content-Disposition": f'attachment; filename="{situation_id}.cypher"'},
    )


# ── Temporal / Graphiti endpoints ─────────────────────────────────────────────

class TemporalSearchRequest(BaseModel):
    query: str
    num_results: int = 10
    valid_at: str | None = None  # ISO datetime string


@router.post("/{situation_id}/temporal/search")
async def temporal_search(
    situation_id: str,
    req: TemporalSearchRequest,
    token: dict = Depends(verify_firebase_token),
):
    """Search the temporal knowledge graph for facts matching a query.

    Uses Graphiti bi-temporal search. Returns facts with valid/invalid timestamps.
    """
    from services.graphiti_client import ConflictMemory
    from datetime import datetime

    uid = token["uid"]
    valid_at = None
    if req.valid_at:
        try:
            valid_at = datetime.fromisoformat(req.valid_at)
        except ValueError:
            pass

    memory = ConflictMemory(uid, situation_id)
    facts = await memory.search(req.query, num_results=req.num_results, valid_at=valid_at)
    await memory.close()
    return {"facts": facts, "query": req.query, "valid_at": req.valid_at}


@router.get("/{situation_id}/temporal/entity/{entity_name}")
async def entity_timeline(
    situation_id: str,
    entity_name: str,
    limit: int = Query(default=20, le=50),
    token: dict = Depends(verify_firebase_token),
):
    """Return the full temporal timeline of facts about a named entity."""
    from services.graphiti_client import ConflictMemory

    uid = token["uid"]
    memory = ConflictMemory(uid, situation_id)
    timeline = await memory.get_entity_timeline(entity_name, limit=limit)
    await memory.close()
    return {"entity": entity_name, "timeline": timeline}
