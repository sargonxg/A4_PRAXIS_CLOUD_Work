"""Disabled-safe Vertex AI RAG Engine client.

The production service can mount credentials through ADC and Secret Manager
environment variables, but the default local behavior is explicit no-op. This
keeps PRAXIS from silently calling managed RAG services unless the operator has
enabled the connector.
"""

from __future__ import annotations

import os
from dataclasses import dataclass, field
from typing import Any

import httpx


@dataclass(frozen=True)
class VertexRagConfig:
    project_id: str
    location: str = "us-central1"
    api_version: str = "v1"
    endpoint_host: str = "aiplatform.googleapis.com"
    enabled: bool = False

    @classmethod
    def from_env(cls) -> "VertexRagConfig":
        return cls(
            project_id=os.getenv("GOOGLE_CLOUD_PROJECT", ""),
            location=os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1"),
            api_version=os.getenv("VERTEX_RAG_API_VERSION", "v1"),
            endpoint_host=os.getenv("VERTEX_RAG_ENDPOINT_HOST", "aiplatform.googleapis.com"),
            enabled=os.getenv("VERTEX_RAG_ENABLED") == "true",
        )


@dataclass(frozen=True)
class VertexRagContext:
    id: str
    title: str
    uri: str
    text: str
    score: float | None = None
    metadata: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class VertexRagRetrieveResult:
    status: str
    contexts: list[VertexRagContext]
    reason: str | None = None


class VertexRagClient:
    def __init__(self, config: VertexRagConfig | None = None) -> None:
        self.config = config or VertexRagConfig.from_env()

    def retrieve_contexts(
        self,
        *,
        query: str,
        corpus_names: list[str],
        top_k: int = 8,
    ) -> VertexRagRetrieveResult:
        if not self.config.enabled:
            return VertexRagRetrieveResult(
                status="disabled",
                contexts=[],
                reason="Set VERTEX_RAG_ENABLED=true to enable Vertex AI RAG Engine retrieval.",
            )
        if not self.config.project_id:
            return VertexRagRetrieveResult(
                status="missing-config",
                contexts=[],
                reason="GOOGLE_CLOUD_PROJECT is required for Vertex AI RAG Engine retrieval.",
            )
        if not corpus_names:
            return VertexRagRetrieveResult(
                status="missing-config",
                contexts=[],
                reason="At least one RAG corpus name is required.",
            )

        payload = self.build_retrieve_contexts_payload(
            query=query,
            corpus_names=corpus_names,
            top_k=top_k,
        )
        response = httpx.post(
            self.retrieve_contexts_url(),
            headers={"authorization": f"Bearer {self._access_token()}"},
            json=payload,
            timeout=30,
        )
        response.raise_for_status()
        return VertexRagRetrieveResult(
            status="ready",
            contexts=self.parse_contexts(response.json()),
        )

    def retrieve_contexts_url(self) -> str:
        parent = f"projects/{self.config.project_id}/locations/{self.config.location}"
        return f"https://{self.config.endpoint_host}/{self.config.api_version}/{parent}:retrieveContexts"

    def build_retrieve_contexts_payload(
        self,
        *,
        query: str,
        corpus_names: list[str],
        top_k: int = 8,
    ) -> dict[str, Any]:
        return {
            "vertexRagStore": {
                "ragResources": [{"ragCorpus": name} for name in corpus_names],
                "similarityTopK": max(1, min(int(top_k), 50)),
            },
            "query": {"text": query},
        }

    def parse_contexts(self, payload: dict[str, Any]) -> list[VertexRagContext]:
        contexts: list[VertexRagContext] = []
        raw_contexts = (
            payload.get("contexts", {})
            if isinstance(payload.get("contexts"), dict)
            else {}
        )
        for idx, raw in enumerate(raw_contexts.get("contexts", []) or []):
            if not isinstance(raw, dict):
                continue
            source_uri = str(raw.get("sourceUri") or raw.get("source_uri") or "")
            text = str(raw.get("text") or raw.get("chunkText") or raw.get("chunk_text") or "")
            title = str(raw.get("sourceDisplayName") or raw.get("source_display_name") or source_uri or f"RAG context {idx + 1}")
            score = raw.get("score")
            contexts.append(
                VertexRagContext(
                    id=f"vertex-rag:{idx}:{source_uri or title}",
                    title=title,
                    uri=source_uri,
                    text=text,
                    score=score if isinstance(score, (float, int)) else None,
                    metadata=raw,
                )
            )
        return contexts

    def _access_token(self) -> str:
        import google.auth
        import google.auth.transport.requests

        credentials, _project = google.auth.default(scopes=["https://www.googleapis.com/auth/cloud-platform"])
        auth_request = google.auth.transport.requests.Request()
        credentials.refresh(auth_request)
        return str(credentials.token)
