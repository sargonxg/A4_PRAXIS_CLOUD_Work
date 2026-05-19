# PRAXIS Security

Last updated: 2026-05-16.

This file summarizes the active security posture, the review checklist, and
the incident-response procedure. It does not replace the implementation docs
in `CLAUDE.md`, `AGENTS.md`, `docs/COMPLIANCE.md`, and
`docs/GCP_OPERATIONS.md`.

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

- Frontend / API gateway: Next.js Cloud Run service.
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
- [ ] Calibrated AI routes reject malformed JSON, oversized bodies, excessive
      chat history, and very large aggregate text before credit deduction or
      model calls.
- [ ] Logs redact secrets, tokens, document text where inappropriate, and raw
      provider responses that may contain sensitive user data.
- [ ] Webhooks verify signatures.
- [ ] Cron / internal routes do not rely only on shared secrets when user impact
      is destructive.
- [ ] User API keys are encrypted with envelope encryption.
- [ ] Local secrets have a rotation procedure.

## Launch Acceptance Criteria

Do not approve a public launch unless:

- Public legal pages exist for privacy, terms, security, sub-processors, and
  data retention.
- Primary public, authenticated, health, and API routes carry the centralized
  security-header suite from `src/proxy.ts`.
- AI routes that call model providers are wrapped with `withCalibration` or are
  explicitly documented as exempt by `scripts/audit-ai-routes.mjs`.
- User API-key routes return provider status and masked metadata only, never
  plaintext key payloads.
- Launch audit artifacts redact secrets, bearer tokens, service-account emails,
  private keys, and provider credentials before they are saved.
- The final launch checkpoint records `npm run audit:gate`,
  `npm run audit:launch-readiness`, `npm run audit:runtime-health-live`,
  `npm run audit:gcp`, and `npm run doctor:praxis` evidence. Write-enabled
  production canary proof is required once dedicated canary credentials are
  available.

## Incident Response

**Report channel.** Suspected security issues go to `security@tacitus.me`.
Encrypted reports may use the PGP key published at `https://tacitus.me/.well-known/security.txt`.

**Severity matrix.**

| Severity | Definition | Response SLA | Resolution SLA |
|----------|------------|--------------|----------------|
| **P0 — Critical** | Active exploitation, data exfiltration, full auth bypass, secrets leak in public repo, billing fraud at scale | Acknowledge within 1 hour, 24/7 | Mitigation within 24 hours |
| **P1 — High** | Theoretical auth bypass, privilege escalation, persistent data corruption, single-user PII leak | Acknowledge within 4 hours (business) | Patch within 7 days |
| **P2 — Medium** | Information disclosure with limited impact, abuse / DoS without persistence, security-hardening gaps | Acknowledge within 2 business days | Patch within 30 days |
| **P3 — Low** | Best-practice deviations, defense-in-depth improvements | Acknowledge within 5 business days | Schedule next planning cycle |

**Triage flow.**

1. Reporter emails `security@tacitus.me` with reproduction steps and impact.
2. On-call (currently @sargonxg) assigns severity and opens a private incident
   doc in `docs/incidents/YYYY-MM-DD-<slug>.md` (gitignored until resolved).
3. For P0 / P1, rotate any exposed secrets immediately via Secret Manager and
   redeploy via Cloud Build with the rotation noted in the incident doc.
4. Land the fix on a private branch; merge to `main` only when verification
   passes the full `npm run audit:gate` plus the post-deploy smoke check.
5. Publish a post-mortem to `docs/incidents/` within 14 days of resolution
   (sanitized of attacker-specific detail when warranted).

**Specific runbooks** for the most common exposures live in
`docs/runbooks/SECURITY_RUNBOOK.md` (TODO: create as separate PR if missing).
Until then, the procedure for the four primary exposure classes is:

- **Provider key (Google AI, Anthropic, Firecrawl, etc.) leaked.** Rotate in
  the provider console → update Secret Manager version → redeploy → revoke the
  old key after the new revision is healthy.
- **Firebase Admin credential leaked.** Disable the service-account key in IAM
  → generate replacement → update `praxis-firebase-sa` secret → redeploy →
  audit Firestore logs for the leaked-key window.
- **Billing webhook abuse.** Disable the webhook endpoint, rotate the signing
  secret, replay missed events from the provider dashboard after the fix
  lands.
- **Accidental public exposure of the backend Cloud Run service.** Set
  `--no-allow-unauthenticated` immediately, audit access logs, and confirm
  `BACKEND_TRUSTED_SERVICE_ACCOUNTS` is enforced.

## Deeper References

- `docs/COMPLIANCE.md`.
- `docs/GCP_OPERATIONS.md`.
- `docs/OPERATIONAL_SPINE.md`.
- `firestore.rules`.
- `storage.rules`.
- `src/proxy.ts`.
- `backend/auth.py`.
- `TODO.md`.
