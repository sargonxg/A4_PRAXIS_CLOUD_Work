# Slice 00 - Foundations: Cores Schema, Flags, And Audits

**State:** in-progress
**Brief:** 02, 03
**Owner (human):** GC
**Owner (agent):** Codex
**Depends on:** none
**Blocks:** Slice 01 experience map, Slice 02 app shell skeleton, Slice 04 Ask end-to-end
**Estimated size:** M (200-600)

---

## Goal in one sentence

Create the durable v7 Context Core substrate without exposing any new user-facing route.

---

## In scope

- [x] Add `backend/migrations/versions/0019_cores_baseline.py` for `cores`, `core_grants`, and `core_audit`.
- [x] Add `backend/migrations/versions/0020_cores_linkage.py` for nullable `core_id` linkage columns on existing tables.
- [x] Add TypeScript/Zod schemas under `src/lib/cores/types/`.
- [x] Add Pydantic mirrors under `backend/services/cores/types/`.
- [x] Add `NEXT_PUBLIC_PRAXIS_V7` frontend flag defaulting to `false`.
- [x] Add `PRAXIS_V7_BACKEND` backend flag defaulting to `false`.
- [x] Add `audit:cores-schema`, `audit:cores-types-parity`, and `audit:cores-owner-scoping`.
- [x] Wire the three audits into `audit:gate` and `audit:architecture-chain`.
- [x] Add focused TypeScript schema tests.
- [ ] Test migrations against ephemeral Postgres with upgrade and downgrade.

## Out of scope

- Any `/app/v7/*` UI route.
- Any frontend route replacement.
- Any `backend/routers/cores.py` or `backend/routers/ask.py` exposure.
- Any production backfill.
- Any Cognee, model-routing, firewall, Firestore rules, storage rules, or OWL ontology change.
- Team Core UI, public sharing, or collaborator editing.

## Acceptance criteria

- [x] `npx tsc --noEmit` clean.
- [x] `npm run lint` clean, with existing warnings only.
- [x] `npm run build` clean.
- [x] `npm run audit:gate` green through all local/static checks and tests; blocked at known local `audit:gcp` reauth.
- [x] `npx vitest run tests/unit/lib/cores/types.test.ts` green.
- [x] `npm run audit:cores-schema` green.
- [x] `npm run audit:cores-types-parity` green.
- [x] `npm run audit:cores-owner-scoping` green.
- [x] `python -m py_compile backend\migrations\versions\0019_cores_baseline.py backend\migrations\versions\0020_cores_linkage.py backend\services\cores\types\models.py` green.
- [ ] Migrations apply cleanly on ephemeral Postgres. Blocked locally: Docker is not installed in this shell.
- [ ] Migrations downgrade cleanly on ephemeral Postgres. Blocked locally: Docker is not installed in this shell.

## Rollback

Downgrade Alembic through `0020_cores_linkage` and `0019_cores_baseline`, remove `src/lib/cores/types/`, remove `backend/services/cores/`, remove the three `scripts/audit-cores-*.ts` files, remove the flag additions from `next.config.ts` and `backend/config.py`, and remove the three audit scripts from `package.json` and `scripts/audit-architecture-chain.ts`.

## Open questions

- [ ] Should Team Cores ship in v7 or v7.1? Default: schema-only in v7.
- [ ] Should public grants be allowed in v7? Default: schema supports them, UI and routes stay hidden/off.
- [ ] Should `0020_cores_linkage` link every historical table in one migration or split by domain? Default: nullable linkage in one reversible migration, no backfill until Slice 1b.

## Notes for Codex

This slice intentionally creates no route and no new UI. It is the minimum substrate that later Ask, Situation, Sources, Outputs, and Analyst Skills slices can bind to without reworking storage.
