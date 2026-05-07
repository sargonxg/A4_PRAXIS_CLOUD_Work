# PRAXIS User Experience Audit Report

Date: 2026-05-07

Prompt source: `C:\Users\giuli\Downloads\USER_EXPERIENCE_AUDIT_PROMPT.md`

## TL;DR

Status: YELLOW.

The main app surfaces are now much closer to a real user workflow: dashboard, workbench tabs, chapters, graph/timeline/map visualization, tools, Memo Studio, draft assembly, and boardroom surfaces all have static audit coverage. The key remaining gap is end-to-end browser proof across a signed-in user journey and live backend execution. Some flows are polished and useful in demo mode, but live AI/Cognee orchestration is still not proven.

## What Passed

| Check | Result | Evidence |
| --- | --- | --- |
| Workbench static audit | PASS | `npm run audit:workbench` passed earlier in this pack. |
| Visualization audit | PASS | `npm run audit:visualization` passed earlier in this pack. |
| UX polish audit | PASS | `npm run audit:ux-polish` passed earlier in this pack. |
| Dashboard audit | PASS | `npm run audit:dashboard` passed earlier in this pack. |
| Memo Studio audit | PASS | `npm run audit:memo-studio` passed after aligning the audit to chapters. |
| Boardroom audit | PASS | `npm run audit:boardroom` passed earlier in this pack. |
| Tool marketplace audits | PASS | Tool contract/marketplace audits passed and generated `docs/audits/tool-contracts-2026-05-07.md`. |

## Findings

| ID | Severity | Area | Finding | Recommendation |
| --- | --- | --- | --- | --- |
| UX-F01 | P1 | Memo surface contract | The old audit expected memos as a tab, but the current product model places Memo Studio in the chapter flow. | Fixed `scripts/audit-memo-studio.ts` to enforce chapter placement and prevent tab sprawl. |
| UX-F02 | P1 | Browser proof | Local browser smoke is now green for landing animation, 3D graph, workbench, Library, research visuals, ontology, graph, tools, memos/decision product, draft export, and contrast. Production signed-in smoke remains open. | Run the same smoke against production/staging with a signed-in user. |
| UX-F03 | P1 | Live data loops | UI surfaces are usable, but some flows queue deterministic runs or local fallbacks when Python backend/Cognee are not configured. | Mark live/scaffold states visibly in UI and close AI/Cognee runner gaps before claiming full production automation. |
| UX-F04 | P2 | Chapter personalization | Role/context-aware suggestions exist, but hiding/reordering chapters by user preference needs stronger proof. | Add a workbench preference e2e that changes profile role/preferences and verifies chapter/tool ordering. |
| UX-F05 | P2 | Export confidence | Memo export helpers and UI are present; footnoted export fidelity was not visually inspected in this pass. | Add DOCX/PDF export fixture tests that inspect generated files for title, sections, footnotes/provenance, and source appendix. |

## Fixes Made This Pass

- Updated `scripts/audit-memo-studio.ts` to enforce Memo Studio as a work chapter.
- Preserved the current workbench structure: four tabs for operating surfaces, seven chapters for work products and workflows.
- Generated/kept `docs/audits/tool-contracts-2026-05-07.md` from the tool contract audit.
- Added custom-chapter `data-testid` wrappers so example-case UX surfaces are testable without forcing every case into the generic component.
- Fixed local `/api/backend/*` fallback behavior for Library and Draft routes when `NEXT_PUBLIC_PRAXIS_BACKEND_URL` is absent.
- Updated the app usability Playwright smoke to match the current modal tab model and Syria example-case chapter visuals.

## Verification

```text
npm run audit:memo-studio
npm run audit:workbench
npm run audit:visualization
npm run audit:ux-polish
npm run audit:dashboard
npm run audit:boardroom
$env:PLAYWRIGHT_BASE_URL='http://localhost:3000'; npx playwright test tests/e2e/app-usability-smoke.spec.ts
```

`audit:memo-studio` passed after this pass. The local browser smoke passed with 3/3 tests. Production signed-in browser verification remains the next required step.

## Next Implementation Queue

1. Run a real browser smoke across dashboard, workbench, tools, memos, graph, boardroom, and settings.
2. Add an e2e test for role-aware workbench/chapter/tool ordering.
3. Add export artifact tests for Memo Studio and draft assembly.
4. Improve UI labels where a surface is deterministic/demo-safe rather than live AI-backed.
