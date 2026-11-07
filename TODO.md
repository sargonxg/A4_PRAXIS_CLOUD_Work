# PRAXIS TODO

Last updated: 2026-11-07.

## Local policy context workflow

- Local capsule task preview/export/reopen is implemented in the existing CLI; see [the runbook](docs/runbooks/COGNITIVE_CAPSULE_CLI.md). Retain exact source and review qualifications when revising research memory.
- Empirical saliency, efficiency and analytical-quality comparisons remain future research. The deterministic selector and byte accounting do not establish measured benefit. Hosted generation/billing and cross-tool native-v2 interchange remain outside this workflow.

## Current continuation priorities

- Core live acceptance is complete on `4480650999b5bd2808b55cba58f16e5a9a83d343`; use the [production record](docs/reviews/2026-09-29-praxis-production-acceptance.md) and [user-readiness record](docs/reviews/2026-09-29-praxis-user-readiness.md). Earlier failed canaries remain dated evidence.
- Restore scoped Google sign-in and finish exact-revision Cloud Build/Cloud Run metadata and error-log inspection across the completed canaries/logout. Expired local credentials are not evidence of a production outage.
- Verify full disposable-account signup, email verification/reset, expiry/deletion and switching two real accounts; existing-account login and logout are proven.
- Complete inventory pagination/capacity, scanned-document/OCR and long-document limit coverage. Live multi-chunk working notes and TXT/PDF/DOCX ingestion are proven.
- Prove duplicate dispatch/lost-response and interrupted artifact/version recovery in isolation. The ordinary queued research, approval and edited saved-memo path is proven.
- Verify server-enforced free/paid entitlements and purchases with operator-supplied Polar sandbox configuration. Keep optional JEV disabled until its separate dependency/credential/consent/live-evaluation proof passes.
- Retain real-provider policy/narrative outputs and compare plain-source answers with reviewed-capsule answers using the same sources and an analyst rubric. Contract tests and operational canaries do not measure quality gains.
- Tighten institutional-source selection and original-passage verification. The final generated canary confused financial stages and source attribution; the corrected body stays review-required and its two-institution substantiation remains incomplete. Refine noisy diagnostic labels and generic graph/opaque-ID prose.
- Resolve the remaining moderate/low dependency advisories with a separate compatibility-reviewed update. The historical queue below is not current production proof.

## 2026-06-12 session — shipped and follow-ups

Shipped on main (see CHANGELOG [Unreleased], commits b3509952..920f680c):
home simplification, Ask context-health receipts, agent-run thread return,
expiry sweeps + proof rail, capsule workbench split + reusable viewers,
readiness badges, capsule-quality-review agent, DIALECTICA spec-3.0 import
hardening. Suite green at 1,382 tests.

Follow-ups required:

- Deploy: create a Cloud Scheduler job for `/api/cron/agent-runs-sweep`
  (cron-secret auth, suggested every 15 minutes) — without it expired runs
  and approvals are only swept when the route is called manually.
- DIALECTICA import: signature/attestation verification is stored verbatim
  but not yet cryptographically verified (deliberate slice boundary).
- Authenticated production canary (`doctor:praxis:canary`) should exercise:
  one Ask turn that queues a run and proves the same-thread return, one
  capsule-quality-review run approving a proposal, and one DIALECTICA
  fixture import.

## Current Build Queue

- Current active ledger:
  `docs/build/PRAXIS_CONTEXT_CAPSULE_APP_BUILD_LEDGER_2026-05-15.md`.
- Current red-flag and improvement ledger:
  `docs/audits/2026-05-30-red-flags-and-improvement-plan.md`.
- Current prompt pack:
  `docs/build/PRAXIS_TASKLET_RUNTIME_AGENT_PROMPTS.md`.

Historical v4/v5 pointer stubs and May 6 backlog files were removed during the
Tasklet cleanup. New work starts from the active ledger above.

## Immediate Next Steps

### Current Priority Queue

0. Current surface doctrine is public Home plus signed-in Home + Capsules.
   Keep Ask PRAXIS, library/source work, memo, canvas, diagnostics, and agent
   proof inside the existing cockpit/workbench as panels/actions. Legacy
   signed-in URLs and `/agents/[runId]` may redirect or deep-link for
   compatibility, but new product work must not add another primary app page or
   navigation item.
0. The capsule catalog is now
   `2026-05-30-capsule-consolidation-expert-grade-v15` with 205 starter
   capsules. Next capsule work should improve authoring/review UX, Firestore
   v15 backfill proof, and capsule-vs-generic-LLM evals rather than adding a
   parallel schema.
0. Next live-proof work should run `doctor:praxis:canary` and the authenticated
   browser production lane with the disposable Firebase account, ADC, Cloud SQL,
   Cloud Tasks, worker auth, and model runtime env configured; do not claim
   production golden-path proof unless that canary records the run id, capsule
   id, memo id, same-thread receipt, and cleanup posture.
0. The current red flags are tracked in
   `docs/audits/2026-05-30-red-flags-and-improvement-plan.md`: authenticated
   live E2E, 51/55 tool-contract coverage, model-string audit warnings,
   dependency advisory review, disabled Cognee/Polar posture, and docs sprawl.
0. Documentation consolidation now routes through `docs/README.md`,
   `docs/product/README.md`, `docs/audits/README.md`, `README.md`, `STATUS.md`,
   `TODO.md`, and `CHANGELOG.md`. Do not delete historical dated audits until
   references and generated scripts have been checked.
0. Senior engineering cleanup is now in progress: launch-readiness live header
   probes pass, canonical-name warnings are fixed and regression-tested, and
   `docs/audits/2026-05-19-senior-engineering-improvement-audit.md` records the
   current route/API/runtime proof posture. The route inventory and cleanup
   map artifacts now cover 210 API routes, static deep pre-ship blockers are
   closed, and retired graph staging endpoints are archived before deletion.
   Next hardening should use those artifacts before any deletion pass.
0. Ask PRAXIS agentic conversation runtime is now implemented: each turn
   records triage, ContextCapsule, tool-router, approval-gate, and supervisor
   receipts; deep/current/multi-source prompts auto-queue a capsule-bound
   Research Memo Agent run when Cloud SQL/Cloud Tasks are configured; and the
   Ask panel shows compact orchestration chips. Next hardening should add a
   browser-authenticated production flow that proves queued run status returns
   into the same Ask thread after worker completion.
0. Starter ContextCapsules now include richer domain/source/agent metadata for
   sustainability, finance, HR, diplomacy, and humanitarian-rights workflows.
   Next hardening should let Ask PRAXIS promote source-pack gaps directly into
   the user's active capsule repository.
0. Ask PRAXIS source-rich conversation packs are now implemented: answer
   envelopes include sourceability-aware claim grounding, richer source preview
   cards for uploaded chunks/corpus records/grounded fetches/receipts/digests,
   actionable follow-up chips, and Memo Studio blocks with source/provenance
   detail. Next hardening should run the authenticated browser flow against
   production with one uploaded PDF/DOCX, one active capsule corpus case, and
   one grounded web/source fetch.
0. Operational agent workspaces are now implemented: `/agents/[runId]` opens
   the real shared PRAXIS cockpit focused on the selected capsule-bound run,
   polls active run receipts, exposes retry/cancel/approve/reject controls, and
   keeps `/app/agents/[runId]` as a compatibility redirect. Next hardening
   should browser-smoke the authenticated production flow with a real account
   and add one synthetic approval fixture for UI regression coverage.
0. Temporal, causal, and human-friction capsule structures are now explicit:
   Temporal and causal map, Human friction map, and Decision clock templates
   seed complex policy work with triggers, blockers, incentives, stale
   assumptions, and review windows. Next hardening should let Ask PRAXIS save
   discovered trigger/blocker updates back into capsule core refs with review.
0. Policy-team capsule routing is now implemented in the `/app` manager:
   canonical categories seed new ContextCapsules, category tags persist through
   the existing capsule contract, suggested tools can be attached from the
   capsule detail panel, and core-library search indexes category/tool/product
   tags. Next hardening should persist AI-generated capsule improvement plans
   as structured capsule updates instead of only sending them through chat.
0. Capsule manager is now the signed-in app surface: `/app` loads real
   user-owned capsules, supports search/category filtering, shows ids,
   versions, sources, documents, tools, outputs, tags, trust label, and lets
   users upload, improve, refresh, categorize, select, or archive capsules.
   Next hardening should replace the temporary category prompt with a polished
   inline editor and add capsule-thread history/resume controls in the same
   page.
0. One-page app consolidation is now the active product shape: `/app` is the
   only authenticated PRAXIS surface, old dashboard/assistant/context/tools/
   settings URLs redirect into it, and public navigation is limited to Home,
   Capsules, `/pricing`, and `/release-notes`. Next
   cleanup should remove component code that is proven unused by the one-page
   cockpit after validation, not by route-name assumptions.
0. Release note governance is now explicit: `src/lib/constants/app-version.ts`
   is the central version/build source, `/release-notes` reads from
   `src/lib/product/release-notes.ts`, and `npm run audit:release-notes`
   guards package/app version, build number, release registry, page import, and
   changelog alignment. Significant changes should bump `APP_BUILD_NUMBER` and
   add a release note entry before commit.
0. Route cleanup is now under way: redundant App Router `/app` page files are
   removed while `src/proxy.ts` keeps `retired user-owned routes` compatibility redirects, the old
   guided-tour component stack is gone, and the dashboard smoke now targets the
   shared PRAXIS cockpit. Next cleanup should shrink user-owned-only component bulk
   only after the workbench fixture/chapter imports have a replacement.
0. Public Home and authenticated Home now share the same polished cockpit:
   rounded capsule/composer surfaces, subtle policy-grid background, no
   low-level provider/runtime/token-cost labels, and no extra public-only
   landing sections. Pricing and Release notes carry the remaining standalone
   public page surface while capsule education moves into the app manager.
0. Dashboard/context shell parity is tightened: `/app/dashboard` no longer
   mounts the floating Ask launcher, capsule concatenation lives only above the
   Ask bar, and `/app/contexts` is framed as the trust/health/.core management
   surface rather than a second composition cockpit.
0. Capsule stack mechanics now need persistence hardening: the cockpit can add,
   replace, delete, search, drag/drop, and tool-toggle the active stack above the
   Ask bar, but the next backend wave should persist the composed stack as a
   first-class run input/receipt for every Ask PRAXIS turn.
0. Inline Ask PRAXIS discussion now runs from the shared cockpit and sends the
   composed capsule/tool/model context. Next, persist the full composed stack as
   an immutable run receipt and expose resume/history controls in the same rail.
0. Gemini 3.1 Pro Preview is now in the central selector for deep reasoning.
   Next, add a server-side model-availability receipt per run so the UI can
   explain when a selected preview model falls back to another Vertex target.
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
   user-owned/user-owned/tour/specialist surfaces.
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
5. Add a signed-in integration test for v5 user-owned copy against a Firebase emulator or test project; current validation covers the typed user-owned core objects and the UI copy affordance, not a live Firestore mutation.
6. Add the first PRAXIS-to-DIALECTICA adapter proof only after the standalone MVP flow is smooth: one typed context query, one cited response, one reviewable graph delta.
7. Complete Pack 24 backend Reasoning Spine: Rust BLAKE3 context-pack compiler, real trace ids, Langfuse or equivalent trace store, and live event streaming behind the current Spine panel.
8. Complete Pack 23 backend Library Bucket: production-grade source auto-structure after upload, including better PDF page provenance, source-span citations, entity normalization, and review queues beyond the current inline MVP extraction.
9. Keep user-created Situation Cores primary inside `/app/contexts` and `/app/cores/context`; public `/contexts` is now only a redirect.
10. Reconcile checkout/pricing with the current Polar billing implementation and any approved Stripe requirement.
11. Track persona smoke CI until the required 10 consecutive green runs are real, not projected; current streak is 3/10.
12. Decide whether to leave Cognee disabled-first or deploy the separate `praxis-cognee` service.
13. Review the 2026-05-13 GCP/Firebase cleanup candidates before any mutating cloud cleanup: retired provider secrets, Artifact Registry retention, and the two unclear projects `plasma-talon-lt3cf` / `google-mpf-mc7f341560lx`.
14. Run live export/download checks for briefing artifacts in the next improvement round.
15. Add production-browser coverage for the authenticated command palette once a stable production test user/session path is approved; local signed-session smoke now covers the simplified five-surface flow.
16. After the current capsule/core composer lands, use `docs/superpowers/specs/2026-05-15-next-20-simplification-ai-context-writing-search.md` as the next improvement queue for simplification, stronger AI, context creation/combination, drafting, writing, and search.
17. Run the next evidence-based cleanup pass against `retired user-owned routes`, user-owned-only
    components, old tour components, and duplicate specialist surfaces. Archive
    useful evidence and delete only after `rg`, route audits, imports, tests,
    and graph references prove the target is safe.

## Future Architecture Direction

- Keep PRAXIS focused on user context, analysis, writing, review, and handover.
- Use DIALECTICA as the ingestion and knowledge layer through a narrow adapter contract; see `docs/architecture/PRAXIS_DIALECTICA_KNOWLEDGE_LAYER_ALIGNMENT.md`.
- Treat KAIROS and AGON as upstream evidence/graph providers to DIALECTICA, not as direct PRAXIS UI dependencies.

## Live Production Blockers

- Provider-backed notification delivery remains open; historical blocker detail is archived in `docs/_archive/2026-05-16-aggressive-cleanup/root/BLOCKERS.md`.
- Live Cognee SDK calls remain service-owned and disabled-first; historical blocker detail is archived in `docs/_archive/2026-05-16-aggressive-cleanup/root/BLOCKERS.md`.
- Deep pre-ship live checks still require staging/prod execution; historical blocker detail is archived in `docs/_archive/2026-05-16-aggressive-cleanup/root/BLOCKERS.md`.
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
- **audit:mvp-route-shape**: static guard that legacy public user-owned/context/method/draft/user routes redirect into the canonical app surface.
