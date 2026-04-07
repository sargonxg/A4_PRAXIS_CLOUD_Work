"""Graphiti temporal memory client for PRAXIS.

Graphiti maintains a bi-temporal knowledge graph that tracks:
- When facts were TRUE (valid time)
- When facts were ADDED (transaction time)

This enables time-aware conflict analysis: "Who controlled Khartoum in March 2024?"
vs "What do we know NOW about Khartoum in March 2024?"

Reference: https://github.com/getzep/graphiti
"""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from config import get_settings


class ConflictMemory:
    """Temporal memory layer over the conflict knowledge graph.

    Uses Graphiti for bi-temporal fact storage. Falls back gracefully
    if Graphiti is not configured (Neo4j URI required).
    """

    def __init__(self, uid: str, situation_id: str) -> None:
        self.uid = uid
        self.situation_id = situation_id
        self._client: Any = None

    def _get_client(self):
        """Lazily initialise the Graphiti client."""
        if self._client is not None:
            return self._client

        settings = get_settings()
        if not settings.neo4j_uri:
            return None

        try:
            from graphiti_core import Graphiti
            from graphiti_core.llm_client.gemini_client import GeminiClient, LLMConfig
            from graphiti_core.embedder.gemini import GeminiEmbedder, GeminiEmbedderConfig

            llm_client = GeminiClient(
                config=LLMConfig(
                    api_key=settings.google_api_key,
                    model="gemini-2.0-flash",
                )
            )
            embedder = GeminiEmbedder(
                config=GeminiEmbedderConfig(api_key=settings.google_api_key)
            )
            self._client = Graphiti(
                uri=settings.neo4j_uri,
                user=settings.neo4j_user,
                password=settings.neo4j_password,
                llm_client=llm_client,
                embedder=embedder,
            )
        except (ImportError, Exception):
            self._client = None

        return self._client

    async def add_episode(
        self,
        content: str,
        source_description: str = "",
        valid_at: datetime | None = None,
    ) -> dict:
        """Add a textual episode (document excerpt, event report) to temporal memory.

        Graphiti extracts entities + facts and stores them with timestamps.
        """
        client = self._get_client()
        if client is None:
            return {"status": "skipped", "reason": "Graphiti not configured"}

        try:
            from graphiti_core.nodes import EpisodeType
            result = await client.add_episode(
                name=f"{self.uid}/{self.situation_id}/{source_description}",
                episode_body=content,
                source=EpisodeType.text,
                source_description=source_description or "conflict document",
                reference_time=valid_at or datetime.now(timezone.utc),
            )
            return {
                "status": "ok",
                "episode_id": str(result.uuid) if result else None,
                "entities_extracted": len(getattr(result, "nodes", [])) if result else 0,
            }
        except Exception as exc:
            return {"status": "error", "reason": str(exc)}

    async def search(
        self,
        query: str,
        center_node_uuid: str | None = None,
        num_results: int = 10,
        valid_at: datetime | None = None,
    ) -> list[dict]:
        """Semantic + temporal search over the conflict memory graph.

        Args:
            query: Natural language query about the conflict.
            center_node_uuid: If provided, bias results toward this entity.
            num_results: Max facts to return.
            valid_at: Return facts that were TRUE at this point in time.
        """
        client = self._get_client()
        if client is None:
            return []

        try:
            results = await client.search(
                query=query,
                center_node_uuid=center_node_uuid,
                num_results=num_results,
                valid_at=valid_at,
            )
            return [
                {
                    "fact": r.fact,
                    "valid_at": r.valid_at.isoformat() if r.valid_at else None,
                    "invalid_at": r.invalid_at.isoformat() if r.invalid_at else None,
                    "source_node_name": r.source_node_name,
                    "target_node_name": r.target_node_name,
                    "uuid": str(r.uuid),
                    "score": float(getattr(r, "score", 0.0)),
                }
                for r in (results or [])
            ]
        except Exception:
            return []

    async def get_entity_timeline(self, entity_name: str, limit: int = 20) -> list[dict]:
        """Return all temporal facts about a named entity, sorted by valid time."""
        facts = await self.search(entity_name, num_results=limit * 2)
        entity_facts = [
            f for f in facts
            if entity_name.lower() in (f.get("source_node_name") or "").lower()
            or entity_name.lower() in (f.get("target_node_name") or "").lower()
        ]
        entity_facts.sort(key=lambda f: f.get("valid_at") or "", reverse=True)
        return entity_facts[:limit]

    async def get_temporal_context(self, query: str, as_of: datetime | None = None) -> str:
        """Return a formatted temporal context string for AI prompts."""
        facts = await self.search(query, num_results=15, valid_at=as_of)
        if not facts:
            return ""

        lines = ["## Temporal Intelligence (Graphiti)\n"]
        for f in facts:
            valid = f.get("valid_at", "unknown date")
            lines.append(f"- [{valid}] {f.get('fact', '')}")
        return "\n".join(lines)

    async def build_indices(self) -> None:
        """Ensure Graphiti indices are built. Call once during setup."""
        client = self._get_client()
        if client is None:
            return
        try:
            await client.build_indices_and_constraints()
        except Exception:
            pass

    async def close(self) -> None:
        """Close the Graphiti/Neo4j connection."""
        if self._client is not None:
            try:
                await self._client.close()
            except Exception:
                pass
