# D0 — Structured events: standard taxonomy

## Goal

Today, you can't answer questions like "how many real users ran a
hero tool last week, by tool, by case-thickness, in p50 latency."
Cloud Logging captures sampled, unstructured stdout. This file
standardizes a JSON-line event schema emitted from every meaningful
state change in the app: tool runs, case open, document upload, graph
populate, exports. D1 sinks these into BigQuery.

## Files Codex must read first

- Logging utilities: `src/lib/logging/*.ts` if they exist
- One representative hero-tool POST handler
- `src/lib/api/with-calibration.ts`
- `src/app/api/situations/create/route.ts`

## Tasks

### 1. Define the event taxonomy

`src/types/telemetry.ts`:

```typescript
export type TelemetryEventName =
  // Auth
  | 'auth.signin'
  | 'auth.signout'
  | 'auth.cookie-refresh'
  // Cases
  | 'case.create'
  | 'case.open'
  | 'case.delete'
  | 'case.share'
  | 'case.unshare'
  // Documents
  | 'document.upload-start'
  | 'document.upload-complete'
  | 'document.upload-fail'
  // Graph
  | 'graph.populate-start'
  | 'graph.populate-complete'
  | 'graph.approve'
  | 'graph.reject'
  | 'graph.read'
  // Hero tools
  | 'tool.run-start'
  | 'tool.run-complete'
  | 'tool.run-fail'
  // Marketplace
  | 'marketplace.recipe-stage'
  | 'marketplace.recipe-complete'
  // Memory
  | 'memory.cognify'
  | 'memory.recall'
  // Calibration
  | 'calibration.snapshot'
  | 'calibration.refusal'
  | 'calibration.compensation'
  // Exports
  | 'export.briefing'
  | 'export.boardroom'
  // Org / multi-tenant
  | 'invitation.create'
  | 'invitation.accept'
  | 'collaborator.add'
  | 'collaborator.remove'
  // System
  | 'route.5xx'
  | 'route.timeout';

export interface TelemetryEvent {
  // Stable schema
  event: TelemetryEventName;
  ts: string;                  // ISO timestamp
  uid: string | null;          // null for unauthenticated routes
  orgId: string | null;
  sessionId: string | null;    // browser session, if available

  // Generic targets
  caseId?: string;
  toolId?: string;
  documentId?: string;
  recipeId?: string;
  invitationId?: string;

  // Outcome
  outcome: 'ok' | 'fail' | 'denied';
  latencyMs?: number;
  errorClass?: string;         // e.g. 'TimeoutError', 'PermissionDenied'
  errorMessage?: string;

  // Free-form details — small, no PII
  details?: Record<string, unknown>;

  // Hash chain hook (mirrors audit log; optional here)
  schemaVersion: 1;
}
```

The schema is **frozen**. Adding a new event name requires a new
release. Adding a new field is allowed (optional). Removing a field
breaks downstream queries — don't.

### 2. Emitter

`src/lib/telemetry/emit.ts`:

```typescript
import type { TelemetryEvent, TelemetryEventName } from '@/types/telemetry';

interface EmitParams extends Omit<TelemetryEvent, 'ts' | 'event' | 'schemaVersion'> {
  event: TelemetryEventName;
}

/**
 * Emit a structured event to stdout as JSON. Cloud Logging picks it up
 * automatically. Each line is one event, parseable by BigQuery
 * structured-log sink.
 *
 * NEVER include PII, raw user content, or secrets in details.
 */
export function emitTelemetry(params: EmitParams): void {
  const event: TelemetryEvent = {
    schemaVersion: 1,
    ts: new Date().toISOString(),
    ...params,
  };
  // JSON line on stdout — Cloud Logging captures
  console.log(JSON.stringify({ telemetry: event }));
}

// Helper for the common "wrap an async operation with a timer" case
export async function withTelemetry<T>(
  name: TelemetryEventName,
  context: Pick<EmitParams, 'uid' | 'orgId' | 'caseId' | 'toolId' | 'documentId' | 'sessionId'>,
  op: () => Promise<T>,
): Promise<T> {
  const t0 = Date.now();
  try {
    const result = await op();
    emitTelemetry({
      event: name,
      ...context,
      outcome: 'ok',
      latencyMs: Date.now() - t0,
    });
    return result;
  } catch (err) {
    const errorClass = err instanceof Error ? err.constructor.name : 'Unknown';
    emitTelemetry({
      event: name,
      ...context,
      outcome: 'fail',
      latencyMs: Date.now() - t0,
      errorClass,
      errorMessage: err instanceof Error ? err.message.slice(0, 200) : String(err).slice(0, 200),
    });
    throw err;
  }
}
```

### 3. Wire into call sites

For each event in the taxonomy, find the handler and add an emit.
Codex produces a checklist mapping event → file → line, then edits
each.

Examples:

```typescript
// /api/situations/create/route.ts (success)
emitTelemetry({
  event: 'case.create',
  uid: user.uid, orgId: user.orgId,
  caseId: newSituation.id,
  outcome: 'ok',
  details: { visibility: newSituation.visibility },
});

// /api/tools/<id>/route.ts (full run, with timer)
return await withTelemetry('tool.run-complete', {
  uid: user.uid, orgId: user.orgId,
  caseId, toolId,
  sessionId: req.cookies.get('session-id')?.value ?? null,
}, async () => {
  // ... existing tool logic
});
```

For events that come from the calibration block:

```typescript
// in withCalibration, after snapshot built:
emitTelemetry({
  event: 'calibration.snapshot',
  uid, orgId,
  caseId, toolId,
  outcome: 'ok',
  details: {
    health: snapshot.composite.health,
    graphHealth: snapshot.graph.health,
    profileHealth: snapshot.profile.health,
    sourcesHealth: snapshot.sources.health,
    memoryEnabled: snapshot.memory.enabled,
    memoryItems: snapshot.memory.itemsRecalled,
  },
});

// when a refusal triggers:
emitTelemetry({
  event: 'calibration.refusal',
  uid, orgId,
  caseId, toolId,
  outcome: 'denied',
  details: { reason: snapshot.composite.reasons.join('; ') },
});
```

### 4. Browser-side events

For `case.open` and similar UI events, emit from the browser to
`/api/telemetry/log`:

`src/app/api/telemetry/log/route.ts`:

```typescript
export const POST = withAuth(async (req, user) => {
  const body = await req.json() as { event: TelemetryEventName; details?: any; caseId?: string };

  // Server-side validation: event name must be in allow-list
  const ALLOWED_FROM_BROWSER: TelemetryEventName[] = [
    'case.open', 'marketplace.recipe-stage', 'route.5xx', 'route.timeout',
  ];
  if (!ALLOWED_FROM_BROWSER.includes(body.event)) {
    return NextResponse.json({ error: 'event not browser-permitted' }, { status: 400 });
  }

  emitTelemetry({
    event: body.event,
    uid: user.uid, orgId: user.orgId,
    caseId: body.caseId,
    sessionId: req.cookies.get('session-id')?.value ?? null,
    outcome: 'ok',
    details: body.details,
  });

  return NextResponse.json({ ok: true });
});
```

Browser side:

```typescript
// src/lib/telemetry/browser.ts
export async function trackBrowserEvent(name: BrowserTelemetryName, details?: any): Promise<void> {
  try {
    await fetch('/api/telemetry/log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: name, details }),
      keepalive: true,
    });
  } catch {
    // Silent fail — telemetry should never block UX
  }
}
```

### 5. PII hygiene

The schema explicitly does NOT include:

- Raw user prompts
- Document contents
- Email addresses (uid is an opaque identifier)
- Tool output text
- Any free-form user-typed text

The `details` field is bounded to small structured values
(numbers, booleans, enum strings, short ids). Codex includes a unit
test that asserts the emit function rejects events with details
exceeding 1KB serialized.

### 6. Rate limiting (defensive)

A misbehaving caller could flood logs. Server-side, per-uid:

- max 200 events / minute / uid
- excess events are dropped with a single `route.timeout` event per
  minute noting the throttle

Implement as in-memory sliding window (Cloud Run instances are
multi-tenant, so this is per-instance — good enough as defense, not
strict).

### 7. Audit: `audit:telemetry-coverage`

Static-marker. Required emit calls per route family:

```typescript
// scripts/audit-telemetry-coverage.ts
const REQUIRED = {
  'src/app/api/situations/create/route.ts': ['case.create'],
  'src/app/api/situations/[caseId]/route.ts': ['case.delete'],  // for DELETE
  'src/app/api/graph/populate/route.ts': ['graph.populate-start', 'graph.populate-complete'],
  // ... etc
};
// For each file, confirm the named events are present.
```

Add to `audit:gate`.

### 8. Documentation

`docs/architecture/TELEMETRY.md`:

```markdown
# PRAXIS Telemetry

## Schema

See src/types/telemetry.ts. Schema version 1 is FROZEN. New event
names require a release; field additions are non-breaking; field
removal is breaking.

## What's logged

Every state change. Tool runs, case lifecycle, document uploads,
graph operations, calibration snapshots, exports, multi-tenant
actions.

## What's NOT logged

Raw user content, prompts, document text, tool output. Telemetry is
for behavior measurement, not content storage. Audit log (A6) is
the place for action-level forensics; telemetry is for aggregates.

## Sink

stdout JSON-line → Cloud Logging → BigQuery sink (D1).

## Privacy

uid is opaque (Firebase uid). orgId is opaque. No PII in details.
The 1KB details cap prevents accidental smuggling.
```

## Acceptance criteria

1. `src/types/telemetry.ts` defines the event schema.
2. `emitTelemetry` and `withTelemetry` helpers in
   `src/lib/telemetry/emit.ts`.
3. Every event in the taxonomy has at least one emit site.
4. Browser-side `trackBrowserEvent` for UI events.
5. PII-free `details` enforced by unit test.
6. Per-uid rate limit in place.
7. `audit:telemetry-coverage` passes.
8. Manual smoke: open a case, run a tool, observe Cloud Logging
   for the JSON-line events.

## Diagnostics

```bash
test -f src/types/telemetry.ts && echo OK
test -f src/lib/telemetry/emit.ts && echo OK
test -f src/app/api/telemetry/log/route.ts && echo OK
npm run audit:telemetry-coverage && echo OK
npm run build && echo OK

# Smoke (after deploy):
gcloud run services logs read praxis-monolith --region=<region> \
  --limit=20 --format='value(textPayload)' | grep -c '"telemetry"'
# expect > 0 (recent activity emitting events)
```

## If Codex stops short

**Failure mode A**: Telemetry includes user prompt text. **Stop.**
Re-prompt:

> "PII / content leakage. The details field must NEVER include the
> user prompt, document content, or tool output text. Use enum
> classifications, counts, latencies, status flags. Re-audit every
> emit site and remove free-form text."

**Failure mode B**: Emit is a fire-and-forget Promise that gets
swallowed in async flows. Re-prompt:

> "console.log(JSON.stringify(...)) is synchronous — that's fine.
> Confirm no emit site uses an async pattern that can drop on
> serverless instance shutdown. The emitTelemetry function should
> not return a Promise."

**Failure mode C**: Rate limit blocks legitimate bursts (e.g.,
populate-graph emits 50 sub-events). Re-prompt:

> "Tune the rate limit: 200/min/uid is for normal users. A graph
> populate that emits per-node events should be a single
> aggregated emit, not 50. Find batch operations and consolidate."

## Commit

```
feat(D0): structured event taxonomy

Adds src/types/telemetry.ts (schema v1, FROZEN) and
src/lib/telemetry/emit.ts emitter. Every meaningful state change
in the app emits a JSON-line event to stdout, captured by Cloud
Logging.

Browser-side events route through /api/telemetry/log with
allow-list validation. PII-free by construction (no raw content,
1KB details cap, opaque ids only).

audit:telemetry-coverage enforces that key routes emit their
expected events.

Foundation for D1 (BigQuery sink + dashboard).

Refs: V2_WORK_PACK/D0_STRUCTURED_EVENTS.md
```
