# PRAXIS Tasklet Codebase Cleanup Audit - 2026-05-16

## Scope

PRAXIS is now being shipped as a Tasklet-style ContextCapsule agent runtime, not
as the older multi-surface workbench with a visible Agentic Boardroom/persona
product. This audit records the aggressive cleanup pass that removes generated
bulk and stale frontend surfaces while preserving backend contracts that are
still imported by active ADK/Agent Engine code.

## Repo Size Snapshot

Initial source metrics before this cleanup pass:

| Metric | Value |
|---|---:|
| Git-tracked files | 2,121 |
| Git-tracked size | ~19.2 MB |
| Disk files excluding `.git`, `node_modules`, `.next`, `graphify-out` | 2,654 |
| Disk size excluding `.git`, `node_modules`, `.next`, `graphify-out` | ~197.7 MB |

Generated local bloat removed before source cleanup:

| Path | Reason |
|---|---|
| `.code-review-graph/` | ignored local graph database, ~89.6 MB |
| `rust/semantica-core/target-ci/` | ignored Rust CI build output, ~94 MB |
| `test-results/` | ignored Playwright output |

## Removed From Source

| Path | Reason |
|---|---|
| `docs/tools/generated/` | generated per-tool specs; regenerate with `npm run generate:tool-docs` when needed |
| `output/playwright/phase6-draft-*.png` | old Phase 6 screenshot artifacts |
| `src/components/boardroom/` | stale visible Boardroom UI; live Next boardroom API surface is gone |
| `src/lib/boardroom/` | frontend deterministic Boardroom helper layer tied to removed UI |
| `src/components/personas/` | custom persona authoring UI tied to missing settings routes |
| `src/types/boardroom.ts` | frontend-only Boardroom schema for removed UI/tests |
| `tests/unit/lib/boardroom/` | tests for removed frontend Boardroom helpers |
| `tests/e2e/workbench/boardroom-*.spec.ts` | E2E tests for removed workbench Boardroom flow |
| `tests/e2e/settings/custom-persona-creation.spec.ts` | E2E test for removed persona settings flow |
| `docs/audits/2026-05-08-CODEBASE_AUDIT/` | old comprehensive audit evidence superseded by Tasklet cleanup ledgers |
| `docs/audits/2026-05-08-REPO_PURPOSE_AUDIT/` | old repo-purpose evidence superseded by this audit |
| `docs/PRAXIS_ARCHITECTURE_AND_AGENT_HANDOFF_2026-05-06.md` | historical Phase 3 handoff doc describing removed workbench/Boardroom surfaces |

## Wave 2 Removed From Source

| Path | Reason |
|---|---|
| `docs/personas/` | persona walkthrough docs for removed custom-persona surface |
| `docs/roadmap/PRAXIS_*_2026-05-08.md` | old mobile/design-led workbench roadmap superseded by Tasklet runtime plan |
| `docs/backlog/2026-05-07-pack26-28-surfaces-followup.md` | old Pack 26-28 surface follow-ups superseded by compact app runtime |
| `docs/adr/0026-agentic-boardroom-architecture.md` | retired visible Boardroom architecture |
| `docs/adr/0027-parameterized-analyst-persona-subagent.md` | retired Pack 16 persona-subagent plan |
| `docs/adr/0028-persona-corpus-retrieval.md` | retired custom-persona corpus plan |
| `tests/e2e/personas/` | E2E tests for old persona-specific walkthroughs |
| `src/app/api/ai/boardroom/` | orphan AI replay route for removed Boardroom UI |

## Redirect And Surface Changes

- Legacy `/app/boardroom`, `/app/brainstorming-table`, `/app/advisory`,
  `/app/concordia`, `/app/scenarios`, `/app/game-theory`,
  `/app/mediation-design`, and `/app/negotiation-prep` aliases now redirect to
  `/app/tools` instead of the removed workbench Boardroom tab.
- Other legacy workbench aliases now redirect to current canonical app routes
  such as `/app/dashboard`, `/app/contexts`, `/app/library`, `/app/assistant`,
  `/app/canvas`, and `/app/write` instead of `/app/workbench?tab=...`.
- The visible product-surface registry no longer lists `boardroom` as a default
  surface.
- User Core now links to core preferences instead of removed persona settings.

## Preserved For Now

These are old-direction artifacts, but they still have live imports or backend
contracts and should be removed only in a backend migration:

| Path | Why preserved |
|---|---|
| `backend/types/boardroom.py` | imported by `backend/agents/analyst_persona` and `backend/agents/moderator` |
| `backend/routers/chapters.py` Boardroom chapter endpoints | still part of backend chapter proxy contract |
| `backend/routers/custom_personas.py` and `backend/services/custom_personas/` | backend custom-persona route/service stack still imports shared schemas |
| `backend/services/workspace_orchestrator/subgraphs/boardroom.py` | backend chapter orchestration helper |
| Boardroom/persona ADRs and architecture history | keep until backend removal ADR lands |

## Next Aggressive Cleanup Queue

1. Remove or replace backend Boardroom/custom-persona modules once ADK
   `analyst_persona` and `moderator` are refactored into the new
   agent-runtime/tool-registry loop.
2. Replace `/app/workbench`-based marketplace staging links with current
   Ask PRAXIS, Canvas, Memo Studio, and Advanced routes.
3. Collapse old v5/phase/boardroom architecture history into the current
   Tasklet runtime plan and mark the old docs historical.
4. Run Knip after the shared tree settles; current dirty deletes already show
   several demo/Syria constants removed by parallel cleanup.

## Simplification Suggestions

1. Replace the remaining `/app/workbench/*` chapter model with route-specific
   redirects to `/app/contexts`, `/app/library`, `/app/canvas`, `/app/write`,
   and `/app/tools`; keep `/app/workbench` only as a compatibility redirect.
2. Collapse Advanced to one surface: `/app/tools`, with admin-only internals
   hidden behind role-gated settings.
3. Remove the old Pack/v5/v7 planning docs after the Tasklet runtime plan,
   canonical app structure, and build ledger contain the current source of truth.
4. Retire backend Boardroom/persona modules after ADK `analyst_persona` and
   `moderator` are mapped to generic runtime tool calls or removed from the
   Agent Engine registry.
5. Keep only tests that validate the shipped spine: Ask PRAXIS, Context/User
   Core, Library, Memo Studio, Canvas, Advanced, agent-run SSE, and runtime
   approval gates.

## Validation Notes

- `npx vitest run tests/unit/lib/agent-runtime` passed before this cleanup pass
  after the Tasklet runtime implementation.
- `npm run audit:tasklet-policy-workbench` passed before this cleanup pass.
- `npm run audit:tasklet-mvp-foundation` passed before this cleanup pass.
- Full `npx tsc --noEmit` remains red from pre-existing unrelated TypeScript
  failures in old demo/tool files; do not treat those as introduced by this
  cleanup without a focused diff.
