# PRAXIS MVP Simplification Ledger - 2026-05-11

## Product Decision

PRAXIS should feel like one policy-analysis workbench, not a catalogue of
tools. The MVP shape is:

1. Ask PRAXIS is the command plane.
2. User Core is the maintained model of the analyst, audience, style, limits,
   and preferences.
3. Context Core is the maintained model of the situation, sources, graph, open
   questions, and output history.
4. Tools are suggested by Ask PRAXIS and context health, then run inside the
   workbench. They are not the primary navigation model.
5. Output work happens as memos, handovers, briefings, and exports with visible
   provenance.

## Current Tool Audit

Evidence generated in this pass:

- `docs/audits/tools-2026-05-11.md`
- `docs/audits/tool-contracts-2026-05-11.md`

Findings:

- 66 AI route-style tools exist.
- 55 registered tools pass the current operating-contract audit.
- Only 2 of 66 tools score at least 10/12 on the stricter calibration audit.
- This means the app has enough backend/tool depth for a powerful product, but
  too much surface area for a clear MVP.

## MVP Navigation

Keep these as first-class authenticated surfaces:

| Surface | Route | Purpose |
| --- | --- | --- |
| Ask | `/app/dashboard#ask-praxis` | Start every workflow from the command plane. |
| Context Core | `/app/cores/context` | Build and maintain the situation/context core. |
| User Core | `/app/cores/user` | Build and maintain the analyst/user core. |
| Workbench | `/app/workbench` and `/app/workbench/[caseId]` | Inspect and operate on the active policy case. |
| Outputs | `/app/workbench/[caseId]?openChapter=memos` | Draft, memo, handover, and export path. |
| Tools | `/app/tools` | Suggested and specialist tools, not default product shape. |

## Keep

- `src/components/dashboard/ask-praxis-home.tsx`
- `src/components/dashboard/active-core-stack.tsx`
- `src/lib/product/context-core-map.ts`
- `src/lib/product/experience-map.ts`
- `src/lib/constants/consolidated-tools.ts`
- `src/components/contexts/*`
- `src/components/workbench/*`
- `src/components/tools/ToolMarketplace.tsx`
- `src/lib/tools/marketplace/*`
- `src/lib/ai/ask-praxis*`

## Consolidate Behind Ask PRAXIS

These should remain callable, but not visible as primary app navigation:

- Boardroom
- ACH
- GraphOps
- Source Scout
- Deep Search / Deep Research
- Media analysis
- Legal / sanctions / treaty tools
- Humanitarian / human-rights / electoral / economic specialist reads
- Actor, stakeholder, mediation, negotiation, and commitment specialist tools

## Archive Or Hide From Default UI

Archive means preserve route compatibility, but hide from default flows unless
the user opens advanced tools or Ask PRAXIS recommends it.

- Legacy single-tool pages under `/app/{tool}`.
- Duplicate tool pages that point to the same workbench chapter.
- Old v7 branch stack UI (`src/components/v7/*`) unless selectively ported into
  current-main components.
- Screenshot-heavy v7 audit artifacts after their useful ideas are recorded in
  current-main docs.
- Already merged remote branch `claude/review-praxis-setup-0GOaI`.

## Do Not Delete Yet

Do not delete these until current-main replacement tests exist:

- 66 calibrated AI routes.
- `backend/routers/*`.
- `backend/services/context_genesis/*`.
- Boardroom and ACH routes.
- Graph routes and cron routes.
- Export/import document routes.
- Firestore rules/index-bound services.

## First Implementation Checkpoint

This pass should make the app visibly simpler without risky backend removal:

1. Authenticated navigation becomes Ask, Context Core, User Core, Workbench,
   Outputs, Tools, Settings.
2. `/app/cores/user` becomes the dedicated User Core maintenance page.
3. `/app/cores/context` becomes the dedicated Context Core maintenance page.
4. Dashboard Ask PRAXIS becomes a large centered command bar with attachable core
   chips and suggested tool actions.
5. Landing hero shows the same mental model: Ask PRAXIS plus draggable User Core
   and Context Core attachments.
6. Advanced/specialist tools remain available through `/app/tools`.

## Next Deletion Queue

After the first checkpoint is validated:

1. Delete the already-merged remote branch
   `claude/review-praxis-setup-0GOaI`.
2. Create a fresh salvage branch from `main` and port only useful core-picker
   behavior from `inspect/v7-block6-provider-isolation`.
3. Close the stale stacked v7 PRs after salvage notes are committed.
4. Add an audit that fails if default navigation grows beyond the MVP surface
   count.
5. Add persistence for core ordering and test it survives reload.
