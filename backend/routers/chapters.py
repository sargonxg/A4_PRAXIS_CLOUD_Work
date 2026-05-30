"""Workspace chapter routers.

Chapters are work-product panes. They consume substrate and write only their
own product records; substrate writes stay in tab routers.
"""
from __future__ import annotations

import json
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from auth import verify_firebase_token
from services import cognee_memory
from services.cognee_memory import CogneeSearchMode, MemoryScope, SearchAudit
from services.postgres import tenant_session
from services.workspace_orchestrator import log_orchestrator_event

router = APIRouter()

DIALECTICA_RECIPES = [
    {"id": "stakeholder-map", "title": "StakeholderMap", "mode": CogneeSearchMode.GRAPH_COMPLETION, "tokenBudget": 8000},
    {"id": "contradiction-scan", "title": "ContradictionScan", "mode": CogneeSearchMode.INSIGHTS, "tokenBudget": 8000},
    {"id": "constraint-leverage-map", "title": "ConstraintLeverageMap", "mode": CogneeSearchMode.GRAPH_COMPLETION, "tokenBudget": 8000},
    {"id": "commitment-tracker", "title": "CommitmentTracker", "mode": CogneeSearchMode.GRAPH_COMPLETION, "tokenBudget": 8000},
    {"id": "narrative-arc", "title": "NarrativeArc", "mode": CogneeSearchMode.SUMMARIES, "tokenBudget": 8000},
    {"id": "ambiguity-audit", "title": "AmbiguityAudit", "mode": CogneeSearchMode.INSIGHTS, "tokenBudget": 8000},
    {"id": "red-team-counterclaim", "title": "RedTeamCounterclaim", "mode": CogneeSearchMode.INSIGHTS, "tokenBudget": 8000},
    {"id": "counterfactual-branch", "title": "CounterfactualBranch", "mode": CogneeSearchMode.GRAPH_COMPLETION, "tokenBudget": 8000},
    {"id": "evidence-gap-finder", "title": "EvidenceGapFinder", "mode": CogneeSearchMode.INSIGHTS, "tokenBudget": 8000},
    {"id": "policy-option-generator", "title": "PolicyOptionGenerator", "mode": CogneeSearchMode.SUMMARIES, "tokenBudget": 8000},
    {"id": "risk-weighting", "title": "RiskWeighting", "mode": CogneeSearchMode.GRAPH_COMPLETION, "tokenBudget": 8000},
    {"id": "decision-memo-synth", "title": "DecisionMemoSynth", "mode": CogneeSearchMode.SUMMARIES, "tokenBudget": 8000},
]


class DeskAskRequest(BaseModel):
    case_id: str = Field(..., min_length=1, max_length=128)
    question: str = Field(..., min_length=1, max_length=2000)


class ToolRunRequest(BaseModel):
    case_id: str = Field(..., min_length=1, max_length=128)
    recipe_id: str = Field(..., min_length=1, max_length=128)
    input: dict[str, Any] = Field(default_factory=dict)


class ResearchThreadRequest(BaseModel):
    case_id: str = Field(..., min_length=1, max_length=128)
    question: str = Field(..., min_length=1, max_length=2000)


class ResearchRecallRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000)


class ResearchCloseRequest(BaseModel):
    resolution: str = Field(..., min_length=1, max_length=8000)
    confidence: float = Field(default=0.7, ge=0, le=1)


class MemoRequest(BaseModel):
    case_id: str = Field(..., min_length=1, max_length=128)
    title: str = Field(default="Untitled memo", max_length=300)
    body: str = Field(default="", max_length=200000)
    source_kind: str = Field(default="freeform", max_length=80)
    metadata: dict[str, Any] = Field(default_factory=dict)


class MemoAssistRequest(BaseModel):
    case_id: str = Field(..., min_length=1, max_length=128)
    query: str = Field(..., min_length=1, max_length=2000)


class DraftRequest(BaseModel):
    case_id: str = Field(..., min_length=1, max_length=128)
    title: str = Field(default="Untitled draft", max_length=300)
    body: str = Field(default="", max_length=250000)
    citations: list[dict[str, Any]] = Field(default_factory=list)
    metadata: dict[str, Any] = Field(default_factory=dict)


class DraftCiteRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000)
    top_k: int = Field(default=5, ge=1, le=10)


class ACHHypothesisRequest(BaseModel):
    case_id: str = Field(..., min_length=1, max_length=128)
    text: str = Field(..., min_length=1, max_length=2000)


async def _safe_cognee_search(
    *,
    scope: MemoryScope,
    query: str,
    mode: CogneeSearchMode,
    audit: SearchAudit,
    limit: int = 5,
    session_id: str | None = None,
    source_kind: str | None = None,
    positive: bool = False,
    signal: str | None = None,
    node_set: list[str] | None = None,
) -> tuple[list[Any], dict[str, Any]]:
    try:
        response = await cognee_memory.search(
            scope=scope,
            query=query,
            mode=mode,
            limit=limit,
            session_id=session_id,
            source_kind=source_kind,
            positive=positive,
            signal=signal,
            node_set=node_set,
            audit=audit,
        )
        hits = cognee_memory.memory_hits_from_response(response)
        return hits, {
            "ok": response.get("ok", True),
            "status": response.get("status", "searched"),
            "dataset": response.get("dataset", scope.dataset),
        }
    except Exception as exc:
        return [], {"ok": False, "status": "search_unavailable", "error": str(exc)}


async def _safe_cognee_remember(
    *,
    scope: MemoryScope,
    content: str,
    source_id: str,
    metadata: dict[str, Any],
) -> dict[str, Any]:
    try:
        return await cognee_memory.remember(scope=scope, content=content, source_id=source_id, metadata=metadata)
    except Exception as exc:
        return {"ok": False, "status": "queued_retry", "error": str(exc)}


async def _safe_cognee_memify(
    *,
    scope: MemoryScope,
    thread_id: str,
    turns: list[dict[str, Any]],
    metadata: dict[str, Any],
) -> dict[str, Any]:
    try:
        return await cognee_memory.memify(scope=scope, thread_id=thread_id, turns=turns, metadata=metadata)
    except Exception as exc:
        return {"ok": False, "status": "memify_unavailable", "error": str(exc)}


def _serialize_memory_hit(hit: Any) -> dict[str, Any]:
    metadata = getattr(hit, "metadata", {}) or {}
    return {
        "id": str(getattr(hit, "id", "")),
        "text": str(getattr(hit, "text", ""))[:1200],
        "score": float(getattr(hit, "score", 0) or 0),
        "sourceId": getattr(hit, "source_id", None),
        "metadata": metadata if isinstance(metadata, dict) else {},
    }


def _build_recall_answer(hits: list[Any], cognee_status: dict[str, Any]) -> str:
    if hits:
        top = _serialize_memory_hit(hits[0])
        text = top["text"].strip()
        if text:
            return text
    if cognee_status.get("ok"):
        return "Graph recall completed, but no high-signal Cognee hits were returned for this query."
    return (
        "Graph recall turn was persisted for the research thread. Live Cognee search is queued or unavailable in this "
        "environment, so no retrieved evidence was attached yet."
    )


@router.get("/desk/summary")
async def desk_summary(case_id: str = Query(..., min_length=1, max_length=128), token: dict = Depends(verify_firebase_token)) -> dict[str, Any]:
    async with tenant_session(token["uid"]) as conn:
        suggestions = await conn.fetch(
            """
            SELECT id, target_chapter, surface_key, kind, title, body, confidence, created_at
            FROM workspace_suggestions
            WHERE owner_uid = %s AND case_id = %s AND dismissed_at IS NULL
            ORDER BY confidence DESC, created_at DESC
            LIMIT 20
            """,
            token["uid"],
            case_id,
        )
        frame_count = await conn.fetchval("SELECT count(*) FROM situation_frames WHERE owner_uid = %s AND case_id = %s", token["uid"], case_id)
        source_count = await conn.fetchval("SELECT count(*) FROM source_receipts WHERE owner_uid = %s AND case_id = %s", token["uid"], case_id)
        thread_count = await conn.fetchval("SELECT count(*) FROM research_threads WHERE owner_uid = %s AND case_id = %s AND status != 'closed'", token["uid"], case_id)
        memo_count = await conn.fetchval("SELECT count(*) FROM memos WHERE owner_uid = %s AND case_id = %s", token["uid"], case_id)
    return {
        "caseId": case_id,
        "summary": {
            "frames": frame_count or 0,
            "sources": source_count or 0,
            "openResearchThreads": thread_count or 0,
            "memos": memo_count or 0,
            "openSuggestions": len(suggestions),
            "contextHealth": 50,
        },
        "suggestions": suggestions[:3],
    }


@router.post("/desk/ask")
async def desk_ask(req: DeskAskRequest, token: dict = Depends(verify_firebase_token)) -> StreamingResponse:
    async def stream():
        scope = MemoryScope(owner_uid=token["uid"], case_id=req.case_id)
        hits, cognee_status = await _safe_cognee_search(
            scope=scope,
            query=req.question,
            mode=CogneeSearchMode.NATURAL_LANGUAGE,
            audit=SearchAudit(mode=CogneeSearchMode.NATURAL_LANGUAGE, surface_key="chapter.desk.ask"),
        )
        yield f"data: {json.dumps({'status': 'working', 'message': 'Searching workspace memory', 'hits': len(hits), 'cognee': cognee_status})}\n\n"
        yield f"data: {json.dumps({'status': 'idle', 'message': 'Use retrieved context as advisory evidence, then verify receipts before export.'})}\n\n"

    return StreamingResponse(stream(), media_type="text/event-stream")


@router.post("/desk/dismiss-suggestion/{suggestion_id}")
async def dismiss_suggestion(suggestion_id: str, token: dict = Depends(verify_firebase_token)) -> dict[str, Any]:
    async with tenant_session(token["uid"]) as conn:
        await conn.execute("UPDATE workspace_suggestions SET dismissed_at = now() WHERE owner_uid = %s AND id = %s::uuid", token["uid"], suggestion_id)
    return {"ok": True, "suggestionId": suggestion_id}


@router.get("/research/threads")
async def list_research_threads(case_id: str = Query(..., min_length=1, max_length=128), token: dict = Depends(verify_firebase_token)) -> dict[str, Any]:
    async with tenant_session(token["uid"]) as conn:
        rows = await conn.fetch(
            """
            SELECT id, question, status, cognee_session_id, recall_history,
                   resolution, confidence, memory_coverage, graph_node_ids,
                   created_at, updated_at
            FROM research_threads
            WHERE owner_uid = %s AND case_id = %s
            ORDER BY updated_at DESC
            LIMIT 100
            """,
            token["uid"],
            case_id,
        )
    return {"threads": rows}


@router.post("/research/threads")
async def create_research_thread(req: ResearchThreadRequest, token: dict = Depends(verify_firebase_token)) -> dict[str, Any]:
    session_id = f"research:{req.case_id}:{uuid4()}"
    async with tenant_session(token["uid"]) as conn:
        rows = await conn.fetch(
            "INSERT INTO research_threads (owner_uid, case_id, question, cognee_session_id) VALUES (%s, %s, %s, %s) RETURNING *",
            token["uid"],
            req.case_id,
            req.question,
            session_id,
        )
        await log_orchestrator_event(conn, owner_uid=token["uid"], case_id=req.case_id, surface_key="chapter.research", event_type="research_thread_created", payload={"threadId": str(rows[0]["id"]), "question": req.question})
    return {"thread": rows[0]}


@router.post("/research/threads/{thread_id}/recall")
async def recall_research_thread(thread_id: str, req: ResearchRecallRequest, token: dict = Depends(verify_firebase_token)) -> StreamingResponse:
    async def stream():
        async with tenant_session(token["uid"]) as conn:
            rows = await conn.fetch("SELECT * FROM research_threads WHERE owner_uid = %s AND id = %s::uuid", token["uid"], thread_id)
            if not rows:
                yield f"data: {json.dumps({'status': 'error', 'message': 'Research thread not found'})}\n\n"
                return
            thread = rows[0]
            scope = MemoryScope(owner_uid=token["uid"], case_id=thread["case_id"], session_id=thread["cognee_session_id"])
            hits, cognee_status = await _safe_cognee_search(
                scope=scope,
                query=req.query,
                mode=CogneeSearchMode.GRAPH_COMPLETION,
                session_id=thread["cognee_session_id"],
                node_set=[f"case_{thread['case_id']}"],
                audit=SearchAudit(mode=CogneeSearchMode.GRAPH_COMPLETION, surface_key="chapter.research.recall"),
            )
            citations = [_serialize_memory_hit(hit) for hit in hits[:5]]
            recall_turn = {
                "query": req.query,
                "answer": _build_recall_answer(hits, cognee_status),
                "hit_count": len(hits),
                "citations": citations,
                "status": "completed",
                "cognee": cognee_status,
            }
            await conn.execute(
                """
                UPDATE research_threads
                SET recall_history = recall_history || %s::jsonb,
                    status = 'iterating',
                    updated_at = now()
                WHERE owner_uid = %s AND id = %s::uuid
                """,
                json.dumps([recall_turn]),
                token["uid"],
                thread_id,
            )
        yield f"data: {json.dumps({'status': 'working', 'message': 'Graph recall complete', 'hits': len(hits), 'citations': citations, 'answer': recall_turn['answer'], 'cognee': cognee_status})}\n\n"
        yield f"data: {json.dumps({'status': 'idle', 'message': 'Recall turn persisted with Cognee session continuity.', 'turn': recall_turn})}\n\n"

    return StreamingResponse(stream(), media_type="text/event-stream")


@router.post("/research/threads/{thread_id}/close")
async def close_research_thread(thread_id: str, req: ResearchCloseRequest, token: dict = Depends(verify_firebase_token)) -> dict[str, Any]:
    async with tenant_session(token["uid"]) as conn:
        rows = await conn.fetch("SELECT * FROM research_threads WHERE owner_uid = %s AND id = %s::uuid", token["uid"], thread_id)
        if not rows:
            raise HTTPException(status_code=404, detail="research_thread_not_found")
        thread = rows[0]
        scope = MemoryScope(owner_uid=token["uid"], case_id=thread["case_id"], session_id=thread["cognee_session_id"])
        memify_status = await _safe_cognee_memify(scope=scope, thread_id=thread_id, turns=thread.get("recall_history") or [], metadata={"resolution": req.resolution, "confidence": req.confidence})
        if cognee_memory.is_enabled() and not memify_status.get("ok"):
            raise HTTPException(status_code=503, detail="cognee_memify_failed")
        _, search_status = await _safe_cognee_search(scope=scope, query=req.resolution, mode=CogneeSearchMode.GRAPH_COMPLETION, positive=True, signal=req.resolution, audit=SearchAudit(mode=CogneeSearchMode.GRAPH_COMPLETION, surface_key="chapter.research.close"))
        updated = await conn.fetch(
            """
            UPDATE research_threads
            SET status = 'closed', resolution = %s, confidence = %s,
                memory_coverage = LEAST(1.0, memory_coverage + 0.200),
                updated_at = now()
            WHERE owner_uid = %s AND id = %s::uuid
            RETURNING *
            """,
            req.resolution,
            req.confidence,
            token["uid"],
            thread_id,
        )
        await log_orchestrator_event(conn, owner_uid=token["uid"], case_id=thread["case_id"], surface_key="chapter.research", event_type="research_thread_closed", payload={"threadId": thread_id, "memify": memify_status, "search": search_status})
    return {"thread": updated[0], "cognee": {"memify": memify_status, "search": search_status}}


@router.post("/research/threads/{thread_id}/reopen")
async def reopen_research_thread(thread_id: str, token: dict = Depends(verify_firebase_token)) -> dict[str, Any]:
    async with tenant_session(token["uid"]) as conn:
        rows = await conn.fetch("UPDATE research_threads SET status = 'open', updated_at = now() WHERE owner_uid = %s AND id = %s::uuid RETURNING *", token["uid"], thread_id)
    if not rows:
        raise HTTPException(status_code=404, detail="research_thread_not_found")
    return {"thread": rows[0]}


@router.get("/memos")
async def list_memos(case_id: str = Query(..., min_length=1, max_length=128), token: dict = Depends(verify_firebase_token)) -> dict[str, Any]:
    async with tenant_session(token["uid"]) as conn:
        rows = await conn.fetch("SELECT * FROM memos WHERE owner_uid = %s AND case_id = %s ORDER BY pinned DESC, updated_at DESC LIMIT 100", token["uid"], case_id)
    return {"memos": rows}


@router.post("/memos")
async def create_memo(req: MemoRequest, token: dict = Depends(verify_firebase_token)) -> dict[str, Any]:
    async with tenant_session(token["uid"]) as conn:
        rows = await conn.fetch("INSERT INTO memos (owner_uid, case_id, title, body, source_kind, metadata) VALUES (%s, %s, %s, %s, %s, %s::jsonb) RETURNING *", token["uid"], req.case_id, req.title, req.body, req.source_kind, req.metadata)
    scope = MemoryScope(owner_uid=token["uid"], case_id=req.case_id)
    cognee_status = await _safe_cognee_remember(scope=scope, content=req.body or req.title, source_id=f"memo:{rows[0]['id']}", metadata={"source": "memo", "source_kind": req.source_kind})
    return {"memo": rows[0], "cognee": cognee_status}


@router.put("/memos/{memo_id}")
async def update_memo(memo_id: str, req: MemoRequest, token: dict = Depends(verify_firebase_token)) -> dict[str, Any]:
    async with tenant_session(token["uid"]) as conn:
        current = await conn.fetch("SELECT * FROM memos WHERE owner_uid = %s AND id = %s::uuid", token["uid"], memo_id)
        if not current:
            raise HTTPException(status_code=404, detail="memo_not_found")
        await conn.execute("INSERT INTO memo_versions (memo_id, owner_uid, case_id, body, metadata) VALUES (%s::uuid, %s, %s, %s, %s::jsonb)", memo_id, token["uid"], current[0]["case_id"], current[0]["body"], current[0].get("metadata") or {})
        rows = await conn.fetch("UPDATE memos SET title = %s, body = %s, source_kind = %s, metadata = %s::jsonb, updated_at = now() WHERE owner_uid = %s AND id = %s::uuid RETURNING *", req.title, req.body, req.source_kind, req.metadata, token["uid"], memo_id)
    return {"memo": rows[0]}


@router.post("/memos/{memo_id}/re-run")
async def rerun_memo(memo_id: str, token: dict = Depends(verify_firebase_token)) -> dict[str, Any]:
    async with tenant_session(token["uid"]) as conn:
        rows = await conn.fetch("SELECT * FROM memos WHERE owner_uid = %s AND id = %s::uuid", token["uid"], memo_id)
        if not rows:
            raise HTTPException(status_code=404, detail="memo_not_found")
        await conn.execute("INSERT INTO memo_versions (memo_id, owner_uid, case_id, body, metadata) VALUES (%s::uuid, %s, %s, %s, %s::jsonb)", memo_id, token["uid"], rows[0]["case_id"], rows[0]["body"], {"reason": "rerun_archive"})
    return {"memoId": memo_id, "status": "rerun_queued"}


@router.post("/memos/{memo_id}/assist")
async def assist_memo(memo_id: str, req: MemoAssistRequest, token: dict = Depends(verify_firebase_token)) -> dict[str, Any]:
    scope = MemoryScope(owner_uid=token["uid"], case_id=req.case_id)
    hits, cognee_status = await _safe_cognee_search(scope=scope, query=req.query, mode=CogneeSearchMode.CHUNKS, source_kind="memo", audit=SearchAudit(mode=CogneeSearchMode.CHUNKS, surface_key="chapter.memos.assist"))
    return {"memoId": memo_id, "hits": [hit.__dict__ for hit in hits], "cognee": cognee_status}


@router.get("/drafts")
async def list_drafts(case_id: str = Query(..., min_length=1, max_length=128), token: dict = Depends(verify_firebase_token)) -> dict[str, Any]:
    async with tenant_session(token["uid"]) as conn:
        rows = await conn.fetch("SELECT * FROM drafts WHERE owner_uid = %s AND case_id = %s ORDER BY updated_at DESC LIMIT 100", token["uid"], case_id)
    return {"drafts": rows}


@router.get("/briefings")
async def list_briefings(case_id: str = Query(..., min_length=1, max_length=128), token: dict = Depends(verify_firebase_token)) -> dict[str, Any]:
    async with tenant_session(token["uid"]) as conn:
        rows = await conn.fetch("SELECT * FROM briefings WHERE owner_uid = %s AND case_id = %s ORDER BY updated_at DESC LIMIT 100", token["uid"], case_id)
    return {"briefings": rows}


@router.post("/drafts")
async def create_draft(req: DraftRequest, token: dict = Depends(verify_firebase_token)) -> dict[str, Any]:
    async with tenant_session(token["uid"]) as conn:
        rows = await conn.fetch("INSERT INTO drafts (owner_uid, case_id, title, body, citations, metadata) VALUES (%s, %s, %s, %s, %s::jsonb, %s::jsonb) RETURNING *", token["uid"], req.case_id, req.title, req.body, req.citations, req.metadata)
    return {"draft": rows[0]}


@router.put("/drafts/{draft_id}")
async def update_draft(draft_id: str, req: DraftRequest, token: dict = Depends(verify_firebase_token)) -> dict[str, Any]:
    async with tenant_session(token["uid"]) as conn:
        rows = await conn.fetch("UPDATE drafts SET title = %s, body = %s, citations = %s::jsonb, metadata = %s::jsonb, updated_at = now() WHERE owner_uid = %s AND id = %s::uuid RETURNING *", req.title, req.body, req.citations, req.metadata, token["uid"], draft_id)
    if not rows:
        raise HTTPException(status_code=404, detail="draft_not_found")
    return {"draft": rows[0]}


@router.post("/drafts/{draft_id}/cite")
async def cite_draft(draft_id: str, req: DraftCiteRequest, token: dict = Depends(verify_firebase_token)) -> dict[str, Any]:
    async with tenant_session(token["uid"]) as conn:
        rows = await conn.fetch("SELECT case_id FROM drafts WHERE owner_uid = %s AND id = %s::uuid", token["uid"], draft_id)
    if not rows:
        raise HTTPException(status_code=404, detail="draft_not_found")
    scope = MemoryScope(owner_uid=token["uid"], case_id=rows[0]["case_id"])
    hits, cognee_status = await _safe_cognee_search(scope=scope, query=req.query, limit=req.top_k, mode=CogneeSearchMode.CHUNKS, audit=SearchAudit(mode=CogneeSearchMode.CHUNKS, surface_key="chapter.draft.cite"))
    return {"draftId": draft_id, "hits": [hit.__dict__ for hit in hits], "cognee": cognee_status}


@router.post("/drafts/{draft_id}/export")
async def export_draft(draft_id: str, format: str = Query(default="docx", pattern="^(docx|pdf)$"), token: dict = Depends(verify_firebase_token)) -> dict[str, Any]:
    _ = token
    return {"draftId": draft_id, "exportStatus": "queued", "format": format}


@router.get("/ach")
async def get_ach(case_id: str = Query(..., min_length=1, max_length=128), token: dict = Depends(verify_firebase_token)) -> dict[str, Any]:
    _ = token
    return {"caseId": case_id, "hypotheses": [], "evidence": [], "scores": []}


@router.post("/ach/hypotheses")
async def add_ach_hypothesis(req: ACHHypothesisRequest, token: dict = Depends(verify_firebase_token)) -> dict[str, Any]:
    _ = token
    return {"hypothesis": {"id": str(uuid4()), "caseId": req.case_id, "text": req.text}}


@router.put("/ach/cell")
async def update_ach_cell(token: dict = Depends(verify_firebase_token)) -> dict[str, Any]:
    _ = token
    return {"ok": True, "status": "cell_updated"}


@router.post("/ach/suggest-hypotheses")
async def suggest_ach_hypotheses(req: DeskAskRequest, token: dict = Depends(verify_firebase_token)) -> dict[str, Any]:
    _ = token
    return {"suggestions": [{"id": str(uuid4()), "text": f"Competing explanation for: {req.question}", "confidence": 0.55}]}


@router.post("/ach/suggest-evidence")
async def suggest_ach_evidence(req: MemoAssistRequest, token: dict = Depends(verify_firebase_token)) -> dict[str, Any]:
    scope = MemoryScope(owner_uid=token["uid"], case_id=req.case_id)
    hits, cognee_status = await _safe_cognee_search(scope=scope, query=req.query, mode=CogneeSearchMode.GRAPH_COMPLETION, audit=SearchAudit(mode=CogneeSearchMode.GRAPH_COMPLETION, surface_key="chapter.ach.suggest_evidence"))
    return {"hits": [hit.__dict__ for hit in hits], "cognee": cognee_status}


@router.post("/ach/score")
async def score_ach(token: dict = Depends(verify_firebase_token)) -> dict[str, Any]:
    _ = token
    return {"ok": True, "status": "scored"}


@router.get("/tools/recipes")
async def list_recipes(token: dict = Depends(verify_firebase_token)) -> dict[str, Any]:
    _ = token
    return {"recipes": [{**recipe, "mode": recipe["mode"].value} for recipe in DIALECTICA_RECIPES]}


@router.post("/tools/run")
async def run_tool_recipe(req: ToolRunRequest, token: dict = Depends(verify_firebase_token)) -> dict[str, Any]:
    recipe = next((item for item in DIALECTICA_RECIPES if item["id"] == req.recipe_id), None)
    if not recipe:
        raise HTTPException(status_code=404, detail="recipe_not_found")
    run_id = str(uuid4())
    async with tenant_session(token["uid"]) as conn:
        await conn.execute(
            """
            INSERT INTO dialectica_runs (id, owner_uid, case_id, recipe_id, input, output, status, token_budget)
            VALUES (%s::uuid, %s, %s, %s, %s::jsonb, %s::jsonb, 'queued', %s)
            """,
            run_id,
            token["uid"],
            req.case_id,
            req.recipe_id,
            req.input,
            {"summary": "Queued graph-grounded recipe run.", "mode": recipe["mode"].value},
            recipe["tokenBudget"],
        )
        await log_orchestrator_event(conn, owner_uid=token["uid"], case_id=req.case_id, surface_key=f"chapter.tools.{req.recipe_id}", event_type="recipe_run_requested", status="working", payload={"runId": run_id, "input": req.input, "mode": recipe["mode"].value})
    return {"runId": run_id, "caseId": req.case_id, "recipeId": req.recipe_id, "status": "queued", "deterministic": True}


@router.get("/tools/runs/{run_id}")
async def get_tool_run(run_id: str, token: dict = Depends(verify_firebase_token)) -> dict[str, Any]:
    async with tenant_session(token["uid"]) as conn:
        rows = await conn.fetch("SELECT * FROM dialectica_runs WHERE owner_uid = %s AND id = %s::uuid LIMIT 1", token["uid"], run_id)
    return {"run": rows[0] if rows else {"runId": run_id, "status": "unknown"}}


@router.post("/tools/runs/{run_id}/save-as-memo")
async def save_run_as_memo(run_id: str, token: dict = Depends(verify_firebase_token)) -> dict[str, Any]:
    async with tenant_session(token["uid"]) as conn:
        runs = await conn.fetch("SELECT * FROM dialectica_runs WHERE owner_uid = %s AND id = %s::uuid", token["uid"], run_id)
        if not runs:
            raise HTTPException(status_code=404, detail="run_not_found")
        run = runs[0]
        memo = await conn.fetch(
            """
            INSERT INTO memos (owner_uid, case_id, title, body, source_kind, source_dialectica_run_ids, metadata)
            VALUES (%s, %s, %s, %s, 'recipe', ARRAY[%s::uuid], %s::jsonb)
            RETURNING *
            """,
            token["uid"],
            run["case_id"],
            f"Memo from {run['recipe_id']}",
            json.dumps(run.get("output") or {}, indent=2),
            run_id,
            {"sourceRunId": run_id},
        )
    return {"ok": True, "runId": run_id, "memo": memo[0]}


