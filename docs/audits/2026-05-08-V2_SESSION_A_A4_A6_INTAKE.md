# PRAXIS V2 Session A A4-A6 Intake

Date: 2026-05-08
Repo: `C:\Users\giuli\praxiscodexworking`
Source prompts:

- `docs/codex-prompts/PRAXIS_V2_A4_TEAM_INVITE_FLOW.md`
- `docs/codex-prompts/PRAXIS_V2_A5_ROLE_PILLS_AND_GUARDS.md`
- `docs/codex-prompts/PRAXIS_V2_A6_MT_AUDIT_LOG.md`

## Result

A4-A6 have been preserved and registered as part of PRAXIS V2 Session A. They
were not implemented in this pass because A0 still blocks all A1-A6 code until
MT-1 through MT-5 are approved or explicitly revised by GC.

## Dependency Order

1. A1 must add org context to auth/session cookies.
2. A2 must add collaborator and visibility fields plus effective-role helpers.
3. A3 must update Firestore rules and ship mandatory security tests.
4. A4 can then add invitation routes, token handling, email stubs/provider
   requirements, and invite UI.
5. A5 can then add role pills, chapter/tab guards, and server-side role checks.
6. A6 can then add tamper-evident audit logging and owner export/viewer
   surfaces.

## Safety Notes

No invite routes, Firestore rules, auth claims, audit-log writes, or production
secrets were changed. `PRAXIS_INVITE_TOKEN_SECRET` and email provider binding
remain future deploy-step requirements, not current code changes.
