# Firestore Rules Incident

## Signals
- Cross-tenant access is reported.
- Client writes server-only fields.
- Firestore permission errors spike after a rules deploy.

## Triage
1. Identify affected collection paths.
2. Reproduce with synthetic owner and non-owner users.
3. Compare deployed rules to the last committed rules.

## Mitigation
- Roll back rules to the last known-good version.
- Temporarily disable the affected client surface if owner scoping is uncertain.

## Escalation
Rules changes require explicit review; never broaden tenant access during incident mitigation.
