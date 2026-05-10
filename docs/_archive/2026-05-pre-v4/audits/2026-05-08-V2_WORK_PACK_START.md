# PRAXIS V2 Work Pack Start

Date: 2026-05-08
Repo: `C:\Users\giuli\praxiscodexworking`
Source prompt: `docs/codex-prompts/PRAXIS_V2_00_README.md`

## Status

The PRAXIS V2 institutional-foundations pack has been preserved and registered.
The night-pack precondition is satisfied at this checkpoint: `STATUS.md`
records the honesty, calibration, Cognee UI, code-split, onboarding, thin-case,
embedding, ACO, audit-promotion, hygiene, and iterate-loop passes, and the last
full `npm run audit:gate` passed.

## Session Order

1. Session A: multi-tenant foundations, starting with `A0_MT_DATA_MODEL.md`.
2. Session B: Postgres KG cutover, risk-gated by live Cloud SQL graph row counts.
3. Session C: Cognee live handlers and Agent Engine subagent honesty.
4. Session D: production observability and KPI pipeline.

## Guardrails

- No new tools or product surfaces.
- Solo-user backwards compatibility is mandatory.
- Firestore rules changes require matching security tests.
- Postgres graph cutover must stop if live non-demo graph rows exist.
- Session cookie custom claims are append-only; the existing HMAC algorithm
  stays frozen.

## Next Action

Read and execute `C:\Users\giuli\Downloads\files (7)\A0_MT_DATA_MODEL.md`.
