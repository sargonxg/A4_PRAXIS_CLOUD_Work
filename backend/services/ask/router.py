"""Inspectable v7 Ask routing heuristics.

The first v7 router is deliberately simple. It does not hide routing behind a
black-box model; it classifies common analyst intents, respects explicit skill
selection, and records the decision so the UI can show what PRAXIS staged.
"""
from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Literal

from services.ask.types import AskMode, AskRouteAction

AskIntent = Literal[
    "answer",
    "structure",
    "validate",
    "compare",
    "monitor",
    "draft",
    "plan",
    "extract",
    "match",
    "simulate",
]


@dataclass(frozen=True)
class AskRoutingDecision:
    action: AskRouteAction
    intent: AskIntent
    confidence: float
    rationale: str
    candidate_skill_ids: list[str]
    skill_id: str | None = None
    subagent_id: str | None = None

    def to_dict(self) -> dict:
        return asdict(self)


INTENT_SKILLS: dict[AskIntent, str] = {
    "structure": "cross.stakeholder-power-interest",
    "validate": "cross.contradiction-finder",
    "compare": "cross.timeline-comparator",
    "monitor": "cross.indicators-tracker",
    "extract": "entities.gliner",
    "match": "economic.sanctions-impact-model",
    "simulate": "simulation.policy_abm",
}

MODE_SUBAGENTS: dict[AskMode, str] = {
    "deep": "context-preparer",
    "plan": "context-preparer",
    "memo": "memo-drafter",
    "brief": "memo-drafter",
    "talking_points": "output-refiner",
}

DEFAULT_SKILL_CANDIDATES = [
    "research-sources",
    "actors-stakeholders",
    "briefing-studio",
]

INTENT_SKILL_CANDIDATES: dict[AskIntent, list[str]] = {
    "answer": ["research-sources", "actors-stakeholders", "briefing-studio"],
    "structure": ["actors-stakeholders", "graph-mapper", "timeline-builder"],
    "validate": ["assumption-auditor", "red-team-review", "cross.contradiction-finder"],
    "compare": ["cross.timeline-comparator", "research-sources", "briefing-studio"],
    "monitor": ["cross.indicators-tracker", "research-sources", "briefing-studio"],
    "draft": ["briefing-studio", "handover-generator", "talking-points"],
    "plan": ["context-builder", "briefing-studio", "research-sources"],
    "extract": ["entities.gliner", "research-sources", "graph-mapper"],
    "match": ["economic.sanctions-impact-model", "entities.gliner", "research-sources"],
    "simulate": ["simulation.policy_abm", "red-team-review", "briefing-studio"],
}

INTENT_PATTERNS: list[tuple[AskIntent, tuple[str, ...]]] = [
    ("draft", ("draft", "write", "memo", "brief", "talking points", "handover")),
    ("plan", ("plan", "next steps", "what should i do", "checklist")),
    ("structure", ("stakeholder", "actor map", "power-interest", "timeline", "map")),
    ("validate", ("contradiction", "red team", "red-team", "devil", "assumption", "premortem")),
    ("compare", ("compare", "contrast", "versus", " vs ")),
    ("monitor", ("monitor", "track", "indicator", "early warning", "detect changes")),
    ("extract", ("extract", "pull entities", "entities", "claims from")),
    ("match", ("sanctions", "designation", "match list", "beneficial ownership")),
    ("simulate", ("simulate", "model the impact", "abm", "scenario model")),
]


def classify_intent(query: str, mode: AskMode) -> tuple[AskIntent, float, str]:
    if mode in {"memo", "brief", "talking_points"}:
        return "draft", 0.82, f"Mode {mode} implies drafting output."
    if mode == "plan":
        return "plan", 0.82, "Plan mode implies an executable next-step plan."
    if mode == "deep":
        return "answer", 0.72, "Deep mode keeps answer intent but routes through research preparation."

    normalized = f" {query.lower()} "
    for intent, patterns in INTENT_PATTERNS:
        if any(pattern in normalized for pattern in patterns):
            return intent, 0.76, f"Matched {intent} routing phrase."
    return "answer", 0.62, "No specialist intent detected; defaulting to direct answer."


def route_ask(query: str, mode: AskMode, skill_id: str | None = None) -> AskRoutingDecision:
    intent, confidence, rationale = classify_intent(query, mode)
    candidates = candidate_skills(intent, skill_id)

    if skill_id:
        return AskRoutingDecision(
            action="run_skill",
            intent=intent,
            confidence=0.95,
            rationale="User explicitly staged an Analyst Skill.",
            candidate_skill_ids=candidates,
            skill_id=skill_id,
        )

    if mode in MODE_SUBAGENTS:
        return AskRoutingDecision(
            action="run_subagent_plan",
            intent=intent,
            confidence=max(confidence, 0.8),
            rationale=rationale,
            candidate_skill_ids=candidates,
            subagent_id=MODE_SUBAGENTS[mode],
        )

    skill = INTENT_SKILLS.get(intent)
    if skill:
        return AskRoutingDecision(
            action="run_skill",
            intent=intent,
            confidence=confidence,
            rationale=rationale,
            candidate_skill_ids=candidates,
            skill_id=skill,
        )

    if confidence < 0.5:
        return AskRoutingDecision(
            action="clarify",
            intent=intent,
            confidence=confidence,
            rationale="Routing confidence below direct-answer threshold.",
            candidate_skill_ids=candidates,
        )

    return AskRoutingDecision(
        action="direct_answer",
        intent=intent,
        confidence=confidence,
        rationale=rationale,
        candidate_skill_ids=candidates,
    )


def candidate_skills(intent: AskIntent, staged_skill_id: str | None = None) -> list[str]:
    ordered = [
        *( [staged_skill_id] if staged_skill_id else [] ),
        *INTENT_SKILL_CANDIDATES.get(intent, DEFAULT_SKILL_CANDIDATES),
        *DEFAULT_SKILL_CANDIDATES,
    ]
    seen = set()
    result = []
    for skill in ordered:
        if not skill or skill in seen:
            continue
        seen.add(skill)
        result.append(skill)
        if len(result) == 3:
            break
    return result
