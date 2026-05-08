# PRAXIS V2 Session B B2-B3 Intake

Date: 2026-05-08
Repo: `C:\Users\giuli\praxiscodexworking`
Source prompts:

- `docs/codex-prompts/PRAXIS_V2_B2_READ_PATH_POSTGRES.md`
- `docs/codex-prompts/PRAXIS_V2_B3_RETIRE_FIRESTORE_GRAPH.md`

## Result

B2 and B3 have been preserved and registered as part of PRAXIS V2 Session B.
They were not implemented in this pass because B0 is still blocked locally and
B1 has not been approved, implemented, enabled, or run for the required
verification window.

## Dependency Order

1. B0 must be rerun from a VPC-connected environment and record live row counts,
   pgvector latency, schema/index health, cost estimate, selected Case 1/2/3,
   and GC approval.
2. B1 can then dual-write graph mutations to Firestore plus Postgres and run
   for at least 7 production days with `KG_DUAL_WRITE=true`.
3. B2 can then move graph reads to Postgres with Firestore fallback only if the
   parity audit shows less than 5% drift, backlog is effectively empty, and
   B0 pgvector latency is acceptable.
4. B3 can then retire Firestore graph writes only after another 7 clean days of
   Postgres reads, less than 0.1% shadow drift, more than 99% Postgres source
   telemetry, no user-reported graph regressions, and explicit GC sign-off.

## Safety Notes

No graph read paths, graph write paths, Firestore rules, Cloud Run environment
flags, or production data were changed. B2/B3 are calendared cutover steps, not
safe local-only patches.
