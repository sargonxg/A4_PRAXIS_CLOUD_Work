# PRAXIS Tasklet-Style Agent Runtime Plan

Date: 2026-05-15  
Repo: `C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work`  
Status: implementation plan plus first code contract  

## Executive Decision

Build PRAXIS as a Tasklet-style cloud agent runtime, but do not copy Tasklet's
generic automation product or replace the current stack.

The right PRAXIS version is narrower and stronger:

```text
ContextCapsule -> Ask -> run policy tools -> draft memo -> review -> hand off to agents
```

Tasklet's public story is general-purpose business automation. PRAXIS should be
policy, conflict, public-sector, risk, compliance, and handover work. The shared
technical shape is persistent cloud agents with triggers, tools, integrations,
browser fallback, run history, and human approval. The differentiator is that
PRAXIS agents inherit a ContextCapsule instead of starting from a blank prompt.

The canonical app-structure document for this direction is
[`PRAXIS_CANONICAL_APP_STRUCTURE.md`](./PRAXIS_CANONICAL_APP_STRUCTURE.md).

## What Tasklet Appears To Be

Publicly observable Tasklet capabilities:

- cloud agents that continue running after the user closes the laptop;
- plain-English task creation instead of hand-drawn workflow branches;
- scheduled, webhook, email, RSS, form, and calendar-style triggers;
- 3,000+ integrations plus arbitrary HTTP/API connector generation;
- MCP support as a standard tool layer;
- computer/browser use in a cloud VM when no API exists;
- live generated apps/dashboards from agent output;
- high-volume tool execution with persistent agent conversations;
- Claude-centered model architecture, with Sonnet for normal workflows and Opus
  for harder multi-step reasoning;
- GCP/React/TypeScript/Kubernetes/Claude signals from public job/product pages.

Sources checked on 2026-05-15:

- Anthropic Tasklet customer story:
  `https://claude.com/customers/tasklet`
- Product Hunt "built with" page:
  `https://www.producthunt.com/products/tasklet/built-with`
- Public job mirror:
  `https://angjobs.com/jobs/January-2026/mayop100-Tasklet-StaffSoftwareEngineer-AIAgents-SanFrancisco-CA-ONSITE-260k-330k-0-8-1-6-equity.html`

These sources are enough to infer the product architecture, but not enough to
claim Tasklet's private code, exact database schema, exact queue, or internal
deployment topology.

## What PRAXIS Already Has

PRAXIS already has most of the pieces a Tasklet-style product needs:

| Runtime need | PRAXIS stack to reuse |
|---|---|
| Frontend app shell | Next.js, React, TypeScript, existing simple nav |
| User/workspace identity | Firebase Auth plus owner-scoped Firestore |
| Persistent working context | `users/{uid}/capsules`, `contextStacks/default`, core objects |
| Tool registry | `TOOL_REGISTRY`, canonical tools, tool contracts |
| AI route discipline | `withCalibration`, `saveToolOutput`, model matrix, route audits |
| Model runtime | Vertex AI/Gemini via AI SDK and Genkit posture |
| Long work | Cloud Tasks, Cloud Scheduler, Pub/Sub, Cloud Run workers |
| Source/doc layer | Library, document upload, source receipts, corpus search |
| Graph/review gates | graph proposals, review-gated graph mutation |
| Output surface | Memo Studio, work products, handover package route |
| Observability | audit scripts, health routes, telemetry, Graphify |
| MCP surface | `backend/mcp/praxis_server.py` read tools already exist |

Therefore, do not introduce Supabase, Inngest, Trigger.dev, Prisma, or a new
database as the primary runtime. Those are good generic choices for a fresh app,
but this repo already has Firebase/GCP/Vertex/Cloud Tasks contracts and audits.

## Product Shape

The user should not see "agent infrastructure." They should see:

```text
Build ContextCapsule
Ask the active capsule
Run a capability
Review what changed
Draft the output
Prepare handover
Schedule/monitor next run
```

The Tasklet-like part is hidden underneath:

```text
Trigger -> capsule snapshot -> agent run -> tool calls -> approvals -> output -> audit trail
```

## First Three Agents

Do not start with a universal automation agent. Start with three agents that
fit PRAXIS and can be validated against current code.

### 1. Daily Brief Agent

Purpose: produce a morning capsule-aware brief.

Inputs:

- active capsule id;
- situation core;
- source/document cores;
- time horizon;
- watchlist terms;
- output core target.

Tools:

- grounded search;
- source scout;
- timeline events;
- risk indicators;
- memo/brief writer.

Human gates:

- publishing external email;
- marking a fact resolved;
- updating canonical graph facts.

### 2. Research Memo Agent

Purpose: turn a question into a sourced memo draft with gaps visible.

Inputs:

- user question;
- active capsule;
- source receipts;
- document chunks;
- prior memos;
- output format.

Tools:

- corpus search;
- source scout;
- research extract;
- policy memo;
- red-team review.

Human gates:

- final memo export;
- unsupported claim acceptance;
- graph promotion.

### 3. Watchlist Agent

Purpose: run on a schedule or webhook and tell the user when something changes.

Inputs:

- capsule;
- monitored actors/entities/topics;
- thresholds;
- time horizon;
- notification preference.

Tools:

- grounded search;
- risk indicators;
- timeline events;
- sanctions scan;
- source receipts.

Human gates:

- notifying external recipients;
- changing capsule status;
- changing objective/output core.

## Runtime Architecture

Use the existing GCP stack:

```text
Next.js route
  -> withAuth / withCalibration where AI is involved
  -> create AgentRun in Cloud SQL Postgres
  -> enqueue Cloud Task or Pub/Sub event
  -> Cloud Run/Next worker route executes step
  -> call current AI/tool routes or shared services
  -> persist tool calls, receipts, approvals, outputs
  -> update capsule readiness/context stack
  -> stream/poll status in the app
```

### State Stores

Firestore remains the owner-scoped app/capsule state store:

```text
users/{uid}/capsules/{capsuleId}
users/{uid}/contextStacks/default
users/{uid}/cores/*
users/{uid}/situations/*
```

Cloud SQL Postgres is the canonical durable execution ledger:

```text
agents
agent_runs
agent_run_events
tool_calls
approvals
agent_triggers
documents
document_chunks
audit_events
```

Do not make this a second app. Agent runs must point back to:

- `capsuleId`;
- `contextPackageId` when available;
- selected core ids;
- tool ids from the canonical registry;
- memo/draft/work-product ids when output is produced.

### Minimal Run State

```text
queued
running
waiting_approval
succeeded
failed
cancelled
expired
```

### Required Run Controls

The run schema should include:

- `traceId`;
- `parentRunId`;
- `idempotencyKey`;
- `maxSteps`;
- `maxSessionMinutes`;
- internal cost/spend estimate;
- approval policy;
- source/tool receipt links.

Do not promise run resumability in v1. If a worker fails, mark the run failed
and allow retry as a new run with `parentRunId`.

### Minimal Trigger Types

```text
manual
schedule
webhook
email_event
source_update
capsule_change
```

Start with `manual` and `schedule`. Defer Gmail/Slack/Drive OAuth until the
agent run ledger and approval flow are reliable.

## Tool Layer

PRAXIS tools should be exposed to agents through a typed internal registry.

Initial agent-callable tools:

| Tool | Existing anchor |
|---|---|
| `praxis.resolve_context` | `/api/context/resolve`, context injection |
| `praxis.search_corpus` | `searchSituationCorpus` |
| `praxis.source_scout` | `/api/ai/source-scout` |
| `praxis.grounded_search` | `/api/ai/grounded-search` |
| `praxis.extract_timeline` | `/api/ai/timeline-events` |
| `praxis.check_risk` | `/api/ai/risk-indicators` |
| `praxis.draft_memo` | `/api/ai/policy-memo`, Memo Studio |
| `praxis.red_team` | `/api/ai/red-team-review` |
| `praxis.prepare_handover` | `/api/memos/[id]/handover-package` plus new capsule handover contract |

MCP should be the external interoperability surface, not the first internal
orchestrator. The repo already has `backend/mcp/praxis_server.py`; extend it
after the internal run ledger is stable.

## Browser And Code Execution

Tasklet uses browser/computer fallback. PRAXIS should add this later and keep it
constrained.

Phase 1:

- no autonomous browser writes;
- no arbitrary generated code execution;
- use existing web research and source receipt paths;
- use Playwright only for test verification and carefully allowlisted read-only
  internal workflows.

Phase 2:

- add managed read-only browser sessions for public sources that block simple
  fetch;
- default candidate: `browser-use` for the Python browser-agent loop plus
  Steel.dev for managed browser infrastructure;
- allowlisted domains only;
- capture screenshots/text/extraction receipts;
- persist every URL, timestamp, and action.

Phase 3:

- code sandbox for document conversion/table cleaning only;
- no credentialed SaaS browser automation without explicit per-run approval.

Potential providers later: Browserbase/Stagehand, E2B, or a dedicated Cloud Run
job sandbox. Do not add them before the run ledger, approval model, and source
receipt contract are shipped.

The research intake note for this decision is
[`TASKLET_RESEARCH_INTAKE_2026-05-15.md`](./TASKLET_RESEARCH_INTAKE_2026-05-15.md).

## Generated UI / Instant Apps Equivalent

Tasklet's generated apps are impressive, but PRAXIS should not start with
arbitrary generated UI. The PRAXIS equivalent is safer:

- generated memo;
- generated Canvas view config;
- generated source gap table;
- generated timeline;
- generated graph proposal;
- generated handover packet.

The agent can recommend a view, but the app renders it through known components.
That preserves trust, accessibility, tests, and export quality.

## Model Strategy

Keep PRAXIS's current provider posture:

- primary: Vertex AI / Gemini through existing provider abstraction;
- model ids only through the model matrix/provider layer;
- all user-facing AI routes stay behind `withCalibration`;
- Claude can be evaluated later through Vertex AI or provider abstraction if a
  specific task needs it, but do not rewrite around Anthropic just because
  Tasklet uses Claude.

This is an architecture rule, not taste. The current audits, GCP project,
secrets, route wrappers, and compliance docs are already built around the
Vertex/Gemini path.

## Build Order

### Wave 0: Product Contract

Deliverables:

- this plan;
- `src/lib/product/tasklet-style-runtime.ts` typed runtime blueprint;
- unit test locking the stack decisions.

Validation:

- `npx vitest run tests/unit/lib/product/tasklet-style-runtime.test.ts`
- `npx tsc --noEmit`

### Wave 1: Cloud SQL Agent Run Ledger

Files to add:

```text
src/lib/agent-runtime/types.ts
src/lib/agent-runtime/postgres.ts
src/lib/agent-runtime/events.ts
src/app/api/agents/runs/route.ts
src/app/api/agents/runs/[runId]/route.ts
src/app/api/agents/runs/[runId]/events/route.ts
```

Behavior:

- create a manual run from active capsule;
- persist immutable run events;
- list recent runs for the active capsule;
- no new AI yet.

### Wave 2: Manual Research Memo Agent

Files to add or extend:

```text
src/lib/agent-runtime/plans/research-memo.ts
src/lib/agent-runtime/execute-run.ts
src/app/api/agents/runs/[runId]/execute/route.ts
```

Behavior:

- resolve capsule context;
- call corpus/source/memo/red-team services;
- write tool call rows;
- create memo draft or work product;
- show status in Ask PRAXIS and Memo Studio.

### Wave 3: Daily Brief Schedule

Files to add or extend:

```text
src/app/api/agents/triggers/route.ts
src/app/api/cron/agent-triggers/route.ts
infrastructure/scheduler/agent-triggers-cron.yaml
```

Behavior:

- user can enable a daily brief on a capsule;
- cron scans due triggers;
- Cloud Tasks executes runs;
- output is internal draft/notification only.

### Wave 4: Approval Gates

Files to add or extend:

```text
src/lib/agent-runtime/approvals.ts
src/app/api/agents/runs/[runId]/approvals/route.ts
src/components/agents/ApprovalQueue.tsx
```

Behavior:

- tool risk levels;
- waiting approval state;
- approve/reject with reason;
- no external send without approval.

### Wave 5: MCP And Integration Layer

Files to extend:

```text
backend/mcp/praxis_server.py
src/lib/agent-runtime/mcp-tools.ts
docs/implementation/PRAXIS_MCP_AGENT_TOOLS.md
```

Behavior:

- expose read tools externally;
- allow internal agent runtime to call MCP-compatible adapters where useful;
- defer broad SaaS OAuth until workspace/team permissions are solid.

## UX Work

Keep primary nav unchanged:

```text
Home
Ask PRAXIS
Library
Memo Studio
Canvas
Advanced
```

Add runtime affordances in existing surfaces:

- Home: recent agent runs, scheduled briefs, active capsule health, and direct
  `/agents/[runId]` links for active work.
- Ask PRAXIS: "Run with active capsule", "Schedule", "Prepare memo", "Prepare handover".
- Library: source/document changes that can trigger a run.
- Memo Studio: outputs from runs and review receipts.
- Canvas: timeline/graph/source gaps produced by runs.
- Advanced: agent run logs, trigger settings, provider/model diagnostics.

Canonical route behavior:

- `https://praxis.tacitus.me/agents/[runId]` is the durable workspace URL for a
  private capsule-bound run.
- Starting a run from the cockpit should queue/dispatch it, then navigate to
  `/agents/[runId]`.
- The route must reuse the shared PRAXIS cockpit and focus the selected run,
  not introduce a second agent dashboard or separate app domain.
- `/app/agents/[runId]` is compatibility-only and redirects to the canonical
  route.

## What Not To Build Yet

- A generic Tasklet clone.
- A separate agent dashboard with new primary navigation.
- Supabase/Inngest/Trigger.dev as a second persistence/workflow stack.
- Credentialed browser automation.
- Autonomous writes to graph facts.
- External email/slack sending without approval.
- Arbitrary generated apps rendered as raw generated code.

## Definition Of "Works Better"

The first serious release is done when:

- a user can build or select a ContextCapsule;
- Ask PRAXIS can start a Research Memo Agent run from that capsule;
- the run persists every step and tool call;
- the output appears in Memo Studio;
- source receipts and gaps are visible;
- risky actions require approval;
- a Daily Brief trigger can run on schedule;
- the run can be opened through `/agents/[runId]`, inspected, retried, or
  archived;
- `audit:gate` and focused Playwright smokes pass.

## Implementation Prompt For Next Coding Wave

```text
You are in:
C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work

Read first:
- AGENTS.md
- CLAUDE.md
- docs/product/CONTEXT_CAPSULE_PRODUCT_REBUILD_PLAN.md
- docs/product/TASKLET_STYLE_PRAXIS_AGENT_RUNTIME_PLAN.md
- src/lib/product/tasklet-style-runtime.ts
- src/lib/context/capsule-service.ts
- src/lib/agents/run-agent.ts
- src/lib/constants/tool-registry.ts

Goal:
Implement Wave 1: Cloud SQL Agent Run Ledger. Reuse Firebase/GCP/Vertex/Cloud Tasks
posture. Do not introduce Supabase, Inngest, Trigger.dev, Prisma, or a new
database.

Scope:
1. Add src/lib/agent-runtime/types.ts with AgentSpec, AgentRun,
   AgentToolCall, AgentApproval, AgentRunEvent, AgentTrigger.
2. Add src/lib/agent-runtime/postgres.ts with Cloud SQL/Postgres helpers:
   createAgentRun, getAgentRun, listCapsuleRuns, appendAgentRunEvent,
   updateAgentRunStatus.
3. Add POST /api/agents/runs to create a manual run from the active capsule.
   It should authenticate, validate input with Zod, persist a queued run, and
   return runId/status. Do not execute AI yet.
4. Add GET /api/agents/runs/[runId] to inspect a run.
5. Add unit tests for state transitions and SQL row/schema shape.
6. Add a small UI entry only if there is an existing obvious place in Ask
   PRAXIS; otherwise stop at API + tests.

Validation:
- npx vitest run tests/unit/lib/agent-runtime
- npx tsc --noEmit
- npm run audit:repo-shape
- npm run audit:architecture-reference
```
