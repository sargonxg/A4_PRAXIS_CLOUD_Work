"""Research API route shape for v5 source augmentation."""
from __future__ import annotations

import json
from collections.abc import Iterator

try:
    from fastapi import APIRouter, HTTPException
    from fastapi.responses import StreamingResponse
    from pydantic import BaseModel
except Exception:  # pragma: no cover - local focused tests do not need FastAPI
    APIRouter = None  # type: ignore
    HTTPException = Exception  # type: ignore
    StreamingResponse = None  # type: ignore
    BaseModel = object  # type: ignore

from backend.agents.source_augmenter.state_machine import run_research_state_machine


if APIRouter is not None:
    router = APIRouter(prefix="/api/research", tags=["research"])
else:
    router = None


class ResearchRunRequest(BaseModel):
    question: str
    contextId: str
    userModelId: str


def stream_research_report(req: ResearchRunRequest) -> Iterator[str]:
    state = run_research_state_machine(req.question, req.contextId, req.userModelId)
    for sub_question in state.sub_questions:
        yield _sse("subQuestionGenerated", {"question": sub_question})
    for source in state.sources:
        yield _sse("sourceFound", source)
    for finding in state.findings:
        yield _sse("extractionCandidate", finding)
    yield _sse("finalReport", state.report)


if router is not None:
    @router.post("/run")
    def run_research(req: ResearchRunRequest):
        if not req.question or not req.contextId or not req.userModelId:
            raise HTTPException(status_code=400, detail="question, contextId, and userModelId are required")
        return StreamingResponse(stream_research_report(req), media_type="text/event-stream")


def _sse(event: str, payload: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(payload)}\n\n"
