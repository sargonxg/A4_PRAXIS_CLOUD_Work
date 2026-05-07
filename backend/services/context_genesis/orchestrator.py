"""HTTP orchestration helpers for Pack 30 extraction workers."""
from __future__ import annotations

from dataclasses import dataclass

import httpx


@dataclass(frozen=True)
class DocumentRef:
    gcs_uri: str
    source_id: str


@dataclass(frozen=True)
class ParsedDocument:
    markdown: str
    docling_json_uri: str
    page_count: int
    table_count: int


@dataclass(frozen=True)
class NerEntity:
    text: str
    label: str
    start: int
    end: int
    confidence: float


async def stage_parse(document_ref: DocumentRef, *, docling_worker_url: str, timeout_s: float = 120.0) -> ParsedDocument:
    async with httpx.AsyncClient(timeout=timeout_s) as client:
        response = await client.post(f"{docling_worker_url.rstrip('/')}/parse", json={"gcs_uri": document_ref.gcs_uri, "source_id": document_ref.source_id})
        response.raise_for_status()
        payload = response.json()
    return ParsedDocument(
        markdown=payload["markdown"],
        docling_json_uri=payload["docling_json_uri"],
        page_count=int(payload.get("page_count", 0)),
        table_count=int(payload.get("table_count", 0)),
    )


async def stage_recall_ner(text: str, ontology_ids: list[str], *, gliner_worker_url: str, timeout_s: float = 30.0) -> list[NerEntity]:
    async with httpx.AsyncClient(timeout=timeout_s) as client:
        response = await client.post(f"{gliner_worker_url.rstrip('/')}/extract", json={"text": text, "ontology_ids": ontology_ids})
        response.raise_for_status()
        payload = response.json()
    return [NerEntity(**entity) for entity in payload.get("entities", [])]
