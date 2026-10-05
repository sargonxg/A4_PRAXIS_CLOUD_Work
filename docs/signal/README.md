# SIGNAL

SIGNAL lives inside the existing PRAXIS frontend at `/signal`. It uses PRAXIS sign-in, owner-scoped Firestore storage, the calibrated model gateway and native capsules. The accepted build kit is v0.2 with twelve phases; its harness is reference material, not the production application.

The implemented text workflow is: configure a bounded source panel; capture permissioned original text; propose attributed source readings; accept, reject or leave them unresolved with rationale; inspect provenance; attach reviewed native context; propose and review narrative dossiers and continuing assessments; approve an exact brief and export its pinned evidence manifest. A source reading does not verify the event, authenticity, intent or coordination. Image, audio and video analysis remain disabled.

## Verification status

Pre-staging checks passed: 485 repository test files/2925 tests; 91 final focused tests; typecheck, production build and required audits. The real authenticated local production browser journey passed2/2. Tagged staging, production promotion and final live browser journeys remain separate release checkpoints. GDELT returned HTTP 503 in a provider check; no live completeness claim follows from fixture tests. A human-labelled gold set of at least 200 items is still missing. Consult [PROGRESS.md](PROGRESS.md) and [RELEASE_PLAN.md](RELEASE_PLAN.md) for the coordinator's current evidence and deployment status.

## Clean environment setup

Use the existing checkout in the isolated cloud task; do not create a worktree unless explicitly requested. Read root `AGENTS.md`, preserve existing changes and use the repository's supported Node/npm versions. Current setup was exercised with Node 24 and npm 11. Install without changing dependency declarations or lockfiles:

```bash
npm ci
npx tsc --noEmit
npm run lint
npx vitest run tests/unit/lib/signal
npm run build
npm run dev -- --hostname 0.0.0.0
```

The development UI is served on port 3000. Anonymous `/signal` presents sign-in; authenticated data APIs require the existing Firebase identity token. Ensure the browser origin is approved in Firebase Authentication before attempting OAuth. Do not weaken origin restrictions to resolve a staging login failure.

Supply credentials through secure environment configuration. Firebase Admin currently initializes using the existing Firebase service-account certificate binding; user Google ADC does not replace that certificate. Reuse approved bindings rather than inventing another identity. Google Cloud deployment authentication is separate: use a signed-in gcloud identity and the project's approved deploy permissions. Never commit certificate files, login responses or secret values.

| Configuration names | Purpose |
| --- | --- |
| `FIREBASE_SERVICE_ACCOUNT_KEY`, `FIREBASE_SERVICE_ACCOUNT_KEY_FILE` | Existing Firebase Admin certificate configuration |
| `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`, `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`, `NEXT_PUBLIC_FIREBASE_APP_ID` | Existing client authentication/configuration |
| `GOOGLE_APPLICATION_CREDENTIALS`, `CLOUDSDK_CONFIG`, `GOOGLE_CLOUD_PROJECT` | Approved Cloud identity and project configuration |
| `SIGNAL_WORKER_BASE_URL`, `AGENT_RUN_WORKER_BASE_URL`, `APP_URL` | HTTPS worker target, using the SIGNAL override first |
| `AGENT_RUN_WORKER_SERVICE_ACCOUNT_EMAIL`, `AGENT_RUN_WORKER_OIDC_AUDIENCE` | Trusted Cloud Tasks worker identity and audience |
| `AGENT_RUN_TASKS_PROJECT`, `AGENT_RUN_TASKS_LOCATION`, `AGENT_RUN_TASKS_QUEUE` | Existing Cloud Tasks queue configuration |
| `CRON_SECRET` | Separate watch-sweep authentication; not a worker token |
| `TEST_FIREBASE_EMAIL`, `TEST_FIREBASE_PASSWORD` | Approved disposable test tenant only |

Existing model-gateway configuration remains authoritative. External setup helpers under `/workspace/praxis-cloud-tools` were prepared in this workspace; they are not required clean-environment repository dependencies. Read the release plan and reproduce their documented additive operations with supported Cloud tooling when that directory is absent.

## Workers, storage and release

The worker is part of the Next.js server, not a second process. Cloud Tasks calls `POST /api/signal/worker` with verified OIDC. An hourly UTC scheduler calls `POST /api/signal/sweep` with the separate cron secret. Watched collection requires approved source inputs, ready Firestore indexes, queue permissions and a configured HTTPS worker target. Keep automatic collection paused until live dispatch and recovery are verified.

SIGNAL adds owner-scoped desks, jobs and allowance controls, plus additive collection-group field indexes and index suppression for large payloads. Publish and read back the matching Firestore rules/indexes; no bulk migration of existing capsules or customer evidence is required. Native capsule adaptation creates private versioned copies and preserves external originals.

Before release run the full root `AGENTS.md` gate: typecheck, build, lint, repository-shape/gate/architecture-reference/GCP audits, AI-route audit and all Vitest tests. For independent kit contract checks:

```bash
node docs/signal-build/scripts/check-kit.mjs
node --test docs/signal-build/code/domain.test.mjs docs/signal-build/code/http.test.mjs docs/signal-build/code/analysis-baselines.test.mjs
```

These harness checks do not substitute for labelled production evaluation. Follow [RELEASE_PLAN.md](RELEASE_PLAN.md) for provenance, tagged staging, additive rules/index publication, authenticated canary checks, traffic promotion and rollback. Publishing a page is insufficient evidence that collection, review, export and deletion work.

Limits: 20 desks and 5 watched desks per owner; default per-desk allowances are 24 collections and 10 analyses per UTC day. Coverage metrics measure the configured panel. Usage reports counts and model token receipts; they are not provider invoices or dollar cost claims.

Next: [RUNBOOK.md](RUNBOOK.md), [DEMO.md](DEMO.md), [PILOT_CHECKLIST.md](PILOT_CHECKLIST.md).

GDELT discovery is gated by `SIGNAL_GDELT_ENABLED` and disabled for this release following the observed provider HTTP 503. Enable it only after a bounded successful live discovery check; supplied text and permissioned RSS are available.

Versioned release tools live in `scripts/signal/`: `cloudbuild.staging.yaml`, additive `firestore-indexes.py` (readback by default), hourly `scheduler.py` (plan by default), and `staging-worker-smoke.mjs` (real disposable tenant/worker/isolation proof; refuses production). Export the existing Google CLI/ADC configuration, use Node24 with the managed proxy flag where needed, and follow RELEASE_PLAN for apply commands.
