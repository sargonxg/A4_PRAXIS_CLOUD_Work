# IAM Roles

## Signals
- A service account receives broad admin roles.
- Cloud Run, Cloud Build, or scheduler jobs lose required access.
- Secret access errors appear after IAM changes.

## Triage
1. List IAM bindings for the affected service account.
2. Compare roles to the minimum needed for the failing operation.
3. Check whether access is user ADC, service account, or Cloud Build identity.

## Mitigation
- Restore the narrow role needed for the failing service.
- Remove accidental broad roles in a dedicated security PR.

## Escalation
Owner approval is required before granting project-wide admin roles or service account impersonation.
