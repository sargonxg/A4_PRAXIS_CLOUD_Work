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
- The final full suite: 3,264 passed, one skipped, one failed across 517 files.
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
- On the pushed PR, remote verify and credential checks passed. The authenticated
  persona run passed onboarding, protected routes, core routes and memo/boardroom,
  then failed at the existing context-readiness test's conversation-create
  `route.fetch()` (line 39), with a separate `OWNED_DESCENDANTS_UNVERIFIED`
  cleanup error. Bounded receipts omit the underlying browser message, so that
  failure's cause remains unresolved and must not be attributed to the local
  zombie reproduction alone. The failed lane was selected for one rerun; its
  final status is in the PR checks.
- The safe emulator reporter now emits a bounded category such as connection
  reset, disposed request context, isolated-egress rejection or timeout, using
  only fixed codes. It never emits raw messages, URLs, stacks or credentials;
  successful tests have no stale failure codes. Its three focused suites pass
  34 tests. No test assertion, timeout, retry or application behavior changed.
  A future exact-source persona run must establish the intermittent fetch
  failure's category before a runtime fix or release is claimed.
- The final aggregate gate compiled the production build and passed static
  leaves, then stopped at runtime/GCP proof because no GCP identity is present.

No production rollout or Access policy change was performed. A live PRAXIS
connection still requires scoped service credentials and an authorized GCP
deployment environment. This route does not automatically ingest source data
into Ask or promote claims into reviewed capsules.
