# Spec #1 — Cleanup & Infra

**Date:** 2026-05-16
**Status:** Approved (design)
**Owner:** @sargonxg
**Sequence:** 1 of 4 (followed by Visual System → Capsule Animation → Learn Page)

## Goal

Deploy-safe codebase: hardened CI, no dead code, repo hygiene complete, the
2,132-line workbench split into reviewable subcomponents, and currently loose
API routes confirmed or wrapped. Zero user-facing UX changes.

This spec is **infrastructure and cleanup only**. All visual / interaction
work lives in specs #2–#4.

## Out of Scope

- Visual / design system changes
- Capsule drop+lock animation
- Learn page redesign
- Firestore rules CI re-enable (requires IAM grant outside repo; tracked
  separately in ops backlog)
- Any new product feature

## Workstreams

### 1. CI hardening (`cloudbuild.yaml`)

**New step: `backend-pytest`**
- Runs `cd backend && pip install -e ".[dev]" && pytest -q`
- Hard fail (non-zero exit blocks deploy)
- Gates on Python env install step
- Runs in parallel with `audit-routes`

**New step: `frontend-vitest`**
- Runs `npx vitest run --reporter=dot`
- Hard fail
- Gates on `install-node-deps`
- Runs in parallel with lint / typecheck

**New script: `infrastructure/verify-deployment.sh`**
- Curl loop hitting `https://praxis.tacitus.me/api/health` and
  `https://praxis.tacitus.me/` until both return `200` or 60s elapsed
- Exit non-zero on timeout
- Wired as the last Cloud Build step; failure surfaces a Cloud Build alert
  (no auto-rollback in this spec — that is a separate ops concern)

### 2. Repo hygiene

**`LICENSE`** (root)
- Proprietary / All Rights Reserved
- © 2026 TACITUS
- Single-paragraph notice; no implied license to fork, redistribute, or
  derive

**`CONTRIBUTING.md`** (root, short)
- One screen
- Points to `CLAUDE.md` for agent collaboration rules
- Points to `AGENTS.md` for hard rules / deploy procedure
- Lists local-dev quickstart (3 commands)

**`CODEOWNERS`** (root)
- `* @sargonxg`
- Expand when team grows; out of scope for this spec

**`SECURITY.md` refresh**
- Stamp `Last Updated: 2026-05-16`
- Resolve "Incident Response" TODO with: report channel
  (security@tacitus.me), severity matrix (P0/P1/P2 with response SLAs),
  triage flow
- Remove stale reference to `docs/PRAXIS_SUPERPLAN_2026-04-29.md`

### 3. Auth + dead-code purge

**Route audit (2 routes)**
- `src/app/api/graph/ingest/route.ts` — if intended internal-only, add a
  top-of-file comment block stating so and reject when
  `request.headers.get('x-praxis-internal') !== process.env.INTERNAL_RPC_SECRET`.
  Otherwise wrap with `withAuth`.
- `src/app/api/agents/runs/[runId]/execute/route.ts` — same treatment.

**Pub/Sub topic sweep**
- Topics declared in `infrastructure/setup-gcp.sh`:
  `praxis.pipeline`, `praxis.extract`, `praxis.ingest`, `praxis.alert`,
  `profile.events`
- For each topic, grep code for `publishMessage`, `pubsub`, topic name
  string usage. Topics with zero publishers AND zero subscribers in current
  codebase get removed from `setup-gcp.sh` and noted in `CHANGELOG.md`
  `[Unreleased]`.
- Topics with subscribers but no publishers get a `TODO(topic-name)`
  comment flagging them for future wiring rather than deletion (they may
  be planned).

**Module sweep**
- Run `npm run audit:repo-shape`
- Any "orphan" findings (modules with zero importers) get verified by
  manual grep, then deleted
- Special targets to investigate:
  - `src/lib/data/legacy-data-stream.ts` (CLAUDE.md notes it's a
    compatibility adapter — verify still referenced)
  - Any `*-deprecated.ts` or `*-old.ts` files
- Each deletion gets a single-line CHANGELOG entry under "Removed"

### 4. Workbench split (`tasklet-praxis-workbench.tsx`, 2,132 lines)

**Approach:** extract pure subcomponents, no state-model change. Existing
behavior preserved pixel-for-pixel.

**New files under `src/components/workbench/`:**
- `WorkbenchHeader.tsx` — title, situation chip, mode switcher
- `CapsuleColumn.tsx` — capsule list + drop targets (existing visuals,
  not the new animation — that's spec #3)
- `RuntimePanel.tsx` — agent runtime status + step log
- `EvidenceDrawer.tsx` — citation + source fragment viewer
- `WorkbenchFooter.tsx` — actions, telemetry, lock button

**Parent (`tasklet-praxis-workbench.tsx`) becomes orchestrator only**
- Owns state, passes props down
- Target: parent ≤ 400 lines
- Each child ≤ 500 lines

**Constraint:** no behavior change. No new hooks. No new context. State
stays where it is; we only move JSX + helper functions.

## Verification Gate

All must pass before commit-and-deploy:

- `npx tsc --noEmit` — green
- `npm run lint` — warnings allowed, no errors
- `npm run build` — green
- `npm run audit:repo-shape` — green
- `npm run audit:ai-routes` — green (60/60)
- `npm run audit:model-matrix-coverage` — green
- `npx vitest run` — green
- `cd backend && pytest -q` — green
- Local `npm run dev`: `/app/dashboard` loads, workbench renders
  visually identical to pre-split (manual eyeball)

## Risks

| Risk | Mitigation |
|---|---|
| Workbench split breaks invisible coupling | Run vitest + manual smoke before commit; revert if any drift |
| pytest stage fails on first CI run due to missing fixtures | Fix tests in this spec; do not merge until green |
| Smoke check flakes on slow Cloud Run cold start | 60s timeout with retry loop, not single-shot |
| Pub/Sub topic deletion breaks unseen consumer (e.g., a Cloud Function not in repo) | Only delete topics with zero references in repo; flag rest with TODO |
| Wrapping `graph/ingest` breaks an internal caller we don't know about | Header-based bypass with `INTERNAL_RPC_SECRET` is reversible; document in CHANGELOG |

## Acceptance Criteria

1. `cloudbuild.yaml` runs pytest, vitest, and post-deploy smoke; all hard-fail.
2. `LICENSE`, `CONTRIBUTING.md`, `CODEOWNERS` exist at repo root.
3. `SECURITY.md` dated 2026-05-16 with incident-response section filled.
4. `graph/ingest` and `agents/runs/[runId]/execute` are either auth-wrapped
   or secret-header-gated, with intent documented in code.
5. `setup-gcp.sh` contains zero topics with no in-repo references; CHANGELOG
   notes removals.
6. `tasklet-praxis-workbench.tsx` ≤ 400 lines; 5 new child components exist.
7. All verification-gate commands pass.

## Sequencing into implementation

Implementation plan to be produced by the `writing-plans` skill. Suggested
order to minimize merge conflicts:

1. Repo hygiene (LICENSE / CONTRIBUTING / CODEOWNERS / SECURITY) — safe, isolated
2. CI stages (cloudbuild.yaml + smoke script) — independent
3. Auth wrappers + Pub/Sub purge — small, independent
4. Workbench split — last, biggest diff, needs clean base
