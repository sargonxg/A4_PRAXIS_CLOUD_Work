# PRAXIS — Codex Pack 09: Implementation Verification, Diagnostics & Admin Completion

**Branch**: `chore/verification-and-admin`
**Depends on**: Packs 03, 04, 05, 06, 07, 08 merged.
**Owner gate**: Do not merge to `main` without Giulio's sign-off on the Reality Check Report (delivered in this pack).
**Estimated effort**: ~6 days (~50 engineering hours).
**Voice**: Codex acts as a *supervising senior engineer* in this pack. The job is to verify what was claimed, not to take it on faith.

---

## 0. Why this pack exists

Packs 03 through 08 specified a great deal of code. Each pack ended with `npm run audit:gate` exit-zero and a sign-off. That is necessary but not sufficient. Anyone who has shipped a non-trivial product knows the pattern: a feature ships, the audit passes, and three weeks later the team discovers that the persona test was passing because the test was wrong, the diagnostics dashboard renders but two of its panels show fixture data, the graph edit operations write to Firestore but never round-trip back into the visible graph, and the "one-click create case" flow has a 90-second freeze on second mount that no one ever caught because no one ever did the second mount during a manual smoke.

This pack is the supervising engineer's pass. Codex's job is not to write new features. It is to:

1. Open every artifact each prior pack claimed to ship and verify it exists, compiles, and functions as specified — not just "the test passes" but "a real user clicking the real button achieves the real outcome."
2. Identify the gap between what the packs specified and what is actually in `main`, and produce a Reality Check Report that names every gap with severity, owner, and fix size.
3. Remediate the high-severity gaps in this pack, file backlog issues for the medium ones, and explicitly defer the low ones with rationale.
4. Finish the surfaces that packs 03-08 specified but probably under-shipped: the **diagnostics dashboard** (pack 08 G9 specified seven panels — verify each is real), the **admin surface** (currently sprawls across `app/admin/users/`, `app/admin/domains/`, `app/admin/operator-console/`, `app/admin/advisors/`, `app/admin/advisor-feed/`, `app/admin/diagnostics/` — collapse to one), the **graph ops round-trip** (pack 07 F6 — does merging two nodes actually visibly update the canvas, or only update the data layer?), the **onboarding flow** (no pack explicitly owns it — yet a new user must be able to land, sign up, create their first case, ingest a document, run a tool, and see a result, all without confusion).

The deliverable is a working app that a brand-new user can pick up and use. Not a working app that survives the test suite. Those are different bars.

---

## 1. Outcomes

| # | Outcome | Verification |
|---|---|---|
| 1 | A complete Reality Check Report at `docs/audits/2026-05-06-REALITY_CHECK.md` with one section per pack (03-08), naming every claimed deliverable, its actual state (`SHIPPED` / `STUBBED` / `BROKEN` / `MISSING`), severity, fix size, and remediation owner | File exists, ≥ 6 sections, every deliverable from each pack appears |
| 2 | All `STUBBED`, `BROKEN`, `MISSING` items at severity `must-fix-before-launch` are remediated within this pack | Audit re-run after remediation shows zero remaining must-fix |
| 3 | The diagnostics dashboard (pack 08 G9) is fully functional: all 7 panels render with real aggregated data, refresh on schedule, and respond to real telemetry events | Open `/app/admin/diagnostics` — all panels populated; deliberate trigger of each alert path renders red on the right panel |
| 4 | The admin surface is consolidated to a single route `/app/admin/` with sub-tabs for diagnostics, user management, and operator console; the five pre-existing admin routes are deleted or redirected | Visit any old admin URL → 308 to canonical; `find src/app/app/admin -maxdepth 2 -type d` returns the documented set |
| 5 | Graph operations from pack 07 F6 round-trip end-to-end: merge → canvas updates within one frame; split → both new nodes visible; lock → ingestion respects the lock; dispute → confidence visibly drops | E2E test `e2e/workbench/graph-ops-roundtrip.spec.ts` green; manual smoke on Syria case |
| 6 | First-run onboarding flow works for a brand-new user: sign-up → guided sample-case open → guided ingestion → guided first tool run → guided first export | E2E `e2e/onboarding/first-run.spec.ts` green; total wall-clock under 8 minutes |
| 7 | Empty-state handling everywhere: every page that renders a list, table, or graph has a designed empty state, not a blank canvas | Manual sweep recorded in `docs/audits/2026-05-06-EMPTY_STATES.md` |
| 8 | The four persona E2E suites from pack 08 G7 are confirmed green for 10 consecutive CI runs | CI history checked; report attached to PR |
| 9 | A new `audit:reality-check` script enforces that the report exists and is fresh; appended to `audit:gate` | `npm run audit:gate` includes it |

---

## 2. Pre-work confirmation note

> I am Codex acting as supervising engineer for pack 09. I have read the pack. I understand:
> 1. My role is to verify, not to assume. Every deliverable from packs 03-08 gets opened, executed, and stress-tested. Test-suite green is necessary; not sufficient.
> 2. The Reality Check Report is the primary deliverable. Remediation of high-severity gaps is the secondary deliverable. Backlog filing is the tertiary deliverable.
> 3. The four-phase collaboration pattern applies to every prompt: **Read & report → Propose & confirm → Execute → Verify**. I will not remediate without first naming what is broken and getting Giulio's confirmation on what to fix in this pack vs defer.
> 4. I do not weaken any prior invariant: the eight ACO primitives substrate, model strings only in `src/lib/ai/providers.ts`, `withCalibration` + `withContextHealthGate` on AI routes, the symbolic firewall, atomic two-phase writes, owner-scoped Firestore queries.
> 5. I will not introduce features in this pack. New features go to the backlog and Pack 11. This pack is verification + targeted remediation only.
>
> Open questions for Giulio:
> - **Q1**: Severity rubric — propose `S0 must-fix-before-launch` (silent data loss, security regression, broken persona suite), `S1 fix-this-pack` (broken core flow, missing empty state on a key surface), `S2 backlog-this-month` (missing nice-to-have, doc drift, perf below target but not budget-violating), `S3 future` (deferred feature). Acceptable?
> - **Q2**: Scope of remediation — propose: fix all S0 in this pack, fix all S1 unless they expand the pack > 60 hrs, file all S2/S3 to backlog. Acceptable?
> - **Q3**: Admin consolidation — propose collapsing `app/admin/users/`, `app/admin/domains/`, `app/admin/operator-console/`, `app/admin/advisors/`, `app/admin/advisor-feed/` into tabs of a single `/app/admin/` page (Diagnostics / Users / Operator / Advisors). The five old URLs 308-redirect to the matching tab. Acceptable, or do you want to retain separate routes for any of them?
> - **Q4**: The onboarding flow — propose: a "Welcome" modal on first sign-in that offers three paths: "Open a sample case" (default to Syria for diplomats / Northwind for everyone else inferred from sign-up form), "Create a new case from scratch", "Skip — I'll explore." Each path leads to a guided 5-step coach that highlights workbench tabs in order. Acceptable?

Wait for answers before proceeding.

---

## 3. Pack overview

| Prompt | Outcome | Est. hrs |
|---|---|---|
| I1 | Reality check on packs 03 (workbench shell) and 04 (landing + post-login redirect) | 5 |
| I2 | Reality check on packs 05 (truth layers + Context Health) and 06 (ontology system + ingestion) | 7 |
| I3 | Reality check on pack 07 (graph viewer + ops); fix graph-ops round-trip | 6 |
| I4 | Reality check on pack 08 (tools marketplace + personas); confirm 10-consecutive-run greenness | 5 |
| I5 | Diagnostics dashboard completion: all 7 panels real, alerts wired | 6 |
| I6 | Admin panel consolidation: single `/app/admin/` with tabs; old URLs redirected | 5 |
| I7 | Onboarding flow: first-run experience end-to-end, including the Welcome coach | 6 |
| I8 | Empty-state sweep + tools marketplace polish (failure modes, partial outputs) | 5 |
| I9 | Reality Check Report compilation, remediation backlog, `audit:reality-check` wired | 5 |
| **Total** | | **~50** |

---

## 4. Hard rules

- **No silent fixes.** Every remediation is named in the Reality Check Report with a before/after and a commit reference.
- **The Reality Check Report is the source of truth for this pack.** A gap not in the report does not get fixed in this pack; it goes to backlog.
- **Manual smoke is part of verification.** The four persona suites are not enough. For every "user-facing" claim, Codex performs a manual interaction in the live preview environment and records the result (screenshot or screen recording attached to the PR).
- **No regression.** Every fix re-runs the full audit chain (`npm run audit:gate`) and the four persona suites. A fix that breaks a persona suite is reverted, not merged.
- **No new product features.** New features go to backlog and pack 11.
- **Backlog filing is structured.** Each backlog item has: title, severity, area, estimated effort, blocking-or-not, target pack/release. Filed in `docs/backlog/2026-05-06-from-reality-check.md`.

---

## 5. Prompt I1 — Reality check on packs 03 (workbench) and 04 (landing)

### Persona
Supervising engineer. Skeptical. Treats "the test passes" as a starting hypothesis, not a conclusion.

### Phase 1 — Read & report

For each deliverable claimed by pack 03:

- `src/types/case-module.ts` — exists? matches the interface specified in B1?
- `src/lib/cases/syria-2026/`, `src/lib/cases/nordalia/` — exist? Both implement `CaseModule`?
- `src/components/workbench/WorkbenchChapterShell.tsx` — exists? Renders cleanly for both sample cases?
- `/app/workbench/page.tsx` (case picker) — renders the case list, including any case the user has created?
- `/app/workbench/[caseId]/page.tsx` (case shell) — renders chapters 1-5 with tab routing?
- Sidebar trimmed from 1,117 lines to under 350?
- The five legacy routes (`dashboard`, `desk`, `syria-case`, `cockpit`, plus any other workbench-internals) redirected per B-prompts?

For each deliverable claimed by pack 04:

- `(landing)/page.tsx` — exists at the new shape (9 sections, not 14)? `SyriaCaseProof` replaced by `ExampleCasesGallery`?
- `listExampleCases()` — exists, returns ≥ 4 cases?
- 6 retired components from C5/C6 — actually deleted, not just unimported?
- JSON-LD + OG rebuilt — visible in the HTML head of a fresh build?
- `resolvePostLoginRedirect` — exists, points to `/app/workbench`?
- Hero CTA hierarchy — one primary CTA (`/login`), one secondary modal trigger?

For each item: status (`SHIPPED` / `STUBBED` / `BROKEN` / `MISSING`), evidence (file path + line numbers OR "not present"), severity, fix size.

Output: `docs/audits/2026-05-06-REALITY_CHECK_03_04.md`.

### Phase 2 — Propose & confirm

Send the report to Giulio. Propose remediation list with severity. Wait for sign-off.

### Phase 3 — Execute

Fix every S0 and S1 item agreed in Phase 2. Common likely fixes:

- Re-export missing exports.
- Wire up the route redirects in `next.config.ts` if they were specified but not actually configured.
- Implement the `ExampleCasesGallery` if it's a stub.
- Fix any `useEffect` missing dependency or stale closure in the workbench shell.
- Add the missing primary-CTA hierarchy if the landing has parallel competing CTAs.

### Phase 4 — Verify

- `npm run typecheck && npm run lint && npm run test` clean.
- Manual: navigate from landing → "Try an example case" → opens Syria → all 5 chapters reachable → switch to Nordalia → same. Recording attached to PR.
- `npm run audit:routes` exits 0.

### Files to create / edit

- `docs/audits/2026-05-06-REALITY_CHECK_03_04.md`.
- Whatever specific files need remediation per Phase 2.

### Definition of Done

- Report comprehensive.
- All S0/S1 items remediated.
- Manual smoke recordings attached.

### Verification commands

```bash
npm run typecheck
npm run audit:routes
npx playwright test e2e/workbench/case-picker.spec.ts e2e/workbench/syria-case.spec.ts
```

---

## 6. Prompt I2 — Reality check on packs 05 (truth layers + Context Health) and 06 (ontology + ingestion)

### Persona
Supervising engineer with a domain head. Knows that pack 05 introduced cross-cutting types (truth layers) that, if half-shipped, leave the codebase in a worse state than before (some nodes typed, some not). Pack 06 is the structural backbone — half-shipped ontology = broken graph.

### Phase 1 — Read & report

Pack 05 deliverables to verify:

- `src/types/truth-layer.ts` and `backend/types/truth_layer.py` — exist? Field-for-field parity?
- `withContextHealthGate` middleware — exists? Applied to every analysis route per the pack 05 D-prompts?
- `ContextHealthScore` calculator — exists? Returns 0–100? Six dimensions per spec?
- Every persisted node carries `layer`, `confidence`, `provenance[]`, bi-temporal validity?
- Claim-level Trust Score persistence at `users/{uid}/situations/{caseId}/claims/{claimId}` — exists? Reads/writes round-trip?
- Drift verifier `scripts/verify-firestore-neo4j-sync.ts` — exists? Exits 0?
- Cloud Scheduler entry for 6h drift run — provisioned?
- Context Studio surface unifying Frame/Sources/Documents/Actors/Graph-Proposals — exists?
- Four Playwright persona flows from pack 05 — green?

Pack 06 deliverables to verify:

- `src/lib/ontology/types.ts` and `backend/ontology/types.py` — field-for-field parity?
- `src/lib/ontology/registry.ts` — returns 4 ontologies (`conflict`, `mediation`, `governance`, `narrative`)?
- For each of the four ontologies: `subtypes.ts`, `relations.ts`, `validators.ts`, `extraction-prompts.ts`, `index.ts` — exist? Validators have at least 5 tests each?
- Every subtype maps to one of 8 ACO primitives — `npm run audit:ontology-mapping` exits 0?
- The Northwind, UN CTED, Nordalia disinfo sample cases — exist with fixtures?
- Syria migration to `conflict@1.0.0` — completed? Pre/post node counts identical?
- Ontology classifier in `backend/agents/langgraph/ontology_classifier.py` — exists? Eval set ≥ 16 cases? Top-1 accuracy ≥ 75%?
- Ingestion pipeline `backend/ingestion/pipeline.py` — exists? Each node in the LangGraph state machine implemented (`parse_document`, `extract_candidates`, `validate_against_ontology`, `apply_symbolic_firewall`, `score_trust`, `queue_for_review`, `persist_atomic`, `update_context_health`)?
- Two-phase commit verified by deliberate crash test?
- `AUTO_COMMIT_THRESHOLD = 0.7`, `REVIEW_FLOOR = 0.4` — present and respected?
- Ontology versioning + migration template — `scripts/migrate-ontology-version.ts` works on a synthetic test ontology?
- `audit:ontology-mapping`, `audit:ontology-versions`, `audit:ontology-classifier-accuracy` — wired into `audit:gate`?

For each: status, evidence, severity, fix size.

Output: `docs/audits/2026-05-06-REALITY_CHECK_05_06.md`.

### Phase 2 — Propose & confirm

Common gaps to expect at this stage of a real codebase:

- Pydantic mirrors that drift from Zod schemas.
- Validators that exist as functions but aren't wired into the ingestion pipeline's `validate_against_ontology` node.
- The ontology classifier returning "conflict" for everything because the prompt doesn't differentiate the four descriptions enough.
- Bi-temporal validity fields present in the schema but never populated by extraction.
- `ContextHealthScore` returning a constant because one of the six dimensions throws and is silently caught.

Propose targeted fixes. Wait for sign-off.

### Phase 3 — Execute

Fix S0/S1 items. Particular attention:

- Pydantic ↔ Zod parity drift: write a parity test that imports both and asserts field-name + type equality. If it fails, fix the drifted side.
- Bi-temporal field population: fix the extraction prompts to require `validFrom` (default to document publication date if extraction can't infer) and the ingestion writer to actually persist them.
- `ContextHealthScore` silent failure: convert any caught exceptions into typed warnings on the dimension and surface them in the score breakdown.

### Phase 4 — Verify

- All audits green.
- Run ingestion on each of the four sample cases — every fixture produces ≥ 1 expected node, the pipeline state machine reaches `persist_atomic`, and Context Health rises measurably.
- Crash injection test passes for ingestion atomicity.

### Files to create / edit

- `docs/audits/2026-05-06-REALITY_CHECK_05_06.md`.
- Pydantic / Zod parity test if missing.
- Whatever needs remediation.

### Verification commands

```bash
npm run audit:ontology-mapping
npm run audit:ontology-versions
npm run audit:ontology-classifier-accuracy
pytest backend/tests/test_ingestion_pipeline.py backend/tests/test_ingestion_atomic.py -q
npm run audit:gate
```

---

## 7. Prompt I3 — Reality check on pack 07 (graph) + fix graph-ops round-trip

### Persona
Supervising engineer who has shipped graph editors. Knows that the silent killer of a graph editor is "edits write to the data layer but the canvas doesn't redraw."

### Phase 1 — Read & report

Pack 07 deliverables:

- `src/components/graph/PraxisGraphCanvas.tsx` — exists? Lazy-loaded via `next/dynamic`?
- ESLint rule restricting Cytoscape imports — wired and enforced?
- Five layouts (`force.ts`, `hierarchical.ts`, `ego-network.ts`, `timeline.ts`, `layered-by-truth-layer.ts`) — each works on the Syria case?
- Filter panel — all six dimensions (primitive, subtype, layer, confidence, time, relation)? URL-state preserved?
- Node detail panel — six tabs all populated for a Syria Verdict node?
- **Graph edit operations (the most important verification)** — for each of `merge-nodes`, `split-node`, `mark-contradiction`, `lock-node`, `dispute-claim`:
  - The handler exists in `src/lib/graph/edits/` and `backend/routers/graph_edits.py`.
  - The handler is wired to a context-menu item in the canvas.
  - The handler runs through `withCalibration` + symbolic firewall.
  - **The canvas re-renders within one frame after a successful edit.** This is the key check; in many graph editors, the data round-trips but the canvas requires a full reload.
  - The audit trail entry is written.
  - Reverting within 24 hours actually undoes the change.
- Saved views CRUD — round-trip works?
- Performance budget — 10k-node test runs in CI on the perf runner?
- A11y axe scan — clean?

Output: `docs/audits/2026-05-06-REALITY_CHECK_07.md`.

### Phase 2 — Propose & confirm

Predicted likely gaps:
- Edit ops that mutate Firestore but require the user to refresh the page to see the change.
- Saved views that save layout state but not filter state, or vice versa.
- Performance test that runs but with thresholds set so loose any hardware passes.
- The "dispute-claim" handler that writes the dispute but doesn't trigger the confidence drop in the UI.

Propose fixes. Wait for sign-off.

### Phase 3 — Execute

For each edit op, the round-trip pattern is:
1. Optimistically update local Cytoscape state.
2. POST the edit to the backend.
3. On success, reconcile (no-op if optimistic was correct).
4. On failure, roll back the optimistic update and surface a typed error.

Implement the optimistic-update path for any edit op that's missing it.

For perf budgets: tighten thresholds based on actual measurement on the CI runner. Document the runner spec in `docs/runbooks/PERF_RUNNER.md`.

### Phase 4 — Verify

- `e2e/workbench/graph-ops-roundtrip.spec.ts` — for each of the five edit ops:
  - Open the Syria graph.
  - Perform the edit via the context menu.
  - Assert the canvas updates within 500ms (one frame at 30fps + buffer for tooltips/animations).
  - Assert the data layer matches.
  - Refresh the page.
  - Assert the edit persisted.
- Manual smoke: merge two Actor nodes; observe the canvas update; observe the merged node retains both incoming edges.
- Saved-view round-trip: save → sign out → sign in → restore → pixel snapshot match within tolerance.

### Files to create / edit

- `e2e/workbench/graph-ops-roundtrip.spec.ts` (if missing or thin).
- `docs/audits/2026-05-06-REALITY_CHECK_07.md`.
- `docs/runbooks/PERF_RUNNER.md`.
- Whatever optimistic-update wiring is missing.

### Verification commands

```bash
npx playwright test e2e/workbench/graph-ops-roundtrip.spec.ts
npx playwright test e2e/workbench/graph-saved-views.spec.ts
npx playwright test e2e/perf/graph-large.spec.ts
npm run audit:graph-viewer-uniqueness
npm run audit:graph-perf-budget
```

---

## 8. Prompt I4 — Reality check on pack 08 (tools marketplace + persona suites)

### Persona
Supervising engineer who knows that the persona suites are the production bar — and that flaky persona suites are the most common cover-up of broken core flows.

### Phase 1 — Read & report

Pack 08 deliverables:

- `src/lib/tools/registry/<id>.ts` — exactly 16 files? Each validates against `Tool` schema? Each has a working canary?
- Legacy registry archived to `tool-registry.legacy.ts`?
- Tool marketplace UI at `?tab=tools` — cards render, filters work, dimmed state for incompatible tools?
- `ToolFitBadge` shows correct "Ready / Needs more sources / Not for this ontology" per case?
- Schema-driven form via `@rjsf/core` with PRAXIS-themed widgets — works for all 16 tools?
- Sync vs async execution — sync path returns < 1s, async path streams via SSE with Last-Event-ID resume?
- Cancellation works — kill an async run mid-stream, backend stops billing within 1s?
- Tool runs persist at `users/{uid}/situations/{caseId}/runs/{runId}` with all required fields?
- Big-output handling — output > 1 MB written to Cloud Storage?
- Tool composition v1 — chains work? `parentRunId` tree visible in Runs tab?
- **Four persona E2E suites — verify CI history shows 10 consecutive green runs.** This is the production-readiness signal. If it's not 10 green, that's the gap.
- Lighthouse CI thresholds met (Landing ≥ 92, Workbench ≥ 85)?
- Bundle budgets met?
- RUM events flowing to backend?
- `audit:tool-coverage`, `audit:tool-perf-budgets`, `audit:bundle-budgets` wired?

Output: `docs/audits/2026-05-06-REALITY_CHECK_08.md`.

### Phase 2 — Propose & confirm

Predicted likely gaps:
- Some of the 16 tools have placeholder handlers that return mock data.
- Persona suites pass but with hard-coded waits (`page.waitForTimeout(5000)`) that hide real timing issues.
- Cancellation doesn't actually stop billing because the LangGraph node runs to completion before checking the cancel signal.
- Tool composition works only for explicit shape-match cases; the compatibility function is too lax or too strict.
- Diagnostics dashboard exists but several panels show fixture data.

Propose fixes. Wait for sign-off.

### Phase 3 — Execute

For each of the 16 tools that has a placeholder handler:
- Implement the real handler against the active graph.
- The handler must call DIALECTICA recipes for the analytical ones (per pack 06) — never re-implement the analytical logic in the tool wrapper.
- Add a real fixture-based test (canary) that exercises the handler.

For persona suites:
- Replace any `waitForTimeout` with `waitForSelector` / `waitForResponse` / `waitForFunction`.
- If a suite is flaky, root-cause it (most common: race condition on Firestore write propagation, fix with actual signal, not retry).
- Run each suite 10 times in CI staging; only sign off if 10/10 green.

For cancellation:
- Plumb the cancel signal through to the LangGraph state machine; check the signal at the top of every node; abort cleanly with audit log entry.

### Phase 4 — Verify

- All 16 tools' canaries pass.
- Persona suites: 10 consecutive green runs in CI staging.
- Cancellation test: kill async run at t=1s; assert backend stopped billing by t=2s.
- Tool composition: at least 4 documented chains work end-to-end (one per ontology).

### Files to create / edit

- `docs/audits/2026-05-06-REALITY_CHECK_08.md`.
- Tool handlers that need real implementation.
- Persona suites that need flake elimination.

### Verification commands

```bash
npm run audit:tool-coverage
npm run audit:tool-perf-budgets
npm run audit:bundle-budgets
npm run lh:ci
npm run test:e2e:personas   # run 10 times in staging; report attached
```

---

## 9. Prompt I5 — Diagnostics dashboard completion

### Persona
Operator. Knows that "the dashboard exists" is a different claim than "the dashboard is operationally useful at 3 AM."

### Phase 1 — Read & report

For each of the 7 panels specified in pack 08 G9, verify:

1. **Tool health** — per-tool P95 over 24h, error rate, queue depth, cost. Real data, not fixtures. Aggregations come from the `metrics/{date}` precomputed source, refreshed daily.
2. **Ingestion pipeline** — runs in flight, awaiting review, failed in 24h, P95 ingestion duration. Real data sourced from LangGraph checkpoint table or run records.
3. **Drift verifier** — Firestore↔Neo4j (post-pack-10: also Postgres) sync status, last run timestamp, drift count. Live read from latest scheduled drift verification.
4. **Context Health distribution** — histogram across all cases. Computed nightly into `metrics/{date}/context-health-histogram`.
5. **Symbolic firewall** — rejections per ontology in 24h. Live from `audit/firewall-rejections/`.
6. **Auth & abuse** — failed sign-ins, rate-limit hits. From Firebase Auth logs + middleware metrics.
7. **Cost dashboard** — token spend per ontology, per tool, daily. From the cost computation in `backend/ai/cost_table.py` aggregated per run.

For each: panel exists, data source is real, refresh schedule is documented, alert threshold is set, runbook exists.

Output: `docs/audits/2026-05-06-DIAGNOSTICS.md`.

### Phase 2 — Propose & confirm

Likely gaps:
- 2-3 panels render fixture data because the aggregation script isn't wired to a Cloud Scheduler.
- Alert thresholds are set but no actual alert wiring (no Sentry / PagerDuty / email).
- Runbooks exist as titles but not as content.

Propose fixes. Wait for sign-off.

### Phase 3 — Execute

- Wire missing aggregation scripts to Cloud Scheduler (or equivalent cron).
- Wire alert thresholds to Sentry events at minimum (PagerDuty integration is later).
- Fill in runbook content for any panel that has a stub.

### Phase 4 — Verify

- Open dashboard. Every panel populated with non-fixture data.
- Trigger each alert path deliberately:
  - Tool health red: register a tool with `estimatedRuntimeMs` of 100, run it, watch the canary fail, watch the panel turn red.
  - Drift: deliberately desync Firestore from the secondary store, watch the verifier flag it.
  - Cost overrun: lower a threshold to a low number, run a tool, watch the cost panel alert.
- Each runbook has actionable content for its red state.

### Files to create / edit

- `docs/audits/2026-05-06-DIAGNOSTICS.md`.
- Cloud Scheduler config (in `infrastructure/`).
- Runbook content in `docs/runbooks/`.
- Alert wiring (Sentry events).

### Verification commands

```bash
# Manual: open /app/admin/diagnostics — every panel populated
# Trigger each alert deliberately; verify red state + Sentry event
```

---

## 10. Prompt I6 — Admin panel consolidation

### Persona
Information architect. Knows that an admin surface that sprawls across six routes is the same surface as one that lives in six tabs of one route, except the second is findable and the first is not.

### Phase 1 — Read & report

Inventory the existing admin routes:

- `app/admin/users/` — what does it do? real or stub?
- `app/admin/domains/` — what does it do?
- `app/admin/operator-console/` — what does it do?
- `app/admin/advisors/` — what does it do?
- `app/admin/advisor-feed/` — what does it do?
- `app/admin/diagnostics/` — verified in I5.

For each: real functionality summary, target tab in the consolidated `/app/admin/`, or "delete with redirect to diagnostics."

Output: `docs/audits/2026-05-06-ADMIN_CONSOLIDATION_PLAN.md`.

### Phase 2 — Propose & confirm

Propose: single `/app/admin/` with tabs `Diagnostics` (default), `Users`, `Domains`, `Operator`, `Advisors`. The five old URLs 308-redirect to the matching tab. Owner-only via existing auth check. Wait for sign-off.

### Phase 3 — Execute

- Build `src/app/app/admin/page.tsx` with a tab shell.
- Migrate each old route's content into a tab component under `src/components/admin/`.
- Delete the old route files.
- Configure 308 redirects in `next.config.ts`.
- Update sidebar / global nav to point to the single `/app/admin/`.

### Phase 4 — Verify

- Visit each old URL → 308 → matching tab.
- Owner-only: as a non-owner, `/app/admin/` returns 403.
- All previous functionality reachable.

### Files to create / edit

- `src/app/app/admin/page.tsx`.
- `src/components/admin/<tab>.tsx` per tab.
- Delete five old route files.
- `next.config.ts` redirects.
- `e2e/admin/admin-consolidation.spec.ts`.

### Verification commands

```bash
npx playwright test e2e/admin/admin-consolidation.spec.ts
npm run audit:routes
npm run build   # no broken refs
```

---

## 11. Prompt I7 — Onboarding flow (first-run experience)

### Persona
Product engineer who has watched 50 first-run sessions over the shoulder of users. Knows that the difference between "they figured it out" and "they bounced" is whether the first 90 seconds answered three questions: *what is this for, what do I do first, what does success look like?*

### Phase 1 — Read & report

Walk the path of a brand-new user:

- Land on `/`. Is the value proposition clear in three seconds? (Re-check pack 04 work.)
- Click the primary CTA. Land at `/login`. Sign up with a new email.
- After successful sign-up, where does the user land? Is there a Welcome modal / coach? If yes — does it offer the three paths from §2 Q4? If no — does the user land on the workbench with no cases and no guidance, staring at an empty state?
- If they pick "Open a sample case" — does the case load instantly? Is there a tour overlay highlighting the workbench tabs in order?
- If they pick "Create a new case from scratch" — does the case-creation wizard work? Is the ontology picker clear?
- If they pick "Skip" — is the case picker page itself self-explanatory?
- After opening a sample case, do they understand: Frame, Sources, Documents, Ontology, Graph, Tools, Runs?

Output: `docs/audits/2026-05-06-ONBOARDING.md` with annotated screenshots.

### Phase 2 — Propose & confirm

Propose:
- A Welcome modal on first sign-in (gated by `users/{uid}/onboarding.welcomeShownAt`).
- A 5-step coach overlay using a small library (`react-joyride` or hand-rolled — recommend hand-rolled to avoid bundle cost).
- Sample-case auto-suggestion based on a single sign-up question: "What kind of work do you do?" with options Diplomacy / Mediation / Policy / Research / Other.
- "What does success look like?" — at the end of the coach, the user has produced their first tool run and can see its output. That is the "first win."

Wait for sign-off.

### Phase 3 — Execute

- Add `users/{uid}/onboarding/` document with `welcomeShownAt`, `coachStepsCompleted`, `firstWinAt`.
- Implement the Welcome modal: 3 cards for the three paths.
- Implement the coach: 5 steps highlighting Frame → Sources → Ontology → Graph → Tools, ending with "now run a tool."
- Implement the sign-up role question (one optional question; do not block on answer).
- Telemetry: log every coach step and drop-off to `audit/onboarding/{uid}` for cohort analysis.

### Phase 4 — Verify

- `e2e/onboarding/first-run.spec.ts` — full flow: sign-up → Welcome → pick sample case → coach completes → first tool run → success. Wall-clock under 8 minutes.
- Manual smoke with three test accounts (Diplomat / Mediator / Researcher); record sessions; review with Giulio.
- Drop-off metric — if any test account stalls > 60 seconds at any step, that step is a usability fix, not a metric to track.

### Files to create / edit

- `src/components/onboarding/WelcomeModal.tsx`.
- `src/components/onboarding/Coach.tsx`.
- `src/components/onboarding/CoachStep.tsx`.
- `src/lib/onboarding/state.ts`.
- `e2e/onboarding/first-run.spec.ts`.
- Sign-up form — add the role question.

### Verification commands

```bash
npm run test -- src/components/onboarding
npx playwright test e2e/onboarding/first-run.spec.ts
```

---

## 12. Prompt I8 — Empty-state sweep + tools marketplace polish

### Persona
Detail-oriented engineer who knows that a beautiful happy path with broken empty states feels worse than a plain happy path with thoughtful empty states. Knows that "what happens when this tool fails" is a question that must have an answer per tool, not a global toast.

### Phase 1 — Read & report

For every page, list, table, or graph:
- Empty state: designed or blank?
- Loading state: skeleton, spinner, or layout shift?
- Error state: typed error message, generic toast, or silent failure?

For every tool in the marketplace:
- What does it render when input is missing?
- What does it render when the tool times out?
- What does it render when the tool's analysis genuinely returns "no signal" (e.g., `mediation.zopa-finder` on a case with no BATNAs ingested)?

Output: `docs/audits/2026-05-06-EMPTY_STATES.md` with a row per surface and per tool.

### Phase 2 — Propose & confirm

Propose: a small `<EmptyState>` component pattern (icon + title + body + primary CTA), used everywhere. For tools, each tool's `outputSchema` declares a "no-signal" branch with a tool-specific message. Wait for sign-off.

### Phase 3 — Execute

- Build `<EmptyState>` (or extend existing pattern).
- Audit and fix every surface flagged.
- For each of the 16 tools, ensure the result viewer (`ResultViewer.tsx` from pack 08 G4) renders the no-signal state with a tool-specific explanation.

### Phase 4 — Verify

- Every flagged surface has a designed empty state.
- Every tool tested with a deliberately empty case shows its no-signal message, not a crash or a blank.
- Manual smoke: a brand-new user creates a brand-new case and visits every workbench tab; nothing renders blank, every CTA is actionable.

### Files to create / edit

- `src/components/_shared/EmptyState.tsx`.
- Affected pages (likely: case picker, runs tab, ontology tab when no graph yet, graph tab when no nodes yet).
- Tool result renderers.
- `docs/audits/2026-05-06-EMPTY_STATES.md`.

### Verification commands

```bash
npm run test -- src/components/_shared/EmptyState
npx playwright test e2e/onboarding/empty-states.spec.ts
```

---

## 13. Prompt I9 — Reality Check Report compilation, backlog, `audit:reality-check`

### Persona
The supervisor closing the loop. Aggregates the eight reality-check reports from I1-I8 into one canonical document, files the deferred items as backlog, and leaves the gate honest.

### Phase 1 — Read & report

Aggregate all eight prior audits into one canonical Reality Check Report at `docs/audits/2026-05-06-REALITY_CHECK.md`. Structure:

1. **Executive summary** — one paragraph: how much of packs 03-08 actually shipped, in numbers.
2. **Per-pack section (six)** — every deliverable, status, evidence, severity, what was fixed in this pack, what was deferred.
3. **Cross-cutting findings** — patterns observed (e.g., "Pydantic / Zod parity drift was the most common gap; suggest an automated parity test").
4. **Remediation log** — every fix made in this pack, with commit refs.
5. **Backlog** — every S2/S3 item filed to `docs/backlog/`. With owners and target releases.
6. **Quality state** — final status of every audit: green / yellow / red.

### Phase 2 — Propose & confirm

Send to Giulio. The report is the merge-blocker for this PR. Wait for review.

### Phase 3 — Execute

- Write `scripts/audit-reality-check.ts` that asserts the report exists, has all six sections, was generated within 24 hours of HEAD, and that no S0/S1 items remain unfixed (parses the report's status table).
- Append to `audit:gate` chain.

### Phase 4 — Verify

- `npm run audit:reality-check` exits 0.
- Backlog filed; each item has owner + target.
- Giulio reads the report, asks any clarifying questions, signs off.

### Files to create

- `docs/audits/2026-05-06-REALITY_CHECK.md`.
- `docs/backlog/2026-05-06-from-reality-check.md`.
- `scripts/audit-reality-check.ts`.

### Files to edit

- `package.json` — `audit:reality-check`.
- `audit:gate` chain — append.

### Definition of Done

- Single canonical report.
- Backlog filed.
- Audit script wired.
- Giulio signs off.

### Verification commands

```bash
npm run audit:reality-check
npm run audit:gate
```

---

## 14. Final verification gate

```bash
npm run typecheck
npm run lint
npm run test
npm run audit:gate

pytest backend/ -q
mypy backend/ --strict

# All persona suites green for 10 consecutive runs (in staging)
npm run test:e2e:personas

# Onboarding smoke
npx playwright test e2e/onboarding/first-run.spec.ts

# Graph ops round-trip
npx playwright test e2e/workbench/graph-ops-roundtrip.spec.ts

# Admin consolidation
npx playwright test e2e/admin/admin-consolidation.spec.ts

# Reality check freshness
npm run audit:reality-check
```

All commands exit 0. Reality Check Report signed by Giulio. PR mergeable.

---

## 15. Out of scope

- New product features (those go to packs 11+ or backlog).
- The Postgres backend rebuild (Pack 10).
- Memo writing (Pack 11).
- Custom ontologies, multi-tenant teams, sharing, mobile.
- Internationalization.

---

## 16. Closing note

This pack converts "the spec was good" into "the product is real." The four-phase pattern (Read & report → Propose & confirm → Execute → Verify) is non-negotiable in this pack specifically — verification done in haste produces fake greenness, and fake greenness is worse than red.

The Reality Check Report is the artifact of this pack. After this pack, when someone asks "is PRAXIS launch-ready?" the answer is "open `docs/audits/2026-05-06-REALITY_CHECK.md` and read it." If that report is comprehensive and clean, the product is launch-ready. If it is not, it is not.

Branch: `chore/verification-and-admin`. Commit prefix `verify(<area>): <prompt-id> <description>` (e.g., `verify(graph): I3 fix merge optimistic-update round-trip`). PR titled `Pack 09 — Implementation Verification, Diagnostics & Admin Completion`.

Do not merge to `main` without:
1. Reality Check Report signed by Giulio.
2. All S0 and S1 items remediated (no exceptions).
3. The four persona suites green for 10 consecutive CI runs.
4. `npm run audit:gate` exit 0.
