# Slice 14 - Cores Read API

## Purpose

Make the Cores Library read from the owner-scoped backend Core substrate instead of only showing static explanatory cards. This is the first user-visible bridge from the v7 Core schema to the simplified app.

## Scope

- Add `backend/routers/cores.py` with read-only `GET /cores` and `GET /cores/{core_id}`.
- Keep reads owner-scoped through `tenant_session(token["uid"])`; platform cores are readable through the existing RLS posture.
- Record `core_audit` `read` rows on detail reads.
- Register the router under `/api/v1/cores` and `/v1/cores`.
- Allowlist `/api/backend/cores` and `/api/backend/cores/{id}` in the authenticated Next proxy.
- Add local backend fallbacks so the Cores surface still renders when the Python backend is not configured.
- Show a compact "Materialized cores" panel in `/app/cores` with live API/fallback posture.
- Add `audit:v7-cores-api` and wire it into `audit:gate` and `audit:architecture-chain`.

## Out of Scope

- Core create/update/archive/fork/share mutations.
- Team Core grants beyond existing RLS/platform reads.
- Backfill migration `0021`.
- Replacing the static v7 Core map; it remains useful as a product explanation while records are empty.

## Acceptance Criteria

- `python -m py_compile backend\routers\cores.py backend\main.py` passes.
- `npm run audit:v7-cores-api` passes.
- `npm run audit:v7-cores-surface` passes.
- `npm run audit:architecture-chain` passes.
- `npx tsc --noEmit`, `npm run lint`, and `npm run build` pass.
- Flagged Playwright smoke shows the Cores surface and materialized-core panel with local fallback when no Python backend is configured.

## Rollback

Remove `backend/routers/cores.py`, unregister the router from `backend/main.py`, remove the proxy allowlist/fallback, remove the materialized-core panel from `V7CoresSurface`, and remove `audit:v7-cores-api` from `package.json` and `audit-architecture-chain`.
