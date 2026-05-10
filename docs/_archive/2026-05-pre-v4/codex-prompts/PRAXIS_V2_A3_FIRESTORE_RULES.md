# A3 — Firestore rules: shared cases (DANGEROUS)

## Goal

Today's `firestore.rules` is owner-only:
`match /situations/{situationId}: allow read, write: if request.auth.uid == uid`.

After this file, the rules accept (a) the owner, (b) collaborators
listed in the situation's `collaborators[]` array, (c) org members
when `visibility` is `'org'` or `'shared'`. Plus role-based write
restrictions.

**This is the highest-risk file in the v2 pack.** A bad rule change
exposes user data; a too-strict change locks legitimate users out.
Everything below is mandatory.

## Pre-conditions

1. A0 decisions are approved.
2. A1 (`orgId` in withAuth) shipped and green.
3. A2 (`collaborators` field) shipped and green.
4. Migration script `scripts/migrate-self-orgs.ts` has been run with
   `--apply` against the target Firestore. Confirm in `STATUS.md`.

If any pre-condition fails, **stop**.

## Files Codex must read first

- `firestore.rules` — current rules
- `tests/security/firestore-rules.test.ts` (or wherever rules tests
  live; if not, this file creates them)
- `docs/architecture/MULTI_TENANT_MODEL.md` — the locked decisions

## Tasks

### 1. Add the new rule helpers

In `firestore.rules`, add these helper functions at the top
(`rules_version = '2';` line stays as-is):

```javascript
function isAuthenticated() {
  return request.auth != null;
}

function userUid() {
  return request.auth.uid;
}

// True if the requester owns the situation.
function isSituationOwner(sit) {
  return sit.data.ownerUid == userUid();
}

// True if the requester is in the collaborators array (any role).
function isCollaborator(sit) {
  return sit.data.collaborators is list &&
    sit.data.collaborators.hasAny([
      { 'uid': userUid() }
    ]);
}

// Get the requester's role on the situation. Returns the role string
// or null. Cannot use Maps.get on collab list directly so this iterates.
// In rules, we check membership separately and call isOwner / isCollab.

// True if the requester is an org member with 'editor' or 'owner' role
// AND the situation has visibility='org' or visibility='shared'.
function isOrgVisible(sit) {
  let v = sit.data.get('visibility', 'private');
  return (v == 'org' || v == 'shared') &&
    sit.data.orgId == orgIdFromAuth();
}

// orgId from the auth token (set by cookie-signer in A1).
function orgIdFromAuth() {
  return request.auth.token.get('orgId', null);
}

function rolesFromAuth() {
  return request.auth.token.get('roles', []);
}

function hasOrgRole(role) {
  return rolesFromAuth().hasAny([role]);
}

// True if the requester can read the situation by any path.
function canReadSituation(sit) {
  return isAuthenticated() && (
    isSituationOwner(sit) ||
    isCollaborator(sit) ||
    isOrgVisible(sit)
  );
}

// True if the requester can write the situation.
// Owner: full control. Collaborator with role editor: writes allowed
// except for ownership/orgId/collaborators-array changes. Org-visible
// users with editor org role: same as collaborator-editor.
function canWriteSituation(sit) {
  return isAuthenticated() && (
    isSituationOwner(sit) ||
    (
      sit.data.collaborators.hasAny([{ 'uid': userUid(), 'role': 'editor' }]) ||
      sit.data.collaborators.hasAny([{ 'uid': userUid(), 'role': 'commenter' }])
    ) ||
    (isOrgVisible(sit) && hasOrgRole('editor'))
  );
}

function isOwnerOnlyChange(req, res) {
  // Reject writes that change ownership, orgId, or collaborators
  // when the writer isn't the owner.
  return req.data.diff(res.data).affectedKeys().hasAny([
    'ownerUid', 'orgId', 'collaborators', 'visibility'
  ]);
}
```

### 2. Update the situations match block

Replace the existing `match /situations/{...}` block with:

```javascript
match /users/{uid}/situations/{situationId} {
  allow read: if canReadSituation(resource);

  // Create: requester must be the owner being created, orgId must
  // match their auth, collaborators must start empty.
  allow create: if isAuthenticated() &&
    request.resource.data.ownerUid == userUid() &&
    request.resource.data.orgId == orgIdFromAuth() &&
    request.resource.data.collaborators.size() == 0;

  // Update: writer must have write permission; if not owner, must
  // not change ownership/orgId/collaborators/visibility.
  allow update: if canWriteSituation(resource) &&
    (
      isSituationOwner(resource) ||
      !isOwnerOnlyChange(request.resource, resource)
    );

  // Delete: only owner.
  allow delete: if isSituationOwner(resource);

  // Subcollections inherit the parent's access.
  match /{document=**} {
    allow read: if canReadSituation(get(/databases/$(database)/documents/users/$(uid)/situations/$(situationId)));
    allow write: if canWriteSituation(get(/databases/$(database)/documents/users/$(uid)/situations/$(situationId)));
  }
}
```

### 3. Organizations and members rules

```javascript
match /organizations/{orgId} {
  // Read: any member of the org.
  allow read: if isAuthenticated() && (
    orgIdFromAuth() == orgId ||
    request.auth.token.get('memberships', []).hasAny([{ 'orgId': orgId }])
  );

  // Write: only owner of the org.
  allow update: if isAuthenticated() &&
    resource.data.ownerUid == userUid();

  allow create: if isAuthenticated() &&
    request.resource.data.ownerUid == userUid();

  allow delete: if isAuthenticated() &&
    resource.data.ownerUid == userUid() &&
    resource.data.kind != 'self';  // self-orgs cannot be deleted

  // Members subcollection.
  match /members/{memberUid} {
    // Member can read their own membership.
    allow read: if isAuthenticated() && (
      memberUid == userUid() ||
      get(/databases/$(database)/documents/organizations/$(orgId)).data.ownerUid == userUid()
    );

    // Only org owner can add/remove/update members.
    allow write: if isAuthenticated() &&
      get(/databases/$(database)/documents/organizations/$(orgId)).data.ownerUid == userUid();
  }

  // Invitations subcollection.
  match /invitations/{inviteId} {
    allow read: if isAuthenticated() && (
      get(/databases/$(database)/documents/organizations/$(orgId)).data.ownerUid == userUid() ||
      resource.data.invitedEmail == request.auth.token.email
    );
    allow create: if isAuthenticated() &&
      get(/databases/$(database)/documents/organizations/$(orgId)).data.ownerUid == userUid();
    allow delete: if isAuthenticated() &&
      get(/databases/$(database)/documents/organizations/$(orgId)).data.ownerUid == userUid();
    allow update: if false;  // invitations are immutable; cancel + recreate
  }
}
```

### 4. Lock down `background_jobs` (carry-over from night pack)

Confirm the night-pack tightening is still in place. If anything was
loosened during merge conflicts, restore.

### 5. Comprehensive test coverage

Create or expand `tests/security/firestore-rules.test.ts` using the
Firebase rules test SDK. Mandatory test cases:

```typescript
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import * as fs from 'node:fs';

describe('firestore.rules — multi-tenant', () => {
  let env: any;
  beforeAll(async () => {
    env = await initializeTestEnvironment({
      projectId: 'praxis-rules-test',
      firestore: { rules: fs.readFileSync('firestore.rules', 'utf-8') },
    });
  });
  afterAll(async () => env.cleanup());

  // SOLO USER (backwards-compat)
  test('owner can read own situation', async () => { /* ... */ });
  test('owner can write own situation', async () => { /* ... */ });
  test('owner can delete own situation', async () => { /* ... */ });

  // CROSS-USER (must fail)
  test('non-owner non-collaborator cannot read private situation', async () => { /* expect denied */ });
  test('non-owner non-collaborator cannot write private situation', async () => { /* expect denied */ });
  test('non-owner non-collaborator gets 404 (not 403) on read', async () => { /* check error type */ });

  // COLLABORATOR (editor)
  test('editor collaborator can read', async () => { /* ... */ });
  test('editor collaborator can write graph subdoc', async () => { /* ... */ });
  test('editor collaborator CANNOT change ownerUid', async () => { /* expect denied */ });
  test('editor collaborator CANNOT change orgId', async () => { /* expect denied */ });
  test('editor collaborator CANNOT change collaborators array', async () => { /* expect denied */ });

  // COLLABORATOR (commenter)
  test('commenter can read', async () => { /* ... */ });
  test('commenter can write memos subdoc', async () => { /* ... */ });
  test('commenter CANNOT write graph subdoc', async () => { /* expect denied */ });

  // COLLABORATOR (viewer)
  test('viewer can read', async () => { /* ... */ });
  test('viewer CANNOT write any subdoc', async () => { /* expect denied */ });

  // ORG VISIBILITY
  test('org member with editor role can read situation with visibility=org', async () => { /* ... */ });
  test('org member with viewer role cannot read situation with visibility=private', async () => { /* expect denied */ });
  test('org member with editor role can write situation with visibility=org', async () => { /* ... */ });
  test('non-org user cannot read situation with visibility=org', async () => { /* expect denied */ });
  test('non-org user cannot read situation with visibility=shared', async () => { /* expect denied */ });

  // ORG ADMIN
  test('org owner can add member', async () => { /* ... */ });
  test('org member cannot add another member', async () => { /* expect denied */ });
  test('org owner can delete invitation', async () => { /* ... */ });
  test('invited email can read invitation', async () => { /* ... */ });

  // SELF-ORG SAFETY
  test('user cannot delete their self-org', async () => { /* expect denied */ });
  test('user cannot change ownerUid of their self-org', async () => { /* expect denied */ });
});
```

The rules tests are a **mandatory gate** for this file. Without them
the rules change cannot ship.

### 6. Wire tests into `audit:gate`

```json
"test:rules": "vitest run tests/security/firestore-rules.test.ts",
```

Append `&& npm run test:rules` to `audit:gate`.

### 7. Deploy script with safety

Create `scripts/deploy-firestore-rules.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail

# Deploy Firestore rules with mandatory pre-flight.
# Usage: ./scripts/deploy-firestore-rules.sh <env>
# env: dev | staging | prod

ENV="${1:?env required: dev|staging|prod}"

echo "Pre-flight: running rules tests..."
npm run test:rules

echo "Pre-flight: confirming target env..."
case "$ENV" in
  prod)
    read -p "Deploy to PROD Firestore. Type 'deploy prod rules' to continue: " confirm
    if [ "$confirm" != "deploy prod rules" ]; then
      echo "Aborted."
      exit 1
    fi
    PROJECT="praxisbytacitus"
    ;;
  staging)
    PROJECT="praxisbytacitus-staging"
    ;;
  dev)
    PROJECT="praxisbytacitus-dev"
    ;;
  *)
    echo "Unknown env: $ENV"
    exit 1
    ;;
esac

echo "Deploying to $PROJECT..."
firebase deploy --only firestore:rules --project="$PROJECT"
```

Make executable: `chmod +x scripts/deploy-firestore-rules.sh`.

### 8. Documentation

Update `docs/architecture/PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md`
with a row reflecting the rules state. Add a section to
`docs/architecture/MULTI_TENANT_MODEL.md` titled "Rules" listing the
helper functions and their semantics.

## Acceptance criteria

1. `firestore.rules` has the new helper functions.
2. `firestore.rules` has the new match blocks for situations, orgs,
   members, invitations.
3. Tests in `tests/security/firestore-rules.test.ts` cover every
   case in task 5. **Every test passes.**
4. `audit:gate` includes `test:rules`.
5. `scripts/deploy-firestore-rules.sh` exists and requires
   confirmation for prod.
6. Backwards-compat: every existing solo-user test scenario still
   passes (owner reads/writes own data).
7. Cross-user denial tests pass (non-collaborators get 404).
8. **Manual smoke**: deploy to dev project, sign in as user A,
   create a case. Sign in as user B (different account, different
   org). Confirm B cannot see A's case. Add B as a collaborator.
   Confirm B can now see and edit. Remove B. Confirm access lost.

## Diagnostics

```bash
# 1. Rules file structure
grep -q "canReadSituation\|canWriteSituation" firestore.rules && echo OK
grep -q "isOrgVisible" firestore.rules && echo OK

# 2. Tests run
npm run test:rules && echo OK

# 3. Test coverage check
grep -c "test\|it(" tests/security/firestore-rules.test.ts
# Expect at least 20

# 4. Audit gate
node -e "
const pkg = require('./package.json');
console.log(pkg.scripts['audit:gate'].includes('test:rules') ? 'OK' : 'MISSING');
"

# 5. Deploy script
test -x scripts/deploy-firestore-rules.sh && echo OK

# 6. Manual smoke (after deploy to dev)
#    Use the Firebase emulator UI or two browser sessions.
#    Document the result in STATUS.md.
```

## If Codex stops short

**Failure mode A**: Codex writes rules but skips the tests because
"the syntax is right." **Stop.** Re-prompt:

> "The rules tests are not optional. They are the gate that prevents
> us from deploying a permission bug. Implement every test case
> listed in task 5. Use @firebase/rules-unit-testing. The deploy
> script must refuse to run if tests fail. Do not deploy without
> green tests."

**Failure mode B**: Tests pass but the rules accidentally allow
anonymous reads. Re-prompt:

> "Add a test: anonymous (unauthenticated) request to ANY path must
> be denied. Run it. If it passes (i.e., access is denied), ship.
> If anonymous can read anything, the rules are wrong. Find the
> path that's broken."

**Failure mode C**: A subcollection write rule is too permissive.
Re-prompt:

> "Test every subcollection: graph nodes, embeddings, memos, threads,
> tool runs, source receipts. For each, confirm a non-collaborator
> cannot write. The wildcard `match /{document=**}` is convenient
> but needs the parent fetch to be correct."

**Failure mode D**: Codex deploys to prod without the confirmation
prompt. **Stop. Roll back.** Re-prompt:

> "The deploy script must require typing 'deploy prod rules' verbatim
> for prod. Re-read the script. If you bypassed the prompt, redeploy
> the previous rules version (`firebase deploy --only firestore:rules`
> from the previous commit) and document the incident in STATUS.md."

## Commit (rules change is its own commit)

```
feat(security): firestore rules for multi-tenant collaboration

Replaces owner-only situation rules with collaborator-aware rules
that respect:
- collaborators[] array with role (editor, commenter, viewer)
- visibility flag (private, org, shared)
- org membership and roles from custom claims (set in A1)

New helper functions: canReadSituation, canWriteSituation,
isOrgVisible, isOwnerOnlyChange.

Mandatory test coverage in tests/security/firestore-rules.test.ts:
20+ cases covering solo backwards-compat, cross-user denial,
collaborator roles (editor/commenter/viewer), org visibility,
org admin actions, self-org safety.

audit:gate now runs test:rules.
scripts/deploy-firestore-rules.sh requires explicit confirmation
for prod deploys.

Rules change ships only after: A1 deployed, A2 deployed, migration
script applied, all 20+ tests green, manual two-account smoke.

Refs: V2_WORK_PACK/A3_FIRESTORE_RULES.md
```
