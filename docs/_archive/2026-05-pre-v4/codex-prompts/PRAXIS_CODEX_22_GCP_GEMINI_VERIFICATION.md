# PRAXIS — Codex Pack 22: GCP & Gemini Enterprise Verification

**File**: `PRAXIS_CODEX_22_GCP_GEMINI_VERIFICATION.md`
**Branch**: `feature/gcp-gemini-verification`
**Depends on**: Packs 18, 19, 20, 21 merged. v1.2.0 tagged. The full marketplace + ontology + boardroom surface live.
**Estimated effort**: ~10 days (~80 engineering hours).
**Target release**: v1.2.1 (GCP-verified release)
**Voice**: Senior cloud platform engineer who has been on call at 3am and knows the difference between "audit says green" and "the system actually works under load." Brings the production-evidence discipline that turns a deployed app into a reliably-deployed app.

---

## 0. Why this pack exists

After packs 18-21, PRAXIS has 52 marketplace tools across 9 ontologies, 7 subagents on Vertex AI Agent Engine, the agentic boardroom, structured analytic techniques, early warning feeds (VIEWS + UCDP), the production reality closure, the genuinely-useful UX. The codebase is rich. The architecture bible's claims are mostly honored.

But "the architecture is mostly honored" is the wrong bar for a production system carrying real policy work for real organizations. The Gemini Enterprise Agent Platform is the AI runtime; Vertex AI is the developer model surface; Cloud Run hosts the services; Cloud SQL hosts the graph; Firestore hosts metadata; Cloud Storage hosts blobs; Identity Platform handles auth; Secret Manager holds secrets; Cloud Trace observes; Cloud Logging logs; Cloud Monitoring alerts; Cloud Build deploys; Cloud Tasks/Scheduler orchestrate; Terraform provisions; Cloud Armor protects. **All of it must work, end-to-end, observably, with evidence committed to the repo so the next 3am page has a runbook to follow.**

This pack is end-to-end production verification. It does not add features. It produces, for every layer of the GCP stack PRAXIS depends on, a verification artifact: a test that runs against staging, an audit script that checks the configuration, a runbook for failure modes, and a piece of committed evidence (screenshot, log sample, trace sample, dashboard URL) proving the layer is real and healthy. After this pack ships, when a Gemini Enterprise outage happens, the on-call has a runbook. When Cloud SQL hits a connection-pool ceiling, alerts fire and a runbook exists. When Vertex AI surfaces a token-cost spike, the budget-enforcer engages within the documented threshold.

The structure of this pack is not a feature pack. It is twelve verification slices, each producing concrete evidence and adding a new audit to the chain. Together they constitute the **production readiness pass** that earns the v1.2.1 tag.

The twelve slices:

1. **Vertex AI provider isolation + model matrix integrity** — every AI call routes through `MODEL_MATRIX.json`; static AST audit + runtime assertion under load.
2. **Gemini Enterprise Agent Engine deployment health** — all 7 subagents deployed, eval-fresh, Cloud Trace span trees verified, cost telemetry populated, Sessions + Memory Bank wired.
3. **Postgres + pgvector + Cloud SQL HA** — schema current, RLS enforced, IVFFlat indexes healthy, connection pooler (pgbouncer) tuned, 30-day PITR active, drift-from-Firestore = zero.
4. **Firestore security rules + structured documents** — owner scoping enforced at database; security-rules unit tests against synthetic users.
5. **Cloud Storage + CMEK + lifecycle** — uploads bucket has CMEK, public-access prevention, 90-day glacier lifecycle; signed-URL TTL ≤ 5min; versioning on.
6. **Cloud Trace + Logging + Monitoring + Sentry** — 100% trace coverage on `/v1/cases/*/tools/*/run`; structured logs with all 5 fields; dashboards published; budget alerts active.
7. **Cloud Build + Run + Canary** — canary protocol 5→25→100 with auto-rollback; per-revision health check; build artifacts retained 30 days.
8. **Cloud Tasks + Scheduler** — required jobs active (drift verifier, persona corpus refresh, two-phase reconciler, VIEWS monthly, UCDP monthly, AA playbook quarterly); failures alert.
9. **Identity Platform + magic-link + waitlist gating** — magic-link delivery <30s P95; rate limit 5/hour enforced; OAuth callbacks work.
10. **Secret Manager + IAM least-privilege** — every service account has minimum roles; secrets versioned; rotation runbook documented.
11. **Terraform state + multi-region readiness** — state in gs://praxis-terraform-state/; zero hand-clicked drift; europe-west4 plan committed (v1.3+ rollout-ready).
12. **Network + Cloud Armor + load testing** — WAF rules active; 100 req/min per IP; staging k6 stress test (100 concurrent users, 1h soak, 1k document ingestion, 10k tool runs) committed.

After this pack: the GCP stack is fully observable, fully evidenced, fully runbook-covered. PRAXIS at v1.2.1 is the version that runs reliably, the version Giulio can pitch to enterprise customers without footnotes, and the version the team can sleep on.

---

## 1. Outcomes

| # | Outcome | Verification |
|---|---|---|
| 1 | All AI calls route through `MODEL_MATRIX.json` via Vertex; runtime assertion under load proves no leak | `audit:ai-provider-isolation` + new `audit:ai-call-runtime-trace` green |
| 2 | All 7 subagents (context_preparer, source_augmenter, output_refiner, memo_drafter, red_team_analyst, analyst_persona, moderator) deployed to Agent Engine with sessions=`vertex` + memory_bank=`per-user` + Cloud Trace propagation; trace samples committed | `audit:subagent-deployment-fresh` + `audit:subagent-eval-fresh` + `docs/audits/2026-NN-NN-AGENT_ENGINE_HEALTH.md` |
| 3 | Postgres production posture: HA across 2 zones, CMEK, 30-day PITR, IVFFlat indexes verified, drift = 0 | `audit:cloud-sql-posture` + `audit:postgres-schema-current` + `audit:kg-drift` |
| 4 | Firestore security rules covered by synthetic-user unit tests; cross-tenant access returns 403 in all cases | `tests/firebase/firestore-rules.spec.ts` |
| 5 | Cloud Storage: CMEK active, public-access prevention enforced, lifecycle to glacier at 90d, signed-URL TTL ≤5min | `audit:cloud-storage-posture` |
| 6 | Cloud Trace coverage ≥99% on critical path; structured logging audit confirms `traceId/spanId/userId/caseId/requestId` on every backend log line; 7 monitoring dashboards published; budget alerts wired to Sentry | `audit:observability-coverage` extended; dashboard URLs committed at `docs/runbooks/DASHBOARDS.md` |
| 7 | Canary deploy protocol (5→25→100 over 48h) verified by latest production deploy with timestamps; auto-rollback test on staging proves the rollback path | `docs/launch/CANARY_LOG.md` shows latest evidence; `docs/runbooks/CANARY_ROLLBACK.md` |
| 8 | Cloud Tasks + Scheduler health: 6 required jobs active and tested; failure path alerts | `audit:scheduler-jobs-active`; per-job runbook |
| 9 | Identity Platform magic-link: P95 delivery <30s; rate-limit 5/hour per email enforced; OAuth callback works | `tests/auth/magic-link.spec.ts` |
| 10 | Secret Manager hygiene: zero secrets in code, all secrets versioned, IAM least-privilege documented per service account | `audit:secret-leak` (gitleaks-based); `docs/runbooks/SECRET_ROTATION.md` |
| 11 | Terraform: zero drift on staging + production; multi-region (`europe-west4`) plan committed but not applied | `audit:terraform-drift`; `infrastructure/terraform/envs/production-eu/` committed |
| 12 | Cloud Armor WAF rules active (OWASP Top 10, 100 req/min); k6 load test committed with run logs | `audit:cloud-armor-active`; `infrastructure/loadtest/run-evidence/` |
| 13 | Production runbook bundle published: 12 runbooks, one per slice, each with failure modes + mitigation steps | `docs/runbooks/` populated |
| 14 | One new ADR: 0035 (GCP production-verification discipline as launch-gate) | ADR reviewed |
| 15 | Tag `v1.2.1` after all twelve slices green for 7 consecutive days | Tag exists; release notes committed |

---

## 2. Pre-work confirmation note

> I am Codex. I have read pack 22. I understand:
> 1. **This pack is verification, not implementation.** Every prior pack should have implemented the underlying capability; this pack verifies it works against the live GCP stack and produces committed evidence.
> 2. **Every slice produces three artifacts**: a runbook in `docs/runbooks/<slice-name>.md`, an audit script in `scripts/audit-<slice-name>.ts`, and a piece of committed evidence in `docs/audits/2026-NN-NN-<slice-name>-EVIDENCE.md` (typically a sample log, trace tree, dashboard URL, or test output).
> 3. **The Gemini Enterprise terminology is precise.** Per the live alignment doc: *Gemini Enterprise* is the enterprise agent/work platform (sessions, memory bank, app connectors, governance); *Vertex AI* is the managed developer model runtime PRAXIS code calls; *Agent Engine* is the runtime where subagents deploy. The model matrix uses Vertex provider strings; runtime deployments target Gemini Enterprise Agent Engine.
> 4. **Cost ceiling for this pack**: $300-400 across staging deploys, eval re-runs, load testing. No new GCP-region commitments without owner approval.
> 5. **Architecture invariants from the bible (§3) hold.** This pack does not change them — it proves they're enforced under production load.
> 6. **The 7-day green window is the final gate.** Every slice's audit must run green for 7 consecutive nightly runs before `v1.2.1` is tagged.
>
> Open questions for Giulio:
> - **Q1**: Cloud SQL HA — currently zonal per the self-audit. Propose: enable HA across us-central1-a and us-central1-b ($120/month delta) on production immediately as part of slice 3. Acceptable, or defer to v1.3 with ADR?
> - **Q2**: CMEK rollout — Cloud Storage and Cloud SQL should use customer-managed encryption keys via Cloud KMS for production. ~$10/month for the key + $0.06/10k operations. Acceptable for production immediately, staging optional?
> - **Q3**: VPC Service Controls — significantly tightens the security posture (prevents data exfiltration from Vertex AI) but adds operational complexity. Propose: defer to v1.3 with ADR; tracking explicitly. Acceptable?
> - **Q4**: Multi-region — propose committing `infrastructure/terraform/envs/production-eu/` as Terraform plan-only (not applied) so v1.3 rollout is one approval away. Acceptable, or skip until demand justifies?
> - **Q5**: Load testing intensity — propose: 100 concurrent users for stress, 50 sustained for 1h soak, 1000 doc ingestion fan-out, 10k tool runs over 1h. Run on staging with ~$60 GCP burn. Acceptable, or different intensity?

Wait for answers before proceeding.

---

## 3. Pack overview

| Slice | Outcome | Hours |
|---|---|---:|
| V1 | Vertex provider isolation + model matrix runtime trace | 5 |
| V2 | Gemini Enterprise Agent Engine: 7 subagents healthy + traced + costed | 10 |
| V3 | Postgres + pgvector + Cloud SQL HA + drift verification | 10 |
| V4 | Firestore rules + structured docs + cross-tenant safety | 6 |
| V5 | Cloud Storage CMEK + lifecycle + signed URLs | 5 |
| V6 | Cloud Trace + Logging + Monitoring + Sentry — full observability stack | 10 |
| V7 | Cloud Build + Run + Canary + auto-rollback proven | 6 |
| V8 | Cloud Tasks + Scheduler — 6 required jobs verified | 6 |
| V9 | Identity Platform magic-link + OAuth + rate limiting | 5 |
| V10 | Secret Manager + IAM least-privilege + rotation | 5 |
| V11 | Terraform state + multi-region readiness | 6 |
| V12 | Cloud Armor + load testing + final integration + tag | 6 |
| **Total** | | **~80** |

---

## 4. Hard rules

- **Every claim has committed evidence.** "Cloud Trace covers 99%" must point to a `docs/audits/2026-NN-NN-TRACE_COVERAGE.md` file with a sample query result.
- **Every audit script is re-runnable from any developer's machine** (with appropriate gcloud auth). No "the audit was run once and it passed."
- **Every failure mode has a runbook.** A new on-call engineer with no PRAXIS context should be able to follow `docs/runbooks/<slice>.md` to diagnose and mitigate within 30 minutes.
- **No GCP resource is changed without Terraform.** All 12 slices respect this. If a slice needs a config change (e.g., enable Cloud SQL HA), the change goes through Terraform.
- **All cost-impacting changes documented.** Slice 3 (HA), slice 5 (CMEK) bump the monthly bill; the delta is committed at `docs/architecture/COST_PROJECTIONS.md`.
- **The 7-day green window is non-negotiable.** Tag `v1.2.1` only after every audit has been green for 7 consecutive nightly runs.

---

## 5. Slice V1 — Vertex AI provider isolation + model matrix runtime trace

### Persona
Static-analysis engineer + distributed-tracing engineer.

### Phase 1 — Read & report

- Confirm `audit:ai-provider-isolation` (existing) catches all imports of `@google-cloud/aiplatform`, `vertexai`, `@anthropic-ai/sdk` outside `src/lib/ai/providers/` and `backend/ai/providers/`.
- Inspect runtime: under load, are there leaks where a tool handler accidentally calls a model directly?
- Output `docs/audits/2026-NN-NN-MODEL-MATRIX-RUNTIME.md`.

### Phase 2 — Propose & confirm

Two new audits:

**(a) `audit:ai-call-runtime-trace`** — runs against staging, samples 100 recent tool runs, verifies every model call has a parent-span tagged with the originating `taskKind` from `MODEL_MATRIX.json` and one of the canonical model strings declared in the matrix.

**(b) `audit:model-matrix-coverage`** — for each declared `taskKind` in `MODEL_MATRIX.json`, asserts at least one production invocation in the last 7 days. Surfaces task kinds that exist in matrix but are never used (potential dead config).

### Phase 3 — Execute

- Author both audits.
- Run against staging.
- Add to `audit:gate`.
- Commit evidence: 100-row trace sample showing taskKind + model + cost per call.

### Files

- `scripts/audit-ai-call-runtime-trace.ts`.
- `scripts/audit-model-matrix-coverage.ts`.
- `docs/audits/2026-NN-NN-MODEL-MATRIX-RUNTIME.md`.
- `docs/runbooks/AI_PROVIDER_HEALTH.md`.

---

## 6. Slice V2 — Gemini Enterprise Agent Engine: 7 subagents healthy

### Persona
Agent-platform engineer.

### Outcome

For each of the 7 subagents (context_preparer, source_augmenter, output_refiner, memo_drafter, red_team_analyst, analyst_persona, moderator):

- Live deployment on Gemini Enterprise Agent Engine in `us-central1`.
- `sessions: { backend: 'vertex' }` confirmed via gcloud describe.
- `memory_bank: { enabled: true, scope: 'per-user' }` confirmed.
- Latest eval ran in last 7 days; pass rate ≥ 80% per `audit:subagent-eval-fresh`.
- Cloud Trace span tree on a sample invocation (committed as JSON to `docs/audits/2026-NN-NN-AGENT_ENGINE_HEALTH.md`).
- Per-call cost recorded in BigQuery audit collection; cost dashboard panel populated.
- Per-call latency P95 within budget per `MODEL_MATRIX.json`.
- Rollback runbook tested: deploy a known-bad version to staging, run rollback CLI, confirm previous version live within 60s.

### Files

- `infrastructure/agent-engine-deployments.json` (committed: engine ids, versions, deployment timestamps).
- `docs/audits/2026-NN-NN-AGENT_ENGINE_HEALTH.md` (per-subagent: eval status, sample trace, cost, latency).
- `docs/runbooks/AGENT_ENGINE_INCIDENT.md` (failure modes: deployment unavailable, eval regression, cost spike, session drift).
- `docs/runbooks/SUBAGENT_ROLLBACK.md`.

### Verification

- All 7 subagents live; eval green; trace samples committed.
- Rollback tested on staging; documented.

---

## 7. Slice V3 — Postgres + pgvector + Cloud SQL HA + drift

### Persona
Database reliability engineer.

### Outcome

Production Cloud SQL Postgres in HA across us-central1-a and us-central1-b (assuming Q1 approval). 30-day point-in-time recovery active. CMEK via Cloud KMS active. pgbouncer pooler tuned (per the existing `infrastructure/pgbouncer/`). pgvector extension healthy; IVFFlat indexes verified by query plan inspection. Drift = 0 vs Firestore (per `audit:kg-drift` nightly).

Slice produces:
- Cloud SQL gcloud-describe snapshot in `docs/audits/2026-NN-NN-CLOUD-SQL-POSTURE.md`.
- pgvector index health report (query plans, build dates, sizes).
- pgbouncer connection metric snapshot.
- Drift verifier 7-day clean-run history.
- Failure-mode runbook: failover, restore from PITR, vacuum, index rebuild.

### Files

- `scripts/audit-cloud-sql-posture.ts`.
- `scripts/audit-pgvector-health.ts`.
- `docs/audits/2026-NN-NN-CLOUD-SQL-POSTURE.md`.
- `docs/runbooks/CLOUD_SQL_FAILOVER.md`.
- `docs/runbooks/PGVECTOR_INDEX_REBUILD.md`.

---

## 8. Slice V4 — Firestore rules + structured docs

### Persona
Security engineer.

### Outcome

`firestore.rules` covered by synthetic-user unit tests:
- Owner can read/write own `users/{uid}/` docs.
- Other users return 403 on cross-tenant read.
- Server-only fields (subscription, fullAccessCode, etc.) cannot be written by client.
- Public collections (if any) explicit and minimal.

Plus structured-document audit: every Firestore doc has expected fields per its schema (audit `audit:firestore-schema-fresh` against staging tenant).

### Files

- `tests/firebase/firestore-rules.spec.ts` (synthetic-user emulator tests).
- `scripts/audit-firestore-schema-fresh.ts`.
- `docs/runbooks/FIRESTORE_RULES_INCIDENT.md`.

---

## 9. Slice V5 — Cloud Storage + CMEK + lifecycle

### Outcome

For each PRAXIS bucket (`praxis-uploads`, `praxis-exports`, `praxis-snapshots`, `praxis-agent-staging`, `praxis-persona-corpora`):
- CMEK enabled via Cloud KMS (production).
- Public-access prevention enforced.
- Versioning on.
- Lifecycle to glacier at 90 days.
- Signed-URL TTL ≤ 5 minutes (audit-confirmed in code).

### Files

- `scripts/audit-cloud-storage-posture.ts`.
- `docs/audits/2026-NN-NN-STORAGE-POSTURE.md`.
- `docs/runbooks/STORAGE_RECOVERY.md` (deleted blob recovery via versioning).

---

## 10. Slice V6 — Observability stack: Trace + Log + Monitor + Sentry

### Outcome

- **Cloud Trace**: ≥99% coverage on `/v1/cases/*/tools/*/run`. Sample latest 1000 traces; verify span tree completeness.
- **Cloud Logging**: structured JSON. Latest 100 backend logs all have `traceId`, `spanId`, `userId`, `caseId`, `requestId`. No PII at INFO level.
- **Cloud Monitoring**: 7 dashboards published per the bible's pack 14 N5 (overview, cost, context-health, graph-ops, tools-marketplace, memo-studio, onboarding-funnel).
- **Sentry**: release-tagged per git SHA; alert routes configured.
- **Budget alerts**: 50/80/100% wired to Sentry + email.
- **Uptime checks**: from 6 regions every 60s on `praxis.tacitus.me/healthz` and `/api/v1/healthz`.

### Files

- `scripts/audit-trace-coverage.ts`.
- `scripts/audit-log-schema.ts`.
- `infrastructure/dashboards/*.json` (7 dashboard definitions committed).
- `docs/runbooks/DASHBOARDS.md` (URLs and what each shows).
- `docs/runbooks/INCIDENT_RESPONSE.md`.

---

## 11. Slice V7 — Cloud Build + Run + Canary + Rollback

### Outcome

- Latest production deploy followed canary 5→25→100 over 48h with timestamps committed.
- Auto-rollback tested on staging: deploy a known-bad revision, verify error-rate >0.5% triggers rollback within 10min, old revision restored.
- Build artifacts retained 30 days.
- Cloud Build trigger committed as Terraform (no hand-clicked triggers).

### Files

- `docs/launch/CANARY_LOG.md` (latest evidence).
- `docs/runbooks/CANARY_ROLLBACK.md`.
- `scripts/audit-canary-log-fresh.ts`.

---

## 12. Slice V8 — Cloud Tasks + Scheduler health

### Outcome

Six required scheduler jobs active and tested:
1. Drift verifier (every 6h).
2. Persona corpus refresh (weekly).
3. Two-phase reconciler (hourly).
4. VIEWS monthly forecast refresh.
5. UCDP monthly events refresh.
6. AA playbook quarterly refresh.

Each job has:
- Last-run timestamp ≤ scheduled interval.
- Failure-path alert wired to Sentry.
- Runbook for failure mode.

### Files

- `scripts/audit-scheduler-jobs-active.ts`.
- `docs/runbooks/SCHEDULER_JOB_FAILURE.md`.
- Per-job runbook (drift verifier, persona corpus refresh, etc.).

---

## 13. Slice V9 — Identity Platform magic-link

### Outcome

- Magic-link delivery P95 <30s (measured via `tests/auth/magic-link.spec.ts`).
- Rate limit 5/hour per email enforced.
- Email-link OAuth callback works.
- Google SSO secondary works.
- Waitlist gating: owner-only manual approval until v1.0; switch to open in v1.1.

### Files

- `tests/auth/magic-link.spec.ts`.
- `docs/runbooks/IDENTITY_PLATFORM_INCIDENT.md`.

---

## 14. Slice V10 — Secret Manager + IAM least-privilege

### Outcome

- Zero secrets in code (gitleaks audit clean).
- All secrets versioned in Secret Manager.
- IAM per service account documented at `docs/runbooks/IAM_ROLES.md`: each SA has the minimum roles needed; explicit non-roles listed (e.g., the Cloud Run frontend SA does NOT have `roles/storage.admin`).
- Secret rotation runbook for each secret (Anthropic key, OpenAI fallback key, ACLED/UCDP keys, Sentry DSN, etc.).

### Files

- `scripts/audit-secret-leak.ts` (wraps gitleaks).
- `docs/runbooks/IAM_ROLES.md`.
- `docs/runbooks/SECRET_ROTATION.md`.

---

## 15. Slice V11 — Terraform state + multi-region readiness

### Outcome

- Terraform state in `gs://praxis-terraform-state/` (encrypted, locked).
- Zero drift on staging + production (audited via `audit:terraform-drift`).
- Multi-region (`europe-west4`) plan committed at `infrastructure/terraform/envs/production-eu/` as plan-only (not applied; awaits Q4 approval).
- Drift detection in CI: any hand-clicked GCP resource triggers a CI failure.

### Files

- `scripts/audit-terraform-drift.ts`.
- `infrastructure/terraform/envs/production-eu/` (committed but not applied).
- `docs/runbooks/TERRAFORM_OPERATIONS.md`.

---

## 16. Slice V12 — Cloud Armor + load testing + final integration

### Outcome

- Cloud Armor rules active per the bible's spec (OWASP Top 10, 100 req/min per IP, geo-restriction tunable, bot detection).
- k6 load test executed on staging:
  - Stress: 100 concurrent users doing full sign-up→ingest→tools→memo→export flow.
  - Soak: 50 concurrent for 1h.
  - Ingestion: 1000 docs concurrent fan-out.
  - Tool runs: 10k runs over 1h, mix of cheap and expensive.
- Run logs and metrics committed.
- Cost-during-load-test recorded.

### Files

- `scripts/audit-cloud-armor-active.ts`.
- `infrastructure/loadtest/run-evidence/` (committed run logs).
- `docs/audits/2026-NN-NN-LOAD-TEST-EVIDENCE.md`.
- `docs/runbooks/LOAD_HANDLING.md` (capacity plan; what to do at each user tier).

---

## 17. Final verification gate

```bash
# Foundations
npm run typecheck
npm run lint
npm run test
pytest backend/ -q
mypy backend/ --strict

# Pack-22 audits
npm run audit:ai-call-runtime-trace
npm run audit:model-matrix-coverage
npm run audit:subagent-deployment-fresh         # 7/7
npm run audit:subagent-eval-fresh               # 7/7 ≥ 80%
npm run audit:cloud-sql-posture
npm run audit:pgvector-health
npm run audit:postgres-schema-current
npm run audit:kg-drift                          # 0 drift across 7 nights
npm run audit:firestore-schema-fresh
npm run audit:cloud-storage-posture
npm run audit:trace-coverage                    # ≥ 99%
npm run audit:log-schema
npm run audit:canary-log-fresh
npm run audit:scheduler-jobs-active
npm run audit:secret-leak
npm run audit:terraform-drift                   # 0 drift
npm run audit:cloud-armor-active

# All prior gates
npm run audit:gate

# Persona suites — production bar
npm run test:e2e:personas                       # 10 consecutive green

# Live integration smoke
PRAXIS_ENV=staging python scripts/smoke-full-stack.py

# 7-day green window check
test -f docs/audits/seven-day-green-window.md
grep -q "DAY 7: ALL GREEN" docs/audits/seven-day-green-window.md

# Tag
git tag v1.2.1
```

All exit 0. Seven consecutive days of green nightly runs. PRAXIS v1.2.1 ships with full GCP/Gemini Enterprise verification.

---

## 18. The committed runbook bundle

After this pack, `docs/runbooks/` contains the on-call's complete reference:

```
docs/runbooks/
├── AI_PROVIDER_HEALTH.md
├── AGENT_ENGINE_INCIDENT.md
├── SUBAGENT_ROLLBACK.md
├── CLOUD_SQL_FAILOVER.md
├── PGVECTOR_INDEX_REBUILD.md
├── FIRESTORE_RULES_INCIDENT.md
├── STORAGE_RECOVERY.md
├── DASHBOARDS.md
├── INCIDENT_RESPONSE.md
├── CANARY_ROLLBACK.md
├── SCHEDULER_JOB_FAILURE.md
├── IDENTITY_PLATFORM_INCIDENT.md
├── IAM_ROLES.md
├── SECRET_ROTATION.md
├── TERRAFORM_OPERATIONS.md
└── LOAD_HANDLING.md
```

Sixteen runbooks. Each one tested against a synthetic incident. Each one walks an on-call from "alert fired" to "incident mitigated" in under 30 minutes.

---

## 19. Out of scope

- VPC Service Controls — v1.3 (operationally heavier; documented in ADR).
- Multi-region production rollout (us-central1 + europe-west4 active simultaneously) — v1.3+ awaiting demand.
- AlloyDB migration from Cloud SQL — v2.
- Vertex AI Vector Search activation as primary KG search — v2 (depends on > 1M-vector tenants).
- Federated identity beyond Identity Platform — v2.
- Per-tenant infrastructure isolation (separate GCP projects) — v2 white-label.

---

## 20. Closing note

Pack 22 is the production-discipline pack. After 18 closes the implementation gaps and 19-21 deepen the surface, this pack proves the GCP stack actually works under production conditions, with evidence committed to the repo so the next 3am page has a runbook to follow. After this pack ships, when a Vertex AI deployment goes stale, the alert fires + the runbook resolves it. When Cloud SQL hits a connection limit, the dashboard shows it + the runbook tunes pgbouncer. When a token-cost spike happens, the budget enforcer engages within the documented threshold.

The discipline this pack maintains is the same as every prior pack: every claim has evidence, every audit is re-runnable, every failure mode has a runbook, every architecture invariant holds. The bible's promises are backed by re-runnable scripts in the repo. The architecture is now fully real *and* fully observable *and* fully runbook-covered.

Branch: `feature/gcp-gemini-verification`. Commit prefix `gcp(<slice>): V<N> <description>`. PR titled `Pack 22 — GCP & Gemini Enterprise Verification`.

After merge:
1. Tag `v1.2.1`.
2. Update `docs/launch/PRODUCTION_READINESS.signed.md` with v1.2.1 line.
3. Begin v1.3 (multi-region rollout, AlloyDB migration evaluation, Vertex Vector Search readiness).

---

**File path**: `C:\Users\giuli\Downloads\PRAXIS_CODEX_22_GCP_GEMINI_VERIFICATION.md`
