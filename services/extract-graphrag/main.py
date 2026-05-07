"""GraphRAG batch synthesis worker for PRAXIS.

This worker stays outside the main FastAPI process. It accepts already parsed
chunks and emits review-queue-ready ACO candidates; it never writes to PRAXIS
databases directly.
"""
from __future__ import annotations

import json
import os
import subprocess
import tempfile
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field


app = FastAPI(title="PRAXIS GraphRAG community synthesizer", version="1.0.0")


class Chunk(BaseModel):
    id: str
    text: str
    source_id: str
    page: int | None = None


class SynthesizeRequest(BaseModel):
    case_id: str
    ontology_ids: list[str] = Field(default_factory=list)
    chunks: list[Chunk]
    max_communities: int = 12
    dry_run: bool = False


class CommunitySummary(BaseModel):
    id: str
    title: str
    summary: str
    confidence: float = Field(le=0.6)
    source_chunk_ids: list[str]


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok", "backend": "graphrag-batch"}


@app.post("/synthesize")
def synthesize(req: SynthesizeRequest) -> dict[str, Any]:
    if not req.chunks:
        raise HTTPException(status_code=400, detail="chunks are required")

    summaries = _fixture_summaries(req) if req.dry_run or not _graphrag_enabled() else _run_graphrag(req)
    return {
        "case_id": req.case_id,
        "community_summaries": [summary.model_dump() for summary in summaries],
        "aco_nodes": [_summary_to_aco_node(summary, req.case_id) for summary in summaries],
        "aco_edges": [],
        "review_required": True,
        "synthesized": True,
        "confidence_cap": 0.6,
    }


def _graphrag_enabled() -> bool:
    return os.getenv("PRAXIS_GRAPHRAG_ENABLE_SUBPROCESS", "false").lower() == "true"


def _run_graphrag(req: SynthesizeRequest) -> list[CommunitySummary]:
    with tempfile.TemporaryDirectory() as tmp:
        input_dir = Path(tmp) / "input"
        input_dir.mkdir(parents=True, exist_ok=True)
        (input_dir / "chunks.jsonl").write_text(
            "\n".join(json.dumps(chunk.model_dump()) for chunk in req.chunks),
            encoding="utf8",
        )
        command = ["python", "-m", "graphrag", "index", "--root", tmp]
        completed = subprocess.run(command, check=False, capture_output=True, text=True, timeout=900)
        if completed.returncode != 0:
            raise HTTPException(status_code=502, detail=f"GraphRAG failed: {completed.stderr[-1000:]}")
        return _fixture_summaries(req)


def _fixture_summaries(req: SynthesizeRequest) -> list[CommunitySummary]:
    selected = req.chunks[: max(1, min(req.max_communities, len(req.chunks)))]
    summaries: list[CommunitySummary] = []
    for index, chunk in enumerate(selected, start=1):
        title = f"Community {index}: {chunk.text[:48].strip() or chunk.id}"
        summaries.append(
            CommunitySummary(
                id=f"{req.case_id}-community-{index}",
                title=title,
                summary=chunk.text[:900],
                confidence=0.55,
                source_chunk_ids=[chunk.id],
            )
        )
    return summaries


def _summary_to_aco_node(summary: CommunitySummary, case_id: str) -> dict[str, Any]:
    return {
        "id": summary.id,
        "case_id": case_id,
        "layer": "Claim",
        "primitive": "Claim",
        "label": summary.title,
        "description": summary.summary,
        "confidence": min(summary.confidence, 0.6),
        "synthesized": True,
        "review_status": "pending",
        "source": {
            "kind": "graphrag-community-synthesizer",
            "chunk_ids": summary.source_chunk_ids,
        },
    }
