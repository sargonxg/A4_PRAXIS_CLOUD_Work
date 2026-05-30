"""PRAXIS AI Flows — structured Genkit flows for conflict intelligence.

Falls back to raw google-genai SDK if Genkit is not installed.
"""
from __future__ import annotations

import json
from typing import Any

try:
    from graphify_tacitus.extract import ACO_EXTRACTION_PROMPT
except ModuleNotFoundError:  # pragma: no cover - repo-root pytest path
    from backend.graphify_tacitus.extract import ACO_EXTRACTION_PROMPT

try:
    from ai.providers import GENKIT_MODEL_FLASH, GENKIT_MODEL_PRO
except ModuleNotFoundError:  # pragma: no cover - repo-root pytest path
    from backend.ai.providers import GENKIT_MODEL_FLASH, GENKIT_MODEL_PRO


# ── Pydantic models for structured output ────────────────────────────────────
try:
    from pydantic import BaseModel, Field

    class ACOExtractionOutput(BaseModel):
        nodes: list[dict] = Field(default_factory=list)
        edges: list[dict] = Field(default_factory=list)

    class SituationBrief(BaseModel):
        executive_summary: str = ""
        pivot_actors: list[dict] = Field(default_factory=list)
        faction_analysis: list[dict] = Field(default_factory=list)
        escalation_assessment: dict = Field(default_factory=dict)
        negotiation_space: dict = Field(default_factory=dict)
        intelligence_gaps: list[dict] = Field(default_factory=list)
        recommended_actions: list[str] = Field(default_factory=list)

except ImportError:
    ACOExtractionOutput = None  # type: ignore
    SituationBrief = None  # type: ignore


# ── Genkit flows (registered if Genkit is available) ─────────────────────────
def _register_flows(ai: Any) -> None:
    """Register Genkit flows on the given Genkit instance."""
    if ai is None:
        return

    try:
        @ai.flow()
        async def extract_aco_entities(text: str, source_file: str = "") -> dict:
            """Extract ACO conflict entities from text using the balanced model."""
            response = await ai.generate(
                model=GENKIT_MODEL_FLASH,
                prompt=f"{ACO_EXTRACTION_PROMPT}\n\nSOURCE TEXT:\n{text[:30_000]}",
                output=ACOExtractionOutput,
            )
            return response.output.model_dump() if response.output else {"nodes": [], "edges": []}

        @ai.flow()
        async def deep_extract_aco(text: str, source_file: str = "") -> dict:
            """Deep extraction for complex or long sources."""
            response = await ai.generate(
                model=GENKIT_MODEL_PRO,
                prompt=f"{ACO_EXTRACTION_PROMPT}\n\nSOURCE TEXT:\n{text[:60_000]}",
                output=ACOExtractionOutput,
            )
            return response.output.model_dump() if response.output else {"nodes": [], "edges": []}

        @ai.flow()
        async def generate_situation_brief(situation_context: str, graph_analysis: dict) -> dict:
            """Generate comprehensive intelligence brief from graph analysis."""
            response = await ai.generate(
                model=GENKIT_MODEL_PRO,
                prompt=f"""You are PRAXIS, a conflict intelligence AI.

{situation_context}

Graph Analysis Data:
{json.dumps(graph_analysis, indent=2)[:10_000]}

Generate a comprehensive intelligence brief.""",
                output=SituationBrief,
            )
            return response.output.model_dump() if response.output else {}

        @ai.flow()
        async def generate_tool_output(
            tool_name: str,
            tool_prompt: str,
            situation_context: str,
            model: str = GENKIT_MODEL_FLASH,
        ) -> dict:
            """Generic tool output generation with situation context."""
            response = await ai.generate(
                model=model,
                prompt=f"""You are PRAXIS, a conflict intelligence AI.

{situation_context}

{tool_prompt}

Respond with structured JSON only.""",
                output=dict,
            )
            return response.output or {}

        @ai.flow()
        async def research_with_grounding(query: str, situation_context: str) -> dict:
            """Research using Vertex AI with Google Search grounding."""
            response = await ai.generate(
                model=GENKIT_MODEL_FLASH,
                prompt=f"""Research the following question about this conflict situation.

{situation_context}

RESEARCH QUESTION: {query}

Provide findings with source citations.""",
                config={"google_search_retrieval": {"disable_attribution": False}},
                output=dict,
            )
            return response.output or {}

        @ai.flow()
        async def agentic_research_flow(request: dict) -> dict:
            """Plan, source, retrieve, verify, and synthesize for an AgentRun."""
            return run_agentic_research_flow(request)

    except Exception:
        pass  # Genkit flow registration is optional


# Register flows on the platform-level Genkit instance
try:
    from ai.genkit_app import ai as _platform_ai  # noqa: E402
except Exception:  # pragma: no cover - Genkit is optional in local backend tests
    try:
        from backend.ai.genkit_app import ai as _platform_ai  # noqa: E402
    except Exception:
        _platform_ai = None
_register_flows(_platform_ai)


AGENTIC_RESEARCH_PHASES = ["plan", "source", "retrieve", "verify", "synthesize"]


def build_agentic_research_flow_plan(query: str, capsule: dict[str, Any] | None = None) -> dict[str, Any]:
    """Build the deterministic plan envelope for the Genkit/ADK research flow."""
    capsule = capsule or {}
    sourcing = capsule.get("sourcing") if isinstance(capsule.get("sourcing"), dict) else {}
    min_sources = int(sourcing.get("minSourcesPerClaim") or sourcing.get("min_sources_per_claim") or 1)
    return {
        "query": query,
        "capsuleId": capsule.get("id"),
        "minSourcesPerClaim": max(0, min_sources),
        "steps": [
            {"phase": "plan", "intent": "clarify research objective, constraints, and output posture"},
            {"phase": "source", "intent": "select live grounding, SKC, and corpus lanes from capsule policy"},
            {"phase": "retrieve", "intent": "collect source receipts and corpus snippets"},
            {"phase": "verify", "intent": "enforce source thresholds before synthesis"},
            {"phase": "synthesize", "intent": "produce a cited answer with gaps and cautious language"},
        ],
    }


def verify_agentic_research_claims(
    *,
    claims: list[dict[str, Any]],
    min_sources_per_claim: int,
    max_ungrounded_claims: int,
) -> dict[str, Any]:
    supported: list[str] = []
    weak: list[str] = []
    unsupported: list[str] = []
    for claim in claims:
        source_ids = claim.get("sourceIds") or claim.get("source_ids") or []
        if not isinstance(source_ids, list):
            source_ids = []
        count = len({str(source_id) for source_id in source_ids if str(source_id).strip()})
        claim_id = str(claim.get("id") or claim.get("text") or "claim")
        if count == 0:
            unsupported.append(claim_id)
        elif count < min_sources_per_claim:
            weak.append(claim_id)
        else:
            supported.append(claim_id)

    failures: list[str] = []
    if len(unsupported) > max_ungrounded_claims:
        failures.append(
            f"{len(unsupported)} claim(s) have no supporting sources; maximum allowed is {max_ungrounded_claims}."
        )
    if weak:
        failures.append(f"{len(weak)} claim(s) have fewer than {min_sources_per_claim} source(s).")
    return {
        "status": "fail" if failures else "pass",
        "supportedClaims": supported,
        "weakClaims": weak,
        "unsupportedClaims": unsupported,
        "failures": failures,
    }


def run_agentic_research_flow(
    request: dict[str, Any],
    persist_event: Any | None = None,
) -> dict[str, Any]:
    """Run a deterministic AgentRun research-flow skeleton.

    The live model/tool execution remains owned by the runtime worker. This
    function provides the durable phase envelope and verification gate that
    Genkit/ADK can call while tests and dry runs stay network-free.
    """
    agent_run_id = str(request.get("agentRunId") or request.get("agent_run_id") or "")
    query = str(request.get("query") or request.get("objective") or "")
    capsule = request.get("capsule") if isinstance(request.get("capsule"), dict) else {}
    source_receipts = request.get("sourceReceipts") if isinstance(request.get("sourceReceipts"), list) else []
    claims = request.get("claims") if isinstance(request.get("claims"), list) else []
    max_ungrounded = int(request.get("maxUngroundedClaims") or request.get("max_ungrounded_claims") or 1)
    plan = build_agentic_research_flow_plan(query, capsule)

    emit_agent_run_flow_event(persist_event, agent_run_id, "plan", "Research plan created.", {"plan": plan})
    emit_agent_run_flow_event(persist_event, agent_run_id, "source", "Source lanes selected.", {"sourceCount": len(source_receipts)})
    emit_agent_run_flow_event(persist_event, agent_run_id, "retrieve", "Source receipts retrieved.", {"sourceCount": len(source_receipts)})
    verification = verify_agentic_research_claims(
        claims=claims,
        min_sources_per_claim=plan["minSourcesPerClaim"],
        max_ungrounded_claims=max_ungrounded,
    )
    emit_agent_run_flow_event(persist_event, agent_run_id, "verify", "Claim grounding verified.", verification)
    status = "ready" if verification["status"] == "pass" else "blocked"
    synthesis = {
        "status": status,
        "answer": "Synthesis ready." if status == "ready" else "Synthesis blocked by sourceability gate.",
        "sourceCount": len(source_receipts),
        "verification": verification,
    }
    emit_agent_run_flow_event(persist_event, agent_run_id, "synthesize", "Synthesis envelope prepared.", synthesis)
    return {**synthesis, "plan": plan}


def emit_agent_run_flow_event(
    persist_event: Any | None,
    agent_run_id: str,
    phase: str,
    message: str,
    data: dict[str, Any],
) -> None:
    if persist_event is None:
        return
    persist_event(
        {
            "agentRunId": agent_run_id,
            "phase": phase,
            "eventType": f"agentic_research.{phase}",
            "message": message,
            "data": data,
        }
    )


async def run_extraction(text: str, source_file: str = "", ai_instance: Any = None) -> dict:
    """Run ACO extraction using Genkit if available, else raw google-genai.

    This is the main entry point used by the pipeline.
    """
    instance = ai_instance or _platform_ai

    # Try Genkit flow
    if instance is not None:
        try:
            # Call the registered flow
            result = await instance.run_flow("extract_aco_entities", {"text": text, "source_file": source_file})
            if result:
                return result
        except Exception:
            pass

    # Fallback: raw google-genai via GeminiClient
    try:
        from services.gemini_client import GeminiClient
    except ModuleNotFoundError:  # pragma: no cover - repo-root pytest path
        from backend.services.gemini_client import GeminiClient
    client = GeminiClient()
    return await client.extract_aco(text, source_file)
