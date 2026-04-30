# PRAXIS Production TODO

Status: active continuation roadmap.
Last updated: 2026-04-30.
Workspace: `C:\Users\giuli\praxiscodexworking`.
Remote: `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`.
Branch: `main`.

This is the root handoff list for continuing the current product-hardening
loop. The deeper historical backlog remains in
`docs/PRODUCTION_TODO_2026-04-28.md`; this file is the current operating
checklist for the next implementation passes.

The hyper-detailed multi-agent execution plan is
`docs/PRAXIS_SUPERPLAN_2026-04-29.md`. Use that document for subagent lanes,
file-level work scopes, acceptance criteria, and verification evidence.

The current 15-initiative app-wide improvement plan is
`docs/PRAXIS_15_APP_WIDE_IMPROVEMENTS_2026-04-29.md`.

The latest sophisticated persona/product QA wave is
`docs/PRAXIS_SOPHISTICATED_PERSONA_WAVE_2026-04-29.md`. It contains five
serious user workflows, live-site findings, and a 35-item roadmap spanning AI
trust, export provenance, demo route continuity, landing-page credibility,
testing, cloud, and deployment parity.

The grounded-search intelligence spine plan is
`docs/PRAXIS_GROUNDED_SEARCH_INTELLIGENCE_SPINE_2026-04-29.md`. It defines the
current product direction: grounded Google Search is the primary live research
path; GDELT, ReliefWeb, UN News, UCDP, HDX, UNHCR, World Bank, SIPRI, and
Crisis Group are corroborating layers.

The latest 20-item subagent audit and implementation wave is
`docs/PRAXIS_NEXT_20_IMPROVEMENTS_2026-04-29.md`.

The latest diplomatic/policy writing architecture pass is
`docs/PRAXIS_DIPLOMATIC_DRAFTING_ARCHITECTURE_2026-04-29.md`.

The current all-tools operating-system architecture pass is
`docs/PRAXIS_TOOL_OPERATING_SYSTEM_2026-04-30.md`.

The current generated tool-by-tool sprint backlog is
`docs/PRAXIS_TOOL_BY_TOOL_SPRINT_BACKLOG_2026-04-30.md`. Regenerate it with
`npm run generate:tool-backlog` after tool/page/route changes.

The current subagent synthesis for the tool sprint is
`docs/PRAXIS_TOOL_SPRINT_SUBAGENT_SYNTHESIS_2026-04-30.md`.

The current shared context/tool architecture note is
`docs/PRAXIS_CONTEXT_AND_TOOL_ARCHITECTURE_2026-04-30.md`. It defines the
context layers, database paths, graph/Dialectica plan, document-production
lane, and active generic + conflict/political implementation focus.

Generated per-tool specifications live under `docs/tools/generated/`. Refresh
them with `npm run generate:tool-docs` after changing the registry, operating
contracts, path taxonomy, or context blueprints.

## Active Tool Operating System Workstream

- [x] Add a central operating contract for every registered PRAXIS tool:
  objective, value, applicability, required questions, expected outputs, Ask
  PRAXIS actions, situation inputs, persistence expectations, and quality bar.
- [x] Add a reusable tool operating-contract panel and wire it through the
  registry-driven tool info component.
- [x] Add `/api/tools/contracts` so tool metadata can be inspected and reused
  by future UI, agents, audits, and admin workflows.
- [x] Make floating Ask PRAXIS send the current tool id/path to chat and inject
  the tool contract into the chat system prompt.
- [x] Add `npm run audit:tool-contracts` to verify that every registered tool
  has a route/page/contract baseline.
- [x] Add `npm run generate:tool-backlog` to build a verifiable per-tool TODO
  list from the live registry, operating contracts, page inspection, and AI
  route audit.
- [x] Start the P0 page-surface upgrade with Policy Memo: registry tool info,
  operating contract, and output confidence/provenance frame are now visible.
- [x] Start the P0 Sources Library page-surface upgrade with registry tool info
  and operating contract visibility.
- [x] Codify the generic PRAXIS core plus ten policy workflow paths and mark
  the current sprint focus as generic + conflict/political analyst.
- [x] Make dashboard/sidebar recommendations account for the active
  situation's workflow path, not only role/domain.
- [x] Migrate `src/middleware.ts` to `src/proxy.ts` to resolve the recurring
  Next.js middleware convention warning.
- [x] Add a central context-blueprint layer for every tool: required context
  layers, canonical database paths, graph-backbone mode, evidence policy,
  document/LibreOffice production readiness, and future Dialectica role.
- [x] Show context blueprint and canonical data paths in the shared operating
  contract panel so tool pages expose not only purpose but also the knowledge
  context they require.
- [x] Generate 53 per-tool documentation files under `docs/tools/generated/`
  from live registry, contracts, paths, and context blueprints.
- [x] Tighten `/api/tool-data` so manual saves use a structured versioned
  envelope with metadata/source receipts, legacy compatibility mirroring, and
  payload-size protection.
- [x] Add `npm run admin:check -- giulio@tacitus.me` and enrich `/api/admin/me`
  so admin access is explainable by verified email allowlist vs UID allowlist.
- [x] Update admin UI copy to stop implying UID-only access; verified
  `giulio@tacitus.me` is an allowed admin identity when the Firebase email is
  verified.
- [x] Add a context-backbone readout to the dashboard launchpad showing tool
  readiness, required context layers, graph/document/provenance coverage, and
  the next missing situation field.
- [x] Make `/api/tools/contracts` expose context blueprints in addition to
  operating contracts for future agents, admin tools, and documentation.
- [ ] Apply `RegistryToolInfo` / `ToolOperatingContractPanel` to every tool page
  that still bypasses the shared shell.
- [ ] Move the active generic + conflict/political tools to the context
  blueprint in their AI route prompts via `buildToolContextBlueprintPrompt`.
- [ ] Build a document export adapter that renders saved structured tool data
  into DOCX/PDF/LibreOffice-compatible sections without a second AI call.
- [ ] Work through the generated P0 queue: Conflict Graph, Deep Search Agent,
  Talking Points, Dashboard, Ask PRAXIS, Sources Library, ARGUS, Dossier,
  Human Rights, Legal Tracker, Policy Memo route-quality upgrade, Sanctions,
  Treaty Analyzer, and UN Toolkit.
- [ ] Add typed Ask PRAXIS writeback adapters for graph, timeline, draft,
  scorecard, source, and workspace-state patches.
- [ ] Upgrade the next 10 lowest-scoring AI tools to the generation baseline:
  calibrated route, request schema, situation/user/context injection, useful
  structured output, source/confidence notes, persistence, and degraded state.

## Active Diplomatic Drafting Workstream

- [x] Add a central diplomatic drafting service inspired by durable legal
  document workspaces: shared situation resolution, evidence context, artifact
  modes, and source/confidence audit fields.
- [x] Fix Policy Memo contract mismatch so the page, route, persistence key,
  and structured output schema agree.
- [x] Fix the remaining demo Policy Memo no-op by supplying the route with a
  real structured Nordalia situation when demo mode has no active store
  situation. Verified in production: first-time demo flow -> Policy Memo ->
  `/api/ai/policy-memo` 200 -> Executive Summary / Policy Options /
  Recommendation render.
- [x] Fix Talking Points contract mismatch so the page sends valid route input
  and renders structured JSON output correctly.
- [ ] Remove or gate the demo Firestore `permission-denied` snapshot listener
  warning emitted by `useToolData` subscriptions; it does not block generation,
  but it is noisy and weakens operator confidence during browser QA.
- [ ] Extend the same drafting service to UN Toolkit, Legal Tracker,
  Treaty Analyzer, Dossier, Briefing, Report, and Resolution routes.
- [ ] Add a unified diplomatic artifact route and reusable workflow templates
  for policy memo, decision memo, diplomatic cable, demarche, non-paper,
  communique, legal brief, and implementation checklist.

## Current Baseline

- Product: PRAXIS by TACITUS, an AI-native workspace for policy, diplomacy,
  conflict analysis, mediation, humanitarian analysis, legal/sanctions work,
  and political intelligence.
- Objective: make the app clearer, more useful, and more trustworthy for real
  policy users, not only cleaner for developers.
- Core promise: a calibrated system of record for conflict, centered on Actor,
  Claim, Interest, Constraint, Leverage, Commitment, Event, Narrative,
  provenance, and reusable decision intelligence.
- Frontend: Next.js 16 App Router, React 19, TypeScript, Tailwind 4, Radix,
  Zustand, Vercel AI SDK v6.
- Backend: private Python FastAPI Cloud Run service for graph/pipeline/analysis.
- Data/auth/cloud: Firebase Auth, Firestore, Cloud Storage, Vertex AI, BigQuery,
  Pub/Sub, Cloud Tasks, Cloud Functions, Cloud Scheduler, Secret Manager,
  Cloud Build, Cloud Run.
- Current validation on 2026-04-29:
  - `npx tsc --noEmit`: passed.
  - Targeted ESLint for grounded-search, research-extract, web-research, live
    source pack, and demo fallback paths: passed.
  - `npx vitest run tests/unit/lib/ai/situation-intelligence-schema.test.ts`:
    passed, covering geopolitical, corporate conflict, and policy memo output
    contracts.
  - `npm run build`: passed; Next.js still reports the existing
    `middleware` file convention deprecation.
  - `npm run lint`: passed with existing warnings; no lint errors.
  - `npm run audit:routes`: passed, 62 AI routes calibrated and 5 exempt.
  - `npm run audit:tools`: passed and updated
    `docs/audits/tools-2026-04-29.md`; `grounded-search` is now 6/11 and
    `research-extract` is 6/11.
  - `npm run audit:gcp`: passed, 0 hard failures and 0 soft warnings.
  - GCP audit enforcement wave: Cloud Build audit IAM granted, `_AUDIT_GCP_SKIP`
    flipped to `0`, and the audit now checks Firecrawl, Parallel, UCDP, and
    Vertex Agent Engine secrets.
  - Shared AI safeguard tests:
    `npx vitest run tests/unit/lib/api/with-calibration.test.ts` passed
    with malformed JSON, excessive message history, and oversized request
    rejection before credit deduction or model calls.

## Agentic Loop

Repeat this loop for every slice:

1. Understand: read the relevant docs and route/component contracts.
2. Run: start the app or use targeted tests before editing when practical.
3. Test as real users: exercise one persona and one concrete workflow.
4. Identify issues: write exact symptoms, route, console, or data path.
5. Fix: keep changes scoped to the failing workflow.
6. Validate: run focused tests plus the needed global checks.
7. Document: update this file, `CHANGELOG.md`, and any affected runbook.
8. Repeat: continue until no high-impact issues remain or a blocker is real.

After every change, ask: does this make PRAXIS clearer, more useful, or more
trustworthy for a real user?

## Critical Tasks

- [ ] Raise all 62 AI tools to the acceptable baseline.
  - Latest audit: `docs/audits/tools-2026-04-29.md`.
  - Current result: 2/62 tools meet the 10/11 calibration metadata bar.
  - Important nuance: `ask-praxis` is a re-export of `chat`, so the audit
    undercounts that route; still, the action item is real.
  - Baseline required for every user-facing tool button: calibrated route,
    useful grounded-search or situation-context injection, schema where the
    output is structured, persistence, visible source/confidence state, and
    non-empty degraded result when optional providers fail.
  - Progress this wave: `grounded-search` now uses the correct calibrated
    tool id and credit operation, validates requests, and writes a streamed
    provenance trace; `research-extract` now validates input, uses the live
    source pack, and persists extraction metadata.
  - Next priority tools: deep-research source receipts, extract-episodes
    persistence, terminology persistence, report schema/provenance, and
    browser-regression coverage for Ask PRAXIS.
  - Progress this wave: audit now scores delegated `ask-praxis` from the chat
    implementation; `terminology`, `extract-episodes`, `deep-research`, and
    `deep-search-agent` gained validation and/or canonical persistence.

- [ ] Complete canonical tool-output envelope migration.
  - Progress this wave: `saveToolOutput` writes canonical versioned
    `tool-data/{toolId}` envelopes plus legacy `tools/{toolId}` compatibility
    docs; Export Center reads both and labels canonical vs legacy exports.
  - Next: migrate direct `writeToolDataServer` paths and add source receipts,
    model/provider, and output-path telemetry to every flagship route.

- [x] Fix the first Ask PRAXIS demo trust failure found by browser testing.
  - Browser path: `/login?mode=demo` -> `/demo/dashboard` -> `/demo/assistant`.
  - Finding: after dismissing the welcome modal, a realistic risk/evidence/
    mediator prompt returned the generic greeting when no live AI key was
    configured.
  - Fix: added a targeted Nordalia demo fallback for risk/evidence/mediation
    prompts and expanded the demo intent router.
  - Verification: `agent-browser` confirmed the same prompt now returns
    a concrete three-bullet answer with risk, evidence basis, mediator next
    question, and no visible AI error text.

- [x] Implement the first PRAXIS executive intelligence slice.
  - Files: `src/app/api/ai/situation-intelligence/route.ts`,
    `src/lib/ai/schemas/situation-intelligence.ts`,
    `src/components/dashboard/executive-intelligence-panel.tsx`,
    `src/app/app/dashboard/page.tsx`.
  - Delivers: executive diagnosis, strategic insight, causal timeline, actor
    dossiers, best/likely/worst scenarios, derived risk score, concrete
    actions, lightweight memory, live graph primitives, provenance, JSON
    export, and confidence handling.
  - Verification so far: `npx tsc --noEmit`, targeted ESLint, and schema
    Vitest passed. Real authenticated browser and live AI smoke remains open.

- [x] Harden Executive Intelligence as a production-grade registered tool.
  - Plan/report:
    `docs/PRAXIS_ITERATION_WAVE_2026-04-29_EXEC_INTEL_HARDENING.md`.
  - Done: registry entry, explicit `ai_situation_intelligence` metering,
    server-side `tool-data` persistence, controlled schema/generation errors,
    role recommendation deep-link, and source-claim cleanup in registry/docs/
    landing tour surfaces.
  - Verification: focused route, schema, and recommendation tests passed;
    typecheck passed.

- [ ] Execute the 15 app-wide high-impact initiatives.
  - Plan: `docs/PRAXIS_15_APP_WIDE_IMPROVEMENTS_2026-04-29.md`.
  - First pass started: public source claims, hero promise, sample-workspace CTA,
    situation creation language, AnalystProfile-to-situation role defaults, and
    public credit-cost copy.
  - Done when: each initiative has code/docs changes, a persona workflow,
    validation evidence, and updated handoff docs.

- [x] Run persona QA wave 1 and fix the highest-impact demo trust issue.
  - Plan/report: `docs/PRAXIS_PERSONA_QA_WAVE_2026-04-29.md`.
  - Personas covered: first-time user, serious customer, returning user, power
    user, and skeptical security/trust reviewer.
  - Done: stale demo positioning removed from active demo UI, demo dashboard
    brief no longer exposes admin AI-provider setup failure, and Ask PRAXIS
    product framing now matches the current PRAXIS mission.
  - Follow-up: script the persona matrix with browser assertions and add mobile
    plus slow-network checks.

- [x] Run sophisticated persona wave 2 and start the 35-item trust roadmap.
  - Plan/report:
    `docs/PRAXIS_SOPHISTICATED_PERSONA_WAVE_2026-04-29.md`.
  - Personas covered: policy director, mediator/envoy analyst, intelligence
    analyst, enterprise buyer, and skeptical security/trust reviewer.
  - Done: landing credibility pass, sanctions no-training-data fallback,
    demo sanctions metadata, export source footer hardening, and live-site
    parity findings.
  - Follow-up: implement append-only tool run history, source receipts,
    grounded-search receipts, demo route regression tests, and deploy parity.

- [ ] Execute Superplan Loop 1: public identity and first-run clarity.
  - Plan: `docs/PRAXIS_SUPERPLAN_2026-04-29.md`.
  - Subagents: Identity UX worker plus QA explorer.
  - Done when: retired/conflicting source claims are removed, plan taxonomy is
    consistent, core "case" language is normalized to "situation", and landing
    smoke passes.

- [ ] Execute Superplan Loop 2: browser QA foundation.
  - Plan: `docs/PRAXIS_SUPERPLAN_2026-04-29.md`.
  - Subagents: QA worker plus AI Evidence explorer.
  - Done when: route smoke inventory is current, golden path checks generation
    and persistence, and at least one flagship tool is proven useful, cited,
    saved, and reloadable.

- [ ] Execute Superplan Loop 3: security and deploy safety.
  - Plan: `docs/PRAXIS_SUPERPLAN_2026-04-29.md`.
  - Subagents: Security Cloud worker plus Platform Ops worker.
  - Done when: Cloud Build audit fails closed, Firestore/Storage rules have
    emulator coverage, and backend trust-boundary smoke tests are documented.

- [ ] Rotate local workstation secrets and update Secret Manager.
  - Why: local `.env.local` has contained live provider credentials.
  - Owner: human/operator, with agent support for inventory only.
  - Done when: old Firebase/Polar/Firecrawl/Parallel/Gemini keys are revoked,
    new values are in Secret Manager, local env is refreshed, and health checks
    still pass.

- [ ] Automate Firestore rules and indexes deployment in the deploy gate.
  - Why: rules/index drift can break auth, storage, and queries after app
    deploys.
  - Files: `firebase.json`, `firestore.rules`, `firestore.indexes.json`,
    `cloudbuild.yaml`, `docs/GCP_OPERATIONS.md`.
  - Done when: Cloud Build either deploys rules/indexes or blocks on a drift
    preflight with a clear operator action.

- [ ] Enforce `npm run audit:gcp` in Cloud Build without skip flags.
  - Why: infrastructure drift must fail before production deploy, not after.
  - Files: `cloudbuild.yaml`, `scripts/audit-gcp.mjs`,
    `infrastructure/grant-cloudbuild-audit-iam.sh`.
  - Progress this wave: Cloud Build service account received read-only audit
    roles and `_AUDIT_GCP_SKIP` now defaults to `0`.
  - Done when: a full Cloud Build deploy proves the enforced audit passes
    under the build service account.

- [ ] Smoke-test the five recently uplifted tools end-to-end on a real
  situation.
  - Tools: Ask PRAXIS, Dashboard, Conflict Graph, Risk Monitor/Timeline,
    Briefing.
  - Test data: authenticated user with Nordalia or a new real situation.
  - Done when: `docs/TOOL_QUALITY_AUDIT_2026-04-28.md` records works,
    non-empty, provenance/citation, saved, reload behavior, and exact defects.

- [ ] Complete grounded-search-first intelligence spine.
  - Plan: `docs/PRAXIS_GROUNDED_SEARCH_INTELLIGENCE_SPINE_2026-04-29.md`.
  - First pass done: active aggregators now run grounded Google Search as the
    primary live intelligence path; Source Monitor lists grounded search first;
    active paid ACLED provider/runtime paths were removed or relabeled; UCDP
    now uses the authenticated token path and appears as visible feed items.
  - Next: persist source evidence records, expose source/provider badges,
    add scrape-on-demand via Firecrawl, add Parallel.ai second-lens enrichment,
    and connect extracted fragments to Conflict Grammar graph nodes.

- [ ] Browser-smoke the new Executive Intelligence panel with real AI.
  - Test cases: geopolitical situation, corporate conflict, policy memo.
  - Done when: each generation succeeds with live provider credentials, output
    is non-empty, graph nodes are clickable, provenance references source
    fragments, export JSON contains the current timestamp and sections, output
    saves to `tool-data/situation-intelligence`, and reload restores it.

- [ ] Complete the tool-output storage migration.
  - Why: `tool-data/{toolId}` and `tools/{toolId}` still coexist, which creates
    retrieval misses and confusing persistence.
  - Files: `src/lib/api/save-tool-output.ts`,
    `src/lib/firebase/tool-data-service.ts`,
    `src/lib/knowledge/evidence-envelope.ts`,
    `src/lib/knowledge/tool-output-layer.ts`,
    `src/hooks/use-persisted-tool-data.ts`.
  - Done when: flagship tools write/read one canonical envelope, legacy paths
    migrate or backfill, and Ask PRAXIS cites saved outputs reliably.

- [ ] Keep the Python backend private and verify every browser-facing backend
  workflow goes through a Next.js API bridge.
  - Files: `src/lib/api/praxis-backend.ts`,
    `src/lib/api/praxis-backend-server.ts`,
    `src/app/api/backend/[...path]/route.ts`,
    `backend/auth.py`, `next.config.ts`.
  - Done when: no browser component depends on private Cloud Run URLs and the
    allowlist covers only intended user-scoped paths.

## High-Impact Product Work

- [ ] Add Core-8 coverage warnings to Ask PRAXIS.
  - User value: analysts see when an answer is based on a graph missing claims,
    interests, constraints, leverage, commitments, events, or narratives.
  - Done when: Ask PRAXIS can surface a compact "graph coverage is thin" cue
    and suggest the next extraction/research action.

- [ ] Add Core-8 and evidence coverage to corpus traces.
  - User value: every retrieval result becomes auditable by source, age,
    primitive coverage, and confidence.
  - Done when: corpus search returns source age, source type, coverage gaps,
    and a stable citation handle.

- [ ] Build a Situation Health dashboard.
  - Include: graph coverage, source freshness, retrieval health, tool failures,
    extraction failures, citation coverage, missing evidence, and stale outputs.
  - User value: one trust score before the user relies on generated analysis.

- [ ] Improve first-time user "aha" from situation creation to first output.
  - Flow: sign up -> onboarding -> create situation -> dashboard -> first
    cited output -> recommended next action.
  - Done when: a non-technical user can reach value without understanding
    tool IDs, provider keys, or graph internals.

- [ ] Add sample/demo data controls inside the real app.
  - User value: users can evaluate PRAXIS with a safe situation before adding
    sensitive material.
  - Constraint: demo content must never leak into real user situations unless
    explicitly selected.

- [ ] Make empty states role-aware and domain-aware.
  - User value: "As a mediator working on a diplomacy situation, start with..."
    is more useful than generic "Create or select a situation."
  - Files: `src/components/praxis/no-situation-state.tsx`,
    `src/components/praxis/onboarding-required-state.tsx`,
    `src/components/praxis/situation-dashboard.tsx`.

- [ ] Normalize the plan/subscription language.
  - Known issue: some copy uses Institution while client/server types use
    `enterprise`.
  - Done when: public pricing, Firestore tier resolution, checkout, and UI
    labels are aligned.

- [ ] Add an export/share audit trail.
  - User value: PDF/DOCX/briefing exports should carry source provenance,
    profile version, model, generated time, and limits.

- [ ] Create an operator-visible "user success" panel.
  - Include: failed signups, onboarding drop-offs, first-output failures,
    empty tool outputs, provider health, and recent support-relevant errors.

## Persona Testing Backlog

- [ ] First-time user: create account, complete onboarding, create situation,
  generate first dashboard output, understand what to do next.
- [ ] Serious customer: import documents, run Briefing, Risk Monitor, Conflict
  Graph, export a brief, inspect provenance, and reload.
- [ ] Returning user: reopen an existing situation, identify what changed since
  last session, continue from saved outputs, and generate next actions.
- [ ] Power user: run multiple tools, compare outputs, use Ask PRAXIS over
  saved artifacts, export/report, and inspect graph updates.
- [ ] Admin/operator: open diagnostics, operator console, system health,
  provider readiness, failed jobs, and user credit/subscription controls.
- [ ] Security reviewer: verify auth gates, admin allowlist, Firestore rules,
  storage rules, secrets handling, API validation, and backend trust boundary.
- [ ] Non-technical user: read landing page, sign in, create a situation,
  understand terminology, and recover from an error without developer context.

For each persona, record:

- Route path and account state.
- Exact action sequence.
- Console/network/API failures.
- Empty/loading/error states.
- Trust/confusion gaps.
- Whether output was useful, cited, saved, and reloadable.

## Core Workflow QA

- [ ] Auth: Google OAuth, email/password if enabled, demo mode, logout,
  expired session, invalid session, admin gate, non-admin denial.
- [ ] Onboarding: identity, perspective, working style, skip path, profile
  snapshots, live profile refresh, profile edit.
- [ ] Situations: create, classify domain, inspect, settings, graph, recent
  tools, source coverage, delete/archive if available.
- [ ] Documents: upload, extract, retrieve, Cloud Storage durability, checksum,
  error recovery, large file limits, storage rules.
- [ ] Dashboard: selected situation, launchpad, readiness, tool status,
  recommended tools, activity feed.
- [ ] Ask PRAXIS: calibrated context, citations, saved prior outputs,
  empty response handling, missing provider fallback, limits disclosure.
- [ ] Briefing/reporting: generate, edit, regenerate block, cite, export,
  reload, share, provenance.
- [ ] Graph: auto-populate staged, review diff, approve/discard, Core-8
  coverage, graph backend connection, Firestore fallback.
- [ ] Admin: users, domains, diagnostics, operator console, advisor feed,
  credits, provider health, audit events.
- [ ] APIs: request validation, standard errors, rate/tier behavior, safe
  logging, no raw secrets, no internal costs in public UI.
- [ ] Mobile: onboarding, dashboard, sidebar, major tool pages, modals,
  exports, error states.
- [ ] Slow network: loading skeletons, retry actions, idempotency, no duplicate
  charges or duplicate graph writes.

## Engineering Quality

- [ ] Replace the deprecated Next `middleware` convention with the supported
  `proxy` convention after a focused auth/routing test plan.
  - Current signal: `npm run build` still warns that `middleware` should become
    `proxy`.
  - Constraint: this touches auth, redirects, CSP, and route protection, so it
    needs focused Playwright and API route checks.

- [ ] Reduce the existing lint warning backlog by workflow area.
  - Current signal: `npm run lint` passes with warnings, including unused code,
    React hook dependency warnings, set-state-in-effect warnings, and some
    purity/static-component warnings.
  - Constraint: avoid broad mechanical churn; fix warnings when they are in
    touched files or when they affect user-visible reliability.

## AI and LLM Quality

- [ ] Confirm all AI routes remain wrapped by `withCalibration` or are
  documented as exempt.
- [ ] Verify audience tone presets affect dashboard, auto-briefing, and
  briefing generation when enabled.
- [ ] Add hallucination checks for claims that lack source receipts.
- [ ] Make limits visible: live source availability, stale feeds, missing
  provider keys, graph coverage gaps, and confidence level.
- [ ] Add regression fixtures for "same situation, different audience" and
  "same user, different domain" prompt behavior.
- [ ] Save model, prompt version, profile version, source receipts, and output
  schema version with every generated artifact.
- [ ] Move long-running research/agent tasks out of synchronous request paths
  into Cloud Tasks plus durable checkpoints.

## Firebase and GCP Tasks

- [ ] Deploy and smoke-test Vertex AI Agent Engine; set
  `VERTEX_AGENT_ENGINE_ID` only after the engine works.
- [ ] Configure Polar production billing: access token, webhook secret,
  product IDs, webhook events, checkout success, portal, entitlement mirror.
- [ ] Add budget alerts for Vertex, BigQuery, Firecrawl/Parallel if enabled,
  Cloud Run, and Cloud Functions.
- [ ] Add BigQuery operational marts for tool runs, background jobs, model
  cost, provider failures, source freshness, and user activation.
- [ ] Store original document binaries in Cloud Storage with checksum and
  metadata references.
- [ ] Review Storage rules for read/write separation and document ownership.
- [ ] Verify TTL policies for `tool_runs`, `background_jobs`, `system_events`,
  notifications, and alerts.
- [ ] Keep Cloud Run backend private; periodically test unauthenticated access
  fails.

## Security Tasks

- [ ] Confirm no secrets are committed or logged.
- [ ] Keep `COOKIE_SIGNING_SECRET`, Firebase Admin credentials, Polar secrets,
  provider keys, and user-key master only server-side.
- [ ] Verify all admin APIs require authenticated admin sessions, not only
  shared secrets.
- [ ] Verify destructive routes require explicit confirmation bodies.
- [ ] Add or keep tests around `with-auth`, admin gates, cookie signing,
  Firebase rules, storage rules, and backend OIDC trust.
- [ ] Add App Check or equivalent abuse controls for high-cost endpoints.
- [x] Add shared pre-model request safeguards for calibrated AI routes.
  - Done: `withCalibration()` rejects malformed JSON, payloads over 750 KB,
    more than 50 chat messages, and aggregate text over 250k characters before
    onboarding, credits, tool-run creation, calibration, or model calls.
  - Visibility: `/api/health` and `/api/health/diagnostics` expose non-secret
    safeguard limits for operator verification.
  - Follow-up: add per-tier concurrency controls for long-running agent routes
    and tune limits from production telemetry.
- [ ] Document incident response: key rotation, user notification, provider
  revocation, and deploy rollback.

## Documentation Tasks

- [ ] Keep `README.md` as the high-level product and architecture index.
- [ ] Keep `CLAUDE.md` as the agent operating guide.
- [ ] Keep `AGENTS.md` as the Codex entrypoint.
- [ ] Keep this `TODO.md` current after each completed task.
- [ ] Keep `ARCHITECTURE.md`, `DEPLOYMENT.md`, `TESTING.md`, and
  `SECURITY.md` aligned with deeper docs.
- [ ] Update `CHANGELOG.md` for every code or runbook change.
- [ ] Update `docs/TOOL_QUALITY_AUDIT_2026-04-28.md` during browser tool
  audits.
- [ ] Update `docs/GCP_OPERATIONS.md` when deploy, secrets, IAM, or billing
  procedures change.

## Future Roadmap

- [ ] Enterprise audit console for data access, AI outputs, approvals, exports,
  and admin actions.
- [ ] Organization/team workspaces with shared situations and shared corpora.
- [ ] Managed RAG path using Vertex AI Search/RAG Engine for large corpora.
- [ ] Dedicated `praxis-agents` Cloud Run service for durable orchestration.
- [ ] Graph analytics scale path through Spanner Graph, Neo4j, or another
  dedicated graph backend.
- [ ] Public/internal policy chatbot deployment over curated PRAXIS corpora.
- [ ] SOC 2/DPA/procurement pack: subprocessors, retention, audit logging,
  data residency, incident response, security architecture.
