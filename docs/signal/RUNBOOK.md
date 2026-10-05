# SIGNAL operator runbook

Use [RELEASE_PLAN.md](RELEASE_PLAN.md) for the actual staged revision, worker target, index readiness and production status. Authenticated staging, scheduler and production browser proof remain pending until recorded there. Use disposable test tenants for operational exercises.

## Observe first

Inspect a desk's Overview run receipts, Coverage source clocks and health, Evidence review history, Context compilation receipt and Briefs pinned manifest. Record desk/version/run IDs, provider, time, counts, saturation, error class and attempted operation. Do not copy source bodies or credentials into logs.

For the existing frontend service, these read-only commands inspect configuration/log metadata without dumping secret values:

```bash
gcloud run services describe praxis-frontend --project=praxisbytacitus --region=us-central1 --format='value(status.latestReadyRevisionName,status.traffic)'
gcloud logging read 'resource.type="cloud_run_revision" AND resource.labels.service_name="praxis-frontend"' --project=praxisbytacitus --limit=30 --format='table(timestamp,severity,resource.labels.revision_name)'
gcloud tasks queues describe agent-runs --project=praxisbytacitus --location=us-central1
```

Inspect detailed application messages only in approved operator tooling. Use the tagged staging URL from the release plan for canary journeys; do not accidentally exercise production while proving staging.

## Collector or provider failure

Pause watch before changing inputs. A provider error, timeout, partial result or saturated result is evidence of incomplete collection, not zero relevant events. GDELT's observed HTTP 503 remains a known provider failure. Its discovery headlines cannot supply original-text extraction; use rights-cleared captured text or configured RSS inputs. RSS capture/export permissions and rights basis must reflect the actual permission. Do not bypass TLS, SSRF protection, network restrictions or response-size limits. Retry after diagnosing an input/provider change and inspect the new receipt.

## Queue recovery

Jobs bind their source pack, collection window and collector input digest. Changed input cancels the old job; schedule new work after saving the corrected desk. The pilot cadence is hourly UTC. Cloud Tasks and the durable outbox deduplicate attempts. Worker leases last 180 seconds; lost workers cannot commit evidence. Sweep recovery returns expired running leases to scheduled state and redispatches pending outbox records. Attempts are bounded at three, and jobs expire after six hours. The worker endpoint requires the configured trusted OIDC identity/audience; a cron secret or shared worker header is insufficient.

Keep scheduling paused if identity, queue permissions, indexes or provider health are unverified. Confirm `signalDesks.watched` and `signalJobs.status` collection-group indexes are READY before enabling sweeps. For a crash exercise, use staging and an owned disposable job; allow the lease to expire, run the authorized sweep, verify the old receipt is closed and only the current lease commits. Do not edit attempts or lease tokens to force success. Exhausted/expired work needs an operator diagnosis and a fresh valid schedule, not an unbounded retry loop.

The sweep's `CRON_SECRET` is separate from worker OIDC. Inject it securely into the scheduler request and do not put values in shell history or documentation. Pausing a watch retains evidence and cancels subsequent collection; an already dispatched worker must still honor the current desk state.

## Changed or withdrawn evidence; stale context

Withdraw a source through the owned desk action and record the reason; do not rewrite an accepted source revision. New source content creates a revision and requires exact-span/hash review again. Previous approved briefs retain their pinned historical evidence, but exports referencing a withdrawn source are suspended. Desk-generated native snapshot downloads are also revoked; original separately attached customer capsules are preserved. Current assessments and briefs may become stale and require a new reviewed version.

Attaching a changed native context reopens affected readings and interpretations. Inspect its compiler version, capsule version/digest, selected evidence versions and omissions. Re-propose and review readings against the current context; do not relabel stale approval as current. Native context preserves distinction/language/unknown structures and does not authorize tools or publication. Restricted inherited context must remain non-downloadable even when new desk sources allow export.

## Allowance exhaustion and capacity

HTTP 429 can mean the owner has 20 desks, 5 watches or the desk reached its UTC daily allowance. Pause another watch or export/delete an unused desk where appropriate. Default desk limits are 24 collection starts and 10 analyses daily. Wait for the next UTC day for daily reset; do not clear usage counters to evade the bound. Counts/tokens are operational measurements, not dollar billing. A storage-capacity error requires reducing future collection scope or archiving/exporting approved work, not silently truncating evidence.

## Tenant export and deletion

Export an approved exact brief or its evidence manifest from Briefs. Rights restrictions can deny export; preserve them. Verify the export cites the pinned revisions, labels synthetic material and retains uncertainty. A second tenant must not read the desk, graph, jobs, capsule snippets or export.

Desk deletion is two phase: it marks deletion and disables writers/watch first, then removes owned desk-generated native capsule copies and jobs before removing the desk. Original external/customer capsules are preserved. If cleanup fails, reload and resume the supported delete operation with its current version. Delayed tasks must not resurrect deleted evidence. Test this in staging with a disposable desk and verify generated copies/jobs disappear while an external original survives.

Whole-account erasure is a separate existing platform operation, currently guarded by the account-deletion rules verification flag. Do not enable that flag just for SIGNAL or claim desk deletion proves complete account erasure. Retention/export obligations must be resolved through the existing account workflow.

## Incident ownership

Release operator owns identity, queue/index/rules readiness and rollback; reviewer owns source rights, exact readings and interpretation acceptance; pilot owner owns panel coverage and gold evaluation. Preserve the prior production revision on rollback and additive evidence/index data. Record unresolved live checks in PROGRESS; never close an incident solely because `/signal` returns HTTP 200.

GDELT discovery is gated by `SIGNAL_GDELT_ENABLED` and disabled for this release following the observed provider HTTP 503. Enable it only after a bounded successful live discovery check; supplied text and permissioned RSS are available.
