# PRAXIS Phase 1-3 Spec Audit

**Date:** 2026-05-06  
**Audited base commit:** `5da77c2`
**Audit hardening commit:** `08b6b1c`
**Production build:** `58275fce-bcfe-48f6-861a-753bf8be05a4`
**Specs audited:**  
- `C:\Users\giuli\Downloads\PRAXIS_PHASE_1_FOUNDATION.md`
- `C:\Users\giuli\Downloads\PRAXIS_PHASE_2_AGENTIC_SPINE.md`
- `C:\Users\giuli\Downloads\PRAXIS_PHASE_3_PRODUCT_SURFACE.md`
- Repository mirrors under `docs/phases/`

## Summary

The three phases are reflected on `main` as shipped checkpoints and `praxis.tacitus.me` is live, but the literal phase specs are more ambitious than the current implementation. Phase 1 is mostly infrastructure-complete with a documentation-tree exception; the previous weak Neo4j sync story now has a coded drift verifier, cron route, and scheduler artifact. Phase 2 has the DIALECTICA recipe layer, calibrated route wrapper, shared firewall wrapper, and claim Trust Score persistence for inspectable JSON AI outputs; full LangGraph runtime enforcement, token-level streaming annotation, and the literal 20-verb route collapse are still separate product work. Phase 3 has the visible workbench product shell and several functional surfaces, with persona Playwright coverage for the unified workbench.

This document is the active backlog for the remaining work. Do not delete it when adding fixes; update the tables and evidence.

## Production Reflection

The audit hardening patch is pushed to GitHub `main` and deployed to `praxis.tacitus.me`.

| Surface | Current value |
|---|---|
| GitHub repository | `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work` |
| Main commit carrying the audit fixes | `08b6b1c` |
| Cloud Build | `58275fce-bcfe-48f6-861a-753bf8be05a4` |
| Frontend revision | `praxis-frontend-00232-9gf` |
| Backend revision | `praxis-backend-00103-zmq` |
| Worker revision | `gdelt-poller-00005-xg2` |
| Public URL | `https://praxis.tacitus.me` |

## Document Drift

| Item | Finding | Impact |
|---|---|---|
| Phase 1 download vs repo copy | Not byte-identical. Repo copy changes Cloud SQL instance references from the spec's placeholder `praxis-pg` to the actual `praxisbytacitus-instance`. | Acceptable and useful; repo doc reflects the cost-aware production decision. |
| Phase 2 download vs repo copy | No semantic diff found in the audited first-pass diff. | No action. |
| Phase 3 download vs repo copy | No semantic diff found in the audited first-pass diff. | No action. |
| Checkboxes in phase docs | All three phase specs still contain open checklist boxes; they are execution specs, not completion records. | Completion evidence must live here and in `docs/PRAXIS_ARCHITECTURE_AND_AGENT_HANDOFF_2026-05-06.md`. |

## Phase Audit Table

| Phase | Spec promise | Implemented on main | Status | Evidence | Follow-up |
|---|---|---|---|---|---|
| Phase 1 | Collapse docs to 12 canonical docs and archive the rest. | The old `docs/_archive` tree was removed from the active repository during the 2026-05-08 repo-shape cleanup; current source prompts, ADRs, runbooks, skills, and retained audits remain active. | Improved | `docs/audits/2026-05-08-REPO_PURPOSE_AUDIT/summary.md`; `docs/audits/2026-05-08-CLEANUP_RETAINED_EVIDENCE.md`. | Continue reducing active docs by consolidating source prompts and dated audit ledgers into current docs. |
| Phase 1 | Cloud SQL Postgres with pgvector, pg_trgm, pgcrypto, RLS, PgBouncer. | Cloud SQL resources exist and GCP audit passes. Schema/RLS verification is not fully encoded in an automated production check. | Mostly complete | `npm run audit:gcp` passes. | Add a non-interactive SQL extension/RLS smoke script using Secret Manager/IAM. |
| Phase 1 | Neo4j Aura and one-way sync from Firestore graph to Neo4j. | Neo4j secret exists and a real drift verifier now compares Firestore `graph/main` samples to Neo4j counts by situation when production credentials are configured. | Improved | `src/lib/graph/neo4j-drift-verifier.ts`; `scripts/verify-neo4j-sync.ts`; `/api/cron/verify-neo4j-sync`; `infrastructure/scheduler/neo4j-drift-verifier-cron.yaml`; `npm run verify:neo4j-sync`. | Deploy the Cloud Scheduler job and add Cloud Monitoring alerting on drift response code 409. |
| Phase 1 | Bi-temporal graph fields on every node/edge. | Canonical graph helpers include bi-temporal concepts; enforcement for every write path is not proven. | Partial | Code references exist in graph modules. | Add tests that fail graph writes missing `validFrom`, `validTo`, `assertedFrom`, `assertedTo`. |
| Phase 1 | Remove Anthropic, Firecrawl, Tavily, Parallel, Falkor, Spanner from code. | Source/backend scan only found the forbidden terms inside the Cloud Build guard itself. | Complete | `rg` over `src`, `backend`, scripts, package and cloudbuild found no live provider use. | Keep Cloud Build forbidden-provider guard. |
| Phase 1 | Calibration and spine audits wired into CI. | Cloud Build contains route/provider guardrails; local audits pass. The original spine audit was superseded by active gate scripts and removed from the active tree. | Complete | `npm run audit:routes`; `npm run audit:gate`; retained evidence in `docs/audits/2026-05-08-CLEANUP_RETAINED_EVIDENCE.md`. | Keep route/spine coverage mandatory through the active audit gate. |
| Phase 2 | Five LangGraph flows checkpointed to Cloud SQL. | Five flows are registered and checkpointer scaffolding exists; some flows are placeholders or not fully runtime-backed. | Partial | `backend/agents/registry.py`; `backend/agents/checkpointer.py`. | Replace placeholder flows with real LangGraph graphs and assert Cloud SQL checkpoint writes. |
| Phase 2 | Symbolic firewall enforced on every streaming AI route. | Every calibrated AI route now passes through the shared firewall boundary. JSON responses receive claim extraction, verification metadata, Trust Score persistence, and `X-Praxis-Firewall-*` headers; streams are marked at the route boundary but not token-annotated. | Improved | `src/lib/api/with-calibration.ts`; `src/lib/api/with-firewall.ts`; `tests/unit/lib/api/with-firewall.test.ts`; `npm run audit:context-vs-tools`. | Add token-level SSE transform for inline claim chips before claiming full streaming annotation. |
| Phase 2 | Five DIALECTICA Cypher recipes. | Implemented and routed. | Complete | Backend recipe tests passed in Phase 2; `/api/ai/dialectica` exists and is calibrated/auth-gated. | Add authenticated production recipe smoke with a test account. |
| Phase 2 | Context loader is the single entry point for AI verbs. | `withCalibration` wraps all non-exempt AI routes, but not every route is collapsed into a single verb client. | Mostly complete | `npm run audit:routes` reports 66 calibrated AI route files, 5 exempt. | Keep `withCalibration`; separately finish the 20-verb client contraction. |
| Phase 2 | 62 AI routes collapse to 20 verbs; legacy routes return 410. | Not implemented literally. Current route count is 66 calibrated AI route files. | Not complete | `npm run audit:routes` output. | Build `/api/ai/{verb}` facade, migrate UI clients, then sunset legacy routes with 410 headers. |
| Phase 2 | Trust Score persisted for every claim. | Claim-like fields emitted by calibrated JSON AI routes now persist deterministic Trust Score records under each situation. | Improved | `src/lib/firebase/claims-service.ts`; Firestore `claims` collection-group indexes; `tests/unit/lib/firebase/claims-service.test.ts`; firewall integration test. | Extend Boardroom/Draft streaming outputs to emit inspectable claim events so token-level flows persist the same record shape. |
| Phase 3 | Sidebar collapses to 8 surfaces and legacy pages remain routable/archive. | Implemented. | Complete | `src/lib/navigation/product-surfaces.ts`; sidebar archive switch; build route manifest includes legacy routes. | Add browser-authenticated assertion that sidebar shows exactly 8 entries by default. |
| Phase 3 | Library separates sources from work products in URL/data model. | Routes, Firestore services, rules, indexes, and migration script exist. UI remains partially composed from legacy Library page. | Mostly complete | `/app/library/sources`, `/app/library/work-products`, `sources-service`, `work-products-service`. | Finish source detail view, source upload to `sources/`, and legacy alias sync. |
| Phase 3 | Draft is Tiptap with paragraph provenance, Trust Score, diff, JSON-LD manifest on every export. | Tiptap Draft and manifest preview exist. Export embedding and paragraph-level persistent Firestore provenance are not complete. | Partial | `src/components/editor/work-product-editor.tsx`; `json-ld-prov.ts`. | Extend DOCX/PDF/Markdown exporters and persist provenance maps per paragraph. |
| Phase 3 | Boardroom UI over Phase 2 LangGraph with SSE, replay, Open in Draft. | Visible room and replay endpoint exist; live LangGraph SSE and real checkpoint replay are not complete. | Partial | `/app/boardroom`; `deliberation-room.tsx`; replay route. | Connect to actual backend Boardroom flow, stream turns, and create persisted work products. |
| Phase 3 | Read-only Cypher console and saved queries. | Validator/API/UI exist and are now auth-gated; real Neo4j execution and saved query persistence are not complete. | Partial | `cypher.ts`, `/api/graph/cypher`, `cypher-console.tsx`. | Execute tenant-scoped read-only Neo4j queries and persist saved queries to Firestore/Postgres. |
| Phase 3 | What-changed diff engine and streaming graph updates. | Pure diff engine, Desk panel, and SSE route exist; backend graph mutation feed is stubbed. | Partial | `diff-engine.ts`; `/api/graph/changes`; `/api/graph/staging-stream`. | Connect to graph proposal writes and source update timestamps. |
| Phase 3 | AI Act ack and cost cap UI/enforcement. | AI Act routes exist; cost-cap API/UI existed. This audit pass added auth to graph/cost APIs and a 402 cost-cap path in `with-credits`. | Improved, still partial | `with-ai-act-ack.ts`; `with-credits.ts`; cost-cap route. | Add UI modal header flow and tests proving authenticated high-risk calls return 428 without ack and 200 with ack. |

## Red Flags Fixed In This Audit Pass

| Red flag | Fix |
|---|---|
| `/api/graph/cypher`, `/api/graph/changes`, and `/api/graph/staging-stream` were reachable without explicit route-level auth. | Wrapped them in `withAuth`; Cypher now binds `tenantId` to the authenticated user id. |
| `/api/situations/[id]/cost-cap` was unauthenticated and returned fixture numbers. | Wrapped GET/PATCH in `withAuth` and read/write owner-scoped Firestore fields. |
| Phase 3 cost cap had UI/API but no rejection path in the credit gate. | Added situation-level monthly cap check to `checkAndDeductCreditsForUid`; exceeded caps now return `402 Cost cap reached`. |

## Current Red Flags Still Open

| Severity | Area | Issue | Why it matters | Next action |
|---|---|---|---|---|
| High | Phase 2 route model | The app still has 66 calibrated AI route files, not 20 verbs with 410 legacy sunsets. | Spec mismatch and long-term maintenance drag. | Build verb facade and migrate UI surfaces route by route. |
| High | Symbolic firewall | Token-level streaming annotation is not implemented, although route-level firewall wrapping is now mandatory. | Trust promise can be overstated if copy implies every streamed token is graph-verified inline. | Build an SSE transform that emits `firewall.claim.verified`/`firewall.claim.warn` events before rendering claim chips. |
| Medium | Neo4j sync | Drift verification is coded and scheduled as infrastructure, but production scheduler deployment and Cloud Monitoring alert wiring still need deployment confirmation. | Operators need alerting, not only a callable verifier. | Deploy `praxis-neo4j-drift-verifier` and alert on HTTP 409 / repeated unconfigured reports. |
| High | Draft export provenance | JSON-LD manifest is previewed but not embedded in every export. | Core trust/provenance pitch is incomplete for shipped documents. | Extend `src/lib/services/export-engine.ts` and DOCX/PDF/Markdown export APIs. |
| Medium | Boardroom | UI is visible but not a full LangGraph/SSE room. | Product demo can show the surface, but not the promised live deliberation. | Wire backend flow events to SSE and checkpoint replay. |
| Medium | Library | Split routes exist but source upload/detail workflow is not fully migrated. | Analysts may still land in legacy document behavior. | Make `sources/` canonical and keep `documents/` as one-release alias. |
| Medium | Docs phase checkboxes | Phase docs still show open checklist items. | Future agents can confuse the execution spec with current state. | Keep this audit as state ledger; optionally convert phase docs to historical specs. |
| Low | Lint warnings | Lint has zero errors but hundreds of warnings. | Noise hides new warnings. | Gradually ratchet warning budget by directory. |

## Verification Run During Audit

| Command | Result |
|---|---|
| `git rev-parse HEAD` vs `origin/main` | Both `5da77c2` before this audit pass; audit fixes pushed as `08b6b1c`. |
| `npm run audit:routes` | Passed: 66 calibrated AI route files, 5 exempt. |
| Forbidden provider scan in source/backend | Only matched Cloud Build's guard pattern. |
| `rg "MemorySaver|InMemorySaver" backend/agents --type py` | No live matches. |
| `npm run audit:gcp` | Passed after the audit fixes: 0 hard failures, 0 soft warnings. |
| `npx tsc --noEmit` after audit fixes | Passed after installing dependencies in the shipping worktree. |
| Targeted Vitest after audit fixes | Passed: 3 files, 7 tests. |
| Full Vitest after audit fixes | Passed: 114 files, 502 tests. |
| `npm run lint` | Passed with 0 errors and 238 existing warnings. |
| `npm run build` | Passed; generated 255 static pages. |
| `npm run verify:neo4j-sync` | Passed in example-contract mode: Syria and Nordalia snapshots matched exactly. |
| `npx vitest run tests/unit/lib/api/with-firewall.test.ts tests/unit/lib/firebase/claims-service.test.ts tests/unit/lib/graph/neo4j-drift-verifier.test.ts` | Passed: 3 files, 12 tests. |
| `PLAYWRIGHT_BASE_URL=http://localhost:3011 npx playwright test tests/e2e/landing.spec.ts` | Passed: 2 tests. |
| `PLAYWRIGHT_BASE_URL=http://localhost:3011 npx playwright test tests/e2e/personas` | Passed: 4 persona flows. |
| `docs/audits/2026-05-08-CLEANUP_RETAINED_EVIDENCE.md` | Historical phase audit markers retained after removing old generated archive files from the active tree. |
| Cloud Build deploy | Passed: `58275fce-bcfe-48f6-861a-753bf8be05a4`. |
| `https://praxis.tacitus.me/` | HTTP 200; landing contains `Eight surfaces` and `PRAXIS`. |
| `https://praxis.tacitus.me/api/health` | HTTP 200; `status: ok`, Firestore ok, AI provider ok, cookie secret ok, Vertex ADK ok. |
| Unauthenticated `/api/graph/cypher` POST | HTTP 401 as expected after auth hardening. |
| Production Playwright smoke | Passed: 5 tests against `https://praxis.tacitus.me`. |

## Next Iteration Order

1. Finish production-authenticated smoke coverage for `/app/desk`, `/app/graph`, `/app/draft`, and `/app/boardroom`.
2. Deploy the Neo4j drift scheduler and add Cloud Monitoring alerting.
3. Make Draft export provenance real in DOCX/PDF/Markdown output.
4. Wire Boardroom SSE to backend flow events and persist replay checkpoints.
5. Build the 20-verb facade and migrate the eight surfaces to typed clients.
6. Replace static Desk cost panel data with live `/api/situations/[id]/cost-cap` reads.
