# Authenticated Runtime Test Lane

This lane proves the logged-in PRAXIS product path and the runtime posture that
supports it. Use a disposable, already-onboarded, non-admin Firebase user. Do
not use a personal account for automated browser tests.

## One-Time Shell Setup

PowerShell:

```powershell
$env:TEST_FIREBASE_EMAIL="test-user@example.com"
$env:TEST_FIREBASE_PASSWORD="test-password"
$env:PLAYWRIGHT_BASE_URL="http://localhost:3000"
gcloud auth application-default login --project=praxisbytacitus
```

The lane also loads `.env.local`. If `TEST_FIREBASE_EMAIL` /
`TEST_FIREBASE_PASSWORD` and `FIREBASE_SERVICE_ACCOUNT_KEY` are stored there,
the preflight can validate ADC with a temporary service-account credential file
when local user ADC has expired. The temporary file is deleted during preflight.

Readiness check:

```powershell
npm run auth-runtime:preflight
```

The preflight checks:

- `TEST_FIREBASE_EMAIL` and `TEST_FIREBASE_PASSWORD`
- `PLAYWRIGHT_BASE_URL`, defaulting to `http://localhost:3000`
- active `gcloud` account
- active GCP project `praxisbytacitus`
- Firebase CLI login
- local Application Default Credentials

## Local App Smoke

Start the app separately when targeting localhost:

```powershell
npm run dev
```

Then run:

```powershell
npm run test:auth-runtime:local
```

This executes:

```powershell
npm run typecheck
npm run build
npm run smoke:golden-path
npx playwright test tests/e2e/canary-auth-skip.spec.ts
npx playwright test tests/e2e/ask-capsule-runtime.spec.ts
npx playwright test tests/e2e/ask-same-thread-agent-run.spec.ts
```

Inspect login, onboarding skip, `/app`, `/app/capsules`,
`/app/repository`, conversation routes, dead controls, bad redirects, missing
headings, mobile navigation, non-rendering panels, and same-thread AgentRun
receipts.

## Product Surface Checks

```powershell
npm run test:auth-runtime:product
```

This executes:

```powershell
npm run audit:mvp-route-shape
npm run audit:public-surface
npm run audit:tasklet-mvp-foundation
npm run audit:ask-cockpit-runtime
```

Inspect whether Ask PRAXIS, ContextCapsules, repository state, and cockpit
runtime copy still match the current product contract.

## Agentic Runtime Checks

```powershell
npm run test:auth-runtime:agent
```

This executes:

```powershell
npm run audit:agent-process-contract
npm run audit:agent-runtime-proof
npx vitest run tests/unit/lib/agent-runtime src/__tests__/genkit-provider.test.ts
```

Warnings from `audit:agent-runtime-proof` about worker URL, worker auth, ADK,
or Genkit environment are runtime-readiness evidence. They are not necessarily
local test failures unless the audit exits non-zero.

## Live Cloud Runtime Posture

```powershell
npm run test:auth-runtime:live
```

This executes:

```powershell
npm run audit:runtime-health-live
npm run audit:gcp
```

Inspect required APIs, Cloud Run services, Cloud SQL, Cloud Tasks queues,
secrets, Firebase/GCP auth health, and the public-safe runtime health payload.

## Full Lane

```powershell
npm run test:auth-runtime
```

Use `-- --continue-on-failure` when you want one report across all lanes even
after the first failing command:

```powershell
npm run test:auth-runtime -- --continue-on-failure
```

The lane does not create GCP/Firebase resources. If the selected test user is
missing or not onboarded, fix that account outside this script before rerunning.
