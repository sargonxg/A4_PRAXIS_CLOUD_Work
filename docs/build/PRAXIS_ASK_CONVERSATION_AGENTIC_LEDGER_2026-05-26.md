# PRAXIS Ask Conversation Agentic Ledger

Date: 2026-05-26
Owner: Codex
Status: active implementation ledger

## Product Principle

Keep the public surface simple: Ask PRAXIS remains the primary cockpit. Agent routing, ContextCapsule repair, evidence scoring, deeper runs, source tables, and artifacts should appear inline in the conversation or in existing workbench panels, not as new primary navigation.

## Phase Ledger

| Phase | Status | Scope | Proof gate |
| --- | --- | --- | --- |
| 0. GitHub main and live deploy proof | Complete | Confirmed `main`, GitHub Actions, Cloud Build, Cloud Run, and `praxis.tacitus.me` deployment path. | Runtime health and canary proof recorded in launch docs. |
| 1. Same-window conversation consolidation | Deployed | Make the canonical workbench conversation use the same AskTurnPlan triage panel already shown in AskStreamPanel. | RED/GREEN unit contract, TypeScript, build, GitHub Actions, Cloud Build, and live canary passed. |
| 2. AskTurnPlan persistence and reload | Planned | Ensure saved conversation turns preserve triage, quality bar, tool/agent plan, and artifact hints on reload. | Authenticated saved-conversation smoke and envelope contract tests. |
| 3. Quality, evidence, and deeper-run scoring | Planned | Surface quality/evidence/deeper-run recommendations without adding a separate agent page. | Ask orchestrator tests plus UI contract for answer actions. |
| 4. Same-thread AgentRun proof | Planned | Attach queued durable agent runs, status updates, and outputs to the originating conversation turn. | Agent process audit plus authenticated Ask smoke. |
| 5. ContextCapsule search, attach, and repair | Planned | Harden capsule search, missing/thin context actions, and repair suggestions inside the workbench. | Context/capsule tests plus capsule attach/reload smoke. |
| 6. Public launch verification | Passed for Slice 1 | Push to `main`, wait for CI/deploy, verify live health, canary, and runtime proof. | GitHub Actions, Cloud Build, Cloud Run revision, and live probes passed for commit `800d6f07`. |

## Current Slice Log

### Slice 1: Shared AskTurnPlan panel in workbench

Objective: the user should see PRAXIS triage, status rail, quality bar, agents/tools/artifact plan, and deeper-action suggestions in the same conversation window on the canonical homepage workbench.

RED gate:
- Added a contract expectation in `tests/unit/components/tasklet-workbench-contract.test.ts`.
- Verified failure before production code: the workbench source did not contain `AskTurnPlanPanel`.
- Checkpoint commit: `08940c84 test: require ask turn plan in workbench`.

Implementation:
- Extract the existing AskTurnPlan panel from `AskStreamPanel` into a shared component.
- Render the shared component in `TaskletPraxisWorkbench` between receipt summary and answer-quality actions.
- Keep action clicks simple: load the suggested follow-up into the existing composer and set an inline status message.

Proof:
- `npx vitest run tests/unit/components/tasklet-workbench-contract.test.ts tests/unit/components/ask-source-preview-contract.test.ts` passed: 70 tests.
- `npx vitest run tests/unit/lib/ai/ask-orchestrator.test.ts tests/unit/lib/ai/ask-answer-envelope.test.ts` passed: 20 tests.
- `npx tsc --noEmit` passed.
- `graphify update .` passed and refreshed `graphify-out`.
- `npm run lint` passed with 50 existing warnings.
- `npm run build` passed.
- `npm run audit:ask-cockpit-runtime` passed.
- `npm run audit:agent-process-contract` passed.
- `npm run audit:runtime-health-live` passed against `https://praxis.tacitus.me`; current live frontend revision before this new deploy is `praxis-frontend-00817-r5m`.
- `npm run audit:runtime-data-plane` completed and wrote a local read-only diagnostic; live production health is the stronger proof because local diagnostic credentials were intentionally not available in this shell.
- `npm run audit:cognee` passed the Cognee isolation contract.
- `npm run audit:capsule-memory-contract` passed.

Remote proof:
- GitHub `main` code commit: `800d6f079510d51344acbbeb763bf32b859b7cdf`.
- GitHub Actions `persona-smoke` run `26471070940` passed for `800d6f07`.
- Cloud Build `frontend-main-on-push` build `ec61f757-52bd-4f48-80e8-dce0c0d299ed` succeeded from `800d6f07`.
- Built frontend image digest: `sha256:8233f0199f0ea7c69dee479f424a40fdab77a1914003327f26e40d637fc9f60a`.
- Cloud Run `praxis-frontend` served revision `praxis-frontend-00819-544` at 100 percent traffic using the `800d6f07` image.
- `https://praxis.tacitus.me/api/health/runtime` returned `status: ok` with Firestore, backend, agent ledger, agent queue, agent worker, and agent platform all `ok`.
- `https://praxis.tacitus.me/api/health/agentic-search` returned `status: ready` with Cloud SQL run ledger, Cloud Tasks queue, worker auth, Vertex runtime, ADK runtime, Genkit provider, Vertex grounding, Exa premium search, research graph, and route/runtime imports ready.
- Canary monitor passed at phase 100: 9 samples, 0 errors, p95 2315 ms.

Known configuration note:
- `https://praxis.tacitus.me/api/health` reports `cognee_memory: unconfigured`; this matches the review-gated architecture where Firestore/Cloud SQL are canonical and Cognee remains optional advisory memory until `COGNEE_ENABLED=true` and `COGNEE_BACKEND_URL` are configured for the isolated service.
