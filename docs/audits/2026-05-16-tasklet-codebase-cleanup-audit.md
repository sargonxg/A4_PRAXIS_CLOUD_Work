# PRAXIS Tasklet Codebase Cleanup Audit - 2026-05-16

## Scope

PRAXIS is now being shipped as a Tasklet-style ContextCapsule agent runtime, not
as the older multi-surface workbench with a visible Agentic Boardroom/persona
product. This audit records the aggressive cleanup pass that removes generated
bulk, stale frontend surfaces, and backend contracts that no longer belong to
the Tasklet-style ContextCapsule runtime.

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
| `docs/v7/` | historical slice plan folder pointing at removed May 8 roadmaps |
| `docs/PRAXIS_PHASE_SPEC_AUDIT_2026-05-06.md` | old phase audit tied to removed phase/Boardroom surfaces |

## Wave 3 Removed From Source

| Path | Reason |
|---|---|
| `src/components/workbench/` | orphan UI shell after `/app/workbench` route removal |
| `src/tabs/` | old workspace-tab registry consumed only by removed workbench tests |
| `src/components/tools/ToolMarketplace.tsx` | old workbench-scoped marketplace; `/app/tools` now uses `ContextBuilderRoom` |
| `src/components/ontology/OntologySchemaViewer.tsx` | old workbench ontology tab viewer |
| `tests/e2e/workbench/` | E2E tests for removed workbench route family |
| `tests/unit/workspace-*.test.ts` | tests for removed tab/workbench shell |
| `src/lib/workbench/*` unused helpers | old chapter/surface/empty-state scaffolds; kept only reusable library/research/draft/open-question helpers |
| `docs/implementation/WORKSPACE_TABS_CHAPTERS_FOUNDATION.md` | old tabs/chapters implementation note |
| `docs/adr/0023-ach-workbench-surface.md` | retired ACH workbench-surface ADR |
| `docs/runbooks/MAP_TILE_HOSTING.md` | map runbook for removed workbench graph view |
| `docs/superpowers/specs/2026-05-13-hero-animation-and-context-core-narrative-ideation.md` | old ideation doc tied to removed workbench graph route |

## Wave 3 Route Simplification

- `/app/workbench` and `/app/workbench/*` now redirect to `/app/contexts`.
- Visible navigation Library now points directly to `/app/contexts`.
- Workbench deep links in active source were retargeted to `/app/contexts`,
  `/app/write`, `/app/assistant`, `/app/canvas`, or `/app/tools`.
- A minimal `/app/canvas` route now reuses the current ContextBuilderRoom so
  the visible Canvas nav item is not a dead link.

## Redirect And Surface Changes

- Legacy `/app/brainstorming-table`, `/app/advisory`, `/app/concordia`,
  `/app/scenarios`, `/app/game-theory`,
  `/app/mediation-design`, and `/app/negotiation-prep` aliases now redirect to
  `/app/tools` instead of the removed workbench Boardroom tab.
- Legacy `/app/boardroom` compatibility redirects were removed; that surface is
  now fully retired instead of silently preserved.
- Other legacy workbench aliases now redirect to current canonical app routes
  such as `/app/dashboard`, `/app/contexts`, `/app/library`, `/app/assistant`,
  `/app/canvas`, and `/app/write` instead of `/app/workbench?tab=...`.
- The visible product-surface registry no longer lists `boardroom` as a default
  surface.
- User Core now links to core preferences instead of removed persona settings.

## Wave 4 Removed From Source

| Path | Reason |
|---|---|
| `backend/agents/analyst_persona/` | retired persona subagent for removed Boardroom product |
| `backend/agents/moderator/` | retired Boardroom orchestration subagent |
| `backend/types/boardroom.py` | schema used only by removed persona/Boardroom stack |
| `backend/routers/custom_personas.py` | custom-persona prep route not registered in FastAPI and tied to removed surface |
| `backend/services/custom_personas/` | custom-persona validation/prompt/sandbox helpers for removed surface |
| `backend/services/persona_corpus/` | persona-corpus retrieval plan for removed custom-persona stack |
| `backend/services/workspace_orchestrator/subgraphs/boardroom.py` | Boardroom chapter helper after chapter endpoints were removed |
| `backend/tests/test_boardroom_types.py` | tests for removed Boardroom schema/runners |
| `backend/tests/test_custom_personas.py` | tests for removed custom-persona route/service |
| `backend/tests/test_persona_corpus_retrieval.py` | tests for removed persona-corpus service |
| `backend/.pytest_cache` and backend `__pycache__/` folders | generated Python cache output |
| `docs/tools/UX_AUDIT_2026-04-26.md` | stale old-tool UX audit superseded by current runtime audits |
| `docs/tools/CORE_TOOL_AUDIT_2026-04-27.md` | stale old-tool audit superseded by current runtime audits |
| `docs/tools/brainstorming-table.md` | stale planned expert-deliberation tool spec |

## Wave 4 Contract Changes

- Backend agent registry now exposes only the current durable flows:
  `document_extraction`, `deep_research`, `symbolic_firewall`,
  `red_team_analyst`, and `gdelt_monitor`.
- Backend chapter router no longer exposes `/boardroom` or briefing CRUD/export
  endpoints.
- Next backend proxy allowlist no longer forwards `chapters/boardroom`.
- Boardroom-specific telemetry and open-question resolver enum values were
  removed.
- Advisor constants now describe routed policy lenses, not a visible Boardroom.

## Wave 5 Removed From Source

| Path | Reason |
|---|---|
| `docs/build/ANTIGRAVITY_V5_HANDOFF.md` | old v5 handoff pointer stub |
| `docs/build/PRAXIS_GENKIT_SPRINT_*_2026-05-14.md` | superseded May 14 sprint prompt stubs |
| `docs/build/PRAXIS_MVP_PACKS_ABCD_COMPLETION_LEDGER.md` | superseded v5/MVP pointer stub |
| `docs/build/PRAXIS_v5_*.md` | retired v5 phase prompt and ledger stubs |
| `docs/backlog/2026-05-06-*.md` | retired May 6 backlog files replaced by current ledger/TODO |
| `docs/architecture/PRAXIS_VISION_v4_*.md` | retired v4/v5 vision files replaced by current product docs |
| `docs/adr/0037-user-models-as-first-class-versioned-artifacts.md` | duplicate v5 ADR no longer part of current direction |
| `docs/adr/0038-two-context-product-model-on-dual-ontology-layer.md` | duplicate v5 ADR no longer part of current direction |
| `docs/adr/0039-seven-logical-graphs-one-user-facing-graph.md` | duplicate v5 ADR no longer part of current direction |
| `docs/adr/0040-twelve-named-llm-graph-interaction-patterns.md` | duplicate v5 ADR no longer part of current direction |
| `skills/subagents/analyst_persona/` | local skill for retired Boardroom persona subagent |
| `skills/subagents/moderator/` | local skill for retired Boardroom moderator subagent |

## Wave 5 Reference Changes

- Startup docs now point to `docs/product/` and the current Tasklet build ledger
  instead of v4/v5 handoff docs.
- Architecture/reference audits now verify current Tasklet/product docs rather
  than deleted May 6 backlog files or v5 pointer stubs.
- `docs/adr/README.md` no longer lists the retired duplicate v5 ADRs.

## Preserved For Now

These are old-direction artifacts, but they still have live imports or backend
contracts and should be removed only in a backend migration:

| Path | Why preserved |
|---|---|
| Large calibrated AI route catalogue | still covered by `node scripts/audit-ai-routes.mjs`; collapse only with registry/tool-contract migration |
| Historical migrations with `briefings` tables | database history should not be rewritten in cleanup passes |
| Legacy `/app/workbench` compatibility redirect | preserves inbound links while routing to `/app/contexts` |

## Next Aggressive Cleanup Queue

1. Replace `/app/workbench`-based marketplace staging links with current
   Ask PRAXIS, Canvas, Memo Studio, and Advanced routes.
2. Collapse old v5/phase architecture history into the current
   Tasklet runtime plan and mark the old docs historical.
3. Collapse specialist AI routes into the canonical agent runtime after the
   tool registry is reduced to the max-10 visible tools.
4. Run Knip after the shared tree settles; current dirty deletes already show
   several demo/the selected situation constants removed by parallel cleanup.

## Simplification Suggestions

1. Replace the remaining `/app/workbench/*` chapter model with route-specific
   redirects to `/app/contexts`, `/app/library`, `/app/canvas`, `/app/write`,
   and `/app/tools`; keep `/app/workbench` only as a compatibility redirect.
2. Collapse Advanced to one surface: `/app/tools`, with admin-only internals
   hidden behind role-gated settings.
3. Remove the old Pack/v5/v7 planning docs after the Tasklet runtime plan,
   canonical app structure, and build ledger contain the current source of truth.
4. Keep backend agents generic: document extraction, deep research, symbolic
   firewall, red-team review, monitoring, and the Tasklet reasoning loop.
5. Keep only tests that validate the shipped spine: Ask PRAXIS, Context/User
   Core, Library, Memo Studio, Canvas, Advanced, agent-run SSE, and runtime
   approval gates.

## Validation Notes

- `npx tsc --noEmit` passed after the route/backend cleanup.
- `npx vitest run tests/unit/lib/constants/advisors.test.ts tests/unit/lib/constants/dialectica-backbone.test.ts tests/unit/lib/navigation/product-surfaces.test.ts`
  passed: 3 files, 8 tests.
- `npm run audit:repo-shape` passed.
- `npm run audit:route-consolidation` passed.
- `npm run audit:tasklet-policy-workbench` passed.
- `node scripts/audit-ai-routes.mjs` passed: 69 AI route files, 69 calibrated,
  10 exempt.
- Direct backend registry smoke passed with the reduced registry. Full pytest
  via `PYTHONPATH=backend` is blocked by the existing `backend/types` package
  shadowing Python stdlib `types`.
