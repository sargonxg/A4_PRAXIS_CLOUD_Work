"""Analyze router — /api/v1/analyze/*

Exposes individual analysis results from the graph. Reads from Firestore
(pre-computed by the pipeline) or recomputes on demand.
"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
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
    graph_diff,
)
from graphify_tacitus.build import build_from_json
from graphify_tacitus.cluster import cluster
from graphify_tacitus.report import render_situation_brief, render_situation_brief_json
from services.firestore_sync import FirestoreSync

router = APIRouter()


async def _load_graph_and_analysis(uid: str, situation_id: str):
    """Load graph snapshot + analysis from Firestore."""
    fs = FirestoreSync()
    snapshot = await fs.read_graph_snapshot(uid, situation_id)
    analysis = await fs.read_analysis(uid, situation_id)
    if not snapshot.get("nodes"):
        raise HTTPException(status_code=404, detail="No graph data. Run pipeline first.")
    G = build_from_json(snapshot)
    return G, analysis, snapshot


@router.get("/{situation_id}/pivot-actors")
async def get_pivot_actors(
    situation_id: str,
    token: dict = Depends(verify_firebase_token),
):
    uid = token["uid"]
    _, analysis, _ = await _load_graph_and_analysis(uid, situation_id)
    return {"pivotActors": analysis.get("pivotActors", [])}


@router.get("/{situation_id}/hidden-linkages")
async def get_hidden_linkages(
    situation_id: str,
    token: dict = Depends(verify_firebase_token),
):
    uid = token["uid"]
    _, analysis, _ = await _load_graph_and_analysis(uid, situation_id)
    return {"hiddenLinkages": analysis.get("hiddenLinkages", [])}


@router.get("/{situation_id}/intelligence-gaps")
async def get_intelligence_gaps(
    situation_id: str,
    token: dict = Depends(verify_firebase_token),
):
    uid = token["uid"]
    _, analysis, _ = await _load_graph_and_analysis(uid, situation_id)
    return {"intelligenceGaps": analysis.get("intelligenceGaps", [])}


@router.get("/{situation_id}/escalation")
async def get_escalation(
    situation_id: str,
    token: dict = Depends(verify_firebase_token),
):
    uid = token["uid"]
    _, analysis, _ = await _load_graph_and_analysis(uid, situation_id)
    return {"escalationAssessment": analysis.get("escalationAssessment", {})}


@router.get("/{situation_id}/factions")
async def get_factions(
    situation_id: str,
    token: dict = Depends(verify_firebase_token),
):
    uid = token["uid"]
    _, analysis, _ = await _load_graph_and_analysis(uid, situation_id)
    return {"factionMap": analysis.get("factionMap", {})}


@router.get("/{situation_id}/negotiation-space")
async def get_negotiation_space(
    situation_id: str,
    token: dict = Depends(verify_firebase_token),
):
    uid = token["uid"]
    _, analysis, _ = await _load_graph_and_analysis(uid, situation_id)
    return {"negotiationSpace": analysis.get("negotiationSpace", {})}


@router.get("/{situation_id}/brief")
async def get_brief_markdown(
    situation_id: str,
    token: dict = Depends(verify_firebase_token),
):
    """Return the situation brief as markdown."""
    uid = token["uid"]
    G, analysis, _ = await _load_graph_and_analysis(uid, situation_id)
    fs = FirestoreSync()
    situation = await fs.read_situation(uid, situation_id)
    md = render_situation_brief(G, analysis, situation)
    return {"brief": md}


@router.get("/{situation_id}/brief.json")
async def get_brief_json(
    situation_id: str,
    token: dict = Depends(verify_firebase_token),
):
    """Return the situation brief as structured JSON."""
    uid = token["uid"]
    G, analysis, _ = await _load_graph_and_analysis(uid, situation_id)
    fs = FirestoreSync()
    situation = await fs.read_situation(uid, situation_id)
    return render_situation_brief_json(G, analysis, situation)


class DiffRequest(BaseModel):
    snapshot_a: dict
    snapshot_b: dict


@router.post("/{situation_id}/diff")
async def diff_snapshots(
    situation_id: str,
    req: DiffRequest,
    token: dict = Depends(verify_firebase_token),
):
    """Compare two graph snapshots and return structural differences."""
    G_a = build_from_json(req.snapshot_a)
    G_b = build_from_json(req.snapshot_b)
    return graph_diff(G_a, G_b)
