"""Tool implementations for the Deep Research Agent."""
import os
import httpx


BACKEND_URL = os.environ.get("PRAXIS_BACKEND_URL", "http://localhost:8080")


async def web_search_tool(query: str) -> str:
    """Search the web for current information about conflict topics."""
    # Delegates to the existing ARGUS/research endpoint
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            f"{BACKEND_URL}/api/v1/analyze/web-search",
            json={"query": query},
        )
        if resp.status_code == 200:
            return resp.json().get("results", "No results found.")
        return f"Search failed: {resp.status_code}"


async def document_retrieval_tool(uid: str, situation_id: str, query: str) -> str:
    """Retrieve relevant document excerpts from the user's uploaded documents."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(
            f"{BACKEND_URL}/api/v1/documents/retrieve",
            json={"uid": uid, "situation_id": situation_id, "query": query},
        )
        if resp.status_code == 200:
            chunks = resp.json().get("chunks", [])
            if not chunks:
                return "No relevant document excerpts found."
            return "\n\n---\n\n".join(
                f"[Source: {c.get('title', 'Document')}]\n{c.get('text', '')}"
                for c in chunks
            )
        return "Document retrieval unavailable."


async def graph_query_tool(uid: str, situation_id: str, entity_type: str = "") -> str:
    """Query the conflict knowledge graph for entities and relationships."""
    async with httpx.AsyncClient(timeout=30.0) as client:
        params = {"uid": uid, "situation_id": situation_id}
        if entity_type:
            params["entity_type"] = entity_type
        resp = await client.get(f"{BACKEND_URL}/api/v1/graph/{situation_id}", params=params)
        if resp.status_code == 200:
            data = resp.json()
            nodes = data.get("nodes", [])
            edges = data.get("edges", [])
            return f"Graph: {len(nodes)} entities, {len(edges)} relationships. Top entities: {', '.join(n.get('label', n.get('id', '')) for n in nodes[:10])}"
        return "Graph data unavailable."
