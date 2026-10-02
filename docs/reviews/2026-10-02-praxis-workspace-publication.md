# PRAXIS workspace publication — 2 October 2026

Published the reviewed private-project slice following Giulio's explicit request
to publish it live. This receipt supersedes the earlier local handover's
publication/authentication blockers; it does not close its unfinished product
acceptance items.

## Release identity

- Public entry: https://praxis.tacitus.me/app/projects
- Repository: `sargonxg/A4_PRAXIS_CLOUD_Work`
- Application commit: `cfe8e481bafcef2e9c66371e28b985d4f52a3bd4`
- Release branch: `build/praxis-workspace-local-20261002`
- Base and fetched `origin/main`: `8ff509b877f1dcd2b3ed6d074d2d5e96e3f9b923`
- Application diff: 32 reviewed files, 1,596 insertions / 35 deletions.
- Cloud Build: `45872e83-f1a8-4b0a-ab6f-2798a04aefa6`, SUCCESS,
  finished `2026-10-02T21:32:34.746296Z`.
- Cloud Run: project `praxisbytacitus`, region `us-central1`,
  service `praxis-frontend`, revision `praxis-frontend-01102-piy`.
- Image digest:
  `sha256:019f7fbf560311b66191c1991e42b9b4b861aea82bafa3179b6015b907ef7b15`.
  Cloud Build's resulting image and the ready revision's resolved digest matched.
- Final traffic: 100% to the verified revision, retaining the prior LATEST
  routing policy. Existing `canary` tag remains on `praxis-frontend-01050-kaj`;
  `workspace-release` identifies the new revision.
- Final configuration comparison: `2026-10-02T21:36:33.3523918Z`.

The original dirty checkout and unrelated branches/worktrees were preserved.
Application source was uploaded from a new clean, detached worktree at the exact
application commit. No main branch push or merge occurred. Documentation added
after publication is separate from the application source commit above.

## Scope and configuration

Private projects now retain explicit research scope, saved capsule version/hash
pins and draft assignments. Saves use server authorization, transactions,
optimistic concurrency and idempotency. Interrupted responses and unsaved
navigation have recovery paths. PDF exports retain source appendices and wrap
text; unsupported PDF glyphs produce an explicit DOCX fallback error.

**Project assignments remain drafts; this release does not dispatch them to an
agent.** Existing Ask, conversations, capsule intake/review and memo surfaces are
retained. Semantic capsule authoring, immutable capsule lifecycle, dependable
multi-output delegation, portability and team membership remain incomplete.

The enabled main-only frontend build trigger uses a broader legacy configuration
that republishes rules and sets IAM/runtime options. Publication instead pushed
the release branch and manually submitted the
[scoped configuration](2026-10-02-praxis-workspace-cloudbuild.yaml). Its mutation
surface is the new image, ten release-provenance environment fields, four release
labels and staged/final routing. It omits rules publication, IAM grants, secret
updates, service-account changes, scaling, SQL/VPC configuration and feature
flags. Do not merge this branch into main assuming that the legacy trigger uses
the scoped configuration.

Non-release runtime specification, template annotations and IAM policy
fingerprints were identical before staging and after promotion. Secret values
were not fetched; comparisons include configured secret references. Paid checkout
and account erasure remain disabled. No production migration, account creation,
model generation, task dispatch or state-changing live canary was run.

The existing Dockerfile uses `npm install --legacy-peer-deps`; container dependency
resolution is not claimed identical to the local validation environment. No
dependency addition or license change was introduced.

## Validation and live observations

| Evidence | Result and boundary |
| --- | --- |
| Final application unit/integration suite | 446 files / 2,638 tests passed before publication; controlled/fixture tests, not a real-model evaluation. |
| TypeScript and production build | Passed; rerun in the aggregate gate and cloud container build. Local build-time Firebase Admin warnings reflect absent local credentials, not a live health result. |
| Lint | Zero errors / five existing warnings. |
| Aggregate `npm run audit:gate` | Exit 0 after restored CLI authentication; cloud audit zero hard failures / zero soft warnings. Static deep-preship audit retained two warnings. |
| Other required local checks | Repo shape, architecture reference and local route/capsule/runtime/surface audits passed in the final candidate packet. |
| Expanded browser journey | One fixture journey passed; authentication and Firestore were mocked. Includes interrupted saves, duplicate requests, navigation and context-change handling. |
| Dependency audit | Zero high / zero critical; 45 lower-severity findings remain. |
| Staged anonymous HTTP | Home/login 200, Projects redirect 307 preserving destination, Projects API 401, six JS bundles 200; exact source/build matched. |
| Initial staged runtime read | Failed: agent queue reported down, six other checks healthy. Preserved as `staged-http.json`; no permissions or checks were changed to make it pass. |
| Subsequent staged runtime reads | Two reads passed all seven checks. The original failure's cause is unconfirmed; the endpoint catches both timeouts and non-success responses. |
| Public custom domain after promotion | Exact commit/build/revision matched; all seven runtime checks healthy; home/login and six bundles 200; anonymous Projects API 401 and Projects login redirect correct. |
| Real browser after promotion | Existing Firebase session restored automatically and rendered authenticated Projects with the empty saved-project state and existing conversation navigation. Read-only observation; no project was created or edited. |
| Export QA | Five controlled PDF pages inspected in the local candidate; DOCX visual QA remains pending. No live export or full portable round-trip was performed. |
| Actual generation and human evaluation | Not run. No fidelity score, time saving, reviewer agreement or customer-performance claim is made. |

Anonymous HTTP health includes read-only dependency probes. It is not an
authenticated create/save/reopen journey, a worker execution test or an analytical
quality evaluation. Browser session restoration proves authenticated rendering
and the project-list read only, not a fresh provider login or relogin persistence.

## Receipts, rollback and continuation

Local release receipts are under
`output/releases/workspace-20261002/`: source/config hashes, upload inventory,
build submission/result, before/staged/after fingerprints, resolved revision,
initial failed staged check, passing rechecks, public-domain check and traffic
receipt. Upload used the existing `.gcloudignore` plus an external exact `.git`
exclusion because detached worktrees use a pointer file rather than a directory.
No local credentials, generated outputs, documentation or graph artefacts entered
the build archive. The clean release source remains at
`C:\Users\giuli\output\praxis-workspace-release-20261002`.

If the published slice fails, route user traffic back without changing IAM,
secrets or rules:

```powershell
gcloud run services update-traffic praxis-frontend --project=praxisbytacitus --region=us-central1 --to-revisions=praxis-frontend-01099-wpp=100
```

Then inspect `/api/health/runtime` for the restored source
`52102b5c4e775a0744a16af96c01e3a09e350123`. This emergency rollback deliberately
pins traffic to the previous revision; restoring future LATEST routing is a
separate decision after repair. Rollback was prepared, not executed or exercised.

The [local candidate handover](2026-10-02-praxis-workspace-local-candidate.md)
contains the before/after capability matrix, architecture responsibilities,
changed-file inventory, synthetic dossier, screenshots and exact P0–P3 restart
plan. Next acceptance is an explicitly authorized synthetic authenticated live
project create/save/reopen journey. Continue the missing capsule lifecycle and
project-linked task/artifact slices locally; propose any paid model evaluation
with dataset, provider, settings and cost cap before running it. Do not infer
full workspace completion from this publication receipt.
