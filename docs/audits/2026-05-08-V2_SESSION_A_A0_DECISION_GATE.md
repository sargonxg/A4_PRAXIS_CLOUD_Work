# PRAXIS V2 Session A A0 Decision Gate

Date: 2026-05-08
Repo: `C:\Users\giuli\praxiscodexworking`
Source prompts:

- `docs/codex-prompts/PRAXIS_V2_A0_MT_DATA_MODEL.md`
- `docs/codex-prompts/PRAXIS_V2_A1_ORGID_CONTEXT.md`
- `docs/codex-prompts/PRAXIS_V2_A2_COLLABORATORS_SCHEMA.md`
- `docs/codex-prompts/PRAXIS_V2_A3_FIRESTORE_RULES.md`

## Result

A0 is complete. The multi-tenant decision document exists at
`docs/architecture/MULTI_TENANT_MODEL.md`, and `STATUS.md` contains the required
MT-1 through MT-5 approval table.

## Current State Summary

PRAXIS is still effectively owner-scoped:

- Existing situation paths remain under `users/{uid}/situations`.
- `orgId` appears in some profile/context/service metadata, but not as a
  universal auth or rules boundary.
- `collaborators` has no current `src/` or `backend/` hits.
- `firestore.rules` still grants situation subcollection access only to
  `request.auth.uid == uid`.

## Gate

A1, A2, and A3 are intentionally not implemented in this pass. A0 explicitly
requires GC approval before code lands. The next implementation prompt is
`A1_ORGID_CONTEXT.md` after MT-1 through MT-5 are approved or explicitly
revised.

## Safety Notes

No Firestore rules were changed. No migration script was run. No production
data was read or modified.
