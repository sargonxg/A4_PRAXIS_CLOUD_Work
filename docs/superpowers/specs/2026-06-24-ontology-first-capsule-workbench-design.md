# Ontology-First Capsule Workbench + Cohort Hardening — Design & Codex Brief

**Date:** 2026-06-24
**Owner (strategy):** Claude (coordination only)
**Executor:** Codex CLI (`codex exec`) — explorer / frontend_qa / reviewer agents + serena, playwright, firebase MCP
**Repo:** `C:\Users\giuli\tacitus-products\praxis` (`sargonxg/A4_PRAXIS_CLOUD_Work`, branch `main`)
**Live app:** https://praxis.tacitus.me/app/capsules

---

## 1. Goal

Make the capsule surface **simple but powerful**: shrink the bloated 14-section capsule inspector
down to an **ontology-first workbench** (the ontology is the hero, everything else is opt-in), while
**preventively hardening** the app so the agentic workflows work for both **new** and **legacy** users.

This is mostly **re-composition + hardening of existing infra**, not new systems. The ontology data
(`CapsuleOntologyDisplay` active/proposed/missing, `OntologyMappingSummary.primitiveCoverage`,
validators) and the cohort code paths already exist — we elevate and de-risk them.

### Success criteria
- `/app/capsules` loads cleanly for a fresh new user AND a legacy user (no analyst profile).
- Capsule inspector shows **3 primary surfaces** (header / ontology workbench / evidence strip);
  the other 11 sections live in a collapsed **Advanced** drawer.
- The ontology workbench lets a user **see and build** the ontology (accept proposed bindings, fill
  missing ACO primitives, propose node/edge types) wired to existing graph/review-queue APIs.
- All verification gates green (typecheck, lint, vitest, playwright smoke, audit:gate).

---

## 2. Constraints & non-goals

- **In scope:** capsule inspector IA, ontology workbench UI, ontology library enrichment, cohort
  hardening, regression tests.
- **Out of scope (YAGNI this slice):** chat UX rewrite, doc-upload pipeline, marketplace, model routing.
  These work — do not touch.
- **Do not rewrite the ontology engine** (`src/lib/ontology/`). Reuse it; only extend definitions in A2.
- **Keep simplifying:** prefer removing/collapsing over adding. If a section isn't decision-relevant
  on first glance, it goes in the Advanced drawer.

---

## 3. Architecture (current → target)

### Current
- Route: `src/app/app/capsules/page.tsx` → `TaskletPraxisWorkbench` (`src/components/praxis/tasklet-praxis-workbench.tsx`).
- Inspector: `src/components/capsules/CapsuleWorkbenchPanel.tsx` renders **14 sections** in
  `src/components/capsules/workbench/` (~1,137 lines total). Ontology only appears inside
  `CapsuleGraphSection.tsx`.
- View model: `src/lib/context/capsule-workbench-view-model.ts` → `buildCapsuleWorkbenchViewModel()`
  already emits `ontology: CapsuleOntologyDisplay { active[], proposed[], missing[] }`.
- Ontology engine: `src/lib/ontology/` (types, registry, case-types, work-ontologies, validator-pass-rate,
  classifier, suggestions + 9 domain dirs).

### Target — 3 primary surfaces + 1 Advanced drawer
1. **Compact header** — name · single readiness pill · version (one line). Reuse data from
   `CapsuleWorkbenchHeader` but strip to essentials.
2. **Ontology Workbench (hero)** — new component `CapsuleOntologyWorkbench.tsx`:
   - Active ontology stack (bound case-type + work ontologies).
   - **ACO primitive coverage map**: 8 primitives (Actor / Claim / Interest / Constraint / Leverage /
     Commitment / Event / Narrative) as chips — covered (green) / missing (red) / proposed (amber),
     from `CapsuleOntologyDisplay` + `OntologyMappingSummary.primitiveCoverage`.
   - Validator pass/warn summary (`validator-pass-rate.ts`).
   - **Build actions**: accept proposed binding, fill missing primitive, propose node/edge type →
     wired to existing `/api/context/capsules/[capsuleId]/graph/*` + review-queue routes.
3. **Evidence strip** — source count · doc count · source-backed-claim % (one row, from `evidence`).

**Advanced drawer** (collapsed by default, tabbed): graph viz, history/diff, quality, claims & receipts,
timeline, causal chains, agent runs, review queue, outputs, pillars, anatomy, tacit knowledge,
sourceability gates. Lazy-render so closed tabs cost nothing.

---

## 4. Track A — Ontology-First Inspector (lead)

### A1. Build the new IA
- **Files:** new `src/components/capsules/CapsuleOntologyWorkbench.tsx`; refactor
  `CapsuleWorkbenchPanel.tsx` to render header + ontology workbench + evidence strip + `<AdvancedDrawer>`.
- New `src/components/capsules/workbench/CapsuleAdvancedDrawer.tsx` that lazy-mounts the existing 11
  section components in tabs. **Do not delete** the section components — move them under the drawer.
- Keep the view model output stable; if a needed field is missing, extend the view model rather than
  fetching in the component.
- **Tests:** unit test the ontology coverage mapping (covered/missing/proposed counts) in
  `src/lib/context/__tests__` or co-located; component render test for the workbench.
- **Verify:** `npm run typecheck && npm run lint && npm run test -- capsule` + playwright smoke
  `npm run smoke:tasklet-app` (capsules route renders, Advanced drawer toggles).

### A2. "Build the ontology" actions (the loop)
- Wire accept-proposed / fill-missing / propose-node-edge to existing API routes; show review-queue
  state inline. Reuse `CapsuleReviewQueueSection` logic where possible.
- **Tests:** API-level test that a propose action creates a review card; optimistic UI test.
- **Verify:** same gates + `npm run audit:gate` (capsule depth/contracts).

### A3. (follow-on) Enrich the ontology library
- Extend `src/lib/ontology/` definitions where coverage gaps exist (more node/edge types per case-type),
  guided by `npm run audit:ontology-system` + `audit:ontology-mapping`.
- **Verify:** both ontology audits pass; no regression in classifier tests.

---

## 5. Track B — Preventive Cohort Hardening (parallel)

### B1. Legacy/new-user audit + fixes
- **Risks (from audit):**
  - `with-calibration.ts` onboarding gate returns 403 if no `profile.meta.completedAt`; legacy users may
    lack `users/{uid}/profile/analyst` entirely → ensure `getAnalystProfile()` + `buildCalibratedContext()`
    handle null with a safe synthetic default (no NPE, no hard 403 loop for legacy users).
  - Lazy profile migration in `src/lib/firebase/firestore.ts` (deleting old `onboardingCompletedAt`) —
    verify no read/write race.
  - `getOrMigrateDefaultCapsule()` null-safety on `capsule.coreRefs` for users whose runs predate capsules.
  - Empty-corpus / failed evidence-pack paths degrade gracefully (already partly handled — confirm).
- **Files:** `src/lib/api/with-calibration.ts`, `src/lib/firebase/firestore.ts`,
  `src/lib/context/capsule-service.ts`, chat route `src/app/api/ai/chat/route.ts`.

### B2. Fix build errors
- Duplicate function definitions in build logs: `describeAskFailure`, `parseDataStreamError`.
  Consolidate exports/barrels so `npm run build` is clean.

### B3. Regression tests for both cohorts
- **New-user path:** signup → onboarding wizard → first chat turn → capsule resolves.
- **Legacy-user path:** user with no `profile.analyst` → chat turn succeeds with default calibration →
  `/app/capsules` loads.
- Vitest for service-layer null-safety; playwright smoke for the two end-to-end paths.
- **Verify:** `npm run build && npm run typecheck && npm run test && npm run smoke:tasklet-app && npm run audit:gate`.

---

## 6. Execution model (how Claude drives Codex)

- Each task = one `codex exec` run from the praxis dir, e.g.:
  `codex exec --sandbox workspace-write -m gpt-5-codex "<task prompt with this spec section + done-criteria>"`
  (sandbox `workspace-write`; reviewer agent for the verify pass).
- Codex uses **serena** for semantic navigation, **playwright** for browser proof, **firebase** for
  Firestore checks.
- **Parallel:** Track A and Track B run as two concurrent `codex exec` runs. Low file overlap
  (A = `src/components/capsules/*` UI; B = `src/lib/api`, `src/lib/firebase`, `src/lib/context`, chat route).
- **Git:** commit **direct to `main`** — but only after a task's full verification gate is green.
  Each track commits its own files; if both touch a shared file, serialize that commit.
- **No "done" without proof:** every task report must paste the actual command output for its gates.
- Claude reviews each task's output and gates before launching the next; reports status to the user.

### Per-task definition of done
1. Code compiles: `npm run typecheck` ✅
2. Lint clean: `npm run lint` ✅
3. Targeted tests green: `npm run test -- <scope>` ✅
4. (UI tasks) playwright smoke green: `npm run smoke:tasklet-app` ✅
5. (capsule/ontology tasks) `npm run audit:gate` ✅
6. Committed to `main` with a clear message; output pasted as proof.

---

## 7. Open risks
- Direct-to-main + parallel: shared-file collisions → mitigation: track-scoped file ownership + serialized
  commits on overlap.
- Playwright smoke needs a running dev server / auth; if it can't auth in sandbox, fall back to
  component/route tests + manual live check on praxis.tacitus.me.
- Ontology library enrichment (A3) is open-ended — bounded by the two ontology audits, not by feel.
