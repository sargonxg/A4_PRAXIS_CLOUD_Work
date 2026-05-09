"""v7 Ask execution helpers.

The execution layer is deliberately small for the first cutover slice: it turns
the resolved Core Context snapshot into a prompt for direct-answer Ask turns and
records enough metadata for the UI and audits to prove which context was used.
"""
from __future__ import annotations

from dataclasses import dataclass, asdict
from typing import Any

from config import get_settings
from services.ask.router import AskRoutingDecision
from services.cores.resolver import CoreContextSnapshot, ResolvedCore
from services.gemini_client import GeminiClient

SUPPORTED_CORE_SKILLS = {
    "research-sources": {
        "label": "Research & Sources",
        "output": "source pack",
        "required": {"situation", "source", "document"},
    },
    "actors-stakeholders": {
        "label": "Actors & Stakeholders",
        "output": "stakeholder map",
        "required": {"situation", "graph", "source"},
    },
    "briefing-studio": {
        "label": "Briefing Studio",
        "output": "briefing outline",
        "required": {"user", "situation", "source", "document", "graph", "output"},
    },
}


@dataclass(frozen=True)
class AskExecutionResult:
    runtime: str
    content: str
    prompt: str
    token_count: int
    cost_usd: float
    citations: list[dict[str, Any]]
    metadata: dict[str, Any]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


async def execute_ask_turn(
    query: str,
    mode: str,
    routing: AskRoutingDecision,
    core_context: CoreContextSnapshot,
) -> AskExecutionResult:
    """Execute the safest v7 action available for this Ask turn.

    Direct-answer turns use the core prompt directly. The first read-only
    consolidated skills also execute from the same core snapshot; unsupported
    skills and subagent plans keep an honest staged receipt.
    """
    prompt = build_skill_prompt(query, mode, routing.skill_id, core_context) if routing.action == "run_skill" else build_direct_answer_prompt(query, mode, core_context)
    citations = _core_citations(core_context)
    metadata = {
        "routing": routing.to_dict(),
        "coreContext": core_context.to_dict(),
        "promptKind": "v7.ask.skill" if routing.action == "run_skill" else "v7.ask.direct_answer",
    }

    if routing.action == "run_skill" and routing.skill_id in SUPPORTED_CORE_SKILLS:
        return await _execute_supported_skill(query, mode, routing.skill_id, prompt, core_context, citations, metadata)

    if routing.action != "direct_answer":
        return AskExecutionResult(
            runtime="core_context_preview",
            content=(
                "This Ask turn is saved with a resolved Context Core snapshot. "
                f"PRAXIS routed it as {routing.action}; the dedicated skill/subagent executor "
                "will run in the next cutover slice."
            ),
            prompt=prompt,
            token_count=0,
            cost_usd=0,
            citations=citations,
            metadata={**metadata, "aiExecution": "pending_executor"},
        )

    settings = get_settings()
    if not settings.praxis_v7_ask_ai_enabled:
        return AskExecutionResult(
            runtime="core_context_preview",
            content=_preview_direct_answer(query, core_context),
            prompt=prompt,
            token_count=0,
            cost_usd=0,
            citations=citations,
            metadata={**metadata, "aiExecution": "disabled_by_flag"},
        )

    client = GeminiClient()
    try:
        answer = await client.generate(
            prompt,
            model=settings.gemini_model,
            response_mime_type="text/plain",
        )
        cleaned = answer.strip() or _preview_direct_answer(query, core_context)
        return AskExecutionResult(
            runtime="vertex_core_context",
            content=cleaned,
            prompt=prompt,
            token_count=_estimate_tokens(prompt, cleaned),
            cost_usd=0,
            citations=citations,
            metadata={**metadata, "aiExecution": "vertex", "model": settings.gemini_model},
        )
    except Exception as exc:  # pragma: no cover - exercised only with live Vertex credentials.
        return AskExecutionResult(
            runtime="core_context_preview",
            content=(
                f"{_preview_direct_answer(query, core_context)}\n\n"
                "Live model execution did not complete, so PRAXIS saved the context-grounded preview instead."
            ),
            prompt=prompt,
            token_count=0,
            cost_usd=0,
            citations=citations,
            metadata={
                **metadata,
                "aiExecution": "vertex_failed_open",
                "error": exc.__class__.__name__,
            },
        )


def build_direct_answer_prompt(query: str, mode: str, core_context: CoreContextSnapshot) -> str:
    core_lines = "\n".join(_core_prompt_line(core) for core in core_context.resolved_cores)
    advisories = "\n".join(f"- {advisory}" for advisory in core_context.advisories) or "- None"
    ontology = core_context.ontology_binding or {}
    return f"""You are Ask PRAXIS, the analyst command plane for a policy knowledge workspace.

Answer only from the resolved Context Cores below. If the cores are thin, say what is missing and propose the smallest next step. Use concise policy-analysis prose, distinguish known context from inference, and do not invent sources.

Mode: {mode}
User question: {query}
Context health: {core_context.context_health}/100
Ontology binding: {ontology.get("ontologyId", "unbound")} {ontology.get("ontologyVersion", "")}

Resolved cores:
{core_lines or "- No cores resolved."}

Advisories:
{advisories}

Return:
1. Direct answer.
2. Why this follows from the attached cores.
3. What PRAXIS should ask for next if context is missing.
"""


def build_skill_prompt(
    query: str,
    mode: str,
    skill_id: str | None,
    core_context: CoreContextSnapshot,
) -> str:
    spec = SUPPORTED_CORE_SKILLS.get(skill_id or "")
    label = spec["label"] if spec else skill_id or "Unknown skill"
    output = spec["output"] if spec else "skill result"
    core_lines = "\n".join(_core_prompt_line(core) for core in core_context.resolved_cores)
    advisories = "\n".join(f"- {advisory}" for advisory in core_context.advisories) or "- None"
    return f"""You are Ask PRAXIS executing the Analyst Skill: {label}.

Use only the resolved Context Cores below. Produce a compact {output} that can be saved into the analyst workspace. If the context is too thin, return the best partial result and name the next core to strengthen.

Mode: {mode}
User request: {query}
Context health: {core_context.context_health}/100

Resolved cores:
{core_lines or "- No cores resolved."}

Advisories:
{advisories}

Return:
1. Skill result.
2. Evidence or core basis.
3. Follow-up action to improve the core model.
"""


async def _execute_supported_skill(
    query: str,
    mode: str,
    skill_id: str,
    prompt: str,
    core_context: CoreContextSnapshot,
    citations: list[dict[str, Any]],
    metadata: dict[str, Any],
) -> AskExecutionResult:
    settings = get_settings()
    if settings.praxis_v7_ask_ai_enabled:
        client = GeminiClient()
        try:
            answer = await client.generate(
                prompt,
                model=settings.gemini_model,
                response_mime_type="text/plain",
            )
            cleaned = answer.strip() or _preview_skill_result(query, skill_id, core_context)
            return AskExecutionResult(
                runtime="vertex_core_skill",
                content=cleaned,
                prompt=prompt,
                token_count=_estimate_tokens(prompt, cleaned),
                cost_usd=0,
                citations=citations,
                metadata={**metadata, "aiExecution": "vertex", "model": settings.gemini_model, "skillId": skill_id},
            )
        except Exception as exc:  # pragma: no cover - live credential path.
            return AskExecutionResult(
                runtime="core_skill_preview",
                content=(
                    f"{_preview_skill_result(query, skill_id, core_context)}\n\n"
                    "Live model execution did not complete, so PRAXIS saved the core-grounded skill preview instead."
                ),
                prompt=prompt,
                token_count=0,
                cost_usd=0,
                citations=citations,
                metadata={
                    **metadata,
                    "aiExecution": "vertex_failed_open",
                    "error": exc.__class__.__name__,
                    "skillId": skill_id,
                },
            )

    return AskExecutionResult(
        runtime="core_skill_preview",
        content=_preview_skill_result(query, skill_id, core_context),
        prompt=prompt,
        token_count=0,
        cost_usd=0,
        citations=citations,
        metadata={**metadata, "aiExecution": "disabled_by_flag", "skillId": skill_id},
    )


def _preview_skill_result(query: str, skill_id: str, core_context: CoreContextSnapshot) -> str:
    spec = SUPPORTED_CORE_SKILLS[skill_id]
    kinds = {core.kind for core in core_context.resolved_cores}
    missing = sorted(spec["required"] - kinds)
    basis = _core_basis(core_context)
    if skill_id == "research-sources":
        result = (
            "Research & Sources staged a source-pack plan: confirm the active policy question, "
            "review source/document coverage, then collect or promote receipts for the highest-risk gaps."
        )
    elif skill_id == "actors-stakeholders":
        result = (
            "Actors & Stakeholders staged a stakeholder-map pass: extract actor positions, interests, "
            "constraints, leverage, and open questions from the Situation and Graph cores."
        )
    else:
        result = (
            "Briefing Studio staged a decision-output outline: bottom line, context, analysis, options, "
            "recommendation, evidence notes, and next questions."
        )

    next_step = (
        f"Strengthen {', '.join(missing)} core(s) before final generation."
        if missing
        else "Context is sufficient for a first-pass skill result; review citations before export."
    )
    return (
        f"{result}\n\n"
        f"Request: {query.strip()}\n"
        f"Core basis: {basis}\n"
        f"Next action: {next_step}"
    )


def _core_basis(core_context: CoreContextSnapshot) -> str:
    if not core_context.resolved_cores:
        return "no materialized cores yet"
    return "; ".join(f"{core.kind}: {core.name}" for core in core_context.resolved_cores[:5])


def _preview_direct_answer(query: str, core_context: CoreContextSnapshot) -> str:
    names = [f"{core.kind}: {core.name}" for core in core_context.resolved_cores]
    context = "; ".join(names[:4]) if names else "no materialized cores yet"
    missing = ""
    if core_context.advisories:
        missing = f" Advisory: {core_context.advisories[0]}"
    return (
        f"PRAXIS staged this question against {context}. "
        f"Question: {query.strip()} "
        "This is ready for calibrated direct-answer execution from the resolved Context Core snapshot."
        f"{missing}"
    )


def _core_prompt_line(core: ResolvedCore) -> str:
    tags = ", ".join(core.tags[:5]) if core.tags else "no tags"
    implicit = "implicit" if core.implicit else "attached"
    return (
        f"- [{implicit}] {core.kind} core {core.name} ({core.id}): "
        f"{core.summary or 'metadata available'}; tags={tags}; "
        f"metadata_keys={', '.join(core.metadata_keys[:8]) or 'none'}"
    )


def _core_citations(core_context: CoreContextSnapshot) -> list[dict[str, Any]]:
    citations: list[dict[str, Any]] = []
    for index, core in enumerate(core_context.resolved_cores, start=1):
        citations.append({
            "citation_index": index,
            "source_kind": "core",
            "source_id": core.id,
            "title": core.name,
            "excerpt": core.summary,
            "confidence": 0.8 if core.kind in {"user", "situation"} else 0.7,
            "metadata": {
                "kind": core.kind,
                "implicit": core.implicit,
                "ontologyId": core.ontology_id,
                "ontologyVersion": core.ontology_version,
            },
        })
    return citations


def _estimate_tokens(prompt: str, answer: str) -> int:
    # Cheap deterministic estimate until Vertex usage accounting is wired.
    return max(1, round((len(prompt) + len(answer)) / 4))
