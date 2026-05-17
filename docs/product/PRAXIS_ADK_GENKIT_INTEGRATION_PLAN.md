# PRAXIS ADK + Genkit Integration Plan

Date: 2026-05-15  
Status: architecture audit and next-build plan

## Executive Position

PRAXIS should use ADK and Genkit as implementation substrates around the
ContextCapsule runtime, not as new canonical state systems.

- ADK is for long-running/multi-step/multi-agent workers.
- Genkit is for typed flows, tools, structured outputs, and evals.
- PRAXIS ContextCapsules remain canonical context.
- Firestore remains capsule/app state.
- Cloud SQL remains the agent run ledger.
- ADK/Genkit state is not canonical product state.
- Every ADK/Genkit event/tool call must be mirrored into the PRAXIS run ledger.

The practical direction is to keep the user-facing app simple: PRAXIS resolves
an active ContextCapsule, creates a queued run in the Cloud SQL ledger, then
dispatches worker execution. Workers may call Genkit flows or ADK agents, but
run status, step events, tool calls, approvals, artifacts, and user-visible
receipts belong to PRAXIS.

## Current ADK State

ADK currently exists as a Python/Vertex Agent Engine lane plus a Next.js
gateway route:

- `backend/agents/requirements.txt` pins the Vertex Agent Engine deployment
  stack: `google-cloud-aiplatform[adk,agent_engines]`, `google-adk==1.31.1`,
  and `google-genai`.
- `backend/agents/deploy.py` builds a `SequentialAgent` named
  `praxis_deep_research_v1` with planner, researcher, and synthesizer
  `LlmAgent` stages, then deploys it to Vertex AI Agent Engine.
- `backend/agents/deep_research/agent.py` defines an ADK `Agent` named
  `praxis_deep_research` with function tools for web search, document
  retrieval, and graph query.
- `src/lib/ai/vertex-agent.ts` is the TypeScript client for Vertex AI Agent
  Engine sessions and streaming turns. It resolves
  `VERTEX_AGENT_ENGINE_ID`, calls Reasoning Engine session/turn endpoints, and
  normalizes streamed SSE payloads into `AgentEvent` objects.
- `src/app/api/ai/deep-search-agent/route.ts` is the live ADK-facing route. It
  is calibration-gated, enriches the user query with situation context, creates
  or reuses an Agent Engine session, streams ADK events to the PRAXIS research
  envelope, and saves a tool-output receipt.

Gaps:

- ADK session ids are currently persisted under Firestore
  `users/{uid}/agentSessions/active` for continuity, but ADK state is not yet
  mirrored into the new Cloud SQL agent run ledger.
- The ADK route is a direct streaming route, not yet a queued
  `agent_runs -> Cloud Tasks -> worker` execution.
- ADK tool calls are not yet normalized into `AgentToolCall` rows or approval
  checkpoints.

## Current Genkit State

Genkit currently exists as a JavaScript runtime package with typed flows,
provider resolution, schemas, tools, and audits:

- `src/lib/genkit/index.ts` initializes the `praxis-js` Genkit instance with
  Google AI Studio or Vertex AI provider selection, Google Cloud telemetry
  support, prompt directory wiring, model-task mapping, and exported Gemini
  model handles.
- `src/lib/genkit/provider.ts` resolves the Google provider from
  `GENKIT_GOOGLE_PROVIDER`, `AI_PROVIDER`, Google API keys, project ids, and
  location env vars.
- `src/lib/genkit/flows/classify-path.ts` defines the typed
  `classifyPathFlow`.
- `src/lib/genkit/flows/situation-intelligence.ts` defines the typed
  `situationIntelligenceFlow`.
- `src/lib/genkit/schemas/*` holds the Zod schemas used by those flows.
- `src/lib/genkit/tools/registry.ts` registers PRAXIS path-bundle tools with
  Genkit and marks interrupt-sensitive tools such as brief-builder and
  redline-finder.
- `src/lib/genkit/mcp/index.ts` records disabled-first external MCP stubs for
  source-linked event reporting, grounded search, humanitarian web reporting, humanitarian data, official multilateral news, and economic institution.
- `src/lib/genkit/dev-runner.ts` imports the current flows/tools for the Genkit
  developer runtime.
- `package.json` includes the Genkit dependencies and runtime scripts,
  including `genkit:dev`, `audit:genkit-runtime`, and
  `audit:genkit-coverage`.
- The current JavaScript package set is `genkit`, `@genkit-ai/google-genai`,
  `@genkit-ai/vertexai`, and `@genkit-ai/google-cloud`. The older
  `@genkit-ai/googleai` package name should not be reintroduced unless the
  Genkit package matrix is intentionally downgraded.
- Google AI Studio key lookup accepts `GOOGLE_GENAI_API_KEY` first, then the
  older PRAXIS aliases `GEMINI_API_KEY`, `GOOGLE_API_KEY`, and
  `GOOGLE_AI_API_KEY`. Vertex remains preferred when
  `GOOGLE_VERTEX_PROJECT`/`GOOGLE_CLOUD_PROJECT` is configured and no API-key
  fallback is present.
- `scripts/audit-genkit-runtime.ts` enforces the expected flow files, prompt
  files, provider resolver, and route imports.
- `scripts/audit-genkit-coverage.mjs` reports which AI routes have moved to
  Genkit flows and which still use direct AI SDK patterns.

There is also a Python Genkit-adjacent lane:

- `backend/ai/genkit_app.py` can build a Genkit instance when the Python
  packages are installed, with fallback to Google credentials.
- `backend/ai/flows.py` registers structured extraction and intelligence flows
  when Python Genkit is available, then falls back to the raw Gemini client.

This Python lane is useful evidence, but the current app-facing Genkit
contract is the TypeScript `src/lib/genkit` tree.

## Routes Already Using Genkit

Current route imports show these app routes already call Genkit flows:

- `POST /api/paths/classify` uses
  `src/lib/genkit/flows/classify-path.ts`.
- `POST /api/ai/situation-intelligence` uses
  `src/lib/genkit/flows/situation-intelligence.ts`.

`GET /api/health` does not run a Genkit flow, but it does report provider
resolution through `src/lib/genkit/provider.ts`.

## Routes Still Using AI SDK Directly

The direct AI SDK surface is still large. Examples under `src/app/api/ai`
include:

- `actor-brief`, `actor-enrichment`, `actor-profiles`;
- `advisor-chat`, `advisory`, `argus`;
- `auto-briefing`, `auto-structure`, `briefing-generate`;
- `brainstorming-table`, `chat`, `compare`, `concordia`;
- `dashboard-summary`, `discover-sources`, `dossier-generate`;
- `economic-impact`, `electoral-risk`, `escalation-scan`;
- `external-actors`, `extract-episodes`, `game-theory`;
- `geospatial`, `human-rights`, `humanitarian`, `info-environment`;
- `legal-tracker`, `media-analyze`, `media-compass`, `media-roundup`,
  `media-scan`;
- `mediation-design`, `negotiation`, `peacebuilding-index`, `pir`;
- `policy-memo`, `power-map`, `report`, `resolution`, `risk-assessment`;
- `sanctions-scan`, `sat`, `scenario`, `stakeholder-map`;
- `talking-points`, `terminology`, `timeline-events`, `treaty-analyze`,
  `un-toolkit`.

Other direct AI SDK usage remains in support routes and libraries such as
`/api/assistant/intent`, `/api/cron/generate-briefing`,
`/api/documents/[id]/extract-stored`, `/api/onboarding/chips/suggest`,
`src/lib/ai/tools.ts`, `src/lib/ai/research-engine.ts`,
`src/lib/agents/run-agent.ts`, `src/lib/services/situation-initializer.ts`,
and data-feed/search helpers.

This is acceptable for now because current AI routes remain calibration-gated
where required, but new capsule-aware agent execution should move through the
run ledger and typed flow boundary instead of adding more direct route-local
generation.

## ADK Ownership

ADK should own:

- long-running research or analysis workers that need multiple steps;
- multi-agent orchestration such as planner/researcher/synthesizer loops;
- worker-local session handling while a run is executing;
- integrations with Vertex AI Agent Engine and Google ADK tools;
- retries or continuation inside one dispatched worker attempt, provided
  PRAXIS receives ledger events for each material step.

ADK should not own:

- canonical ContextCapsule state;
- user-facing run status;
- approval state;
- durable product receipts;
- billing/spend state;
- source-of-truth artifacts.

## Genkit Ownership

Genkit should own:

- typed flows for bounded PRAXIS tasks;
- Zod-backed structured outputs;
- Genkit tools for PRAXIS path bundles and capsule-aware actions;
- prompt files and local flow development through `genkit:dev`;
- evals and schema-conformance tests for structured generation;
- provider-level observability hooks where they do not replace PRAXIS receipts.

Genkit should not own:

- the active capsule;
- Firestore user/capsule state;
- Cloud SQL run/event/tool-call records;
- approval decisions;
- generated work-product publication.

## PRAXIS-Owned Boundaries

PRAXIS must remain the authority for:

- ContextCapsules, active context stacks, context packages, and selected core
  ids;
- owner scoping and authentication;
- calibration gates for AI routes;
- the Cloud SQL agent run ledger;
- tool-call, approval, artifact, and event normalization;
- output placement in Ask PRAXIS, Library, Memo Studio, Canvas, and Advanced;
- Firestore app state and user-owned capsule state;
- Cloud Tasks dispatch and worker authentication;
- Secret Manager/KMS credential handling;
- model/provider selection policy and no-hardcoded-model enforcement.

This means ADK and Genkit calls must receive resolved PRAXIS context. They
should return structured events and outputs that PRAXIS persists through its
own contracts.

## Safe Next Build

The safe next implementation is a bridge layer, not a broad route rewrite.

1. Add a run-ledger mirror adapter for worker execution.
   - Input: `AgentRun`, resolved ContextCapsule pointers, `traceId`.
   - Output: helper calls for `appendAgentRunEvent`, `updateAgentRunStatus`,
     and later `appendAgentToolCall` / approval writes.
   - Requirement: every ADK/Genkit material event becomes a PRAXIS ledger
     event.
   - Current checkpoint: `src/lib/agent-runtime/mirror.ts` now provides
     `mirrorWorkerEvent`, `mirrorGenkitFlowEvent`, `mirrorAdkAgentEvent`, and
     `buildCapsuleWorkerContext`. The no-op worker uses it for
     capsule-context resolution and bridge-ready completion events. Real
     Genkit and ADK execution remain follow-up work.

2. Move the first real queued worker onto Genkit.
   - Candidate: Research Memo Agent.
   - Use existing source/context/memo capabilities.
   - Start as Cloud Tasks dispatched worker execution.
   - Persist plan, flow start/finish, tool calls, validation gaps, and final
     Memo Studio output references.

3. Wrap ADK deep search behind queued runs.
   - Keep `/api/ai/deep-search-agent` as the current streamed capability until
     the worker route exists.
   - Add a new queued ADK worker path that creates a PRAXIS run first, then
     calls Vertex Agent Engine from the private worker.
   - Persist `session.created`, `turn.started`, streamed phase events, fallback
     use, and completion/failure in Cloud SQL.

4. Add Genkit coverage incrementally.
   - Prefer high-value bounded outputs first: policy memo, briefing,
     stakeholder map, risk assessment, source discovery.
   - Do not migrate streaming chat routes until the run/event model and user
     experience for partial output are settled.

5. Add evals after the first worker bridge.
   - Genkit evals should check schema conformance, citation/source discipline,
     and capsule-grounding.
   - Eval results are quality evidence, not product state.

## Non-Goals For The Next Wave

- Do not make ADK session memory canonical.
- Do not make Genkit traces canonical.
- Do not bypass `withCalibration` on AI routes.
- Do not hardcode model names into routes or worker code.
- Do not add frontend agent controls before queued worker state is meaningful.
- Do not introduce a new database or replace Firestore/Cloud SQL boundaries.

## Acceptance Criteria

The next ADK/Genkit implementation wave is ready only when:

- a queued run can resolve its active ContextCapsule before execution;
- every worker status transition writes the Cloud SQL run ledger;
- every material Genkit flow event or ADK step is mirrored as an
  `AgentRunEvent`;
- every tool action has a typed PRAXIS tool-call record or an explicit TODO for
  the not-yet-implemented tool-call table write;
- approvals remain PRAXIS-owned;
- normal UI DTOs do not expose internal cost/spend fields;
- existing AI route audits still pass.
