# PRAXIS chat-first experience plan — 2026-09-30

Status: implementation and final local validation complete; authorized publication and real-service acceptance in progress. This plan is a reviewable contract and checklist, not production acceptance.

## Authorized outcome and preserved baseline

Giulio requested extensive coordinated work on the UX, graphics, structure and technical strength of `praxis.tacitus.me`, followed by publication. The primary experience is chat with PRAXIS, with simple capsule attachment, creation, library and compelling inspection. Keep necessary depth available through explicit details rather than requiring configuration before a useful question.

TACITUS remains an independent experimental project operated by Giulio Catanzariti, with no incorporated TACITUS entity. Describe demonstrated capabilities positively, preserve human review and mandatory rights, and distinguish experimental access from unavailable commercial services.

Working copy: `C:\Users\giuli\output\praxis-chat-first`, branch `improve/praxis-chat-first`, based on `6ae479b9ba36bc335448f29e43007439f8eefbc8` plus the captured dirty implementation from `C:\Users\giuli\tacitus-products\praxis`. The earlier 80-item improvement wave is preserved baseline work, including auth, ingestion, review, execution and allowance changes. Its implementation ledger and previous production acceptance remain separate evidence. This UX plan does not claim those recommendations complete or deployed. Preserve subsequent concurrent main-checkout changes; reconcile before release.

## File ownership

All agents share the isolated working copy. Do not revert others' changes. Coordinate before touching another owner's file.

| Owner | Exclusive responsibility |
| --- | --- |
| `chat_shell_build` | App shell/chat/navigation: `praxis-chat-first-shell.tsx`, `praxis-chat.tsx`, `ask-context-bar.tsx`, `app-shell.tsx`, `app-sidebar.tsx`, `mobile-bottom-nav.tsx`, `header.tsx`, `primary-nav.ts`, `/app` page; `globals.css`; focused tests. |
| `auth_library_build` | Login/onboarding/account settings; `/app/capsules` and builder pages; `CapsuleLibrary.tsx`, `CapsuleLibraryCard.tsx`, `CapsuleBuilderWizard.tsx`, `CapsuleLivePreview.tsx`, `cores/CapsuleListPicker.tsx`; focused tests. |
| `praxis_ux_audit` | `tasklet-praxis-workbench.tsx` exclusively; graph/why panels, workbench/agent view, sections, advanced drawer and new inspector components; focused tests. Coordinate memo handover integration with `context_handover`. |
| `context_handover` | Memo handover API, pure `memo/handover-package` helper, related tests and context-handover research document. GET preview performs no writes; POST requires the preview hash; legacy/unreviewed input receives 409. |
| `praxis_inventory` | This plan only; read-only route, validation and release cartography. |
| Root | Integration, legal/privacy/billing APIs, shared evidence, credentials, review, release and deployed acceptance. |

No agent changes auth server/session libraries without root coordination. Root owns integration of the separate website pricing/legal copy. Source CSS/token changes belong to one owner; other agents request shared styling through that owner.

## Simple route and journey contract

| User task | Existing destination and expected behavior |
| --- | --- |
| Ask | `/app`: main composer, optional visible attachments, concise results and inspectable evidence. A quick question works without a capsule. |
| Find reusable context | `/app/capsules`: a single library with search, readable state, loading/error/empty recovery and New capsule. Advanced source/factory work opens deliberately. |
| Build context | `/app/capsules/builder`: Purpose → Material → Review and save. Advanced/package settings stay optional. Save and use attaches the current saved snapshot. |
| Inspect | `/app/capsules?starter=<id>&lane=inspect`: concise capsule overview, meaningful graph, exact supporting evidence, review state and next action. Accessible close returns to the originating task. |
| Reopen writing/chat | `/app?memoId=<id>`, `/app?panel=memo`, `/app/conversations/<id>` and `/app/recent-work`: preserve saved work and conversation identity; expose through chat history or secondary actions. |
| Source work | `/app/capsules?lane=repository`: existing owner-scoped material/source workflow; `/app/repository` remains its compatibility redirect. |
| Account/help/depth | `/app/settings`, `/guide`, `/help`; existing `/app/boardroom` and `/agents/<runId>` remain secondary tools/deep links. |
| Sign in | `/login` and `/login/callback`: clear Google/email entry, signup/recovery, understandable failure and preserved local return target. Onboarding can be completed or skipped without losing the intended work. |

Primary navigation is Chat and Capsules. New capsule is a contextual action. Saved work, Boardroom, settings and runtime detail remain discoverable secondary destinations. Preserve existing deep links and legacy redirects in `proxy.ts`; do not resurrect obsolete dashboards or add a parallel agents app. Builder and focused inspector/run routes should use consistent shell language.

## Power beneath the simple surface

- Firestore capsules, active stacks and current document/chunk reads remain canonical; Storage retains originals. Cloud SQL owns durable runs, tool calls and approvals. Derived graphs and advisory memory do not silently become authoritative.
- Attachment state preserves owner, capsule identity/version, primary/reference roles and source/document lineage. Promoting one capsule retains the others. Hydration, pending save and failed handoff are visible and cannot silently send the wrong context.
- Purpose/instructions, original evidence, actor claims, analysis, gaps and permissions stay distinct. Source text cannot grant tool permissions. Saved structure or a graph does not establish factual accuracy.
- Inspection shows actual capsule data with readable selected relationships, source/claim detail and review posture. Provide keyboard/touch alternatives to canvas interaction, reduced motion, focus trapping/return-focus and scroll containment.
- Handover preview binds the reviewed saved memo and context version to source/reviewer lineage, limitations and allowed uses. Generation requires an unchanged preview; stale or unreviewed input fails closed. Portable output is a reviewable handover, not silently published canonical context or a claim of universal interoperability.
- Preserve current ingestion limits, pagination, retry/error distinctions, source review and finite funded allowance. Existing commercial/provider/quality gates remain explicit.

## Acceptance and evidence gates

| Level | Required evidence |
| --- | --- |
| Source/local | Focused behavior tests, scoped diff/lint review, integrated production build/typecheck and mandatory audit gate. Preserve baseline functionality and document any audit expecting obsolete presentation. |
| Rendered local | Desktop/mobile at 320, 390, 768, 1024 and 1440px; keyboard/focus/touch journeys; contrast, overflow, loading/empty/error/retry, long titles, unsaved changes and return navigation. Screenshots substantiate appearance, not persistence/provider execution. |
| Authenticated UI | Actual disposable-account login, logout and blocked private-route access; intended return target; owner isolation. Record mocks and skipped tests. Existing golden-path/Ask-agent browser suites mock some responses. |
| Real persisted capability | TXT/PDF/DOCX → original extraction → applied/rejected decisions → save/reopen → attach → later Ask and conversation reload. Check source-dependent facts and versions. Reviewed memo → handover preview → matching generation; stale-edit and wrong-owner rejection. |
| Published release | Reviewed clean commit, latest remote reconciled, exact deployed commit/revision, protected-route behavior and the preceding journeys against that release. Private synthetic inputs only. Health checks do not prove capsule correctness or analytical quality. |

Do not infer production completion from baseline receipts, code, mocks, configured provider choices or a successful build. Fresh signup/recovery/two-account switching, billing, erasure, OCR/capacity and analytical quality require their own evidence. Root manages real credentials, provider use and publication; agents do not share a private production account.

## Verified command map

Run commands from the isolated worktree after owner changes converge. No commands below have been executed by this plan's author.

```powershell
npm run lint
npm run audit:gate
npx vitest run --maxWorkers=2
npm audit --omit=dev
graphify update .
```

`audit:gate` already runs typecheck, production build, routes, capsules, agents, architecture (including repo shape/reference), public/product surfaces, runtime (including GCP) and simplification sequentially. Avoid a competing redundant build. The separate `node scripts/audit-ai-routes.mjs` is already part of its routes group. Full lint warnings are tracked debt; new errors or regressions require repair. Graphify output and generated audit reports need deliberate release inclusion/exclusion.

Local browser fixtures require a separately started server and loopback base URL:

```powershell
$env:PLAYWRIGHT_BASE_URL = 'http://127.0.0.1:3211'
npx playwright test tests/e2e/user-readiness-regressions.spec.ts --workers=1
npx playwright test tests/e2e/public-pages.spec.ts tests/e2e/mobile-landing.spec.ts --workers=1
```

For a root-managed disposable Firebase canary, privately provide `TEST_FIREBASE_EMAIL`/`TEST_FIREBASE_PASSWORD` (or helper-supported `PRAXIS_CANARY_EMAIL`/`PRAXIS_CANARY_PASSWORD`), then:

```powershell
$env:REQUIRE_AUTH_GOLDEN_PATH = '1'
npx playwright test tests/e2e/onboarding.spec.ts tests/e2e/golden-path.spec.ts tests/e2e/authenticated-app-post-login.spec.ts --workers=1
$env:PRAXIS_LIVE_AI_SMOKE = '1'
npx playwright test tests/e2e/capsule-studio.spec.ts --workers=1
```

The current Capsule Studio suite performs real TXT/PDF/DOCX intake/review persistence and, with opt-in, a real `/api/ai/ask-praxis` response plus saved-history check. Its UI selectors must be updated by the responsible owner when deliberately replaced. `ask-capsule-runtime.spec.ts` and `ask-same-thread-agent-run.spec.ts` primarily prove mocked runtime presentation. `npm run test:auth-runtime:preflight` checks credentials/cloud prerequisites; `test:auth-runtime:local` also rebuilds and includes mocked browser smoke, while `:live` only runs health/GCP audits. None is a replacement for the full persisted acceptance journey.

Publication uses root's clean release checkout. `deploy:frontend:main-safe` requires branch main and HEAD equal to origin/main but currently does not reject dirty source before Cloud Build submission. Verify a clean release tree explicitly; otherwise its HEAD label can misrepresent submitted content. Coordinate the existing main-push deployment trigger with manual submissions. Preserve mounted configuration and secrets, then bind the receipt to `/api/health/runtime`, the served commit and ready revision.

## Open implementation checklist

### Integration evidence from the inventory/runtime lane

- Captured dirty-baseline reconstruction against newer main `2441af6ccecc343d7201ef31e75993c32422128c` found 538 CRLF/LF-only differences and five substantive main-only files, with no substantive UX conflicts in that comparison. Root owns importing the current Cloud Build safety and audit/test changes. This lane did not edit the main checkout.
- The two scoped audit updates follow actual Chat/Capsules navigation, shared search commands, authenticated search owner scope, native inspection dialog, public sitemap and private login metadata. `audit:mvp-route-shape`, `audit:tasklet-mvp-foundation`, scoped ESLint and whitespace validation passed.
- Exact-version regression RED was verified: an attached v2 injected v3 content, and a missing pin did not reject the request. Initial GREEN passed 54 tests in exact-resolution, calibration, profile-context and workspace-pointer suites. An adjacent capsule-service/builder/dock/profile run passed 87 tests. These overlapping runs are not a combined unique-test count.
- Active numeric pins resolve owner/id/version from raw current or historical records before normalization. All accepted refs are checked; unavailable/corrupt/archived/fractional pins produce recoverable 409 responses without default or thin-context recovery. Profile pin loading happens before retrieval; calibration refusal precedes credit deduction and the answer handler. Legacy unpinned refs report the resolved version. Historical governing context replaces stale saved source/document ids with its snapshot ids.
- The final reviewer follow-up reproduced a persisted fractional pin returning 200 rather than 409. Workspace GET now validates raw saved pins before sanitizing. Valid PUT replacements ignore corrupt prior pointer metadata so clear/reattach recovery remains available. The expanded final focused suite passed 56 tests across four suites; the last route/test change also passed scoped ESLint and whitespace validation.
- Historical memo export intentionally differs on archives: an owner-scoped saved memo may export immutable historical lineage, while archived capsules are unavailable as active Ask attachments.
- Static audit follow-up passed 35 leaves across capsules (15), agents (2), architecture (3), surface (7), runtime excluding GCP (2), and simplification (6). The capsule contract/V3/backfill/inspection checks follow the shared inspector and its advanced drawer instead of removed workbench headings. A saved custom method snapshot is rendered in the contract audit; missing saved methods must not be invented. Six focused inspector/method tests passed across two suites.
- Public/navigation/purpose checks follow the real shared shell, public navigation registry, command destinations and saved draft payload with explicit unverified evidence. The app-search audit accepts registered builder/saved-work/query-backed pages and still rejects external, protocol-relative, traversal, unknown and API navigation targets; three focused audit tests passed across two suites. Dynamic destinations now verify actual route files.
- Deep preship reports 140 PASS, 2 WARN, 0 BLOCKED; the warnings are broad direct-model marker findings. Agent checks warn about absent live ledger/worker/provider configuration in the isolated shell. The architecture run warned that its then-current Graphify report described an older commit. These checks establish static contracts, not live runtime readiness; logs are under `C:\Users\giuli\output\praxis-chat-first-baseline\inventory-static-*.log`.
- Scoped ESLint passed for the nine updated audit scripts and the app-search audit regression test. Scoped whitespace validation passed. The audit changes preserve backend governance/security checks and replace obsolete copy/layout assertions with current behavior, registered destinations and shared inspection renders.
- Root owns the integrated gate/build, Graphify refresh, authenticated browser/persistence proof and deployed receipt. Unit/mocked proof does not establish those release gates.

Self-review of this lane: accuracy 4/5 (targeted runtime/audit proof; integrated/live proof pending), completeness 4/5 (assigned paths implemented; cross-app journeys owned by root), clarity 4/5 (explicit evidence boundaries), actionability 5/5 (source and repeatable tests ready), conciseness 4/5 (broad route/release context retained for handoff). Overall 4.2/5. The highest-impact remaining verification is authenticated source intake → pinned attachment → Ask/reload against the reviewed release.

- [x] Root records captured baseline manifest and reconciles subsequent main-checkout drift.
- [x] Chat/nav owner completes Chat + Capsules primary navigation, consistent shell and unobstructed mobile composer.
- [x] Chat/nav owner preserves capsule attachment roles/version pins, evidence detail and chat history/continuation.
- [x] Auth/library owner completes simple login, return-target onboarding and accessible account controls.
- [x] Auth/library owner removes duplicate library/workbench default presentation and simplifies search/filter/empty states.
- [x] Auth/library owner finishes Purpose → Material → Review and save, current-snapshot use and explicit unsaved/recovery behavior.
- [x] Inspector owner delivers graph/evidence exploration, concise overview, progressive detail and accessible dialog lifecycle.
- [x] Handover owner completes preview-hash generation gate, reviewed-version/provenance package and stale/unreviewed/wrong-owner tests.
- [x] Root reconciles experimental/legal/privacy/paid-access controls and isolates auth/session security changes.
- [x] Owners update only deliberately changed UX expectations in focused/E2E tests; root completes integrated mandatory gate.
- [x] Root records responsive/keyboard/contrast screenshots and precise mocked-versus-real acceptance results, with real-service results pending publication in the separate release receipt.
- [ ] Root creates clean coherent release, publishes, verifies served identity and reruns real persisted journeys.
- [ ] Root records remaining operator/quality/capacity limitations in a separate release receipt and updates checklist with evidence links.

References: [session brief](../CODEX_SESSION_BRIEF.md), [current implementation ledger](2026-09-30-praxis-implementation-ledger.md), [canonical app structure](../product/PRAXIS_CANONICAL_APP_STRUCTURE.md), [context workflow guide](../product/CONTEXT_CAPSULE_POLICY_RESEARCH_GUIDE.md), [runtime architecture](../architecture/PRAXIS_AGENT_RUNTIME_ARCHITECTURE.md), and [design system](../../DESIGN.md).
