"""PRAXIS AI Flows — structured Genkit flows for conflict intelligence.

Falls back to raw google-genai SDK if Genkit is not installed.
"""
from __future__ import annotations

import json
from typing import Any

from graphify_tacitus.extract import ACO_EXTRACTION_PROMPT


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
            """Extract ACO conflict entities from text using Gemini 2.5 Flash."""
            response = await ai.generate(
                model="googleai/gemini-3-flash",
                prompt=f"{ACO_EXTRACTION_PROMPT}\n\nSOURCE TEXT:\n{text[:30_000]}",
                output=ACOExtractionOutput,
            )
            return response.output.model_dump() if response.output else {"nodes": [], "edges": []}

        @ai.flow()
        async def deep_extract_aco(text: str, source_file: str = "") -> dict:
            """Deep extraction with gemini-3.1-pro-preview for complex or long sources."""
            response = await ai.generate(
                model="googleai/gemini-3.1-pro-preview",
                prompt=f"{ACO_EXTRACTION_PROMPT}\n\nSOURCE TEXT:\n{text[:60_000]}",
                output=ACOExtractionOutput,
            )
            return response.output.model_dump() if response.output else {"nodes": [], "edges": []}

        @ai.flow()
        async def generate_situation_brief(situation_context: str, graph_analysis: dict) -> dict:
            """Generate comprehensive intelligence brief from graph analysis."""
            response = await ai.generate(
                model="googleai/gemini-3.1-pro-preview",
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
            model: str = "googleai/gemini-3-flash",
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
                model="googleai/gemini-3-flash",
                prompt=f"""Research the following question about this conflict situation.

{situation_context}

RESEARCH QUESTION: {query}

Provide findings with source citations.""",
                config={"google_search_retrieval": {"disable_attribution": False}},
                output=dict,
            )
            return response.output or {}

    except Exception:
        pass  # Genkit flow registration is optional


# Register flows on the platform-level Genkit instance
from ai.genkit_app import ai as _platform_ai  # noqa: E402
_register_flows(_platform_ai)


async def run_extraction(text: str, source_file: str = "", ai_instance: Any = None) -> dict:
    """Run ACO extraction using Genkit if available, else raw google-genai.

    This is the main entry point used by the pipeline.
    """
    instance = ai_instance or _platform_ai

    # Try Genkit flow
    if instance is not None:
        try:
            from ai.genkit_app import _platform_ai as platform_ai
            # Call the registered flow
            result = await instance.run_flow("extract_aco_entities", {"text": text, "source_file": source_file})
            if result:
                return result
        except Exception:
            pass

    # Fallback: raw google-genai via GeminiClient
    from services.gemini_client import GeminiClient
    client = GeminiClient()
    return await client.extract_aco(text, source_file)
