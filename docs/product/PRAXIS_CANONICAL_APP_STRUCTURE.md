# PRAXIS Canonical App Structure

Date: 2026-05-15  
Canonical domain: `https://praxis.tacitus.me`  
Status: source-of-truth product and infrastructure structure for the next build waves

## North Star

PRAXIS is a ContextCapsule-native agent workbench for serious policy work.

It should feel as simple as Tasklet at the surface: describe the work, choose or
build the context, run the agent, review the output. Underneath, PRAXIS is more
opinionated: every agent run inherits a ContextCapsule, every sourceable claim
has provenance, risky changes require approval, and the final output lands in
Memo Studio, Canvas, Library, or a handover packet.

The canonical loop is:

```text
Build ContextCapsule
  -> Ask the active capsule
  -> Run a capsule-aware agent
  -> Inspect tool calls, sources, gaps, and approvals
  -> Draft memo / brief / handover
  -> Schedule monitoring or share the capsule
```

The public homepage should make this loop visible before signup: a prompt bar,
an active capsule bar glimpse, a short set of policy path examples, examples of
capsules being combined, and clear login/signup entry into the same app shell.

## Product Spine

Do not add a new top-level "agent app" or generic automation dashboard. The
visible app spine remains:

```text
Home
Ask PRAXIS
Library
Memo Studio
Canvas
Advanced
```

The surfaces mean:

| Surface | Canonical role |
|---|---|
| Home | Active ContextCapsule, recent runs, scheduled briefs, next work |
| Ask PRAXIS | Ask and run agents against the active capsule |
| Library | Sources, documents, specifications, receipts, attached context |
| Memo Studio | Drafts, briefs, handover packets, review receipts |
| Canvas | Timeline, actors, graph proposals, power map, source gaps |
| Advanced | Tool registry, run logs, triggers, audits, provider/runtime diagnostics |

The authenticated shell should always make the active capsule visible near the
top of the workspace. Users should not need to find a separate manager before
they understand which User Core, Situation Core, sources, time horizon, tools,
and output goal are active.

## ContextCapsule Product Contract

The code-backed product contract for public examples and future onboarding is:

```text
src/lib/product/context-capsules.ts
```

It defines:

- starting templates;
- policy path profiles;
- output products;
- connector posture;
- capsule combination recipes;
- capability areas.

Users may start in generic mode, then bind a capsule to a path such as foreign
policy, conflict resolution, defence capture, public affairs, HR policy, legal
compliance, crisis management, strategy operations, program delivery, or
research direction. Path binding should suggest tools, output products, and
review gates without locking the user out of custom personas or mixed work.

Policy capsule design details live in
`docs/product/CONTEXT_CAPSULE_POLICY_RESEARCH_GUIDE.md`.

## App Layers

PRAXIS is not just a website. It is four planes:

```text
1. Control plane
   Next.js app, user/org settings, capsules, triggers, approvals

2. Agent execution plane
   Cloud Tasks -> Cloud Run workers -> model/tool loop -> persisted run events

3. Tools and data plane
   Source/document tools, corpus search, graph proposals, memo writer, MCP tools

4. Governance plane
   approvals, audit log, allowed domains, blocked actions, spend/rate limits
```

## Google Cloud Structure

Use Google Cloud as the main production substrate.

Start serverless. Move only heavy isolated workloads to GKE later.

```text
praxis.tacitus.me
  -> Cloud DNS / HTTPS / Cloud Run domain mapping or HTTPS Load Balancer
  -> Cloud Run: praxis-frontend
       Next.js UI and API/control routes
  -> Cloud Run: praxis-agent-worker
       private worker for agent execution
  -> Cloud Run: praxis-mcp-gateway
       private-first MCP gateway for PRAXIS tools
  -> Cloud SQL Postgres + pgvector
       canonical agent run ledger, tool calls, approvals, chunks, embeddings
  -> Firestore
       owner-scoped app state, capsules, active stacks, user-facing metadata
  -> Cloud Storage
       PDFs, source files, exports, screenshots, generated artifacts
  -> Cloud Tasks
       reliable per-run execution queue
  -> Pub/Sub
       event bus for run.created, source.updated, brief.ready, profile.events
  -> Cloud Scheduler
       daily briefs, watchlists, maintenance, drift checks
  -> Vertex AI
       Gemini by default, optional Claude-on-Vertex evaluation through provider abstraction
  -> Document AI
       scanned PDFs and structured document extraction when needed
  -> Secret Manager + Cloud KMS
       app secrets, API keys, encrypted OAuth/user tokens
  -> Cloud Build + Artifact Registry
       image build and deploy
  -> Cloud Logging + Cloud Monitoring
       logs, metrics, alerts, traces
```

### Cloud Run First, GKE Later

Default:

- `praxis-frontend` on Cloud Run.
- `praxis-agent-worker` on Cloud Run.
- `praxis-mcp-gateway` on Cloud Run, private first.
- Cloud Run Jobs for batch extraction, embedding rebuilds, nightly maintenance.

Only move to GKE when a workload needs sustained browser pools, code sandbox
isolation, or high-concurrency long-lived workers that Cloud Run cannot operate
cleanly.

GKE candidates later:

- browser automation pool;
- code sandbox pool;
- heavy multi-tenant workers.

## State Boundaries

Use both Firestore and Cloud SQL deliberately.

| State | Canonical store | Reason |
|---|---|---|
| active capsule, context stack, user-facing workspace state | Firestore | owner-scoped app state already works and matches current rules |
| agent runs, run events, tool calls, approvals | Cloud SQL Postgres | relational auditability, querying, joins, reporting, retry inspection |
| documents, chunks, embeddings | Cloud SQL + Cloud Storage | pgvector for MVP retrieval, object storage for files |
| graph projections / vector-heavy search | Postgres now, AlloyDB AI or Vertex AI Vector Search later | start simple, scale when volume demands it |
| generated memo/export files | Cloud Storage plus Firestore/SQL metadata | durable artifacts with app references |

Do not introduce Supabase, Inngest, Trigger.dev, Prisma, or a second primary
database in this repo. They are valid for greenfield products, but PRAXIS has a
GCP/Firebase/Cloud SQL stack and audit posture already.

## Core Services

Initial production services:

| Service | Platform | Purpose |
|---|---|---|
| `praxis-frontend` | Cloud Run | Next.js public/app/API control plane |
| `praxis-agent-worker` | Cloud Run | executes queued agent runs |
| `praxis-mcp-gateway` | Cloud Run | PRAXIS tool/resource MCP surface, private first |
| `praxis-postgres` | Cloud SQL Postgres | run ledger, chunks, approvals, operational joins |
| `agent-runs` | Cloud Tasks queue | one durable task per agent run |
| `praxis-events` | Pub/Sub topic | async event fan-out |
| `praxis-daily-brief` | Cloud Scheduler | recurring capsule brief trigger |
| `praxis-uploads` / docs bucket | Cloud Storage | uploaded and generated artifacts |

Runtime connection contract:

- Production should set `AGENT_RUNTIME_DATABASE_URL` for the PRAXIS-owned
  Cloud SQL run ledger. `src/lib/agent-runtime/postgres.ts` falls back to
  `PRAXIS_DATABASE_URL` and then `DATABASE_URL` for local or migration tooling.
- The canonical instance remains
  `praxisbytacitus:us-east4:praxisbytacitus-instance`, database `praxis`,
  user `praxis_app`.
- Local direct connection requires either Cloud SQL Auth Proxy / `gcloud sql
  connect` support or a VPC-connected shell because the instance is private-IP
  only.

## Canonical Data Model

MVP Cloud SQL tables:

```text
agents
agent_runs
agent_run_events
tool_calls
approvals
documents
document_chunks
agent_triggers
audit_events
```

Rows must include enough pointers to the existing PRAXIS app model:

- `owner_uid`;
- `capsule_id`;
- `context_stack_id`;
- `context_package_id`;
- selected core ids;
- output/memo/work-product ids;
- source/document ids;
- approval ids.

Firestore remains canonical for:

```text
users/{uid}/capsules/{capsuleId}
users/{uid}/contextStacks/default
users/{uid}/cores/*
users/{uid}/situations/*
users/{uid}/documents/*
```

The agent run ledger can mirror summary fields back into Firestore for live UI,
but Cloud SQL is the canonical ledger for agent execution.

## First Agents

Build these in order:

1. Research Memo Agent
   - manual trigger from Ask PRAXIS;
   - resolves active ContextCapsule;
   - runs source/corpus/memo/red-team tools;
   - writes a Memo Studio draft and run receipt.

2. Daily Brief Agent
   - schedule trigger;
   - reads capsule watchlist/source changes;
   - writes an internal morning brief draft.

3. Watchlist Agent
   - schedule or source-update trigger;
   - monitors actors, countries, rules, sources, deadlines;
   - creates alerts and briefable deltas.

4. Source Monitor Agent
   - attaches new source receipts;
   - detects stale claims and unsupported gaps;
   - proposes, but does not auto-promote, graph changes.

## Agent Run Flow

```text
User clicks Run
  -> Next.js route authenticates user
  -> resolve active ContextCapsule
  -> insert Cloud SQL agent_runs row status=queued
  -> append agent_run_events row run.queued
  -> enqueue Cloud Task agent-runs
  -> praxis-agent-worker receives OIDC-authenticated task
  -> status=running
  -> execute plan step by step
  -> write every tool_call and run_event
  -> if risky action, status=waiting_approval
  -> if approved, continue
  -> save output to Memo Studio / Canvas / Library
  -> status=succeeded or failed
  -> publish Pub/Sub event
  -> UI polls/subscribes to run summary
```

The frontend should never run long agent tasks directly.

## Tool Layer

Agent-callable tools should wrap existing PRAXIS capabilities first:

- context resolve;
- corpus search;
- source scout;
- grounded search;
- document extraction;
- timeline events;
- risk indicators;
- policy memo;
- red-team review;
- handover package;
- graph proposal review.

Each tool needs:

- stable id;
- input/output schema;
- risk level;
- required core kinds;
- allowed domains or data scope where relevant;
- persistence contract;
- approval policy.

## Model Runtime

Default:

- Vertex AI / Gemini through the existing provider abstraction and model matrix.

Allowed evaluation:

- Claude-on-Vertex for longer Tasklet-style multi-step agent runs, behind the
  same provider abstraction and feature/config gates.

Rules:

- no hardcoded model strings in route files;
- user-facing normal UI should not expose provider internals;
- all AI routes that produce user work remain calibrated/context-aware;
- model changes require audit/doc updates.

## Governance Rules

Human approval is required for:

- external email or Slack/message sending;
- canonical graph fact promotion;
- marking unsupported claims as resolved;
- publishing final sensitive exports;
- changing allowed actions for an agent handover;
- credentialed browser automation;
- capsule merge with contradictions;
- any tool marked high risk.

Agents may draft, propose, summarize, classify, and queue review without
approval. They may not silently mutate high-trust state.

## Build Waves

### Wave 1: Cloud SQL Agent Run Ledger

Ship:

- typed runtime tables/migrations;
- run/event/tool-call/approval types;
- `POST /api/agents/runs`;
- `GET /api/agents/runs/[runId]`;
- run list by active capsule;
- unit tests for state transitions and path/schema shape.

### Wave 2: Cloud Tasks Dispatch

Ship:

- queue helper using `@google-cloud/tasks`;
- private worker route with OIDC verification;
- `queued -> running -> succeeded/failed`;
- no risky tool actions yet.

Current implementation checkpoint:

- `POST /api/agents/runs/[runId]/dispatch` enqueues a Cloud Tasks HTTP target
  for the run's execute route.
- `POST /api/agents/runs/[runId]/execute` is the private worker boundary. The
  first worker pass is intentionally no-op and only records
  `queued -> running -> succeeded`.
- Repeated execution of a terminal succeeded run is treated as idempotent. If
  the no-op worker step fails before success, the run is marked `failed`.
- Production dispatch requires the Cloud Tasks queue, worker base URL, and
  trusted worker service account environment variables described in
  `docs/GCP_OPERATIONS.md`.

### Wave 3: Research Memo Agent

Ship:

- capsule resolve;
- source/corpus/memo/red-team sequence;
- Memo Studio output;
- source/gap receipt;
- focused Playwright smoke.

### Wave 4: Daily Brief And Watchlist

Ship:

- trigger records;
- Cloud Scheduler scanner;
- daily brief queueing;
- watchlist thresholds;
- internal notification/draft only.

### Wave 5: Approvals

Ship:

- approval queue UI;
- approve/reject API;
- waiting state;
- high-risk tool blocking.

### Wave 6: MCP Gateway And Integrations

Ship:

- private MCP gateway;
- read tools first;
- selected write tools only after approval gates;
- external SaaS integrations only after org permissions and token encryption are complete.

### Wave 7: Browser / Sandbox

Ship only when needed:

- read-only browser worker;
- `browser-use` as the preferred Python browser-agent framework candidate;
- Steel.dev as the preferred browser infrastructure candidate, managed first
  and self-hostable on GKE later;
- allowlisted domains;
- screenshots and source receipts;
- later GKE/sandbox pool for heavy or credentialed workflows.

Do not use browser automation as the first product foundation. Browser sessions
are a fallback after APIs, existing PRAXIS tools, MCP, and source/document
routes. Credentialed or destructive browser actions require explicit approval.

## Run Ledger Requirements

The Cloud SQL run ledger should include these fields early, even before every
capability uses them:

- `traceId`;
- `parentRunId`;
- `idempotencyKey`;
- `maxSteps`;
- `maxSessionMinutes`;
- internal estimated cost/spend fields;
- owner/capsule/core pointers;
- run status;
- trigger type;
- approval policy;
- created/started/finished timestamps.

Do not promise resumability in v1. A failed run may be retried as a new run with
`parentRunId` for audit continuity.

## Run UX Requirements

The eventual run UI should show:

- step timeline;
- tool calls and source receipts;
- current status;
- approval prompts;
- pause/cancel where supported;
- output diffs or memo receipts;
- retry from failed run.

Use SSE over Cloud Run for one-way status streaming first. Add WebSockets only
if live intervention requires bidirectional control.

## Validation Standard

Every wave should include:

```bash
npx tsc --noEmit
npm run build
npm run audit:repo-shape
npm run audit:architecture-reference
node scripts/audit-ai-routes.mjs
npx vitest run <focused tests>
graphify update .
```

UI waves also require focused Playwright smoke. Deploy waves require
`npm run audit:gcp` and production-backed evidence.
