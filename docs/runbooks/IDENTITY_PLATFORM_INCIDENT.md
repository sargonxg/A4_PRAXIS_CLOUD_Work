# Identity Platform Incident

## Signals
- Login callback errors increase.
- Magic-link delivery latency exceeds target.
- OAuth redirects fail or waitlist gating is bypassed.

## Triage
1. Check `/login`, `/login/callback`, and auth session route logs.
2. Confirm Firebase/Identity Platform provider status.
3. Verify rate limits and callback URLs.

## Mitigation
- Keep waitlist gating closed if approval state is uncertain.
- Roll back auth-surface changes that affect session cookies or redirects.

## Escalation
Auth provider configuration changes require owner approval and production smoke evidence.
