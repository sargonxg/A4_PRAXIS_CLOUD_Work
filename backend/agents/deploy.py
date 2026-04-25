"""Deploy the PRAXIS Deep Research Agent to Vertex AI Agent Engine.

Usage (from `backend/agents/`):

    python3 -m venv .venv
    source .venv/bin/activate           # PowerShell: .venv\\Scripts\\Activate.ps1
    pip install -r requirements.txt
    gcloud auth application-default login
    python deploy.py

After a successful deploy this script prints the engine resource path:

    projects/852128226674/locations/us-central1/reasoningEngines/<NUMERIC_ID>

Save the trailing <NUMERIC_ID> as Secret Manager secret
`praxis-vertex-adk-engine-id` and reference it from `cloudbuild.yaml` so
the Next.js frontend can pick it up via the `VERTEX_AGENT_ENGINE_ID`
env var. See `docs/USER_ACTION_LIST.md` §3 for the full walk-through.

Recipe verified against `docs/compass_artifact_wf-7af05074-…_text_markdown.md`
§R1 on 2026-04-25. The named pieces (planner / researcher / synthesizer)
match the 3-phase architecture the PRAXIS Deep Research Agent route
expects.
"""
from __future__ import annotations

import os
import sys

import vertexai
from vertexai import agent_engines
from google.adk.agents import LlmAgent, SequentialAgent
from google.adk.tools import google_search


PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT", "praxisbytacitus")
LOCATION = os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1")
STAGING_BUCKET = os.environ.get(
    "PRAXIS_AGENT_STAGING_BUCKET",
    f"gs://{PROJECT_ID}-agent-staging",
)


PLANNER_INSTRUCTION = (
    "You are PRAXIS' research planner. Read the user question and "
    "decompose it into 3 to 5 specific, well-scoped sub-queries that "
    "together cover the question. Each sub-query must be answerable by "
    "a focused Google Search. Output strict JSON of the form: "
    '{"plan":[{"id":"q1","query":"..."},'
    ' {"id":"q2","query":"..."}]}'
)

RESEARCHER_INSTRUCTION = (
    "You are PRAXIS' web researcher. Execute every sub-query in {plan}. "
    "For each, call the google_search tool, read the top results, and "
    "extract direct quotes plus source URLs. Prefer authoritative sources: "
    "UN bodies, Crisis Group, ACLED, ReliefWeb, peer-reviewed work, "
    "established media of record. Output strict JSON of the form: "
    '{"findings":[{"q":"q1","quote":"...","url":"https://...","source_label":"Crisis Group"}]}'
)

SYNTHESIZER_INSTRUCTION = (
    "You are PRAXIS' senior analyst. Using the structured findings in "
    "{findings}, write a Markdown research brief for a peace and "
    "security professional. Structure: (1) Headline (one sentence). "
    "(2) Executive summary (3 to 5 bullets). (3) Detailed findings — "
    "each section cites sources by label and URL. (4) Confidence "
    "self-assessment (HIGH / MEDIUM / LOW per section). (5) Suggested "
    "follow-up queries. Maintain UN diplomatic register — use 'armed "
    "conflict' not 'war', 'non-State armed group' not 'rebels'. Cite "
    "every factual claim. Avoid speculation; flag gaps."
)


def build_agent() -> SequentialAgent:
    planner = LlmAgent(
        name="planner",
        model="gemini-3-flash",
        instruction=PLANNER_INSTRUCTION,
        output_key="plan",
    )

    researcher = LlmAgent(
        name="researcher",
        model="gemini-3-flash",
        instruction=RESEARCHER_INSTRUCTION,
        tools=[google_search],
        output_key="findings",
    )

    synthesizer = LlmAgent(
        name="synthesizer",
        model="gemini-3.1-pro-preview",
        instruction=SYNTHESIZER_INSTRUCTION,
    )

    return SequentialAgent(
        name="praxis_deep_research_v1",
        sub_agents=[planner, researcher, synthesizer],
    )


def main() -> int:
    print(f"[deploy] project={PROJECT_ID} location={LOCATION}")
    print(f"[deploy] staging bucket={STAGING_BUCKET}")

    vertexai.init(
        project=PROJECT_ID,
        location=LOCATION,
        staging_bucket=STAGING_BUCKET,
    )

    agent = build_agent()
    print("[deploy] uploading agent code archive and creating ReasoningEngine…")

    engine = agent_engines.create(
        agent_engine=agent,
        requirements=[
            "google-cloud-aiplatform[adk,agent_engines]>=1.148.1",
            "google-adk==1.31.1",
            "google-genai>=1.0.0",
        ],
        display_name="praxis_deep_research_v1",
    )

    print()
    print("✅ Deploy succeeded.")
    print()
    print("Engine resource path:")
    print(f"  {engine.api_resource.name}")
    print()
    numeric_id = engine.api_resource.name.rsplit("/", 1)[-1]
    print("Numeric engine ID (store this as the secret value):")
    print(f"  {numeric_id}")
    print()
    print("Next steps (see docs/USER_ACTION_LIST.md §3):")
    print(
        "  echo -n '"
        + numeric_id
        + "' | gcloud secrets create praxis-vertex-adk-engine-id "
        "--data-file=- --project="
        + PROJECT_ID
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
