# A0 — Multi-tenant data model: decisions before code

## Goal

Lock the architectural decisions before writing any code. Multi-tenant
schemas are hard to change once data lands in them; the cost of a
mistake here is a rewrite. Codex must produce a one-page decision doc,
get it explicitly approved (or explicitly not), and only then proceed.

**This file produces zero code changes.** Output is a markdown doc at
`docs/architecture/MULTI_TENANT_MODEL.md` plus a row in `STATUS.md`
that GC checks before A1-A6 begin.

## The five decisions to make

### Decision 1 — Org as a first-class entity, or not?

**Option A: Implicit self-org.** Every user has an implicit
single-member org tied to their `uid`. Solo users see no org concept.
Teams emerge by inviting a second user, which formalizes the org.

**Option B: Explicit org from day zero.** Every signup creates an org
with the user as owner. The user must name the org during onboarding.
Solo users see "Personal workspace" as their org name.

**Option C: Org optional, opt-in.** Users default to no org. They can
create one later when collaboration is needed.

**Recommendation: Option A.** Lowest friction for solo users, smooth
upgrade path to team. Codex defaults to A unless this doc records
otherwise.

### Decision 2 — Where does case ownership live?

**Option A: Cases belong to a user.** `users/{uid}/situations/{sitId}`.
Sharing happens via a `collaborators` array on the situation. Today's
shape.

**Option B: Cases belong to an org.** `organizations/{orgId}/situations/{sitId}`.
Users access cases through their org membership. Bigger refactor;
simpler rules.

**Option C: Hybrid — cases owned by a user, scoped to an org.**
Path stays `users/{uid}/situations/{sitId}` for backwards-compat.
Each situation has `orgId` on its document. Org members can read/write
based on rules + role.

**Recommendation: Option C.** Backwards-compat with all existing
data, no migration needed. Path stays familiar to ops. Org scope
enforced at the document field + rule layer.

### Decision 3 — What roles exist?

**Minimum viable**: `owner`, `editor`, `viewer`.

**Recommended extension**: `owner`, `editor`, `viewer`, `commenter`.
The `commenter` role can read everything and add memos/notes but cannot
modify the graph or run hero tools that mutate state.

**Heavier**: add `analyst`, `reviewer`, `consumer` to map to UN-style
hierarchies. Defer until a real customer asks.

**Recommendation: 4 roles** — `owner`, `editor`, `viewer`, `commenter`.
Rich enough for institutional pilots; simple enough to enforce
correctly.

### Decision 4 — Invite mechanism

**Option A: Email invite + signup.** User receives email, clicks link,
signs up (or signs in), is added to org with the invited role.

**Option B: Direct add by uid.** Owner enters another user's uid (or
email of an existing user). Lower friction but only works for users
who already have accounts.

**Option C: Invite link with token.** Owner generates a link with a
signed token; anyone with the link can claim a role (subject to a
limit). Highest friction-removal for early sales pilots.

**Recommendation: A + B.** Email invite for non-users, direct add for
existing users. Invite-link can come later if pilots need it.

### Decision 5 — Migration of existing data

Today every situation lives at `users/{uid}/situations/{sitId}` with no
`orgId` field. After multi-tenant lands, every situation needs an
`orgId`. Two paths:

**Option A: Lazy migration.** A one-time script writes `orgId =
implicit-self-org-${uid}` on every existing situation, plus creates
the matching org doc. Run once; future situations include `orgId` from
creation.

**Option B: On-read migration.** When a user opens a situation, if
`orgId` is missing, the API fills it in on-the-fly. Cheaper but slower
to converge and harder to audit.

**Recommendation: Option A** (lazy script). Run as a one-shot Cloud Run
job after deploy. Idempotent — safe to re-run. Audit trail in a
`migration_log` collection.

## Tasks

### 1. Read current state

```bash
rg "users/\\{uid\\}/situations" src/ backend/ -l
rg "orgId" src/ backend/ -l
rg "collaborators" src/ backend/ -l
```

Document what exists today in `docs/architecture/MULTI_TENANT_MODEL.md`
under "Current state."

### 2. Write the decision doc

Create `docs/architecture/MULTI_TENANT_MODEL.md`:

```markdown
# PRAXIS Multi-Tenant Data Model

Status: APPROVED | PROPOSED | REVISED on <date>
Owner: GC

## Current state (as of session start)

<paste output of the rg commands; describe in 5-10 sentences what
single-user looks like now>

## Decisions

### Decision 1 — Org model
APPROVED: Option A (implicit self-org).
- Every user has org_id = `self-${uid}` by default.
- Org docs live at `organizations/{orgId}` with members subcollection.
- Onboarding does not require naming an org.
- Inviting a second user formalizes the org and prompts for a name.

### Decision 2 — Case ownership
APPROVED: Option C (user-owned, org-scoped).
- Path: `users/{ownerUid}/situations/{situationId}`.
- Each situation has fields: orgId, ownerUid, collaborators[].
- Org members access via rules check on (orgId, role).

### Decision 3 — Roles
APPROVED: owner, editor, viewer, commenter.
- owner: full control, including invites and deletion.
- editor: graph mutations, hero-tool runs, exports.
- commenter: read all, add memos/notes, no graph mutations.
- viewer: read-only, no exports.

### Decision 4 — Invite mechanism
APPROVED: email invite (A) + direct add by email/uid (B).
- Invite token: signed JWT with orgId, role, expiresAt.
- Direct add: owner enters email of existing user.
- No invite-link in v2; defer.

### Decision 5 — Migration
APPROVED: lazy script (A).
- One-shot script reads every users/{uid}/situations/{*} document.
- Writes orgId = `self-${uid}` if missing.
- Creates organizations/{`self-${uid}`} with the user as sole owner.
- Idempotent; logs to migration_log/{runId}.
- Runs after A1-A6 ship and before any team feature is announced.

## Implementation plan

A1: orgId on session cookie + withAuth context
A2: collaborators field on situations + types
A3: Firestore rules expansion
A4: invite flow + handlers
A5: role pills + role-aware UI
A6: audit log

## Out of scope for this session

- SSO / SAML — separate session
- Org-level billing — depends on multi-tenant; comes after
- Org-level branding — defer
- Multi-org per user — defer (one user = one primary org for v2)

## Reversibility

If multi-tenant turns out to be wrong, the lazy migration is
reversible: drop the `organizations/*` collection and unset
situation.orgId across all docs. Two-line script.

The Firestore rules expansion is harder to reverse — once shared cases
exist, rolling back the rules without revoking access requires copying
shared cases back to each member's individual scope. So: do not declare
GA on team features until org-level access has been smoke-tested with
3+ test users.
```

### 3. Update `STATUS.md`

Add a row under `## Approvals required`:

```markdown
| decision | option | approved_by | timestamp |
|---|---|---|---|
| MT-1 org model | A (implicit self-org) | <pending GC> | |
| MT-2 case ownership | C (user-owned, org-scoped) | <pending GC> | |
| MT-3 roles | owner/editor/viewer/commenter | <pending GC> | |
| MT-4 invite | email + direct add | <pending GC> | |
| MT-5 migration | lazy script | <pending GC> | |
```

GC marks each `approved` or `revised: <reason>` before A1 begins.

### 4. Hard stop

Codex must NOT begin A1 until the STATUS.md table shows all 5 rows
approved (or explicitly revised with the alternative option named).
This is the one decision-gate in this pack; everything else flows from
here.

## Acceptance criteria

1. `docs/architecture/MULTI_TENANT_MODEL.md` exists.
2. The doc has all 5 decisions filled in with rationale.
3. `STATUS.md` has the approvals table.
4. The implementation plan in the doc matches the file order
   (A1-A6).
5. Codex has explicitly waited for GC sign-off before starting A1.

## Diagnostics

```bash
test -f docs/architecture/MULTI_TENANT_MODEL.md && echo OK
grep -q "Decision 5 — Migration" docs/architecture/MULTI_TENANT_MODEL.md && echo OK
grep -q "MT-1\|MT-2\|MT-3\|MT-4\|MT-5" STATUS.md && echo OK
```

## If Codex stops short

**Failure mode A**: Codex begins A1 without the doc being approved.
Re-prompt:

> "Stop. Did STATUS.md show all 5 MT-* rows as approved before you
> started A1? If not, revert any A1 changes and wait for the
> approval signal. The decision doc is the gate."

**Failure mode B**: Codex writes the doc but doesn't surface the
approval question. Re-prompt:

> "Add a section at the top of `MULTI_TENANT_MODEL.md` called
> 'Sign-off required' that lists the 5 decisions and asks: 'GC: edit
> this doc to mark each APPROVED, or change the decision and write
> APPROVED-REVISED with the alternative chosen.' Then stop and wait."

## Commit

```
docs: lock multi-tenant data model decisions

Architectural decision document for the v2 multi-tenant work. Locks
five decisions (org model, case ownership, roles, invite mechanism,
migration) before any code lands. Implementation plan A1-A6 flows
from these decisions.

Refs: V2_WORK_PACK/A0_MT_DATA_MODEL.md
```
