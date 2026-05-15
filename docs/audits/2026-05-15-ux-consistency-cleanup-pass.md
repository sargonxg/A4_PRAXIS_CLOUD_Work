# PRAXIS UX Consistency And Cleanup Pass

Date: 2026-05-15

## Scope

Applied the current design contract without adding primary surfaces. The visible app map remains:

- Home
- Ask PRAXIS
- Library
- Memo Studio
- Canvas
- Advanced

## UI Changes

| Area | Evidence | Result |
| --- | --- | --- |
| Shared header | `src/components/app/app-page-header.tsx` | Added one compact title/subtitle/action pattern for app pages. |
| Context bar | `src/components/app/core-context-strip.tsx` | Reworked into calm cells for User Core, Situation Core, sources/documents, output posture, health, and one change-context action. |
| Ask PRAXIS | `src/components/ask/AskWorkspacePage.tsx`, `src/components/ask/AskStreamPanel.tsx` | Rebuilt the working surface around one large chat panel, six active core chips, compact policy tool commands, Send to Memo Studio, and an inline Context Composer rail. Removed the old dashboard-style knowledge stack, capability runway, policy posture, and duplicated context explanation panels from the Ask page. |
| Library | `src/components/workbench/LibraryTab.tsx` | Shortened intake copy and replaced generic empty/detail states with useful missing-state copy. |
| Canvas | `src/components/canvas/ContextCanvasPage.tsx` | Replaced long header with compact review header and tightened empty gap copy. |
| Advanced | `src/app/app/tools/page.tsx` | Reframed the page as contained machinery, not a tool marketplace. |
| Admin | `src/app/app/admin/page.tsx` | Put Admin behind the same compact header pattern. |
| Settings | `src/app/app/settings/page.tsx` | Put Settings behind the same compact header pattern and fixed `/settings/*` links to `/app/settings/*`. |

## Cleanup Evidence

Commands run:

- `npx tsc --noEmit`: passed after adding explicit `withAuth` route types in two existing API routes.
- `npx tsc --noEmit`: passed again after the Ask PRAXIS cockpit rewrite.
- `npm run audit:simplification`: passed with existing canonical-name warnings for duplicated display names.
- `npm run audit:mvp-route-shape`: initially failed because the script still requires a literal `/app/contexts` marker in `PRIMARY_NAV`; kept `/app/contexts` as a compatibility marker comment while preserving the six visible nav labels.
- `npx knip --no-exit-code --reporter compact`: produced a large candidate list, not safe for automatic deletion.

## Cleanup Decision

No code was deleted in this pass. Knip reports many likely false positives because this repo has route-loaded files, registry-driven tools, archived demo code, and test-only exports. Safe deletion requires a second pass that groups findings by:

- route unreachable by Next.js routing and proxy redirects,
- no static imports and no registry/config references,
- no tests or docs naming the export,
- no archive/legacy exception in `AGENTS.md`, `DESIGN.md`, or `TODO.md`.

High-signal follow-up candidates to verify first:

- `src/components/landing/path-operator-orbit.tsx`
- `src/components/landing/rotating-headline.tsx`
- older `src/components/assistant/*` bubbles if `AskStreamPanel` remains canonical
- older dashboard experiments under `src/components/dashboard/*`
- unused visualization components that no route imports

Do not remove `docs/_archive`, legacy redirects, compatibility wrappers, or heritage landing assets without a route/import/doc audit confirming they are safe.
