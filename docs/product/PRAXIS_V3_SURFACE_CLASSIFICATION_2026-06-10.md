# PRAXIS v3 Surface Classification

Date: 2026-06-10
Status: Phase 0 implementation artifact
Code contract: `src/lib/navigation/v3-surface-classification.ts`

## Purpose

This file records the first v3 convergence slice before visible navigation or
route behavior changes. PRAXIS should converge around:

```text
Attach -> Ask -> Build -> Review
```

The typed source of truth is `src/lib/navigation/v3-surface-classification.ts`.
The unit guard is `tests/unit/lib/navigation/v3-surface-classification.test.ts`.

## v3 Label Mapping

| v3 label | Current route | Classification | Current surface |
|---|---|---|---|
| Ask | `/app` | `LOOP` | Home plus Ask PRAXIS panel |
| Library | `/app/capsules` | `LOOP` | Capsules, marketplace lane, source/proof material |
| Studio | `/app/capsules/builder` | `FOLD_IN` | Existing capsule builder/workbench flow |
| Runs | `/agents/[runId]` | `FOLD_IN` | AgentRun deep links and recent generated work |
| Labs | `/app/boardroom` | `LABS` | Boardroom and specialist experiments |

This is a mapping layer, not a new top-level app shell. `Studio` and `Runs`
start as folded-in flows because the current code already has builder and
AgentRun detail seams, but not separate stable primary pages for them.

## Current Primary Nav Classification

| Current nav | Target | Classification | Decision |
|---|---|---|---|
| Home | Ask | `LOOP` | Reframe around the Ask composer and Capsule Dock. |
| Capsules | Library | `LOOP` | Keep as the capsule/source/proof/library hub. |
| Boardroom | Labs | `LABS` | Keep useful, but flagged outside the core loop. |
| Recent work | Runs | `FOLD_IN` | Fold into receipts, Library items, and run deep links. |
| Marketplace | Library | `TOOL_CAPSULE` | Become the curated Exchange/gallery lane. |
| Settings | none | `FOLD_IN` | Keep as account/system support, not a product loop. |

## Tool Capsule Gallery V1

The initial curated Tool capsule gallery is intentionally compact:

- Context Builder
- Research & Sources
- Documents
- GraphOps
- Timeline & Signals
- Actors & Stakeholders
- Briefing Studio

`Ask PRAXIS` is not in the gallery because it is the operating loop. `Situation
Dashboard` is also not in the gallery because readiness and next actions should
sit in Ask rather than becoming a separate attachable tool.

## Demo Route Decision

No real `src/app/demo` route tree exists in this checkout. Treat any demo mode
as fixture/cookie/store state with explicit simulated labeling; there is no
demo route to delete for Phase 0.
