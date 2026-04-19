# Plan B Handoff — Tool Calibration Migration

**Status:** Plan A merged to `main` 2026-04-19. Plan B not started.
**Spec:** `docs/superpowers/specs/2026-04-18-user-onboarding-tool-calibration-design.md` §§7, 8, 11, 12
**Baseline audit:** `docs/audits/tools-2026-04-19.md`

---

## What Plan A delivered (build on this)

Key exports that Plan B snaps onto:

- `withCalibration(toolId, creditOpType)(handler)` — `src/lib/api/with-calibration.ts` — middleware factory chaining `withAuth → credits check → buildCalibratedContext → handler`; returns 403 for non-onboarded non-demo users
- `buildCalibratedContext({uid, situationId, toolId, retrievalQuery})` — `src/lib/context/profile-context.ts` — composes profile + situation + SKC retrieval into a `ContextBlock` with `systemPromptBlock`, `outputConstraints`, and `toolContext`
- `saveToolOutput({uid, situationId, toolId, profileVersion, output})` — `src/lib/api/save-tool-output.ts` — persists tool output to `users/{uid}/situations/{sitId}/tools/{toolId}` with profile-version provenance; no-op when `situationId` absent
- `renderSystemPromptBlock()` — `src/lib/context/system-prompt-block.ts` — renders the `<analyst-profile>` + `<situation-frame>` + `<output-constraints>` XML block for injection into AI system prompts
- `AnalystProfile` type — `src/types/analyst-profile.ts` — identity, perspective, workingStyle, meta, embedding fields
- `OnboardingRequiredState` component — `src/components/praxis/onboarding-required-state.tsx`
- `OnboardingBanner` component — `src/components/shared/onboarding-banner.tsx`

Baseline audit results (50 AI routes scored):

- Max score: 4/11 (`advisory`, `dossier-generate`, `power-map`)
- Median score: ~3/11
- Zero routes use `withCalibration`
- Zero routes call `saveToolOutput`
- All routes deduct credits correctly (dim 11 = 1 for all)

Server-side gate: `withCalibration` returns 403 for non-demo users with no `profile.meta.completedAt`.

Client-side gate: `useSituationGuard()` (`src/hooks/use-situation-guard.ts`) returns `needsOnboarding`; `ToolPageShell` renders `<OnboardingRequiredState />` when triggered.

Tool outputs helper ready: `saveToolOutput` is importable and tested.

---

## Plan B scope

### Tier 1 — Core daily (10 tools, target 11/11)

Dashboard, Assistant, Conflict Graph, Actor Profiles, Risk Monitor, Early Warning, Report Studio, Daily Brief, Deep Research, Scenarios.

For each tool:
1. Wrap the route handler with `withCalibration(toolId, creditOpType)`
2. Inject `calibration.systemPromptBlock` into the AI system prompt
3. Apply `calibration.outputConstraints` (language, red lines, audience tone)
4. Call `saveToolOutput` after successful AI generation
5. Emit `tool.completed` Pub/Sub event (via `saveToolOutput` metadata field)

### Tier 2 — Analysis depth (12 tools)

Stakeholder Map, Power Map, Game Theory, Negotiation Prep, Info Environment, Compare, Media Compass, Dossier, Talking Points, Briefing Room, Mediation Designer, CONCORDIA.

Same treatment as Tier 1.

### Tier 3 — Feeds & monitors (10 tools)

ARGUS, Media Roundup, Source Monitor, Alert Center, Geospatial, Humanitarian, Sanctions, Commitments, Treaty, Timeline.

Same treatment as Tier 1, minus Memory Bank write (dim 9 — documented exception for pure feed-pass-through tools).

### Tier 4 — Specialized / workspace (8 tools)

Electoral Risk, Economic Impact, Peacebuilding Index, Human Rights, External Actors, Cases, Team, Advisory, UN Toolkit, Settings.

Per-tool treatment; some workspace tools (Cases, Team, Settings) may be exempt from calibration injection.

---

## Proactive improvements per tool (from spec §7.3)

- **Dashboard**: "Questions your profile suggests you should ask today" card — 3 Gemini-generated questions per day derived from `mandate × situation state`
- **Assistant**: auto-seed each thread with `calibration.systemPromptBlock`; add inline SKC citation popovers
- **Conflict Graph**: profile-lens filter toggle that dims nodes outside the user's primary lens
- **Daily Brief**: auto-scheduled 6am delivery in `profile.workingStyle.language` with audience tone; no per-user config step needed
- **Report Studio**: template suggestions matching user's audience type and past outputs
- **Scenarios**: seed prompts respect `profile.workingStyle.redLines`
- **Deep Research Agent**: cross-reference Vertex AI Memory Bank to avoid re-researching known ground
- **Dossier**: one-click generation for any graph actor; tone auto-matches `profile.perspective.audience`
- **Alert Center**: default filter by `profile.perspective.regions × profile.perspective.lenses`

---

## Known gaps (must address during Plan B)

### Technical debt

1. `VectorLayer.search` does not propagate chunk embeddings — the profile-weighted re-rank in `src/lib/knowledge/profile-weighted-retrieval.ts` is structurally correct but inert at runtime today because chunk vectors are not returned from KNN results. Fix in Plan B Phase P9.

2. `initAnalystProfileIfMissing` in `src/lib/firebase/analyst-profile-service.ts` writes via the client SDK directly. Consider routing initialization through the PATCH API endpoint (`/api/onboarding/profile`) for consistency and to avoid bypassing server-side validation.

3. `OnboardingBanner` is rendered inside `src/app/app/layout.tsx` inside the scrollable main container (line 18 of layout.tsx). Move it to a sticky full-width strip between the app shell Header and `<main>` so it does not scroll away.

4. Two pre-existing TypeScript errors in test files:
   - `tests/unit/types/analyst-profile.test.ts` — string narrowing issue
   - `tests/unit/lib/knowledge/profile-weighted-retrieval.test.ts` — implicit `this` context
   Minor — clean up in Plan B opening commit before any route work.

5. `incrementOnboardingSkip` is correctly wired via `/api/onboarding/skip/route.ts`. Verify the skip button in `src/app/onboarding/page.tsx` calls this route on every exit path (step skip, close button, browser back).

### GCP additions (spec §8)

- Cloud Tasks queue `onboarding-research` for background auto-structure pipeline (currently fire-and-forget from browser on situation creation — unreliable)
- BigQuery table `praxis_analytics.tool_outputs` to warehouse every `saveToolOutput` call
- Looker Studio onboarding funnel using the BigQuery data
- Stream `tool.completed` Pub/Sub events into BigQuery via Dataflow

### Dead code / consolidations (verify then delete)

- `/api/ai/research-extract` — confirmed present at `src/app/api/ai/research-extract/route.ts`; verify it is a duplicate of `/api/ai/extract` by diffing both handlers, then delete if confirmed
- `/api/ai/claude-analyze` — confirmed present at `src/app/api/ai/claude-analyze/route.ts`; verify no callers outside the file, then delete as a pre-AI-SDK-v6 shim
- Ad-hoc `buildGraphContext` variants scattered across routes — replace all with `calibration.toolContext.aco` (available via `withCalibration`)
- Tool prompts scattered across 50 routes — consolidate to `src/lib/prompts/registry.ts` (one export per tool, typed, unit-testable)

---

## Build sequence (from spec §11)

- **P5**: Tier 1 fixes (10 tools) + end-to-end validation that the calibration contract works (profile → withCalibration → tool output → Firestore → UI)
- **P6**: Tier 2 fixes (12 tools)
- **P7**: Tier 3 fixes (10 tools, feed-heavy; dim 9 exempt)
- **P8**: Tier 4 fixes + workspace pages
- **P9**: GCP additions (Cloud Tasks, BigQuery table, Dataflow) + VectorLayer chunk-embedding fix
- **P10**: Dead code sweep + prompts registry consolidation + final E2E audit run

---

## Success criteria (spec §12)

- All 40 tools score 11/11 on the `scripts/audit-tool-calibration.ts` audit (or documented exception for dim 9 on Tier 3 feed tools)
- First-login → working situation + first tool output in 5 minutes median (measured via BigQuery funnel)
- Profile completion rate 80% or higher within first 3 sessions
- Every tool output Firestore document has a `profileVersion` field (enforced by `saveToolOutput`)
- Zero hardcoded prompt strings outside `src/lib/prompts/registry.ts` (CI lint guard)
- Zero AI routes without `withCalibration` wrapping (CI guard via `scripts/verify-audit-fresh.ts`)

---

## How to resume

1. Read this handoff doc in full.
2. Read spec sections §§7 (per-tool proactive improvements), §8 (GCP additions), §11 (phase plan), §12 (success criteria).
3. Read the latest audit: `docs/audits/tools-2026-04-*.md` — confirm it is still the current baseline or re-run `npx tsx scripts/audit-tool-calibration.ts`.
4. Invoke `superpowers:writing-plans` to author Plan B as a task-by-task plan, using Tier 1 (10 tools above) as the first phase scope.
5. For each tool in Tier 1: apply `withCalibration` + `saveToolOutput`, re-run audit, verify the score moves toward 11/11 before moving to the next tool.

---

## Related artifacts

- Spec: `docs/superpowers/specs/2026-04-18-user-onboarding-tool-calibration-design.md`
- Plan A: `docs/superpowers/plans/2026-04-18-plan-a-onboarding-foundation.md`
- Manual checklist: `docs/verification/2026-04-18-onboarding-manual-checklist.md`
- Baseline audit: `docs/audits/tools-2026-04-19.md`
- Audit script: `scripts/audit-tool-calibration.ts`
- CI freshness guard: `scripts/verify-audit-fresh.ts`
