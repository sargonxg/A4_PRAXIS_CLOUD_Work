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
| 1. Same-window conversation consolidation | Green locally | Make the canonical workbench conversation use the same AskTurnPlan triage panel already shown in AskStreamPanel. | RED/GREEN unit contract plus TypeScript check passed. |
| 2. AskTurnPlan persistence and reload | Planned | Ensure saved conversation turns preserve triage, quality bar, tool/agent plan, and artifact hints on reload. | Authenticated saved-conversation smoke and envelope contract tests. |
| 3. Quality, evidence, and deeper-run scoring | Planned | Surface quality/evidence/deeper-run recommendations without adding a separate agent page. | Ask orchestrator tests plus UI contract for answer actions. |
| 4. Same-thread AgentRun proof | Planned | Attach queued durable agent runs, status updates, and outputs to the originating conversation turn. | Agent process audit plus authenticated Ask smoke. |
| 5. ContextCapsule search, attach, and repair | Planned | Harden capsule search, missing/thin context actions, and repair suggestions inside the workbench. | Context/capsule tests plus capsule attach/reload smoke. |
| 6. Public launch verification | Planned | Push to `main`, wait for CI/deploy, verify live health, canary, and runtime proof. | GitHub Actions, Cloud Build, Cloud Run revision, and live probes. |

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

Pending proof:
- Main push and live deploy verification.
