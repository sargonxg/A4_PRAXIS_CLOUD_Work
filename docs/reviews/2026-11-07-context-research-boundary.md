# Context selection and private research boundary — November 7, 2026

This source checkpoint corrects context selection and adds an optional private
dataset reader. It is not a deployed dataset-to-answer acceptance record.

## Behavior

Retrieval now filters edges against retained nodes, continues past oversized rows,
ranks/deduplicates vector chunks and counts complete serialized rows in the
existing token estimate. Capsule selection fills capacity after primitive
coverage and records the edges/sources actually omitted. These are deterministic
correctness fixes; no measured model-quality or efficiency gain is claimed.

`GET /api/admin/research-dataset` uses the existing authenticated session and
verified admin-principal gate. Sample and ordinary accounts cannot access it.
The server-only reader calls the existing private Cloudflare research Worker
using Access service credentials. It permits fixed resources, rejects repeated
or unknown parameters, refuses redirects, bounds the response stream and timeout,
requires a ready versioned D1 snapshot and returns sanitized failures. No fallback
is presented as connected data. Responses use private/no-store caching.

The [connection runbook](../runbooks/CLOUDFLARE_RESEARCH_DATASET.md) records the
successful read-only D1 checks, the configuration needed in Cloud Run and the
next authenticated acceptance steps. Canonical capsules, model providers, dataset
distribution and public access remain unchanged.

## Validation

- Production build, final TypeScript check and ESLint passed. ESLint reports
  62 existing warnings and no errors.
- All 32 focused context/adapter/admin-boundary tests passed. They now run in
  `verify-main` CI.
- The full suite: 3,252 passed, one skipped, one failed across 517 files.
  The sole failure is the existing emulator-process cleanup test. An isolated
  rerun reproduces four passes/one failure: `Owned process group remained after
  cleanup`. The container retains orphan zombie descendants under PID 1;
  `kill(-pgid, 0)` still observes their group after TERM/KILL. No emulator helper
  or assertion was weakened.
- Capsule, route, agent and architecture leaves passed in the aggregate gate.
  Repo-shape initially needed a parent commit in this shallow clone; after
  deepening history it passed with the pre-existing graph freshness warning.
- Surface audit initially expected outdated public metadata. Its required marker
  now matches the existing invitation-only/generation-paused source; the complete
  surface lane passes. Simplification checks pass.
- Runtime checks reach the GCP audit, which cannot establish readiness here:
  `gcloud` and a Google Cloud runtime identity are unavailable. This is an
  environment verification limit, not evidence that the production resources
  are absent. No skip flag was used to report runtime readiness.
- `graphify update .` was attempted; the CLI is unavailable. The existing graph
  report remains dated and must not be treated as an updated extraction.

No production rollout or Access policy change was performed. A live PRAXIS
connection still requires scoped service credentials and an authorized GCP
deployment environment. This route does not automatically ingest source data
into Ask or promote claims into reviewed capsules.
