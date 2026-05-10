# A1 — orgId in `withAuth` and session cookie

## Goal

Today `withAuth` returns `{uid, email, name, emailVerified, isDemo}`.
After this file, every authenticated request carries the user's
`orgId` and `roles[]`. This is the foundation for every other A-file
— rules, invites, role pills, audit log — and for every future
multi-tenant feature.

**Pre-condition: A0 decision doc is approved.**

## Files Codex must read first

- `docs/architecture/MULTI_TENANT_MODEL.md` — the locked decisions
- `src/lib/api/with-auth.ts`
- `src/lib/auth/cookie-signer.ts` — **off-limits except additive
  payload field**
- `src/lib/api/with-calibration.ts` — calls withAuth, will inherit
  the new context
- `src/types/auth.ts` (if it exists)
- Backend equivalents in `backend/api/auth.py` if present

## Tasks

### 1. Define types

In `src/types/auth.ts` (create if missing):

```typescript
export type OrgRole = 'owner' | 'editor' | 'commenter' | 'viewer';

export interface OrgMembership {
  orgId: string;
  /** A user can have multiple roles in the same org but at least one. */
  roles: OrgRole[];
  /** ISO timestamp of when the membership was created. */
  joinedAt: string;
  /** Optional display name for the org as seen by this user. */
  orgName?: string;
}

export interface AuthenticatedUser {
  uid: string;
  email: string;
  name: string;
  emailVerified?: boolean;
  isDemo: boolean;

  // V2 multi-tenant fields. Always present after A1 ships.
  orgId: string;             // implicit self-org by default: `self-${uid}`
  roles: OrgRole[];          // user's roles in orgId
  memberships: OrgMembership[]; // every org the user belongs to
  primaryOrgId: string;      // == orgId for now; future: user-selected
}

export function isOwnerLike(user: AuthenticatedUser): boolean {
  return user.roles.includes('owner');
}

export function canEdit(user: AuthenticatedUser): boolean {
  return user.roles.some((r) => r === 'owner' || r === 'editor');
}

export function canComment(user: AuthenticatedUser): boolean {
  return user.roles.some((r) => r === 'owner' || r === 'editor' || r === 'commenter');
}

export function canRead(user: AuthenticatedUser): boolean {
  return user.roles.length > 0;
}
```

### 2. Profile + memberships fetcher

Create `src/lib/auth/memberships.ts`:

```typescript
import { adminFirestore } from '@/lib/firebase/admin';
import type { OrgMembership, OrgRole } from '@/types/auth';

/**
 * Resolve every org the user belongs to. Implicit self-org is created
 * lazily on first call if missing. Cached at the request level.
 */
export async function resolveMemberships(uid: string, email: string): Promise<{
  orgId: string;
  roles: OrgRole[];
  memberships: OrgMembership[];
}> {
  const db = adminFirestore();

  // 1. Look up explicit memberships first (orgs invited to).
  const membershipsSnap = await db
    .collectionGroup('members')
    .where('uid', '==', uid)
    .get();

  const explicit: OrgMembership[] = [];
  for (const doc of membershipsSnap.docs) {
    const orgId = doc.ref.parent.parent?.id;
    if (!orgId) continue;
    const data = doc.data();
    explicit.push({
      orgId,
      roles: (data.roles as OrgRole[]) ?? ['viewer'],
      joinedAt: data.joinedAt ?? new Date().toISOString(),
      orgName: data.orgName,
    });
  }

  // 2. Ensure implicit self-org exists.
  const selfOrgId = `self-${uid}`;
  const selfOrgRef = db.collection('organizations').doc(selfOrgId);
  const selfOrgDoc = await selfOrgRef.get();
  if (!selfOrgDoc.exists) {
    const now = new Date().toISOString();
    await selfOrgRef.set({
      id: selfOrgId,
      kind: 'self',
      ownerUid: uid,
      ownerEmail: email,
      createdAt: now,
      name: 'Personal workspace',
    });
    await selfOrgRef.collection('members').doc(uid).set({
      uid,
      email,
      roles: ['owner'],
      joinedAt: now,
    });
  }

  // 3. Add self-org to memberships if not already present.
  const hasSelf = explicit.some((m) => m.orgId === selfOrgId);
  const memberships: OrgMembership[] = [...explicit];
  if (!hasSelf) {
    memberships.unshift({
      orgId: selfOrgId,
      roles: ['owner'],
      joinedAt: new Date().toISOString(),
      orgName: 'Personal workspace',
    });
  }

  // 4. Pick primary. For v2: first non-self org if present, else self.
  const primary = memberships.find((m) => m.orgId !== selfOrgId) ?? memberships[0];

  return {
    orgId: primary.orgId,
    roles: primary.roles,
    memberships,
  };
}
```

### 3. Update `withAuth`

In `src/lib/api/with-auth.ts`, after the existing user resolution:

```typescript
import { resolveMemberships } from '@/lib/auth/memberships';
import type { AuthenticatedUser } from '@/types/auth';

// inside the wrapper, after the basic user object is built:
const { orgId, roles, memberships } = await resolveMemberships(user.uid, user.email);

const authedUser: AuthenticatedUser = {
  uid: user.uid,
  email: user.email,
  name: user.name,
  emailVerified: user.emailVerified,
  isDemo: user.isDemo,
  orgId,
  roles,
  memberships,
  primaryOrgId: orgId,
};

return handler(req, authedUser);
```

The signature of `handler` does not change — it just gets a richer
user object. Existing routes that only use `user.uid` keep working.

### 4. Add to session cookie payload

In `src/lib/auth/cookie-signer.ts`, **without modifying the HMAC
algorithm or verification logic**, add `orgId` and `roles` to the
signed payload schema:

```typescript
// Find the SignedCookiePayload type. Add fields:
export interface SignedCookiePayload {
  // existing fields...
  onboardingComplete?: boolean;  // added in night pack
  orgId?: string;                // added in A1
  roles?: OrgRole[];             // added in A1
}
```

When the cookie is minted post-login, include the resolved orgId and
roles. Refresh logic:

```typescript
// in src/lib/auth/cookie-refresh.ts (create if missing)
export async function refreshSessionCookieClaims(uid: string, claims: Partial<SignedCookiePayload>) {
  // Fetch current cookie, verify (using the EXISTING verification
  // function — do not modify it), spread new claims, re-sign.
  // ...
}
```

Call this at three sites:
- `/login/callback` after `withAuth` resolves the user
- After onboarding completion (already done in night pack)
- After invite acceptance (will be added in A4)

### 5. Edge guard for org context

In `src/middleware.ts`, the existing onboarding guard runs on `/app/*`.
Add a parallel check that the cookie includes `orgId`. If not, force a
session refresh (clear cookie, redirect to `/login`). This catches users
with stale cookies from before A1 deployed.

```typescript
const cookieClaims = parseCookieClaims(request);
if (path.startsWith('/app') && !cookieClaims?.orgId) {
  // Stale cookie. Clear and re-authenticate.
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.set('refresh', '1');
  const res = NextResponse.redirect(url);
  res.cookies.delete('praxis_session');
  return res;
}
```

### 6. Backwards-compat shim for routes that read `user.uid` directly

Some routes destructure `{uid}` from `user`. They keep working — `uid`
is still on the type. Codex should not refactor them in this file.
A1 is purely additive.

### 7. Audit: `audit:auth-org-context`

Create `scripts/audit-auth-org-context.ts`:

```typescript
#!/usr/bin/env tsx
/**
 * audit:auth-org-context (static-marker) — verify withAuth resolves
 * org membership and the AuthenticatedUser type carries orgId/roles.
 */

import { promises as fs } from 'node:fs';
import process from 'node:process';

async function main() {
  const failures: string[] = [];

  const withAuthSrc = await fs.readFile('src/lib/api/with-auth.ts', 'utf-8');
  if (!withAuthSrc.includes('resolveMemberships')) {
    failures.push('withAuth does not call resolveMemberships');
  }
  if (!/orgId/.test(withAuthSrc)) {
    failures.push('withAuth does not set orgId on the user');
  }

  const typesSrc = await fs.readFile('src/types/auth.ts', 'utf-8');
  for (const f of ['OrgRole', 'OrgMembership', 'AuthenticatedUser', 'orgId', 'roles']) {
    if (!typesSrc.includes(f)) failures.push(`types/auth.ts missing ${f}`);
  }

  const cookieSrc = await fs.readFile('src/lib/auth/cookie-signer.ts', 'utf-8');
  if (!/orgId/.test(cookieSrc) || !/roles/.test(cookieSrc)) {
    failures.push('cookie-signer payload type does not include orgId/roles');
  }

  if (failures.length > 0) {
    console.error('audit:auth-org-context FAILED');
    for (const f of failures) console.error('  ' + f);
    process.exit(1);
  }
  console.log('audit:auth-org-context passed (static-marker)');
}

main().catch((err) => {
  console.error('audit:auth-org-context threw:', err);
  process.exit(2);
});
```

Add to `package.json` and `audit:gate`.

### 8. Migration: lazy backfill

Create `scripts/migrate-self-orgs.ts`:

```typescript
#!/usr/bin/env tsx
/**
 * One-shot lazy migration: ensure every existing user has a self-org
 * and every existing situation has orgId. Idempotent.
 *
 * Usage:
 *   tsx scripts/migrate-self-orgs.ts --dry-run
 *   tsx scripts/migrate-self-orgs.ts --apply
 *
 * Logs to migration_log/{runId}. Safe to re-run.
 */

import process from 'node:process';
import { adminFirestore } from '../src/lib/firebase/admin';

async function main() {
  const apply = process.argv.includes('--apply');
  const db = adminFirestore();
  const runId = `migrate-self-orgs-${Date.now()}`;
  const log: Array<{ uid: string; sitId?: string; action: string }> = [];

  // 1. Iterate every user
  const usersSnap = await db.collection('users').get();
  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;
    const email = userDoc.data().email ?? '';
    const selfOrgId = `self-${uid}`;

    // Self-org doc
    const selfOrgRef = db.collection('organizations').doc(selfOrgId);
    if (!(await selfOrgRef.get()).exists) {
      log.push({ uid, action: 'create-self-org' });
      if (apply) {
        const now = new Date().toISOString();
        await selfOrgRef.set({
          id: selfOrgId, kind: 'self', ownerUid: uid, ownerEmail: email,
          createdAt: now, name: 'Personal workspace',
        });
        await selfOrgRef.collection('members').doc(uid).set({
          uid, email, roles: ['owner'], joinedAt: now,
        });
      }
    }

    // Backfill orgId on situations
    const sitSnap = await db.collection('users').doc(uid).collection('situations').get();
    for (const sitDoc of sitSnap.docs) {
      const sitData = sitDoc.data();
      if (!sitData.orgId) {
        log.push({ uid, sitId: sitDoc.id, action: 'set-orgId' });
        if (apply) {
          await sitDoc.ref.update({
            orgId: selfOrgId,
            ownerUid: uid,
            collaborators: sitData.collaborators ?? [],
            multiTenantMigratedAt: new Date().toISOString(),
          });
        }
      }
    }
  }

  // 2. Write log
  if (apply) {
    await db.collection('migration_log').doc(runId).set({
      runId, startedAt: new Date().toISOString(), entries: log,
    });
  }

  console.log(`${apply ? 'APPLIED' : 'DRY-RUN'}: ${log.length} actions across ${usersSnap.size} users`);
  for (const entry of log.slice(0, 20)) {
    console.log(`  ${entry.action} uid=${entry.uid}${entry.sitId ? ` sit=${entry.sitId}` : ''}`);
  }
  if (log.length > 20) console.log(`  ... and ${log.length - 20} more`);
}

main().catch((err) => {
  console.error('migration threw:', err);
  process.exit(1);
});
```

**Run order**: `--dry-run` first, review output, then `--apply` from a
GCP Cloud Shell with `firebase-admin` credentials. Do NOT apply from
local Codex.

## Acceptance criteria

1. `src/types/auth.ts` exports the new types.
2. `withAuth` returns `orgId`, `roles`, `memberships` on every call.
3. Cookie payload includes `orgId` and `roles` (HMAC unchanged).
4. `resolveMemberships` creates self-org lazily.
5. Middleware bounces stale cookies (no orgId) to `/login?refresh=1`.
6. `audit:auth-org-context` passes.
7. `npm run build && npm run audit:gate` passes.
8. Existing routes that destructure `{uid}` still work (no regressions).
9. Migration script's `--dry-run` produces a sensible log.

## Diagnostics

```bash
# 1. Types
grep -q "OrgMembership" src/types/auth.ts && echo OK
grep -q "AuthenticatedUser" src/types/auth.ts && echo OK

# 2. withAuth
grep -q "resolveMemberships" src/lib/api/with-auth.ts && echo OK

# 3. Cookie payload
grep -q "orgId" src/lib/auth/cookie-signer.ts && echo OK

# 4. Audit
npm run audit:auth-org-context && echo OK

# 5. Build
npm run build && echo OK

# 6. Backwards-compat: pick a route that uses {uid}, confirm it
#    still resolves uid
grep -l "user.uid" src/app/api/*/route.ts | head -3
# Manually run one of those routes with auth and confirm 200 response

# 7. Migration dry-run (against test DB only)
PRAXIS_FIREBASE_ENV=test npx tsx scripts/migrate-self-orgs.ts --dry-run | head -20
```

## If Codex stops short

**Failure mode A**: Codex modifies HMAC code in `cookie-signer.ts`.
**Stop.** Re-prompt:

> "Revert all changes to `src/lib/auth/cookie-signer.ts` except the
> additive `SignedCookiePayload` type field. The HMAC signing
> function, secret loader, and verification function must be byte-
> identical to the pre-A1 version. Show me a diff that touches only
> the type."

**Failure mode B**: Codex calls `resolveMemberships` on every request
and the per-request latency goes up by 200ms+. Re-prompt:

> "Add a per-request memoization layer (or a 30s in-memory cache
> keyed by uid) to `resolveMemberships`. The membership resolution
> should hit Firestore at most once per user per session warm-up,
> not on every authed call. Show me the cache implementation."

**Failure mode C**: Migration script applies without `--apply` flag.
**Stop.** Re-prompt:

> "The migration script must default to dry-run. The `--apply` flag
> is required to make any writes. Test by running without `--apply`
> and confirming Firestore is unchanged. If you ran it with --apply
> against a real database, immediately stop and report which
> documents were modified."

**Failure mode D**: Existing tests fail because they don't mock
`resolveMemberships`. Re-prompt:

> "Update the test fixtures: any test that mocks `withAuth` must now
> include `orgId`, `roles`, `memberships` in the mocked user object.
> Add a helper `mockAuthenticatedUser(overrides)` to
> `tests/helpers/auth.ts` and use it everywhere. Show me the diff."

## Commit

```
feat(mt): orgId and roles on every authenticated request

withAuth now returns the user's org membership and roles in addition
to the basic identity fields. AuthenticatedUser includes orgId,
roles, memberships, primaryOrgId. Cookie payload signs orgId and
roles (HMAC algorithm unchanged).

A new resolveMemberships helper lazily creates an implicit self-org
for any user without one, ensuring backwards-compat for solo users.

Migration script `scripts/migrate-self-orgs.ts` backfills orgId on
existing users and situations. Dry-run by default; --apply from
Cloud Shell.

audit:auth-org-context (static-marker) protects the contract.

This is the foundation for A2-A6.

Refs: V2_WORK_PACK/A1_ORGID_CONTEXT.md
```
