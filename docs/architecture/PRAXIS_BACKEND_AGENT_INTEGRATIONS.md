# PRAXIS optional backend agent integrations

`backend/agents/` contains the Python ADK integration and earlier experiments.
The live Home research journey runs through the PRAXIS TypeScript AgentRun
ledger and Cloud Tasks worker. This folder does not define a separate public
research application or replace that runtime.

Start with the [canonical runtime architecture](PRAXIS_AGENT_RUNTIME_ARCHITECTURE.md)
and the [Google agent platform runbook](../runbooks/GOOGLE_AGENT_PLATFORM_FOR_PRAXIS.md).
The [current acceptance receipt](../reviews/2026-09-29-praxis-production-acceptance.md)
distinguishes verified live journeys from optional integrations.

## Current boundaries

- Firestore owns ContextCapsules, source documents and saved products.
- Cloud SQL owns durable AgentRuns, tool calls and approvals; Cloud Tasks
  dispatches the existing authenticated worker.
- Genkit handles bounded typed work. Selected ADK work can execute through
  the existing adapter when its provider configuration is available.
- Provider sessions, Python checkpoints and graph projections do not replace
  canonical product state. Upstream changes enter PRAXIS as review proposals.
- The presence of a script or a successful deployment does not establish
  enabled production use. Verify the configured provider and its real journey.

## Files under backend/agents/

| Path | Purpose |
| --- | --- |
| `deploy.py` | Optional Vertex AI Agent Engine deployment script. |
| `requirements.txt` | Python dependency pins for the ADK deployment lane. |
| `praxis_data_controller/` | ADK data-controller scaffold for capsule snapshots, RAG, analytics and review proposals. |
| `deep_research/` | Earlier in-process research implementation. |
| `langgraph/`, `requirements-langgraph.txt` | Earlier checkpoint scaffolding; not the canonical Home worker. |
| Other agent folders | Experiments and specialized implementations; inspect callers and tests before treating them as live. |

## Validate and deploy an optional integration

Run `npm run doctor:google-agent-platform` and
`npm run audit:google-agent-platform -- --predeploy` from the repository root.
Follow the runbook for provisioning, credentials, IAM and deployment; do not
copy older secret-binding recipes into the frontend pipeline.

After provisioning, run the production gate and a real owner-scoped journey
through Ask, approvals and saved output. Keep optional provider readiness
separate from the core frontend release and its live acceptance.
