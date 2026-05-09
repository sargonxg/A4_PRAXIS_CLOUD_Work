# PRAXIS v7 Execution Todo

This queue follows the A-G loop plan in `docs/v7/build/03_BUILD_LOOP.md`.
It replaces the older slice sequence for active execution.

Build-loop source of truth: `docs/v7/build/03_BUILD_LOOP.md` is installed and
guarded by `audit:v7-build-loop`. Use the A-G loop order unless `STATUS.md`
or a verification finding forces a regression fix first.

## A-G loop order

1. Loop A - Foundations.
   - Current state: in review on the Loop A branch.
   - Required before shipped: 0019/0020 migrations present, TypeScript and
     Pydantic Core schemas present, v7 frontend/backend flags default off,
     Core audits wired into `audit:gate`, and migration upgrade/downgrade
     proof captured in CI or an ephemeral Postgres environment.

2. Loop B - The new homepage.
   - Current state: proposed.
   - Start only after Loop A is merged or explicitly approved to parallelize.

3. Loop C - The new Ask surface.
   - Current state: proposed.
   - Depends on Loop A Core schema contracts and the Home handoff from Loop B.

4. Loop D - The new landing.
   - Current state: proposed.
   - Does not start until the v7 app face is accurate enough to describe.

5. Loop E - User Core inline.
   - Current state: proposed.
   - Depends on Loop A Core contracts.

6. Loop F - Situation Core inline.
   - Current state: proposed.
   - Depends on Loop E inline patterns and Core mutation policy.

7. Loop G - Cores rail + share.
   - Current state: proposed.
   - Depends on Loop F and owner-scoped grants.

## Current blockers

- Local shell has no Docker or `psql`, so Loop A migration upgrade/downgrade
  must be verified in CI or a prepared Postgres environment.
- Local `audit:gate` may stop at GCP posture checks until `gcloud` and ADC are
  reauthenticated for project `praxisbytacitus`.
- The repository has pre-existing Alembic branch heads; Loop A must not be
  marked shipped to production until the migration head strategy is reviewed.

## Discipline

- Do not implement Loop B-G code in the Loop A PR.
- Every future loop updates this file, `docs/v7/STATUS.md`, and
  `docs/v7/FIX_LOG.md`.
- Every future runtime contract gets an audit before it is called shipped.
