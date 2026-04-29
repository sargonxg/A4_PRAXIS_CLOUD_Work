# PRAXIS Superplan — Identity, Product Quality, Testing, Cloud, Security

Status: active master execution plan.
Created: 2026-04-29.
Workspace: `C:\Users\giuli\praxiscodexworking`.
Remote: `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`.

This plan turns the current PRAXIS backlog into a verifiable multi-agent
execution program. It is intentionally concrete: every task names the product
reason, suggested owner lane, files to inspect or touch, acceptance criteria,
and proof required before the task can be marked done.

## Mission

PRAXIS should feel like the operating room for policy professionals: a
situation-first workspace where diplomats, mediators, humanitarian leads,
legal/sanctions analysts, researchers, and operators can produce defensible,
role-aware, cited work from messy sources without guessing what to do next.

The work below prioritizes:

1. Broken or risky core flows.
2. Security and cloud deploy safety.
3. First-run clarity and product identity.
4. AI output trust, provenance, and persistence.
5. Browser/persona testing.
6. Performance, accessibility, mobile quality, and polish.

## Subagent Operating Model

Use subagents only for bounded, parallel work. Each subagent must return exact
file references, risks, acceptance criteria, and tests. Workers that edit code
must own disjoint write scopes and must not revert unrelated edits.

Recommended lanes:

| Lane | Subagent type | Owns | Does not own |
|---|---|---|---|
| Identity UX | explorer or worker | Landing copy, first-run language, onboarding clarity, role paths, empty states | Auth internals, billing webhooks, backend auth |
| QA Automation | explorer or worker | Playwright, Vitest, route smoke scripts, persona test docs, evidence recording | Product copy decisions except test assertions |
| Security Cloud | explorer or worker | Firebase rules, Storage rules, backend OIDC, Cloud Build gates, audits | Landing/onboarding copy |
| AI Evidence | explorer or worker | AI route schemas, source receipts, tool-output envelope, Ask PRAXIS retrieval | Billing provider setup |
| Platform Ops | explorer or worker | Cloud Tasks, operational spine, system events, dashboards, alert policies | Persona copy |
| Documentation | worker | README, TODO, runbooks, changelog, continuation handoff | Runtime behavior unless paired with an implementation lane |

Parallelization rules:

- Identity UX and QA Automation can run together if QA only adds specs and does
  not edit the same components.
- Security Cloud and Platform Ops can run together if one owns Firebase/GCP
  deploy gates and the other owns observability/runtime docs.
- AI Evidence can run in parallel with Identity UX only if UI copy and AI route
  output contracts are coordinated before final merge.
- Documentation should run last in each loop to reflect what actually changed.

## Verification Standard

A task is not done until all required evidence is recorded:

- Commands run and outcome.
- Browser route or API endpoint tested.
- Account/persona used.
- Test data or fixture used.
- Output was useful, non-empty, cited/provenanced where applicable, saved to
  the expected durable path, and reloadable.
- Known warnings or residual risks documented.

Do not mark untested as tested.

## Phase 0 — Baseline Gate

Purpose: start every sprint with an honest baseline.

- [ ] P0 Run local git and dependency baseline.
  - Owner lane: Documentation or Platform Ops.
  - Commands:
    - `git status --short --branch`
    - `git remote -v`
    - `npm install` if dependencies changed.
  - Done when: branch, remote, dirty files, and dependency changes are
    recorded in the working note or final report.

- [ ] P0 Run non-browser validation gate.
  - Owner lane: QA Automation.
  - Commands:
    - `npx tsc --noEmit`
    - `npm run build`
    - `npm run lint`
    - `npm run audit:routes`
    - `npm run audit:gcp`
    - `npx vitest run`
  - Done when: failures are either fixed or logged as blockers with exact
    command output. Lint warnings may remain only if listed as known debt.

- [ ] P0 Run backend validation when backend/auth/graph code changes.
  - Owner lane: Security Cloud or Platform Ops.
  - Commands:
    - `cd backend`
    - `python -m pytest`
  - Done when: backend pytest passes or failures are linked to exact touched
    files.

- [ ] P0 Start local dev server for browser work.
  - Owner lane: QA Automation.
  - Command: `npm run dev`
  - Done when: local URL, port, and any startup warnings are recorded.

## Phase 1 — Product Identity and Public Trust

Purpose: make PRAXIS instantly legible and internally consistent.

- [ ] P0 Remove retired or conflicting data-source claims.
  - Owner lane: Identity UX.
  - Files to inspect/touch:
    - `src/components/landing/hero.tsx`
    - `src/app/(landing)/page.tsx`
    - `src/components/landing/*`
    - `docs/VISION_2026.md`
    - `docs/STRATEGY.md`
    - `README.md`
  - Problem: some public/demo copy still mentions retired or legally risky
    source assumptions while strategy says open-data/Google-native.
  - Done when: public landing, JSON-LD, demo previews, and docs only claim
    currently supported or explicitly planned data sources.
  - Verification: search for retired vendor names and record intentional
    historical-only mentions.

- [ ] P0 Normalize pricing and plan identity.
  - Owner lane: Identity UX plus Security Cloud for entitlement fields.
  - Files:
    - `src/lib/constants/pricing.ts`
    - `src/app/pricing/page.tsx`
    - `src/components/landing/pricing-teaser.tsx`
    - `src/lib/api/tier.ts`
    - `src/lib/auth/auth-context.tsx`
    - `TODO.md`
  - Done when: the taxonomy is consistent: `free`, `analyst`, `team`,
    `enterprise`; public label may say "Institution" only if mapped clearly to
    `enterprise`.
  - Verification: landing, pricing page, login upgrade links, plan badge,
    checkout route, and JSON-LD show no mismatched prices or labels.

- [ ] P0 Clarify the hero promise above the fold.
  - Owner lane: Identity UX.
  - Files:
    - `src/components/landing/hero.tsx`
    - `src/components/landing/hero-quadrant-tour.tsx`
    - `src/components/landing/live-platform-preview.tsx`
  - Done when: a first-time policy user can answer: what is PRAXIS, what do I
    do first, and what valuable output will I get?
  - Verification: browser screenshot at desktop and mobile; copy review against
    `docs/STRATEGY.md` product promise.

- [ ] P0 Rename generic "case" creation to "situation" creation where PRAXIS
  means the core unit of work.
  - Owner lane: Identity UX.
  - Files:
    - `src/components/onboarding/case-creation-wizard.tsx`
    - `src/app/app/situations/new/page.tsx`
    - `src/components/app/situation-selector.tsx`
  - Done when: user-facing core workspace language consistently says
    "situation"; "case" remains only for legal/research domain concepts where
    intentional.
  - Verification: `rg "Create New Case|Launch Case|case file|Case"` and manual
    review of intentional exceptions.

- [ ] P0 Preserve onboarding role into situation creation.
  - Owner lane: Identity UX or AI Evidence.
  - Files:
    - `src/components/onboarding/case-creation-wizard.tsx`
    - `src/lib/firebase/situations.ts`
    - `src/lib/dashboard/role-recommendations.ts`
  - Done when: a mediator, humanitarian lead, diplomat, or sanctions analyst
    sees role-consistent recommendations immediately after situation creation.
  - Verification: unit test or Playwright fixture for two roles creating the
    same situation and receiving different top recommendations.

- [ ] P0 Make AI-assist failures visible during situation creation.
  - Owner lane: Identity UX.
  - Files:
    - `src/components/onboarding/case-creation-wizard.tsx`
    - `src/app/api/ai/auto-structure/route.ts`
  - Done when: actor extraction or auto-structure failures show a calm inline
    fallback with manual entry guidance.
  - Verification: mocked 500/timeout shows no stuck spinner and no silent
    failure.

- [ ] P1 Make demo versus real workspace explicit.
  - Owner lane: Identity UX.
  - Files:
    - `src/components/onboarding/demo-mode-banner.tsx`
    - `src/components/onboarding/welcome-modal.tsx`
    - `src/app/demo/*`
    - `README.md`
  - Done when: demo surfaces say synthetic/sample workspace, real app surfaces
    say user data/situation, and no demo data appears in real situations unless
    explicitly selected.
  - Verification: browser test for `/demo` and `/app` copy separation.

- [ ] P1 Add explicit sample-data control inside the real app.
  - Owner lane: Identity UX plus QA Automation.
  - Files:
    - `src/components/app/situation-selector.tsx`
    - `src/app/app/situations/new/page.tsx`
    - `src/lib/demo/demo-mode.ts`
    - `src/lib/services/situation-initializer.ts`
  - Done when: authenticated users can create a clearly labeled sample
    situation without entering demo mode.
  - Verification: sample situation is labeled synthetic and never merges into a
    real situation unless selected by the user.

- [ ] P1 Reduce sidebar overload with role paths.
  - Owner lane: Identity UX.
  - Files:
    - `src/components/app/app-sidebar.tsx`
    - `src/lib/dashboard/role-recommendations.ts`
    - `src/lib/navigation/tool-preferences.ts`
  - Done when: a new user sees role-relevant first actions before long-tail
    tools, while power users can still reach the full catalog.
  - Verification: sidebar snapshot for UN officer, mediator, humanitarian lead,
    sanctions analyst, and researcher.

- [ ] P1 Hide admin/system surfaces from non-admin users.
  - Owner lane: Identity UX plus Security Cloud.
  - Files:
    - `src/components/app/app-sidebar.tsx`
    - `src/lib/auth/admin-gate.ts`
    - `src/app/app/admin/layout.tsx`
  - Done when: non-admin users do not see admin/operator/system-health
    surfaces in navigation, and direct route access still returns denied.
  - Verification: Playwright admin and non-admin route/nav matrix.

- [ ] P1 Clean in-app changelog/release-note copy.
  - Owner lane: Identity UX.
  - Files:
    - `src/components/app/app-sidebar.tsx`
    - any in-app release note component.
  - Done when: user-facing release notes do not mention stale credits, retired
    providers, or unsupported claims.
  - Verification: search for retired/provider/credit language in user-facing
    component text.

- [ ] P2 Align landing role paths with the ten strategic role paths.
  - Owner lane: Identity UX.
  - Files:
    - `src/components/landing/use-case-cards.tsx`
    - `src/lib/constants/onboarding-chips.ts`
    - `src/lib/dashboard/role-recommendations.ts`
  - Done when: every strategic role either appears in landing/onboarding/
    recommendations or has a documented reason for exclusion.
  - Verification: role-path mapping table in docs and UI route screenshots.

## Phase 2 — First-Run Activation

Purpose: make a new user reach first value quickly.

- [ ] P0 Build "first cited output" path after onboarding.
  - Owner lane: Identity UX plus AI Evidence.
  - Files:
    - `src/app/onboarding/page.tsx`
    - `src/components/onboarding/completion-success.tsx`
    - `src/components/praxis/situation-dashboard.tsx`
    - `src/components/dashboard/situation-launchpad.tsx`
  - Done when: a new free user can complete onboarding, create a situation,
    and generate one cited output in under 5 minutes without knowing tool names.
  - Verification: Playwright first-time-user spec with timestamps and output
    provenance assertion.

- [ ] P0 Strengthen onboarding-required payoff.
  - Owner lane: Identity UX.
  - Files:
    - `src/components/praxis/onboarding-required-state.tsx`
  - Done when: blocked tools explain what onboarding unlocks: role-aware
    recommendations, audience tone, red lines, citation discipline, and saved
    context.
  - Verification: screenshots for unauthenticated, incomplete onboarding, and
    completed onboarding states.

- [ ] P1 Make empty states role-aware and domain-aware.
  - Owner lane: Identity UX.
  - Files:
    - `src/components/praxis/no-situation-state.tsx`
    - `src/components/praxis/onboarding-required-state.tsx`
    - `src/components/praxis/situation-dashboard.tsx`
  - Done when: empty states change based on AnalystProfile role/domain.
  - Verification: component tests or Playwright fixtures for mediator versus
    humanitarian lead.

- [ ] P1 Make dashboard quick actions role-specific.
  - Owner lane: Identity UX.
  - Files:
    - `src/components/praxis/situation-dashboard.tsx`
    - `src/components/dashboard/situation-launchpad.tsx`
    - `src/lib/dashboard/role-recommendations.ts`
  - Done when: different personas get different first three actions on the
    same situation.
  - Verification: unit test for recommendation ordering and browser screenshot.

- [ ] P1 Remove public credit-cost language from non-admin UI.
  - Owner lane: Identity UX plus Security Cloud.
  - Files:
    - `src/components/praxis/no-data-state.tsx`
    - `src/components/praxis/situation-onboarding.tsx`
    - `src/components/dashboard/account-status-card.tsx`
    - `src/app/pricing/page.tsx`
  - Done when: non-admin product UI uses plan/limit language, not internal
    credit-cost mechanics.
  - Verification: `rg "credits|TACITUS Credits|cost"` with reviewed,
    intentional exceptions.

## Phase 3 — Evidence, AI Quality, and Output Trust

Purpose: every AI output should be defensible, inspectable, and reusable.

- [ ] P0 Add source receipts, confidence, and limitations to flagship routes.
  - Owner lane: AI Evidence.
  - Files:
    - `src/app/api/ai/risk-assessment/route.ts`
    - `src/app/api/ai/briefing-generate/route.ts`
    - `src/app/api/ai/stakeholder-map/route.ts`
    - `src/app/api/ai/ask-praxis/route.ts`
    - `src/lib/ai/schemas/*`
  - Done when: flagship route outputs carry structured `sources`,
    `confidence`, `limitations`, and stale/degraded source indicators.
  - Verification: unit tests reject unsupported claims and empty source arrays
    where source-backed claims are required.

- [ ] P0 Add Core-8 coverage warnings to Ask PRAXIS and corpus traces.
  - Owner lane: AI Evidence.
  - Files:
    - `src/lib/graph/core-primitives.ts`
    - `src/lib/intelligence/corpus-search.ts`
    - `src/app/api/ai/ask-praxis/route.ts`
    - `src/components/assistant/*`
  - Done when: Ask PRAXIS warns when graph coverage is thin and suggests the
    next action for missing Actor, Claim, Interest, Constraint, Leverage,
    Commitment, Event, or Narrative coverage.
  - Verification: saved graph fixture with missing primitives produces visible
    warning and retrieval metadata.

- [ ] P0 Complete tool-output storage migration.
  - Owner lane: AI Evidence plus QA Automation.
  - Files:
    - `src/lib/api/save-tool-output.ts`
    - `src/lib/firebase/tool-data-service.ts`
    - `src/lib/knowledge/evidence-envelope.ts`
    - `src/lib/knowledge/tool-output-layer.ts`
    - `src/hooks/use-persisted-tool-data.ts`
  - Done when: flagship tools write and read one canonical envelope while
    legacy paths are migrated or safely backfilled.
  - Verification: generate tool, reload page, Ask PRAXIS cites the saved output
    with stable citation handle.

- [ ] P1 Persist full deep-research outputs and citations.
  - Owner lane: AI Evidence.
  - Files:
    - `src/app/api/ai/deep-search-agent/route.ts`
    - `src/lib/ai/vertex-agent.ts`
    - `src/lib/knowledge/evidence-envelope.ts`
  - Done when: saved deep-research output includes final answer, sources,
    fallback reason, session id, retrieval trace, and generated time.
  - Verification: deep-search response and persisted Firestore record contain
    the same stable artifact ID.

- [ ] P1 Scope Vertex agent sessions by user and situation.
  - Owner lane: AI Evidence plus Security Cloud.
  - Files:
    - `src/app/api/ai/deep-search-agent/route.ts`
    - `src/lib/ai/vertex-agent.ts`
  - Done when: agent sessions are stored under user/situation scope with TTL
    and no cross-situation memory bleed.
  - Verification: tests attempt cross-situation retrieval and fail closed.

- [ ] P1 Add explicit hallucination and unsupported-claim eval fixtures.
  - Owner lane: AI Evidence plus QA Automation.
  - Files:
    - `tests/services/*`
    - `tests/unit/lib/ai/*`
    - `src/lib/ai/schemas/*`
  - Done when: route/schema tests fail if a generated artifact includes claims
    without receipts or confidence/limits.
  - Verification: failing fixture and passing fixture are committed.

## Phase 4 — Browser and Persona Testing

Purpose: prove real workflows, not only route compilation.

- [ ] P0 Add mandatory staging-auth Playwright lane.
  - Owner lane: QA Automation.
  - Files:
    - `playwright.config.ts`
    - `.github/workflows/*`
    - `tests/e2e/*`
  - Done when: CI/staging mode fails if authenticated golden path is skipped.
  - Verification: skip count is zero in staging run; missing fixture env fails
    with clear setup error.

- [ ] P0 Expand golden path beyond page headings.
  - Owner lane: QA Automation.
  - Files:
    - `tests/e2e/golden-path.spec.ts`
    - `docs/golden-path.md`
  - Done when: the test signs in, completes onboarding or uses a seeded user,
    creates/selects a situation, opens dashboard, runs Risk Monitor, Early
    Warning, and Stakeholder Map, then checks useful output.
  - Verification: screenshots, console logs, network logs, output JSON shape,
    and Firestore/tool-data IDs recorded.

- [ ] P0 Correct tool route smoke inventory.
  - Owner lane: QA Automation.
  - Files:
    - `scripts/verify-tools.ts`
    - `src/lib/constants/tool-registry.ts`
  - Done when: route smoke derives current routes from the registry and no
    longer references stale route names.
  - Verification: route diff report and PASS/AUTH/FAIL summary.

- [ ] P0 Add tool persistence e2e spec.
  - Owner lane: QA Automation plus AI Evidence.
  - Files:
    - `tests/e2e/tool-persistence.spec.ts`
    - `src/hooks/use-persisted-tool-data.ts`
    - `src/app/api/tool-data/route.ts`
  - Done when: generating a tool writes `/api/tool-data`, reloading reads it
    without regenerating, and output remains visible.
  - Verification: trace shows POST then GET, generatedAt/version, reload
    screenshot.

- [ ] P0 Add empty-output regression spec.
  - Owner lane: QA Automation.
  - Files:
    - `tests/e2e/empty-output.spec.ts`
    - `src/components/praxis/ai-populate.tsx`
  - Done when: a 2xx empty AI response shows a visible error and does not save.
  - Verification: no `/api/tool-data` POST and visible error assertion.

- [ ] P0 Add provenance/citation e2e assertions.
  - Owner lane: QA Automation.
  - Files:
    - `tests/e2e/provenance.spec.ts`
    - `src/components/praxis/output-provenance-panel.tsx`
  - Done when: generated/persisted outputs show model/profile/source/framework
    metadata where available.
  - Verification: DOM text assertions and screenshot.

- [ ] P0 Add backend proxy security suite.
  - Owner lane: QA Automation plus Security Cloud.
  - Files:
    - `tests/unit/app/api/backend/proxy.test.ts`
    - `src/app/api/backend/[...path]/route.ts`
  - Done when: only allowlisted backend paths pass and operational paths stay
    blocked.
  - Verification: 401/403/404/200 matrix for allowed and disallowed paths.

- [ ] P1 Add document upload and retrieval e2e.
  - Owner lane: QA Automation.
  - Files:
    - `tests/e2e/documents.spec.ts`
    - `src/app/app/documents/page.tsx`
    - `src/app/api/documents/upload/route.ts`
  - Done when: upload `.txt` or `.md`, verify document appears, extraction
    status is visible, and Ask PRAXIS or Brainstorming can select it.
  - Verification: upload response, document ID, downstream citation.

- [ ] P1 Add persona test specs.
  - Owner lane: QA Automation plus Identity UX.
  - Personas:
    - UN political officer.
    - Bilateral country desk.
    - Envoy support officer.
    - Humanitarian access lead.
    - Sanctions/compliance analyst.
    - Think-tank researcher.
  - Done when: each persona completes one job-to-be-done with useful,
    source-backed output.
  - Verification: per-persona script, route sequence, output, screenshot, and
    defects filed.

- [ ] P1 Add mobile Playwright project.
  - Owner lane: QA Automation plus Identity UX.
  - Files:
    - `playwright.config.ts`
    - core specs under `tests/e2e`.
  - Done when: landing, onboarding, dashboard, sidebar, major tool pages, and
    modals pass at mobile viewport with no overlapping text.
  - Verification: desktop and mobile screenshots.

- [ ] P1 Add slow-network and error-state browser tests.
  - Owner lane: QA Automation.
  - Done when: tool pages show loading, timeout, retry, and no duplicate saves
    or duplicate charges.
  - Verification: trace/HAR and duplicate write count equals zero.

## Phase 5 — Firebase, Cloud, and Security

Purpose: reduce production blast radius and make deploys fail before users do.

- [ ] P0 Make GCP audit fail closed in Cloud Build.
  - Owner lane: Security Cloud.
  - Files:
    - `cloudbuild.yaml`
    - `scripts/audit-gcp.mjs`
    - `infrastructure/grant-cloudbuild-audit-iam.sh`
  - Done when: `_AUDIT_GCP_SKIP` is removed or defaults to blocked and Cloud
    Build fails if required resources/IAM/secrets are missing.
  - Verification: controlled failing audit in staging or documented dry run.

- [ ] P0 Automate Firestore rules and indexes drift control.
  - Owner lane: Security Cloud.
  - Files:
    - `cloudbuild.yaml`
    - `firebase.json`
    - `firestore.rules`
    - `firestore.indexes.json`
    - `docs/GCP_OPERATIONS.md`
  - Done when: deploy either applies rules/indexes or blocks with a clear drift
    preflight.
  - Verification: Cloud Build log or documented preflight output.

- [ ] P0 Split and tighten Storage rules.
  - Owner lane: Security Cloud.
  - Files:
    - `storage.rules`
    - storage emulator tests to add.
  - Done when: owners can read their files, uploads enforce size/type/path
    ownership, and cross-user reads/writes fail.
  - Verification: emulator allow/deny matrix.

- [ ] P0 Restrict client writes under situation subcollections.
  - Owner lane: Security Cloud plus AI Evidence.
  - Files:
    - `firestore.rules`
    - `src/app/api/tool-data/route.ts`
    - `src/app/api/graph/*`
  - Done when: clients cannot forge tool outputs, graph updates, or
    operational state; server-generated artifacts are API/Admin-only.
  - Verification: Firestore rules tests cover tampering attempts.

- [ ] P0 Remove default admin principals in production.
  - Owner lane: Security Cloud.
  - Files:
    - `src/lib/auth/admin-gate.ts`
    - `cloudbuild.yaml`
  - Done when: production requires explicit admin allowlist env and tests prove
    no default admin principal exists when env is unset.
  - Verification: admin route tests for prod/dev env modes.

- [ ] P0 Replace raw ID-token sessions with Firebase session cookies or
  revocation-aware sessions.
  - Owner lane: Security Cloud.
  - Files:
    - `src/app/api/auth/session/route.ts`
    - `src/lib/auth/cookie-signer.ts`
    - `src/lib/auth/auth-context.tsx`
    - `docs/AUTH.md`
  - Done when: sessions support revocation and expiry is server-enforced.
  - Verification: logout, revoked-user, expired-cookie, and forged-cookie tests.

- [ ] P0 Add App Check burn-in for high-cost routes.
  - Owner lane: Security Cloud.
  - Files:
    - `src/lib/api/with-auth.ts`
    - `src/lib/firebase/config.ts`
    - `cloudbuild.yaml`
  - Done when: production can log App Check presence on AI/write routes before
    enforcement.
  - Verification: metrics show pass/missing rate; enforcement plan documented.

- [ ] P0 Make backend OIDC calls fail closed in production.
  - Owner lane: Security Cloud.
  - Files:
    - `src/lib/api/praxis-backend-server.ts`
    - `backend/auth.py`
  - Done when: missing ADC/OIDC token throws in prod and direct backend calls
    without trusted service identity fail.
  - Verification: backend auth tests and curl/Cloud Run smoke.

- [ ] P1 Expand backend proxy ownership checks.
  - Owner lane: Security Cloud.
  - Files:
    - `src/app/api/backend/[...path]/route.ts`
    - `backend/routers/graph.py`
  - Done when: every proxied `situationId` is confirmed to belong to `uid`,
    including path/query/body mismatch attempts.
  - Verification: proxy ownership test matrix.

- [ ] P1 Add frontend and backend log redaction tests.
  - Owner lane: Security Cloud plus Platform Ops.
  - Files:
    - `src/lib/observability/logger.ts`
    - `backend/logging_config.py`
  - Done when: Authorization, cookies, Firebase tokens, provider keys,
    document text, and raw model responses are redacted.
  - Verification: redaction unit tests in TS and Python.

- [ ] P1 Remove legacy plaintext API-key read paths.
  - Owner lane: Security Cloud.
  - Files:
    - `src/lib/providers/user-keys.ts`
    - `backend/services/firestore_sync.py`
    - `firestore.rules`
  - Done when: only encrypted provider-key records are used and legacy
    plaintext docs are ignored or migrated.
  - Verification: migration test and search for legacy path reads.

## Phase 6 — Platform Reliability and Observability

Purpose: make failures visible, diagnosable, retryable, and measurable.

- [ ] P0 Connect tool outputs to `tool_runs`.
  - Owner lane: Platform Ops plus AI Evidence.
  - Files:
    - `src/lib/api/with-calibration.ts`
    - `src/lib/api/save-tool-output.ts`
    - `src/lib/jobs/job-service.ts`
  - Done when: completed `tool_runs` include output doc path, model, prompt
    version, token counts if available, credits deducted, and error code.
  - Verification: unit test and operator console sample.

- [ ] P1 Add actionable Cloud Monitoring alert policies.
  - Owner lane: Platform Ops.
  - Files:
    - `infrastructure/dashboards/praxis.json`
    - `infrastructure/monitoring-alerts.sh`
    - `docs/GCP_OPERATIONS.md`
  - Done when: uptime, 5xx, p95 latency, dead-letter jobs, provider failures,
    and daily AI spend have alert policies and notification channels.
  - Verification: `gcloud monitoring policies list` output in runbook.

- [ ] P1 Move synchronous cron fan-out to Cloud Tasks.
  - Owner lane: Platform Ops.
  - Files:
    - `src/app/api/cron/daily-brief/route.ts`
    - `src/lib/jobs/job-service.ts`
    - `scripts/audit-gcp.mjs`
  - Done when: cron enqueues per-situation jobs with idempotency keys and
    retry/dead-letter state lands in `background_jobs`.
  - Verification: local/staging queue run with duplicate delivery test.

- [ ] P1 Expand `audit-gcp` beyond existence checks.
  - Owner lane: Platform Ops plus Security Cloud.
  - Files:
    - `scripts/audit-gcp.mjs`
    - `cloudbuild.yaml`
  - Done when: audit checks backend unauthenticated access, invoker IAM,
    service accounts, required secrets mounted, App Check env, scheduler auth,
    budgets, alert policies, and TTL policies.
  - Verification: audit report includes hard/soft categories for each item.

- [ ] P1 Build Situation Health as a shared library first.
  - Owner lane: Platform Ops plus Identity UX.
  - Files:
    - new `src/lib/dashboard/situation-health.ts`
    - `src/components/dashboard/*`
    - `src/components/praxis/situation-dashboard.tsx`
  - Done when: one helper computes graph coverage, source freshness, retrieval
    health, failed jobs, stale tool outputs, citation coverage, and missing
    evidence.
  - Verification: unit fixtures for healthy/degraded/critical situations.

- [ ] P2 Add BigQuery operational marts.
  - Owner lane: Platform Ops.
  - Files:
    - `infrastructure/*`
    - `docs/GCP_OPERATIONS.md`
  - Done when: tool runs, background jobs, model cost, provider failures,
    source freshness, and user activation can be queried in BigQuery.
  - Verification: SQL sample and dashboard screenshot.

## Phase 7 — Documentation and Handoff Discipline

Purpose: keep docs useful for humans and agents.

- [ ] P0 Update docs after every implementation slice.
  - Owner lane: Documentation.
  - Files:
    - `TODO.md`
    - `CHANGELOG.md`
    - `docs/CONTINUATION.md`
    - affected runbook (`TESTING.md`, `SECURITY.md`, `DEPLOYMENT.md`, or
      `ARCHITECTURE.md`)
  - Done when: docs say what changed, what was validated, what remains blocked,
    and what the next agent should do.
  - Verification: final report names the changed docs and tests run.

- [ ] P0 Keep tool audit current during browser QA.
  - Owner lane: QA Automation.
  - Files:
    - `docs/TOOL_QUALITY_AUDIT_2026-04-28.md`
  - Done when: each tested tool has works/non-empty/provenance/saved/reload
    status plus exact defects.
  - Verification: no "Unknown" remains for a tool once it has been tested.

- [ ] P1 Convert this plan into sprint checklists as tasks are selected.
  - Owner lane: Documentation.
  - Files:
    - `TODO.md`
    - `docs/SPRINT_BACKLOG.md`
  - Done when: top P0 tasks have clear ownership, write scopes, acceptance
    criteria, and validation commands.
  - Verification: next agent can pick one task without re-reading every
    historical plan.

## Suggested Next Three Agentic Loops

### Loop 1 — Public identity and first-run clarity

Subagents:

- Identity UX worker: remove retired source claims, normalize plan labels,
  rename core "case" language to "situation".
- QA explorer: prepare browser assertions for landing/pricing/onboarding copy.

Validation:

- `npx tsc --noEmit`
- `npm run build`
- `npm run lint`
- `npx playwright test tests/e2e/landing-smoke.spec.ts`

Exit criteria:

- Public surface is internally consistent and a new user understands the first
  action.

### Loop 2 — Browser QA foundation

Subagents:

- QA worker: fix route smoke inventory and expand golden path.
- AI Evidence explorer: confirm canonical persistence paths for the tools in
  the golden path.

Validation:

- `npm run smoke:public`
- authenticated Playwright run with fixture credentials
- `npx vitest run tests/unit/lib/utils/routes.test.ts`

Exit criteria:

- Browser tests prove generation, provenance, persistence, and reload for at
  least one flagship tool.

### Loop 3 — Security and deploy safety

Subagents:

- Security Cloud worker: Storage rules and Firestore write restrictions.
- Platform Ops worker: Cloud Build audit fail-closed path.

Validation:

- Firestore/Storage emulator tests.
- `npm run audit:gcp`
- `npm run build`
- backend auth tests if touched.

Exit criteria:

- Deploy cannot silently skip critical cloud drift and clients cannot forge
  server-generated artifacts.
