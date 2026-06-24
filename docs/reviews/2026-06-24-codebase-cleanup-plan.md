# PRAXIS codebase cleanup plan

Date: 2026-06-24

Scope: read-only diagnostic for reducing PRAXIS to the canonical surface: public Home, signed-in Home, Capsule Library, Learn, Pricing, required auth/onboarding/settings, capsule workbench/inspection, and AgentRun deep links.

This plan is intentionally aggressive, but it does not mark a route or module as removable without current evidence. It preserves the visible contract from `CLAUDE.md`: public Home -> signed-in Home + Capsules, with legacy URLs redirecting into the cockpit instead of becoming new product surfaces.

## Method and limitations

- Read `docs/CODEX_SESSION_BRIEF.md`, `CLAUDE.md`, `docs/product/PRAXIS_CANONICAL_APP_STRUCTURE.md`, `docs/PRAXIS_CODEX_PLAYBOOK.md`, `src/lib/navigation/primary-nav.ts`, `src/lib/navigation/v3-surface-classification.ts`, `src/proxy.ts`, and the route/audit scripts before classifying surfaces.
- Read `graphify-out/GRAPH_REPORT.md`. It was built from commit `3232b437`, matching current `HEAD`, so the graph was treated as current for this diagnostic.
- Used explorer, repo_cartographer, and reviewer agents for independent route inventory, source-of-truth mapping, and risk review.
- Used Serena for symbol-reference checks on representative dead-code candidates. `CapsuleToolbar` and `AiFirstCaseCreation` both returned no referencing symbols.
- `refactor_tool` was requested but was not exposed in this Codex tool session. The fallback was `rg`, repo audits, TypeScript route inventory scripts, and Serena symbol checks. A `tsc --noUnusedLocals --noUnusedParameters` probe timed out in the current dirty checkout, so TypeScript unused diagnostics are not treated as complete evidence here.
- This plan does not delete anything. The only allowed change for this task is this document.

## Executive summary

| Inventory | Count | Verdict summary |
| --- | ---: | --- |
| Non-API `src/app` surface files | 25 | 17 KEEP, 5 CONSOLIDATE, 3 REDIRECT-ONLY, 0 REMOVE |
| User-routable pages | 20 | 13 KEEP, 4 CONSOLIDATE, 3 REDIRECT-ONLY, 0 REMOVE |
| Layouts | 5 | 4 KEEP, 1 CONSOLIDATE |
| API route handlers under `src/app/api/**` | 229 | 122 canonical, 68 admin/internal, 39 compatibility by category |
| Route cleanup disposition from current audit | 229 | 75 keep, 37 compatibility, 117 do-not-touch, 0 delete/archive candidates |

Top simplification clusters:

1. Old landing sections superseded by `PraxisChatFirstShell` and `PraxisMarketingHome`.
2. Residual `/app/contexts` UI and hrefs after the route tree was removed and proxy-backed.
3. Orphan onboarding experiment `AiFirstCaseCreation`, which calls a nonexistent `/api/cases/scaffold` route.
4. Medium-confidence standalone wrappers/editors not reached from canonical surfaces: `LazyMemoDesk`, `CitationEditor`, and `SuggestedPrompts`.
5. Direct `/api/ai/*` tool endpoints that are compatibility-heavy and should converge behind AgentRun/capability contracts later, not be deleted first.

Biggest simplification win: remove the mental model of many separate signed-in work surfaces. Rewrite old `contexts`, `repository`, `recent-work`, builder, and run affordances into `/app` and `/app/capsules` panels, then delete orphan UI left behind by removed routes.

## Full route and page inventory

### Layouts

| Route scope | File | Purpose | Canonical surface? | Last-meaningful-use signals | Verdict | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| all routes | `src/app/layout.tsx` | Root metadata, OG, analytics, global shell. | Yes | Root layout, SEO analytics tests, app metadata. | KEEP | Do not duplicate analytics or metadata elsewhere. |
| landing route group | `src/app/(landing)/layout.tsx` | Fragment wrapper for landing pages. | Indirect | No behavior beyond wrapping children. | CONSOLIDATE | Safe to remove only if route-group behavior stays unchanged. |
| auth route group | `src/app/(auth)/layout.tsx` | Auth provider wrapper for login/callback. | Yes | `/login`, `/login/callback` depend on it. | KEEP | Required auth shell. |
| onboarding | `src/app/onboarding/layout.tsx` | Auth-scoped onboarding chrome. | Yes | Proxy and post-login flows force incomplete users to `/onboarding`. | KEEP | Required onboarding shell. |
| signed-in app | `src/app/app/layout.tsx` | Auth provider plus `AppShell` for protected app. | Yes | Primary private shell for `/app`, `/app/capsules`, settings, conversations. | KEEP | Keep `noindex` private app behavior. |

### Public pages

| Path | File | Purpose | Canonical surface? | Last-meaningful-use signals | Verdict | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `/` | `src/app/page.tsx` | Public home. | Yes | Renders `PraxisMarketingHome`; marketing-home contract test. | KEEP | Core pre-login surface. |
| `/learn` | `src/app/(landing)/learn/page.tsx` | Public explainer. | Yes | Public nav includes Learn. | KEEP | Keep as one of the few public education pages. |
| `/guide` | `src/app/guide/page.tsx` | Practical guide. | Yes | Public nav includes Guide; `/help` redirects here. | KEEP | Good consolidation target for help content. |
| `/pricing` | `src/app/pricing/page.tsx` | Pricing and billing trust page. | Yes | Public nav includes Pricing. | KEEP | Canonical pricing surface. |
| `/release-notes` | `src/app/release-notes/page.tsx` | Public release record. | Yes | Public nav includes Release notes; `/changelog` redirects here. | KEEP | Canonical changelog destination. |
| `/legal/[slug]` | `src/app/legal/[slug]/page.tsx` | Legal footer pages. | Necessary other | Legal slugs and footer references. | KEEP | Required public trust/legal surface. |
| `/help` | `src/app/help/page.tsx` | Alias to guide. | No | File is a direct redirect to `/guide`; footer still links it. | REDIRECT-ONLY | Remove normal links after footer/search/sitemap callers are migrated. |
| `/changelog` | `src/app/changelog/page.tsx` | Alias to release notes. | No | File is a direct redirect to `/release-notes`; footer and sitemap still reference it. | REDIRECT-ONLY | Keep redirect for compatibility, but stop advertising it. |

### Auth and onboarding pages

| Path | File | Purpose | Canonical surface? | Last-meaningful-use signals | Verdict | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `/login` | `src/app/(auth)/login/page.tsx` | Sign in, sign up, reset, redirect intent. | Necessary other | Public shell links; proxy redirects unauthenticated private routes here. | KEEP | Do not collapse into public home unless auth tests are rewritten. |
| `/login/callback` | `src/app/(auth)/login/callback/page.tsx` | Auth callback and post-login redirect. | Necessary other | Uses `resolvePostLoginRedirect`; auth tests cover redirect behavior. | KEEP | Deep auth contract. |
| `/onboarding` | `src/app/onboarding/page.tsx` | Analyst profile onboarding. | Necessary other | Proxy and post-login gate incomplete users here; onboarding APIs in use. | KEEP | High-risk to remove or fold. |

### Signed-in pages and deep links

| Path | File | Purpose | Canonical surface? | Last-meaningful-use signals | Verdict | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| `/app` | `src/app/app/page.tsx` | Signed-in Ask cockpit. | Yes | Primary nav Home; authenticated e2e route. | KEEP | Center the agentic workflow here. |
| `/app/capsules` | `src/app/app/capsules/page.tsx` | Capsule Library/workbench. | Yes | Primary nav Capsules; v3 surface classification marks Library loop. | KEEP | Center capsule context here. |
| `/app/settings` | `src/app/app/settings/page.tsx` | Account, billing, preferences, runtime/system settings. | Necessary other | Primary nav Settings; tests forbid proxying it to `/app`; post-login preserves `?tab=system`. | KEEP | Keep as required support surface. |
| `/app/conversations/[conversationId]` | `src/app/app/conversations/[conversationId]/page.tsx` | Saved conversation deep link in shared workbench. | Yes, deep link | Created-work service and e2e flows point here. | KEEP | This is a deep link into the cockpit, not a separate nav surface. |
| `/app/capsules/builder` | `src/app/app/capsules/builder/page.tsx` | Capsule builder/studio. | Not as standalone | v3 classification marks Studio as FOLD_IN; CTAs still point here. | CONSOLIDATE | Fold into `/app/capsules` builder panel; keep redirect until callers migrate. |
| `/app/boardroom` | `src/app/app/boardroom/page.tsx` | Boardroom lab/workspace. | Not core | Still primary nav and e2e-tested; v3 classification marks LABS. | CONSOLIDATE | Demote from primary nav after tests and entry points are updated. |
| `/app/recent-work` | `src/app/app/recent-work/page.tsx` | Recent policy work/history. | Not core | Primary nav includes it; v3 classification marks FOLD_IN. | CONSOLIDATE | Fold into `/app` receipts/history or `/app/capsules` activity. |
| `/app/repository` | `src/app/app/repository/page.tsx` | Repository compatibility alias. | No | Direct redirect to `/app/capsules?lane=repository`; tests call it compatibility. | REDIRECT-ONLY | Stop linking it normally; keep redirect for old links. |
| `/agents/[runId]` | `src/app/agents/[runId]/page.tsx` | AgentRun focused workbench deep link. | Deep link only | Created work and workbench use it; audits preserve it; v3 classification says FOLD_IN. | CONSOLIDATE | Preserve route. Do not remove until AgentRun links are fully in cockpit. |

## API route inventory

The repo has 229 API route handlers under `src/app/api/**`. Current static inventory classifies them as 122 canonical, 68 admin/internal, and 39 compatibility. The cleanup audit currently reports zero delete/archive candidates.

| API group | Route handlers | Cleanup stance |
| --- | ---: | --- |
| `ai` | 61 | Many are compatibility-heavy. Do not delete before direct callers, tests, and calibration wrappers are verified. |
| `context` | 24 | Core capsule/context boundary. Keep unless a route is proven compatibility-only. |
| `situations` | 12 | Investigate later as possible legacy domain surface; not enough evidence for removal here. |
| `graph` | 11 | Derived/advisory graph boundary. Treat as non-canonical storage, but not dead. |
| `health` | 9 | Operational health and canary surface. Keep unless redundant probes are proven unused. |
| `agents` | 8 | Core AgentRun proof rail. Keep. |
| `knowledge` | 7 | Likely capsule/context support. Investigate per caller before changes. |
| `capsules`, `cron`, `memos`, `onboarding` | 6 each | Core product/runtime or operational flows. Keep. |
| `documents`, `settings` | 5 each | Required document/settings support. Keep. |
| `auth` | 4 | Auth support. Keep. |
| `billing`, `conversations`, `memory`, `profile`, `reports`, `tools` | 3 each | Mixed core/support; inspect per route before any deletion. |
| `backend`, `boardroom`, `export`, `output-capsules`, `paths`, `research`, `usage`, `work-products`, `workspace` | 2 each | Mixed support and compatibility. Keep until caller graph is explicit. |
| Single-route groups | 24 | `account`, `admin`, `annotations`, `app`, `artifacts`, `assistant`, `capabilities`, `cores`, `created-work`, `credits`, `data`, `entities`, `events`, `methods`, `notifications`, `preferences`, `promo`, `sources`, `telemetry`, `tool-data`, `tool-feedback`, `tool-status`, `waitlist` | Review one by one; do not bulk delete. |

Compatibility API routes currently identified by static inventory:

`/api/ai/actor-profiles`, `/api/ai/advisory`, `/api/ai/argus`, `/api/ai/auto-briefing`, `/api/ai/auto-structure`, `/api/ai/brainstorming-table`, `/api/ai/brief-builder`, `/api/ai/briefing-generate`, `/api/ai/deep-research`, `/api/ai/discover-sources`, `/api/ai/economic-impact`, `/api/ai/electoral-risk`, `/api/ai/external-actors`, `/api/ai/extract`, `/api/ai/game-theory`, `/api/ai/geospatial`, `/api/ai/grounded-search`, `/api/ai/human-rights`, `/api/ai/humanitarian`, `/api/ai/info-environment`, `/api/ai/legal-tracker`, `/api/ai/media-analyze`, `/api/ai/media-roundup`, `/api/ai/policy-memo`, `/api/ai/power-map`, `/api/ai/red-team-review`, `/api/ai/report`, `/api/ai/research-extract`, `/api/ai/sanctions-scan`, `/api/ai/scenario`, `/api/ai/source-scout`, `/api/ai/talking-points`, `/api/ai/un-toolkit`, `/api/backend/[...path]`, `/api/context/capsules/import/dialectica`, `/api/health/features`, `/api/memory/[...slug]`, `/api/tool-data`, `/api/work-products/export-docx`.

These are not automatic delete candidates. Several compatibility AI endpoints still appear in tool registries, tests, or runtime flows. They belong in a later consolidation wave.

## Dead and unused code candidates

Confidence means confidence that the symbol/file is not part of the current canonical runtime, not permission to delete without a slice-specific test pass.

| Candidate | Evidence | Confidence | Planned action |
| --- | --- | --- | --- |
| `src/components/cores/CapsuleToolbar.tsx:15` | File comment says it is for `/app/contexts`; `src/app/contexts` is intentionally absent; Serena found no referencing symbols; `rg` shows only definition/docs. | High | Delete after confirming no dynamic import. Rehome any still-needed action into `/app/capsules`. |
| `src/components/onboarding/ai-first-case-creation/AiFirstCaseCreation.tsx:18` | Serena found no referencing symbols; `rg` shows only definition; component calls `/api/cases/scaffold`, and no `/api/cases` route exists. | High | Delete component and any orphan test/docs reference in first cleanup slice. |
| Landing section files: `capsule-anatomy-honeycomb.tsx:12`, `core-capsule-hero.tsx:63`, `output-catalog-carousel.tsx:93`, `connector-strip.tsx:47`, `persona-cards.tsx:65` | `src/components/marketing/praxis-marketing-home.tsx` now delegates to `PraxisChatFirstShell`; `rg` shows definitions plus ownership docs, not runtime imports. | High | Delete as a group after confirming no MDX/static import. Update ownership map if needed. |
| `src/components/assistant/suggested-prompts.tsx:131` | Old assistant UI. `rg` shows definition; no runtime import surfaced in scan. | Medium-high | Delete or fold prompt data into Ask suggestions after a focused caller scan. |
| `src/components/memo/lazy-memo-desk.tsx:6` | Exports `LazyMemoDesk`; no runtime import surfaced. `MemoDesk` itself remains product-relevant. | Medium | Delete wrapper only if direct import scan stays empty. Do not delete `MemoDesk`. |
| `src/components/drafting/citation-editor.tsx:18` | No runtime import surfaced; tests may be the only consumer. | Medium | Move into workbench if still planned, otherwise delete with tests. |
| Residual `/app/contexts` hrefs in `AskWorkspacePage`, `AskStreamPanel`, memo/cores components | `rg` finds many old links into `/app/contexts`, which proxy no longer hosts as a real route. | Medium | Rewrite links to `/app/capsules`, `/app/capsules?lane=repository`, or cockpit query params before deleting old components. |
| Direct compatibility AI route family | Static inventory marks 39 API routes compatibility, mostly under `/api/ai/*`. | Medium | Consolidate behind AgentRun/capability contracts only after caller graph and tests prove no direct use. |

## Legacy clusters

### Removed route sprawl now owned by proxy

`src/proxy.ts` owns legacy redirects for old app routes including dashboard, desk, cockpit, contexts, actors, sources, research, graph, policy memo, dossier, monitoring, tools, write, settings subpages, and `/app/agents/[runId]`. `scripts/audit-route-consolidation.ts` asserts those route files stay absent because proxy owns the legacy URL.

Verdict: keep compatibility redirects. Do not recreate old route trees.

### `/app/contexts` residue

The real route tree is gone, but several components still contain `/app/contexts` hrefs or comments. The highest-confidence orphan is `CapsuleToolbar`; broader rewrites are needed in Ask, Memo, and cores components before removing all compatibility assumptions.

Verdict: consolidate into `/app/capsules` and library lanes.

### Boardroom and advanced labs

`/app/boardroom` is live, linked, and tested, but `v3-surface-classification.ts` marks it `LABS`. It should not compete with Home and Capsules as a primary route.

Verdict: demote from primary navigation only after tests and entry points are updated.

### Recent work and builder as standalone surfaces

`/app/recent-work` and `/app/capsules/builder` are real pages, but the repo classification marks both as fold-in surfaces. They belong inside cockpit activity and Capsule Library creation flows.

Verdict: consolidate; keep redirects during migration.

### Public aliases

`/help` and `/changelog` are direct redirects. They are useful compatibility URLs but should not be first-class footer/search/sitemap destinations once `/guide` and `/release-notes` are canonical.

Verdict: redirect-only.

### Direct AI tools

The old `/api/ai/*` family contains many named analytical tools. Some are compatibility wrappers, but several still feed tool registries, e2e fixtures, or AgentRun paths. Deleting this family first would create high runtime risk.

Verdict: later consolidation after a direct caller map.

## Safe removal plan

### Slice 0: freeze the current contract

Files to change: none except the planning doc.

Actions:

- Keep `src/proxy.ts`, auth, onboarding, settings, and AgentRun route files unchanged.
- Record current counts: 25 non-API surface files, 229 API handlers, zero delete/archive candidates in the cleanup audit.
- Fix or explicitly account for the known baseline drift: `tests/unit/lib/agent-runtime/runtime-proof.test.ts` expects `Research Memo Agent`, while `src/lib/product/policy-agents.ts` now labels `research-memo` as `Writer / Drafter`.

Validation:

- `npx tsx scripts/audit-route-consolidation.ts`
- `npx tsx scripts/audit-agent-runtime-proof.ts`
- `npx tsx scripts/audit-repo-shape.ts`
- `npx tsx scripts/audit-architecture-reference.ts`
- `node scripts/audit-ai-routes.mjs`

Risk: low. This is the guardrail slice.

### Slice 1: delete high-confidence orphan UI

Delete candidates:

- `src/components/cores/CapsuleToolbar.tsx`
- `src/components/onboarding/ai-first-case-creation/AiFirstCaseCreation.tsx`
- `src/components/landing/capsule-anatomy-honeycomb.tsx`
- `src/components/landing/core-capsule-hero.tsx`
- `src/components/landing/output-catalog-carousel.tsx`
- `src/components/landing/connector-strip.tsx`
- `src/components/landing/persona-cards.tsx`

References to update:

- Remove or update tests/docs that only assert these retired components.
- Re-run `rg` for each component name before deletion.
- If a public page unexpectedly imports a landing section, move the content into `/learn` or delete the import before removing the file.

Redirects to preserve: none.

Validation:

- `npx tsc --noEmit`
- Focused unit tests for marketing home, onboarding, and route shape.
- `npm run audit:repo-shape`

Risk: low to medium. The only likely break is stale tests or docs.

### Slice 2: make redirect-only pages invisible in normal navigation

Files likely to change:

- `src/lib/navigation/primary-nav.ts`
- `src/app/sitemap.ts`
- Search/footer tests that still expect `/help` or `/changelog`.

Keep files:

- `src/app/help/page.tsx`
- `src/app/changelog/page.tsx`

References to update:

- Footer `Help` should point to `/guide`.
- Footer `Changelog` should point to `/release-notes`.
- Sitemap should prefer `/release-notes` over `/changelog` unless SEO compatibility requires both.

Redirects to preserve:

- `/help` -> `/guide`
- `/changelog` -> `/release-notes`

Validation:

- `npx tsx scripts/audit-public-surface.ts`
- `npx vitest run tests/unit/seo-analytics-contract.test.ts`
- Any footer/nav contract tests.

Risk: low. Public SEO/audit expectations make this stricter than it looks.

### Slice 3: rewrite `/app/contexts` and `/app/repository` affordances into Capsules

Files likely to change:

- `src/components/ask/AskWorkspacePage.tsx`
- `src/components/ask/AskStreamPanel.tsx`
- `src/components/app/capsule-strip-header.tsx`
- `src/components/memo/memo-desk.tsx`
- `src/components/cores/ShareCapsuleButton.tsx`
- `src/components/cores/ContextBuilderRoom.tsx`
- `src/components/cores/CapsuleLineageTree.tsx`
- `src/components/assistant/response-actions.tsx`
- `src/app/app/repository/page.tsx` only if redirect target changes.

References to update:

- Replace old `/app/contexts` links with `/app/capsules`, `/app/capsules?lane=repository`, or a cockpit query param.
- Keep `/app/repository` as redirect-only until all tests and external links are migrated.

Redirects to preserve:

- Existing proxy aliases for old `/contexts`, `/methods`, `/ontologies`, `/users`, and legacy `/app/*`.
- `/app/repository` -> `/app/capsules?lane=repository`.

Validation:

- `npx tsx scripts/audit-route-consolidation.ts`
- `npx vitest run tests/unit/app/capsule-factory-route-consolidation.test.ts tests/unit/lib/search/federated-app-search.test.ts`
- Authenticated smoke covering `/app/capsules` and `/app/repository`.

Risk: medium. Many links are old, but some still provide important capsule share and source-review affordances.

### Slice 4: fold Recent Work into the cockpit

Delete or redirect candidates:

- `src/app/app/recent-work/page.tsx` after it becomes redirect-only or a panel entry.

References to update:

- Remove `Recent work` from primary workspace nav.
- Add activity/history entry inside `/app` or `/app/capsules`.
- Update `AppShell` active-route logic and nav tests.

Redirects to preserve:

- `/app/recent-work` should redirect to `/app` or `/app/capsules?panel=recent-work` until old links age out.

Validation:

- `npx vitest run tests/unit/lib/navigation/v3-surface-classification.test.ts tests/unit/components/app-shell-search-contract.test.ts`
- `npx tsx scripts/audit-mvp-route-shape.ts`
- Authenticated e2e smoke.

Risk: medium. This touches visible navigation.

### Slice 5: fold Capsule Builder into the Capsule Library

Delete or redirect candidates:

- `src/app/app/capsules/builder/page.tsx` only after the builder is reachable as a `/app/capsules` panel/dialog.

References to update:

- Public/private CTAs that currently target `/app/capsules/builder`.
- Capsule Library tests and any builder tests.

Redirects to preserve:

- `/app/capsules/builder` -> `/app/capsules?panel=builder` or equivalent stable query.

Validation:

- Capsule workbench unit tests.
- Authenticated e2e path for capsule creation.
- `npx tsx scripts/audit-route-consolidation.ts`

Risk: medium. Builder is a canonical capability, just not a standalone top-level page.

### Slice 6: demote Boardroom to Labs

Delete candidates: none in the first pass.

References to update:

- Remove `/app/boardroom` from primary nav if product accepts Labs demotion.
- Add a lab entry inside `/app` or `/app/capsules`.
- Update e2e tests that currently treat `/app/boardroom` as a core protected route.

Redirects to preserve:

- Keep `/app/boardroom` route until tests, docs, and deep links converge.

Validation:

- `npx vitest run tests/e2e/boardroom.spec.ts tests/e2e/boardroom-workspace.spec.ts tests/e2e/authenticated-app-post-login.spec.ts`
- `npx vitest run tests/unit/lib/navigation/v3-surface-classification.test.ts`

Risk: high. It is conceptually non-core, but actively tested and linked.

### Slice 7: demote `/agents/[runId]` to deep-link only

Delete candidates: none initially.

References to update:

- Ensure all AgentRun creation flows surface the run inside `/app` or `/app/capsules` first.
- Keep copied/opened run links valid at `/agents/[runId]`.
- Keep `/app/agents/[runId]` proxy redirect.

Redirects to preserve:

- `/agents/[runId]`
- `/app/agents/[runId]` -> `/agents/[runId]`

Validation:

- `npx tsx scripts/audit-agent-runtime-proof.ts`
- `npx vitest run tests/unit/app/api/ai/chat-agent-run-thread-ref-contract.test.ts tests/unit/app/api/agent-run-approval-route.test.ts tests/unit/lib/agent-runtime/runtime-proof.test.ts`
- AgentRun e2e specs after baseline label drift is handled.

Risk: high. This is a deep-link contract and core runtime proof surface.

### Slice 8: consolidate compatibility AI routes

Delete candidates:

- None until a per-route caller map proves no direct usage.

References to update:

- Tool registries and UI action launchers should call AgentRun/capability contracts rather than direct `/api/ai/*` routes.
- Keep calibration wrappers on any surviving AI route.
- Move compatibility endpoints one family at a time: source scouting, memo/report drafting, scenario/red-team, media/geospatial/humanitarian, then deprecated research wrappers.

Redirects to preserve: API compatibility should use stable wrappers or 410/deprecation responses only after clients are migrated.

Validation:

- `node scripts/audit-ai-routes.mjs`
- Focused tests for each affected AI route family.
- `npm run audit:gate`

Risk: high. The route inventory labels many routes compatibility, but that is not enough evidence for deletion.

## Risk register

| Risk | What could break | Mitigation |
| --- | --- | --- |
| Proxy compatibility layer removed too early | Legacy `/app/*`, `/contexts/:slug`, `/methods/:id`, `/ontologies/:id`, `/users/:id`, and `/app/agents/:runId` URLs. | Keep `src/proxy.ts` untouched in early slices. Run `audit-route-consolidation`. |
| `/agents/[runId]` mistaken for dead surface | AgentRun deep links, same-thread proof, created-work links, stream/dispatch routes. | Treat as deep link, not removal candidate. Run `audit-agent-runtime-proof` and AgentRun e2e. |
| Settings collapsed into `/app` | Account/billing/preferences/system tabs, runtime doctor, authenticated smoke. | Keep `/app/settings`; only simplify contents later. |
| Auth/onboarding cleanup breaks protected route gate | Login redirects, onboarding incomplete gate, skip flow. | Do not touch auth/security files in cleanup slices unless explicitly scoped. Run proxy/onboarding tests. |
| Nav cleanup hides live routes without replacements | `/app/recent-work`, `/app/boardroom`, repository lane, settings, conversations. | Remove nav only after new cockpit/library entry point exists. |
| Public SEO cleanup changes indexed URLs | Sitemap, robots, analytics, canonical public pages. | Preserve redirects and run `audit-public-surface` plus SEO tests. |
| API route deletion bypasses calibration or direct clients | AI route security/calibration, tool registries, old clients. | Consolidate per route family with `audit-ai-routes` and focused tests. |
| Repo-shape audits fail after docs/scripts cleanup | `audit:repo-shape`, `audit:architecture-reference`, graphify files, handoff docs. | Treat docs cleanup as code-adjacent; run repo and architecture audits. |
| Existing dirty baseline masks cleanup failures | Pre-existing worktree changes and known runtime-proof label drift. | Capture baseline before deletion slices; fix or quarantine unrelated failures before attributing them to cleanup. |

## Required validation by checkpoint

Minimum local gate after each deletion/consolidation slice:

```bash
npx tsc --noEmit
npm run lint
npm run audit:repo-shape
npm run audit:gate
npm run audit:architecture-reference
npm run audit:gcp
node scripts/audit-ai-routes.mjs
npx vitest run
```

Focused additions by slice:

- Route compatibility: `npx tsx scripts/audit-route-consolidation.ts`
- MVP shape: `npx tsx scripts/audit-mvp-route-shape.ts`
- AgentRun proof: `npx tsx scripts/audit-agent-runtime-proof.ts`
- Public SEO: `npx tsx scripts/audit-public-surface.ts`
- Settings/auth/onboarding: focused unit and e2e tests named in the slice sections.

Before any push or deploy, fetch first and preserve newer `main` history. Commit state, push state, deploy state, and live verification remain separate checkpoints.
