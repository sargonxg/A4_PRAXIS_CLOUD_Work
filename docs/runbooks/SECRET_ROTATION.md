# Secret Rotation

## Signals
- A secret is suspected exposed.
- Provider credentials fail validation.
- Secret version age exceeds rotation policy.

## Triage
1. Identify the affected Secret Manager secret and mounted services.
2. Check latest enabled version and consumers.
3. Search the repo for accidental secret material before re-enabling deploys.

## Mitigation
- Add a new secret version.
- Redeploy consumers with the new version.
- Disable the compromised version after validation.

## Escalation
Escalate immediately for production AI, database, cookie, or user-key encryption secrets.
