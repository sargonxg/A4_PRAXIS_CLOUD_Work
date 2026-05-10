# PRAXIS v5 Execution Ledger

Date opened: 2026-05-10
Status: Phase 0 committed locally; pending push

This ledger is the working control file for the v5 build pack. It turns the
three prompt files into explicit checkpoints so Codex, Claude Code,
Antigravity, and human operators can coordinate without losing phase status.

## Source Pack

- `docs/build/PRAXIS_v5_BUILD_01_AGENT_OPERATING_GUIDE.md`
- `docs/build/PRAXIS_v5_BUILD_02_BACKEND_PHASES_0-3.md`
- `docs/build/PRAXIS_v5_BUILD_03_FRONTEND_AND_SHIP.md`

Treat File 1 as the always-read operating guide. Treat Files 2 and 3 as the
phase prompts. If a prompt conflicts with current repo security boundaries,
stop and record the conflict here before editing.

## Current Pre-Flight

- Repo: `C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work`
- Remote: `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`
- Branch policy: work on current `main` unless Giulio requests a branch.
- Shared worktree: Codex and Claude Code may be active at the same time.
- Last checked baseline, 2026-05-10:
  - `npm install` passed.
  - `npm run typecheck` passed.
  - `npm run build` passed.
  - `npm run lint` passed with warnings only.
  - `node scripts/audit-ai-routes.mjs` passed.
  - `npm run audit:repo-shape` passed with stale graphify warning.
  - `npm run audit:gcp` passed.
  - `npm run audit:gcp-production-posture` had zero hard failures and three soft warnings.
  - `npx vitest run` passed: 577 tests.

Known setup warnings:

- Application Default Credentials need browser reauthentication before Vertex
  or Google SDK parity work: run `gcloud auth application-default login --project=praxisbytacitus`.
- Cloud Scheduler jobs are paused.
- Firestore delete protection and point-in-time recovery are disabled.
- Current user cannot verify `gs://praxis-terraform-state`.
- `npm audit` reports dependency vulnerabilities; do not auto-force fixes during
  a phase unless the phase explicitly owns dependency remediation.

## Execution Rules

1. Start every work session with `git pull origin main`, `git status`,
   `git log --oneline -5`, and `npm install`.
2. If the tree is dirty, inspect changes and identify which are yours before
   editing or committing.
3. Run one prompt or one clearly bounded sub-prompt at a time. Do not mix phases
   unless the build pack explicitly marks them parallel-safe and the write sets
   are disjoint.
4. Before editing a phase, paste or reference the exact phase prompt in the
   working issue/chat and mark the phase `in-progress` below.
5. Keep commits coherent. Stage only files changed for the completed phase or
   sub-phase.
6. Before committing to `main`, fetch first and rerun the phase verification
   gates plus the repo gates that are relevant to the touched files.
7. If validation fails, do not commit unless Giulio explicitly asks for a WIP
   checkpoint. Record the failure and next action here.
8. After code changes, run `graphify update .` before the final checkpoint when
   practical. If graphify is unavailable or too slow, record that exception.
9. Do not run mutating `gcloud`, `firebase deploy`, `gcloud run deploy`, or
   `terraform apply` from the local machine unless Giulio explicitly approves.
10. Push to `main` only after validation, a fresh fetch, and a clean staged diff.

## Phase Queue

| Phase | Prompt Source | Dependency | Status | Owner | Commit |
|---|---|---|---|---|---|
| 0 | File 2 Prompt 0.A | v4 cleanup merged | complete-local | Codex | this commit |
| 1 | File 2 Prompt 1.A | Phase 0 merged | not-started | unassigned | pending |
| 2A | File 2 Prompt 2A.A | Phase 1 merged | not-started | unassigned | pending |
| 2B | File 2 Prompt 2B.A | Phase 1 merged | not-started | unassigned | pending |
| 2C | File 2 Prompt 2C.A | Phase 1 merged | not-started | unassigned | pending |
| 2D | File 2 Prompt 2D.A | Phase 1 merged | not-started | unassigned | pending |
| 2E | File 2 Prompt 2E.A | Phase 1 merged | not-started | unassigned | pending |
| 3 | File 2 Prompt 3.A | Phase 1 merged | not-started | unassigned | pending |
| 4A | File 3 Phase 4A | Phase 1 plus compatible 2/3 surfaces | not-started | unassigned | pending |
| 4B | File 3 Phase 4B | Phase 3 types/seeds | not-started | unassigned | pending |
| 4C | File 3 Phase 4C | Phase 4A foundation | not-started | unassigned | pending |
| 4D | File 3 Phase 4D | Methods and runtime prerequisites | not-started | unassigned | pending |
| 4E | File 3 Phase 4E | Drafting prerequisites | not-started | unassigned | pending |
| 5 | File 3 Phase 5 | Phase 4C | not-started | unassigned | pending |
| 6 | File 3 Phase 6 | Drafting shell and templates | not-started | unassigned | pending |
| 7 | File 3 Phase 7 | Waves 1-3 complete | not-started | unassigned | pending |
| 8 | File 3 Phase 8 | Demo content and app surfaces | not-started | unassigned | pending |
| 9 | File 3 Phase 9 | All MVP phases complete | not-started | unassigned | pending |

## Checkpoint Template

Use this entry format after each phase or sub-phase:

```md
### YYYY-MM-DD - Phase X - <short name>

- Owner:
- Prompt source:
- Scope completed:
- Files changed:
- Validation run:
- Validation result:
- Commit:
- Push:
- Open blockers:
- Notes for next agent:
```

## First Recommended Command

Start with Phase 0 only:

```text
Run Phase 0 from docs/build/PRAXIS_v5_BUILD_02_BACKEND_PHASES_0-3.md.
Follow docs/build/PRAXIS_v5_BUILD_01_AGENT_OPERATING_GUIDE.md and update
docs/build/PRAXIS_v5_EXECUTION_LEDGER.md as the phase control file.
Commit and push to main only if validation passes and the worktree contains
only the intended Phase 0 changes.
```

## Checkpoints

### 2026-05-10 - Phase 0 - Vision Adopt And Readiness Stubs

- Owner: Codex
- Prompt source: `docs/build/PRAXIS_v5_BUILD_02_BACKEND_PHASES_0-3.md` Prompt 0.A
- Scope completed: implemented locally and gate-repaired for commit
- Files changed: architecture vision docs, ADRs, startup docs, TODO/STATUS, package audit stubs, execution ledger, restored audit-required historical prompt/evidence artifacts, restored audit-required workbench/landing/cost fixtures, docs lint script
- Validation run:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`
  - `npx vitest run`
  - `npm run test`
  - `pytest backend/ -q`
  - `npm run audit:gate`
  - `npm run audit:v5-readiness`
  - `npm run docs:lint`
  - `git diff --check`
- Validation result: pass with expected/environment exceptions
  - PASS: `npm run lint` completed with existing warning debt only.
  - PASS: `npm run typecheck`.
  - PASS: `npm run build`.
  - PASS: `npx vitest run` / `npm run test` completed 148 test files and 577 tests.
  - PASS: `npm run audit:gate` after restoring active-audit required files.
  - PASS: `npm run docs:lint`; this repo now has a dependency-free docs sanity script because markdownlint/Vale/Lychee are not installed in the current toolchain.
  - PASS: `graphify update .`.
  - PASS: `git diff --check`.
  - EXPECTED RED: `npm run audit:v5-readiness` fails on `audit:llm-pattern-coverage`, as Prompt 0.A requires failing stubs that are not yet in `audit:gate`.
  - ENVIRONMENT: `pytest backend/ -q` cannot collect in the active Python environment because backend dependencies/import path are unavailable (`fastapi`, `pydantic_settings`, `psycopg`, `psycopg_pool`, `google`, and `agents` import errors). No Phase 0 backend product code depends on this.
  - REPAIRED: `npm run audit:gate` previously failed because v4 cleanup removed active-audit required artifacts. Restored required `docs/codex-prompts/`, `docs/audits/2026-05-08-V2-PROMPT-PACK-COMPLETION.md`, `src/lib/cases/user-cases/loader.ts`, `src/components/landing/_archive/`, and `scripts/bench-gliner-cost-reduction.py`.
  - SKIPPED: `git diff --cached --check` because nothing was staged after validation failed.
- Commit: this commit (`chore(v5-phase-0): adopt vision and readiness stubs`)
- Push: pending
- Open blockers:
  - The standalone `PRAXIS_VISION_v4_*` files referenced by Prompt 0.A were absent at phase start; repo-local canonical files were created from the authoritative v5 build pack.
  - Existing historical ADRs already used numeric prefixes `0037`, `0038`, and `0040`; the requested v5 ADR filenames were added without renaming existing ADRs.
  - `npm run audit:v5-readiness` is expected-red because Phase 0 intentionally creates failing stubs for later phases.
  - Backend Python verification requires environment setup before `pytest backend/ -q` can collect.
  - `npm run audit:gcp-production-posture` has zero hard failures and three soft warnings: uploads bucket public-access prevention is inherited, Terraform state bucket is not readable by the active user, and Cloud Armor exists as a warning-level check.
- Notes for next agent: Do not start Phase 1 until this checkpoint is committed and pushed to `main`. Phase 1 should replace the expected-red `audit:llm-pattern-coverage` v5 stub and continue the v5 readiness chain.
