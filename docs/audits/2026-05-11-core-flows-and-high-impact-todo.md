# PRAXIS Core Flows and High-Impact TODO - 2026-05-11

## Purpose

Audit the current PRAXIS app against the near-term product promise:

- Public landing page that explains PRAXIS by TACITUS and demonstrates exchangeable contexts.
- User Core and Context Cores as the simple mental model for personalized work.
- Context creation as a first-class workflow.
- Drafting and memo tools that build from the selected user, context, sources, graph, and output core.

This is a product-readiness audit, not a full launch audit. Cloud/billing/live-ops blockers remain tracked in
`docs/audits/2026-05-11-missing-work-plan.md`.

## Verification Snapshot

- Repo: `C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work`
- Remote: `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`
- Branch: `main`
- Current improvement pass:
  - `CreateContextWizard` now posts to `/api/situations` for authenticated owner-scoped context creation.
  - The wizard preserves drafts in browser storage when sign-in is required.
  - Successful creation routes to `/app/workbench/{id}?openChapter=context&source=contexts`.
  - `tests/e2e/core-flows-smoke.spec.ts` and `npm run smoke:core-flows` cover the public landing context switch, context creation modal, and drafting route.
  - Deprecated `cloud_functions/gdelt_poller/main.py` was removed; the GDELT path is now the Cloud Run Worker Pool entrypoint `worker.py`.
  - Live GCP cleanup removed the deprecated Gen2 `gdelt-poller` HTTP function and paused `gdelt-poller` Scheduler job after confirming the Worker Pool stayed `Ready`.
- Focused static audits passed:
  - `npm run audit:landing`
  - `npm run audit:simplified-capability-ledger`
  - `npm run audit:mobile-primary-flows`
  - `npm run audit:dashboard`
  - `npm run audit:drafting-templates-present`
  - `npm run audit:memo-studio`
  - `npm run audit:routes`
- Focused tests passed:
  - `npx vitest run src/__tests__/situation-creation-flow.test.ts tests/demo/phase7-demo-contexts.test.ts --pool=threads`
- Local browser verification:
  - `http://127.0.0.1:3128/` loaded the public landing page.
  - `http://127.0.0.1:3128/contexts` loaded the context workspace.
  - `http://127.0.0.1:3128/contexts/indo-pacific-2026?panel=drafts` loaded the context detail draft panel route.
  - `http://127.0.0.1:3128/draft` loaded the drafting inbox.
  - `http://127.0.0.1:3128/draft/new?caseId=indo-pacific-2026&template=country-card` loaded the drafting editor when the URL is quoted correctly.
  - `http://127.0.0.1:3129/app/workbench/indo-pacific-2026?openChapter=memos` loaded the authenticated workbench memo surface after setting `COOKIE_SIGNING_SECRET` for the local server.

## What Works Now

### 1. Landing Page and Exchangeable Contexts

Status: working.

The public landing page shows `PRAXIS by TACITUS`, the two-context mental model, a User Model selector, a Context selector, a live graph preview, methods/tools, and a drafting comparison.

Browser evidence:

- Selecting a different context in the landing hero changes the hero content, graph title, source counts, actor counts, and object counts.
- The landing page includes an explicit drafting section and lists `Memo Drafter` among the visible methods.

Product implication:

The public front door is good enough to explain the app's shape: one PRAXIS engine, exchangeable contexts, and user-specific adaptation.

### 2. Core Registry

Status: code-backed and audit-covered.

`src/lib/product/context-core-map.ts` defines the current core model:

- `praxis-core`
- `user-core`
- `team-core`
- `situation-core`
- `source-core`
- `document-core`
- `graph-core`
- `output-core`

The simplified capability ledger audit passes, and the core map links tools to the cores they consume.

Important caveat:

`team-core` is still staged. The model exists, but the app should not present team/multi-user behavior as fully live until the remaining multi-user decisions are closed.

### 3. Context Workspace

Status: working as an example-context workspace.

`/contexts` loads five example contexts with domains, source counts, graph object counts, and draft counts. The page also exposes a `New Context` modal.

`/contexts/[caseId]` loads the case workspace with eight panels:

- Frame
- Sources
- Extraction Lenses
- Work Process
- Timeline
- Graph
- Drafts
- Methods Used

Product implication:

The context workspace is a strong demo surface for showing how a case becomes structured into sources, lenses, graph objects, and outputs.

### 4. Context Creation Modal

Status: improved; real authenticated creation is now wired, but user-context listing still needs a second pass.

The `New Context` modal opens in browser verification. It supports:

- Context name.
- Brief/source-material prompt.
- Suggested domain ontology.
- Work ontology.
- Four-field frame.

Browser evidence:

- Entering `Humanitarian access negotiation for Port Orion` suggested the Humanitarian domain.

Current behavior:

`src/components/contexts/CreateContextWizard.tsx` builds a context payload through `src/lib/contexts/context-create-payload.ts`, posts it to `/api/situations`, and routes authenticated users into the app workbench for the new context. If the user is not signed in, the draft remains in browser storage and the user is sent to sign in. Example/demo sessions remain read-only.

Remaining gap:

The public `/contexts` list still shows example contexts only. Newly created private contexts are opened in the authenticated workbench, but the `/contexts` page does not yet merge the user's owner-scoped contexts into the list.

Product implication:

The "create my context" promise is now materially stronger because authenticated users can create a private context from the new workspace entrypoint. The next improvement is to make private contexts visible alongside example contexts.

### 5. Drafting Tool

Status: working as a demo/editor surface.

`/draft` loads the drafting inbox. `/draft/new?caseId=indo-pacific-2026&template=country-card` loads the editor with:

- Auto-fill from context.
- Save shell.
- Export preview.
- Structured editor sections.
- Citations/source sidebar.
- Graph objects.
- Episodes.
- User model context.
- Section actions.

Product implication:

The output core is visible enough for demo and product explanation. The next improvement is to make the dependency on User Core, Context Core, Source Core, Graph Core, and Output Core explicit inside the drafting UI.

### 6. Memo Studio

Status: static audit passes; authenticated browser surface loads with local session setup; secondary backend endpoints need follow-up.

`npm run audit:memo-studio` passes and confirms the expected memo stack is present, including templates, exports, `/api/memos`, memo service integration, version history, and backend memo integration.

Browser evidence:

- Without `COOKIE_SIGNING_SECRET`, the local authenticated flow failed at `/api/auth/session` with `COOKIE_SIGNING_SECRET is required for signed sessions`.
- With `COOKIE_SIGNING_SECRET` set for local `next start`, the example user session entered `/app/workbench/indo-pacific-2026?openChapter=memos`.
- The browser found `Memo Studio`, `Memos`, `Export`, `Version`, and `Evidence` content on the workbench page.

Follow-up risk:

The authenticated workbench still logged 500 responses from:

- `/api/backend/chapters/research/threads`
- `/api/backend/workspace/events`

Those are secondary backend calls, but they should be fixed or downgraded to explicit local/offline fallback states before this is called clean.

## High-Impact TODO

### P0 - Finish Private Context Listing

Owner goal:

The user should be able to see newly created private contexts from `/contexts`, not only after being routed into the workbench.

Work:

1. Add an authenticated owner-scoped context list fetch to `/contexts`.
2. Merge user contexts with example contexts while keeping provenance labels clear.
3. Link private contexts to `/app/workbench/{id}?openChapter=context`.
4. Keep example contexts linked to `/contexts/{caseId}` or their read-only demo route.
5. Add browser coverage for create -> route -> list contains new context when test credentials are available.

Acceptance:

- Signed-in user-created contexts appear in `/contexts`.
- Context cards show whether the context is example/demo or private.
- Unauthenticated users still see examples and preserve a draft when they try to create.

### P0 - Make the Core Stack Visible in the App

Owner goal:

Users should see what cores are active and understand which core feeds each tool.

Work:

1. Add an `Active Core Stack` panel or compact app-shell control.
2. Show at least: User Core, Context/Situation Core, Source Core, Document Core, Graph Core, Output Core.
3. Mark Team Core as staged/coming soon unless the multi-user path is actually implemented.
4. Let drafting/memo surfaces display which cores are feeding the current output.
5. Keep the landing page simple, but align the app language with the core model.

Acceptance:

- User can identify the active user model and active context in the app, not only on the landing page.
- Drafting and memo tools show grounded inputs from context, sources, graph, and output template.
- No public UI claims Team Core is live unless the implementation is live.

### P0 - Harden Drafting and Memo as Core-Aware Output Tools

Owner goal:

Memo and draft generation should feel like PRAXIS outputs built from the selected context, not generic editors.

Work:

1. Add visible "fed by" evidence to draft and memo sections: user model, context frame, source pack, graph objects, and output template.
2. Add refresh actions by core, for example `Refresh from sources`, `Refresh from graph`, `Refresh from user model`.
3. Ensure export paths preserve citations and context metadata.
4. Add browser E2E for draft creation from a context and memo chapter opening from the workbench.

Acceptance:

- Draft and memo pages expose their grounding stack.
- Exports include enough metadata to show the output was context-built.
- Browser tests cover the happy path and fallback states.

### P1 - Fix Authenticated Local Demo Setup

Owner goal:

A local production-style verification run should not fail because an expected local session secret is missing.

Work:

1. Add or document a local audit env profile for `COOKIE_SIGNING_SECRET`.
2. Make the example-session button fail gracefully if auth/session config is absent.
3. Add a narrow smoke command for example workspace login and memo chapter load.

Acceptance:

- Local `next start` with audit env can open the example workspace.
- Missing auth env produces a visible setup message, not a 500.

### P1 - Repair Workbench Secondary Backend Fallbacks

Owner goal:

The workbench should remain clean when optional backend services are unavailable locally.

Work:

1. Investigate `/api/backend/chapters/research/threads` 500 in local auth verification.
2. Investigate `/api/backend/workspace/events` 500 in local auth verification.
3. Add explicit fallback data or disabled states if the backend is intentionally absent.
4. Add server-log assertions to the smoke check.

Acceptance:

- Memo/workbench page can load locally without 500s from optional backend calls, or those calls return documented fallback statuses.

### P1 - Add Focused Browser E2E Coverage

Owner goal:

Protect the flows Giulio keeps asking about.

Work:

1. Landing context switch.
2. Landing user model switch.
3. `/contexts` New Context modal and ontology suggestion.
4. Persisted context creation when P0 is implemented.
5. Context detail panel navigation.
6. Draft creation from a context.
7. Authenticated memo chapter load.

Acceptance:

- One focused E2E suite can be run before handoff/deploy.
- Failures point to exact user-facing flows, not only low-level route tests.

### P2 - Keep Launch Blockers Separate From UX Polish

Do not blur these with the core-flow UX work:

- Billing/checkout provider remains unconfigured.
- Cognee production memory remains disabled/unconfigured.
- `audit:gcp` requires interactive `gcloud` reauthentication.
- Dependency audit reports vulnerabilities that need grouped remediation.
- Workbench bundle budget is passing but tight.

These are tracked in `docs/audits/2026-05-11-missing-work-plan.md`.

## Recommended Execution Order

1. Merge private user contexts into `/contexts`.
2. Add an app-level Active Core Stack indicator.
3. Make Drafting and Memo Studio visibly core-aware.
4. Extend `smoke:core-flows` with authenticated create/list coverage when test credentials are available.
5. Fix local auth/session setup and secondary backend fallbacks.
6. Return to Phase 9 launch blockers: billing, Cognee posture, GCP auth, dependency audit, and final gate.
