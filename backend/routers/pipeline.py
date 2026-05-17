"""Pipeline router — /api/v1/pipeline/*

Handles source ingestion, entity extraction, graph building, analysis, and sync.
Every endpoint requires Firebase auth. Results are written back to Firestore.
"""
from __future__ import annotations

import time
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException, Request
from google.cloud import firestore
from google.cloud.firestore_v1 import SERVER_TIMESTAMP
from pydantic import BaseModel

from auth import verify_firebase_token
from graphify_tacitus.analyze import (
    escalation_assessment,
    faction_map,
    hidden_linkages,
    intelligence_gaps,
    key_concepts,
    negotiation_space,
    pivot_actors,
)
from graphify_tacitus.build import build, build_from_json
from graphify_tacitus.cluster import cluster
from graphify_tacitus.export import push_to_neo4j, to_json
from graphify_tacitus.report import render_situation_brief_json
from services.bigquery_client import log_pipeline_run
from services.firestore_sync import FirestoreSync
from services.gemini_client import GeminiClient
from config import get_settings

router = APIRouter()
settings = get_settings()


class Source(BaseModel):
    type: Literal["url", "text", "file"]
    content: str
    filename: str = ""
    date: str = ""


class PipelineRunRequest(BaseModel):
    situation_id: str
    sources: list[Source] = []


class IngestUrlRequest(BaseModel):
    situation_id: str
    url: str


async def _update_job_progress(job_id: str | None, percent: int, message: str) -> None:
    if not job_id:
        return
    try:
        db = firestore.AsyncClient()
        await db.collection("background_jobs").document(job_id).update({
            "status": "running",
            "semaphore": "purple" if "extract" in message.lower() or "analy" in message.lower() else "yellow",
            "progress": {"percent": percent, "message": message},
            "updatedAt": SERVER_TIMESTAMP,
        })
    except Exception:
        # Progress reporting must never fail the pipeline itself.
        pass


def _run_analysis(G, communities: dict) -> dict:
    """Run full analysis suite on a clustered graph."""
    community_labels = {
        cid: f"Faction {cid}" for cid in set(communities.values())
    }
    return {
        "pivotActors": pivot_actors(G),
        "keyConcepts": key_concepts(G),
        "hiddenLinkages": hidden_linkages(G, communities),
        "intelligenceGaps": intelligence_gaps(G, communities, community_labels),
        "escalationAssessment": escalation_assessment(G),
        "factionMap": {str(k): v for k, v in faction_map(G, communities).items()},
        "negotiationSpace": negotiation_space(G),
    }


@router.post("/run")
async def run_pipeline(
    req: PipelineRunRequest,
    request: Request,
    token: dict = Depends(verify_firebase_token),
):
    """Run the full pipeline: extract → build → cluster → analyze → sync."""
    uid = token["uid"]
    job_id = request.headers.get("X-PRAXIS-JOB-ID") or None
    start_ms = int(time.time() * 1000)

    gemini = GeminiClient()
    fs = FirestoreSync()

    # Update pipeline status
    await fs.update_situation_metadata(uid, req.situation_id, {
        "pipelineStatus": "running",
    })
    await _update_job_progress(job_id, 5, "Pipeline started")

    try:
        # 1. Extract from all sources
        extractions = []
        from graphify_tacitus.extract import extract_conflict_text, extract_from_url

        for source in req.sources:
            if source.type == "url":
                result = await extract_from_url(source.content, gemini, uid, req.situation_id)
            else:
                result = await extract_conflict_text(
                    source.content, source.filename or source.type, gemini, uid, req.situation_id
                )

            extractions.append({
                "nodes": [n.model_dump() for n in result.nodes],
                "edges": [e.model_dump() for e in result.edges],
            })

        if not extractions:
            raise HTTPException(status_code=400, detail="No sources provided or extraction failed")
        await _update_job_progress(job_id, 25, "Extraction complete")

        # 2. Build graph
        G = build(extractions)
        await _update_job_progress(job_id, 40, "Graph built")

        # 3. Cluster
        communities = cluster(G)
        await _update_job_progress(job_id, 55, "Communities clustered")

        # 4. Analyze
        analysis = _run_analysis(G, communities)
        await _update_job_progress(job_id, 70, "Analysis complete")

        # 5. Generate brief
        situation = await fs.read_situation(uid, req.situation_id)
        brief = render_situation_brief_json(G, analysis, situation)
        await _update_job_progress(job_id, 80, "Brief rendered")

        # 6. Sync to Firestore
        snapshot = to_json(G, communities)
        await fs.write_graph_snapshot(uid, req.situation_id, snapshot)
        await fs.write_analysis(uid, req.situation_id, analysis)
        await _update_job_progress(job_id, 90, "Firestore synced")

        # 7. Push to Neo4j (if configured)
        neo4j_result = {}
        if settings.neo4j_uri:
            try:
                neo4j_result = await push_to_neo4j(
                    G, settings.neo4j_uri, settings.neo4j_user, settings.neo4j_password,
                    communities, uid, req.situation_id,
                )
            except Exception:
                pass  # Non-critical

        # 8. Update situation metadata
        escalation = analysis.get("escalationAssessment", {})
        await fs.update_situation_metadata(uid, req.situation_id, {
            "pipelineStatus": "complete",
            "lastPipelineRun": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "nodeCount": G.number_of_nodes(),
            "edgeCount": G.number_of_edges(),
            "escalationStage": escalation.get("glaslStage", 1),
        })

        # 9. Log to BigQuery
        duration_ms = int(time.time() * 1000) - start_ms
        log_pipeline_run(uid, req.situation_id, G.number_of_nodes(), G.number_of_edges(), duration_ms, "complete")
        await _update_job_progress(job_id, 95, "Pipeline complete")

        return {
            "analysis": analysis,
            "brief": brief,
            "stats": {
                "nodes": G.number_of_nodes(),
                "edges": G.number_of_edges(),
                "communities": len(set(communities.values())),
            },
            "neo4j": neo4j_result,
        }

    except HTTPException:
        raise
    except Exception as exc:
        await fs.update_situation_metadata(uid, req.situation_id, {"pipelineStatus": "error"})
        await _update_job_progress(job_id, 95, "Pipeline failed")
        duration_ms = int(time.time() * 1000) - start_ms
        log_pipeline_run(uid, req.situation_id, 0, 0, duration_ms, "error")
        raise HTTPException(status_code=500, detail=f"Pipeline failed: {exc}") from exc


@router.post("/ingest-url")
async def ingest_url(
    req: IngestUrlRequest,
    token: dict = Depends(verify_firebase_token),
):
    """Ingest a single URL and merge into the existing graph."""
    uid = token["uid"]
    fs = FirestoreSync()
    gemini = GeminiClient()

    from graphify_tacitus.extract import extract_from_url

    # Extract from URL
    result = await extract_from_url(req.url, gemini, uid, req.situation_id)
    new_extraction = {
        "nodes": [n.model_dump() for n in result.nodes],
        "edges": [e.model_dump() for e in result.edges],
    }

    # Load existing graph from Firestore and merge
    existing_snapshot = await fs.read_graph_snapshot(uid, req.situation_id)
    extractions = [new_extraction]
    if existing_snapshot.get("nodes"):
        extractions.insert(0, existing_snapshot)

    G = build(extractions)
    communities = cluster(G)
    analysis = _run_analysis(G, communities)

    snapshot = to_json(G, communities)
    await fs.write_graph_snapshot(uid, req.situation_id, snapshot)
    await fs.write_analysis(uid, req.situation_id, analysis)
    await fs.update_situation_metadata(uid, req.situation_id, {
        "nodeCount": G.number_of_nodes(),
        "edgeCount": G.number_of_edges(),
        "escalationStage": analysis.get("escalationAssessment", {}).get("glaslStage", 1),
    })

    return {
        "new_nodes": len(result.nodes),
        "new_edges": len(result.edges),
        "total_nodes": G.number_of_nodes(),
        "total_edges": G.number_of_edges(),
        "analysis": analysis,
    }

