# PRAXIS Tasklet-Style Runtime Agent Prompts

Date: 2026-05-15  
Repo: `C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work`  
Remote: `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`  
Canonical domain: `https://praxis.tacitus.me`

Use this file to start parallel coding sessions without losing coherence.

## Shared Rules For Every Session

Every Codex or Claude Code session starts here:

```powershell
cd C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work
git pull origin main
git status
git log --oneline -5
npm install
```

If the tree is dirty:

- inspect before editing;
- do not overwrite uncommitted work;
- coordinate file ownership with the other session;
- keep the change coherent and small enough to validate.

Read before editing:

1. `AGENTS.md`
2. `CLAUDE.md`
3. `ARCHITECTURE.md`
4. `docs/product/README.md`
5. `docs/product/PRAXIS_CANONICAL_APP_STRUCTURE.md`
6. `docs/product/CONTEXT_CAPSULE_POLICY_RESEARCH_GUIDE.md`
7. `docs/product/TASKLET_STYLE_PRAXIS_AGENT_RUNTIME_PLAN.md`
8. `docs/product/CONTEXT_CAPSULE_PRODUCT_REBUILD_PLAN.md`
9. `docs/build/PRAXIS_CONTEXT_CAPSULE_APP_BUILD_LEDGER_2026-05-15.md`
10. `docs/product/TASKLET_RESEARCH_INTAKE_2026-05-15.md`
11. `docs/product/PRAXIS_FOUNDATION_COHERENCE_CHECK_2026-05-15.md`
12. `docs/product/PRAXIS_ADK_GENKIT_INTEGRATION_PLAN.md`
13. `STATUS.md`
14. `TODO.md`
15. `CHANGELOG.md` `[Unreleased]`

Hard product boundaries:

- Keep visible primary navigation as `Home`, `Ask PRAXIS`, `Library`,
  `Memo Studio`, `Canvas`, `Advanced`.
- Build PRAXIS as a ContextCapsule-native agent workbench, not a generic
  Tasklet clone.
- Use Cloud Run first, GKE later only for heavy browser/code sandbox pools.
- Use Cloud SQL Postgres for the canonical agent run ledger.
- Keep Firestore for capsules, active context stacks, cores, and app state.
- Use Cloud Tasks for per-run dispatch.
- Keep MCP private/read-first until approval gates are reliable.
- Defer browser automation until after run ledger, dispatch, outputs, and
  approval gates. When it starts, default to `browser-use` plus Steel.dev.
- Do not add Supabase, Inngest, Trigger.dev, Prisma, or a new primary database.
- Do not hardcode model names in route files.
- Do not bypass `withCalibration` for user-facing AI work.
- Do not expose internal costs, provider internals, or unsupported live claims
  in normal UI.

Every session should improve something real:

- code behavior;
- tests;
- docs that future agents actually read;
- validation/audit coverage;
- cleanup of proven stale paths or stale claims.

Every session should pick one queue item from
`docs/build/PRAXIS_CONTEXT_CAPSULE_APP_BUILD_LEDGER_2026-05-15.md` and record
progress there or in `STATUS.md` before finishing.

Every session should end with:

```powershell
npx tsc --noEmit
npm run build
npm run audit:repo-shape
npm run audit:architecture-reference
node scripts/audit-ai-routes.mjs
npx vitest run <focused tests>
```

If code files changed:

```powershell
graphify update .
```

Before pushing:

```powershell
git status
git diff --stat
git add -A
git commit -m "<coherent message>"
git pull --rebase origin main
git push origin main
```

Only deploy when explicitly asked or when the session scope requires a deploy
checkpoint and credentials are available.

## Parallel Ownership

Recommended split:

- Codex session: backend/runtime, schemas, APIs, tests, audits.
- Claude Code session: frontend/app shell, UX wiring, docs/readme cleanup,
  Playwright smoke.

Avoid editing the same files in both sessions. If both must touch a shared file,
make one session own the edit and the other only read it.

Shared files requiring coordination:

- `ARCHITECTURE.md`
- `README.md`
- `STATUS.md`
- `TODO.md`
- `CHANGELOG.md`
- `src/components/app/*`
- `src/components/ask/*`
- `src/lib/product/*`
- `docs/product/*`

## Codex Prompt: Wave 1 Backend Runtime

Paste this into a new Codex session.

```text
You are working in:
C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work

Goal:
Implement Queue 4 / Wave 1 of the canonical Tasklet-style PRAXIS runtime: the
Cloud SQL Agent Run Ledger. This is the backend/control-plane foundation for
praxis.tacitus.me becoming a ContextCapsule-native agent workbench.

Read first:
- AGENTS.md
- CLAUDE.md
- ARCHITECTURE.md
- docs/product/README.md
- docs/product/PRAXIS_CANONICAL_APP_STRUCTURE.md
- docs/product/CONTEXT_CAPSULE_POLICY_RESEARCH_GUIDE.md
- docs/product/TASKLET_STYLE_PRAXIS_AGENT_RUNTIME_PLAN.md
- docs/build/PRAXIS_CONTEXT_CAPSULE_APP_BUILD_LEDGER_2026-05-15.md
- src/lib/product/tasklet-style-runtime.ts
- docs/product/TASKLET_RESEARCH_INTAKE_2026-05-15.md
- docs/product/PRAXIS_FOUNDATION_COHERENCE_CHECK_2026-05-15.md
- src/lib/context/capsule-service.ts
- src/lib/context/core-objects.ts
- src/lib/agents/run-agent.ts
- src/lib/ai/providers.ts
- STATUS.md
- TODO.md

Non-negotiable decisions:
- Cloud SQL Postgres is the canonical durable agent run ledger.
- Firestore remains the app/capsule/core/context-stack state store.
- Do not add Supabase, Inngest, Trigger.dev, Prisma, or a new primary database.
- Do not execute AI in Wave 1; just persist and inspect queued runs.
- Do not add new primary navigation.
- Preserve all existing uncommitted work unless Giulio explicitly says to reset.

Own these files/modules:
- src/lib/agent-runtime/**
- src/app/api/agents/runs/**
- tests/unit/lib/agent-runtime/**
- docs/product/PRAXIS_CANONICAL_APP_STRUCTURE.md only if a contract detail changes
- TODO.md / STATUS.md / CHANGELOG.md for final documentation updates

Do not edit frontend app-shell files in this session unless needed for a tiny
smoke entry. Leave UI wiring to the Claude Code session.

Implementation tasks:
1. Add `src/lib/agent-runtime/types.ts`.
   Define:
   - AgentRunStatus: queued, running, waiting_approval, succeeded, failed, cancelled, expired
   - AgentTriggerType: manual, schedule, webhook, email_event, source_update, capsule_change
   - AgentToolRisk: low, medium, high
   - AgentSpec
   - AgentRun
   - AgentRunEvent
   - AgentToolCall
   - AgentApproval
   - AgentTrigger
   Include control fields:
   - traceId
   - parentRunId
   - idempotencyKey
   - maxSteps
   - maxSessionMinutes
   - internal estimated cost/spend fields
   Include capsule pointers:
   - ownerUid
   - capsuleId
   - contextStackId
   - contextPackageId
   - userCoreId
   - situationCoreId
   - sourceCoreIds
   - documentCoreIds
   - graphCoreId
   - timeCoreId
   - toolCoreIds
   - objectiveCoreIds
   - productCoreIds
   - outputCoreIds
   - memoryCoreId

2. Add `src/lib/agent-runtime/state.ts`.
   Provide pure helpers:
   - canTransitionAgentRun(from, to)
   - assertAgentRunTransition(from, to)
   - makeAgentRunEvent(...)
   - summarizeRunForCapsule(...)
   - makeIdempotencyKey(...)
   Tests should cover valid and invalid transitions.

3. Add a Cloud SQL boundary module.
   Use existing repo database conventions if present. If no suitable helper is
   available, create a narrow adapter interface first instead of wiring a new
   dependency.
   Target file:
   - `src/lib/agent-runtime/postgres.ts`
   Functions:
   - createAgentRun(input)
   - getAgentRun(ownerUid, runId)
   - listAgentRunsForCapsule(ownerUid, capsuleId, limit)
   - appendAgentRunEvent(input)
   - updateAgentRunStatus(input)
   The first implementation may be a typed adapter/stub if Cloud SQL client
   wiring is not centralized yet, but the API contract must be real and tested.

4. Add API routes:
   - `POST /api/agents/runs`
   - `GET /api/agents/runs/[runId]`
   - optional `GET /api/agents/runs?capsuleId=...`
   Routes must:
   - authenticate using existing auth helpers;
   - validate with Zod;
   - resolve or require active capsule id;
   - create queued run only;
   - return run id, status, capsule id, and created timestamp;
   - avoid AI/model calls in Wave 1.

5. Add focused unit tests:
   - state transition tests;
   - event creation tests;
   - schema/pointer normalization tests;
   - route validation tests if current test harness supports it.

6. Documentation updates:
   - STATUS.md: record what was implemented and what remains.
   - TODO.md: move completed Wave 1 tasks down and promote Wave 2 Cloud Tasks dispatch.
   - CHANGELOG.md: add an `[Unreleased]` entry.
   - If the implementation changes the canonical contract, update
     docs/product/PRAXIS_CANONICAL_APP_STRUCTURE.md.

Validation:
- npx vitest run tests/unit/lib/agent-runtime
- npx vitest run tests/unit/lib/product/tasklet-style-runtime.test.ts
- npx tsc --noEmit
- npm run build
- npm run audit:repo-shape
- npm run audit:architecture-reference
- node scripts/audit-ai-routes.mjs
- graphify update .

Finish:
- Report files changed and exact validation results.
- Update `docs/build/PRAXIS_CONTEXT_CAPSULE_APP_BUILD_LEDGER_2026-05-15.md`
  if any queue status or blocker changed.
- If all checks pass and credentials are available, commit a coherent checkpoint
  and push to main:
  `git add -A`
  `git commit -m "feat(agent-runtime): add Cloud SQL run ledger contract"`
  `git pull --rebase origin main`
  `git push origin main`
```

## Claude Code Prompt: Frontend And Documentation Wiring

Paste this into a new Claude Code session.

```text
You are working in:
C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work

Goal:
Make the current app and docs clearly express the canonical Tasklet-style
ContextCapsule runtime without widening the visible product surface. Prioritize
Queue 1 public-to-app usability or Queue 3 active capsule workbench from the
build ledger.

Read first:
- AGENTS.md
- CLAUDE.md
- ARCHITECTURE.md
- docs/product/README.md
- docs/product/PRAXIS_CANONICAL_APP_STRUCTURE.md
- docs/product/CONTEXT_CAPSULE_POLICY_RESEARCH_GUIDE.md
- docs/product/TASKLET_STYLE_PRAXIS_AGENT_RUNTIME_PLAN.md
- docs/product/CONTEXT_CAPSULE_PRODUCT_REBUILD_PLAN.md
- docs/build/PRAXIS_CONTEXT_CAPSULE_APP_BUILD_LEDGER_2026-05-15.md
- src/lib/product/context-capsules.ts
- src/lib/product/tasklet-style-runtime.ts
- src/components/ask/AskWorkspacePage.tsx
- src/components/app/core-context-strip.tsx
- src/components/dashboard/ask-praxis-home.tsx
- src/components/cores/ContextBuilderRoom.tsx
- STATUS.md
- TODO.md

Non-negotiable decisions:
- Keep primary nav exactly: Home, Ask PRAXIS, Library, Memo Studio, Canvas, Advanced.
- Do not add a new Agents nav item.
- Do not show provider internals or internal credit costs in normal UI.
- Do not claim browser automation, code sandboxing, broad SaaS integrations, or
  external sending are live.
- Make the UX say "agent runs inherit the active ContextCapsule" in product
  language, not infrastructure language.
- Preserve all existing uncommitted work unless Giulio explicitly says to reset.

Own these areas:
- docs/product/**
- docs/build/PRAXIS_TASKLET_RUNTIME_AGENT_PROMPTS.md
- README.md / ARCHITECTURE.md / STATUS.md / TODO.md / CHANGELOG.md
- frontend copy in:
  - src/components/ask/AskWorkspacePage.tsx
  - src/components/dashboard/ask-praxis-home.tsx
  - src/components/app/core-context-strip.tsx
  - src/components/cores/ContextBuilderRoom.tsx
  - src/components/landing/phase8-wow-landing.tsx

Avoid backend runtime files unless the Codex session asks for a shared type.

Implementation tasks:
1. Verify the landing/app copy presents the new structure:
   - PRAXIS builds ContextCapsules.
   - Ask PRAXIS asks the active capsule.
   - Agents/runs are framed as capsule-aware work, not generic automation.
   - Outputs land in Memo Studio, Canvas, Library, and handover.

2. Add a small "Agent runs" or "Scheduled work" affordance only inside existing
   surfaces if it improves clarity:
   - Home can show "Recent runs" or "Next scheduled brief" placeholder/state.
   - Ask PRAXIS can show "Run from active capsule" as a command.
   - Advanced can mention runtime logs/triggers if already appropriate.
   Do not add fake-live controls. If backend route is not implemented yet, label
   the affordance as planned/queued or hide it behind an inactive state.

3. Clean documentation structure:
   - Ensure docs/product/README.md is the product docs entry point.
   - Ensure ARCHITECTURE.md points to the canonical product/runtime docs.
   - Ensure README.md points implementers to the canonical docs.
   - Ensure TODO.md separates the new runtime queue from older MVP follow-ups.
   - Mark older v7/v5 docs as historical/subsumed in references, not deleted.

4. Add or update Playwright smoke only if UI behavior changes:
   - landing prompt to login/signup;
   - Ask PRAXIS loads active capsule language;
   - Home keeps the six-surface shell.

5. Documentation cleanup:
   - Do not delete old docs without checking references.
   - Prefer adding a short "superseded by" note or index pointer.
   - Remove stale user-facing claims only when you can verify they are stale.

Validation:
- npx tsc --noEmit
- npm run build
- npm run lint
- npm run audit:repo-shape
- npm run audit:architecture-reference
- npm run smoke:core-flows if landing/app flow changes
- relevant Playwright smoke for touched UI
- graphify update . if code files changed

Finish:
- Report files changed and exact validation results.
- Update `docs/build/PRAXIS_CONTEXT_CAPSULE_APP_BUILD_LEDGER_2026-05-15.md`
  if any queue status or blocker changed.
- If checks pass and credentials are available, commit a coherent checkpoint and
  push to main:
  `git add -A`
  `git commit -m "docs(product): align PRAXIS runtime structure and app copy"`
  `git pull --rebase origin main`
  `git push origin main`
```

## Follow-On Prompt: Wave 2 Cloud Tasks Dispatch

Use after Wave 1 is merged.

```text
Goal:
Implement Wave 2 of the canonical PRAXIS runtime: Cloud Tasks dispatch and the
private agent worker execution boundary.

Read:
- docs/product/PRAXIS_CANONICAL_APP_STRUCTURE.md
- docs/product/TASKLET_STYLE_PRAXIS_AGENT_RUNTIME_PLAN.md
- src/lib/agent-runtime/**
- scripts/audit-gcp.mjs
- docs/GCP_OPERATIONS.md

Scope:
1. Add Cloud Tasks queue helper for `agent-runs`.
2. Add private worker route/service boundary for executing queued runs.
3. Verify OIDC/service-account expectations are documented.
4. Implement only a no-op execution step:
   queued -> running -> succeeded
   with run events written for each transition.
5. Do not add model/tool execution yet.
6. Add tests for queue payload shape, transition handling, retry-safe idempotency.
7. Update STATUS, TODO, CHANGELOG.

Validation:
- focused agent-runtime tests
- npx tsc --noEmit
- npm run build
- npm run audit:repo-shape
- npm run audit:architecture-reference
- npm run audit:gcp if credentials are available
- graphify update .
```

## Follow-On Prompt: Wave 3 Research Memo Agent

Use after Wave 2 is merged.

```text
Goal:
Implement the first real capsule-aware agent: Research Memo Agent.

Behavior:
- User starts from Ask PRAXIS or Home with an active ContextCapsule.
- System creates an agent run.
- Worker resolves capsule context.
- Worker calls existing PRAXIS capabilities:
  context resolve, corpus search, source scout, research extract, policy memo,
  red-team review.
- System writes tool calls and run events.
- Output appears as a Memo Studio draft with source/gap receipt.
- High-risk mutations are not allowed in this wave.

Validation:
- unit tests for plan shape and tool-call persistence
- integration test with mocked model/tool calls
- Playwright smoke from Ask to run result/Memo Studio if feasible
- npx tsc --noEmit
- npm run build
- npm run audit:gate unless too broad for the checkpoint
- graphify update .
```

## Codex Prompt: Wave 3A Genkit Run-Ledger Bridge

Paste this into a new Codex session after Queue 4/5 are green.

```text
You are working in:
C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work

Goal:
Implement the first production-shaped Genkit bridge for PRAXIS agent runs. The
surface must stay Tasklet-simple: AI bar -> active ContextCapsule -> recommended
tools -> generated memo/brief receipt. Under the hood, every Genkit material
event must be mirrored into the PRAXIS Cloud SQL run ledger.

Read first:
- AGENTS.md
- CLAUDE.md
- ARCHITECTURE.md
- docs/product/README.md
- docs/product/PRAXIS_CANONICAL_APP_STRUCTURE.md
- docs/product/TASKLET_STYLE_PRAXIS_AGENT_RUNTIME_PLAN.md
- docs/product/PRAXIS_ADK_GENKIT_INTEGRATION_PLAN.md
- docs/build/PRAXIS_CONTEXT_CAPSULE_APP_BUILD_LEDGER_2026-05-15.md
- src/lib/agent-runtime/types.ts
- src/lib/agent-runtime/state.ts
- src/lib/agent-runtime/postgres.ts
- src/lib/agent-runtime/worker.ts
- src/lib/agent-runtime/mirror.ts
- src/lib/genkit/index.ts
- src/lib/genkit/flows/situation-intelligence.ts
- src/lib/genkit/tools/registry.ts
- src/app/api/ai/policy-memo/route.ts
- STATUS.md
- TODO.md
- CHANGELOG.md

Own these files:
- src/lib/agent-runtime/**
- src/lib/genkit/flows/**
- src/lib/genkit/schemas/**
- tests/unit/lib/agent-runtime/**
- tests/unit/lib/genkit/**
- docs/product/PRAXIS_ADK_GENKIT_INTEGRATION_PLAN.md
- docs/build/PRAXIS_CONTEXT_CAPSULE_APP_BUILD_LEDGER_2026-05-15.md
- STATUS.md / TODO.md / CHANGELOG.md

Do not edit the app shell or landing UI in this Codex session.

Implementation tasks:
1. Add a Genkit worker bridge module, for example
   `src/lib/agent-runtime/genkit-worker.ts`.
2. The module should accept an `AgentRun`, a resolved capsule worker context,
   and a narrow flow choice such as `research_memo_draft`.
3. Start with a mocked/deterministic execution path if live model calls would
   make tests brittle, but keep the API shaped for real Genkit flows.
4. Persist ledger events through `mirrorGenkitFlowEvent`:
   - flow.planned
   - flow.started
   - flow.tool_call when a PRAXIS tool is selected
   - flow.succeeded or flow.failed
5. Return a typed worker result with:
   - runId
   - capsuleId
   - traceId
   - outputTarget: memo_studio | canvas | library | advanced
   - draftTitle or artifactRef when available
   - sourceGapCount
   - approvalRequired boolean
6. Add tests proving no Genkit event is emitted without capsule/run/trace
   pointers.
7. Update the no-op worker only enough to expose the bridge-ready path; do not
   turn on live Research Memo execution unless all route and output contracts
   are complete.
8. Update docs/status so the repo says what is live, what is bridge-ready, and
   what remains deferred.

Validation:
- npx vitest run tests/unit/lib/agent-runtime
- npx vitest run src/__tests__/genkit-provider.test.ts
- npx tsc --noEmit
- npm run build
- npm run audit:genkit-runtime
- npm run audit:genkit-coverage
- npm run audit:architecture-reference
- graphify update .

Finish:
- Report exact files changed and validation results.
- Commit and push only after checks pass:
  git add -A
  git commit -m "feat(agent-runtime): add Genkit run ledger bridge"
  git pull --rebase origin main
  git push origin main
```

## Codex Prompt: Wave 3B ADK Deep Research Queue

Paste this into a separate Codex session after the Genkit bridge lands, or run
it independently if the session owns only ADK files.

```text
You are working in:
C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work

Goal:
Wrap the existing Vertex AI ADK Deep Search capability behind the PRAXIS queued
agent-run ledger. The existing streamed route may remain, but the new path must
look like Tasklet for the user: ask from the AI bar, run continues in the cloud,
and Advanced/Memo Studio can inspect a durable run receipt.

Read first:
- AGENTS.md
- CLAUDE.md
- ARCHITECTURE.md
- docs/product/PRAXIS_CANONICAL_APP_STRUCTURE.md
- docs/product/TASKLET_STYLE_PRAXIS_AGENT_RUNTIME_PLAN.md
- docs/product/PRAXIS_ADK_GENKIT_INTEGRATION_PLAN.md
- src/lib/ai/vertex-agent.ts
- src/app/api/ai/deep-search-agent/route.ts
- src/lib/agent-runtime/types.ts
- src/lib/agent-runtime/postgres.ts
- src/lib/agent-runtime/worker.ts
- src/lib/agent-runtime/mirror.ts
- tests/unit/lib/agent-runtime/**
- STATUS.md
- TODO.md
- CHANGELOG.md

Own these files:
- src/lib/agent-runtime/adk-worker.ts
- src/lib/agent-runtime/mirror.ts if a narrow adapter addition is needed
- src/lib/ai/vertex-agent.ts only for typed event export/helpers
- src/app/api/agents/runs/[runId]/execute/route.ts only if routing is needed
- tests/unit/lib/agent-runtime/**
- docs/product/PRAXIS_ADK_GENKIT_INTEGRATION_PLAN.md
- STATUS.md / TODO.md / CHANGELOG.md

Do not rewrite `/api/ai/deep-search-agent` in this pass. Do not make ADK
session state canonical.

Implementation tasks:
1. Add `src/lib/agent-runtime/adk-worker.ts`.
2. Accept an `AgentRun`, capsule worker context, user message/objective, and
   optional ADK session id.
3. Use `parseAgentEvent` and related helpers from `src/lib/ai/vertex-agent.ts`
   to normalize ADK stream events.
4. Mirror ADK lifecycle events through `mirrorAdkAgentEvent`:
   - session.created or session.reused
   - turn.started
   - text/research_step/source/status events
   - turn.done or turn.failed
5. Persist only previews and structured metadata in run events; do not store
   full raw streams as product state.
6. Return a typed result with runId, traceId, sessionId, eventCount,
   textPreview, and completion status.
7. Add mocked tests for SSE event parsing -> ledger event mirroring.
8. Keep approval gates explicit: no graph promotion, external sending, or
   credentialed browser action in this wave.

Validation:
- npx vitest run tests/unit/lib/agent-runtime
- npx tsc --noEmit
- npm run build
- npm run audit:ai-provider-isolation
- npm run audit:ai-provider-vertex-default
- npm run audit:architecture-reference
- graphify update .

Finish:
- Report exact files changed and validation results.
- Commit and push only after checks pass:
  git add -A
  git commit -m "feat(agent-runtime): queue ADK deep research events"
  git pull --rebase origin main
  git push origin main
```

## Claude Code Prompt: AI Bar, Tools, And Context Capsule UX

Paste this into Claude Code when the backend/runtime session owns the worker
files and Claude owns the interface/docs.

```text
You are working in:
C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work

Goal:
Make PRAXIS feel more like a Tasklet-class product at the surface while staying
domain-specific: one strong AI bar, active ContextCapsule always visible,
recommended tools, durable runs, and output destinations. Do not add a generic
automation dashboard or new primary nav.

Read first:
- AGENTS.md
- CLAUDE.md
- ARCHITECTURE.md
- docs/product/README.md
- docs/product/PRAXIS_CANONICAL_APP_STRUCTURE.md
- docs/product/CONTEXT_CAPSULE_POLICY_RESEARCH_GUIDE.md
- docs/product/TASKLET_STYLE_PRAXIS_AGENT_RUNTIME_PLAN.md
- docs/product/PRAXIS_ADK_GENKIT_INTEGRATION_PLAN.md
- docs/build/PRAXIS_CONTEXT_CAPSULE_APP_BUILD_LEDGER_2026-05-15.md
- src/components/ask/AskWorkspacePage.tsx
- src/components/ask/AskStreamPanel.tsx
- src/components/ask/AskBar.tsx
- src/components/app/capsule-strip-header.tsx
- src/components/app/core-context-strip.tsx
- src/components/cores/ContextBuilderRoom.tsx
- src/lib/product/context-capsules.ts
- src/lib/tools/canonical.ts
- STATUS.md
- TODO.md
- CHANGELOG.md

Own these files:
- src/components/ask/**
- src/components/app/capsule-strip-header.tsx
- src/components/app/core-context-strip.tsx
- src/components/tools/**
- src/components/landing/phase8-wow-landing.tsx only if landing copy needs a
  matching adjustment
- tests/e2e/** only for focused smoke updates
- docs/build/PRAXIS_CONTEXT_CAPSULE_APP_BUILD_LEDGER_2026-05-15.md
- STATUS.md / TODO.md / CHANGELOG.md

Hard boundaries:
- Keep primary nav exactly Home, Ask PRAXIS, Library, Memo Studio, Canvas,
  Advanced.
- Do not expose internal credit costs, provider names, or unsupported live
  claims.
- Browser automation, email triggers, broad SaaS integrations, and code
  sandboxing must remain deferred unless backend proof exists.
- Do not edit `src/lib/agent-runtime/**` unless coordinating with Codex.

Implementation tasks:
1. Make the Ask PRAXIS AI bar the obvious center of the full Ask page:
   - active capsule chips directly above or inside the composer;
   - selected/recommended tools visible without a raw marketplace feel;
   - output target choices: Memo Studio, Canvas, Library, Handover;
   - copy should say the run inherits the active capsule.
2. Add a small recent/queued run affordance only if it can read existing API
   state or remain honestly empty. No fake-live run history.
3. Improve tool recommendation copy:
   - recommendations come from source gaps, timeline gaps, power-map gaps,
     output goal, and review posture;
   - raw Tools stays secondary.
4. Keep ContextCapsule completeness visible:
   - User Core, Situation Core, Sources, Time, Tools, Output, Memory.
   - Show gaps as next actions, not as alarming errors.
5. Update focused smoke coverage if DOM/test selectors change.
6. Update STATUS/TODO/CHANGELOG and the build ledger with what is now UX-live
   versus backend-ready.

Validation:
- npx tsc --noEmit
- npm run build
- npm run lint
- npm run audit:ux-polish
- npm run audit:context-vs-tools
- npm run audit:architecture-reference
- npm run smoke:core-flows if touched surfaces affect the core flow
- focused Playwright smoke for Ask PRAXIS when feasible
- graphify update . if code files changed

Finish:
- Report exact files changed and validation results.
- Commit and push only after checks pass:
  git add -A
  git commit -m "feat(ask): focus AI bar on capsule-aware tools"
  git pull --rebase origin main
  git push origin main
```

## Codex Prompt: Sourceability To Memo Studio Bridge

Paste this into a new Codex session after the sourceability route and canonical
tool registration are on `main`.

```text
You are working in:
C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work

Goal:
Turn Sourceability Check into the first practical claim-review primitive inside
the PRAXIS ContextCapsule workflow. The route already exists at
`/api/ai/sourceability`; this wave should connect it to saved work products and
run receipts without making unsupported claims look resolved.

Read first:
- AGENTS.md
- CLAUDE.md
- ARCHITECTURE.md
- docs/product/README.md
- docs/product/PRAXIS_CANONICAL_APP_STRUCTURE.md
- docs/product/TASKLET_STYLE_PRAXIS_AGENT_RUNTIME_PLAN.md
- docs/product/PRAXIS_ADK_GENKIT_INTEGRATION_PLAN.md
- docs/build/PRAXIS_CONTEXT_CAPSULE_APP_BUILD_LEDGER_2026-05-15.md
- src/app/api/ai/sourceability/route.ts
- src/lib/genkit/flows/sourceability.ts
- src/lib/genkit/schemas/sourceability.ts
- src/lib/tools/canonical.ts
- src/lib/api/capsule-gate.ts
- src/app/api/memos/from-ask/route.ts
- src/app/api/memos/[id]/handover-package/route.ts
- src/components/writer/PraxisWriter.tsx
- STATUS.md
- TODO.md
- CHANGELOG.md

Own these files:
- src/app/api/ai/sourceability/**
- src/lib/genkit/flows/sourceability.ts
- src/lib/genkit/schemas/sourceability.ts
- src/lib/tools/canonical.ts only for small contract fixes
- src/lib/memos/** or existing memo/work-product helpers if present
- tests/genkit/sourceability-flow.test.ts
- tests/unit/lib/api/**
- tests/unit/lib/memos/** if adding memo helpers
- STATUS.md / TODO.md / CHANGELOG.md

Do not edit the app shell or broad Ask UI in this Codex session. Leave visible
UX wiring to Claude Code unless a small API response field is required.

Implementation tasks:
1. Add a reusable sourceability result shape for work products if none exists.
   It must preserve:
   - claim text;
   - status: supported, weak, unsupported, needs_date_check;
   - supporting source ids;
   - missing evidence;
   - suggested rewrite;
   - citation warnings;
   - capsule id, situation id, and trace/tool run id when available.
2. Add a narrow server helper that can attach a sourceability result to a memo,
   draft, or Ask-saved memo without overwriting the memo body.
3. Ensure unsupported and date-check statuses stay review material. They must
   not promote graph facts, mark gaps resolved, or silently rewrite the memo.
4. Add tests for supported, weak, unsupported, and needs-date-check persistence
   semantics.
5. Keep source retrieval separate. If no snippets are supplied, return a clear
   gap state and suggested next action to run Grounded Research first.
6. Update STATUS/TODO/CHANGELOG with what is API-live versus UI-wired.

Validation:
- npx vitest run tests/genkit/sourceability-flow.test.ts
- npx vitest run tests/unit/lib/api/with-calibration-gate.test.ts
- npx tsc --noEmit
- npm run build
- npm run audit:genkit-runtime
- npm run audit:architecture-reference
- node scripts/audit-ai-routes.mjs
- graphify update .

Finish:
- Report exact files changed and validation results.
- Commit and push only after checks pass:
  git add -A
  git commit -m "feat(sourceability): attach claim review receipts to memos"
  git pull --rebase origin main
  git push origin main
```

## Claude Code Prompt: Sourceability In The AI Bar

Paste this into Claude Code after the Sourceability Check canonical tool is on
`main`.

```text
You are working in:
C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work

Goal:
Expose Sourceability Check in the simple PRAXIS experience: Ask PRAXIS and Memo
Studio should let a user check a selected claim against attached sources without
opening a raw tool marketplace. Keep the surface focused on the AI bar, active
ContextCapsule, recommended tools, and memo output.

Read first:
- AGENTS.md
- CLAUDE.md
- ARCHITECTURE.md
- docs/product/README.md
- docs/product/PRAXIS_CANONICAL_APP_STRUCTURE.md
- docs/product/CONTEXT_CAPSULE_POLICY_RESEARCH_GUIDE.md
- docs/product/TASKLET_STYLE_PRAXIS_AGENT_RUNTIME_PLAN.md
- src/lib/tools/canonical.ts
- src/lib/tools/recommend.ts
- src/app/api/ai/sourceability/route.ts
- src/components/ask/AskStreamPanel.tsx
- src/components/ask/AskWorkspacePage.tsx
- src/components/assistant/response-actions.tsx
- src/components/writer/PraxisWriter.tsx
- src/components/cores/ContextBuilderRoom.tsx
- tests/e2e/app-usability-smoke.spec.ts
- STATUS.md
- TODO.md
- CHANGELOG.md

Own these files:
- src/components/ask/**
- src/components/assistant/response-actions.tsx
- src/components/writer/PraxisWriter.tsx
- src/components/tools/**
- tests/e2e/** only for focused smoke coverage
- STATUS.md / TODO.md / CHANGELOG.md

Hard boundaries:
- Keep primary nav exactly Home, Ask PRAXIS, Library, Memo Studio, Canvas,
  Advanced.
- Do not expose provider internals or internal credit costs.
- Do not claim Sourceability browses the web. It checks provided snippets and
  attached context only.
- Unsupported claims remain gaps; never render them as fixed facts.
- Do not edit `src/lib/agent-runtime/**` in this UI session.

Implementation tasks:
1. Add Sourceability Check as a recommended action for Ask PRAXIS answers and
   Memo Studio selected text when sources/documents are attached.
2. Show statuses with plain labels:
   - Supported
   - Weak support
   - Unsupported
   - Needs date check
3. For weak/unsupported/date-check, show the suggested rewrite and missing
   evidence as next actions. Do not auto-apply the rewrite.
4. If no source snippets are available, route the user to Grounded Research or
   Library attachment instead of calling the route with empty evidence.
5. Keep the UI compact and AI-bar centered. This is a tool action, not a new
   page.
6. Add focused smoke or component tests if stable selectors already exist.
7. Update STATUS/TODO/CHANGELOG with what is UX-live and what remains backend
   or worker follow-up.

Validation:
- npx tsc --noEmit
- npm run build
- npm run lint
- npm run audit:ux-polish
- npm run audit:context-vs-tools
- npm run audit:architecture-reference
- npm run smoke:core-flows if touched surfaces affect the core flow
- focused Playwright smoke for Ask/Memo when feasible
- graphify update . if code files changed

Finish:
- Report exact files changed and validation results.
- Commit and push only after checks pass:
  git add -A
  git commit -m "feat(ask): surface sourceability claim checks"
  git pull --rebase origin main
  git push origin main
```
