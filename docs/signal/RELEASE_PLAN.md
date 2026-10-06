# SIGNAL cloud release record and procedure

Public application: https://praxis.tacitus.me/signal. Existing Cloud Run service `praxis-frontend`, project `praxisbytacitus`, region `us-central1`. PRAXIS sign-in is required for private desks.

## Published world explorer

Application source `3638984229114df3237b4f5e129f5e52b4d7c156` is published at https://praxis.tacitus.me/signal. Canonical main build `1a9d316b-dc46-4ed2-974e-d35414204f86` in `us-central1` created revision `praxis-frontend-01122-ncs`, image digest `sha256:1ec94e07b6cb79ce752491572a8201ff13c151eab81bb86c3ae59151513a44aa`, serving 100% of public traffic. All seven runtime health checks passed; existing resources, twelve secret bindings, worker URLs and unrelated tags are preserved. Rollback is `praxis-frontend-01119-c5g`.

All 498 unit-test files / 3,034 tests and the full configured gate passed, with zero lint errors and five existing unrelated warnings. Fifteen additive field overrides were read back. Exact-source staging build `d19806f2-5bbb-4d20-849b-e80af2c66e6f` created revision `praxis-frontend-01141-xet`; browser build `3fb42f4b-6ec5-4924-8e5f-150d250fe6cc` passed all eight tests. Plain-public browser build `ab3ad9e9-dfed-40e7-9860-baeb9c9498e5` passed the same eight tests without forwarding. Both have zero skipped, failed or flaky tests; disposable test cleanup passed. Safe current receipt: [release-world-36389842.json](proofs/release-world-36389842.json).

The default workflow is: sign in, select a country on the world globe, inspect sources and ask a question. **Evidence & briefs** opens the complete private review workflow; **Explore the world** returns to the simpler page. The twenty-country panel contains four WDI indicators and three permission-checked headline feeds: Global Voices, GOV.UK official communications and European Commission official communications. Country-title mentions identify discovery associations, not event locations or representative national media coverage. Government/media directory access checks do not verify officeholders, ownership, independence or reuse rights.

The actual shared snapshot succeeded at `2026-10-06T00:06:58.673Z`, with eighty WDI values retaining reporting years 2023–2025, eleven unique headlines across thirteen country associations, three attributed Global Voices headlines and every configured provider available. Initial collection used the earlier `80ab84f8` candidate with identical collector code; final-source same-window refresh correctly returned `not-due-or-leased`. Twelve hours is the acquisition cadence, not realtime coverage or the publication cadence of annual statistics. Failed providers retain last-known observations with explicit notices.

Real calibrated Gemini 3.5 Flash research returned HTTP 200 globally on exact-source staging (16,021 tokens) and for Brazil on the public URL (4,933 tokens), each citing two actual metrics and one actual headline. Citations, metric values and required source attribution were validated. Answers remain research drafts requiring human review; research questions and private desk evidence do not enter the shared cache or accepted capsule knowledge.

The separate `praxis-signal-world-refresh` job is ENABLED at `0 */12 * * *` UTC, targeting authenticated POST `https://praxis.tacitus.me/api/signal/world/refresh`; its secret header was privately read back. Actual manual scheduler transport returned HTTP 200 at `2026-10-06T00:54:59.500Z`; the already-collected bucket remained fenced. The existing hourly private watch job remains ENABLED and unchanged, with actual post-publication HTTP 200 at `2026-10-06T01:00:50.277Z` (following the earlier `00:00:35Z` baseline success). Neither job needs a browser or laptop to remain open.

Actual public second-identity feedback read/write returned 404; forged actor returned 422 and stale version 409. Sources, claims, reviews and approved briefs stayed unchanged; owned test desk and temporary identity/profile/rate-limit cleanup passed. Image/audio/video analysis and GDELT remain disabled. The independently human-labelled 200-item gold benchmark, customer pilot outcomes, wider licensed media coverage, verified current-government facts and polarization/audience measurements remain open and are not claimed.

## Historical geographic refinement

Exact application source `cc4e6f6cac87c4dd30a8da5c23e16dad9479c452` passed the full source gate, 2,990 unit tests and all five actual staged browser tests. Canonical main Cloud Build `d8d1d36f-b697-4913-9993-fb9315b0bc35` succeeded in `us-central1`; revision `praxis-frontend-01119-c5g`, digest `sha256:9ce973ba0504589433a1e143ba6959b6dcc4dc90778c9a137ecd9116cbd2f215`, then served 100% of public traffic. All seven runtime checks, worker URLs, resources, secret bindings and unrelated tags passed readback. Plain-public Cloud Build `691fab0c-0589-4095-a0f5-0ec6e52c5441` passed all five tests without forwarding. Actual public second-identity feedback isolation and full scoped cleanup passed. Hourly watched-desk scheduling is unchanged and successful. Rollback is `praxis-frontend-01117-68m`. Historical receipt: `proofs/release-refinement-cc4e6f6c.json`.

Earlier receipts remain historical evidence. Application source and later documentation-only handoff hashes remain distinct.

## Historical initial text-pilot release

| Field | Verified value |
| --- | --- |
| Deployed code | `cad3eb2b5ec355052607bf528a4e23d3fc5a3c72` |
| Final zero-traffic staging build | `d6af338b-6523-41d9-a732-2c2173d97a0c` (global) |
| Final tagged staging revision/image | `praxis-frontend-01132-zib` / `sha256:7d007e9057771ac138c11782ac8cd6e1ec450df5b53a0fed085aea7f564ae565` |
| Canonical main Cloud Build | `8f6398b7-5303-477f-860c-d50614c3e36e` (`us-central1`, all 9 steps SUCCESS) |
| Public revision/image digest | `praxis-frontend-01117-68m` / `sha256:b96bdebefed2e142c533e07b73f7efcbc97f5c291cb8e712f0fce48ebbaf974b` |
| Public traffic | 100% on `praxis-frontend-01117-68m`; existing tags preserved, new `signal-release` points to this revision |
| Public provenance | Exact deployed commit/repository/main/build ID/source/revision read back from public runtime; all 7 dependency checks `ok` |
| Rollback revision | `praxis-frontend-01112-6x6` |
| Worker target and OIDC audience | `https://praxis.tacitus.me` |
| Worker identity | `praxis-agents-sa@praxisbytacitus.iam.gserviceaccount.com` |
| Tasks queue | `agent-runs`, `us-central1` |
| Scheduler | `praxis-signal-watch-sweep`, `us-central1`, hourly UTC `0 * * * *` |

The deployed source is distinct from later handoff-only documentation commits. Runtime `/api/health/runtime` must report the deployed code commit, repository `sargonxg/A4_PRAXIS_CLOUD_Work`, branch `main` and canonical build source.

## Acceptance evidence

Final source gates passed: 487 isolated Vitest files / 2,945 tests, full lint 0 errors / 5 existing warnings, TypeScript, production build, full audit:gate, repo-shape, architecture-reference and AI route audit. Local authenticated GCP 38 checks: 0 hard failures / 0 soft warnings. Builder identity has one optional scheduler-list visibility warning; actual scheduler readback/manual success is verified separately. Kit integrity / 29 reference tests are separate from actual app acceptance.

Final staging and public browser suites passed all 3 tests each, including root More navigation, native exact capsule inspector, anonymous denial, real sign-in, exact evidence review/native context/assessment/editorial approval/MD+JSON exports, source correction/stale-context pre-credit rejection/rebuild/review recovery, retained history, mobile bounds, 7.611:1 primary contrast and no browser runtime exceptions.

Actual public proof receipts in `proofs/` record model/token/proposed-only behavior, second-user desk/graph/export isolation, invalid worker/cron authentication, first-attempt Cloud Tasks RSS collection, pause and complete scoped cleanup. Pinned-context withdrawal proof records allowed prior exports 200 then both exports 403 after source A withdrawal, even though the brief's direct claim only cites B; historical approved text/digest/manifest stay unchanged. Scheduler readback includes exact target/header match and manual request success. Test tenants are disposable/synthetic; no human multilingual gold accuracy or customer outcome is claimed.

## Future staging and publication

Use an authenticated Google identity with existing deploy access. In this workspace:

```bash
export CLOUDSDK_CONFIG=/workspace/.gcloud
export GOOGLE_APPLICATION_CREDENTIALS=/workspace/.gcloud/application_default_credentials.json
export PATH=/workspace/google-cloud-sdk/bin:$PATH
```

A fresh environment needs its own secure Google login and the existing approved Firebase certificate/cookie/canary bindings. Never store secret values in repository files or CLI arguments. Node 24 managed cloud networking uses `NODE_USE_ENV_PROXY=1`; production Node 22 retains its actual network path. The signed SDK alpha component is needed for the repository's BigQuery CLI audit.

Run the full root AGENTS gate before push/deploy. Commit tested work, preserve upstream history, and push a valid label-compatible staging alias before submitting an exact clean source snapshot. For this release the alias is `signal-text-pilot-final`:

```bash
signal_commit="$(git rev-parse HEAD)"
git push origin HEAD:refs/heads/signal-text-pilot-final
gcloud builds submit . --project=praxisbytacitus --region=global \
  --config=scripts/signal/cloudbuild.staging.yaml \
  --service-account=projects/praxisbytacitus/serviceAccounts/praxis-cloudbuild-deployer@praxisbytacitus.iam.gserviceaccount.com \
  --substitutions="_BUILD_SOURCE=signal-staging,_SOURCE_REPO=sargonxg/A4_PRAXIS_CLOUD_Work,_SOURCE_BRANCH=signal-text-pilot-final,_SOURCE_COMMIT=${signal_commit}"
```

The versioned staging configuration preserves existing frontend networking/resources/secret bindings and uses `--no-traffic --tag=signal`. URL: `https://signal---praxis-frontend-pgoyqovcza-uc.a.run.app`. Staging SIGNAL workers target that tag; existing AgentRun workers/OIDC audience remain public. Staging rules publication is explicitly false because SIGNAL requires no security-rule source changes. Verify exact tagged runtime provenance and actual authenticated acceptance before publishing main. Slash-containing branch names cannot be Cloud Run label values; use the pushed valid alias.

The enabled `frontend-main-on-push` trigger in `us-central1` runs `cloudbuild.frontend.yaml` when main source/package/frontend config changes. Fetch main, verify it is an ancestor of the candidate and push without force only after staging passes. The initial automatic hook for this release failed before source build because GitHub compare returned 422 for the large baseline-to-candidate diff. The existing trigger was invoked directly for the exact SHA; an initial queued invocation was cancelled before any source steps because direct-SHA execution defaults branch metadata to local. After verifying remote main points to the exact tested SHA, the successful invocation explicitly supplied `_SOURCE_BRANCH=main`. No pipeline gates or trigger definition were changed. For the same prebuild webhook failure, use `gcloud builds triggers run frontend-main-on-push --sha=<verified-main-sha> --substitutions=_SOURCE_BRANCH=main --project=praxisbytacitus --region=us-central1` and verify resolvedGitSource/exact provenance. Canonical production config sets `SIGNAL_WORKER_BASE_URL=https://praxis.tacitus.me` and `SIGNAL_GDELT_ENABLED=false`. Do not promote a tagged revision retaining its staged worker target. An untagged zero-traffic production candidate can report Ready/Retired without a running container. For this release, a new `signal-release` tag activated the exact main revision at zero public traffic; all 7 runtime dependency checks and exact metadata passed before promotion. Verify new build/revision/resources/secret bindings, explicitly send 100% public traffic to the validated production revision if default deployment retains the old pinned split, then verify exact public provenance before acceptance mutations. Preserve unrelated Cloud Run tags and rollback revision.

Production worker proof is explicitly guarded:

```bash
SIGNAL_SMOKE_BASE_URL=https://praxis.tacitus.me \
SIGNAL_SMOKE_EXPECTED_COMMIT=3638984229114df3237b4f5e129f5e52b4d7c156 \
SIGNAL_SMOKE_SECOND_IDENTITY=1 \
node --use-env-proxy scripts/signal/staging-worker-smoke.mjs --production
```

It checks exact public runtime repository/branch/commit before secrets or mutations, signs into the approved disposable canary, tests real model/worker/another identity, and cleans only its owned synthetic desks/jobs/temporary identity. Browser tests use approved public Firebase origin with secure test bindings; do not disable certificate checks or origin restrictions. Run `PLAYWRIGHT_BASE_URL=https://praxis.tacitus.me npx playwright test tests/e2e/signal.spec.ts --workers=1` with secure canary environment injection. For tagged testing only, set `SIGNAL_LOCAL_UPSTREAM` to the exact tagged server URL and preserve real Firebase/public-origin authentication. Remove that forwarding variable for public proof.

## Indexes and scheduling

All 15 additive SIGNAL field overrides have been applied/read back, including payload and new private-feedback index suppression. Six retained/new watched/status indexes are READY. Existing deployed rules deny browser direct owner-path access 403. No source security-rule edit or customer evidence migration was required.

```bash
python scripts/signal/firestore-indexes.py
# Only to apply the additive declared configuration if readback requires it:
python scripts/signal/firestore-indexes.py --apply
```

`scripts/signal/scheduler.py` plans by default; `--apply` reads the existing `praxis-cron-secret` into memory and creates/updates only the hourly SIGNAL job with exact POSTpublic `/api/signal/sweep`, `x-cron-secret`,180-second deadline and one bounded retry. Apply only after public route/provenance/worker acceptance. It verifies the authentication header privately and emits safe readback.

```bash
python scripts/signal/scheduler.py
python scripts/signal/scheduler.py --apply
gcloud scheduler jobs run praxis-signal-watch-sweep --project=praxisbytacitus --location=us-central1
```

The separate world job is managed by `python scripts/signal/world-scheduler.py` (plan) and `--apply` (provision/readback). Its actual public transport proof and current schedule are recorded above; preserve the hourly private job.

Verify actual scheduler attempt HTTP200 in Cloud Logging, not just CLI dispatch success. Never dump scheduler HTTP header values. Only explicitly watched desks collect; hourly UTC matches default 24 daily collections. Workers do not need the browser/laptop to remain open.

## Rollback and remaining limits

Current rollback is `praxis-frontend-01119-c5g`. That revision lacks world routes: pause `praxis-signal-world-refresh` before switching traffic to it, retain the public snapshot/indexes, and leave the existing private watch job enabled because the rollback supports it. The commands below describe the older full-SIGNAL rollback and are historical examples, not the current revision target.

Pause SIGNAL scheduling before rolling back to a revision without SIGNAL routes:

```bash
gcloud scheduler jobs pause praxis-signal-watch-sweep --project=praxisbytacitus --location=us-central1
gcloud run services update-traffic praxis-frontend --project=praxisbytacitus --region=us-central1 --to-revisions=praxis-frontend-01112-6x6=100
```

Retain additive indexes and evidence; never delete customer data as rollback. On forward recovery verify public worker target/provenance, then resume the scheduler deliberately. Individual desk deletion and generated-copy/job cleanup are proved. Full account erasure remains guarded by the independent existing platform flag and is not enabled solely for SIGNAL.

GDELT discovery failure, disabled image/audio/video analysis, human 200-record gold evaluation and customer pilot outcomes remain explicit limits. Coverage measures configured sources and captured time windows, not universal live geopolitical monitoring. Deterministic tests exercise crash/retry exhaustion/quotas; no live crash injection is claimed. See RUNBOOK and PILOT_CHECKLIST for owners and next evidence.
