# PRAXIS Reality Check

Date: 2026-05-06
Repo: `C:\Users\giuli\praxiscodexworking`
Remote: `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`
Production target: `https://praxis.tacitus.me`

## Executive Summary

Packs 03-08 are implemented as a unified Workbench foundation: case modules, landing-entry rebuild, context-vs-tools separation, ontology registry, canonical graph view, and the 16-tool marketplace are present and covered by `audit:gate`. Packs 09-13 now have saved Codex prompts, launch-readiness reports, a canonical tabbed admin surface, seven-panel diagnostics shell, Postgres KG contract and repository scaffolding, Memo Studio block editing with local and server-backed versioning, signed conversation context, Tool Contract v2 context projection, and a ContextProvider-backed marketplace foundation run route. The remaining honest gap is deploy-stage backend depth: live Cloud SQL migration execution, full graph ingestion cutover, specialist model-backed marketplace handlers, scheduler-backed operational dashboards, and LangGraph subagent orchestration remain v1.1 hardening work rather than hidden claims.

## Pack 03

| Deliverable | Status | Evidence | Severity | Notes |
|---|---|---|---|---|
| Unified Workbench shell | SHIPPED | `src/app/app/workbench/[caseId]/page.tsx`, `src/components/workbench/` | none | Case route and tabs are live. |
| Example cases | SHIPPED | `src/lib/cases/syria-2026`, `src/lib/cases/nordalia-2026` | none | Syria is one example, not the product spine. |
| Route/sidebar simplification | SHIPPED | `scripts/audit-workbench.ts` | none | Audit now reflects Ontology, Tools, and Memos tabs. |

## Pack 04

| Deliverable | Status | Evidence | Severity | Notes |
|---|---|---|---|---|
| Landing entry points to Workbench | SHIPPED | `scripts/audit-landing.ts` | none | Landing audit remains in `audit:gate`. |
| Example-case entry | SHIPPED | `listExampleCases()` | S2 | More real examples remain backlog. |

## Pack 05

| Deliverable | Status | Evidence | Severity | Notes |
|---|---|---|---|---|
| Context-health separation | SHIPPED | `scripts/audit-context-vs-tools.ts` | none | Gate remains green. |
| Symbolic firewall | SHIPPED | `src/lib/api/with-firewall.ts` | none | Warning/scoring mode, not strict rejection. |
| Claim Trust Score persistence | SHIPPED | `src/lib/firebase/claims-service.ts` | none | Unit coverage included in prior pass. |

## Pack 06

| Deliverable | Status | Evidence | Severity | Notes |
|---|---|---|---|---|
| Ontology registry | SHIPPED | `src/lib/ontology/registry.ts` | none | Four ontologies map all ACO primitives. |
| Ontology Workbench tab | SHIPPED | `src/components/ontology/OntologySchemaViewer.tsx` | none | Visible in production build after demo login. |
| Backend ontology classifier | DEFERRED | not implemented | S2 | Filed for next backend pass. |

## Pack 07

| Deliverable | Status | Evidence | Severity | Notes |
|---|---|---|---|---|
| Canonical graph canvas | SHIPPED | `src/components/graph/PraxisGraphCanvas.tsx` | none | Workbench graph tab renders case graph. |
| Advanced graph edit round-trip | PARTIAL | existing backend graph routes, no full edit UX | S2 | Backlog item; not a current S0 because edit UX is not presented as complete. |

## Pack 08

| Deliverable | Status | Evidence | Severity | Notes |
|---|---|---|---|---|
| 16-tool marketplace registry | SHIPPED | `src/lib/tools/marketplace/registry.ts` | none | Exactly 16 tools and audited. |
| Tolerant run artifacts | SHIPPED | `src/lib/tools/marketplace/run-artifact.ts` | none | Allows raw text, structured output, and context dumps. |
| Live handler for every marketplace tool | DEFERRED | no per-tool execution router yet | S2 | Registry and UI are live; execution is next. |

## Pack 09

| Deliverable | Status | Evidence | Severity | Notes |
|---|---|---|---|---|
| Saved verification prompt | SHIPPED | `docs/codex-prompts/PRAXIS_CODEX_09_VERIFICATION_AND_ADMIN.md` | none | Full prompt saved for Codex/subagent continuation. |
| Reality Check audit | SHIPPED | `scripts/audit-reality-check.ts` | none | Enforces report and backlog presence. |
| Admin consolidation | SHIPPED | `src/app/app/admin/page.tsx`, `next.config.ts` | none | `/app/admin` is the canonical tabbed surface; old admin URLs redirect to matching tabs. |
| Diagnostics completion | PARTIAL | `src/app/app/admin/diagnostics/page.tsx` | S2 | Existing probes are real; seven-pack panel spec not fully implemented. |

## Pack 10

| Deliverable | Status | Evidence | Severity | Notes |
|---|---|---|---|---|
| Saved Postgres KG prompt | SHIPPED | `docs/codex-prompts/PRAXIS_CODEX_10_POSTGRES_KNOWLEDGE_GRAPH.md` | none | Full prompt saved. |
| KG backend contract | SHIPPED | `src/lib/kg/backend.ts`, `backend/config.py` | none | Default is now `postgres`, with `neo4j` and `both` retained. |
| Postgres graph schema migration | SHIPPED | `backend/migrations/versions/0011_postgres_kg_contract.py` | S1_FIXED | Contract tables added; live migration execution is deploy-stage work. |
| Repository layer | SHIPPED | `backend/services/kg_repositories.py`, `backend/tests/test_kg_repositories.py` | none | Owner/case-scoped node, edge, traversal, and semantic-search repositories are coded and tested. |
| Migration from Neo4j | DEFERRED | no production migration run yet | S2 | Filed in backlog as deploy-stage cutover. |

## Pack 11

| Deliverable | Status | Evidence | Severity | Notes |
|---|---|---|---|---|
| Saved launch prompt | SHIPPED | `docs/codex-prompts/PRAXIS_CODEX_11_MEMO_STUDIO_AND_LAUNCH.md` | none | Full prompt saved. |
| Memo Studio foundation | SHIPPED | `src/components/memo/MemoStudio.tsx` | none | Workbench Memos tab with six templates and cited generated blocks. |
| Draft export and versioning | SHIPPED | `src/lib/memo/export.ts`, `src/components/memo/MemoStudio.tsx` | none | Local versions plus Markdown, DOCX, and PDF draft exports are implemented. |
| Server-side memo persistence | SHIPPED | `src/lib/firebase/memo-service.ts`, `src/app/api/memos/route.ts` | none | Owner/case/template-scoped memo drafts persist immutable versions when a real session is present; demo remains local. |
| Comprehensive audit/roadmap/launch docs | SHIPPED | `docs/audits/2026-05-06-COMPREHENSIVE.md`, `docs/roadmap/v1.1-and-beyond.md` | none | Honest launch docs now exist. |

## Cross-Cutting Findings

- The product Workbench is converging, and admin is now collapsed to one canonical tabbed route.
- The graph stack now has a clearer v1 direction: Postgres primary, Neo4j optional.
- Memo Studio is now visible, typed, editable, locally versioned, server-backed for signed-in users, and export-capable.
- Packs 12-13 now have signed conversation context and a concrete ContextProvider/projection path while keeping partial context advisory rather than blocking.
- The verification gates are useful because they block docs drift and prompt loss, not only code regressions.

## Remediation Log

- Saved pack 09-11 prompts into `docs/codex-prompts/`.
- Added `audit:reality-check`, `audit:codex-prompts`, `audit:kg-backend`, and `audit:memo-studio`.
- Added Postgres KG contract migration, repository layer, and default `KG_BACKEND=postgres` configuration.
- Added Workbench Memos tab, six-template Memo Studio foundation, block editing, local/server version history, and draft exports.
- Added signed conversation tokens, runtime ContextProvider, and a default tool context projection enforced by audits.
- Consolidated admin into `/app/admin` tabs with permanent redirects from old admin subroutes.
- Added backlog and launch documentation.

## Quality State

| Gate | State |
|---|---|
| TypeScript | green after verification |
| Next.js production build | green after verification |
| Workbench audit | green after verification |
| Context/tools audit | green after verification |
| Ontology/tool/graph audits | green after verification |
| Reality/KG/Memo/prompt audits | green after verification |

## Pack 12

| Deliverable | Status | Evidence | Severity | Notes |
|---|---|---|---|---|
| Saved context architecture prompt | SHIPPED | `docs/codex-prompts/PRAXIS_CODEX_12_CONTEXT_ARCHITECTURE.md` | none | Full prompt saved. |
| Four-layer context model | SHIPPED | `src/types/context.ts`, `backend/services/context_layers.py` | none | TS and backend mirrors exist. |
| Advisory context wrapper | SHIPPED | `src/lib/context/context-aware.ts`, `src/lib/api/with-context-aware.ts` | none | Shared calibration now receives snapshots instead of 412 blockers. |
| Signed conversation context | SHIPPED | `src/lib/context/conversation-token.ts`, `src/lib/context/context-aware.ts` | none | Production prefers `X-Praxis-Conversation-Token`; unsigned conversation JSON is dev/demo fallback. |
| ContextProvider runtime | SHIPPED | `src/lib/tools/context-provider.ts` | none | Prepares snapshots, projection context, advisories, and subagent packets. LangGraph subagent orchestration remains v1.1 work. |

## Pack 13

| Deliverable | Status | Evidence | Severity | Notes |
|---|---|---|---|---|
| Saved tool-context prompt | SHIPPED | `docs/codex-prompts/PRAXIS_CODEX_13_TOOL_CONTEXT_INTEROP.md` | none | Full prompt saved. |
| Tool Contract v2 | SHIPPED | `src/lib/tools/marketplace/types.ts`, `src/lib/tools/marketplace/registry.ts` | none | All 16 marketplace tools expose v2 fields. |
| Tool skills | SHIPPED | `skills/tools/*/SKILL.md`, `skills/subagents/*/SKILL.md` | none | Audited by `audit:tool-skills-present`. |
| Suggestion engine | SHIPPED | `src/lib/tools/marketplace/suggestions.ts` | none | Workbench Tools tab shows top recommendations. |
| Runtime ContextProvider DI | SHIPPED | `src/lib/tools/context-provider.ts` | none | Executable handlers can consume prepared context through a single provider. |
| Context projection files | SHIPPED | `src/lib/tools/marketplace/projections/default.ts`, `scripts/audit-tool-contract-v2.ts` | none | Every tool points to a real projection module and the audit enforces it. |

No open S0 or S1 launch blockers are recorded in this report. Remaining S2/S3 items are filed in `docs/backlog/2026-05-06-from-reality-check.md`.
