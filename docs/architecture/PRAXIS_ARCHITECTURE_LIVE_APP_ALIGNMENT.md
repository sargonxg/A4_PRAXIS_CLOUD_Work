# PRAXIS Architecture Live-App Alignment

Date: 2026-05-31
Reference: `docs/architecture/PRAXIS_ARCHITECTURE.md`
Repo: `C:\Users\giuli\A4_PRAXIS_CLOUD_Work`

This document makes the new architecture bible usable against the real app. It
does not weaken the reference. It separates shipped invariants from target-state
claims so engineers and future agents can safely continue implementation.

## Active Status Ledger

The latest compact architecture-level truth ledger is the May 31 verification
set: `docs/audits/2026-05-31-launch-readiness.md`,
`docs/audits/2026-05-31-DEEP_PRESHIP_CHECKLIST.md`, and
`docs/build/PRAXIS_POLICY_TEAM_AGENTIC_CAPSULE_HARDENING_PROJECT_2026-05-31.md`.
Older detailed self-audit and reality-check reports remain useful background,
but they no longer define the live route map.

Current remaining gaps are operational, not public-route architecture gaps:

- live header probing requires `PRAXIS_LAUNCH_LIVE_HEADERS=1`;
- authenticated canaries, Cloud SQL restore tests, load tests, and browser
  sessions against production credentials remain owner-gated;
- this local shell lacks Firebase Admin credentials, the agent Postgres ledger
  URL, and Cloud Tasks worker target/auth env;
- GitHub Actions checks may be blocked by repository billing/spending limits
  even when local code gates pass.

## Required Correction

The stored architecture reference uses the phrase "Gemini Enterprise Agent
Platform (formerly Vertex AI)." Treat that as product shorthand, not a literal
platform rename. The live app uses this interpretation:

- **Gemini Enterprise**: enterprise agent/work platform, app connectors,
  governance, sessions, Memory Bank, and agent-facing surfaces.
- **Vertex AI**: managed developer/model runtime and Cloud Run ADC path used by
  PRAXIS application code.

This matches `docs/architecture/MODEL_SELECTION.md`,
`src/lib/ai/MODEL_MATRIX.json`, and the active provider audits.

## Shipped And Enforced

| Reference invariant | Live app status | Evidence |
|---|---|---|
| Model strings centralized | Enforced | `src/lib/ai/MODEL_MATRIX.json`, `src/lib/ai/providers.ts`, `backend/ai/providers.py`, `npm run audit:ai-provider-isolation` |
| Vertex default in production posture | Enforced locally | `npm run audit:ai-provider-vertex-default` |
| Pack 22 GCP/Gemini verification discipline | Enforced for safe local/read-only checks | `npm run audit:model-matrix-coverage`, `npm run audit:runbook-bundle`, `npm run audit:pack22-verification`, `npm run audit:gcp-production-posture` |
| Every AI route calibrated | Enforced | `npm run audit:routes` reports 61 calibrated AI route files with 10 static exemptions |
| Public support surface is narrow and routable | Enforced | `/`, `/learn`, `/guide`, `/pricing`, `/release-notes`, `/changelog`, `/help`, `/legal/*`, `npm run audit:public-surface`, `npm run smoke:public` |
| Capsule-bound generation contract exists | Enforced | `src/lib/context/context-injection.ts`, `tests/unit/lib/context/capsule-service.test.ts` |
| AgentRun enqueue is idempotent at app and Cloud Tasks boundary | Enforced locally | `src/lib/agent-runtime/postgres.ts`, `src/lib/agent-runtime/cloud-tasks.ts`, `tests/unit/lib/agent-runtime` |
| Context health advisory, not blocking | Enforced | `npm run audit:context-vs-tools`, `npm run audit:context-aware-coverage` |
| Marketplace uses ContextProvider foundation | Enforced | `src/app/api/tools/marketplace/run/route.ts`, `npm run audit:tool-marketplace` |
| Fifty-two curated marketplace tools | Enforced | `npm run audit:tool-marketplace`, `npm run audit:tool-skills-present`, `npm run audit:tool-canary-executable`, `npm run audit:tool-semantic-canaries`, `npm run audit:tool-persona-coverage`, `npm run audit:tool-composition-static`, `npm run audit:tool-suggestion-eval` |
| UX loading/empty/error states have local gate | Enforced | `npm run audit:ux-polish` |
| Observability has local trace/logger/health gate | Enforced | `npm run audit:observability-coverage` |
| Structured telemetry has local schema/emit-site gate | Enforced | `src/types/telemetry.ts`, `src/lib/telemetry/emit.ts`, `npm run audit:telemetry-coverage` |
| KPI BigQuery assets are tracked in repo | Enforced for static assets; live sink pending deploy | `infrastructure/bigquery/`, `docs/operational/KPIS.md`, `npm run audit:bq-views` |
| Graphify stays refreshed | Enforced operationally | `graphify update .`, `npm run audit:repo-shape` |
| Architecture §19 command chain is accounted | Enforced | `npm run audit:architecture-chain` |
| Embedding dimension canon | Enforced | `src/lib/knowledge/embedding-config.ts`, `backend/migrations/versions/0012_embedding_dim_alignment.py`, `npm run audit:embedding-dim` |

## Architecture Audit Chain Parity

`docs/architecture/PRAXIS_ARCHITECTURE.md` §19 is the target production audit
chain. The repo now enforces command parity in two ways:

- Implemented local commands must exist in `package.json`.
- Commands that depend on owner credentials, paid cloud state, or unfinished
  production fixtures must be listed in the gated block below.

Local aliases added for the real app include `typecheck`, `test`,
`smoke:tasklet-app`, `audit:ontology-mapping`, `audit:ontology-versions`,
`audit:ontology-classifier-accuracy`, `audit:context-types-parity`, `audit:tool-skill-conforms`,
`audit:tool-canary-executable`, `audit:tool-semantic-canaries`,
`audit:tool-persona-coverage`, `audit:tool-authoring-spike`,
`audit:tool-composition-static`, `audit:tool-suggestion-eval`, `audit:tool-context-isolation`, `audit:firewall-coverage`,
`audit:owner-scoping`, `audit:postgres-schema-current`, `audit:kg-drift`,
`audit:legal-pages-present`, `audit:type-safety`, `audit:docs`,
`audit:model-matrix-coverage`, `audit:runbook-bundle`,
`audit:pack22-verification`, and `audit:gcp-production-posture`.
Session D adds `audit:telemetry-coverage` and `audit:bq-views` so structured
product telemetry and KPI assets are part of the deploy gate.

Pack 22 adds a production verification layer for GCP and Gemini Enterprise
posture. The local aliases are intentionally limited to safe static/read-only
checks. Cost-impacting operations such as HA changes, CMEK/VPC-SC enforcement,
Terraform apply, Cloud Armor mutation, Agent Engine deployment, canary traffic
shifts, and high-intensity load tests remain owner-gated operational work.

<!-- architecture-gated-audits:start -->

- `audit:subagent-deployment-fresh` — needs live Agent Engine deployment metadata.
- `audit:subagent-eval-fresh` — needs committed per-subagent eval runs.
- `audit:bi-temporal-coverage` — needs full Postgres write-path cutover.
- `audit:graph-query-perf` — needs 10k-node Postgres performance fixture.
- `audit:embeddings-v2-coverage` — needs embeddings v2 production corpus cutover.
- `audit:terraform-drift` — needs owner-approved Terraform state and gcloud auth.
- `audit:dead-code` — needs a repo-wide dead-code policy to avoid false positives.
- `audit:test-coverage` — needs coverage floor selection and CI artifact retention.
- `audit:security` — needs dependency/security gate tuning for current accepted debt.
- `lh:ci` — needs Lighthouse CI target deployment and budget config.
- `audit:bundle-budgets` — needs bundle budget thresholds.
- `audit:tool-perf-budgets` — needs per-tool latency fixtures.

<!-- architecture-gated-audits:end -->

## Partially Implemented Target State

| Reference claim | Current state | Next implementation slice |
|---|---|---|
| ADR directory and policy | `docs/adr/README.md` exists; no accepted ADRs yet | Add ADRs only when architecture invariants or layer responsibilities change |
| Postgres + pgvector is production graph source of truth | Schema/repository scaffolding and audits exist; embedding dimension is aligned to `text-embedding-005` at 768d, but live cutover evidence remains open | Production Cloud SQL migration, RLS smoke, traversal endpoints, parity snapshots |
| Multi-agent policy-team workflow | Durable AgentRun spine, worker lanes, Genkit flows, and capsule-bound orchestration contracts exist; fully managed ADK/Agent Engine execution remains owner-gated | Staging worker env, live queue target/auth, policy-team parent workflow smoke |
| Two-phase Firestore/Postgres commit everywhere | Designed and tracked; not complete across all ingestion/tool write paths | Reconciler and crash-injection tests |
| Identity Platform magic-link signup | Login and onboarding surfaces exist; final Identity Platform/magic-link posture is owner-gated | Owner decision, implementation, onboarding e2e |
| Public product help | `/learn`, `/guide`, `/help`, `/pricing`, `/release-notes`, and `/changelog` are present; deeper interactive product help remains inside the signed-in Guide assistant | Keep Guide assistant scoped to explanation and Ask PRAXIS scoped to generation/work |
| Terraform is only infra path | Pack 14 scaffolding and audits exist; Terraform apply remains owner/cloud gated | Terraform plan/apply in staging after gcloud auth and owner sign-off |
| Canary 5/25/100 | Monitor script and log template exist; traffic shift not started | Owner-approved canary execution |

## Known Reference/API Shape Drift

The live app is now centered on:

- public: `/`, `/learn`, `/guide`, `/pricing`, `/release-notes`, `/changelog`
  redirect, `/help` redirect, `/legal/*`, `/login`;
- signed-in: `/app`, `/app/capsules`, `/app/capsules/builder`,
  `/app/conversations/[conversationId]`, `/app/recent-work`, `/app/settings`;
- durable agent workspaces: `/agents/[runId]`.

Retired routes such as `/app/workbench`, `/app/desk`, `/app/research`, and
`/app/graph` remain compatibility redirects into `/app`; new code should not
link to them. The app still exposes a large Next.js API route surface under
`src/app/api`. That is not ignored: `npm run audit:routes` currently counts 61
calibrated AI route files, and route collapse remains a maintenance lane.

## Current Local Gate

Use this local pre-commit slice for architecture-sensitive changes:

```bash
npm run lint
npm run build
npm run audit:gate
npm run smoke:public
```

Then run browser smoke when UI or routes changed:

```bash
npm run smoke:app-usability
npm run smoke:tasklet-app
```

## Update Protocol

When code moves a target-state row to shipped:

1. Update `docs/architecture/PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md`.
2. Update `TODO.md` and the current build ledger.
3. Update the relevant audit if the invariant can be checked statically.
4. Record verification in `docs/audits/`.
