# PRAXIS Six-Lane Stabilization Checkpoint

- Date: 2026-05-21
- Build: 2026.05.21.02
- Scope: repo contract alignment, capsule-depth audit repair, and authenticated canary contract hardening.

## Proven Locally

- Product docs now state the same visible product doctrine: public Home, signed-in Home + Capsules, and no new primary signed-in app pages.
- Legacy signed-in URLs and focused run URLs are documented as redirects or deep links into the shared cockpit/workbench.
- `scripts/audit-capsule-depth.ts` now derives expected starter totals and category counts from the current capsule catalog.
- The regenerated capsule-depth audit passes with 69 starters across situation, tool, output, and user categories.
- `doctor:praxis:canary` now records the full credential-gated golden path when enabled: public Home, app session, active capsule, Ask thread, AgentRun dispatch/completion, Memo Studio output, same-thread receipt, and cleanup posture.

## Credential-Gated

The live production canary still requires an onboarded disposable Firebase user, Firebase Web API key, ADC, Cloud SQL ledger env, Cloud Tasks worker URL/auth, and model runtime configuration:

```powershell
$env:TEST_FIREBASE_EMAIL="already-onboarded-test-user@example.com"
$env:TEST_FIREBASE_PASSWORD="test-user-password"
$env:PLAYWRIGHT_BASE_URL="https://praxis.tacitus.me"
$env:PRAXIS_DOCTOR_WRITE_CANARY="1"
$env:PRAXIS_CANARY_EMAIL=$env:TEST_FIREBASE_EMAIL
$env:PRAXIS_CANARY_PASSWORD=$env:TEST_FIREBASE_PASSWORD
gcloud auth application-default login --project=praxisbytacitus
npm run auth-runtime:preflight
npm run doctor:praxis:canary -- --base-url=https://praxis.tacitus.me
```

Do not claim production golden-path proof unless the saved doctor report includes an authenticated session, capsule id, run id, output destination, same-thread receipt, and cleanup posture.
