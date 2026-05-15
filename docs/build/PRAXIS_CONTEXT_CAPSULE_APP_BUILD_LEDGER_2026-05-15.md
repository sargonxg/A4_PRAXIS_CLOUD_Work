# PRAXIS ContextCapsule App Build Ledger

Date: 2026-05-15  
Status: active implementation ledger for the next build sessions  
Repo: `C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work`  
Domain: `https://praxis.tacitus.me`

## Purpose

This ledger turns the current product direction into executable work. Future
Codex, Claude Code, and human sessions should use this file to pick one
coherent slice, improve the app, validate it, and leave `main` clearer than it
was found.

The product target is simple at the surface and serious underneath:

```text
Homepage prompt -> signup/login -> app sidebar -> active ContextCapsule bar
-> Ask PRAXIS / Library / Memo Studio / Canvas -> auditable agent runs
```

## Current Foundation

Already established:

- Public landing has the ContextCapsule prompt bar, signup/login continuation,
  active bar glimpse, policy path previews, combination examples, output
  products, and connector posture.
- Authenticated app spine remains `Home`, `Ask PRAXIS`, `Library`,
  `Memo Studio`, `Canvas`, `Advanced`.
- Active capsule/core concepts exist across Ask PRAXIS, Contexts, Library,
  Memo Studio, and Canvas.
- Product contract lives in `src/lib/product/context-capsules.ts`.
- Policy capsule guide lives in
  `docs/product/CONTEXT_CAPSULE_POLICY_RESEARCH_GUIDE.md`.
- Canonical Tasklet-style runtime architecture lives in
  `docs/product/PRAXIS_CANONICAL_APP_STRUCTURE.md` and
  `docs/product/TASKLET_STYLE_PRAXIS_AGENT_RUNTIME_PLAN.md`.

## Hard Boundaries

- Do not add a new primary nav item.
- Do not add a new primary database.
- Do not add Supabase, Inngest, Trigger.dev, Prisma, or a second runtime
  foundation.
- Do not claim browser automation, email sending, broad SaaS integrations, or
  code sandboxing are live until they are implemented and approval-gated.
- Keep Firestore as the capsule/app-state store.
- Add Cloud SQL Postgres for the durable agent run ledger.
- Use Cloud Tasks for per-run dispatch.
- Keep MCP private/read-first until approvals are reliable.
- Preserve older docs as historical evidence unless references prove they are
  dead. Prefer index notes over deletion.

## Active Work Queue

### 0. Session Hygiene

Owner: every session  
Status: ongoing

Checklist:

- `git pull origin main`
- `git status`
- inspect dirty files before editing;
- read `AGENTS.md`, `CLAUDE.md`, `docs/product/README.md`, this ledger,
  `STATUS.md`, `TODO.md`, and `CHANGELOG.md`;
- own a narrow file set;
- run focused validation;
- update docs/status/changelog;
- commit and push only after validation.

### 1. Public-To-App Usability

Owner: frontend/docs session  
Status: partly implemented, keep improving with browser evidence

Goal:

Users must understand the product before login and land inside the app with
obvious context.

Tasks:

- Keep the homepage active bar glimpse visible on desktop and mobile.
- Make signup/login preserve the pending capsule prompt/template.
- Ensure `/app` or Home shows the sidebar and the active ContextCapsule strip.
- Show a small current capsule summary on Home.
- Keep Ask PRAXIS copy explicit: it asks the active capsule, not a blank model.
- Add or update Playwright smoke for the public prompt-to-login path and
  authenticated shell when a stable test session is available.

Validation:

- `npm run build`
- focused browser check for `/`
- `npm run smoke:core-flows` when the route flow changes.

### 2. Capsule Registry And Onboarding

Owner: frontend/product session  
Status: registry exists, creation flow needs deeper wiring

Goal:

The product path registry should drive onboarding suggestions, examples, and
eventual app defaults.

Tasks:

- Use `POLICY_PATH_PROFILES` for onboarding path suggestions.
- Let users start generic, then choose or infer a path.
- Add custom User Core creation for user personas.
- Attach suggested tools and outputs from the chosen path.
- Keep user-owned cores separate from demo cores.
- Add tests when new paths, outputs, connectors, or recipes are added.

Validation:

- `npx vitest run tests/unit/lib/product`
- `npx tsc --noEmit`

### 3. Active Capsule Workbench

Owner: frontend/full-stack session  
Status: existing surfaces present, workbench needs smoother create/fork/combine

Goal:

The Contexts surface should be the full capsule workbench without becoming a
new primary app.

Tasks:

- Review `/app/contexts` against the canonical capsule anatomy.
- Ensure create-new-core flows are available for User, Situation, Source,
  Document, Graph, Time, Tool, Objective, Product, Output, and Memory where
  current APIs support it.
- Improve fork/copy/demo language so demo mode stays read-only until copied.
- Add capsule combination UI as a proposal/review flow, not a destructive merge.
- Preserve contradictions and graph proposals during combination.

Validation:

- focused unit tests for core/capsule state;
- focused Playwright smoke for create/fork/combine where available.

### 4. Cloud SQL Agent Run Ledger

Owner: Codex backend session  
Status: first queued-run contract implemented; production Cloud SQL wiring verification remains

Goal:

Create the durable ledger for Tasklet-style PRAXIS runs.

Tasks:

- Add typed run, event, tool-call, approval, trigger, and artifact contracts.
- Include `traceId`, `parentRunId`, `idempotencyKey`, `maxStep`,
  `maxSessionMinutes`, and internal cost/spend fields.
- Add capsule/core pointers to every run.
- Add pure state-transition helpers and tests.
- Add `POST /api/agents/runs`, `GET /api/agents/runs/[runId]`, and list by
  capsule.
- First pass creates queued runs only. No model execution yet.

Shipped in this wave:

- `src/lib/agent-runtime/types.ts`
- `src/lib/agent-runtime/state.ts`
- `src/lib/agent-runtime/postgres.ts`
- `src/app/api/agents/runs/route.ts`
- `src/app/api/agents/runs/[runId]/route.ts`
- focused unit tests under `tests/unit/lib/agent-runtime`

Remaining blockers:

- Production Cloud SQL env wiring must provide `AGENT_RUNTIME_DATABASE_URL`,
  `PRAXIS_DATABASE_URL`, or `DATABASE_URL`.
- Tool-call, approval, trigger, and agent spec table writes are typed but not
  executed until later runtime waves need them.

Validation:

- `npx vitest run tests/unit/lib/agent-runtime`
- `npx tsc --noEmit`
- `npm run build`
- `npm run audit:repo-shape`
- `npm run audit:architecture-reference`
- `node scripts/audit-ai-routes.mjs`

### 5. Cloud Tasks Dispatch

Owner: Codex backend session  
Status: no-op dispatch boundary implemented; production Cloud Tasks/IAM wiring verification remains

Goal:

Move run execution out of the web request path.

Tasks:

- Add Cloud Tasks helper for the `agent-runs` queue.
- Add private worker boundary with OIDC expectations documented.
- Implement no-op execution first: `queued -> running -> succeeded`.
- Persist run events for every transition.
- Keep idempotency and retries explicit.

Shipped in this wave:

- `src/lib/agent-runtime/cloud-tasks.ts`
- `src/lib/agent-runtime/worker-auth.ts`
- `src/app/api/agents/runs/[runId]/dispatch/route.ts`
- `src/app/api/agents/runs/[runId]/execute/route.ts`
- focused Cloud Tasks payload tests under `tests/unit/lib/agent-runtime`

Runtime configuration required before production dispatch:

- `AGENT_RUN_WORKER_BASE_URL` or `APP_URL` for the worker route target.
- `AGENT_RUN_WORKER_SERVICE_ACCOUNT_EMAIL` for Cloud Tasks OIDC.
- `AGENT_RUN_WORKER_OIDC_AUDIENCE` when the audience should differ from the
  exact execute URL.
- `AGENT_RUN_TASKS_PROJECT`, `AGENT_RUN_TASKS_LOCATION`, and
  `AGENT_RUN_TASKS_QUEUE` only when overriding the default
  `praxisbytacitus/us-central1/agent-runs` queue.
- Optional `AGENT_RUN_WORKER_SHARED_SECRET` for local/non-production smoke only;
  production should use Cloud Tasks OIDC.

Validation:

- focused runtime tests;
- `npm run audit:gcp` when credentials are available.

### 6. Research Memo Agent

Owner: paired backend/frontend session  
Status: after dispatch

Goal:

First real capsule-aware agent run.

Tasks:

- Start from Ask PRAXIS or Home.
- Resolve active capsule.
- Use existing PRAXIS source/corpus/memo/red-team capabilities.
- Persist plan steps, tool calls, source receipts, and gaps.
- Write output to Memo Studio.
- Keep risky actions draft-only or approval-gated.

Validation:

- mocked model/tool integration test;
- Ask-to-Memo smoke when feasible.

### 7. Daily Brief And Watchlist

Owner: backend/runtime session  
Status: after Research Memo Agent

Goal:

Recurring capsule-aware monitoring without external sending by default.

Tasks:

- Add trigger records.
- Add Cloud Scheduler scanner.
- Queue daily brief/watchlist runs.
- Create internal draft/alert outputs.
- Add approval gates before external notifications.

### 8. Approval Queue And Governance

Owner: full-stack session  
Status: after real runs

Goal:

Risky work must pause visibly.

Tasks:

- Add approval queue UI inside existing app surfaces.
- Add approve/reject API.
- Add `waiting_approval` run state.
- Gate external communication, graph fact promotion, sensitive exports, and
  credentialed browser actions.

### 9. MCP And Connectors

Owner: backend/integrations session  
Status: after approvals

Goal:

Expose PRAXIS tools/resources safely.

Tasks:

- Add private read-first MCP gateway.
- Expose context resolve, source search, memo output, and library resources.
- Add write tools only after approval gates are proven.
- Keep external SaaS integrations behind org permissions and token encryption.

### 10. Browser And Sandbox Lane

Owner: backend/runtime session  
Status: deferred

Goal:

Use browser automation only when APIs and source/document connectors are not
enough.

Tasks:

- Start with read-only browser-use plus Steel.dev managed sessions.
- Add allowlisted domains.
- Persist screenshots/source receipts.
- Require approval for credentialed or destructive actions.
- Move to GKE only when workload proves Cloud Run is insufficient.

## Documentation Cleanup Policy

Active docs:

- `docs/product/README.md`
- `docs/product/PRAXIS_CANONICAL_APP_STRUCTURE.md`
- `docs/product/CONTEXT_CAPSULE_POLICY_RESEARCH_GUIDE.md`
- `docs/product/TASKLET_STYLE_PRAXIS_AGENT_RUNTIME_PLAN.md`
- this ledger
- `docs/build/PRAXIS_TASKLET_RUNTIME_AGENT_PROMPTS.md`
- `STATUS.md`
- `TODO.md`
- `CHANGELOG.md`

Historical docs:

- v4/v5/v7 docs are evidence and prior build records.
- Keep them unless they are proven dead and unreferenced.
- If a doc is confusing but valuable, add a superseded/index note rather than
  deleting it.

Deletion candidates:

- generated scratch files;
- duplicated prompt packs that are already archived;
- docs that claim removed live functionality and have no current references.

Before deleting:

- run `rg "<filename-or-heading>"`;
- check `docs/product/README.md`, `AGENTS.md`, and architecture references;
- prefer archive movement for useful historical material.

## Required End State For Each Session

Every coding session should leave:

- a coherent commit on `main` when validation passes;
- `STATUS.md`, `TODO.md`, and `CHANGELOG.md` updated;
- focused tests for changed contracts;
- no untracked implementation files;
- no fake-live product claims;
- `graphify update .` run after code changes.

## Current Next Best Prompts

Use:

- Codex backend/runtime prompt in
  `docs/build/PRAXIS_TASKLET_RUNTIME_AGENT_PROMPTS.md`.
- Claude Code frontend/docs prompt in
  `docs/build/PRAXIS_TASKLET_RUNTIME_AGENT_PROMPTS.md`.

The Codex backend session should start with Queue 4.  
The Claude Code frontend/docs session should start with Queue 1 or 3,
depending on whether the priority is public onboarding or `/app/contexts`.
