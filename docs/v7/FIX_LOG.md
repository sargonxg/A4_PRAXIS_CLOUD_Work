# PRAXIS v7 Fix Log

This log records bounded v7 advance sessions. The active sequence is the
A-G loop plan in `docs/v7/build/03_BUILD_LOOP.md`.

### Paste #1 - 2026-05-09
- Letter chosen: A
- Slice/issue: Loop A - Foundations.
- PR: pending at time of local verification; update after PR creation.
- LOC diff: Loop A foundation packet only: v7 operating docs, Core schema
  migrations, TypeScript and Pydantic Core schemas, v7 flags, and guard audits.
- Audits added or changed:
  - `audit:v7-index-current`
  - `audit:v7-build-loop`
  - `audit:cores-schema`
  - `audit:cores-types-parity`
  - `audit:cores-owner-scoping`
  - `audit:architecture-chain` wiring for the new guards
- Acceptance criteria results:
  - `npm run audit:v7-index-current`: pass.
  - `npm run audit:v7-build-loop`: pass.
  - `npm run audit:cores-schema`: pass.
  - `npm run audit:cores-types-parity`: pass.
  - `npm run audit:cores-owner-scoping`: pass.
  - `npm run audit:architecture-chain`: pass.
  - `npx vitest run tests/unit/lib/cores/types.test.ts`: pass, 4 tests.
  - `python -m py_compile backend\migrations\versions\0019_cores_baseline.py backend\migrations\versions\0020_cores_linkage.py backend\config.py backend\services\cores\types\models.py`: pass.
  - `npx tsc --noEmit`: pass.
  - `npm run lint`: pass with 97 pre-existing warnings and 0 errors.
  - `npm run build`: pass.
  - `NEXT_PUBLIC_PRAXIS_V7=true PRAXIS_V7_BACKEND=true npm run build`: pass.
  - `npm run audit:gate`: passes typecheck, build, all local/static audits, `verify:neo4j-sync`, and full Vitest (150 files, 586 tests), then fails at `audit:gcp` because `gcloud` cannot refresh tokens during non-interactive execution.
  - Alembic head inspection using the existing backend venv: `0012_embedding_dim_alignment` and `0020_cores_linkage` are both heads.
  - Ephemeral Postgres migration upgrade/downgrade: blocked locally because this shell has no Docker or `psql`; must be proved in CI or a prepared Postgres environment before Loop A is marked shipped.
- Skills/subagents invoked:
  - `cross.assumption-mapper`: contract read and applied manually before implementation. No CLI/dev invocation path is documented.
  - `red-team-analyst`: contract read and applied before push. No CLI/dev invocation path is documented.
- Findings parked for later:
  - HIGH: Loop A migration upgrade/downgrade proof is still pending outside this shell.
  - MEDIUM: Alembic branch-head strategy needs review before production migration.
  - MEDIUM: GCP posture checks may require credential refresh before the full deploy gate can pass locally.
  - LOW: repo skills/subagents need a documented CLI/dev invocation path if future prompts require them as executable checks.
- Suggested next letter for paste #2: A if CI/migration proof fails; otherwise B to begin the new homepage loop after owner approval.
