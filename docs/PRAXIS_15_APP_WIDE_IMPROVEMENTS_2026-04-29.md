# PRAXIS 15 App-Wide High-Impact Improvements

Status: active execution plan.
Created: 2026-04-29.

This plan complements `docs/PRAXIS_SUPERPLAN_2026-04-29.md` with 15 top-level
improvement initiatives that cut across the whole product. Each initiative is
meant to be large enough to matter, small enough to verify, and broad enough to
improve real user success rather than only code organization.

## First Pass Already Started

The first low-risk product consistency pass shipped in this working tree:

- Public landing/metadata source claims now emphasize Google Search, GDELT,
  UCDP, ReliefWeb/OCHA, HDX, UNHCR, UN News, World Bank, and private corpus
  sources instead of retired/conflicting source claims.
- Hero subcopy now states the concrete user outcome: open a situation, add
  sources, and get defensible role-aware analysis that can be briefed upward.
- Demo CTA now says "Explore Sample Workspace" instead of implying a live
  crisis workspace.
- Legacy wizard copy now says "Create New Situation" and "Situation Name".
- Legacy wizard persistence now maps the user's AnalystProfile role into a
  situation role instead of hardcoding every new situation as `analyst`.
- `/app/situations/new` now initializes the situation role from AnalystProfile
  when no workflow path has already selected a role.
- Shared generation empty/onboarding states now use plan-friendly workspace
  language instead of exposing per-action credit costs.

## Second Pass Already Started

The first high-value intelligence capability from the 12-feature principal
engineer request also shipped in this working tree:

- `POST /api/ai/situation-intelligence` generates only from the active
  situation, analyst source fragments, calibration context, and prior saved
  tool context. It does not include demo or placeholder responses.
- `SituationIntelligenceSchema` validates executive panel, strategic insight,
  causal timeline, actor dossiers, scenarios, risk scoring, actions, memory,
  graph primitives, provenance, and confidence.
- The real dashboard now exposes `ExecutiveIntelligencePanel`, which can
  generate, save, reopen, inspect graph node details, inspect provenance,
  review confidence, and export the current analysis as JSON.
- Focused schema tests cover geopolitical situation, corporate conflict, and
  policy memo outputs.

## Verification Standard

For each initiative:

- Name the persona and workflow.
- Run at least one focused automated check or browser flow.
- Record exact commands.
- Record the route/page/API tested.
- Confirm output is useful, cited/provenanced where relevant, saved, and
  reloadable.
- Update `TODO.md`, `CHANGELOG.md`, and `docs/CONTINUATION.md`.

## 1. Product Identity Consistency

Problem: PRAXIS still has old phrases, retired vendor/source assumptions, and
mixed "case" versus "situation" language.

High-impact work:

- Remove or qualify retired source claims from public UI, metadata, generated
  share images, in-app release notes, docs, and demos.
- Standardize the public promise: situation-first, calibrated, cited,
  role-aware, briefable.
- Replace "case" with "situation" for the canonical workspace unit, except
  where a legal/research domain intentionally uses "case".

Files:

- `src/components/landing/*`
- `src/app/layout.tsx`
- `src/app/opengraph-image.tsx`
- `src/app/(landing)/page.tsx`
- `src/components/onboarding/*`
- `src/components/app/app-sidebar.tsx`
- `README.md`, `docs/VISION_2026.md`, `docs/STRATEGY.md`

Verification:

- `rg "ACLED|Crisis Group|SIPRI|Tavily|Anthropic|Bloomberg Terminal|Create New Case|Launch Case|TACITUS Credits" src README.md docs`
- `npx playwright test tests/e2e/landing-smoke.spec.ts`
- Desktop and mobile screenshots of landing, login, onboarding, and new
  situation.

## 2. First-Run Activation

Problem: a new user can reach the dashboard without a clear next move or first
useful cited output.

High-impact work:

- After onboarding, direct the user into a guided first situation.
- Offer one recommended first output based on role and workflow path.
- Make "created=1" dashboard state show a specific first action, not a generic
  grid.
- Add a "what PRAXIS needs from you" panel: actors, sources, documents, goals.

Files:

- `src/app/onboarding/*`
- `src/app/app/situations/new/page.tsx`
- `src/components/dashboard/situation-launchpad.tsx`
- `src/components/praxis/situation-dashboard.tsx`

Verification:

- New-user Playwright flow reaches first cited output in under 5 minutes.
- Output is non-empty, shows provenance, saves, and reloads.

## 3. Role-Aware Workspace Defaults

Problem: profile choices are not consistently reflected in situation creation,
dashboard actions, sidebar ordering, empty states, and generated outputs.

High-impact work:

- Map AnalystProfile role/domain into default situation role and workflow path.
- Make dashboard quick actions role/domain-specific.
- Make empty states role/domain-specific.
- Keep "For you" navigation tied to the same recommendation source.

Files:

- `src/lib/dashboard/role-recommendations.ts`
- `src/components/app/app-sidebar.tsx`
- `src/components/praxis/no-situation-state.tsx`
- `src/components/praxis/onboarding-required-state.tsx`
- `src/app/app/situations/new/page.tsx`

Verification:

- Tests or fixture screenshots for diplomat, mediator, humanitarian lead,
  sanctions analyst, and researcher show different recommended starts.

## 4. Situation Health and Briefability

Problem: users cannot quickly tell whether a situation is safe to brief from.

High-impact work:

- Build a shared situation health helper.
- Score graph Core-8 coverage, source freshness, failed jobs, stale outputs,
  citation coverage, document extraction status, and missing evidence.
- Show a dashboard panel and compact status strip on tool pages.

Files:

- `src/lib/dashboard/situation-health.ts`
- `src/components/dashboard/*`
- `src/components/praxis/situation-dashboard.tsx`
- `src/lib/graph/core-primitives.ts`

Verification:

- Healthy/degraded/critical fixtures.
- Dashboard panel shows clear next actions for each degraded signal.

## 5. Tool Output Reliability

Problem: tool output storage still has split paths and some tools may render
empty or fail to reload saved outputs.

High-impact work:

- Make `ToolOutputEnvelope` the canonical write/read path.
- Backfill or bridge legacy `tools/{toolId}` documents.
- Require every flagship tool to pass works/non-empty/provenance/saved/reload.

Files:

- `src/lib/api/save-tool-output.ts`
- `src/app/api/tool-data/route.ts`
- `src/lib/knowledge/evidence-envelope.ts`
- `src/lib/knowledge/tool-output-layer.ts`
- `src/hooks/use-persisted-tool-data.ts`
- `docs/TOOL_QUALITY_AUDIT_2026-04-28.md`

Verification:

- Generate a flagship tool, reload, Ask PRAXIS cites it, and Firestore path is
  recorded.

## 6. Ask PRAXIS as the Situation Copilot

Problem: Ask PRAXIS needs stronger awareness of graph coverage, saved tool
outputs, documents, notes, and uncertainty.

High-impact work:

- Surface Core-8 coverage warnings.
- Cite saved tool outputs and documents through the evidence envelope.
- Offer "write this to Briefing" or "turn this into next actions" follow-ups.
- Show limits and missing evidence explicitly.

Files:

- `src/app/api/ai/ask-praxis/route.ts`
- `src/components/assistant/*`
- `src/lib/knowledge/*`
- `src/lib/intelligence/corpus-search.ts`

Verification:

- Persona test: saved risk assessment becomes cited ambassador talking points.

## 7. Evidence and Citation Discipline

Problem: users need to know which claims are supported, stale, inferred, or
unsupported.

High-impact work:

- Require `sources`, `confidence`, `limitations`, and `generatedAt` in flagship
  AI outputs.
- Add unsupported-claim eval fixtures.
- Add UI badges for stale feeds and low confidence.

Files:

- `src/lib/ai/schemas/*`
- `src/app/api/ai/*`
- `src/components/praxis/output-provenance-panel.tsx`
- `src/components/shared/confidence-indicator.tsx`

Verification:

- Tests fail when factual claims lack receipts in source-required routes.

## 8. Browser QA Foundation

Problem: browser testing is thin relative to the product surface.

High-impact work:

- Expand Playwright config with desktop/mobile projects, traces, screenshots,
  and fixture auth.
- Make authenticated golden path mandatory in staging.
- Add persistence, provenance, empty-output, document upload, admin, and mobile
  specs.

Files:

- `playwright.config.ts`
- `tests/e2e/*`
- `docs/golden-path.md`
- `TESTING.md`

Verification:

- Staging run fails if authenticated golden path is skipped.

## 9. Route and Tool Audit Freshness

Problem: route smoke scripts can drift from the tool registry.

High-impact work:

- Derive route smoke inventory from `TOOL_REGISTRY`.
- Fail when registry route, page route, and API route disagree.
- Produce a dated audit artifact for every release.

Files:

- `scripts/verify-tools.ts`
- `scripts/audit-tools.ts`
- `scripts/audit-ai-routes.mjs`
- `src/lib/constants/tool-registry.ts`

Verification:

- No stale route names in `verify-tools.ts`; route smoke reports PASS/AUTH/FAIL.

## 10. Security and Rules Hardening

Problem: Firestore/Storage rules and admin/backend trust boundaries need
targeted hardening before institutional pilots.

High-impact work:

- Split Storage read/write rules.
- Restrict client writes under situation subcollections.
- Remove default admin principals in production.
- Add App Check burn-in on high-cost routes.
- Make backend OIDC fail closed in production.

Files:

- `firestore.rules`
- `storage.rules`
- `src/lib/auth/admin-gate.ts`
- `src/lib/api/with-auth.ts`
- `src/lib/api/praxis-backend-server.ts`
- `backend/auth.py`

Verification:

- Emulator allow/deny tests, backend auth tests, and Cloud Run direct access
  smoke.

## 11. Deploy Safety

Problem: deploys must catch cloud drift before users do.

High-impact work:

- Make GCP audit fail closed in Cloud Build.
- Automate or preflight Firestore rules/index deployment.
- Expand audit checks beyond resource existence.
- Record deploy smoke evidence in `docs/DEPLOYMENT_LOG.md`.

Files:

- `cloudbuild.yaml`
- `scripts/audit-gcp.mjs`
- `firebase.json`
- `firestore.indexes.json`
- `docs/GCP_OPERATIONS.md`

Verification:

- Cloud Build blocks on missing required infra and logs actionable failure.

## 12. Operational Spine Visibility

Problem: tool runs, background jobs, events, notifications, and user-visible
activity need tighter traceability.

High-impact work:

- Link tool outputs to `tool_runs.outputDocPath`.
- Show failed runs and retryable jobs in operator console.
- Add system event redaction and severity discipline.
- Add Cloud Monitoring alerts for 5xx, p95, dead-letter jobs, provider
  failures, and AI spend.

Files:

- `src/lib/api/with-calibration.ts`
- `src/lib/jobs/job-service.ts`
- `src/lib/events/event-service.ts`
- `src/app/app/admin/operator-console/page.tsx`
- `infrastructure/monitoring-alerts.sh`

Verification:

- Operator can click from a failed UI state to tool run, job, event, output,
  and retry status.

## 13. Document and Corpus Trust

Problem: uploaded documents and research artifacts need durable provenance.

High-impact work:

- Store original uploads in Cloud Storage with checksums.
- Keep extracted text/chunks in Firestore.
- Add Document AI fallback for scanned PDFs.
- Normalize documents, notes, research, and tool outputs toward corpus items.

Files:

- `src/app/api/documents/upload/route.ts`
- `src/lib/firebase/documents-service.ts`
- `src/lib/knowledge/*`
- `storage.rules`

Verification:

- Upload, extract, retrieve, cite in Ask PRAXIS, and export with provenance.

## 14. Commercial Readiness

Problem: plan labels, promo access, Polar billing, and admin visibility must be
coherent before paid pilots.

High-impact work:

- Finish Polar production setup and webhook verification.
- Align plan labels across UI, Firestore, checkout, and docs.
- Keep free useful without exposing internal credit mechanics.
- Add admin visibility for user plan, trial, promo, and provider readiness.

Files:

- `src/lib/constants/pricing.ts`
- `src/lib/api/tier.ts`
- `src/app/api/polar/*`
- `src/components/dashboard/account-status-card.tsx`
- `src/app/app/admin/users/page.tsx`

Verification:

- Free user gets first value; promo updates entitlement; paid checkout mirrors
  Firestore entitlement; admin can inspect state without secrets.

## 15. Enterprise Trust Pack

Problem: institutional buyers need a clear security, privacy, compliance, and
operational story.

High-impact work:

- Tighten public security claims to live versus planned.
- Add incident response and key rotation runbooks.
- Document data retention, subprocessors, audit logs, and unsupported data
  classes.
- Build export audit metadata for briefings/reports.

Files:

- `SECURITY.md`
- `docs/COMPLIANCE.md`
- `docs/MAINTENANCE.md`
- `docs/GCP_OPERATIONS.md`
- `src/lib/services/export-engine.ts`

Verification:

- Security/compliance page does not overclaim and export artifacts carry
  provenance, generated time, model/profile version, and limitations.

## Suggested Next Implementation Order

1. Finish Initiative 1: product identity consistency.
2. Finish Initiative 8 and 9: browser QA and route audit freshness.
3. Finish Initiative 5 and 6: tool-output reliability and Ask PRAXIS retrieval.
4. Finish Initiative 10 and 11: rules hardening and deploy safety.
5. Finish Initiative 4 and 12: situation health and operational visibility.
