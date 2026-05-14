# PRAXIS Simplification Technical Audit

Date: 2026-05-14
Branch: `main`
Remote checked: `origin https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`
Verified head: `2fea59e8 feat(app): mobile polish v2 + locked design rules`

## Executive Finding

PRAXIS is moving in the correct product direction: the visible app is now centered on `Ask PRAXIS`, `Cores`, `Library`, and `Memo Studio`; Advanced and Administration are collapsed; mobile exposes only the workspace spine. The remaining risk is not lack of capability. It is that the codebase still exposes several older mental models at the same time: dashboard-first, marketplace-first, demo-first, context-stack, context-package, situation list, cases list, profile page, settings pages, admin tabs, and floating chat.

The next wave should not add another page. It should make one working policy desk:

1. Ask from one universal command surface.
2. Attach one active context capsule.
3. Show at most three next actions.
4. Produce one grounded memo/output.
5. Keep the deep machinery hidden but inspectable.

## Current GitHub / Main State

- `git fetch origin main --prune` completed.
- `HEAD` equals `origin/main`; ahead/behind count is `0 0`.
- Recent main commits already included in this audit:
  - `2fea59e8` mobile polish v2 and locked design rules.
  - `3135bcaa` three new simplification gates.
  - `c80f04dd` consolidated legacy cases, situations, and profile routes.
  - `cb39e0f8` mobile sidebar background fix.
  - `c2f4906d` shortcut list filter fix.
  - `f3e0b833` app simplification roadmap.
  - `43d544b0` grouped sidebar.
  - `b4caa6bc` richer landing animation.
  - `5aad62e0` context engine adapter.

## Validation Run

Passed:

- `npm run typecheck`
- `npm run audit:repo-shape`
- `npm run audit:tool-contracts`
- `npm run audit:mvp-route-shape` after updating the audit contract to the new grouped `NAV_GROUPS` architecture.

Notes:

- `audit:repo-shape` warns that `graphify-out/GRAPH_REPORT.md` was built at `7d509631`, while current head is `cb39e0f8`.
- `npm run audit:tool-contracts` generated `docs/audits/tool-contracts-2026-05-14.md`.
- Full `npm run build`, full `npm run audit:gate`, `npm run audit:gcp`, and full `npx vitest run` were not run in this audit pass.

## What Is Already Good

- `src/lib/navigation/primary-nav.ts` has the right user-facing spine: Ask PRAXIS, Cores, Library, Memo Studio, with Advanced and Administration collapsed.
- `src/components/app/mobile-bottom-nav.tsx` now exposes only the Workspace group on mobile.
- `src/components/app/core-context-strip.tsx` gives every app page a persistent context strip.
- `src/app/api/workspace/context-stack/route.ts` persists a default active stack under `users/{uid}/contextStacks/default`.
- `src/lib/knowledge/context-engine.ts` can create/list/activate context packages, retrieve corpus, compute context health, propose graph deltas, and explain ingestion traces.
- `src/app/api/ai/chat/route.ts` injects calibration, situation context, corpus retrieval, graph snapshot summary, Ask PRAXIS extensions, and output persistence.
- `src/app/app/admin/page.tsx` has the beginning of a real admin control panel rather than only settings links.

## Highest Priority Changes

### 1. Canonical Capsule Service

UX target:
The user sees one small capsule strip everywhere: User, Situation, Sources, Graph, Time, Output. They can swap, save, fork, and hand it over.

Backend process:
Unify `contextStacks` and `context-packages` into a single capsule contract. Keep compatibility adapters, but make new features write to `users/{uid}/capsules/{capsuleId}`.

Required schema:

- `capsuleId`
- `ownerUid`
- `scope: user | situation | team`
- `parentCapsuleId`
- `forkedFromVersion`
- `coreRefs`
- `retrievalPolicy`
- `health`
- `activeForSituationIds`
- `provenance`
- `createdAt`
- `updatedAt`
- `schemaVersion`

Code to change:

- `src/lib/context/active-context-stack.ts`
- `src/app/api/workspace/context-stack/route.ts`
- `src/lib/knowledge/context-engine.ts`
- `src/app/api/context/packages/route.ts`
- `src/components/app/core-context-strip.tsx`
- New: `src/lib/context/capsule-service.ts`
- New: `src/app/api/context/capsules/route.ts`

Verification:

- Unit test: active stack can migrate into a capsule without losing source/document/output refs.
- API test: demo users cannot create private capsules.
- API test: non-owner cannot read or activate another user's capsule.
- E2E: switch capsule, reload, Ask PRAXIS uses the new capsule.

### 2. One Universal Ask Surface

UX target:
Every page starts from the same Ask box. The user should not need to know whether they are in Dashboard, Assistant, Tools, Workbench, or Memo Studio.

Backend process:
Make Ask PRAXIS route the request through a compact orchestration plan:

1. Resolve active capsule.
2. Resolve active situation.
3. Retrieve source/document/graph/tool-output context.
4. Classify intent.
5. Pick one runtime: answer, research, tool, memo, or clarification.
6. Persist thread, tool chips, and output actions.

Code to change:

- `src/app/api/ai/chat/route.ts`
- `src/app/api/ai/ask-praxis/route.ts`
- `src/components/ask/AskBar.tsx`
- `src/components/ask/AskWorkspacePage.tsx`
- `src/components/app/floating-praxis.tsx`
- `src/lib/ai/ask/intent-classifier.ts`
- `src/lib/assistant/response-action-kinds.ts`

Code to eliminate or demote:

- Dashboard-specific Ask links such as `/app/dashboard#ask-praxis`; point them to `/app/assistant` or dispatch the universal Ask command.
- Page-specific Ask copy that explains "why this page exists"; the page should be self-evident.

Verification:

- E2E: `/app/assistant` accepts a question with only a User Core and asks for missing Situation Core.
- E2E: from `/app/write`, Ask can insert output into the active draft.
- Unit: intent classifier returns max three next actions.
- Unit: response actions include memo/send/source/check variants only when supported by context.

### 3. Suggested Next Moves, Not Tool Browsing

UX target:
Never show 12 or 57 tools to a normal user by default. Show at most three next moves, written as actions:

- Draft memo
- Check sources
- Map situation
- Build timeline
- Stress-test option

Backend process:
Use `recommendTools()` and `rankMarketplaceToolsForCase()` as hidden scoring engines. Return a normalized `NextMove[]` contract rather than tool cards.

Code to change:

- `src/lib/tools/recommend.ts`
- `src/lib/tools/marketplace/suggestions.ts`
- `src/components/tools/ToolMarketplace.tsx`
- `src/app/app/tools/page.tsx`
- `src/components/ask/AskWorkspacePage.tsx`
- New: `src/lib/assistant/next-moves.ts`

Code to eliminate or demote:

- Default "Canonical tool library" grid in normal workspace.
- User-facing "Visible tools: 57 mapped tools" copy.
- Specialist archive links for non-admin users unless explicitly opened through Advanced.

Verification:

- Static audit: no normal app page renders more than three primary action links above the fold.
- Unit: `NextMove[]` never exceeds three items.
- E2E: normal user sees Ask/Cores/Library/Memo first; admin can still reach archived tools.

### 4. Memo-First Output Pipeline

UX target:
Every substantial answer can become a memo, brief, handoff, or talking points document in one click.

Backend process:
Persist Ask outputs as structured output objects before rendering them into Memo Studio. The saved object should preserve:

- prompt
- capsule id/version
- source receipts
- claim checks
- graph snapshot id
- tool invocations
- draft target

Code to change:

- `src/lib/firebase/memo-service.ts`
- `src/app/api/memos/route.ts`
- `src/components/ask/StreamingResponse.tsx`
- `src/components/writer/hooks/use-writer-context.ts`
- `src/components/writer/extensions/ask-praxis-command.ts`
- `src/lib/memo/export.ts`

Verification:

- Unit: memo export keeps citations and source receipt ids.
- E2E: Ask answer -> Send to Memo Studio -> reload -> memo remains attached to same capsule.
- E2E: DOCX/PDF export includes footnotes or source appendix.

### 5. Trust Meter With Inspectable Evidence

UX target:
One compact trust indicator is visible. Details open only when clicked.

Backend process:
Compute a single `trustPosture` from:

- capsule health
- source coverage
- document coverage
- graph readiness
- claim-check result
- freshness posture
- citation count

Code to change:

- `src/lib/context/context-health.ts`
- `src/lib/knowledge/context-engine.ts`
- `src/app/api/context/check-claim/route.ts`
- `src/components/workbench/context-health-chip.tsx`
- `src/components/app/core-context-strip.tsx`

Verification:

- Unit: trust score degrades with zero sources, stale evidence, or missing Situation Core.
- E2E: clicking the trust meter opens exact evidence/gap reasons.

### 6. Source Picker Inline

UX target:
The Ask box and Memo Studio support `@source`, `@doc`, and `@core` references.

Backend process:
Autocomplete against the active capsule's Source Core and Document Core, not global or demo data.

Code to change:

- `src/components/ask/AskBar.tsx`
- `src/components/sources/source-picker.tsx`
- `src/app/api/sources/route.ts`
- `src/app/api/intelligence/corpus-search/route.ts`
- `src/lib/intelligence/corpus-search.ts`

Verification:

- API test: source search is owner-scoped.
- E2E: `@source` inserts source id into Ask request and retrieval honors it.

### 7. Route Consolidation

UX target:
The normal app should feel like four pages, not a route archive.

Routes to fold or redirect:

- `/app/cases` -> `/app/workbench` or `/app/contexts`.
- `/app/situations` -> `/app/contexts`.
- `/app/situations/new` -> a "Start Situation" flow inside `/app/contexts`.
- `/app/profile` -> `/app/settings/profile`.
- `/app/settings/personas/*` -> `/app/admin?tab=advisors` or admin-only persona routes.
- `/app/settings/system-health` -> `/app/admin?tab=diagnostics`.
- `/app/settings/api-keys` -> `/app/admin?tab=diagnostics` or Admin Settings.
- `/app/tools/archive` and `/app/tools?show_archive=1` -> admin-only.

Code to delete after redirects are proven:

- Large legacy implementation in `src/app/app/cases/page.tsx`.
- Large standalone situation creation page in `src/app/app/situations/new/page.tsx`, after its useful AI-first creation pieces move into Cores.
- Standalone `/app/profile` page, after read-only profile inspection is merged into settings/admin.

Do not delete yet:

- `src/lib/constants/consolidated-tools.ts`; it is still imported by active product, dashboard, tool, contexts, tests, and audit code.
- Marketplace registry files; they still power hidden specialist routing, tests, generated docs, and handler contracts.
- Demo routes; they still support public/demo smoke and copy-from-demo paths.

Verification:

- Static audit: all folded routes either redirect or are admin-only.
- E2E: old URLs resolve cleanly with no broken auth loop.
- Search audit: no sidebar/header/mobile/default page links point to deleted routes.

### 8. Canonical Names Audit

UX target:
Every tool and every core has one canonical user-visible name.

Backend process:
Add a strict naming registry and fail CI when the same route/tool/core has conflicting `label`, `name`, `shortLabel`, `displayName`, or heading strings.

Code to change:

- `src/lib/constants/tool-registry.ts`
- `src/lib/tools/canonical.ts`
- `src/lib/tools/tool-navigation.ts`
- `src/lib/context/core-objects.ts`
- `src/lib/context/demo-core-objects.ts`
- New: `scripts/audit-canonical-names.ts`

Verification:

- `npm run audit:names` fails on duplicate names.
- Snapshot test: primary nav, command palette, and Ask next moves use the same labels.

### 9. Admin Control Room

UX target:
Admins see the deep operational machinery. Normal users do not.

Backend process:
Bring admin-only functions under `/app/admin`:

- Sources/feed status.
- Agent read logs.
- Tool runs.
- Model/cost/latency.
- Feature flags.
- Rate limits.
- Audit invariant runs.
- User core overrides.

Code to change:

- `src/app/app/admin/page.tsx`
- `src/app/app/admin/diagnostics/page.tsx`
- `src/app/app/settings/system-health/page.tsx`
- `src/app/app/settings/api-keys/page.tsx`
- New: `src/app/api/admin/audit-runs/route.ts`
- New: `src/app/api/admin/read-log/route.ts`

Verification:

- API tests: admin endpoints reject non-admin users.
- E2E: normal user cannot access admin archive/tool/settings pages.
- Audit: no internal credit costs appear in normal UI.

### 10. Backend Read / Tool Invocation Ledger

UX target:
Users see only "PRAXIS checked sources" or "PRAXIS ran timeline." Admins can inspect the exact read/tool ledger.

Backend process:
Every Ask or tool action writes a compact event:

- `uid`
- `situationId`
- `capsuleId`
- `threadId`
- `toolId`
- `sourceIds`
- `model`
- `latencyMs`
- `status`
- `costClass`, not internal dollar cost in normal UI
- `createdAt`

Code to change:

- `src/lib/api/save-tool-output.ts`
- `src/app/api/ai/chat/route.ts`
- `src/app/api/tools/marketplace/run/route.ts`
- `src/lib/tools/marketplace/runner.ts`
- New: `src/lib/audit/tool-invocation-ledger.ts`

Verification:

- Unit: failed tool run writes failed ledger event.
- E2E/admin: admin can filter by uid/situation/tool.
- Static audit: no internal credit cost string in user-facing components.

### 11. Deep-Tech Backend Boundary

UX target:
The app remains simple; deterministic heavy lifting becomes stronger.

Backend process:
Keep UI in Next.js, but move deterministic hot paths behind stable adapters:

- text pre-reading
- actor canonicalization
- claim/event extraction
- temporal normalization
- graph delta scoring
- source dedupe
- retrieval reranking

Code to change:

- `src/lib/semantica/context-core-adapter.ts`
- `src/lib/knowledge/context-engine.ts`
- `src/lib/intelligence/corpus-search.ts`
- `src/app/api/ai/research-extract/route.ts`
- Future Rust/service boundary: `semantica-core` or equivalent, called through a versioned adapter.

Verification:

- Golden fixtures for extraction/canonicalization.
- Determinism test: same text -> same canonical actors/events.
- Contract test: adapter output remains backward-compatible.

### 12. Design Rule: Two Actions Per Page

UX target:
Each normal page has one primary action and at most one secondary action.

Code to change:

- `src/components/ask/AskWorkspacePage.tsx`
- `src/app/app/tools/page.tsx`
- `src/components/tools/ToolMarketplace.tsx`
- `src/components/landing/phase8-wow-landing.tsx`
- `src/app/app/dashboard/page.tsx`
- `src/app/app/contexts/page.tsx`

Verification:

- New static audit checks visible button/link text counts for default app routes.
- Playwright screenshot checks desktop/mobile first viewport for Ask, Cores, Library, Memo.

## Specific Code Findings

### A. Grouped navigation is good, but audits had drift

`scripts/audit-mvp-route-shape.ts` still expected sidebar/mobile consumers to import `PRIMARY_NAV`. Current code correctly uses `NAV_GROUPS` so the audit was stale. This audit pass updated the script to require `NAV_GROUPS` in sidebar/mobile and keep `PRIMARY_NAV` derived from `NAV_GROUPS`.

### B. Ask route is powerful but overstuffed

`src/app/api/ai/chat/route.ts` is doing calibration, prompt identity, product explanation, RAG, tool routing, graph snapshot, model selection, streaming, and output persistence in one route. It works, but the simplification wave needs smaller backend units:

- `resolveCapsuleContext()`
- `buildAskPrompt()`
- `selectAskRuntime()`
- `runAskTools()`
- `persistAskTurn()`

### C. Capsule vocabulary is ahead of durable backend

Landing and nav now talk about capsules, but code persists:

- active UI state in `contextStacks`
- retrieval/runtime context in `context-packages`

This is workable short-term, but drag/drop, fork, share, memo handoff, and agent inheritance should not be built until the canonical capsule contract exists.

### D. Normal user still sees too much tool machinery

The tools page still renders 12 canonical tools by default and the Ask workspace shows the total marketplace tool count. This violates the desired product shape. Keep the registry and routing, but show three next moves.

### E. Legacy route mass remains

The repo still has separate route implementations for cases, situations, profile, settings subsections, tools archive, demo, workbench, boardroom, ACH, dashboard, assistant, contexts, canvas, admin, and write. Some are valid advanced surfaces; several should become redirects or admin-only.

## Delete / Archive Queue

Delete only after adding redirects and passing route audits:

1. `src/app/app/cases/page.tsx`
2. `src/app/app/situations/page.tsx`
3. `src/app/app/situations/new/page.tsx`
4. `src/app/app/profile/page.tsx`
5. `src/app/app/tools/archive/page.tsx`, if `/app/tools?show_archive=1` becomes admin-only and route-level protected.

Move behind admin:

1. `src/app/app/settings/personas/page.tsx`
2. `src/app/app/settings/personas/new/page.tsx`
3. `src/app/app/settings/personas/[personaId]/page.tsx`
4. `src/app/app/settings/system-health/page.tsx`
5. `src/app/app/settings/api-keys/page.tsx`
6. `src/app/app/settings/model-preferences/page.tsx`
7. `src/app/app/settings/graph-backend/page.tsx`

Keep but demote:

1. `/app/dashboard`
2. `/app/canvas`
3. `/app/tools`
4. `/app/workbench/[caseId]/ach/*`
5. `/app/workbench/[caseId]/boardroom/*`

Do not delete:

1. `src/lib/constants/consolidated-tools.ts` until active imports are migrated.
2. `src/lib/tools/marketplace/*` until specialist routing is fully hidden but preserved.
3. `src/app/demo/*` until demo-to-user clone, public demo, and smoke tests are replaced.
4. `src/lib/context/demo-core-objects.ts` while demo Situation Cores remain part of tests and onboarding.

## New Audits To Add

1. `audit:three-next-moves`
   - Fails when normal user pages render more than three default next actions.

2. `audit:canonical-names`
   - Fails when tool/core/nav names drift.

3. `audit:capsule-contract`
   - Fails if Ask, memo, tools, and source retrieval do not resolve the same active capsule.

4. `audit:route-consolidation`
   - Fails if folded routes render legacy pages instead of redirecting.

5. `audit:no-normal-user-archive`
   - Fails if non-admin navigation or default pages link to archived/specialist routes.

6. `audit:ask-persistence`
   - Fails if Ask turns with actions do not persist thread/tool/output records.

7. `audit:memo-citation-preservation`
   - Fails if memo export drops source receipt ids.

8. `audit:admin-only-internals`
   - Fails if read logs, model costs, provider internals, API keys, or system health pages are reachable by normal users.

## Recommended Build Order

1. Fix the active route/link inconsistencies and keep `audit:mvp-route-shape` green.
2. Add `capsule-service.ts` and `/api/context/capsules`.
3. Migrate `contextStacks/default` into default capsule compatibility.
4. Update `CoreContextStrip` to read/write capsules.
5. Update Ask route to resolve capsule first.
6. Replace tool grids in default Ask/Tools/Workbench surfaces with max-three next moves.
7. Persist Ask threads and tool chips.
8. Add memo handoff from Ask.
9. Consolidate routes with redirects.
10. Move archive/settings internals behind admin.
11. Add canonical-name and route-consolidation audits.
12. Run full gate, graphify update, and browser smoke on desktop/mobile.

## Full Verification Gate For The Wave

Run before push/deploy:

```bash
npm run typecheck
npm run lint
npm run build
npm run audit:repo-shape
npm run audit:mvp-route-shape
npm run audit:architecture-reference
npm run audit:tool-contracts
npm run audit:deep-preship
npm run audit:gate
npx vitest run
npm run smoke:app-usability
npm run smoke:core-flows
npm run smoke:app-core-stack
graphify update .
```

Manual/browser checks:

- Desktop `/app/assistant`: one Ask surface, capsule visible, max three next moves.
- Mobile `/app/assistant`: no text overlap, bottom nav has Ask/Cores/Library/Memo.
- `/app/contexts`: create/select a capsule or Situation Core without visiting legacy situations pages.
- `/app/write`: Ask answer can insert cited output.
- Normal user `/app/tools?show_archive=1`: blocked or redirected.
- Admin `/app/admin`: archive/settings/system health visible only after admin verification.
