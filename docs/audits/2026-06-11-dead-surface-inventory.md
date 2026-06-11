# Dead Surface Inventory

Generated: 2026-06-11

Scope: Phase F Prompt 24 route/component cleanup pass. The audit reran the existing route cleanup inventory and then checked the named component candidates with `rg`.

## Route Inventory

Command:

```powershell
npm run audit:route-cleanup-map
```

Result:

- 227 API routes inventoried.
- 0 delete candidates.
- 0 archive candidates in the route map.
- 37 compatibility routes preserved.
- 116 do-not-touch routes preserved.
- 80 obsolete/code candidates reviewed in `docs/audits/2026-05-19-obsolete-code-candidates.md`; none are approved for immediate deletion.

Generated evidence:

- `docs/audits/2026-05-19-api-route-cleanup-map.md`
- `docs/audits/2026-05-19-api-route-cleanup-map.json`
- `docs/audits/2026-05-19-obsolete-code-candidates.md`
- `docs/audits/2026-05-19-visible-surface-preservation.md`
- `docs/audits/2026-05-19-agentic-runtime-readiness.md`

## Component Candidates

| Candidate | Evidence | Disposition |
| --- | --- | --- |
| `src/components/cores/domain-picker.tsx` | `rg '@/components/cores/domain-picker\|components/cores/domain-picker\|from .*cores/domain-picker' src tests docs scripts` returned no import, test, or docs hits. The only broad `DomainPicker` hit was the file itself. | Deleted as an unused duplicate. |
| `src/components/domain/domain-picker.tsx` | `src/app/onboarding/step-perspective.tsx` imports `@/components/domain/domain-picker` and renders `<DomainPicker` twice. | Kept; live onboarding surface. |
| Retired graph staging routes | `tests/unit/app/graph-staged-archive-routes.test.ts` asserts `status: 410`; docs and release notes reference the archived behavior. | Kept; compatibility/archive guard is intentional. |
| Visualization/graph components | `CapsuleWorkbenchPanel.tsx` lazy-loads `react-force-graph-2d`; `tests/unit/components/praxis/capsule-studio-contract.test.ts` and `tests/unit/components/phase-e-design-performance-contract.test.ts` assert that behavior. `src/components/runs/compact-run-timeline.tsx` is imported by `src/components/app/praxis-chat.tsx`. | Kept; referenced by current app/tests. |

## Deletion Performed

- Deleted `src/components/cores/domain-picker.tsx`.

No proxy redirect, docs reference, or test reference required updates for that deletion.
