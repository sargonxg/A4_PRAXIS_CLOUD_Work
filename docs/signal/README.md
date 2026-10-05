# SIGNAL

SIGNAL lives inside the existing PRAXIS frontend at `/signal`. It uses PRAXIS sign-in, owner-scoped Firestore storage, the calibrated model gateway and native capsules. The accepted build kit is v0.2 with twelve phases; its harness is reference material, not the production application.

The implemented text workflow is: configure a bounded source panel; capture permissioned original text; propose attributed source readings; accept, reject or leave them unresolved with rationale; inspect provenance; attach reviewed native context; propose and review narrative dossiers and continuing assessments; approve an exact brief and export its pinned evidence manifest. A source reading does not verify the event, authenticity, intent or coordination. Image, audio and video analysis remain disabled.

## Geographic coverage and feedback refinement

Coverage includes a geographic globe and a media landscape. Capture an optional **Source coverage country** to map a source explicitly; existing sources remain unmapped. Selected desk countries describe scope, while filled markers count current, non-withdrawn source heads. Natural Earth label points are illustrative references, not publisher or event locations. Rotate, zoom, reset or use the country list to inspect exact evidence; an interactive world map remains available when WebGL cannot render. On mobile, readable media-group cards show count bars.

Narratives also includes an orbitable evidence network with search, language/kind/state filters and exact source, reading and interpretation inspection. Its coordinates are a reading layout without geographical or influence meaning.

Open **Private feedback** below any desk view to record a rating and observation, mark synthetic tests, and export notes yourself. Notes stay in the private desk and never accept evidence or change approved briefs. See [REFINEMENT_REVIEW.md](REFINEMENT_REVIEW.md) for actual QA observations and [IMPROVEMENT_BACKLOG.md](IMPROVEMENT_BACKLOG.md) for follow-up acceptance criteria. This refinement is published from exact source `cc4e6f6c`: all five staged and all five plain-public browser tests pass, with real second-identity feedback isolation and scoped cleanup. See the current release in PROGRESS. The simpler default world explorer and shared public-source panel are a separate candidate.

## Initial text-pilot verification status

Published at [praxis.tacitus.me/signal](https://praxis.tacitus.me/signal) using existing PRAXIS sign-in. Exact deployed code, revision/image, scheduler and safe live receipts are recorded in [RELEASE_PLAN.md](RELEASE_PLAN.md) and [PROGRESS.md](PROGRESS.md). Final source gates passed: 487 test files / 2,945 tests, typecheck, production build, lint and required audits. Three tagged staging and three public browser tests exercise real authentication, evidence/context/assessment/approval/export/correction recovery/deletion and existing capsule inspection. Public model, Cloud Tasks, two-tenant isolation and context-only withdrawal gates passed. A human-labelled 200-item quality benchmark remains unmeasured; image/audio/video and GDELT are disabled.

## Clean environment setup

Use the existing checkout in the isolated cloud task; do not create a worktree unless explicitly requested. Read root `AGENTS.md`, preserve existing changes and use the repository's supported Node/npm versions. Current workspace setup was exercised with Node 24 and npm 11; Cloud Build uses the repository Node 22 Docker image. Install without changing dependency declarations or lockfiles:

```bash
npm ci
npx tsc --noEmit
npm run lint
npx vitest run tests/unit/lib/signal
npm run build
npm run dev -- --hostname 0.0.0.0
```

The development UI is served on port 3000. Anonymous `/signal` presents sign-in; authenticated data APIs require the existing signed PRAXIS session established by Firebase sign-in. Ensure the browser origin is approved in Firebase Authentication before attempting OAuth. Do not weaken origin restrictions to resolve a staging login failure.

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
| `SIGNAL_GDELT_ENABLED` | Server-wide discovery gate; false in this release |
| `TEST_FIREBASE_EMAIL`, `TEST_FIREBASE_PASSWORD` | Approved disposable test tenant only |

Existing model-gateway configuration remains authoritative. External setup helpers under `/workspace/praxis-cloud-tools` were prepared in this workspace; they are not required clean-environment repository dependencies. Read the release plan and reproduce their documented additive operations with supported Cloud tooling when that directory is absent.

## Workers, storage and release

The worker is part of the Next.js server, not a second process. Cloud Tasks calls `POST /api/signal/worker` with verified OIDC. An hourly UTC scheduler calls `POST /api/signal/sweep` with the separate cron secret. Watched collection requires approved source inputs, ready Firestore indexes, queue permissions and a configured HTTPS worker target. Keep automatic collection paused until live dispatch and recovery are verified.

SIGNAL adds owner-scoped desks, jobs and allowance controls, plus additive collection-group field indexes and index suppression for large payloads. SIGNAL uses the existing default-deny security rules without source changes. Its 14 additive field overrides have been applied and required indexes are READY; read back indexes before future releases. No bulk migration of existing capsules or customer evidence is required. Native capsule adaptation creates private versioned copies and preserves external originals.

Before release run the full root `AGENTS.md` gate: typecheck, build, lint, repository-shape/gate/architecture-reference/GCP audits, AI-route audit and all Vitest tests. For independent kit contract checks:

```bash
node docs/signal-build/scripts/check-kit.mjs
node --test docs/signal-build/code/domain.test.mjs docs/signal-build/code/http.test.mjs docs/signal-build/code/analysis-baselines.test.mjs
```

These harness checks do not substitute for labelled production evaluation. Follow [RELEASE_PLAN.md](RELEASE_PLAN.md) for provenance, tagged staging, additive rules/index publication, authenticated canary checks, traffic promotion and rollback. Publishing a page is insufficient evidence that collection, review, export and deletion work.

Limits: 20 desks and 5 watched desks per owner; default per-desk allowances are 24 collections and 10 analyses per UTC day. Coverage metrics measure the configured panel. Usage reports counts and model token receipts; they are not provider invoices or dollar cost claims.

Next: [RUNBOOK.md](RUNBOOK.md), [DEMO.md](DEMO.md), [PILOT_CHECKLIST.md](PILOT_CHECKLIST.md).

GDELT discovery is gated by `SIGNAL_GDELT_ENABLED` and disabled for this release following the observed provider HTTP 503. Enable it only after a bounded successful live discovery check; supplied text and permissioned RSS are available.

Versioned release tools live in `scripts/signal/`: `cloudbuild.staging.yaml`, additive `firestore-indexes.py` (readback by default), hourly `scheduler.py` (plan by default), and `staging-worker-smoke.mjs` (real disposable tenant/worker/isolation proof; defaults to tagged staging; production requires explicit flag and exact runtime commit). Export the existing Google CLI/ADC configuration, use Node 24 with the managed proxy flag where needed, and follow RELEASE_PLAN for apply commands.
