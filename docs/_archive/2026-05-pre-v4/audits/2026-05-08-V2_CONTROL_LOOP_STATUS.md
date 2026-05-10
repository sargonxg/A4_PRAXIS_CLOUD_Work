# PRAXIS V2 Control Loop And Status Audit

Date: 2026-05-08

## Scope

Read and preserved:

- `ITERATE_LOOP.md`
- `STATUS_TEMPLATE.md`

## Implementation

- Copied both control prompts into `docs/codex-prompts/`:
  - `PRAXIS_V2_ITERATE_LOOP.md`
  - `PRAXIS_V2_STATUS_TEMPLATE.md`
- Updated `scripts/audit-codex-prompts.ts` to enforce these two files with
  marker-specific checks instead of the long implementation-pack heuristic.
- Updated `STATUS.md` with explicit pending operational steps for the blocked
  V2 lanes and Session D KPI deployment work.
- Added this audit note and a build-log entry so future agents can see why the
  files are control-plane artifacts, not feature implementation specs.

## Current Recovery State

The latest recovery event matched `ITERATE_LOOP` Pattern 1:

- Signal: `audit:gate` stopped at `audit:master-charter` after code changes.
- Cause: Graphify outputs were stale against the current commit set.
- Recovery: ran `graphify update .`, then reran the failed gate tail.
- Result: `audit:master-charter` and the rest of the gate tail passed.

## Validation Commands

```bash
npm run audit:codex-prompts
npm run audit:master-charter
npm run build
```

Full `audit:gate` is safe to rerun, but this pass only changes control docs and
the prompt-pack audit.
