# ADR 0050: User Models as first-class versioned artifacts

Date: 2026-05-10
Status: Proposed (awaiting Giulio sign-off)

## Context

Each authenticated user already has an `AnalystProfile` stored at
`users/{uid}/profile/analyst` plus immutable snapshots at
`users/{uid}/profile_versions/{vN}` after each edit. This is the calibration
substrate that `withCalibration` injects into every AI route.

Today, profile snapshots are a Firestore implementation detail. They are not
addressable as first-class artifacts: there is no list view, no diff, no
comparison surface, no API endpoint that returns "user model v3 vs v5", and
no Postgres table that an analytics or product workflow can join against.

The v4 direction treats User Models as products in their own right — a user
can hold multiple variants, share them, fork them, and switch between them
per situation. That requires elevating versions to first-class artifacts.

## Decision

User Models become first-class versioned artifacts:

1. The Firestore `profile_versions` subcollection remains the live write path
   in v4 Phase 3. It is append-only — no edits, no deletes.
2. A new logical surface `src/lib/user-models/` exposes versioned CRUD
   (`get`, `list`, `latest`, `diff`, `compare`) without bypassing the SKC
   knowledge surface.
3. A future Postgres `user_model_versions` table receives every snapshot via
   `profile.events` Pub/Sub mirror. Schema and migration are out of scope
   for this ADR; tracked in v4 Phase 3.
4. The audit gate `audit:user-model-versioning` enforces append-only
   semantics once Phase 3 ships.
5. `AnalystProfile.meta.version` remains a monotonic integer; rollback is
   forward-only (a "rollback" creates a new version that copies an older
   one's body).

## Consequences

- `src/lib/firebase/analyst-profile-service.ts` keeps the Firestore writes;
  the new `src/lib/user-models/` module wraps it with a stable interface
  that the rest of the app uses instead of touching Firestore directly.
- Settings UI gains a "version history" panel reading from the new module.
- A Postgres mirror unblocks BigQuery analytics on profile evolution.
- One-way schema change: once we declare versions immutable, prior code that
  mutates a snapshot in place (none today) becomes a hard error.

## Alternatives Considered

- **Keep snapshots as a hidden detail.** Rejected: blocks the v4 direction
  of treating user models as shareable artifacts.
- **Replace Firestore with Postgres immediately.** Rejected: Phase 3 only
  needs the *contract*; storage migration is independent and gated by the
  Postgres KG cutover.
- **Per-version blob in a single document.** Rejected: violates Firestore
  document size limits at scale and breaks query-by-version.

## References

- `docs/architecture/PRAXIS_SIMPLIFIED_CONTEXT_CORE_MODEL_2026-05-08.md` — User Core posture.
- `src/types/analyst-profile.ts` — current shape.
- `CLAUDE.md` AnalystProfile section — calibration contract.
- `docs/audits/2026-05-10-v4-cleanup-inventory.md` — Phase A inventory.
