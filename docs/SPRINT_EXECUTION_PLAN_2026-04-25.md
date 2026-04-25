# PRAXIS Sprint Execution Plan — 2026-04-25

Purpose: turn the broad sprint goal into file-owned, non-conflicting work
for Codex 5.5 and Claude Code. This plan complements
`docs/SPRINT_BACKLOG.md`; the backlog remains the status source of truth.

## Operating Rules

- Work from the same fresh `main` clone and pull before starting.
- One assistant owns a file at a time. If a task touches an owned file, wait
  or hand it off explicitly.
- Every AI route change must preserve `withCalibration`.
- Every new Firestore collection or query pattern needs rules and indexes in
  the same commit.
- Do not expose internal credit costs in user-facing UI.
- Validate before push: `npx tsc --noEmit`, `npm run build`,
  `npm run lint`, `npm run audit:gcp`,
  `node scripts/audit-ai-routes.mjs`, `npx vitest run`.

## Workstream Ownership

| Workstream | Primary Owner | File Surface |
|---|---|---|
| Deploy / GCP / spine | Codex | `cloudbuild.yaml`, `infrastructure/*`, `cloud_functions/*`, `backend/routers/*`, `docs/GCP_OPERATIONS.md` |
| Dashboard / onboarding / landing | Claude Code | `src/app/onboarding/*`, `src/components/landing/*`, `src/components/dashboard/*`, `src/components/praxis/*` |
| Tool persistence retrofits | Codex | `src/app/app/<tool>/page.tsx`, `src/app/api/situations/*`, `src/hooks/*`, focused tests |
| Tool specs and docs | Either | `docs/tools/*`, `docs/SPRINT_BACKLOG.md`, `docs/CONTINUATION.md` |
| AI context / SKC | Codex first, Claude reviews | `src/lib/api/with-calibration.ts`, `src/lib/context/*`, `src/lib/knowledge/*` |

## Phase 0 — Deployment Spine Lock

Goal: production reliably records jobs, tool runs, events, and notifications.

1. Verify Firestore rules are deployed from Cloud Shell.
   - Owner: Giulio / Cloud Shell.
   - Command: `firebase deploy --only firestore:rules,firestore:indexes --project=praxisbytacitus`.
   - Evidence: rules deploy success and indexes READY.
2. Redeploy Eventarc functions with dedicated service accounts.
   - Owner: Giulio / Cloud Shell, with Codex-authored commands.
   - Files: `cloud_functions/on_situation_created`, `cloud_functions/on_document_uploaded`.
   - Evidence: `gcloud functions describe ... serviceConfig.serviceAccountEmail`.
3. Force-restart `gdelt-poller` after the fixed worker image.
   - Owner: Giulio / Cloud Shell or Codex via `gcloud`.
   - Evidence: worker logs `Index probe OK` and no 404 to `/ingest-gdelt`.
4. Smoke-test one authenticated AI tool.
   - Owner: Giulio in browser.
   - Evidence: fresh `tool_runs` row, `tool.started`, `tool.completed`,
     and operator console rows.

## Phase 1 — First-Run UX

Goal: a new analyst immediately understands why onboarding matters and sees
the workspace shaped around their role.

1. Clean stale vendor/source claims.
   - Files: `src/components/landing/*`, `src/app/onboarding/*`,
     `src/app/app/settings/system-health/page.tsx`,
     `docs/CONTEXT_INJECTION.md`, `docs/EXTERNAL_TOOLS_WIRING.md`.
   - Replace ACLED/Firecrawl activation language with the current
     Google-native/open-data stack: GDELT, UCDP, ReliefWeb, HDX, UN News,
     World Bank, Vertex AI / grounded Google Search.
2. Improve onboarding completion payoff.
   - Files: `src/app/onboarding/completion-success.tsx`,
     `src/lib/dashboard/role-recommendations.ts`.
   - Show role/domain/audience summary and the top recommended tools.
3. Replace raw XML live preview with a calibration preview.
   - Files: `src/app/onboarding/live-preview.tsx`.
   - Default panels: tone, sources, red lines, recommended tools.
   - Raw prompt behind an advanced disclosure only.

## Phase 2 — Dashboard And Notifications

Goal: the dashboard becomes the operational home, not just a metrics grid.

1. Real-user notification bell.
   - Files: `src/components/shared/notifications.tsx`,
     `src/hooks/use-activity-feed.ts`, `src/app/api/notifications/[id]/route.ts`.
   - Read Firestore notifications for authenticated users.
   - Preserve demo/local Zustand behavior only in demo mode.
   - Mark read/archive through the existing PATCH route.
2. Activity feed polish.
   - Files: `src/components/app/activity-feed.tsx`,
     `src/components/app/semaphore-chip.tsx`.
   - Add compact status legend/tooltips.
   - Keep internal credit costs hidden.
3. Situation detail overview.
   - Files: `src/app/app/situations/[id]/page.tsx`,
     `src/components/praxis/situation-dashboard.tsx`,
     `src/components/app/activity-feed.tsx`.
   - Replace redirect-only behavior with an overview: status, sources,
     graph health, latest activity, next recommended action.

## Phase 3 — Tool Quality Retrofit

Goal: every visible tool has situation guard, persistence, canonical output,
clear empty/error states, and tests.

Order of work:

1. PRAXIS Assistant chat persistence.
   - Files: `src/components/assistant/chat-interface.tsx`,
     `src/app/app/assistant/page.tsx`,
     new `src/app/api/situations/[id]/chat/route.ts`,
     new `src/hooks/use-chat-history.ts`.
2. Dossier persistence.
   - Files: `src/app/app/dossier/page.tsx`,
     `src/app/api/ai/dossier-generate/route.ts`.
3. Negotiation Prep persistence.
   - Files: `src/app/app/negotiation-prep/page.tsx`,
     `src/app/api/ai/negotiation/route.ts`.
4. Actor Profiles, Report Studio, Early Warning.
   - Files: respective page + AI route + focused tests.
5. Source Library and ARGUS Grounded.
   - Finish or hide if not ready.

Definition of ready for a tool:

- Uses `useSituationGuard`.
- Has useful no-situation/onboarding/loading/error states.
- API route is calibrated or explicitly exempt.
- Output persists under `users/{uid}/situations/{sitId}/tools/{toolId}`.
- Revisiting the page hydrates prior output.
- Relevant source/citation language is visible and truthful.
- At least one focused unit or route-level test covers persistence/schema.

## Phase 4 — Context And Store Reliability

Goal: every generated answer receives the right analyst, situation, domain,
and SKC context, and users can trust why it answered that way.

1. Add "Why this output?" inspector.
   - Files: shared tool shell/components and persisted tool output schema.
   - Surface profile version, domain, model, prompt version, sources used,
     and SKC retrieval summary.
2. Cross-tool memory readiness.
   - Files: `src/lib/knowledge/tool-output-layer.ts`,
     `src/hooks/use-persisted-tool-data.ts`, `save-tool-output.ts`.
   - Ensure output IDs, tool registry IDs, and Firestore doc IDs align.
3. Low-confidence warnings.
   - Files: `src/lib/api/with-calibration.ts`,
     `src/lib/events/event-service.ts`.
   - Detect structured `confidence < 0.6` outputs and create yellow
     `tool.warning` notifications.

## Phase 5 — Intelligence And Data

Goal: source-backed tools work without private vendor dependencies and degrade
honestly when a feed is unavailable.

1. GDELT BigQuery hot slice.
   - Files: `docs/implementation/gdelt-ingestion-2026-04-25.md`,
     new `infrastructure/bigquery/*`, backend GDELT service.
   - Replace raw polling with a BigQuery-derived table and cache.
2. Feed capability truth.
   - Files: `src/lib/data-feeds/capabilities.ts`,
     `src/app/api/health/feeds/route.ts`,
     system health UI.
   - No stale "configure ACLED/Firecrawl" CTAs.
3. Media Monitor / Media Roundup.
   - Files: `src/app/app/media-compass/page.tsx`,
     `src/app/app/media-roundup/page.tsx`,
     corresponding AI routes.
   - Show source provenance, date windows, confidence, and gaps.

## Phase 6 — Page-By-Page Polish Order

1. Landing + pricing + system health: trust, current stack, no stale claims.
2. Login/onboarding/completion: fast path to first useful situation.
3. Dashboard: operational status, recommended tools, activity feed.
4. Situations list/detail/new: case health and next actions.
5. Assistant: persistent per-situation memory.
6. Documents/sources: ingestion clarity and pipeline progress.
7. Conflict graph/geospatial/timeline: source-backed visual state.
8. Risk/early warning/alerts: confidence + action-required notifications.
9. Briefing/report/dossier/talking points: reusable output, citations,
   export-ready formatting.
10. Media tools: GDELT/grounded search provenance and narrative comparison.
11. Negotiation/game theory/mediation/scenarios: explicit assumptions and
   replayable inputs.
12. Admin/operator console: drill-down, retry, and user support filters.

## Recommended Claude Code Parallel Tasks

Use `docs/CLAUDE_TANDEM_PROMPTS_2026-04-25.md`. The first non-conflicting
Claude lane should be landing/onboarding stale-source cleanup while Codex
continues tool persistence and spine work.

