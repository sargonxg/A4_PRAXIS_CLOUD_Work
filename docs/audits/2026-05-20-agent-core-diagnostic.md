# PRAXIS Agent Core Diagnostic

Date: 2026-05-20  
Status: Implementation diagnostic and upgrade ledger  
Companion architecture:
[`docs/architecture/PRAXIS_AGENT_RUNTIME_ARCHITECTURE.md`](../architecture/PRAXIS_AGENT_RUNTIME_ARCHITECTURE.md)

## Executive Finding

PRAXIS already has the right agentic spine:

```text
Ask orchestration -> Cloud SQL AgentRun ledger -> Cloud Tasks -> worker execution -> mirrored PRAXIS events -> Ask/workbench proof UI
```

The upgrade path is to harden that spine, not to create a parallel agent app.
Genkit should expand into typed bounded flow families. ADK / Vertex Agent
Runtime should handle long-running research agents behind queued AgentRuns.
PRAXIS remains the canonical product/state layer for ContextCapsules,
Firestore app state, Cloud SQL run ledger, receipts, approvals, output
placement, and model policy.

## Current Repo Proof

| Area | Evidence | Diagnostic |
|---|---|---|
| Ask orchestration | `src/app/api/ai/chat/route.ts`, `src/lib/ai/ask-orchestrator.ts` | Ask can route deep/current/source-heavy work toward queued AgentRun execution while keeping simple turns synchronous. |
| AgentRun ledger | `src/app/api/agents/runs/route.ts`, `src/lib/agent-runtime/postgres.ts` | Cloud SQL is the intended canonical run ledger for `agent_runs`, events, tool calls, approvals, and artifacts. |
| Dispatch | `src/lib/agent-runtime/cloud-tasks.ts` | Cloud Tasks is the durable per-run dispatch path. Local env does not currently contain all live dispatch variables. |
| Worker | `src/app/api/agents/runs/[runId]/execute/route.ts`, `src/lib/agent-runtime/worker.ts` | Worker path exists and is the right integration point for Genkit and queued ADK execution. |
| Event mirror | `src/lib/agent-runtime/mirror.ts` | Worker, Genkit, and ADK events can be normalized into PRAXIS-owned run events. |
| Stream / UI proof | `src/app/api/agents/runs/[runId]/stream/route.ts`, `src/hooks/useOrchestratorEvents.ts`, `src/components/ask/AskStreamPanel.tsx` | Safe DTOs and Ask rail can expose run id, selected tools, source count, approval gates, source posture, grounding posture, output target, and process stages. |
| Genkit | `src/lib/genkit/**`, `scripts/audit-genkit-runtime.ts`, `scripts/audit-genkit-coverage.mjs` | Genkit has provider resolution and flow registry proof. Coverage is still low and should expand through bounded typed flows. |
| ADK | `backend/agents/**`, `src/lib/ai/vertex-agent.ts`, `src/app/api/ai/deep-search-agent/route.ts` | ADK exists as direct deep-search capability and Python/Vertex deployment lane. It is not yet normalized behind queued AgentRuns for canonical Ask use. |
| Eval | `scripts/eval-agentic-research.ts`, `src/lib/agent-runtime/research-eval.ts`, `docs/audits/agentic-research-evals/` | Deterministic PRAXIS-vs-generic baseline exists and currently reports 5/5 PRAXIS wins. |

## Audit Commands Run

| Command | Result | Notes |
|---|---|---|
| `npm run audit:agent-runtime-proof` | Pass with warnings | Static contract passed. Local shell lacks ledger env, worker base URL/auth, live Genkit config, and ADK Agent Engine config. |
| `npm run audit:genkit-runtime` | Pass with warning | Provider resolves to `google-ai` at `global`; live flow calls need `GOOGLE_GENAI_API_KEY` or Vertex project config. Flow registry reports `situation-intelligence`, `classify-path`, `sourceability`, and `capsule-factory`. |
| `npm run audit:agentic-search` | Blocked locally | Missing Cloud SQL run ledger env, Cloud Tasks env, worker URL/auth, Vertex/Gemini project config, ADK engine id, Genkit key/Vertex config, and explicit Google Search grounding flag. |
| `npm run audit:ask-cockpit-runtime` | Pass | Ask cockpit runtime markers are present. |
| `npm run audit:genkit-coverage` | Pass, low coverage | 2/60 AI routes import Genkit flows; sprint target coverage is 1/12; 40 direct AI SDK routes remain. |
| `npm run eval:agentic-research` | Pass | Wrote redacted eval artifacts and reported 5/5 scenarios beating the prompt-only baseline. |
| `npm run audit:runtime-health-live` | Pass | `https://praxis.tacitus.me` health checks returned `ok`; frontend ready revision `praxis-frontend-00640-4vv`, backend ready revision `praxis-backend-00123-6gx`, retired `gdelt-poller` absent. |

## Runtime Readiness Matrix

| Capability | Local Shell | Staging Requirement | Production Proof |
|---|---|---|---|
| Cloud SQL run ledger | Blocked: no `AGENT_RUNTIME_DATABASE_URL`, `PRAXIS_DATABASE_URL`, or `DATABASE_URL` in this shell | Staging Cloud SQL credentials and schema migration proof | Runtime health reports agent ledger ready through production endpoint. |
| Cloud Tasks dispatch | Degraded: queue defaults available but explicit task project/location/queue env missing | Explicit queue env, idempotency test, retry test, timeout test | Production runtime health reports queue/worker-dispatch green. |
| Worker auth | Blocked: no worker base URL and no OIDC/shared-secret posture in this shell | OIDC service account/audience or shared-secret gate with negative tests | Production runtime health reports worker dispatch ready. |
| Vertex/Gemini | Degraded: no local Vertex project config | Vertex-first model policy wired through `MODEL_MATRIX.json` | Production health reports runtime ready; live model canaries remain gated. |
| Genkit | Degraded: provider resolves, no local key/Vertex config for live calls | Typed flow fixtures, eval scenarios, optional monitoring flag | Flow registry proof exists; route coverage is still low. |
| ADK / Agent Runtime | Degraded: no local Agent Engine id | Decide deep-research-only vs selected long-worker substrate; mirror sessions/events to Cloud SQL | Direct route exists; queued canonical bridge remains follow-up. |
| Google Search grounding | Degraded: explicit grounding flag missing locally | Grounding metadata and Search Suggestions display posture verified | Production agentic-search health is ready, but authenticated receipt inspection remains needed. |

## Google Platform Research

Official Google/Genkit/ADK documentation supports the PRAXIS split:

- Gemini Enterprise Agent Platform positions Agent Runtime as managed,
  scalable runtime infrastructure with sessions, memory, tracing, logging,
  monitoring, evaluation, quality alerts, code execution, and governance.
- ADK sessions can use Vertex-backed session service for continuity. In
  PRAXIS, those session ids should be mirrored into Cloud SQL and treated as
  execution metadata, not canonical product memory.
- ADK evaluation supports evalsets, tool trajectory scoring, and response
  match thresholds. That maps to planner/researcher/synthesizer evalsets.
- Genkit flows are defined with typed input/output schemas and can be served
  as HTTP endpoints through supported hosting patterns. That maps to bounded
  PRAXIS flow families.
- Genkit evaluation supports native evaluators such as faithfulness, answer
  relevancy, and maliciousness, plus custom evaluators and Vertex evaluators.
- Genkit monitoring can be enabled for flow telemetry, but PRAXIS receipts
  and Cloud SQL events remain the product truth.
- Vertex AI Grounding with Google Search is the right current public-web
  grounding lane. If Search Suggestions are returned in production, UI must
  preserve the required display posture.

## Ranked Improvement Lanes

### 1. AgentRun Ledger + Worker Hardening

Priority: highest. This is the foundation that makes agentic work measurable.

- Normalize every material Genkit and ADK event into `agent_run_events`.
- Normalize every tool action into `agent_tool_calls`.
- Normalize every risky write, export, graph mutation, and capsule writeback
  into `agent_approvals`.
- Replace remaining direct deep-search-as-product behavior with queued
  AgentRun execution. Keep direct ADK route as degraded/specialized.
- Add idempotency, retry, timeout, duplicate-dispatch, and worker-auth failure
  tests.

### 2. Genkit Upgrade

Priority: high. Genkit should become the typed bounded-work layer.

- Expand from Capsule Factory into flow families:
  - research memo;
  - sourceability review;
  - red-team review;
  - output formatter;
  - handover builder.
- Require Zod schemas, deterministic fallback behavior, mirrored flow events,
  fixture tests, and at least one eval scenario per flow.
- Add optional Genkit monitoring/telemetry behind a production flag.
- Preserve PRAXIS receipts and Cloud SQL events as canonical.

### 3. ADK / Vertex Agent Runtime Upgrade

Priority: high, after ledger hardening.

- Inventory `backend/agents/**`, `src/lib/ai/vertex-agent.ts`, and
  `/api/ai/deep-search-agent` against current ADK and Agent Runtime docs.
- Decide whether deployed ADK remains deep-research-only or becomes a general
  long-running worker substrate for selected policy agents.
- Use Vertex session service for continuity, but mirror session ids/events
  into PRAXIS Cloud SQL.
- Add ADK evalsets for planner/researcher/synthesizer behavior, expected tool
  use, source handling, and final-answer quality.

### 4. Ask / Workbench Proof UI

Priority: high, but keep it inside existing surfaces.

- Enrich Ask rail, source previews, receipts, approval count, output target,
  and AgentRun panel.
- Show explicit degraded states for missing grounding, thin context, failed
  dispatch, failed worker auth, and unavailable ADK/Genkit execution.
- Do not add a separate agents navigation item or cockpit.

### 5. World-Class Evaluation Bar

Priority: medium-high, should follow the runtime proof layer.

Extend `eval:agentic-research` beyond five deterministic scenarios:

- current events;
- conflicting sources;
- weak evidence;
- capsule reuse;
- red-team challenge;
- handover;
- output persistence;
- approval gates;
- degraded runtime.

Score dimensions:

- citation fidelity;
- uncertainty handling;
- capsule grounding;
- tool discipline;
- latency;
- failure clarity;
- receipt completeness;
- output usefulness.

Live canaries must remain behind explicit env gates and disposable auth
credentials.

## Public Interface Constraints

- Preserve public run statuses: `queued`, `running`, `waiting_approval`,
  `succeeded`, `failed`, `cancelled`, `expired`.
- Extend safe DTOs in `src/lib/agent-runtime/schema.ts`; do not replace them.
- Extend `PRAXIS_POLICY_AGENTS` and `AGENT_TOOL_REGISTRY` through existing
  registry patterns.
- Keep `MODEL_MATRIX.json` as model policy source of truth.
- Do not hardcode Gemini model ids in routes or agents.
- Keep Firestore/ContextCapsules canonical. ADK sessions, Genkit traces,
  Cognee/graph memory, and Memory Bank remain enrichment/execution substrate
  unless a later plan explicitly promotes them.

## Test Plan

Unit:

- agent runtime schema;
- worker execution;
- mirror events;
- tool registry;
- policy-agent routing;
- Genkit flow schemas;
- ADK event parsing.

Contract:

- Ask orchestration receipts;
- AgentRun stream DTOs;
- approval gates;
- output destinations;
- source posture;
- grounding posture.

Eval:

- deterministic PRAXIS-vs-baseline suite;
- Genkit flow eval fixtures;
- ADK evalsets for planner/researcher/synthesizer behavior.

Audit:

- `npm run audit:gate`;
- `npm run audit:genkit-runtime`;
- `npm run audit:genkit-coverage`;
- `npm run audit:agent-runtime-proof`;
- `npm run audit:agentic-search`;
- `npm run eval:agentic-research`.

Live proof:

- production health endpoints;
- authenticated Ask-to-AgentRun canary;
- stream resume;
- output persistence;
- source receipt inspection.

## Immediate Next Slice

Implement the smallest production-grade worker-hardening slice:

1. Add typed persistence for missing tool-call and approval records if any
   worker paths still only emit events.
2. Add idempotency and retry tests around Cloud Tasks dispatch and
   `/api/agents/runs/[runId]/execute`.
3. Move the normal deep-search product path behind queued AgentRun execution
   while preserving `/api/ai/deep-search-agent` as an explicit direct fallback.
4. Add one Genkit research-memo flow with schema, fixture, mirrored events,
   and eval case.
5. Run the local audit set, then run authenticated canaries only when
   disposable credentials and production env gates are present.
