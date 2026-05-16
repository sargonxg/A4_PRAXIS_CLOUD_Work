# PRAXIS TODO

Last updated: 2026-05-16.

## Current Build Queue

- Current active ledger:
  `docs/build/PRAXIS_CONTEXT_CAPSULE_APP_BUILD_LEDGER_2026-05-15.md`.
- Current prompt pack:
  `docs/build/PRAXIS_TASKLET_RUNTIME_AGENT_PROMPTS.md`.
- v5 MVP control file: `docs/build/PRAXIS_v5_EXECUTION_LEDGER.md`.
- v5 operating guide: `docs/build/PRAXIS_v5_BUILD_01_AGENT_OPERATING_GUIDE.md`.
- Backend phase prompts: `docs/build/PRAXIS_v5_BUILD_02_BACKEND_PHASES_0-3.md`.
- Frontend/ship prompts: `docs/build/PRAXIS_v5_BUILD_03_FRONTEND_AND_SHIP.md`.

The v5 files remain historical/build evidence unless an active task explicitly
references them. New Tasklet-style ContextCapsule runtime work should start
from the active ledger above.

## Immediate Next Steps

### Canonical Tasklet-Style Runtime Build

0. Release note governance is now explicit: `src/lib/constants/app-version.ts`
   is the central version/build source, `/release-notes` reads from
   `src/lib/product/release-notes.ts`, and `npm run audit:release-notes`
   guards package/app version, build number, release registry, page import, and
   changelog alignment. Significant changes should bump `APP_BUILD_NUMBER` and
   add a release note entry before commit.
0. Public Home and authenticated Home now share the same polished cockpit:
   rounded capsule/composer surfaces, subtle policy-grid background, no
   low-level provider/runtime/token-cost labels, and no extra public-only
   landing sections. `/learn` now carries the explanatory load through compact
   clickable sections for cores, ten paths, tools, outputs, connectors, and
   planned scaffolded capabilities.
0. Dashboard/context shell parity is tightened: `/app/dashboard` no longer
   mounts the floating Ask launcher, capsule concatenation lives only above the
   Ask bar, and `/app/contexts` is framed as the trust/health/.core management
   surface rather than a second composition cockpit.
0. Capsule stack mechanics now need persistence hardening: the cockpit can add,
   replace, delete, search, drag/drop, and tool-toggle the active stack above the
   Ask bar, but the next backend wave should persist the composed stack as a
   first-class run input/receipt for every Ask PRAXIS turn.
0. First OutputCapsule product slice is now implemented in
   `src/lib/output-capsules/`: typed templates, payload schema ids/versions,
   deterministic planner, quality gates, hidden-tool bindings, and
   `country-pack` composition. The shared public/auth cockpit exposes a compact
   Produce selector from this registry without adding navigation. Next, persist
   generated OutputCapsule records from real agent/tool runs into Memo Studio,
   Library, Canvas, or Handover with run-ledger receipts.
0. Tasklet-style first viewport is now implemented for public Home and
   authenticated Home: left sidebar, big prompt, active ContextCapsule, recent
   runs, policy-agent cards, and run-to-output posture. The marketplace now
   presents policy agents instead of a raw tool catalog, and the Research Memo
   Agent worker creates a Memo Studio draft with source/gap receipts. Login,
   signup, onboarding skip/complete, and the welcome modal now steer users back
   to the Tasklet-style Home, preserving the pending prompt and selected policy
   agent from the public surface.
0. Historical v5 and May 14 Genkit sprint prompt packs are now archived under
   `docs/_archive/build/`, with pointer stubs left in `docs/build/`. `/tour`
   redirects to `/`; keep all public entry work on the Tasklet-style Home.
0. Ask PRAXIS cockpit token/model/context slice is now documented in
   `docs/product/PRAXIS_ASK_CONTEXT_CAPSULE_COCKPIT_PLAN_2026-05-16.md`.
   Live Ask remains login/onboarding gated; new users start with 1,000 PRAXIS
   tokens; Ask costs 10 tokens per question; the cockpit exposes Gemini Flash
   and Gemini Pro selection; and capsule-owned Ask thread turns persist even
   without a legacy situation id.
0. First Tasklet-style MVP foundation pass is now in place: public pages
   `/learn`, `/tacitus`, `/pricing`, and `/release-notes`; homepage nav aligned
   to those pages; `/app/contexts` has a capsule composition panel for
   pick/fork/lock/combination review; and
   `docs/audits/2026-05-15-tasklet-mvp-cleanup-ledger.md` plus
   `npm run audit:tasklet-mvp-foundation` guard the cleanup direction. Next
   deletion work must extend the route consolidation audit before removing
   demo/Syria/tour/specialist surfaces.
0. Keep the public-to-authenticated path usable before adding deeper runtime
   scope: homepage prompt bar, path-aware capsule preview, active capsule
   glimpse, login/signup continuation, app sidebar, active capsule strip, Home
   capsule summary, ContextCapsule library below the AI bar, and
   Ask/Library/Memo/Canvas surfaces reading from the active capsule. Ask now
   shows a compact capsule AI readiness panel near the composer. The duplicate
   header account menu is removed; the sidebar is the single Profile/User Core
   entry point.
1. Use `docs/build/PRAXIS_TASKLET_RUNTIME_AGENT_PROMPTS.md` to start the next
   Codex and Claude Code sessions with clear file ownership, validation, and
   commit/push expectations.
2. Queue 4 first pass is implemented and the API boundary is hardened: typed
   agent runtime contracts, pure transition/event/idempotency helpers, a
   narrow Cloud SQL Postgres adapter, library-owned Zod schemas, UI-safe output
   DTOs, and queued-only API routes for creating and inspecting capsule-owned
   runs.
   Remaining Queue 4 hardening is production Cloud SQL env wiring/migration
   verification and adding tool-call/approval table writes when later waves
   need them.
3. Queue 5 first pass is implemented: Cloud Tasks payload/task construction,
   dispatch route, OIDC/shared-secret worker boundary, and no-op
   `queued -> running -> succeeded` execution events. Repeated terminal
   execution is idempotent and worker-step failures mark the run failed.
   Remaining Queue 5 hardening is production queue/IAM/env verification for
   `agent-runs`.
4. Research Memo Agent is the first real worker slice. Next, replace its
   deterministic memo scaffold with live capsule-aware source retrieval and
   model drafting behind the existing calibration/approval boundary, then add
   Daily Brief, Watchlist, and Source Monitor. Every run must resolve the
   active ContextCapsule before calling tools.
5. The first ADK/Genkit run-ledger mirror adapter now exists in
   `src/lib/agent-runtime/mirror.ts`, and the ADK Research Memo bridge contract
   now exists in `src/lib/agent-runtime/adk-bridge.ts`. Next, wire the no-op
   worker to call the bridge for a queued Research Memo dry run, still without
   live Agent Engine execution, then promote Cloud Tasks dispatch into the real
   Research Memo Agent worker. Keep Ask PRAXIS labeling ADK agents as planned
   until worker execution is live.
6. Use the Genkit ContextCapsule path classifier as the first safe homepage
   prompt-to-capsule bridge. The public homepage now previews path/tools/output
   from `POLICY_PATH_PROFILES` and preserves the selected path/output through
   login. Next, after authentication, create user-owned capsule state only
   through the existing capsule creation flow and reuse the typed classifier
   output for richer missing-information questions.
7. Sourceability is now a canonical attachable tool and visible from the AI
   bar/tool filters. Next, wire selected-claim Sourceability actions directly
   into Memo Studio so a user can check a paragraph against attached snippets
   without leaving the writing surface. It should only evaluate provided
   snippets; web/source retrieval remains a separate explicit tool step.
8. Add approval gates before any external send, graph fact promotion,
   unsupported-claim resolution, credentialed browser automation, or high-risk
   tool action.
9. Keep MCP private/read-first until the run ledger and approval model are
   reliable. Browser/code sandbox work is explicitly GKE-later unless a real
   workload proves Cloud Run cannot handle it.
10. When browser automation becomes necessary, start with `browser-use` plus
   Steel.dev managed sessions, allowlisted/read-only behavior, hard run caps,
   idempotency, trace ids, and approval gates before credentialed actions.
11. Use `docs/product/CONTEXT_CAPSULE_POLICY_RESEARCH_GUIDE.md` and
   `src/lib/product/context-capsules.ts` when adding new personas, paths,
   output products, connectors, or capsule-combination flows.

### Existing MVP Follow-Ups

0. Verify the Context Core Lite mode switch in a signed-in browser flow:
   PRAXIS mode must create a Situation Core, Capsule, Context Package, active
   stack, and health/gaps summary; DIALECTICA mode must remain clearly disabled
   as "Coming soon" while pointing to the typed adapter contract.
1. Keep Ask PRAXIS capability routing on the canonical tool registry. New
   internal tools must declare live/routed/staged readiness and must not be
   exposed as fake-live app pages.
2. Verify the experimental Grafeo Context Core Lite graph in a signed-in browser
   flow and Cloud Run build before making `grafeo_experimental` anything other
   than an opt-in backend. Keep Firestore capsules/context packages as the MVP
   source of truth.
3. Extend Active Context Stack persistence beyond the reliable default stack to named stacks when the final multi-stack UX is approved.
4. Promote Canvas from draggable review-layout nodes to a richer read/write graph-editing surface if the team approves that scope; React Flow is not needed for the current MVP.
5. Add a signed-in integration test for v5 demo copy against a Firebase emulator or test project; current validation covers the typed demo core objects and the UI copy affordance, not a live Firestore mutation.
6. Add the first PRAXIS-to-DIALECTICA adapter proof only after the standalone MVP flow is smooth: one typed context query, one cited response, one reviewable graph delta.
7. Complete Pack 24 backend Reasoning Spine: Rust BLAKE3 context-pack compiler, real trace ids, Langfuse or equivalent trace store, and live event streaming behind the current Spine panel.
8. Complete Pack 23 backend Library Bucket: production-grade source auto-structure after upload, including better PDF page provenance, source-span citations, entity normalization, and review queues beyond the current inline MVP extraction.
9. Keep user-created Situation Cores primary inside `/app/contexts` and `/app/cores/context`; public `/contexts` is now only a redirect.
10. Reconcile checkout/pricing with the current Polar billing implementation and any approved Stripe requirement.
11. Track persona smoke CI until the required 10 consecutive green runs are real, not projected; current streak is 3/10.
12. Decide whether to leave Cognee disabled-first or deploy the separate `praxis-cognee` service.
13. Review the 2026-05-13 GCP/Firebase cleanup candidates before any mutating cloud cleanup: retired provider secrets, Artifact Registry retention, and the two unclear projects `plasma-talon-lt3cf` / `google-mpf-mc7f341560lx`.
14. Run live export/download checks for briefing and boardroom artifacts in the next improvement round.
15. Add production-browser coverage for the authenticated command palette once a stable production test user/session path is approved; local signed-session smoke now covers the simplified five-surface flow.
16. After the current capsule/core composer lands, use `docs/superpowers/specs/2026-05-15-next-20-simplification-ai-context-writing-search.md` as the next improvement queue for simplification, stronger AI, context creation/combination, drafting, writing, and search.
17. Run the next evidence-based cleanup pass against `/demo/*`, Syria-only
    components, old tour components, and duplicate specialist surfaces. Archive
    useful evidence and delete only after `rg`, route audits, imports, tests,
    and graph references prove the target is safe.

## Future Architecture Direction

- Keep PRAXIS focused on user context, analysis, writing, review, and handover.
- Use DIALECTICA as the ingestion and knowledge layer through a narrow adapter contract; see `docs/architecture/PRAXIS_DIALECTICA_KNOWLEDGE_LAYER_ALIGNMENT.md`.
- Treat KAIROS and AGON as upstream evidence/graph providers to DIALECTICA, not as direct PRAXIS UI dependencies.

## Live Production Blockers

- Provider-backed notification delivery remains open; see `BLOCKERS.md`.
- Live Cognee SDK calls remain service-owned and disabled-first; see `BLOCKERS.md`.
- Deep pre-ship live checks still require staging/prod execution; see `BLOCKERS.md`.
- Phase 9 production deploy approval was granted in this session; final QA is recorded in `docs/audits/2026-05-11-v5-final-product-qa.md`; billing provider configuration remains open.

## Standing Rules

- Do not touch the security boundaries listed in `CLAUDE.md`.
- Cognee stays disabled-first in production.
- Do not run mutating cloud/deploy commands without Giulio's explicit approval.
- Keep claims aligned with `docs/architecture/PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md`.

## Repo Shape And Next-Round Readiness

- **graphify**: knowledge graph at `graphify-out/`. Run `graphify update .` after code edits to keep it current.
- **Knip**: dead-export detection. Not currently in `audit:gate`; run on demand when chasing unused exports.
- **audit:architecture-reference**: startup docs link to `docs/architecture/PRAXIS_ARCHITECTURE.md` and `PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md`.
- **smoke:core-flows**: fast Playwright check for the landing Ask preview, `/app/cores/context`, and memo output in the workbench.
- **audit:mvp-route-shape**: static guard that legacy public demo/context/method/draft/user routes redirect into the canonical app surface.
