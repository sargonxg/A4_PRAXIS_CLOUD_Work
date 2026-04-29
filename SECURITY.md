# PRAXIS Security

Last updated: 2026-04-29.

This file summarizes the active security posture and review checklist. It does
not replace the implementation docs in `CLAUDE.md`, `AGENTS.md`,
`docs/AUTH.md`, `docs/COMPLIANCE.md`, and `docs/GCP_OPERATIONS.md`.

The current security/cloud execution plan is in
`docs/PRAXIS_SUPERPLAN_2026-04-29.md`, especially Phase 5 and Phase 6.

## Core Rules

- Do not commit secrets.
- Do not print secrets in logs or final reports.
- Keep provider keys, Firebase Admin credentials, cookie-signing secrets,
  user-key master secrets, and billing secrets server-side only.
- Keep the Python backend private on Cloud Run.
- Browser clients call Next.js API routes, not private backend URLs.
- Admin APIs require authenticated admin sessions and allowlist checks.
- Destructive operations require explicit confirmation bodies.
- Public UI must not expose internal credit costs.

## Trust Boundary

- Frontend/API gateway: Next.js Cloud Run service.
- Backend: private FastAPI Cloud Run service.
- Service-to-service calls: Cloud Run OIDC with expected audience and trusted
  service-account allowlist.
- End-user identity: Firebase token or trusted internal `X-PRAXIS-UID` after
  service auth.
- Firestore and Storage access: rules plus server-side Admin SDK for privileged
  writes.

## Review Checklist

- [ ] Auth routes reject missing, malformed, expired, and forged sessions.
- [ ] Admin routes reject non-admin users.
- [ ] Backend service-only routes reject unauthenticated public calls.
- [ ] `X-PRAXIS-UID` is accepted only after trusted service authentication.
- [ ] Firestore rules protect billing, subscription, promo, and admin fields.
- [ ] Storage rules enforce ownership and avoid broad public reads.
- [ ] AI routes use schema validation and calibrated context.
- [ ] Logs redact secrets, tokens, document text where inappropriate, and raw
  provider responses that may contain sensitive user data.
- [ ] Webhooks verify signatures.
- [ ] Cron/internal routes do not rely only on shared secrets when user impact
  is destructive.
- [ ] User API keys are encrypted with envelope encryption.
- [ ] Local secrets have a rotation procedure.

## Active Security TODO

- Rotate local workstation secrets and update Secret Manager.
- Automate GCP audit and Firestore rules/index drift checks in Cloud Build.
- Add App Check or comparable abuse control for high-cost endpoints.
- Continue tests around admin gates, cookie signing, Firestore rules, Storage
  rules, backend OIDC, and tool-output access boundaries.
- Document incident response for provider key exposure, Firebase credential
  exposure, billing webhook abuse, and accidental public backend exposure.

## Deeper References

- `docs/PRAXIS_SUPERPLAN_2026-04-29.md`.
- `docs/AUTH.md`.
- `docs/COMPLIANCE.md`.
- `docs/GCP_OPERATIONS.md`.
- `docs/OPERATIONAL_SPINE.md`.
- `firestore.rules`.
- `storage.rules`.
- `src/middleware.ts`.
- `backend/auth.py`.
- `TODO.md`.
