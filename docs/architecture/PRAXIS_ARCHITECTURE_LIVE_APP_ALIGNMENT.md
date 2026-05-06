# PRAXIS Architecture Live-App Alignment

Date: 2026-05-06
Reference: `docs/architecture/PRAXIS_ARCHITECTURE.md`
Repo: `C:\Users\giuli\praxiscodexworking`

This document makes the new architecture bible usable against the real app. It
does not weaken the reference. It separates shipped invariants from target-state
claims so engineers and future agents can safely continue implementation.

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
| Every AI route calibrated | Enforced | `npm run audit:routes` reports 66/66 calibrated AI routes |
| Context health advisory, not blocking | Enforced | `npm run audit:context-vs-tools`, `npm run audit:context-aware-coverage` |
| Marketplace uses ContextProvider foundation | Enforced | `src/app/api/tools/marketplace/run/route.ts`, `npm run audit:tool-marketplace` |
| Sixteen curated marketplace tools | Enforced | `npm run audit:tool-marketplace`, `npm run audit:tool-skills-present` |
| UX loading/empty/error states have local gate | Enforced | `npm run audit:ux-polish` |
| Observability has local trace/logger/health gate | Enforced | `npm run audit:observability-coverage` |
| Graphify stays refreshed | Enforced operationally | `graphify update .` output in Pack 14 audit docs |
| Architecture §19 command chain is accounted | Enforced | `npm run audit:architecture-chain` |

## Architecture Audit Chain Parity

`docs/architecture/PRAXIS_ARCHITECTURE.md` §19 is the target production audit
chain. The repo now enforces command parity in two ways:

- Implemented local commands must exist in `package.json`.
- Commands that depend on owner credentials, paid cloud state, or unfinished
  production fixtures must be listed in the gated block below.

Local aliases added for the real app include `typecheck`, `test`,
`test:e2e:personas`, `audit:ontology-mapping`, `audit:ontology-versions`,
`audit:context-types-parity`, `audit:tool-skill-conforms`,
`audit:tool-context-isolation`, `audit:firewall-coverage`,
`audit:owner-scoping`, `audit:postgres-schema-current`, `audit:kg-drift`,
`audit:legal-pages-present`, `audit:type-safety`, and `audit:docs`.

<!-- architecture-gated-audits:start -->

- `audit:ontology-classifier-accuracy` — needs a labeled classifier eval set.
- `audit:tool-composition-static` — needs static composition graph fixtures.
- `audit:tool-suggestion-eval` — needs recall@3 suggestion eval corpus.
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
| Postgres + pgvector is production graph source of truth | Schema/repository scaffolding and audits exist; live cutover evidence remains open | Production Cloud SQL migration, RLS smoke, traversal endpoints, parity snapshots |
| Four subagents run on Gemini Enterprise / Agent Engine | Deep Research/Agent Engine path exists; Context Preparer, Source Augmenter, Output Refiner, Memo Drafter runtime remains open | Subagent deployment plan, typed input/output schemas, staging smoke |
| Two-phase Firestore/Postgres commit everywhere | Designed and tracked; not complete across all ingestion/tool write paths | Reconciler and crash-injection tests |
| Identity Platform magic-link signup | Login/waitlist surfaces exist; final Identity Platform/magic-link posture is owner-gated | Owner decision, implementation, onboarding wow-flow e2e |
| Public read-only `/demo/syria-2024` | Demo route exists, but exact Syria 2024 public snapshot/watermark launch gate remains open | Demo snapshot, watermark, no-write guard, 30-second comprehension smoke |
| Terraform is only infra path | Pack 14 scaffolding and audits exist; Terraform apply remains owner/cloud gated | Terraform plan/apply in staging after gcloud auth and owner sign-off |
| Canary 5/25/100 | Monitor script and log template exist; traffic shift not started | Owner-approved canary execution |

## Known Reference/API Shape Drift

The architecture bible describes clean product routes such as
`/app/workbench/[caseId]/tools` and backend-style `/v1/cases/...` flows. The
current app still exposes a large Next.js API route surface under `src/app/api`.
That is not ignored: `npm run audit:routes` currently counts 66 calibrated AI
routes, and route collapse remains tracked in
`docs/backlog/2026-05-06-master-charter-completion-todo.md`.

## Current Local Gate

Use this local pre-commit slice for architecture-sensitive changes:

```bash
npm run audit:architecture-reference
npm run audit:architecture-chain
npm run audit:ai-provider-isolation
npm run audit:ai-provider-vertex-default
npm run audit:context-vs-tools
npm run audit:context-aware-coverage
npm run audit:context-types-parity
npm run audit:tool-marketplace
npm run audit:tool-context-isolation
npm run audit:firewall-coverage
npm run audit:owner-scoping
npm run audit:legal-pages-present
npm run audit:ux-polish
npm run audit:observability-coverage
npx tsc --noEmit
npm run build
```

Then run browser smoke when UI or routes changed:

```bash
npm run smoke:app-usability
npx playwright test tests/e2e/landing-smoke.spec.ts tests/e2e/personas
```

## Update Protocol

When code moves a target-state row to shipped:

1. Update `docs/architecture/PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md`.
2. Update `docs/backlog/2026-05-06-master-charter-completion-todo.md`.
3. Update the relevant audit if the invariant can be checked statically.
4. Record verification in `docs/audits/`.
