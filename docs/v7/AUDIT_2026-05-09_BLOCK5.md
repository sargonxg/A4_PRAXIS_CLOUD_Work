# PRAXIS v7 Block 5 Audit - Cores in Postgres + Owner Scoping

Date: 2026-05-09  
Branch: `inspect/v7-block5-cores-postgres`  
Scope: Cores Postgres schema, grants posture, owner-scoped router access, and production inspection readiness.

## Inspection Results

| Check | Result | Evidence |
|---|---|---|
| `cores`, `core_grants`, `core_audit` schema | PASS static | `backend/migrations/versions/0019_cores_baseline.py` defines all three tables, owner_uid, RLS, indexes, and downgrade drops. `npm run audit:cores-schema` passed. |
| Production schema introspection | BLOCKED | Cloud SQL instance exists: `praxisbytacitus-instance`, private IP only, `POSTGRES_16`, RUNNABLE. `gcloud sql connect ...` failed because `cloud-sql-proxy` is not installed in PATH. Local shell also has no `psql` or Docker. |
| Core distribution by kind | NOT VERIFIED | Requires production SQL query. Databases list confirmed `praxis`, but row-level queries were unavailable without Cloud SQL Proxy/psql. |
| `owner_uid IS NULL` count | NOT VERIFIED | Requires production SQL query. Static schema enforces `owner_uid text NOT NULL` on core tables. |
| Linkage columns | PASS static, one naming note | `0020_cores_linkage.py` adds nullable `core_id` to `cases`, `situation_frames`, `source_receipts`, `documents`, `graph_nodes`, `graph_edges`, `memos`, `drafts`, and related tables. The live schema uses `cases`, not a separate `situations` table. |
| Linkage coverage percentage | NOT VERIFIED | Requires production SQL query. |
| Migration downgrade posture | PASS static, runtime blocked | `0019`, `0020`, `0022`, and `0023` all include downgrade functions. Runtime upgrade/downgrade on ephemeral Postgres is blocked because Docker and `psql` are unavailable in this shell. |
| Public/link grants | FIXED in schema | Router already rejected public/link grants. This block tightened `0019` so `core_grants.principal_kind` only permits `user` or `team`, and removed the public-grant RLS read branch. |
| `core_audit` writes | PASS static | `backend/routers/cores.py` writes audit rows on create, read, update, fork, share, unshare, and user-core access. Last-24h production count not verified without SQL. |
| Cross-tenant owner scoping | PASS local contract, production blocked | Added `backend/tests/test_cores_owner_scoping_contract.py`; `python -m pytest backend/tests/test_cores_owner_scoping_contract.py -q` passed. Production two-user runtime test requires test-user tokens and backend flag/deploy. |

## Fixes Shipped In This Block

- Hardened `core_grants` at the schema level so v7 cannot persist `public` or `link` grants.
- Removed the public-grant RLS branch from `cores_tenant_isolation`; platform seeds remain readable through `owner_uid = 'platform'`.
- Strengthened `audit:cores-grants-coverage` to fail if the migration reintroduces public/link grant support.
- Added a focused backend contract test for owner/platform/user-grant read scope and owner-scoped writes/audits.
- Made the Home -> Ask core handoff explicit: Home skill links now carry `situationId` and `attachedCoreIds`, and `/app/ask` plus `/app/ask/[threadId]` parse `mode`, `situationId`, and multi-core attachments.
- Added a first-class build menu inside the core picker for Situation, Methodology, Team rubric, and Source cores, plus the existing seeded-example path.
- Updated the Ask runtime panel to show exactly how many selected Context Cores are searched with My Core.

## Verification

- `npm run audit:cores-schema` - pass
- `npm run audit:cores-owner-scoping` - pass
- `npm run audit:cores-grants-coverage` - pass
- `python -m pytest backend/tests/test_cores_owner_scoping_contract.py -q` - pass
- `npm run audit:postgres-schema-current` - pass static marker
- `npm run audit:owner-scoping` - pass static marker
- `npm run audit:architecture-chain` - pass
- `npx tsc --noEmit` - pass after clearing generated `.next/dev/types`
- `npm run lint` - pass with 97 existing warnings
- `npm run build` - pass
- Browser flow on local v7 dev server - pass:
  - `docs/v7/build/SCREENSHOTS/v7-block5-home-core-flow.png`
  - `docs/v7/build/SCREENSHOTS/v7-block5-core-picker-build-menu.png`
  - `docs/v7/build/SCREENSHOTS/v7-block5-create-core-modal.png`
  - `docs/v7/build/SCREENSHOTS/v7-block5-ask-core-handoff.png`
  - Assertions: attach core visible, create/build core menu visible, Methodology and Team rubric visible, Ask receives `attachedCoreIds`, `mode=deep`, and prefilled query with zero non-dev console errors.

## Blockers / Follow-up

- HIGH: Install Cloud SQL Auth Proxy or provide a production-safe SQL inspection path, then rerun the Block 5 production queries:
  - `\d cores`, `\d core_grants`, `\d core_audit`
  - `SELECT count(*), kind FROM cores GROUP BY kind`
  - `SELECT count(*) FROM cores WHERE owner_uid IS NULL`
  - linkage coverage per table
  - public/link grant count
  - last-24h `core_audit` create count
- HIGH: Run a real cross-tenant `/cores/{id}` and `/cores?kind=situation` test against deployed v7 once the PR stack is merged and flags are enabled.
- MEDIUM: Add a CI job with ephemeral Postgres for Alembic upgrade/downgrade proof; static downgrade checks are not enough.
