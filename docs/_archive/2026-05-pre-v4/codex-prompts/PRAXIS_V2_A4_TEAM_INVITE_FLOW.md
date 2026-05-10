# A4 — Team invite flow

## Goal

Enable an org owner to invite a teammate by email. Two paths from the
locked decisions in A0:

1. **Email invite for non-users**: owner enters an email; system mints
   a signed token; sends email; recipient clicks link; if not signed in,
   completes signup; on signup/sign-in the token is consumed and they
   join the org.
2. **Direct add for existing users**: owner enters an email of an
   existing user; system resolves uid; adds membership immediately.

## Files Codex must read first

- `docs/architecture/MULTI_TENANT_MODEL.md`
- `src/lib/auth/cookie-signer.ts` — read but DO NOT modify HMAC
- `src/lib/email/send.ts` (if exists) — current email infrastructure
- `src/types/auth.ts` (from A1)
- `firestore.rules` (from A3) — invitations subcollection rules

## Tasks

### 1. Invitation document shape

```typescript
// src/types/invitations.ts

import type { OrgRole } from '@/types/auth';

export interface Invitation {
  id: string;              // matches document id
  orgId: string;
  invitedEmail: string;    // lowercase
  role: OrgRole;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  createdAt: string;       // ISO
  expiresAt: string;       // ISO; default +7 days
  invitedBy: string;       // uid of inviter
  acceptedBy?: string;     // uid of acceptor, set on accept
  acceptedAt?: string;
  /**
   * Server-generated unguessable token. Sent via email link, NOT
   * stored anywhere else. Hash stored here for verification.
   */
  tokenHash: string;
}
```

Stored at `organizations/{orgId}/invitations/{invitationId}`.

### 2. Token signer (separate from session cookie)

Create `src/lib/invites/invite-token.ts`:

```typescript
import crypto from 'node:crypto';

const SECRET_ENV = 'PRAXIS_INVITE_TOKEN_SECRET';

function getSecret(): Buffer {
  const s = process.env[SECRET_ENV];
  if (!s || s.length < 32) {
    throw new Error(`${SECRET_ENV} not set or too short (need 32+ chars)`);
  }
  return Buffer.from(s, 'utf-8');
}

export interface InviteTokenPayload {
  orgId: string;
  invitationId: string;
  invitedEmail: string;
  expiresAt: number;       // unix ms
}

/**
 * Mint a token for emailing. Returns { token, hash } — token goes in
 * the email link, hash is stored in the invitation document.
 *
 * Tokens are: base64url(payload) + "." + base64url(HMAC).
 */
export function mintInviteToken(payload: InviteTokenPayload): { token: string; hash: string } {
  const secret = getSecret();
  const body = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(body).digest();
  const token = `${body}.${sig.toString('base64url')}`;
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  return { token, hash };
}

/**
 * Verify a token from the email link. Returns the payload if valid +
 * unexpired, null otherwise.
 */
export function verifyInviteToken(token: string, expectedHash: string): InviteTokenPayload | null {
  const observedHash = crypto.createHash('sha256').update(token).digest('hex');
  if (observedHash !== expectedHash) return null;

  const [body, sig] = token.split('.');
  if (!body || !sig) return null;

  const secret = getSecret();
  const expectedSig = crypto.createHmac('sha256', secret).update(body).digest().toString('base64url');
  if (sig !== expectedSig) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8')) as InviteTokenPayload;
    if (payload.expiresAt < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}
```

**Set `PRAXIS_INVITE_TOKEN_SECRET` in Cloud Run env** (Secret Manager
binding). Codex documents this in `STATUS.md` as a **deploy-step
requirement** — this is one of the operational items GC must do.

### 3. API: create invitation

`src/app/api/orgs/[orgId]/invitations/create/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { mintInviteToken } from '@/lib/invites/invite-token';
import { adminFirestore } from '@/lib/firebase/admin';
import { sendInviteEmail } from '@/lib/email/send-invite';
import type { OrgRole } from '@/types/auth';

const VALID_ROLES: OrgRole[] = ['editor', 'commenter', 'viewer'];
// Inviting another owner is a separate transfer-ownership flow — not
// here.

export const POST = withAuth(async (req, user) => {
  const orgId = req.nextUrl.pathname.split('/')[3];
  const body = await req.json();
  const email = (body.email ?? '').toLowerCase().trim();
  const role: OrgRole = body.role ?? 'editor';

  if (!email.includes('@')) {
    return NextResponse.json({ error: 'invalid email' }, { status: 400 });
  }
  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: 'invalid role' }, { status: 400 });
  }

  // Authorization: only org owner can invite.
  const db = adminFirestore();
  const orgDoc = await db.collection('organizations').doc(orgId).get();
  if (!orgDoc.exists) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  if (orgDoc.data()?.ownerUid !== user.uid) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }

  // Direct add: if a user with this email already exists, add them
  // immediately and return.
  const existingUserQuery = await db.collection('users').where('email', '==', email).limit(1).get();
  if (!existingUserQuery.empty) {
    const existing = existingUserQuery.docs[0];
    const existingUid = existing.id;

    await db.collection('organizations').doc(orgId).collection('members').doc(existingUid).set({
      uid: existingUid,
      email,
      roles: [role],
      joinedAt: new Date().toISOString(),
      addedBy: user.uid,
    });

    return NextResponse.json({
      kind: 'direct-add',
      uid: existingUid,
      role,
    });
  }

  // Email invite: mint token + create invitation doc.
  const invitationId = `inv-${crypto.randomUUID()}`;
  const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const { token, hash } = mintInviteToken({
    orgId, invitationId, invitedEmail: email, expiresAt,
  });

  await db
    .collection('organizations').doc(orgId)
    .collection('invitations').doc(invitationId)
    .set({
      id: invitationId,
      orgId,
      invitedEmail: email,
      role,
      status: 'pending',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(expiresAt).toISOString(),
      invitedBy: user.uid,
      tokenHash: hash,
    });

  await sendInviteEmail({
    to: email,
    inviterName: user.name,
    orgName: orgDoc.data()?.name ?? 'a PRAXIS workspace',
    role,
    acceptUrl: `${process.env.NEXT_PUBLIC_APP_URL}/invite/accept?token=${encodeURIComponent(token)}&id=${invitationId}&org=${orgId}`,
  });

  return NextResponse.json({
    kind: 'email-invite',
    invitationId,
    expiresAt: new Date(expiresAt).toISOString(),
  });
});
```

### 4. API: accept invitation

`src/app/api/orgs/[orgId]/invitations/accept/route.ts`:

```typescript
import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/api/with-auth';
import { verifyInviteToken } from '@/lib/invites/invite-token';
import { adminFirestore } from '@/lib/firebase/admin';
import { refreshSessionCookieClaims } from '@/lib/auth/cookie-refresh';

export const POST = withAuth(async (req, user) => {
  const orgId = req.nextUrl.pathname.split('/')[3];
  const body = await req.json();
  const token = body.token as string;
  const invitationId = body.invitationId as string;

  const db = adminFirestore();
  const invRef = db.collection('organizations').doc(orgId).collection('invitations').doc(invitationId);
  const invDoc = await invRef.get();
  if (!invDoc.exists) {
    return NextResponse.json({ error: 'invitation not found' }, { status: 404 });
  }
  const inv = invDoc.data()!;

  if (inv.status !== 'pending') {
    return NextResponse.json({ error: `invitation ${inv.status}` }, { status: 410 });
  }

  // Verify token
  const payload = verifyInviteToken(token, inv.tokenHash);
  if (!payload || payload.invitationId !== invitationId || payload.orgId !== orgId) {
    return NextResponse.json({ error: 'invalid token' }, { status: 403 });
  }

  // Email match check (non-fatal: a user can accept on a different
  // email if they're explicitly the same person, but we record the
  // mismatch for audit).
  if ((user.email ?? '').toLowerCase() !== inv.invitedEmail) {
    // Record but allow.
    await invRef.set({ acceptedWithDifferentEmail: user.email }, { merge: true });
  }

  // Add membership
  await db.collection('organizations').doc(orgId).collection('members').doc(user.uid).set({
    uid: user.uid,
    email: user.email,
    roles: [inv.role],
    joinedAt: new Date().toISOString(),
    invitedVia: invitationId,
  });

  // Mark invitation accepted
  await invRef.update({
    status: 'accepted',
    acceptedBy: user.uid,
    acceptedAt: new Date().toISOString(),
  });

  // Refresh the session cookie so the user immediately picks up the
  // new orgId membership without re-login.
  await refreshSessionCookieClaims(user.uid, {
    // Note: we keep their primary orgId as their existing one. The
    // new org joins their memberships array. They can switch in UI.
  });

  return NextResponse.json({
    kind: 'accepted',
    orgId,
    role: inv.role,
  });
});
```

### 5. API: list invitations + revoke

`src/app/api/orgs/[orgId]/invitations/route.ts` (GET): list pending
invitations for the org. Owner-only.

`src/app/api/orgs/[orgId]/invitations/[invId]/route.ts` (DELETE):
revoke an invitation. Owner-only. Sets status to 'revoked'.

### 6. Email sender

`src/lib/email/send-invite.ts`:

```typescript
// If the project already uses an email service (SendGrid, Postmark,
// Mailgun, SES), wrap that. If not, this file documents the
// requirement and includes a stub.

interface SendInviteEmailParams {
  to: string;
  inviterName: string;
  orgName: string;
  role: string;
  acceptUrl: string;
}

export async function sendInviteEmail(params: SendInviteEmailParams): Promise<void> {
  const provider = process.env.PRAXIS_EMAIL_PROVIDER ?? 'stub';

  if (provider === 'stub') {
    console.warn(`[email stub] would send invite to ${params.to}: ${params.acceptUrl}`);
    return;
  }

  // Implement against the chosen provider. Codex should look at any
  // existing send.ts for patterns.
  throw new Error('email provider not implemented; set PRAXIS_EMAIL_PROVIDER=stub for dev');
}
```

**Production deploy requires**: `PRAXIS_EMAIL_PROVIDER` set to a real
provider; provider credentials in Secret Manager. Document in
`STATUS.md`.

### 7. UI: invite drawer

In the org settings page (or a new `/app/team` route), add an "Invite
teammate" drawer:

- Email input
- Role select (editor / commenter / viewer)
- Submit button
- Success state distinguishes "added directly" vs "email sent"
- List of pending invitations with "revoke" actions
- List of current members with role + remove action (owner only)

This is one component file plus one route page. Codex implements with
the existing UI primitives; no new design system components.

### 8. UI: accept page

`/app/invite/accept` page. Reads `token`, `id`, `org` query params.

- If user not signed in: redirect to `/login` with a `next` param that
  brings them back here after auth.
- If signed in: show a card "You've been invited to join {orgName} as
  {role}. Accept?" with Accept and Decline buttons.
- Accept calls the API. On success, navigate to `/app/workbench`.
- Decline marks the invitation revoked client-side via the API.

### 9. Audit: `audit:invite-flow`

Static-marker audit ensuring the four routes exist and reference
`mintInviteToken` / `verifyInviteToken` correctly:

```typescript
// scripts/audit-invite-flow.ts
const REQUIRED_FILES = [
  'src/lib/invites/invite-token.ts',
  'src/app/api/orgs/[orgId]/invitations/create/route.ts',
  'src/app/api/orgs/[orgId]/invitations/accept/route.ts',
  'src/app/invite/accept/page.tsx',
];
// for each, fs.access + check key strings present
```

Add to `audit:gate`.

## Acceptance criteria

1. `PRAXIS_INVITE_TOKEN_SECRET` documented as required deploy env.
2. All four API routes exist and pass smoke tests.
3. Email invite flow ends with a new member doc in
   `organizations/{orgId}/members/{uid}`.
4. Direct add for existing users skips email and adds immediately.
5. Token verification rejects expired or tampered tokens.
6. UI renders the invite drawer and the accept page.
7. `audit:invite-flow` passes.
8. Manual smoke: invite a teammate to a test org, accept on a
   different account, confirm membership and access.

## Diagnostics

```bash
# 1. Token secret env documented
grep "PRAXIS_INVITE_TOKEN_SECRET" .env.example STATUS.md && echo OK

# 2. Routes exist
for r in create accept; do
  test -f "src/app/api/orgs/[orgId]/invitations/$r/route.ts" && echo "OK $r"
done

# 3. Token helpers
test -f src/lib/invites/invite-token.ts && echo OK
grep -q "mintInviteToken\|verifyInviteToken" src/lib/invites/invite-token.ts && echo OK

# 4. UI
test -f src/app/invite/accept/page.tsx && echo OK

# 5. Audit
npm run audit:invite-flow && echo OK

# 6. Build
npm run build && echo OK

# 7. Manual: invite a teammate, complete flow end-to-end
```

## If Codex stops short

**Failure mode A**: Codex implements the email send via a real
provider without secret-manager bindings. Re-prompt:

> "The email sender is a stub by default. Production provider
> binding is operational, not a Codex task. Set the default
> `PRAXIS_EMAIL_PROVIDER=stub` and document the production
> requirement in STATUS.md. The stub logs a warning and returns
> success. Show me the diff."

**Failure mode B**: Token verification leaks the hash via timing.
Re-prompt:

> "Use `crypto.timingSafeEqual` for the hash comparison in
> verifyInviteToken. Plain `===` is timing-vulnerable. Update and
> add a unit test that asserts the function returns null for a
> token with a one-byte tampered signature, in constant time."

**Failure mode C**: The accept flow doesn't refresh the cookie, so
the new member can't immediately see the new org's data. Re-prompt:

> "On successful accept, call `refreshSessionCookieClaims(user.uid)`
> so the new orgId enters the cookie. Without this, the user has to
> sign out and back in. Add this and confirm with a manual smoke."

**Failure mode D**: Codex creates the UI but it doesn't validate
email format client-side, leading to stub emails sent to garbage.
Re-prompt:

> "Add basic client-side email validation (must include @, must be
> non-empty, must be < 254 chars). Server-side validation in the
> create route stays. Both sides reject."

## Commit

```
feat(mt): team invite flow — email + direct add

- Org owners can invite by email. Existing users are added directly;
  non-users receive an email with a signed token link valid 7 days.
- Token signing uses a separate HMAC secret (PRAXIS_INVITE_TOKEN_SECRET),
  not the session cookie secret.
- Acceptance refreshes the session cookie to surface the new org
  without re-login.
- UI: invite drawer in /app/team, accept page at /invite/accept.
- Routes: create, accept, list, revoke.
- audit:invite-flow protects the contract.
- Email sender defaults to a logging stub; production provider
  binding documented in STATUS.md as deploy-time work.

Refs: V2_WORK_PACK/A4_TEAM_INVITE_FLOW.md
```
