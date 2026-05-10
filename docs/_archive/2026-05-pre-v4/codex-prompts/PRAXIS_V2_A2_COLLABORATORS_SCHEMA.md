# A2 — Collaborators schema on situations

## Goal

Every situation gains an `orgId` and a `collaborators[]` array. This is
the data field over which the Firestore rules in A3 will enforce
multi-tenant access. Without this, A3 has nothing to enforce.

## Files Codex must read first

- `docs/architecture/MULTI_TENANT_MODEL.md` (locked decisions from A0)
- `src/types/situation.ts` — current `Situation` type
- `src/lib/situations/firestore-store.ts` (or wherever situations are
  read/written)
- `src/app/api/situations/create/route.ts`
- `scripts/migrate-self-orgs.ts` (from A1 — handles backfill)

## Tasks

### 1. Update `Situation` type

```typescript
// src/types/situation.ts

export type CollaboratorRole = 'editor' | 'viewer' | 'commenter';

export interface SituationCollaborator {
  uid: string;
  email: string;        // for display + invite resolution
  role: CollaboratorRole;
  addedAt: string;      // ISO timestamp
  addedBy: string;      // uid of the inviter
}

export interface Situation {
  // existing fields...

  // V2 multi-tenant fields. Required after migration.
  orgId: string;
  ownerUid: string;       // == users/{uid} path segment for backwards-compat
  collaborators: SituationCollaborator[];

  // Optional metadata for the team experience.
  visibility?: 'private' | 'org' | 'shared';
  // - private: only ownerUid + explicit collaborators
  // - org: anyone in the orgId with editor+ role
  // - shared: same as 'org' but read-only for non-collaborators
  // Default: 'private'.
}
```

### 2. New helpers

Create `src/lib/situations/access.ts`:

```typescript
import type { AuthenticatedUser, OrgRole } from '@/types/auth';
import type { Situation, SituationCollaborator } from '@/types/situation';

export type EffectiveRole = 'owner' | 'editor' | 'commenter' | 'viewer' | 'none';

/**
 * Resolves the effective role of `user` on `situation`. Returns
 * 'none' if no access at all.
 *
 * Order of precedence:
 * 1. ownerUid match → 'owner'
 * 2. explicit collaborator entry → that role
 * 3. same orgId + visibility allows → derived role
 * 4. otherwise → 'none'
 */
export function resolveEffectiveRole(
  user: AuthenticatedUser,
  situation: Situation,
): EffectiveRole {
  if (situation.ownerUid === user.uid) return 'owner';

  const explicit = situation.collaborators.find((c) => c.uid === user.uid);
  if (explicit) return explicit.role;

  if (situation.orgId === user.orgId) {
    const v = situation.visibility ?? 'private';
    if (v === 'org' && user.roles.some((r: OrgRole) => r === 'editor' || r === 'owner')) {
      return 'editor';
    }
    if (v === 'shared') return 'viewer';
  }

  return 'none';
}

export function canRead(role: EffectiveRole): boolean {
  return role !== 'none';
}

export function canEdit(role: EffectiveRole): boolean {
  return role === 'owner' || role === 'editor';
}

export function canComment(role: EffectiveRole): boolean {
  return role === 'owner' || role === 'editor' || role === 'commenter';
}

export function canDelete(role: EffectiveRole): boolean {
  return role === 'owner';
}
```

### 3. Situation creation sets the new fields

In `src/app/api/situations/create/route.ts`:

```typescript
// inside the handler, when constructing the new situation:
const newSituation: Situation = {
  // existing fields...
  orgId: user.orgId,
  ownerUid: user.uid,
  collaborators: [],
  visibility: body.visibility ?? 'private',
};
```

### 4. Read paths use `resolveEffectiveRole`

For each route that reads a situation by id, replace `if (situation.uid
=== user.uid)` checks (or equivalent) with:

```typescript
import { resolveEffectiveRole, canRead } from '@/lib/situations/access';

const role = resolveEffectiveRole(user, situation);
if (!canRead(role)) {
  return NextResponse.json({ error: 'not found' }, { status: 404 });
}
```

Return `404` not `403` — don't leak the existence of a situation the
user can't read. Codex should grep for current ownership checks:

```bash
rg "user\\.uid !== situation\\.ownerUid|user\\.uid === situation\\.uid|situation\\.uid !== user\\.uid" src/
```

For each match, replace with the helper.

### 5. Write paths use `canEdit`

Same pattern: every mutation route checks `canEdit(role)` before
accepting writes. Comment-only routes (memo creation, notes) check
`canComment(role)`.

### 6. Type extension for FirestoreStore

In `src/lib/situations/firestore-store.ts` or whichever data layer
reads situations:

```typescript
// Backfill defaults on read for any document that predates the
// migration (defensive — migration should have caught these but be
// safe).

function hydrateSituation(raw: any): Situation {
  return {
    ...raw,
    orgId: raw.orgId ?? `self-${raw.ownerUid ?? raw.uid}`,
    ownerUid: raw.ownerUid ?? raw.uid,
    collaborators: raw.collaborators ?? [],
    visibility: raw.visibility ?? 'private',
  };
}
```

### 7. Audit: `audit:situation-mt-fields`

Create `scripts/audit-situation-mt-fields.ts`:

```typescript
#!/usr/bin/env tsx
/**
 * audit:situation-mt-fields (static-marker) — every situation
 * read/write path must use the multi-tenant access helpers, not
 * inline ownerUid checks.
 */

import { execSync } from 'node:child_process';
import process from 'node:process';

const FORBIDDEN_PATTERNS = [
  String.raw`user\.uid\s*!==\s*situation\.ownerUid`,
  String.raw`user\.uid\s*===\s*situation\.uid`,
  String.raw`situation\.uid\s*!==\s*user\.uid`,
];

const findings: string[] = [];
for (const p of FORBIDDEN_PATTERNS) {
  try {
    const out = execSync(
      `rg --no-heading -n '${p}' src/app src/lib --type ts --type tsx -e '${p}' || true`,
      { encoding: 'utf-8' },
    );
    for (const line of out.split('\n')) {
      if (line.trim() && !line.includes('access.ts')) findings.push(line);
    }
  } catch {
    // ignore
  }
}

if (findings.length > 0) {
  console.error('audit:situation-mt-fields FAILED');
  console.error('Found inline ownership checks. Use resolveEffectiveRole instead:');
  for (const f of findings) console.error('  ' + f);
  process.exit(1);
}
console.log('audit:situation-mt-fields passed (static-marker)');
```

Add to `package.json` and `audit:gate`.

## Acceptance criteria

1. `Situation` type includes `orgId`, `ownerUid`, `collaborators`,
   `visibility`.
2. `src/lib/situations/access.ts` exports `resolveEffectiveRole` and
   `canRead`/`canEdit`/`canComment`/`canDelete`.
3. New situations created after this file include the fields.
4. Existing read/write paths use the access helpers, not inline `uid`
   comparisons.
5. `audit:situation-mt-fields` passes and is in `audit:gate`.
6. `hydrateSituation` defends against any pre-migration document.
7. `npm run build && npm run audit:gate` passes.

## Diagnostics

```bash
# 1. Types
grep -q "SituationCollaborator" src/types/situation.ts && echo OK
grep -q "ownerUid" src/types/situation.ts && echo OK

# 2. Helper
test -f src/lib/situations/access.ts && echo OK
grep -q "resolveEffectiveRole" src/lib/situations/access.ts && echo OK

# 3. No inline ownership checks remain
npm run audit:situation-mt-fields && echo OK

# 4. Creation sets fields
grep -q "orgId: user.orgId" src/app/api/situations/create/route.ts && echo OK

# 5. Build
npm run build && echo OK
```

## If Codex stops short

**Failure mode A**: Codex misses some inline ownership checks. Re-prompt:

> "Run the audit script and paste the full output. For every line in
> the failure list, open the file, replace the inline check with
> `const role = resolveEffectiveRole(user, situation); if (!canRead(role))
> return 404` (or canEdit/canComment as appropriate). Show me each
> diff."

**Failure mode B**: A read returns 403 instead of 404 for a
non-collaborator. Re-prompt:

> "Privacy: a user with no access to a situation must get 404, not
> 403. 403 leaks the existence of the document. Update every
> non-access response to `{ error: 'not found' }` with status 404."

**Failure mode C**: Codex breaks the demo accounts because demo
situations don't have `orgId`. Re-prompt:

> "Demo accounts have isDemo=true and live under a different code
> path. Confirm `hydrateSituation` defaults orgId to `self-${uid}`
> when missing — this should keep demos working. If demos are still
> broken, trace the demo loader and ensure it sets orgId on the
> in-memory situation object."

**Failure mode D**: Create-situation handler ignores `body.visibility`.
Re-prompt:

> "When the create handler receives `visibility` in the request body,
> validate it against ['private', 'org', 'shared'] and pass through.
> Default to 'private' if missing. Show me the validation."

## Commit

```
feat(mt): collaborators and visibility on situations

Situations gain orgId, ownerUid, collaborators[], visibility. New
access helpers (resolveEffectiveRole, canRead, canEdit, canComment,
canDelete) replace inline ownerUid comparisons. Read/write paths
go through the helpers; non-access returns 404 not 403.

audit:situation-mt-fields (static-marker) blocks regressions to
inline checks.

Refs: V2_WORK_PACK/A2_COLLABORATORS_SCHEMA.md
```
