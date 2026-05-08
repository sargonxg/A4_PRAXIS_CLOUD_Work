# A6 — Multi-tenant audit log

## Goal

Every state-changing action in a multi-tenant context must be logged
with: who did it, in which org, on which situation, what they did,
when, and a tamper-evident hash. This is required by every
institutional procurement (SOC2 Type II, FedRAMP-lite, ISO 27001).
It's also useful for product analytics and incident investigation.

## Files Codex must read first

- `src/lib/api/with-auth.ts` — for the user context
- `backend/services/postgres.py` — if backend audits go to Postgres
- `firestore.rules` (A3) — for the audit_log collection rules

## Tasks

### 1. Audit-log document shape

```typescript
// src/types/audit-log.ts

export type AuditAction =
  | 'situation.create'
  | 'situation.update'
  | 'situation.delete'
  | 'situation.share'
  | 'situation.unshare'
  | 'situation.visibility-change'
  | 'collaborator.add'
  | 'collaborator.remove'
  | 'collaborator.role-change'
  | 'tool.run'
  | 'tool.fail'
  | 'memo.create'
  | 'memo.update'
  | 'memo.delete'
  | 'document.upload'
  | 'document.delete'
  | 'graph.populate'
  | 'graph.approve'
  | 'graph.reject'
  | 'graph.edit-node'
  | 'graph.edit-edge'
  | 'export.briefing'
  | 'export.boardroom'
  | 'invitation.create'
  | 'invitation.accept'
  | 'invitation.revoke'
  | 'invitation.expire'
  | 'org.create'
  | 'org.update'
  | 'auth.signin'
  | 'auth.signout'
  | 'auth.cookie-refresh';

export interface AuditLogEntry {
  id: string;            // ULID — sortable + unique
  ts: string;            // ISO timestamp
  orgId: string;
  uid: string;            // who did it
  email: string;
  action: AuditAction;
  // Target identifiers — at least one should be set.
  situationId?: string;
  toolId?: string;
  documentId?: string;
  memoId?: string;
  collaboratorUid?: string;
  invitationId?: string;
  // Free-form payload, JSON-stringified.
  details: Record<string, unknown>;
  // Outcome: 'ok' (action succeeded) | 'denied' (auth/permissions) | 'error'
  outcome: 'ok' | 'denied' | 'error';
  // Tamper-evident: chain hash.
  prevHash: string | null;
  hash: string;
}
```

Stored at `audit_log/{orgId}/entries/{entryId}`.

### 2. Logger module

Create `src/lib/audit/audit-log.ts`:

```typescript
import crypto from 'node:crypto';
import { adminFirestore } from '@/lib/firebase/admin';
import type { AuditAction, AuditLogEntry } from '@/types/audit-log';

interface LogParams {
  orgId: string;
  uid: string;
  email: string;
  action: AuditAction;
  situationId?: string;
  toolId?: string;
  documentId?: string;
  memoId?: string;
  collaboratorUid?: string;
  invitationId?: string;
  details?: Record<string, unknown>;
  outcome?: 'ok' | 'denied' | 'error';
}

function ulid(): string {
  // Crockford ULID; pull a small implementation. Codex can use the
  // 'ulid' npm package or implement inline.
  // Sortable: timestamp prefix + random suffix.
  return `${Date.now().toString(36)}-${crypto.randomBytes(8).toString('hex')}`;
}

function entryHash(entry: Omit<AuditLogEntry, 'hash'>): string {
  const canonical = JSON.stringify({
    id: entry.id,
    ts: entry.ts,
    orgId: entry.orgId,
    uid: entry.uid,
    email: entry.email,
    action: entry.action,
    situationId: entry.situationId ?? null,
    toolId: entry.toolId ?? null,
    documentId: entry.documentId ?? null,
    memoId: entry.memoId ?? null,
    collaboratorUid: entry.collaboratorUid ?? null,
    invitationId: entry.invitationId ?? null,
    details: entry.details,
    outcome: entry.outcome,
    prevHash: entry.prevHash,
  });
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

/**
 * Append an audit entry to the org's chain. Reads the latest entry
 * for the chain hash.
 */
export async function logAudit(params: LogParams): Promise<void> {
  const db = adminFirestore();
  const id = ulid();
  const ts = new Date().toISOString();

  // Find the latest entry for prevHash.
  const recent = await db
    .collection('audit_log').doc(params.orgId).collection('entries')
    .orderBy('ts', 'desc').limit(1).get();
  const prevHash = recent.empty ? null : (recent.docs[0].data().hash as string);

  const baseEntry: Omit<AuditLogEntry, 'hash'> = {
    id, ts,
    orgId: params.orgId,
    uid: params.uid,
    email: params.email,
    action: params.action,
    situationId: params.situationId,
    toolId: params.toolId,
    documentId: params.documentId,
    memoId: params.memoId,
    collaboratorUid: params.collaboratorUid,
    invitationId: params.invitationId,
    details: params.details ?? {},
    outcome: params.outcome ?? 'ok',
    prevHash,
  };
  const hash = entryHash(baseEntry);

  await db
    .collection('audit_log').doc(params.orgId).collection('entries').doc(id)
    .set({ ...baseEntry, hash });
}
```

**Note**: the chain hash is best-effort — concurrent writes may produce
forks. For the strict-chain version use a transaction. For a v2 audit
log this is acceptable, especially with millisecond ULIDs reducing
collision likelihood. Codex documents this trade-off in
`docs/architecture/AUDIT_LOG.md`.

### 3. Wire into every state-changing path

For each of the 30+ `AuditAction` values, find the route or handler
that performs the action. Add a `logAudit(...)` call after the mutation
succeeds:

```typescript
// example in /api/tools/run/[toolId]/route.ts:
await logAudit({
  orgId: user.orgId,
  uid: user.uid,
  email: user.email,
  action: 'tool.run',
  situationId: caseId,
  toolId,
  details: {
    promptHealth: snapshot.composite.health,
    runtimeMs: Date.now() - start,
    modelUsed: tool.tier === 'calibrated-ai' ? 'pro' : null,
  },
  outcome: 'ok',
});
```

Codex should produce a checklist mapping each AuditAction to its
implementation site, then visit each one.

### 4. Verifier

Create `scripts/verify-audit-chain.ts`:

```typescript
#!/usr/bin/env tsx
/**
 * Verify the audit chain for an org. Walks entries in ts order,
 * recomputes each hash, confirms prevHash linkage. Reports first break.
 */

import process from 'node:process';
import crypto from 'node:crypto';
import { adminFirestore } from '../src/lib/firebase/admin';

async function main() {
  const orgId = process.argv[2];
  if (!orgId) {
    console.error('usage: tsx scripts/verify-audit-chain.ts <orgId>');
    process.exit(2);
  }
  const db = adminFirestore();
  const snap = await db.collection('audit_log').doc(orgId).collection('entries')
    .orderBy('ts', 'asc').get();

  let lastHash: string | null = null;
  let breaks: string[] = [];
  for (const doc of snap.docs) {
    const e = doc.data();
    if (e.prevHash !== lastHash) {
      breaks.push(`${e.id}: prevHash=${e.prevHash} expected=${lastHash}`);
    }
    // Recompute hash
    const { hash, ...rest } = e;
    const computed = crypto.createHash('sha256').update(JSON.stringify(rest)).digest('hex');
    if (computed !== hash) {
      breaks.push(`${e.id}: hash tampered (computed=${computed}, stored=${hash})`);
    }
    lastHash = e.hash;
  }

  if (breaks.length > 0) {
    console.error(`Audit chain broken for ${orgId} (${snap.size} entries):`);
    for (const b of breaks) console.error('  ' + b);
    process.exit(1);
  }
  console.log(`Audit chain verified: ${snap.size} entries, no breaks.`);
}

main().catch(console.error);
```

### 5. Owner-only export endpoint

`src/app/api/orgs/[orgId]/audit-log/export/route.ts`:

Returns CSV of the org's audit log. Owner-only. Streamed to handle
large logs.

```typescript
export const GET = withAuth(async (req, user) => {
  const orgId = req.nextUrl.pathname.split('/')[3];
  // Verify owner
  const orgDoc = await adminFirestore().collection('organizations').doc(orgId).get();
  if (!orgDoc.exists || orgDoc.data()?.ownerUid !== user.uid) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  // Stream CSV
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(new TextEncoder().encode(
        'id,ts,uid,email,action,situationId,toolId,outcome,details_json\n'
      ));
      const snap = await adminFirestore()
        .collection('audit_log').doc(orgId).collection('entries')
        .orderBy('ts', 'asc').get();
      for (const doc of snap.docs) {
        const e = doc.data();
        const row = [
          e.id, e.ts, e.uid, e.email, e.action,
          e.situationId ?? '', e.toolId ?? '',
          e.outcome, JSON.stringify(e.details).replace(/,/g, '|')
        ].join(',') + '\n';
        controller.enqueue(new TextEncoder().encode(row));
      }
      controller.close();
    },
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="audit-${orgId}-${new Date().toISOString()}.csv"`,
    },
  });
});
```

### 6. Firestore rules for audit log

In `firestore.rules` (extending A3):

```javascript
match /audit_log/{orgId} {
  // The wrapper doc (rarely accessed directly)
  allow read: if isAuthenticated() &&
    get(/databases/$(database)/documents/organizations/$(orgId)).data.ownerUid == userUid();
  allow write: if false;

  match /entries/{entryId} {
    // Only the org owner can read.
    allow read: if isAuthenticated() &&
      get(/databases/$(database)/documents/organizations/$(orgId)).data.ownerUid == userUid();
    // Writes only via Admin SDK (server-side). Clients never write.
    allow write: if false;
  }
}
```

### 7. Audit: `audit:audit-log-coverage`

Static-marker audit confirming every mutating route imports and calls
`logAudit`:

```typescript
// scripts/audit-audit-log-coverage.ts
// Walk src/app/api/**/route.ts. For each file containing POST/PUT/PATCH/DELETE,
// confirm `import { logAudit }` appears AND `logAudit(` is called.
// Allowlist: routes that don't mutate state (GET-only, /api/health/*, etc).
```

Add to `audit:gate`.

### 8. UI: audit-log viewer (owner only)

A simple `/app/team/audit-log` page that paginates the entries with
filters: action, user, date range. Owner-only. This is for incident
investigation, not analytics.

Lightweight implementation: server-side pagination, table layout, no
fancy charts.

## Acceptance criteria

1. `logAudit` exists and is called from every mutating route.
2. Audit entries form a hash chain (prevHash → hash).
3. `verify-audit-chain.ts` script verifies the chain for any org.
4. Owner-only CSV export endpoint.
5. Owner-only viewer page.
6. Firestore rules deny client writes to audit_log.
7. `audit:audit-log-coverage` passes.
8. `npm run build && npm run audit:gate` passes.
9. Manual smoke: perform 5 actions in a test org, run the verifier,
   confirm 5 entries with intact chain.

## Diagnostics

```bash
test -f src/lib/audit/audit-log.ts && echo OK
test -f scripts/verify-audit-chain.ts && echo OK
test -f src/app/api/orgs/\\[orgId\\]/audit-log/export/route.ts && echo OK
npm run audit:audit-log-coverage && echo OK
npm run build && echo OK

# Manual: in dev, perform 5 actions, then:
npx tsx scripts/verify-audit-chain.ts <test-orgId>
```

## If Codex stops short

**Failure mode A**: Codex adds `logAudit` calls but forgets to await
them and the writes lose ordering. Re-prompt:

> "Every logAudit call must be awaited. The chain integrity depends
> on serial ordering of writes per org. Find every call and confirm
> `await logAudit(...)`. If a route can't block on the audit write,
> use a queue (Cloud Tasks) — but for v2 simple await is fine."

**Failure mode B**: Codex implements the verifier but it doesn't
detect tampering. Re-prompt:

> "Test the verifier: open a test entry in the Firestore console,
> change one field manually, run the verifier — it must report the
> hash mismatch with the entry id. If it doesn't, the recompute is
> incorrect; fix the JSON canonicalization."

**Failure mode C**: The audit log is too noisy (every micro-action
floods the log). Re-prompt:

> "Some actions are too granular (e.g., draft autosave). Define
> `action` values only for user-meaningful events. Autosaves go to
> Cloud Logging, not the audit log. Review the AuditAction list and
> remove anything that doesn't matter for compliance/investigation."

**Failure mode D**: The CSV export endpoint loads everything into
memory. Re-prompt:

> "Stream the CSV with a ReadableStream that fetches Firestore in
> chunks (use `.startAfter(lastDoc).limit(500)` in a loop). Do not
> materialize the full result set."

## Commit

```
feat(mt): tamper-evident audit log

Every state-changing action emits an AuditLogEntry to
audit_log/{orgId}/entries/. Entries form a hash chain (prevHash →
hash) for tamper-evidence. Verifier script walks the chain and
reports breaks.

Owner-only CSV export endpoint streams entries for compliance use.
Owner-only viewer page for incident investigation.

Firestore rules deny client writes; only the Admin SDK
(server-side) writes audit entries.

audit:audit-log-coverage (static-marker) ensures every mutating
route logs.

This is required for SOC2/FedRAMP/ISO procurement conversations.

Refs: V2_WORK_PACK/A6_MT_AUDIT_LOG.md
```
