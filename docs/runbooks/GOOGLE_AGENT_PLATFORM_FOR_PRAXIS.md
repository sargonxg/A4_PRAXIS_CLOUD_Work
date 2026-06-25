# Google Agent Platform For PRAXIS

Status: local scaffold and readiness gate. Cloud mutation remains approval-gated.

## Product Rule

Google ADK, Agent Runtime, RAG Engine, BigQuery, and Gemini Enterprise are
execution and retrieval substrates. PRAXIS remains the product state owner:

- Firestore ContextCapsules
- Cloud SQL AgentRun ledger
- PRAXIS review cards
- Memo Studio, Library, Canvas, and OutputCapsules

Do not add a parallel agent cockpit. Use Ask PRAXIS and queued AgentRuns.

## Current Build Lane

1. `Ask PRAXIS` classifies the request and chooses a queued AgentRun.
2. `src/lib/agent-runtime/worker.ts` resolves the active ContextCapsule.
3. The worker calls the ADK data controller through `src/lib/ai/vertex-agent.ts`
   and `src/lib/agent-runtime/adk-bridge.ts`.
4. ADK events, RAG retrievals, BigQuery calls, sources, outputs, and session ids
   are mirrored into PRAXIS run events.
5. Any capsule, graph, repository, export, or external write stays a review-card
   proposal until a human applies it.

## Macro RAG Repositories

The local manifest in `src/lib/google-agent-platform/readiness.ts` defines the
first macro repository categories:

- Diplomatic and Policy Teams
- Legal, Mandate, and Compliance
- Humanitarian and Field Operations
- Security and Crisis Monitoring
- Research Strategy and Analytics
- Public Affairs and Narrative Risk
- Corporate, Sanctions, and Supply-Chain Risk
- Defense Capture and Public-Sector Opportunities

Each repository is owner/capsule scoped, review-gated, and allowed to use only
declared retrieval source classes.

## Local Preflight

Run from the repo root:

```powershell
cd C:\Users\giuli\tacitus-products\praxis
npm run auth:doctor -- --fix
npm run doctor:google-agent-platform
npm run audit:agent-runtime-proof
npm run audit:google-agent-platform
```

Expected local posture before live wiring: auth is green, static runtime proof is
green, and `audit:google-agent-platform` may warn about live Agent Runtime,
RAG corpus, Cloud SQL ledger, and worker auth env until those are mounted.

## Production Preflight

Production readiness must be explicit:

```powershell
npm run audit:google-agent-platform -- --predeploy
npm run audit:google-agent-platform -- --production
```

This should fail until these are present:

- `VERTEX_AGENT_ENGINE_ID`
- `VERTEX_RAG_CORPUS` or `VERTEX_RAG_CORPUS_RESOURCE`
- `AGENT_RUNTIME_DATABASE_URL` or equivalent
- `AGENT_RUN_WORKER_BASE_URL` or `APP_URL`
- Cloud Tasks OIDC env or a local shared secret for non-production tests

## Approved Cloud Setup Commands

Only run these after explicit approval for cloud changes:

```powershell
gcloud services enable aiplatform.googleapis.com storage.googleapis.com bigquery.googleapis.com cloudtasks.googleapis.com --project=praxisbytacitus
gsutil mb -p praxisbytacitus -l us-central1 gs://praxisbytacitus-agent-staging
```

Deploy the ADK app from `backend/agents/praxis_data_controller` only after the
predeploy gate is green enough for first deployment:

```powershell
npm run deploy:google-agent-platform -- -ApproveCloudMutation
```

The deploy script intentionally refuses to run without `-ApproveCloudMutation`.
After the first deploy, store the Agent Runtime id as `VERTEX_AGENT_ENGINE_ID`,
create or mount `VERTEX_RAG_CORPUS`, and then use:

```powershell
npm run audit:google-agent-platform -- --production
```

Do not enable Cognee or any graph-memory promotion as part of this Google-agent
deployment lane. Cognee remains a separate disabled-first advisory memory lane.

## Official Sources

- Google ADK Agent Runtime quickstart: https://docs.cloud.google.com/gemini-enterprise-agent-platform/build/runtime/quickstart-adk
- Google ADK BigQuery tool pattern: https://google.github.io/adk-docs/integrations/bigquery-agent-analytics/
- Gemini Enterprise RAG Engine overview: https://docs.cloud.google.com/gemini-enterprise-agent-platform/build/rag-engine/rag-overview
