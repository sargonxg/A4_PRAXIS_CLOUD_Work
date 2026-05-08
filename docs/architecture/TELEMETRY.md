# PRAXIS Structured Telemetry

Date: 2026-05-08
Source prompts: `docs/codex-prompts/PRAXIS_V2_D0_STRUCTURED_EVENTS.md`,
`docs/codex-prompts/PRAXIS_V2_D1_KPI_PIPELINE.md`

PRAXIS emits a small, schema-versioned JSON-line event stream for the user
actions and backend paths that determine product health. The local contract is
implemented in `src/types/telemetry.ts` and `src/lib/telemetry/emit.ts`.

## Event Shape

Every event has:

- `schemaVersion`: currently `1`
- `eventName`: one of the canonical event names in `TELEMETRY_EVENT_NAMES`
- `uid`, `orgId`, `caseId`, `sessionId`
- `route`, `toolId`
- `latencyMs`, `status`, `costUsd`
- `createdAt`
- `details`

`details` is capped at 1KB before emission. This keeps free-form telemetry from
becoming a shadow data store or leaking source content into logs. The cap is
covered by `tests/unit/lib/telemetry/emit.test.ts`.

## Server Events

The first D0 pass wires the high-value server paths:

- situation creation and deletion;
- calibrated AI snapshots, context refusals, force-run decisions, and tool
  start/complete/fail;
- document upload start/complete/fail;
- graph population start/complete/fail;
- browser telemetry intake rate-limit drops.

Server handlers call `emitTelemetrySafe()` so telemetry failure never blocks the
product path.

## Browser Events

Client code can call `trackTelemetry()` from `src/lib/telemetry/browser.ts`.
The browser can only submit the safe subset of events through
`/api/telemetry/log`; the server derives `uid` from auth and rejects arbitrary
event names.

## Enforcement

Run:

```bash
npm run audit:telemetry-coverage
```

The audit verifies the event registry, emitter, browser intake, 1KB cap,
critical server emit sites, and audit gate membership.

## Downstream KPI Pipeline

D1 consumes these JSON-line events with the BigQuery assets in
`infrastructure/bigquery/`. The live sink and dashboard are an operational step:
they should be deployed only after D0 is live and Cloud Logging shows structured
`praxis.telemetry.*` events in production.
