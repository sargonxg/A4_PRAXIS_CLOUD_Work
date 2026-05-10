"""Simplified v5 source augmenter state machine.

The full LangGraph runtime can wrap this deterministic shape. The ordered
markers are audit-enforced so future changes preserve the research contract.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from backend.services.google_grounded_search import grounded_search
from backend.services.wikidata_sparql import actor_disambiguation


@dataclass
class ResearchState:
    question: str
    context_id: str
    user_model_id: str
    sub_questions: list[str] = field(default_factory=list)
    sources: list[dict[str, Any]] = field(default_factory=list)
    findings: list[dict[str, Any]] = field(default_factory=list)
    receipts: list[dict[str, Any]] = field(default_factory=list)
    report: dict[str, Any] = field(default_factory=dict)
    steps: list[str] = field(default_factory=list)


def run_research_state_machine(question: str, context_id: str, user_model_id: str) -> ResearchState:
    state = ResearchState(question=question, context_id=context_id, user_model_id=user_model_id)

    # [R1] decompose
    state.sub_questions = _decompose(question)
    state.steps.append("R1:decompose")

    # [R2] source_pick
    source_plan = ["vetted-feeds", "wikidata", "google-grounded"]
    state.steps.append("R2:source_pick")

    # [R3] fan_out
    dispatched = [(source, sub_question) for source in source_plan for sub_question in state.sub_questions]
    state.steps.append("R3:fan_out")

    # [R4] fetch_parse
    for source, sub_question in dispatched[:6]:
        if source == "wikidata":
            state.sources.extend({"tier": "T2", "source": "wikidata", "value": actor.__dict__} for actor in actor_disambiguation(sub_question))
        if source == "google-grounded":
            state.sources.extend(result.__dict__ for result in grounded_search(sub_question, max_results=2))
    state.steps.append("R4:fetch_parse")

    # [R5] relevance_score
    for index, source in enumerate(state.sources):
        source["relevance"] = max(0.5, 1.0 - (index * 0.05))
    state.steps.append("R5:relevance_score")

    # [R6] cross_verify
    verified = len({source.get("url") or source.get("source") for source in state.sources}) >= 2
    state.steps.append("R6:cross_verify")

    # [R7] receipts
    state.receipts = [{"tier": source.get("tier", "T5"), "cross_verified": verified, "source": source} for source in state.sources]
    state.steps.append("R7:receipts")

    # [R8] extract
    candidates = [{"primitive": "Claim", "text": state.question, "confidence": 0.62}]
    state.steps.append("R8:extract")

    # [R9] resolve
    resolved = actor_disambiguation(state.question)
    state.steps.append("R9:resolve")

    # [R10] firewall
    allowed = verified or not state.receipts
    state.steps.append("R10:firewall")

    # [R11] route
    route = "evidence" if allowed else "review-queue"
    state.steps.append("R11:route")

    # [R12] commit
    state.findings = [{"route": route, "candidate": item, "resolved": [actor.__dict__ for actor in resolved]} for item in candidates]
    state.steps.append("R12:commit")

    # [R13] respond
    state.report = {
        "executive_summary": f"Research prepared for {question}",
        "key_findings": state.findings,
        "source_matrix": state.receipts,
        "gaps": [] if state.sources else ["Grounded search unavailable in local fallback."],
        "contradictions": [],
        "follow_ups": state.sub_questions,
        "cost_estimate_usd": 0.12,
    }
    state.steps.append("R13:respond")
    return state


def _decompose(question: str) -> list[str]:
    clean = question.strip().rstrip("?")
    return [
        clean,
        f"What authoritative sources address {clean}?",
        f"What contradictions or gaps matter for {clean}?",
    ]
