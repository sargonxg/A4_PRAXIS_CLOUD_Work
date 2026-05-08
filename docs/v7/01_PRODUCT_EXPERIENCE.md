# PRAXIS v7 Brief 01 - Product Experience

Status: active brief

## Goal

Make PRAXIS feel like a premium, simple, modern policy AI application.

The user should not start in a dense workbench. The user should start with:

1. Workspace selection.
2. Situation selection.
3. Ask PRAXIS.
4. A few guided workflows.
5. Context coverage and latest work.

## Primary Areas

| Area | User Need | Existing Code To Reuse |
| --- | --- | --- |
| Home | Pick workspace/Situation and resume. | Dashboard, situations, onboarding, workbench picker. |
| Ask | Ask, plan, run, review, produce. | Assistant components, calibrated AI routes, tool invocation UI. |
| Situation | Understand the TACITUS model. | Context, Graph, Ontology, Desk, open questions. |
| Sources | Improve evidence and context. | Library, Research, DocumentUploadInline, source receipts. |
| Outputs | Handover, briefs, memos, drafts, exports. | MemoStudio, DraftTab, Boardroom synthesis, export routes. |
| Advanced | Power-user tools. | Marketplace, ACH, GraphOps, Boardroom rooms, admin/settings. |

## Desktop Shell

- Left workspace rail.
- Main canvas.
- Ask PRAXIS drawer.
- Deep surfaces opened from workflows.

## Mobile Shell

Bottom nav:

1. Home
2. Ask
3. Sources
4. Outputs
5. More

Mobile must avoid dense grids, wide tables, and graph editing as the first view.

## Acceptance

- New user sees a clear first action.
- Ask PRAXIS is visible or one tap away.
- Every advanced surface remains reachable.
- Mobile has no horizontal overflow.
- Internal tech names are not visible in first-run UX.
