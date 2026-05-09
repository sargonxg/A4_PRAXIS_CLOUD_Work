# Slice 12 - Ask Core Resolution

## Purpose

Make Context Cores applicable inside Ask PRAXIS before full calibrated generation cutover. The v7 Ask runtime should no longer only save chips and routing metadata; it should resolve implicit User/Situation Cores plus explicit attachments into a persisted context snapshot that later execution can feed into calibration.

## Scope

- Add `backend/services/cores/resolver.py`.
- Resolve the caller's implicit User Core and, when a `situation_id` is present, the matching Situation Core.
- Resolve explicit `attached_core_ids` that are active and owner-scoped.
- Return a compact `coreContext` snapshot with resolved cores, missing cores, ontology binding, context health, and advisories.
- Persist `coreContext` on `ask_threads`, user messages, and assistant receipts.
- Write `core_audit` `attach` rows for resolved cores touched by an Ask run.
- Display the core context receipt in `V7AskRuntimePanel`.
- Add `audit:v7-ask-core-resolution` and wire it into `audit:gate` and `audit:architecture-chain`.

## Out of Scope

- Full calibrated generation from the core snapshot.
- Cognee recall.
- Core sharing grants beyond same-owner/platform reads.
- The full `backend/routers/cores.py` CRUD router.
- Backfill migration `0021`.

## Acceptance Criteria

- `python -m py_compile backend\services\cores\resolver.py backend\routers\ask.py backend\services\ask\types\models.py backend\services\ask\types\__init__.py` passes.
- `npm run audit:v7-ask-core-resolution` passes.
- `npm run audit:v7-ask-routing-layer` passes.
- `npm run audit:v7-ask-runtime` passes.
- `npm run audit:architecture-chain` passes.
- `npx tsc --noEmit`, `npm run lint`, and `npm run build` pass.
- Flagged Playwright smoke shows an Ask turn saved with visible `Routing:`, `Candidate skills:`, and `Context:` receipts.

## Rollback

Remove `backend/services/cores/resolver.py`, remove `coreContext` persistence/display from `/ask/run` and `V7AskRuntimePanel`, remove `audit:v7-ask-core-resolution` from `package.json` and `audit-architecture-chain`, and restore Ask to routing-only receipts.
