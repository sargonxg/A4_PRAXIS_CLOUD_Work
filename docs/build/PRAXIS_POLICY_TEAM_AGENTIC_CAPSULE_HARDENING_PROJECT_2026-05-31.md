# PRAXIS Policy-Team Agentic Capsule Hardening Project

Date: 2026-05-31
Owner: Codex
Status: implementation-ready project brief
Repo: `C:\Users\giuli\A4_PRAXIS_CLOUD_Work`
Remote: `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`
Live app: `https://praxis.tacitus.me`
Baseline commit reviewed: `b09bf0667d71fd05cc388001d291b8d144d69409`

## Executive Decision

PRAXIS has a real, working spine for a simple visible policy cockpit backed by a stronger hidden runtime:

- Ask PRAXIS can attach ContextCapsule context, produce orchestration receipts, and queue durable AgentRuns.
- ContextCapsules are canonical in Firestore, with a large starter catalog, versioned snapshots, source packs, research dossiers, claim ledgers, review cards, and advisory memory seams.
- AgentRun is durable in Cloud SQL and dispatched through Cloud Tasks to an authenticated worker route.
- The current live policy agents cover capsule drafting, memo generation, boardroom deliberation, formatting, sourceability review, red-team review, and handover packaging.
- Local typecheck, tests, build, lint, audit gate, agentic proof, launch readiness, and research evals pass or produce scoped environment blockers.

The project is not "done" enough to claim a fully production-grade policy team yet. The top priority is not adding more pages. The priority is to harden the existing Ask/workbench/capsule surfaces so a real policy team can create or select a capsule, ask a hard question, run multiple specialist agents, inspect evidence and gaps, produce a sourceable memo or handover, and trust the operational proof.

## Current Evidence

### Repo and GitHub

- Branch: `main`
- Remote: `origin https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`
- `origin/main...HEAD`: `0 0` after `git fetch origin --prune`
- Working code at review baseline is on GitHub.
- Open GitHub PRs `#24` through `#30` are stale stacked PRs; their head commits are already ancestors of `main`.
- Latest GitHub Actions runs fail before jobs start because the GitHub account has payment/spending-limit blockage. This is not a code failure, but it blocks GitHub-based proof.

### Local Validation

These checks were run from `C:\Users\giuli\A4_PRAXIS_CLOUD_Work`:

```powershell
npm run typecheck
npm run test
npm run build
npm run lint
npm run audit:gate
npm run audit:agentic-search-proof
npm run eval:agentic-research
npm run audit:launch-readiness
npm audit --audit-level=high
npm run doctor:praxis
```

Observed result:

- `typecheck`: passed.
- `test`: passed, 278 test files and 1192 tests.
- `build`: passed on Next.js 16.2.6.
- `lint`: passed.
- `audit:gate`: passed.
- `audit:agentic-search-proof`: passed.
- `eval:agentic-research`: passed, 10/10 deterministic scenarios beat a prompt-only baseline.
- `audit:launch-readiness`: passed with one live-header probe warning.
- `npm audit --audit-level=high`: exit 0, but reports five advisory groups; fixes are forced or breaking.
- `doctor:praxis`: blocked only by local ADC reauthentication/canary credentials; live runtime checks passed.

### Live Runtime

From `docs/audits/2026-05-31-PRAXIS_DOCTOR.md`:

- Cloud Run revision: `praxis-frontend-00953-q8h`
- Live app: HTTP 200
- Login page: HTTP 200
- `/api/health/runtime`: HTTP 200, status ok
- `/api/health/agentic-search`: HTTP 200, status ready, missing `[]`
- Cloud SQL, Firestore, Cloud Tasks, worker auth, service account, Pub/Sub, secrets, and Cloud Run private SQL networking are ready in production.
- Authenticated write canary is disabled without `PRAXIS_DOCTOR_WRITE_CANARY=1` plus an isolated canary email/password.

## Product Doctrine

Keep the app simple. Do not create a new top-level "agent platform" UI.

The visible product should remain:

- Home / Ask PRAXIS as the main cockpit.
- Capsules / library as the reusable policy-context workspace.
- Existing workbench panels for source proof, queued runs, review cards, memo/output artifacts, and handover.
- Settings/system surfaces for operator proof.

The hidden product should get stronger:

- A durable AgentRun ledger.
- Multi-agent orchestration plans.
- Sourceability and claim ledgers.
- Capsule creation and repair.
- Review-gated graph/advisory memory.
- Memo, boardroom, output-capsule, and handover artifacts.
- Honest degraded-mode receipts when live grounding or connectors are not available.

## Policy Team Outcome

A real policy team should be able to use PRAXIS for:

1. Situation framing
   - Select or create a ContextCapsule for a country, institution, conflict, policy area, or regulatory question.
   - See what the capsule knows, what sources support it, what is stale, and what is missing.

2. Research intake
   - Ask a hard policy question in Ask PRAXIS.
   - Get a concise answer with a visible plan, source posture, risk level, and whether a deeper run was queued.

3. Multi-agent work
   - Run a chaired sequence: research memo agent, sourceability reviewer, red-team analyst, boardroom discussion, output formatter, handover builder.
   - Keep all agents grounded in the active capsule and source receipts.
   - Store run events, tool calls, outputs, approvals, and errors in the durable ledger.

4. Evidence and review
   - Trace every important claim to a source, a missing-source gap, or an explicit uncertainty.
   - Receive review cards for weak evidence, stale sources, contradictions, unsupported claims, and risky actions.

5. Production output
   - Produce a memo, brief, boardroom pack, output capsule, or handover package.
   - Block "export-ready" status until sourceability gates pass or the user accepts explicit caveats.

6. Monitoring
   - Later, enable daily brief and conflict monitor jobs from approved sources and watchlists.
   - Never imply live monitoring is active until Scheduler jobs, sources, and health proof exist.

## Architecture Reviewed

### Core agent runtime

- `src/lib/agent-runtime/schema.ts`
- `src/lib/agent-runtime/state.ts`
- `src/lib/agent-runtime/postgres.ts`
- `src/lib/agent-runtime/cloud-tasks.ts`
- `src/lib/agent-runtime/worker-auth.ts`
- `src/lib/agent-runtime/worker.ts`
- `src/app/api/agents/runs/route.ts`
- `src/app/api/agents/runs/[runId]/execute/route.ts`
- `src/app/api/agents/runs/[runId]/dispatch/route.ts`
- `src/app/api/agents/runs/[runId]/retry/route.ts`
- `src/app/api/agents/runs/[runId]/approvals/[approvalId]/route.ts`

### Ask orchestration

- `src/app/api/ai/chat/route.ts`
- `src/lib/ai/ask-orchestrator.ts`
- `src/lib/ai/work-intent-router.ts`
- `src/lib/ai/MODEL_MATRIX.json`
- `src/lib/ai/providers.ts`

### Capsules

- `src/lib/context/capsule-service.ts`
- `src/lib/product/context-capsules.ts`
- `src/lib/product/policy-agents.ts`
- `src/app/api/context/capsules/**`
- `src/app/api/context/resolve/**`
- `src/components/praxis/tasklet-praxis-workbench.tsx`

### Product and proof docs

- `docs/CODEX_SESSION_BRIEF.md`
- `AGENTS.md`
- `ARCHITECTURE.md`
- `docs/product/PRAXIS_CANONICAL_APP_STRUCTURE.md`
- `docs/product/CONTEXT_CAPSULE_POLICY_RESEARCH_GUIDE.md`
- `docs/product/TASKLET_STYLE_PRAXIS_AGENT_RUNTIME_PLAN.md`
- `docs/audits/2026-05-30-red-flags-and-improvement-plan.md`
- `docs/audits/2026-05-31-runtime-data-plane-diagnostic.md`
- `docs/audits/2026-05-31-DEEP_PRESHIP_CHECKLIST.md`
- `graphify-out/GRAPH_REPORT.md`

## Red Flags To Fix

### P0: GitHub proof is blocked by account billing

GitHub Actions for `verify-main` and `persona-smoke` fail before runner startup because recent account payments failed or spending limits need attention. This blocks the "all green on GitHub" proof loop even though local checks are green.

Acceptance:

- GitHub billing/spending-limit issue resolved outside code.
- `gh run list --limit 10` shows current `main` checks passing or failing for code reasons only.
- Latest `verify-main`, `persona-smoke`, and any required deploy checks are linked in the release note.

### P0: Authenticated production golden path has not been run in this pass

Production health is good, but the authenticated write canary was disabled because the shell lacked canary credentials and `PRAXIS_DOCTOR_WRITE_CANARY=1`.

Acceptance:

- Isolated test user configured through `PRAXIS_CANARY_EMAIL` and `PRAXIS_CANARY_PASSWORD` or the existing `TEST_FIREBASE_EMAIL` and `TEST_FIREBASE_PASSWORD`.
- `PRAXIS_DOCTOR_WRITE_CANARY=1 npm run doctor:praxis` passes.
- Canary proves login, capsule creation or selection, Ask, queued AgentRun, worker completion, saved output, and cleanup.

### P0: AgentRun dispatch needs stronger idempotency

`createAgentRun()` uses `(owner_uid, idempotency_key)` uniqueness, but conflict handling still mirrors and emits queued/create side effects. `enqueueAgentRunDispatch()` accepts `queued` and `running` runs and creates a new Cloud Task without a persisted dispatch lock or deterministic task name. Duplicate dispatches can happen through Ask retries, manual dispatch, approval resume, or retry paths before a run reaches a terminal state.

Acceptance:

- AgentRun has an explicit dispatch lock or dispatch state that prevents concurrent duplicate worker tasks for the same run/attempt.
- Cloud Task creation uses a deterministic task name or ledger-level unique dispatch key where possible.
- Existing queued/running semantics remain compatible with retry and approval resume.
- Repeated Ask submission with the same idempotency key does not append duplicate queued events or publish duplicate created events.
- Tests prove duplicate dispatch requests produce one active task or a clear idempotent response.

### P0: Local and production diagnostics disagree

`npm run audit:agentic-search` is blocked in this local shell because required local env vars are absent. The live `/api/health/agentic-search` endpoint reports ready. This is acceptable only if the operator report clearly separates local env blockers from deployed runtime readiness.

Acceptance:

- Add or improve a "local vs production agentic search readiness" report.
- Local missing env vars are listed as local-only unless production also lacks the setting.
- `doctor:praxis` and `audit:agentic-search` artifacts are not interpreted as production failures when live health is ready.

### P1: Stale stacked PRs create false project state

Open PRs `#24` through `#30` are already merged by ancestry into `main`. They should be closed with a comment or otherwise cleaned up after approval.

Acceptance:

- Each stale PR is closed or retargeted intentionally.
- A short GitHub comment records that the branch head is already included in `main`.
- No live code changes are lost.

### P1: Graphify report is stale

`graphify-out/GRAPH_REPORT.md` was built from commit `5041cca1`, while this review baseline is `b09bf066`. The audit gate warns about this.

Acceptance:

- Run `graphify update .` after code changes.
- Commit the refreshed `graphify-out` artifacts when they are intentionally part of the repo source of truth.

### P1: Policy-agent runtime is useful but not yet a full policy team

Live/queued agents are present, but `daily-brief` and `conflict-monitor` remain planned. The product does not yet enforce a chaired multi-agent sequence as a single dependable workflow for policy-team output.

Acceptance:

- Implement a policy-team run template that chains:
  - research memo
  - sourceability review
  - red-team review
  - boardroom discussion when requested
  - output formatting
  - handover package
- Surface it inside the existing Ask/workbench flow.
- Store each stage as child AgentRuns or structured run events with one parent trace.
- Do not add new top-level navigation.

### P1: Sourceability should gate export-ready outputs

The sourceability reviewer exists, but export-ready memo/output status should be gated by claim support, source gaps, and explicit caveats.

Acceptance:

- Memo/output artifacts include sourceability status: `draft`, `needs_sources`, `reviewed_with_caveats`, or `export_ready`.
- Unsupported claims become review cards or explicit caveats.
- Export actions require sourceability pass or user confirmation.

### P1: Tool contract gap remains

`audit:gate` reports 51/55 tools pass the >=6/7 contract threshold.

Acceptance:

- Raise tool contracts to 55/55 or retire the four weak tool definitions.
- Any deferred or gated tool is visibly labeled as such.
- No hidden "filesystem", "shell", "browser", "Gmail", "Slack", or "Google Drive" capability is claimed in the MVP.

### P1: Large modules need maintainability extraction

`src/components/praxis/tasklet-praxis-workbench.tsx` and `src/lib/product/context-capsules.ts` are each large enough to slow review and increase regression risk. They work today, but they are not a sustainable top-team structure.

Acceptance:

- Extract workbench panels into focused components without changing the visible app structure.
- Extract capsule starter/catalog data from runtime logic.
- Keep all public contracts and tests green.
- Do not perform a broad redesign while extracting.

### P2: Dependency advisories need a controlled branch

`npm audit --audit-level=high` exits 0, but reports five advisory groups that require forced or breaking upgrades.

Acceptance:

- Open a dependency-curator branch.
- Review `npm audit --json`.
- Upgrade with a compatibility matrix and rollback path.
- Run full local validation and GitHub CI after billing is fixed.

### P2: Monitoring agents need real scheduler proof before launch claims

Production `scheduler-jobs` check passed but listed zero jobs. That is fine while daily brief/conflict monitoring are planned, but not fine if the UI claims they are live.

Acceptance:

- No live monitoring claims until Cloud Scheduler jobs, approved feeds, health checks, and output receipts exist.
- When implemented, Scheduler jobs have explicit names, owners, source scopes, and failure alerts.

## Implementation Phases

### Phase 0: Repo, GitHub, and proof hygiene

Goal: remove ambiguity about what is on GitHub and what is actually green.

Tasks:

1. Resolve GitHub Actions billing/spending-limit issue.
2. Re-run `verify-main`, `persona-smoke`, and required workflows on `main`.
3. Close or annotate stale PRs `#24` through `#30` after explicit user approval.
4. Re-run `graphify update .` if any code changes land.
5. Commit generated audit artifacts only when they represent intentional evidence.

Validation:

```powershell
git fetch origin --prune
git status --short --branch
git rev-list --left-right --count origin/main...HEAD
gh run list --limit 10
gh pr list --state open
```

### Phase 1: Authenticated golden-path canary

Goal: prove the policy-team loop with a real account and safe cleanup.

Tasks:

1. Configure isolated canary credentials.
2. Run the write canary through `doctor:praxis`.
3. Capture IDs for created capsule, conversation, AgentRun, memo/output, and cleanup result.
4. Add the successful run to `docs/audits`.

Validation:

```powershell
$env:PRAXIS_DOCTOR_WRITE_CANARY="1"
$env:PRAXIS_CANARY_EMAIL="<isolated-test-email>"
$env:PRAXIS_CANARY_PASSWORD="<isolated-test-password>"
npm run doctor:praxis
```

Acceptance:

- Doctor status is pass, not blocked.
- Live app and live runtime health remain ready.
- Canary artifacts show no leftover test data unless intentionally retained.

### Phase 2: AgentRun idempotency and dispatch hardening

Goal: make durable agents safe under retries, duplicate submissions, approval resume, and worker retries.

Likely files:

- `src/lib/agent-runtime/postgres.ts`
- `src/lib/agent-runtime/state.ts`
- `src/lib/agent-runtime/cloud-tasks.ts`
- `src/lib/agent-runtime/worker.ts`
- `src/app/api/ai/chat/route.ts`
- `src/app/api/agents/runs/[runId]/dispatch/route.ts`
- `src/app/api/agents/runs/[runId]/approvals/[approvalId]/route.ts`
- `src/app/api/agents/runs/[runId]/retry/route.ts`
- related unit tests

Tasks:

1. Add a persisted dispatch claim such as `dispatch_state`, `active_dispatch_id`, `last_dispatch_attempt`, or a separate `agent_run_dispatches` table.
2. Make dispatch enqueue atomic: only one requester can claim a queued/running run for a given attempt.
3. Use deterministic Cloud Task names when the Cloud Tasks API supports it for the current queue path.
4. Treat duplicate enqueue as idempotent success with the prior task metadata.
5. Stop `createAgentRun()` from emitting duplicate queued events on idempotency conflicts.
6. Ensure worker completion clears or finalizes dispatch state.

Validation:

```powershell
npx vitest run tests/unit/lib/agent-runtime*
npx vitest run tests/unit/app/api/agents*
npm run audit:agent-runtime-proof
npm run audit:agent-process-contract
npm run audit:gate
```

### Phase 3: Capsule creation and repair workflow

Goal: make capsule creation feel simple while producing serious policy-context assets.

Tasks:

1. Keep capsule creation inside the existing workbench/capsule surfaces.
2. Turn the current prompt-first capsule builder into a guided review workflow:
   - situation
   - decision context
   - actors
   - source set
   - time horizon
   - outputs needed
   - review risks
3. Preserve all existing ContextCapsule version history and Firestore contracts.
4. Add source-gap and stale-source review cards before a capsule is used for high-confidence output.
5. Add or update tests for create, update, attach, resolve, and starter-based creation.

Likely files:

- `src/lib/context/capsule-service.ts`
- `src/lib/product/context-capsules.ts`
- `src/app/api/context/capsules/**`
- `src/app/api/context/resolve/**`
- `src/components/praxis/tasklet-praxis-workbench.tsx`
- extracted capsule components

Validation:

```powershell
npx vitest run tests/unit/lib/context*
npx vitest run tests/unit/app/api/context*
npm run audit:capsule-memory-contract
npm run audit:capsule-catalog
npm run audit:gate
```

### Phase 4: Policy-team multi-agent workflow

Goal: turn separate agents into a dependable policy-team workflow while keeping the UI compact.

Tasks:

1. Add a parent policy-team workflow plan to Ask orchestration.
2. Support child stages:
   - research memo
   - sourceability reviewer
   - red-team analyst
   - boardroom discussion
   - output formatter
   - handover builder
3. Persist stage status and outputs under one parent trace.
4. Show one compact progress rail in the existing conversation/workbench.
5. Keep approval gates for export, graph mutation, external sends, browser actions, and MCP writes.

Likely files:

- `src/lib/product/policy-agents.ts`
- `src/lib/agent-runtime/workflow-plan.ts`
- `src/lib/agent-runtime/worker.ts`
- `src/lib/ai/ask-orchestrator.ts`
- `src/app/api/ai/chat/route.ts`
- `src/components/ask/**`
- `src/components/praxis/tasklet-praxis-workbench.tsx`

Validation:

```powershell
npx vitest run tests/unit/lib/agent-runtime*
npx vitest run tests/unit/lib/ai/ask-orchestrator.test.ts
npx vitest run tests/unit/components/tasklet-workbench-contract.test.ts
npm run audit:ask-cockpit-runtime
npm run audit:agent-process-contract
npm run eval:agentic-research
```

### Phase 5: Sourceability and export gates

Goal: prevent polished but weak outputs from looking final.

Tasks:

1. Add sourceability state to memo/output artifacts.
2. Require claim ledger checks before export-ready status.
3. Add weak-claim repair actions in the existing Ask/workbench UI.
4. Persist user approvals when exporting with caveats.

Validation:

```powershell
npx vitest run tests/unit/lib/ai/ask-answer-envelope.test.ts
npx vitest run tests/unit/components/ask-source-preview-contract.test.ts
npm run audit:agentic-search-proof
npm run eval:agentic-research
```

### Phase 6: Tool contract cleanup

Goal: make every advertised tool either real, gated, or removed.

Tasks:

1. Inspect the four weak tools from `audit:tool-contracts`.
2. Upgrade their contracts to >=6/7 if they are product-needed.
3. Retire or hide them if not needed for the current policy-team flow.
4. Keep forbidden MVP integration claims out of user-visible text.

Validation:

```powershell
npm run audit:tool-contracts
npm run audit:gate
```

### Phase 7: Maintainability extraction

Goal: preserve behavior while making the codebase easier for a strong engineering team to evolve.

Tasks:

1. Extract workbench panels from `tasklet-praxis-workbench.tsx` by product area.
2. Extract capsule catalog/static data from `context-capsules.ts`.
3. Keep barrel imports conservative and avoid circular dependencies.
4. Add contract tests before extraction if coverage is thin.
5. Run graphify after extraction to detect new god nodes or cycles.

Validation:

```powershell
npm run typecheck
npm run test
npm run build
npm run lint
graphify update .
```

### Phase 8: Dependency/security branch

Goal: address advisories without breaking the runtime.

Tasks:

1. Create a branch for dependency upgrades.
2. Review advisories from `npm audit --json`.
3. Upgrade packages in the smallest safe batch.
4. Validate Genkit, AI SDK, Vertex, Anthropic SDK, and Next.js compatibility.
5. Do not run `npm audit fix --force` on `main`.

Validation:

```powershell
npm audit --json
npm run typecheck
npm run test
npm run build
npm run audit:gate
```

### Phase 9: Production proof and release note

Goal: produce a complete ship record.

Tasks:

1. Confirm clean branch state.
2. Commit and push.
3. Wait for GitHub Actions and deploy proof.
4. Verify live app, runtime health, agentic-search health, and authenticated canary.
5. Record Cloud Run revision, build ID, commit, and canary IDs.
6. Update `STATUS.md`, `CHANGELOG.md`, and audit docs if this is a shipped wave.

Validation:

```powershell
git status --short --branch
gh run list --limit 10
gcloud run services describe praxis-frontend --region us-central1 --project praxisbytacitus
npm run doctor:praxis
```

## No-Touch Constraints

- Do not add new primary navigation for agents.
- Do not move canonical ContextCapsule state out of Firestore.
- Do not promote Cognee, graph memory, or advisory memory to canonical user state without explicit approval.
- Do not claim filesystem, shell, browser, Gmail, Slack, or Google Drive integrations are live in the MVP.
- Do not mutate external systems, post comments, close PRs, push, deploy, or modify credentials without explicit approval.
- Do not hide local env blockers as production failures.
- Do not delete broad code or generated artifacts without proving they are unused.
- Do not run `npm audit fix --force` on `main`.

## Suggested Codex Agent Lanes

Use these lanes if multi-agent support is available:

| Lane | Role | Scope |
| --- | --- | --- |
| `repo_cartographer` | evidence map | Verify current source-of-truth docs, module ownership, and graphify state. |
| `explorer` | read-only runtime review | Inspect AgentRun, capsule, Ask, and policy-agent seams before edits. |
| `reviewer` | correctness/security | Review idempotency, worker auth, approval gates, and sourceability gates. |
| `frontend_qa` | browser-visible proof | Verify the existing workbench, capsule builder, and progress rail after UI changes. |
| `cloud_ops_auditor` | live/runtime proof | Verify GCP, Cloud Run, Cloud Tasks, Cloud SQL, Firebase, Scheduler, and health endpoints. |
| `dependency_curator` | dependency branch | Plan and test breaking dependency upgrades. |
| `release_manager` | ship proof | Confirm GitHub, deploy, live health, canary, and release notes. |

## First Implementation Prompt

Use this prompt for the next coding agent:

```md
You are implementing Phase 2 of `docs/build/PRAXIS_POLICY_TEAM_AGENTIC_CAPSULE_HARDENING_PROJECT_2026-05-31.md`.

Repo:
`C:\Users\giuli\A4_PRAXIS_CLOUD_Work`

Goal:
Harden AgentRun idempotency and dispatch so duplicate Ask submissions, manual dispatches, approval resumes, Cloud Tasks retries, and retry routes cannot create duplicate active worker executions or duplicate queued/create side effects.

Read first:
- `docs/CODEX_SESSION_BRIEF.md`
- `AGENTS.md`
- `ARCHITECTURE.md`
- `docs/build/PRAXIS_POLICY_TEAM_AGENTIC_CAPSULE_HARDENING_PROJECT_2026-05-31.md`
- `src/lib/agent-runtime/postgres.ts`
- `src/lib/agent-runtime/state.ts`
- `src/lib/agent-runtime/cloud-tasks.ts`
- `src/lib/agent-runtime/worker.ts`
- `src/app/api/ai/chat/route.ts`
- `src/app/api/agents/runs/[runId]/dispatch/route.ts`
- `src/app/api/agents/runs/[runId]/approvals/[approvalId]/route.ts`
- `src/app/api/agents/runs/[runId]/retry/route.ts`

No-touch:
- Do not add a new top-level app page.
- Do not change Firestore as canonical capsule storage.
- Do not weaken worker auth.
- Do not hide dispatch failures.
- Do not push/deploy without explicit approval.

Acceptance:
- Duplicate `createAgentRun()` calls for the same `(owner_uid, idempotency_key)` return the existing run without duplicate queued events or duplicate created events.
- Duplicate dispatch requests for the same active run/attempt are idempotent and return prior dispatch metadata when possible.
- Worker retries remain compatible.
- Approval resume and retry routes still work.
- Add focused unit tests for conflict create, duplicate dispatch, running-run dispatch, terminal-run dispatch rejection, and worker retry compatibility.

Validation:
```powershell
npx vitest run tests/unit/lib/agent-runtime*
npx vitest run tests/unit/app/api/agents*
npm run audit:agent-runtime-proof
npm run audit:agent-process-contract
npm run typecheck
npm run test
npm run build
npm run lint
```
```

## Second Implementation Prompt

Use this after Phase 2 is green:

```md
You are implementing Phase 4 and Phase 5 of `docs/build/PRAXIS_POLICY_TEAM_AGENTIC_CAPSULE_HARDENING_PROJECT_2026-05-31.md`.

Goal:
Make PRAXIS feel like a compact policy team inside the existing Ask/workbench flow: one parent policy-team workflow can run research memo, sourceability review, red-team review, boardroom discussion, output formatting, and handover builder with one trace and visible proof.

No-touch:
- Do not add new primary navigation.
- Do not create a separate agent dashboard unless it is an existing workbench panel.
- Do not claim planned daily brief/conflict monitor are live.
- Do not export unsupported claims as final.

Acceptance:
- Ask orchestration can select a policy-team workflow for complex policy tasks.
- Child stages are persisted as child runs or structured run events under one parent trace.
- The existing conversation/workbench shows a compact progress rail and artifact list.
- Memo/output artifacts have sourceability status and export-ready gates.
- Tests cover policy-team workflow selection, sourceability gating, red-team stage, handover stage, and degraded grounding receipts.

Validation:
```powershell
npx vitest run tests/unit/lib/ai/ask-orchestrator.test.ts
npx vitest run tests/unit/lib/agent-runtime*
npx vitest run tests/unit/components/tasklet-workbench-contract.test.ts
npm run audit:ask-cockpit-runtime
npm run audit:agent-process-contract
npm run audit:agentic-search-proof
npm run eval:agentic-research
npm run audit:gate
```
```
