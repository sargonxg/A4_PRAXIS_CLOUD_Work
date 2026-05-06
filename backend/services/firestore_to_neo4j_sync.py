"""One-way Firestore graph/main to Neo4j Aura sync."""
from __future__ import annotations

from google.cloud import firestore

from services.neo4j_client import Neo4jClient


async def sync_situation(uid: str, situation_id: str, client: Neo4jClient | None = None) -> dict:
    db = firestore.AsyncClient()
    doc = await (
        db.collection("users")
        .document(uid)
        .collection("situations")
        .document(situation_id)
        .collection("graph")
        .document("main")
        .get()
    )
    graph = doc.to_dict() or {}
    owns_client = client is None
    neo4j = client or Neo4jClient()
    try:
        for node in graph.get("nodes", []):
            props = {**node, "situationId": situation_id, "situation_id": situation_id}
            label = props.get("type") or props.get("primitive_type") or props.get("label") or "Entity"
            await neo4j.merge_node(str(label), props, uid)
        for edge in graph.get("edges", []):
            props = {**edge, "situationId": situation_id, "situation_id": situation_id}
            await neo4j.merge_edge(
                str(edge.get("source")),
                str(edge.get("target")),
                str(edge.get("type") or edge.get("relation") or "RELATED_TO"),
                props,
                uid,
            )
    finally:
        if owns_client:
            await neo4j.close()
    return {"nodes": len(graph.get("nodes", [])), "edges": len(graph.get("edges", []))}
