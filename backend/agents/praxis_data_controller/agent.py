"""PRAXIS Data Controller ADK agent.

This agent is the managed Google Agent Runtime lane for long-running PRAXIS
work. PRAXIS remains the product source of truth: ContextCapsules, AgentRun
events, approvals, and output placement are mirrored back through the Next.js
worker before anything becomes user-visible or canonical.

Official patterns used:
- ADK App deployment to Agent Runtime:
  https://google.github.io/adk-docs/deploy/agent-runtime/
- ADK BigQuery toolset:
  https://google.github.io/adk-docs/integrations/bigquery-agent-analytics/
- Vertex RAG Store retrieval config:
  https://google.github.io/adk-docs/api-reference/agentconfig/
"""
from __future__ import annotations

import os
from typing import Any

import google.auth
from google.adk.agents import Agent
from google.adk.apps import App
from google.adk.models.google_llm import Gemini
from google.adk.tools.bigquery import BigQueryCredentialsConfig, BigQueryToolset


PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT", "praxisbytacitus")
LOCATION = os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")
BQ_LOCATION = os.environ.get("BQ_LOCATION", "US")
RAG_CORPUS = os.environ.get("VERTEX_RAG_CORPUS") or os.environ.get("VERTEX_RAG_CORPUS_RESOURCE")

os.environ["GOOGLE_CLOUD_PROJECT"] = PROJECT_ID
os.environ["GOOGLE_CLOUD_LOCATION"] = LOCATION
os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "True"


def capsule_context_reader(capsule_id: str, requested_sections: list[str] | None = None) -> dict[str, Any]:
    """Return the PRAXIS-owned context request the Next.js worker must fulfill."""
    return {
        "status": "requires_praxis_context",
        "capsuleId": capsule_id,
        "requestedSections": requested_sections or ["user", "situation", "source", "output", "memory"],
        "canonicalStore": "Firestore ContextCapsules",
        "rule": "The ADK agent may read snapshots supplied by PRAXIS; it must not mutate capsule state.",
    }


def vertex_rag_retrieval(repository_id: str, query: str) -> dict[str, Any]:
    """Describe the RAG retrieval request that PRAXIS will receipt and review."""
    return {
        "status": "rag_request_planned" if RAG_CORPUS else "rag_corpus_missing",
        "repositoryId": repository_id,
        "query": query,
        "ragCorpus": RAG_CORPUS,
        "requiredReceiptFields": ["repositoryId", "ragCorpus", "sourceDocumentIds", "chunkIds", "retrievedAt"],
        "reviewGate": "human-review-required",
    }


def review_card_proposer(capsule_id: str, proposal_type: str, summary: str) -> dict[str, Any]:
    """Propose, but do not apply, a PRAXIS review card."""
    return {
        "status": "proposal_only",
        "capsuleId": capsule_id,
        "proposalType": proposal_type,
        "summary": summary,
        "canonicalMutation": False,
        "reviewGate": "human-review-required",
    }


def build_tools() -> list[Any]:
    credentials, _ = google.auth.default(scopes=["https://www.googleapis.com/auth/cloud-platform"])
    bigquery_toolset = BigQueryToolset(
        credentials_config=BigQueryCredentialsConfig(credentials=credentials)
    )
    return [
        capsule_context_reader,
        vertex_rag_retrieval,
        review_card_proposer,
        bigquery_toolset,
    ]


root_agent = Agent(
    name="praxis_data_controller",
    model=Gemini(model=os.environ.get("PRAXIS_ADK_MODEL", "gemini-flash-latest")),
    instruction="""You are PRAXIS' Google data-controller agent.

You operate behind queued PRAXIS AgentRuns. Use ContextCapsules as canonical
context, Vertex RAG retrieval for approved document repositories, and BigQuery
only for bounded analytics. Do not publish, send messages, mutate capsules,
write graph state, or mark unsupported claims resolved. Propose PRAXIS review
cards for source gaps, graph deltas, or context improvements. Every answer must
name the repository, source ids, BigQuery tables or models used, uncertainty,
and the next human review action.
""",
    tools=build_tools(),
)

app = App(
    name="praxis_data_controller",
    root_agent=root_agent,
)
