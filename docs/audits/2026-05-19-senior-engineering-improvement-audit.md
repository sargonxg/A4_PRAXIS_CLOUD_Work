# PRAXIS Senior Engineering Improvement Audit

Date: 2026-05-19  
Repo: `C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work`  
Branch: `main`  
Checkpoint base: `3d08ef71 docs: record live launch readiness proof`

## Executive Summary

This pass focused on shipped-app proof, route/API sprawl, canonical naming drift,
runtime proof, and cleanup readiness. The safest concrete fix was the canonical
tool naming drift: hidden archive aliases no longer share live canonical display
names, and `Sourceability Check` now has a canonical short label. A focused
regression test now guards the names across `TOOL_REGISTRY` and
`PRAXIS_CANONICAL_TOOLS`.

Current surface audits show the app remains aligned to the narrowed product
spine: public Home/Learn/Pricing/Release Notes, authenticated `/app`,
`/app/capsules`, `/app/repository`, `/app/settings`, and focused
`/agents/[runId]` workspaces. Runtime proof exists in static contracts and the
Ask/capsule/agent flow, but live worker/database proof remains environment-bound
in this shell.

## P0 Findings

None found in this pass.

Evidence:

- `npm run audit:launch-readiness` with `PRAXIS_LAUNCH_LIVE_HEADERS=1`: PASS,
  41 checks, 0 warnings, 0 failures.
- `node scripts/audit-ai-routes.mjs`: OK, 60 AI route files, 60 calibrated,
  10 static-marker exemptions.
- `npm run audit:public-surface`: OK.
- `npm run audit:mvp-route-shape`: OK.

## P1 Findings

### P1-1 Runtime Proof Is Structural, But Live Worker Proof Is Environment-Bound

Severity: P1  
Evidence: `npm run audit:agent-runtime-proof`

Observed warnings:

- Agent ledger env missing: `AGENT_RUNTIME_DATABASE_URL`, `PRAXIS_DATABASE_URL`,
  or `DATABASE_URL`.
- Worker base URL missing: `AGENT_RUN_WORKER_BASE_URL` or `APP_URL`.
- Worker auth not production-ready in this shell: Cloud Tasks OIDC audience or
  local shared secret is required.
- Genkit provider resolves, but live model calls are not configured in this
  shell.
- ADK Agent Engine remains intentionally unconfigured/planned.

Action taken:

- Recorded as a live-runtime follow-up instead of hiding the warning. Static
  proof remains guarded by `audit:agent-runtime-proof`,
  `audit:agent-process-contract`, and focused unit tests.

Follow-up:

- Run `npm run test:auth-runtime:live` and `npm run doctor:praxis -- --mode=full`
  from a credentialed production shell before launch signoff.

### P1-2 Route/API Surface Remains Large

Severity: P1  
Evidence: generated route inventory artifacts now report 208 API routes.
`node scripts/audit-ai-routes.mjs` reports 60 AI routes.

Evidence table:

| Category | Count | Evidence basis |
|---|---:|---|
| AI | 60 | `src/app/api/ai/**/route.ts`; all calibrated or exempt by `audit-ai-routes` |
| Admin/internal | 1 | `src/app/api/admin/system-health/route.ts` |
| Canonical app/runtime | 86 | account, auth, agents, memos, documents, context, capsules, repository, health, billing, user state |
| Staged/compatibility/other | 60 | remaining API routes requiring case-by-case consolidation evidence |

Action taken:

- No route deletion was attempted. Current consolidation audit proves 25 removed
  App Router page files stay deleted and compatibility lives in `src/proxy.ts`.

Follow-up:

- Use the generated route inventory and cleanup map before the next deletion
  pass. Each route is classified as canonical, compatibility, admin/internal,
  staged, or deletion candidate.

## P2 Findings

### P2-1 Canonical Name Drift Produced Audit Warnings

Severity: P2  
Evidence: initial `npm run audit:names` reported 5 warnings:

- `Ask PRAXIS` collision across `assistant` and `ask-praxis`.
- `Commitment Tracker` collision across `commitments` and
  `commitment-tracker`.
- `Sourceability Check` had short label `Source Check`.

Action taken:

- Renamed hidden archive registry aliases:
  - `assistant` -> `Legacy Assistant Chat`
  - `commitments` -> `Legacy Commitments Monitor`
- Changed canonical `sourceability.shortLabel` to `Sourceability`.
- Added a regression test in `src/__tests__/consolidated-tools.test.ts`.
- Updated `docs/tools/assistant.md` and `docs/tools/INDEX.md` so the archive
  alias is documented as legacy, not the active Ask PRAXIS surface.

Validation:

- `npx vitest run src/__tests__/consolidated-tools.test.ts`: 7 passed.
- `npm run audit:names`: 0 errors, 0 warnings.

### P2-2 Legacy Wording Still Exists In Compatibility Components

Severity: P2  
Evidence: `rg "dashboard|workbench|legacy|deprecated|retired|placeholder|mock|TODO|FIXME" ...`

Findings:

- Active primary navigation is clean in `src/lib/navigation/primary-nav.ts`:
  Home, Capsules, Repository.
- Compatibility and non-primary components still contain old route vocabulary
  such as `/app/contexts`, `/app/write`, `/app/canvas`, and `/app/tools`.
- `src/proxy.ts` intentionally owns redirects for these URLs.

Action taken:

- No broad copy rewrite was attempted because the old URLs are still referenced
  in compatibility paths, older components, and regression tests. Deleting or
  rewriting them safely requires a separate route-inventory pass.

Follow-up:

- Prefer replacing user-visible links in active shared components with
  `/app`, `/app/capsules`, `/app/repository`, and `/app/settings` only after
  route-level tests prove the affected component is still mounted.

## Deletion Candidates

| Candidate | Current status | Evidence | Action |
|---|---|---|---|
| Removed legacy app page files | Already deleted | `npm run audit:route-consolidation` verifies 25 missing route files | Keep guarded |
| Hidden archive `assistant` alias | Keep for compatibility | Registry id remains referenced by tool docs, taxonomy, and compatibility routes | Rename only |
| Hidden archive `commitments` alias | Keep for compatibility | Legacy id appears in taxonomy, evidence envelopes, and route compatibility | Rename only |
| Staged/compatibility API routes | Migrate later | 60 AI routes plus non-AI compatibility/staged routes require case-by-case evidence | Use route inventory and cleanup map first |

## Product Simplification Notes

- Public surface remains narrow: Home, Learn, Pricing, Release Notes.
- Authenticated primary navigation remains Home, Capsules, Repository.
- Focused run workspace remains `/agents/[runId]`; `/app/agents/[runId]` is a
  compatibility redirect.
- No new top-level app surface was added.

## Runtime Proof Gaps

Confirmed proof surfaces:

- Active capsule and source cards in the shared Tasklet PRAXIS workbench.
- Ask PRAXIS orchestration receipts and source preview contracts.
- Agent run creation, dispatch, focused workspace, stream, retry/cancel, and
  approval controls by static audits.
- Launch-readiness security headers verified against live routes.

Remaining gaps:

- Credentialed production browser flow with real upload/capsule/source/memo
  handoff remains pending.
- Live Cloud SQL/Cloud Tasks worker proof cannot be completed from this shell
  without runtime env and worker auth.

## Validation Results

Completed in this pass:

- `git fetch origin main`: OK.
- `git status --short --branch`: `main...origin/main`, dirty generated
  launch-readiness files only at preflight.
- `git log --oneline -5`: latest `3d08ef71`.
- `PRAXIS_LAUNCH_LIVE_HEADERS=1 npm run audit:launch-readiness`: PASS, 0 warn.
- `npm run typecheck`: PASS.
- `npm run build`: PASS.
- `npm run audit:names`: PASS, 0 warn after fix.
- `npm run audit:route-consolidation`: PASS.
- `node scripts/audit-ai-routes.mjs`: PASS.
- `npm run audit:agent-runtime-proof`: PASS with environment warnings recorded
  above.
- `npm run audit:agent-process-contract`: PASS.
- `npm run audit:public-surface`: PASS.
- `npm run audit:mvp-route-shape`: PASS.
- `npx vitest run src/__tests__/consolidated-tools.test.ts`: PASS.
- `npm run audit:simplification`: PASS.
- `npm run audit:gcp`: PASS with 0 hard failures and 1 soft runtime-proof
  warning.
- `npm run audit:gate`: PASS; regenerated
  `docs/audits/tool-contracts-2026-05-19.md` and
  `docs/audits/2026-05-19-DEEP_PRESHIP_CHECKLIST.*`.
- `npx vitest run`: PASS, 196 files and 828 tests.
- `graphify update .`: PASS; `graphify-out/GRAPH_REPORT.md` now records
  built-from commit `3d08ef71`.

Generated audit artifacts:

- `docs/audits/tool-contracts-2026-05-19.md`: 51/55 tools pass >=6/7
  operating-contract checks.
- `docs/audits/2026-05-19-DEEP_PRESHIP_CHECKLIST.md`: 128 PASS, 4 WARN,
  9 BLOCKED static pre-ship checks; blocked checks require staging/production
  credentials and datasets.

## Follow-Up Queue

1. Use the generated API route inventory and cleanup map before attempting the
   next deletion pass.
2. Run a credentialed production browser flow that proves upload -> capsule
   repository -> Ask source cards -> memo handoff -> queued agent workspace.
3. Run full `doctor:praxis` from a shell with Cloud SQL, Cloud Tasks, worker
   auth, Genkit/Vertex, and ADC configured.
4. Continue removing user-visible old route links only where active mounting is
   proven by tests or route audits.
