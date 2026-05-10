# Antigravity v5 Handoff

Use this file when multiple agents are working in this checkout.

## Canonical Start

1. Read `AGENTS.md`.
2. Read `CLAUDE.md`.
3. Read `docs/build/PRAXIS_v5_EXECUTION_LEDGER.md`.
4. Read `docs/build/PRAXIS_v5_BUILD_01_AGENT_OPERATING_GUIDE.md`.
5. Read only the phase prompt you are assigned from File 2 or File 3.

## Coordination Model

- Phase 0 and Phase 1 are sequential. Do not parallelize them.
- Wave 2 may be parallelized after Phase 1, but only with disjoint write sets:
  - Lane A: Phase 2A, 2D, 2E.
  - Lane B: Phase 2B.
  - Lane C: Phase 2C, Phase 3.
- Later phases should not start until their dependency row in
  `PRAXIS_v5_EXECUTION_LEDGER.md` is marked complete.

## Shared Worktree Rules

- Never assume uncommitted files are yours.
- Do not stage broad paths like `git add .` while another agent is active.
- Stage explicit files only.
- Before committing, run `git diff --cached --check` and summarize the staged
  files in the commit message or handoff.
- If two agents touch the same file, stop and reconcile manually before
  continuing.

## Commit Rule

When Giulio asks for main-branch commits, use this checkpoint:

```powershell
git fetch origin main
git status --short --branch
npm run typecheck
npm run build
npm run lint
npm run audit:repo-shape
node scripts/audit-ai-routes.mjs
npx vitest run
git diff --check
git diff --cached --check
```

Then commit a coherent phase checkpoint and push:

```powershell
git commit -m "<type>(v5-phase-x): <short summary>"
git pull --rebase origin main
git push origin main
```

Do not commit if validation is red unless Giulio explicitly asks for a WIP
checkpoint.
