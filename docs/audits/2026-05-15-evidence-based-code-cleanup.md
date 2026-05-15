# Evidence-Based Code Cleanup - 2026-05-15

## Scope

Cleanup pass for generated artifacts and dead-code candidates in
`C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work`.

The worktree already had one unrelated dirty file at baseline:
`src/components/workbench/LibraryTab.tsx`. This pass did not edit it.

## Candidate Table

| Candidate | Type | Evidence | Action |
|---|---|---|---|
| `test-results/.last-run.json` | generated Playwright scratch | Path is generated test output, tracked in Git, and memory/current repo guidance identifies `test-results/` as a safe cleanup target. | Delete and ignore `/test-results/`. |
| `playwright-report/` | generated Playwright report | Standard Playwright generated output; no active repo source depends on committing it. | Ignore future output. |
| `src/lib/ai/legacy-data-stream.ts` | legacy compatibility | Active imports in AI chat and grounded-search routes; prior cleanup notes mark it as intentionally live. | Keep. |
| `src/app/app/tools/archive/page.tsx` | archive route | Redirects to the admin-gated tools archive posture; route-shape and archive audits reference this behavior. | Keep. |
| `docs/_archive/` | historical archive | Architecture/build docs and prior cleanup notes mark archived docs as retained evidence. | Keep. |
| Knip unused component list | rough dead-code signal | Includes design-system wrappers, D3 visualizations, sprint-owned capsule components, and audit-referenced files. | Defer until path-specific ownership is assigned. |
| Knip unused dependencies | rough dependency signal | Some dependencies are used only by files Knip also labels unused; removing them would couple cleanup to a larger UI/archive decision. | Defer. |
| Knip unlisted dependencies | package hygiene | `@polar-sh/sdk`, `@tiptap/core`, `@next/env`, and OpenTelemetry are imported from active files. This is dependency declaration work, not dead-code deletion. | Defer to dependency hygiene slice. |

## Cleanup Performed

- Removed tracked generated artifact `test-results/.last-run.json`.
- Added `/test-results/` and `/playwright-report/` to `.gitignore`.

## Deferred Work

- Run a dedicated dependency hygiene pass to decide whether to add unlisted
  direct dependencies or remove superseded imports.
- Run a component ownership pass before deleting Knip-reported UI files. Many
  are intentionally retained for audits, demos, or upcoming capsule/path work.
- Keep route consolidation separate from this cleanup pass so
  `audit:mvp-route-shape` remains the authority for compatibility redirects.

