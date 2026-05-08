# PRAXIS Multi-Tenant Data Model

Status: PROPOSED on 2026-05-08
Owner: GC

## Sign-off required

GC: edit this doc or `STATUS.md` to mark each decision `APPROVED`, or change
the decision and write `APPROVED-REVISED` with the alternative chosen. A1 must
not begin until all five MT rows are approved or explicitly revised.

| decision | proposed option | status |
|---|---|---|
| MT-1 org model | A: implicit self-org | pending GC |
| MT-2 case ownership | C: user-owned, org-scoped | pending GC |
| MT-3 roles | owner/editor/viewer/commenter | pending GC |
| MT-4 invite | email invite plus direct add | pending GC |
| MT-5 migration | lazy one-shot script | pending GC |

## Current state (as of session start)

The current production data model is a single-user, owner-scoped app. Situation
documents and most situation subcollections live under `users/{uid}/situations`
and are guarded by owner checks in Firestore rules. The current rules allow
`users/{uid}/situations/{situationId}/{document=**}` reads and writes only when
`request.auth.uid == uid`.

Static scan results:

```text
rg "users/\{uid\}/situations" src/ backend/ -l
src/types/episode.ts
backend/services/firestore_sync.py
```

```text
rg "orgId" src/ backend/ -l
src/lib/ai/context-builder-server.ts
src/lib/context/interaction-frame.ts
src/lib/api/save-tool-output.ts
src/lib/tools/tool-context-blueprints.ts
src/lib/firebase/tool-data-service.ts
src/lib/firebase/situations.ts
src/lib/firebase/graph-updates-service.ts
src/lib/firebase/graph-service.ts
src/lib/firebase/episodes.ts
src/lib/firebase/documents-service.ts
src/lib/knowledge/analyst-notes.ts
src/lib/constants/tool-registry.ts
src/lib/services/canonical-precheck.ts
src/lib/services/tool-data-service.ts
src/lib/services/situation-initializer.ts
src/lib/services/graph-populate.ts
src/lib/services/feedback-service.ts
src/app/api/situations/[id]/recent-tools/route.ts
src/app/api/ai/stakeholder-map/route.ts
src/app/api/cron/generate-briefing/route.ts
src/app/api/ai/source-scout/route.ts
src/app/api/ai/brief-builder/route.ts
src/app/api/ai/brainstorming-table/route.ts
src/app/api/ai/humanitarian/route.ts
src/app/api/ai/extract-episodes/route.ts
src/app/api/ai/red-team-review/route.ts
```

```text
rg "collaborators" src/ backend/ -l
<no matches>
```

There are lightweight `orgId` references already, mostly in profile, context,
tool-data, and service metadata paths. They do not yet amount to a real
multi-tenant access model. `withAuth` currently returns basic identity
(`uid`, `email`, `name`, optional `emailVerified`, `isDemo`) and does not
resolve org memberships. `cookie-signer.ts` currently signs arbitrary cookie
values but has no typed signed payload carrying org claims. `firestore.rules`
has no organization, member, invitation, collaborator, or visibility match
blocks for shared cases.

## Decisions

### Decision 1 — Org model

PROPOSED: Option A (implicit self-org).

- Every user has `orgId = self-${uid}` by default.
- Org docs live at `organizations/{orgId}` with a `members` subcollection.
- Onboarding does not require naming an org.
- Inviting a second user formalizes the org and prompts for a name.

Rationale: this preserves the current solo-user experience while giving team
features a real org boundary.

### Decision 2 — Case ownership

PROPOSED: Option C (user-owned, org-scoped).

- Path remains `users/{ownerUid}/situations/{situationId}`.
- Each situation gains `orgId`, `ownerUid`, and `collaborators[]`.
- Org and collaborator access is enforced at document field plus rule layer.

Rationale: this avoids an immediate path migration and keeps existing data and
ops habits intact while allowing shared access.

### Decision 3 — Roles

PROPOSED: `owner`, `editor`, `viewer`, `commenter`.

- `owner`: full control, including invites and deletion.
- `editor`: graph mutations, hero-tool runs, exports.
- `commenter`: read all, add memos/notes, no graph mutations.
- `viewer`: read-only, no exports.

Rationale: these four roles are enough for institutional pilots without
overfitting to heavier enterprise hierarchies before a real customer asks.

### Decision 4 — Invite mechanism

PROPOSED: email invite plus direct add by email/uid.

- Email invite: signed token with `orgId`, role, and expiration.
- Direct add: owner enters the email or uid of an existing user.
- Invite-link sharing is deferred.

Rationale: email invite covers non-users, direct add covers existing users, and
link sharing can wait until pilot demand proves it is necessary.

### Decision 5 — Migration

PROPOSED: lazy one-shot script.

- One-shot script reads every `users/{uid}/situations/{*}` document.
- Writes `orgId = self-${uid}` if missing.
- Creates `organizations/self-${uid}` with the user as sole owner.
- Idempotent; logs to `migration_log/{runId}`.
- Runs after A1-A6 ship and before any team feature is announced.

Rationale: this converges the database explicitly and auditably without mixing
migration side effects into ordinary read paths.

## Implementation plan

A1: orgId on session cookie and withAuth context.
A2: collaborators field on situations and types.
A3: Firestore rules expansion with required security tests.
A4: invite flow and handlers.
A5: role pills and role-aware UI.
A6: audit log.

## Rules

Rules are not implemented by A0. A3 will introduce and test:

- `canReadSituation`: owner, explicit collaborator, or permitted org-visible
  access.
- `canWriteSituation`: owner, editor-like collaborator, commenter for allowed
  comment surfaces, or org editor where visibility allows.
- `isOrgVisible`: verifies `visibility` and org claim alignment.
- `isOwnerOnlyChange`: blocks non-owners from changing ownership, org scope,
  collaborators, or visibility.
- Organization member and invitation match blocks.

## Out of scope for this session

- SSO / SAML - separate session.
- Org-level billing - depends on multi-tenant; comes after.
- Org-level branding - defer.
- Multi-org per user - defer for v2; one primary org per user is enough now.

## Reversibility

If multi-tenant turns out to be wrong, the lazy migration is reversible: drop
the `organizations/*` collection and unset `situation.orgId` across all docs.

The Firestore rules expansion is harder to reverse. Once shared cases exist,
rolling back rules without revoking access requires copying shared cases back
to each member's individual scope. Do not declare GA on team features until
org-level access has been smoke-tested with at least three test users.
