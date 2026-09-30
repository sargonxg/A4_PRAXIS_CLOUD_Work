# PRAXIS Agent Runtime Architecture

Date: 2026-05-20  
Status: Canonical target for Ask PRAXIS, AgentRun execution, Genkit flows, and ADK / Vertex Agent Runtime integration

## Executive Contract

PRAXIS builds on the existing runtime spine. It does not add a parallel agent
application:

```text
Ask PRAXIS orchestration
  -> Cloud SQL AgentRun ledger
  -> Cloud Tasks dispatch
  -> private worker execution
  -> mirrored PRAXIS events, tool calls, approvals, and artifacts
  -> Ask / TaskletPraxisWorkbench proof UI
```

The user-facing product stays centered on Ask PRAXIS and
`TaskletPraxisWorkbench`. Agent improvements enrich the existing rail,
receipts, source previews, approval gates, output handoff, and run panels. Do
not add a new top-level agents app, new primary navigation, or a separate
agent cockpit unless Giulio explicitly asks for one later.

## Turn execution preferences

`src/lib/ai/ask-execution-preference.ts` provides a shared interpretation of
explicit execution restrictions for classification, routing, streaming tools
and worker retrieval. A direct/no-agent instruction wins over selected agents and Deep
research. A browsing prohibition can still permit a selected local capsule
agent, while denying external search even when attached tool cores request it.
Supplied-context-only requests exclude unrelated workspace/corpus retrieval.
Quoted instructions and conceptual mentions do not act as execution commands.

Home sends the selected context unchanged. An empty selection uses ephemeral
instant context with a stable owner/thread history partition; it does not
resolve or modify the canonical default capsule. Attached capsule identity,
version and source references remain explicit. Review receipts describe the
actual tools and evidence used, and generated products retain whole-draft review.

Provider and model receipts come from the same constructed SDK model passed to
generation, including fallback attempts. Client preferences are selection inputs.
Supplied-only turns retain selected capsule/trust instructions and health
diagnostics for telemetry, while omitting workspace health/readiness blocks from
the model prompt so straightforward recall does not demand workspace setup.

For supplied-context recall, the current question's answer contract follows
work-intent instructions. Saved builder schemas apply to requested artifacts;
they do not turn every question into a memo. Brief extraction preserves supplied
facts and uncertainty without adding unrequested judgments or speculation.
Explicit negative research invocations prevent research dispatch and external
search. External-only restrictions can still permit requested analysis of
attached documents.

## Platform Split

| Layer | Owner | Role | Not Source Of Truth For |
|---|---|---|---|
| PRAXIS | ContextCapsules, Firestore app state, Cloud SQL run ledger, receipts, approvals, output placement, model policy | Canonical product state, user-visible proof, run status, access control, model/provider selection | N/A |
| Genkit | Typed flows, Zod schemas, structured outputs, tools, local flow dev, evals, optional telemetry | Bounded work such as capsule factory, research memo, sourceability review, red-team review, output formatting, handover building | Product state, approval decisions, durable receipts |
| ADK / Vertex Agent Runtime | Multi-step research agents, planner/researcher/synthesizer loops, managed sessions, long work execution | Long-running agents and managed runtime substrate | ContextCapsules, user-visible status, approvals, durable artifacts |
| Gemini / Vertex AI | Vertex-first Gemini model layer, Google Search grounding, managed grounding metadata, future Agent Platform governance | Model execution, public-web grounding, enterprise runtime observability and scale | PRAXIS state, PRAXIS receipts, Firestore/Cloud SQL ledgers |

Agent Platform Sessions and Memory Bank can be used as execution or
enrichment substrate, but they are not canonical PRAXIS memory. Every useful
session id, event, tool call, grounding posture, and output pointer must be
mirrored back into the PRAXIS ledger.

## Runtime Diagram

```text
User in Ask PRAXIS / TaskletPraxisWorkbench
  |
  v
src/app/api/ai/chat/route.ts
  - resolves calibration, owner, active ContextCapsule, and output intent
  - chooses synchronous response or queued AgentRun
  |
  v
src/lib/ai/ask-orchestrator.ts
  - applies policy-agent routing and tool selection
  - creates safe user-facing receipt plan
  |
  v
src/app/api/agents/runs/route.ts
src/lib/agent-runtime/postgres.ts
  - inserts agent_runs
  - appends agent_run_events
  - records agent_tool_calls and agent_approvals when available
  |
  v
src/lib/agent-runtime/cloud-tasks.ts
  - dispatches one durable worker task per run
  - uses OIDC or shared-secret worker authentication
  |
  v
src/app/api/agents/runs/[runId]/execute/route.ts
src/lib/agent-runtime/worker.ts
  - resolves canonical PRAXIS context
  - calls bounded Genkit flows or ADK / Vertex Agent Runtime paths
  - persists artifacts, receipts, and output destinations
  |
  v
src/lib/agent-runtime/mirror.ts
  - normalizes worker, Genkit, and ADK events into PRAXIS ledger events
  |
  v
src/app/api/agents/runs/[runId]/stream/route.ts
src/hooks/useOrchestratorEvents.ts
Ask rail / queued-run panel / source previews / output handoff
```

## State Ownership

| State | Canonical Store | Notes |
|---|---|---|
| Active ContextCapsules, context stacks, selected cores | Firestore and ContextCapsule services | Canonical user context. Worker inputs receive resolved pointers and snapshots. |
| Agent run status | Cloud SQL `agent_runs` | Public statuses stay `queued`, `running`, `waiting_approval`, `succeeded`, `failed`, `cancelled`, `expired`. |
| Process events | Cloud SQL `agent_run_events` | Every material worker, Genkit, ADK, grounding, approval, and artifact transition is mirrored here. |
| Tool activity | Cloud SQL `agent_tool_calls` | Every tool action that changes evidence, writes output, performs retrieval, or touches external systems gets a typed record. |
| Risky writes and approvals | Cloud SQL `agent_approvals` plus product-specific stores | Graph changes, exports, capsule writebacks, and sensitive output placement require explicit PRAXIS approval gates. |
| Generated artifacts and output placement | PRAXIS output stores, Memo Studio, Library, Canvas, OutputCapsules | External runtime identifiers can be metadata only. |
| ADK sessions | Vertex session service / Agent Runtime | Useful continuity substrate; mirror ids and events back to Cloud SQL. |
| Genkit traces and evals | Genkit developer/monitoring systems | Useful diagnostics; PRAXIS receipts remain canonical. |
| Model policy | `MODEL_MATRIX.json` and PRAXIS routing registries | Do not hardcode Gemini model ids in routes or agent code. |

## ADK vs Genkit Boundary

Use Genkit when work is bounded, schema-first, and should return a structured
object with deterministic fallback behavior:

- capsule factory;
- research memo draft;
- sourceability review;
- red-team review;
- output formatter;
- handover builder;
- route-local schema migration from direct AI SDK calls.

Every Genkit flow must have:

- Zod input and output schemas;
- deterministic fallback behavior for missing model/runtime config;
- fixture tests;
- mirrored flow events;
- at least one eval scenario before promotion to production-critical use.

Use ADK / Vertex Agent Runtime when work is long-running, multi-step, or
agentic enough to need sessions, planner/researcher/synthesizer roles,
managed runtime execution, or continuation across a worker attempt.

ADK should remain behind the queued AgentRun path for normal product use.
`/api/ai/deep-search-agent` may remain as a direct degraded or specialized
capability while the queued bridge is completed, but it is not the canonical
Ask PRAXIS product path.

## AgentRun Lifecycle

| Phase | Status | Required Ledger Proof |
|---|---|---|
| Create | `queued` | Run row with owner, policy agent, input summary, output target, source posture, grounding posture, and selected tools. |
| Dispatch | `queued` | Cloud Tasks dispatch event with queue, target, idempotency key, and auth mode. |
| Start | `running` | Worker-auth verification, context resolution, model policy resolution, and execution mode. |
| Plan | `running` | Research plan, selected flow/agent, source needs, freshness needs, and approval gates. |
| Tool / Flow / Agent events | `running` or `waiting_approval` | Normalized events plus `agent_tool_calls`; risky operations move to `waiting_approval`. |
| Persist | `running` | Artifact/output references, source receipts, grounding metadata, and capsule/output links. |
| Complete | `succeeded` | Final receipt, output destination, visible source count, uncertainty notes, and completed event. |
| Fail / expire / cancel | `failed`, `expired`, `cancelled` | Failure mode, retry posture, user-visible recovery copy, and partial artifact handling. |

Worker execution must be idempotent. Retry handling should be keyed by run id,
worker attempt, and task dispatch id. Timeouts must leave a visible failure or
expired status rather than an indefinitely running rail.

## Event Taxonomy

Use stable, additive event names. Examples:

| Family | Examples | Purpose |
|---|---|---|
| `run.*` | `run.created`, `run.dispatched`, `run.started`, `run.succeeded`, `run.failed`, `run.expired` | Status and lifecycle proof. |
| `context.*` | `context.resolve.started`, `context.resolve.succeeded`, `context.resolve.thin` | Capsule/context proof. |
| `model.*` | `model.policy.resolved`, `model.fallback.used` | Model-policy transparency without exposing costs. |
| `genkit.flow.*` | `genkit.flow.started`, `genkit.flow.tool_call`, `genkit.flow.succeeded`, `genkit.flow.failed` | Bounded typed-flow proof. |
| `adk.session.*` | `adk.session.created`, `adk.session.reused`, `adk.session.failed` | ADK continuity proof mirrored into PRAXIS. |
| `adk.turn.*` | `adk.turn.started`, `adk.turn.event`, `adk.turn.succeeded`, `adk.turn.failed` | Long-running agent proof. |
| `tool.*` | `tool.selected`, `tool.started`, `tool.succeeded`, `tool.failed` | Tool discipline and receiptability. |
| `grounding.*` | `grounding.google_search.requested`, `grounding.google_search.received`, `grounding.absent` | Public-web freshness posture. |
| `approval.*` | `approval.required`, `approval.granted`, `approval.rejected`, `approval.expired` | Human control over risky actions. |
| `artifact.*` | `artifact.created`, `artifact.persisted`, `artifact.failed` | Output handoff and persistence proof. |

## Approval Model

Approvals are PRAXIS-owned. The worker may propose risky actions, but it cannot
turn proposed changes into canonical product state without a PRAXIS approval
record. Approval gates are required for:

- graph or Cognee promotion;
- ContextCapsule replacement, fork, or active-stack mutation;
- external publishing or export;
- write actions against source systems;
- sensitive memo/library/canvas placement;
- tool calls marked high risk in `AGENT_TOOL_REGISTRY`.

Approval counts and states can be shown in the Ask rail. Internal model costs
and provider implementation details must not be exposed in user-facing UI.

## Source And Grounding Posture

PRAXIS source posture is explicit:

- user documents and ContextCapsules are canonical user-owned context;
- Firestore and Cloud SQL are canonical app and run state;
- Google Search grounding is the preferred current public-web grounding path;
- source-linked crawlers and web tools can add receipt-backed evidence;
- Wikipedia/background sources can be used as labeled background, not as
  decisive proof where primary/current sources are needed;
- Memory Bank, Cognee, graph memory, and Genkit traces are enrichment until a
  later plan explicitly promotes them.

When Vertex Grounding with Google Search returns Search Suggestions in a
grounded response, production UI must preserve the required display posture.
If grounding metadata is absent, the run should say so rather than implying a
grounded result.

## Observability

PRAXIS observability is layered:

- PRAXIS receipts and Cloud SQL event rows are the product truth.
- `/api/health`, `/api/health/runtime`, and `/api/health/agentic-search`
  remain the public runtime proof surfaces.
- Genkit monitoring and telemetry can be enabled as an optional production flag
  for flow diagnostics.
- Agent Platform tracing, logging, monitoring, sessions, evaluation, and
  quality-alert systems are the managed-runtime observability target for ADK
  and Vertex Agent Runtime.
- Local audit commands must distinguish missing shell env from production
  service health.

## Eval Strategy

The regression suite should grow in three layers:

1. Deterministic PRAXIS-vs-baseline checks for product behavior and receipts.
2. Genkit flow evals for schema conformance, source discipline, capsule
   grounding, and fallback quality.
3. ADK evalsets for planner/researcher/synthesizer behavior, expected tool use,
   source handling, and final-answer quality.

Score dimensions:

- citation fidelity;
- uncertainty handling;
- capsule grounding;
- tool discipline;
- latency;
- failure clarity;
- receipt completeness;
- output usefulness.

Live canaries must stay behind explicit environment gates and disposable auth
credentials.

## Local, Staging, And Production Readiness Matrix

| Environment | Required Proof | Current Posture On 2026-05-20 |
|---|---|---|
| Local shell | `npm run audit:agent-runtime-proof`, `npm run audit:genkit-runtime`, `npm run audit:ask-cockpit-runtime`, `npm run audit:genkit-coverage`, `npm run eval:agentic-research` | Static runtime proof, Genkit runtime, Ask cockpit, Genkit coverage, and deterministic eval pass. Live agentic-search config is blocked without Cloud SQL, worker target/auth, Vertex/Gemini, ADK, Genkit key, and explicit grounding env. |
| Staging | Same commands with staging env plus authenticated Ask-to-AgentRun canary, stream resume, output persistence, and approval-gate checks | Required before promoting queued ADK/Genkit workers. |
| Production | `/api/health`, `/api/health/runtime`, `/api/health/agentic-search`, Cloud Run ready revisions, authenticated canaries, receipt inspection | `npm run audit:runtime-health-live` reports `ok` runtime health for `praxis.tacitus.me`; authenticated canaries remain gated by disposable credentials. |

## Upgrade Lanes

1. **AgentRun ledger and worker hardening**: normalize every Genkit/ADK event
   into `agent_run_events`, every tool action into `agent_tool_calls`, and
   every risky write/export/graph change into `agent_approvals`; add
   idempotency, retry, timeout, and failure-mode tests around dispatch and
   worker execution.
2. **Genkit expansion**: promote typed flow families for research memo,
   sourceability review, red-team review, output formatter, and handover
   builder; require schemas, deterministic fallback, mirrored events, fixture
   tests, and eval scenarios.
3. **ADK / Vertex Agent Runtime bridge**: inventory `backend/agents/**`,
   `src/lib/ai/vertex-agent.ts`, and `/api/ai/deep-search-agent`; decide
   whether ADK stays deep-research-only or becomes the long-running substrate
   for selected PRAXIS agents; mirror Vertex session ids and events into
   Cloud SQL.
4. **World-class quality bar**: expand `eval:agentic-research` beyond five
   deterministic scenarios to cover current events, conflicting sources, weak
   evidence, capsule reuse, red-team challenge, handover, output persistence,
   approval gates, and degraded runtime.

## No-Go Rules

- Do not add a new top-level app surface for agents.
- Do not let ADK sessions, Memory Bank, Genkit traces, Cognee, or graph memory
  become canonical product state without an explicit later promotion plan.
- Do not bypass `withCalibration` on AI routes unless an exemption is
  documented.
- Do not hardcode Gemini model ids in routes or agents.
- Do not expose internal credit costs in user-facing UI.
- Do not claim current-source grounding unless the run has grounding/source
  receipt proof.

## Documentation Anchors

- Gemini Enterprise Agent Platform / Agent Runtime:
  https://docs.cloud.google.com/gemini-enterprise-agent-platform/scale
- ADK sessions and Vertex session service:
  https://adk.dev/sessions/session/
- ADK evaluation:
  https://adk.dev/evaluate/
- Genkit flows:
  https://genkit.dev/docs/js/flows/
- Genkit evaluation:
  https://genkit.dev/docs/js/evaluation/
- Genkit monitoring:
  https://genkit.dev/docs/js/observability/getting-started/
- Vertex AI Grounding with Google Search:
  https://docs.cloud.google.com/vertex-ai/generative-ai/docs/grounding/grounding-with-google-search
