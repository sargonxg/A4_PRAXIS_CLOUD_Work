# PRAXIS V2 Prompt Pack Completion Checkpoint

Date: 2026-05-08

Scope: `docs/codex-prompts/PRAXIS_V2_*`, `STATUS.md`, `BUILD_LOG.md`, and the enforceable audit scripts added for the V2 institutional-foundations pack.

## Executive Summary

All 22 files from the V2 prompt pack are preserved under `docs/codex-prompts/` and represented in `STATUS.md`. The safe code/documentation/audit work has been implemented for A0, D0, D1 static assets, control prompts, and Z1-Z3. The remaining A/B/C work is intentionally not "paper completed": the prompts themselves define approval, live Cloud SQL, 7-day production, Cloud Run, and Agent Engine decision gates that cannot be bypassed from this local repo checkpoint without weakening the architecture.

## Prompt Status Table

| prompt | status | implementation evidence | remaining gate |
|---|---|---|---|
| V2_00_README | done | Prompt preserved and covered by `audit:codex-prompts`. | None. |
| V2_A0_MT_DATA_MODEL | done | `docs/architecture/MULTI_TENANT_MODEL.md`; MT approval rows in `STATUS.md`. | None for A0. |
| V2_A1_ORGID_CONTEXT | blocked | Status row and OP-001 prevent execution before MT decisions. | GC approval of MT-1 through MT-5. |
| V2_A2_COLLABORATORS_SCHEMA | blocked | Status row keeps A2 behind A1 and MT approval. | A1 plus MT approval. |
| V2_A3_FIRESTORE_RULES | blocked | No Firestore rules change was made in this checkpoint. | A1/A2, migration confirmation, security tests, explicit rules sign-off. |
| V2_A4_TEAM_INVITE_FLOW | blocked | Intake prompt preserved and status row records dependencies. | Org context, invitation rules, invite token and email decisions. |
| V2_A5_ROLE_PILLS_AND_GUARDS | blocked | Intake prompt preserved and status row records dependencies. | Effective-role helpers plus server/rules enforcement. |
| V2_A6_MT_AUDIT_LOG | blocked | Intake prompt preserved and status row records dependencies. | Org context, audit-log rules, route write mapping. |
| V2_B0_KG_PREFLIGHT | blocked | `docs/audits/2026-05-08-POSTGRES_KG_PREFLIGHT.md`; OP-002 records live SQL command. | VPC-connected SQL counts, latency, schema/index health, GC selection of Case 1/2/3. |
| V2_B1_DUAL_WRITE_GRAPH | blocked | Status row prevents dual-write work before B0. | Approved B0 and selected cutover case. |
| V2_B2_READ_PATH_POSTGRES | blocked | Status row prevents read-path cutover before B1 soak. | 7 days of B1 clean dual-write telemetry. |
| V2_B3_RETIRE_FIRESTORE_GRAPH | blocked | Status row prevents retirement before B2 soak and sign-off. | 7 days of B2 clean Postgres reads plus explicit GC sign-off. |
| V2_C0_COGNEE_LIVE | blocked | Status row and OP-003 record missing Cloud Run service. | Deploy/provision `praxis-cognee` with service-to-service auth. |
| V2_C1_MEMORY_RECALL_IN_CALIBRATION | blocked | Status row prevents calibration memory recall before C0. | C0 smoke-green with `COGNEE_ENABLED=true`. |
| V2_C2_AGENT_ENGINE_SUBAGENTS | blocked | `docs/audits/2026-05-08-V2_SESSION_C_C2_AGENT_ENGINE_DECISION.md`; OP-004 records decision gate. | Choose Option A deploy artifacts or Option B rename runtime claims. |
| V2_D0_STRUCTURED_EVENTS | done | Telemetry schema/emitter/intake/hooks; `audit:telemetry-coverage`. | Production Cloud Logging confirmation after deploy. |
| V2_D1_KPI_PIPELINE | partial | BigQuery views, KPI queries, deploy helper, alert docs; `audit:bq-views`. | Live sink, dataset rows, dashboard verification. |
| V2_ITERATE_LOOP | done | Prompt preserved and marker-checked by `audit:codex-prompts`. | None. |
| V2_STATUS_TEMPLATE | done | Prompt preserved; root `STATUS.md` follows operational-step ledger. | None. |
| V2_Z1_EXPORT_E2E | partial | Export routes/components/telemetry and `audit:export-coverage`. | Browser download and production telemetry smoke. |
| V2_Z2_DEMO_TRANSITION | partial | Public demo copy path, graph seed, banner, `audit:demo-claim`. | Authenticated production copy smoke. |
| V2_Z3_DEEP_RESEARCH_CONSOLIDATE | partial | Canonical `/api/ai/deep-search-agent`, soft-deprecated `/api/ai/deep-research`, shared SSE envelope, `audit:deep-research-canonical`. | D1 p50/p95/cost/failure metrics after telemetry is live. |

## Gate Policy

`audit:v2-prompt-pack-completion` enforces:

- every V2 prompt file is present through `audit:codex-prompts`;
- this checkpoint document mentions every V2 prompt;
- `STATUS.md` has status rows for every V2 prompt;
- approval and live-operation gates remain visible;
- the D/Z static audits are present in `audit:gate`.

This audit is deliberately conservative. It should fail if someone deletes a prompt, removes a blocker ledger, removes a D/Z guard, or claims the blocked A/B/C work as complete without first changing the status evidence.

## Next Unblockers

1. Mark MT-1 through MT-5 approved or revised, then start A1.
2. Run the B0 SQL preflight from a VPC-connected shell and choose the cutover case.
3. Deploy/provision `praxis-cognee` before C0/C1.
4. Decide C2 Agent Engine posture: deploy real artifacts or rename labels to calibrated pipeline.
5. Deploy D0/Z1/Z2/Z3 and confirm production telemetry rows before marking D1/Z1/Z2/Z3 fully complete.
