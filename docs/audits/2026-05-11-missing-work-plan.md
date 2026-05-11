# PRAXIS Missing Work Plan - 2026-05-11

## Current Position

- Repo: `C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work`
- Remote: `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`
- Branch: `main`
- Current HEAD at audit time: `0a2d0feb docs(v5): record persona streak three [skip ci]`
- `git pull origin main`: already up to date.
- `npm install`: passed, but `npm audit` reports 18 vulnerabilities.
- `graphify update .`: passed after the initial audit found stale Graphify output.
- `npm run audit:master-charter`: passed after Graphify refresh.
- `npm run audit:gate`: passed through typecheck, build, static audits, Graphify/master-charter, repo-shape, Neo4j sync, and Vitest; currently stops at `audit:gcp` because local `gcloud` credentials require interactive reauthentication.
- Production health: `https://praxis.tacitus.me/api/health` reports `status: ok`, with `cognee_memory: unconfigured` and `polar: unconfigured`.

## Where Work Was Left Off

The active queue is v5 Phase 9 / Queue 16. Queues 00-15 are complete, Queue 17 production deploy/live verification is complete, and Queue 18 final product QA is complete-with-blockers.

Phase 9 is not honestly closed yet. The remaining closeout work is:

1. Billing/checkout provider configuration or decision.
2. Persona-smoke CI streak proof.
3. Cognee production posture decision/deployment.
4. Runtime live-ops checks that were deliberately not claimed by static audits.
5. Ledger/status cleanup so the docs stop contradicting the current state.

## Verified Blockers

### P0 - Billing/checkout is not launch-complete

Evidence:

- `/api/health` reports `polar: unconfigured`.
- `/api/polar/checkout` and `/api/polar/portal` are designed to return `503` when Polar env is absent.
- The final QA checkpoint added buyer-facing fallback copy, but did not configure a real paid checkout provider.

Decision needed:

- Either finish Polar production configuration, or explicitly approve a Stripe migration/reversion. Do not claim paid-plan launch readiness until one provider is configured and smoked in production.

Plan:

1. Inventory current billing routes, settings UI, pricing copy, health checks, and required env vars.
2. Decide Polar vs Stripe.
3. Configure provider secrets outside the repo.
4. Run a production smoke for checkout session creation, portal access, webhook verification, and fallback states.
5. Update `STATUS.md`, `TODO.md`, `docs/build/PRAXIS_v5_EXECUTION_LEDGER.md`, and final QA evidence.

### P0 - Full gate currently fails on local gcloud reauth

Evidence:

- Initial `npm run audit:gate` passed typecheck/build and many static audits, then stopped at stale Graphify.
- `graphify update .` and `npm run audit:master-charter` fixed the Graphify blocker.
- Rerun `npm run audit:gate` then advanced past Graphify, repo-shape, operational metrics, BigQuery view audit, Neo4j sync, and Vitest.
- Current failure is `npm run audit:gcp`; every hard failure is caused by `gcloud` token refresh failure: `Reauthentication failed. cannot prompt during non-interactive execution.`

Plan:

1. Run `gcloud auth login` in an interactive shell for the active account/project.
2. Confirm `gcloud config get-value project` is `praxisbytacitus`.
3. Rerun `npm run audit:gcp`.
4. Rerun `npm run audit:gcp-production-posture`.
5. Rerun `npm run audit:gate` if a full closeout checkpoint is required.

### P0 - Persona CI streak proof is stale in docs

Evidence:

- `STATUS.md` records 3/10.
- `docs/build/PRAXIS_v5_EXECUTION_LEDGER.md` has conflicting carried-forward text saying 1/10 in one later row.
- GitHub Actions currently shows eight recent successful `persona-smoke.yml` runs:
  `25650025879`, `25650035407`, `25650114861`, `25650256824`, `25652028413`, `25652333690`, `25652772692`, `25653068426`.

Open point:

- Confirm whether all eight count toward the Phase 9 "10 consecutive passes" rule, because several are docs-only pushes and the current `HEAD` commit uses `[skip ci]`.

Plan:

1. Define the count rule in the ledger: all workflow successes vs only product-code deploy commits.
2. If all successes count, update the streak to 8/10 and trigger or wait for two more valid runs.
3. If only product-code/deploy commits count, record the stricter count and keep the blocker open.
4. Once 10/10 is real, update `STATUS.md`, `TODO.md`, and the execution ledger.

## P1 Live-Ops Work

### Cognee remains disabled-first

Evidence:

- Production health reports `cognee_memory: unconfigured`, `cogneeMemoryEnabled: false`, and `cogneeMode: disabled`.
- `BLOCKERS.md` says live Cognee SDK calls are owned by a separate `praxis-cognee` Cloud Run service.

Plan:

1. Decide whether to keep Cognee disabled for MVP launch or deploy `praxis-cognee`.
2. If deploying, provision the isolated service, bind service-to-service auth, set `COGNEE_BACKEND_URL`, and test Research/Memos/Draft/Tab acceptance paths.
3. If not deploying, keep UI language disabled-safe and mark memory recall as post-MVP.

### Provider-backed notifications are not live

Evidence:

- `BLOCKERS.md` records email, browser push, and webhook delivery as provider-unconfigured.

Plan:

1. Choose provider set: Resend, web-push, webhook signing.
2. Configure secrets and worker/scheduler invocation.
3. Store provider delivery receipts.
4. Extend `audit:notifications-feedback` with provider-backed smoke coverage.

### Deep pre-ship live checks remain unrun

Evidence:

- `BLOCKERS.md` says `audit:deep-preship` covers static checks only; staging/prod assertions remain live gates.

Plan:

1. Run Cloud SQL restore/PITR and PgBouncer/load checks from the right environment.
2. Run staged RLS probes and production trace/log coverage checks.
3. Run browser-hour console monitoring, Lighthouse/accessibility, Syria cold-open timing, and real-reader export checks.
4. Append measured results to `docs/audits/2026-05-07-DEEP_PRESHIP_CHECKLIST.md`.

## P1 Documentation Drift

Fix these before handing to another agent:

- `docs/build/PRAXIS_v5_EXECUTION_LEDGER.md` phase table still says Phase 9 is `not-started`, despite later Phase 9 checkpoints.
- `STATUS.md`, `TODO.md`, and execution ledger disagree on the persona CI streak.
- The carried-forward Queue 18 row says persona CI streak is `1/10`, while newer evidence shows at least `3/10`, and GitHub currently shows eight successful recent runs.
- Graphify freshness was stale against current `HEAD`; refreshed in this audit pass.

## P2 Technical Debt / Risk

- `npm audit` reports 18 vulnerabilities: 12 low, 2 moderate, 4 high.
- `npm audit fix` is available for several packages, but `@tootallnate/once` remediation suggests a breaking `firebase-admin` downgrade path via `--force`; do not force-fix blindly.
- Workbench initial client JS measured at 518.2 KB gzip against a 520 KB budget during the failed `audit:gate`; this is passing but tight.

Plan:

1. Run `npm audit --json` and group findings by direct vs transitive dependency.
2. Apply safe non-breaking updates first.
3. For `firebase-admin`/Google Cloud transitive findings, prefer dependency upgrades or overrides only after build, Firebase Admin init, and GCP audits are validated.
4. Keep an eye on workbench bundle budget before adding more UI to that route.

## Recommended Execution Order

1. Reauthenticate `gcloud` and restore the cloud portion of `audit:gate`.
2. Reconcile the Phase 9 ledger/status drift.
3. Resolve billing provider decision/configuration and production checkout smoke.
4. Close the persona CI streak with a documented count rule.
5. Decide Cognee MVP posture.
6. Run or explicitly defer the deep live-ops checks.
7. Triage dependency vulnerabilities without force-downgrading core cloud packages.

## Suggested Next Prompt

```text
Continue PRAXIS Phase 9 closeout in
C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work.

Read AGENTS.md, STATUS.md, TODO.md, BLOCKERS.md,
docs/build/PRAXIS_v5_EXECUTION_LEDGER.md,
docs/build/PRAXIS_v5_ANTIGRAVITY_QUEUE_PROMPTS.md, and
docs/audits/2026-05-11-missing-work-plan.md.

Graphify has already been refreshed in the latest audit pass. First restore
cloud audit access by completing gcloud auth login in an interactive shell,
then run npm run audit:gcp, npm run audit:gcp-production-posture, and
npm run audit:gate. After that, fix only docs/status drift unless Giulio
approves billing, Cognee, or production-mutating work. Do not run mutating
cloud commands without explicit approval.
```
