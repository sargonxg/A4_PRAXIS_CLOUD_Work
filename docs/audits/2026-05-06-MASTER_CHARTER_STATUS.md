# PRAXIS Master Charter Status

Date: 2026-05-06
Repo: `C:\Users\giuli\praxiscodexworking`
Remote: `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`
Production target: `https://praxis.tacitus.me`
Graphify: refreshed during the master-charter pass; `graphify-out/GRAPH_REPORT.md`, `graphify-out/graph.json`, and `graphify-out/graph.html` are maintained as charter support artifacts.

## Executive Finding

The master charter is now preserved in-repo and its high-level support structure is present, but PRAXIS is **Not v1.0.0 complete** under the charter's strict launch contract. The current state is a launch-foundation product on `main`, deployed and smoke-tested locally. The newer architecture self-audit (`docs/audits/2026-05-06-SELF_AUDIT.md`) supersedes the earlier reality-check severity ledger and records open S0/S1 findings around the public demo contract, persona green-streak evidence, canonical entry/legal routes, storage parity, firewall/write coverage, marketplace depth, and production deploy posture. These are now tracked in `docs/backlog/2026-05-06-from-self-audit.md`.

## Charter Index Check

| Item | Status | Evidence |
|---|---|---|
| Master charter preserved | DONE | `docs/codex-prompts/PRAXIS_CODEX_00_MASTER_CHARTER.md` |
| Packs 03-13 preserved | DONE | `docs/codex-prompts/PRAXIS_CODEX_03_*` through `PRAXIS_CODEX_13_*` |
| Pack 14 detected and preserved | DONE | `docs/codex-prompts/PRAXIS_CODEX_14_PRODUCTION_EXCELLENCE.md` |
| Superseded pack 09 final consolidation excluded | DONE | Not part of `audit:codex-prompts`; replaced by Pack 09 Verification & Admin and Pack 11 |
| Top-level onboarding docs present | DONE | `README.md`, `ARCHITECTURE.md`, `CLAUDE.md`, `AGENTS.md`, `DESIGN.md`, `DEPLOYMENT.md`, `SECURITY.md`, `TESTING.md`, `TODO.md`, `CHANGELOG.md` |
| Architecture bible stored | DONE | `docs/architecture/PRAXIS_ARCHITECTURE.md`, `docs/architecture/PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md`, `npm run audit:architecture-reference` |
| Architecture audit chain accounted | DONE | `npm run audit:architecture-chain`; package aliases for shipped checks; gated §19 commands listed in live alignment |
| Dedicated charter audit in gate | DONE | `scripts/audit-master-charter.ts`, `npm run audit:master-charter`, included in `audit:gate` |

## Pack Status Against Reality

| Pack | Charter Status | Current Reality | Notes |
|---|---|---|---|
| 03 Workbench Architecture | DONE foundation | DEGRADED by persona proof gap | Unified Workbench, route/sidebar audit, and local Workbench usability smoke are green. The charter's 10-green CI persona bar is not yet evidenced. |
| 04 Landing & Entry Rebuild | DONE foundation | DEGRADED by canonical route gap | Landing is Workbench-first and Syria is only an example; local smoke verifies anchors, hero visual, static fallback, and DIALECTICA 3D graph. Canonical `/demo/syria-2024`, `/waitlist`, `/login/callback`, and `/legal/*` routes still need alignment. |
| 05 Context vs Tools | DONE foundation | DONE | Context health, firewall, Trust Score persistence, and persona files are present. |
| 06 Ontology System | PARTIAL backend depth | Frontend DONE, backend classifier deferred | Four ontologies are mapped; LangGraph classifier remains v1.1/Pack 14 depth. |
| 07 Graph Visualization | PARTIAL edit depth | Viewer DONE, edit round-trip deferred | Canonical graph tab works; advanced edit UX remains backlog. |
| 08 Tools Marketplace | PARTIAL specialist depth | Registry/UI/foundation execution, handler prompt contracts, artifact history, run telemetry, chaining, and cancel/retry controls DONE; model handlers deferred | 16 curated tools, skills, ContextProvider run route, tolerant artifact persistence, per-tool handler-contract audit, persisted run reload, per-run latency/cost-class telemetry, artifact chaining, and abort/retry UI pass; per-tool model handlers remain v1.1. |
| 09 Verification & Admin | PARTIAL metrics depth | Admin consolidation and scheduler-backed seven-panel diagnostics DONE | Canonical admin route exists; seven panels consume persisted operational snapshots when cron has run; Postgres parity and provider-level cost remain backlog. |
| 10 Postgres KG | PARTIAL production cutover | Schema/repositories DONE, live cutover deferred | Postgres is default in contract; production migration/cutover remains open. |
| 11 Memo Studio & Launch | DONE foundation, launch sign-off pending | Memo Studio DONE; v1.0 tag/signature pending | Server-backed memo versions now exist; owner signature and v1.0 tag are not complete. |
| 12 Context Architecture | DONE TS/runtime foundation, agent orchestration pending | DONE with LangGraph orchestration deferred | Signed conversation context and runtime ContextProvider are present. |
| 13 Tool-Context Interop | DONE contract foundation, subagent runtime pending | DONE with runtime orchestration deferred | Contract v2, skills, projection, and suggestions are live. |
| Pack 14 Production Excellence | PARTIAL local production-excellence foundation | Gemini Enterprise/Vertex posture, model matrix, shared embedding provider, backend model constants, provider audits, UX/observability audits, load-test scaffold, capacity plan, canary monitor, canary log template, and orchestration playbook DONE; production infra deferred | Requires owner decisions on final region/cost, Terraform/canary execution, public demo, and signup posture. |

## Open S0/S1 From Self-Audit

The older `docs/audits/2026-05-06-REALITY_CHECK.md` records no open S0/S1 launch blockers, but the newer architecture self-audit is stricter and currently has open S0/S1 findings. Treat `docs/audits/2026-05-06-SELF_AUDIT.md` and `docs/backlog/2026-05-06-from-self-audit.md` as the active blocker ledger until those findings are closed and re-audited.

## Latest Usability Smoke

`docs/audits/2026-05-06-USABILITY_SMOKE.md` records the current local browser
evidence: landing smoke passed, app-usability smoke passed, and all four
persona flows passed against `http://localhost:3107`.

## Remaining Work

- Run and maintain the four persona suites until the charter's 10-green-run bar is genuinely satisfied in CI.
- Close the S0/S1 self-audit items before any v1.0.0 readiness claim.
- Complete Postgres KG production cutover and migration verification.
- Implement specialist model-backed marketplace handlers for all 16 tools on top of the audited per-tool prompt contracts.
- Enrich scheduler-backed diagnostics with Postgres parity, provider-level cost, and streaming firewall event distributions.
- Implement LangGraph subagent orchestration/telemetry for Context Preparer, Source Augmenter, Output Refiner, and Memo Drafter.
- Continue Pack 14 after the local provider/posture pass: Terraform-managed infrastructure, managed Agent Platform Runtime deployment, public read-only demo, waitlist/magic-link posture, observability, load testing, cost dashboard, and canary deploy.
- Obtain owner production-readiness signature, complete staging/production signed smoke records, and only then tag `v1.0.0`.
