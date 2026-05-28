# PRAXIS Simplification + Agentic Kernel Ledger

Date: 2026-05-28
Repo: `C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work`
Live URL: `https://praxis.tacitus.me`

## Current Checkpoint

| Field | Value |
|---|---|
| Branch | `main` |
| HEAD | `095c0d13441dbb32aad19907060c31a15151e35a` |
| Remote | `origin https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git` |
| Origin sync | `git fetch origin main` then `git rev-list --left-right --count HEAD...origin/main` -> `0 0` |
| Dirty status | Pre-existing dirty tree with code, docs, graphify output, Codex config/agent roles, runtime tests, deploy script, and local `.tmp-next-dev.*` files. Treat as shared work; do not revert unrelated edits. |
| Selected slice | Phase 0 ledger plus Phase 1 visible vocabulary simplification for Ask prompt and front-door helper surfaces. |
| No-touch constraints | No new top-level app page or primary nav item. Preserve compatibility routes. Do not make Cognee, graph extraction, ADK memory, or Genkit traces canonical state. Do not overwrite user capsule state or version history. |

## Phase Ledger

| Phase | Owner / Agent Lane | Files Touched | Risk | Validation Commands + Results | GitHub Status | Cloud Run Revision | Live Endpoint Proof | Blockers | Next Prompt |
|---|---|---|---|---|---|---|---|---|---|
| 0. Baseline + ledger | Codex implementation lane | `docs/roadmap/PRAXIS_SIMPLIFICATION_AGENTIC_KERNEL_LEDGER_2026-05-28.md` | Low: docs-only ledger over dirty tree. | `git status --short` showed dirty tree; `git fetch origin main`; `git rev-list --left-right --count HEAD...origin/main` -> `0 0`. | Local `main` synced with `origin/main`; no push attempted. | Not checked. | Not checked. | Shared dirty tree must be reviewed before commit/push/deploy. | Continue Phase 1: remove old six-room vocabulary from Ask prompt and visible helper UI while preserving redirects and legacy/internal labels. |
| 1. Visible vocabulary simplification | Codex implementation lane | Ask prompt, Ask panels, onboarding, floating PRAXIS, context/source/work/proof helper UI, workbench CTAs, memo compatibility UI, experience-map labels, focused tests. | Medium: user-facing copy and prompt routing can affect tests and product expectations. | RED: `npx vitest run tests/unit/simplification/visible-vocabulary-contract.test.ts` failed with 21 expected old-vocabulary violations. GREEN: focused test passed after copy edits. Full focused command passed: 5 files, 87 tests. | Local only; no push attempted. | Not checked. | Not checked. | Shared dirty tree remains; no production deploy attempted. | Next implementation should define the single compiled-context contract used by Ask and AgentRun. |
| 2. Context compiler + capsule contract | Future implementation lane | Pending. | High: shared runtime/capsule contract. | Pending. | Pending. | Pending. | Pending. | Requires current slice green. | Define a single compiled-context contract consumed by Ask and AgentRun. |
| 3. Agentic runtime kernel | Codex implementation lane | `src/lib/agent-runtime/tool-registry.ts`, `tests/unit/lib/agent-runtime/tool-registry.test.ts`. | Medium: schema tightening can expose generic tool callers. | RED: `npx vitest run tests/unit/lib/agent-runtime/tool-registry.test.ts` failed because generic record schemas accepted unexpected fields. GREEN: focused test passed after strict Zod schemas were added. `npm run audit:agent-runtime-proof` passed with expected local-env warnings. | Local only; no push attempted. | Not checked. | Not checked. | Live worker/ledger/ADK env missing in shell. | Continue normalizing AgentRun execution around the typed registry and compiled context. |
| 4. Graph, Cognee, and GCP posture | Future implementation lane | Pending. | High: advisory-vs-canonical boundary. | Pending. | Pending. | Pending. | Pending. | Cloud env and tenant canaries required for live proof. | Keep Cognee/graph outputs review-card only and version-aware. |
| 5. Ship verification | Release manager lane | Pending. | High: push/deploy/live traffic. | Pending. | Pending. | Pending. | Pending. | Do not proceed until local gates pass and dirty-tree scope is isolated. | Review diff, commit on `main`, push, verify GitHub checks, deploy, verify live endpoints. |

## Required Gate Set

- `git status --short`
- `npm run audit:simplification`
- `npm run audit:capsule-v3`
- `npm run audit:capsule-contract`
- `npm run audit:capsule-memory-contract`
- `npm run audit:graph-proposal-review-contract`
- `npm run audit:cognee`
- `npm run audit:genkit-runtime`
- `npm run audit:agent-runtime-proof`
- `npm run typecheck`
- `npm run build`
- Focused unit tests for touched code.
- Authenticated/runtime lane only when env is available: `npm run test:auth-runtime:agent`

## Verification Log - 2026-05-28

| Command | Result |
|---|---|
| `git fetch origin main` | OK. |
| `git rev-list --left-right --count HEAD...origin/main` | `0 0`. |
| `npx vitest run tests/unit/simplification/visible-vocabulary-contract.test.ts` before copy edits | Expected RED: 1 failed test, 21 old-vocabulary violations. |
| `npx vitest run tests/unit/simplification/visible-vocabulary-contract.test.ts` after copy edits | PASS: 1 test. |
| `npx vitest run tests/unit/lib/agent-runtime/tool-registry.test.ts` before schema edits | Expected RED: generic schemas accepted unexpected fields. |
| `npx vitest run tests/unit/lib/agent-runtime/tool-registry.test.ts` after schema edits | PASS: 2 tests. |
| `npx vitest run tests/unit/simplification/visible-vocabulary-contract.test.ts tests/unit/lib/agent-runtime/tool-registry.test.ts tests/unit/components/tasklet-workbench-contract.test.ts tests/unit/lib/agent-runtime/api-schema.test.ts tests/unit/lib/ai/ask-orchestrator.test.ts` | PASS: 5 test files, 87 tests. Reran after runtime receipt wording changes; still PASS. |
| `npm run audit:simplification` | PASS: route consolidation, normal-user archive, admin internals, next moves, context health, and canonical names all OK. |
| `npm run audit:capsule-v3` | PASS. |
| `npm run audit:capsule-contract` | PASS. |
| `npm run audit:capsule-memory-contract` | PASS. |
| `npm run audit:graph-proposal-review-contract` | PASS. |
| `npm run audit:cognee` | PASS: static-marker OK. |
| `npm run audit:genkit-runtime` | PASS with warning: local Google AI fallback has no API key; live flow calls need `GOOGLE_GENAI_API_KEY`, `GOOGLE_AI_API_KEY`, `GEMINI_API_KEY`, or Vertex config. |
| `npm run audit:agent-runtime-proof` | PASS with warnings: local shell missing `AGENT_RUNTIME_DATABASE_URL`/`PRAXIS_DATABASE_URL`/`DATABASE_URL`, worker base URL/auth env, live Genkit model config, and ADK Agent Engine env. Static runtime proof OK. |
| `npm run typecheck` | PASS. Reran after runtime receipt wording changes; still PASS. |
| `npm run build` | PASS: Next.js 16.2.6 production build compiled and generated 160 static pages. Reran after runtime receipt wording changes; still PASS. |
| `git diff --check` | PASS; only CRLF conversion warnings from existing working-copy settings. Reran after final code changes; still PASS. |
| `TEST_FIREBASE_EMAIL` / `TEST_FIREBASE_PASSWORD` check | Missing; skipped `npm run test:auth-runtime:agent` because authenticated lane env is unavailable. |
| `graphify update .` | PASS: AST extraction 1388/1388 files; graph rebuilt to 6200 nodes, 11671 edges, 729 communities; HTML viz skipped because graph exceeds 5000-node limit. |

## Live Verification Targets

After deploy, record:

- Cloud Run latest revision and traffic.
- `https://praxis.tacitus.me/`
- `https://praxis.tacitus.me/login`
- `https://praxis.tacitus.me/api/health`
- `https://praxis.tacitus.me/api/health/runtime`
- `https://praxis.tacitus.me/api/health/agentic-search`
- Runtime health audit command and result, including the working `GCLOUD_BIN` path.
