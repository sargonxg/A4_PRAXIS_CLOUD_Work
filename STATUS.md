# PRAXIS Codex Night Pack - STATUS

> Morning brief for the 2026-05-08 night-pack pass. This file is intentionally candid: the session resumed with marketplace, calibration, and Cognee honesty changes already present in the dirty tree, so the clean diagnostic baseline requested by `01_DIAGNOSTICS` is not available from this checkpoint.

## Morning Brief

- Prompts completed: `01_DIAGNOSTICS`, `02_MARKETPLACE_HONESTY`, `03_CALIBRATION_INVARIANT`, `04_COGNEE_UI_HONESTY`, `05_CHAPTER_CODE_SPLIT`, `06_LIBRARY_INGEST_CONSOLIDATION` static implementation, `07_ONBOARDING_GATE`, `08_THIN_CASE_CALIBRATION`, `10_ACO_EXPLAINER`, `11_AUDIT_PROMOTION`, `12_HYGIENE` low-risk items, `13_ITERATE_LOOP`, `STATUS_TEMPLATE`, `V2_00_README`, `V2_A0_MT_DATA_MODEL`, `V2_B0_KG_PREFLIGHT` local attempt.
- Prompts deferred: Cloud SQL live row counts from `01` and `V2_B0_KG_PREFLIGHT` are blocked locally by private IP plus missing local `psql`/Cloud SQL Proxy; `V2_A1_ORGID_CONTEXT` through `V2_A6_MT_AUDIT_LOG` are blocked until all MT approval rows below are marked approved or explicitly revised; `V2_B1_DUAL_WRITE_GRAPH` through `V2_B3_RETIRE_FIRESTORE_GRAPH` are blocked until B0 live counts select and approve Case 1/2/3, B1 runs clean for 7 days, and B2 runs clean for 7 days; `V2_C0_COGNEE_LIVE` and `V2_C1_MEMORY_RECALL_IN_CALIBRATION` are blocked because `praxis-cognee` is not deployed in Cloud Run.
- Recovery loop resolved: `audit:ux-polish`, `audit:workbench`, `audit:evidence-drawer`, `audit:graph-viewer`, `audit:visualization`, `audit:master-charter`, stale Graphify outputs, and withCalibration unit fixture drift.
- Measured deltas:
  - Workbench root JS gzipped: current built workbench initial client JS is `511.3 KB gzip`, guarded by `audit:workbench-bundle` at `520 KB`.
  - Tools chapter density: live demo DOM count is 54 interactive controls after opening the closed Recipe library.
  - Prompt-health: thin synthetic case `72/red`, rich Syria demo `94/yellow`, prompt block delta `+2179` bytes for rich.
- Next-session priorities: run B0 KG preflight from a VPC-connected shell, deploy or provision `praxis-cognee` before C0, GC approval of the five MT decisions, then `A1_ORGID_CONTEXT.md`; runtime document ingest parity and production workbench smoke remain carried follow-ups.
- Blockers requiring GC: none for the low-risk code changes here; production deployment/commit approval remains separate.

---

## Session Metadata

- Started: 2026-05-08T00:27:51-04:00 checkpoint.
- Branch: `main`
- Last commit at start: `46d8cf1`
- Last commit at end: current `main` HEAD after this status-template pass.
- Total commits this session: `17` including the V2 README pass.
- Remote: `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`

## Tasks

| File | Status | Notes |
|---|---|---|
| 01_DIAGNOSTICS | done | Gate attempted and stopped at `audit:ux-polish`; Cloud SQL instance discovered but live counts blocked by missing local `psql`/Cloud SQL Proxy and private IP; bundle, DOM density, prompt-health, Cognee copy, marketplace strings, and surface registry measured. |
| 02_MARKETPLACE_HONESTY | done | Tools chapter is a Recipe library; 53 non-SAT recipes stage hero-tool context; deterministic foundation strings are redacted from UI; stage-target coverage and UI-copy audits are wired. |
| 03_CALIBRATION_INVARIANT | done | All 55 registry tools are tiered (`46` calibrated AI, `9` deterministic structural); deterministic structural tools are labeled; calibrated AI hero routes are audited for `withCalibration`; negative flip test catches `context-builder`; docs updated. |
| 04_COGNEE_UI_HONESTY | done | `/api/health/features` exposes server-derived flags with reasons; Cognee/memory UI copy is gated or neutralized; user-facing memory panel/client removed; Agent Engine subagent labels are hidden unless `VERTEX_AGENT_ENGINE_ID` is set; legacy Cognee audits now enforce the boundary instead of requiring deleted UI. |
| 05_CHAPTER_CODE_SPLIT | done | Six heavy chapters and four substrate tabs are dynamic islands with skeletons; shell/tab modal only mount active children; `audit:workbench-bundle` is wired into gate and now enforces dynamic imports, closed Tools-by-default, skeleton presence, and conditional mounting. |
| 06_LIBRARY_INGEST_CONSOLIDATION | partial | Upload UI now saves and chunks through `/api/documents/upload`, passes the returned `documentId` into backend Library ingest, and reports source-receipt deferral honestly. Static parity audit and ingest parity doc added. Runtime upload -> source receipt -> hero-tool retrieval verification still not run. |
| 07_ONBOARDING_GATE | done | Shared onboarding helper gates calibrated routes, client auth state, and server cookie onboarding resolution; post-login redirect and Next proxy route incomplete/stale-claim profiles to `/onboarding`; completion refreshes signed session claim; workbench banner and profile edit link are wired; audit expanded. |
| 08_THIN_CASE_CALIBRATION | done | `/api/context/prompt-health` exposes prompt health; calibrated routes append `<context-quality>` below 80 and refuse below 30 unless `forceRun` is true; prompt-health badge and run-anyway help panel are wired into shared AI generation UI and the direct Executive Intelligence panel; `audit:thin-case-handling` is in gate. |
| 09_EMBEDDING_DIMENSION | done | Canonical constants added for `text-embedding-005` at 768d; Firestore vector writes stamp model/dimension; Postgres migration `0012_embedding_dim_alignment.py` supersedes legacy `vector(1536)`; `EmbeddingRepo` validates query vector length; `audit:embedding-dim` now checks config, model matrix, migration, Cognee guard, and repo validation. Live migration remains gated by `SELECT count(*) FROM graph_embeddings`. |
| 10_ACO_EXPLAINER | done | Added the 14-entity ACO copy source of truth, first-case overlay with localStorage dismissal, permanent Ontology-tab reference button, onboarding mention, and `audit:aco-parity` in `audit:gate`. |
| 11_AUDIT_PROMOTION | done | Audit pass messages now carry tier labels, runtime-proof variants exist for KG drift, Cognee, owner scoping, and tool-context isolation, `audit:gate-with-cloud` and `audit:gate-runtime-full` are wired, runtime audits skip without opt-ins, and `docs/audits/README.md` documents the taxonomy. |
| 12_HYGIENE | done | `background_jobs` global reads now admin-only; surface registry coherence audit includes tabs, chapters, and visible hero tools; deleted memory UI files stayed deleted; forbidden legacy model string grep returned 0; committed-secret grep found no leaks beyond env/config references; lint baseline recorded at `98` problems before this cleanup. |
| 13_ITERATE_LOOP | done | Recovery loop applied until `audit:gate` passed; fixed UX smoke markers, redirect-only visible route counting, evidence drawer immediate-run markers, lazy graph audit expectations, stale Graphify output, and withCalibration unit fixtures. |
| STATUS_TEMPLATE | done | Root `STATUS.md` now conforms to the template contract with morning brief, metadata, baselines, pre-existing audit failures, per-prompt notes, blockers, and next-session notes. |
| V2_00_README | done | Preserved the PRAXIS V2 institutional-foundations README under `docs/codex-prompts/`; audited the precondition as green; next executable prompt is Session A `A0_MT_DATA_MODEL.md`. |
| V2_A0_MT_DATA_MODEL | done | Created `docs/architecture/MULTI_TENANT_MODEL.md`, recorded current single-user state, preserved A0-A3 prompts, and added the required MT approval gate. |
| V2_A1_ORGID_CONTEXT | blocked | Must not start until MT-1 through MT-5 are approved or explicitly revised by GC. |
| V2_A2_COLLABORATORS_SCHEMA | blocked | Depends on A1 and the MT approval gate. |
| V2_A3_FIRESTORE_RULES | blocked | Depends on A1, A2, migration confirmation, and security tests; no rules changes made in A0. |
| V2_A4_TEAM_INVITE_FLOW | blocked | Depends on A1 org context, A3 invitation rules, and invite token secret/email deploy decisions. |
| V2_A5_ROLE_PILLS_AND_GUARDS | blocked | Depends on A2 effective-role helpers and A3 server/rules enforcement. |
| V2_A6_MT_AUDIT_LOG | blocked | Depends on A1 org context, A3 audit-log rules, and state-changing route mapping. |
| V2_B0_KG_PREFLIGHT | blocked | Local preflight documented at `docs/audits/2026-05-08-POSTGRES_KG_PREFLIGHT.md`; Cloud SQL instance is private-IP and local shell lacks `psql` plus Cloud SQL Auth Proxy. |
| V2_B1_DUAL_WRITE_GRAPH | blocked | Must not start until B0 records live row counts, latency, schema/index health, selected Case 1/2/3, and approval. |
| V2_B2_READ_PATH_POSTGRES | blocked | Must not start until B1 has run for at least 7 production days with `KG_DUAL_WRITE=true`, parity drift is below 5%, backlog is near-empty, and B0 latency is acceptable. |
| V2_B3_RETIRE_FIRESTORE_GRAPH | blocked | Must not start until B2 has run for at least 7 production days with Postgres reads, shadow drift is below 0.1%, telemetry is over 99% Postgres, and GC explicitly signs off. |
| V2_C0_COGNEE_LIVE | blocked | `praxis-cognee` Cloud Run service is not present in `praxisbytacitus`; repo also lacks `infrastructure/cloudrun/praxis-cognee/`. |
| V2_C1_MEMORY_RECALL_IN_CALIBRATION | blocked | Depends on C0 smoke-green with `COGNEE_ENABLED=true`; must not wire memory recall into calibration before live Cognee exists. |

Status legend: `not_started`, `in_progress`, `partial`, `done`, `deferred`, `blocked`.

## Approvals Required

These rows gate PRAXIS V2 Session A. A1-A6 cannot start until all five rows are
marked `approved` or `revised: <alternative>`.

| decision | option | approved_by | timestamp |
|---|---|---|---|
| MT-1 org model | A (implicit self-org) | pending GC | |
| MT-2 case ownership | C (user-owned, org-scoped) | pending GC | |
| MT-3 roles | owner/editor/viewer/commenter | pending GC | |
| MT-4 invite | email + direct add | pending GC | |
| MT-5 migration | lazy script | pending GC | |

## B0 KG Preflight Approval

| decision | status | approved_by | timestamp |
|---|---|---|---|
| B0 KG preflight | blocked: live SQL counts and latency not measured from local shell | pending GC | |

## Baselines And Checks

### audit:gate composition

`audit:gate` currently includes 69 `npm run audit:*` commands. Full gate passed on 2026-05-08 after the iterate-loop recovery pass.

| audit | status | tier | notes |
|---|---|---|---|
| typecheck | pass | runtime-build | `tsc --noEmit` completed. |
| build | pass | runtime-build | `next build` completed; 197 app pages generated. |
| audit:routes | pass | static-marker | `66 AI route files, 66 calibrated, 5 exempt.` |
| audit:architecture-chain | pass | static-marker | `47 §19 npm scripts accounted for.` |
| audit:architecture-reference | pass | static-marker | `ok`. |
| audit:ai-provider-isolation | pass | static-marker | `ok`. |
| audit:ai-provider-vertex-default | pass | static-marker | `ok`. |
| audit:model-matrix-coverage | pass | static-marker | `7 task kinds.` |
| audit:runbook-bundle | pass | static-marker | `17 Pack 22 runbooks.` |
| audit:pack22-verification | pass | static-marker | `passed`. |
| audit:observability-coverage | pass | static-marker | `ok`. |
| audit:ux-polish | pass | static-marker | Workbench smoke now asserts the Recipe library and Memo Studio surfaces. |
| audit:no-deterministic-tool-output-in-ui | pass | static-marker | Prevents `deterministic-foundation`, `foundation-run`, and `marketplace-foundation-v1` from visible UI. |
| audit:hero-tool-calibration-coverage | pass | static-marker | Checked 12 visible hero tools and catches deterministic/calibrated mismatches. |
| audit:thin-case-handling | pass | static-marker | New gate for prompt-health endpoint, `<context-quality>` compensation, 422 refusal, and UI run-anyway handling. |
| audit:cognee-ui-honesty | pass | static-marker | Verifies Cognee/memory copy is not exposed by default-disabled UI and marketplace subagent pills are feature-gated. |
| audit:surface-registry-coherence | pass | static-marker | Ensures product surfaces are reachable through tabs, chapters, or visible hero tools. |
| audit:workbench-bundle | pass | build-output | Measured current workbench initial client JS at `511.4 KB gzip` with a `520 KB` budget; also enforces dynamic chapter/tab imports and active-only mounting. |
| audit:library-ingest-consolidation | pass | static-marker | Ensures upload UI calls both document save and backend ingest paths and passes `documentId`. |
| audit:document-ingest-parity | pass | static-marker | Guards visible Library upload order, `documentId` handoff, canonical upload route, and backend metadata retention. |
| audit:graph-viewer | pass | static-marker | Verifies the graph tab routes through lazy `WorkbenchGraphPanel`, which renders `PraxisGraphView`. |
| audit:visualization | pass | static-marker | Verifies visualization-wave graph surfaces follow the current lazy tab path. |
| audit:master-charter | pass | static-marker | Graphify outputs refreshed at current commit. |
| npm test | pass | runtime-test | 146 files and 573 tests passed. |
| audit:gcp | pass | runtime-proof | Hard failures 0, soft warnings 0. |
| audit:gcp-production-posture | pass | runtime-proof | Hard failures 0, soft warnings 3: inherited public-access prevention, Terraform state bucket permission denied, and Cloud Armor policy warning. |

### Verification Commands Run

| command | result |
|---|---|
| `npm run typecheck` | pass |
| `npm run build` | pass |
| `npm run audit:surface-registry-coherence` | pass |
| `npm run audit:workspace-tabs-chapters` | pass |
| `npm run audit:no-deterministic-tool-output-in-ui` | pass |
| `npm run audit:stage-target-coverage` | pass, 53 non-SAT recipes staged |
| `npm run audit:cognee-ui-honesty` | pass |
| `npm run audit:cognee` | pass |
| `npm run audit:cognee-operations` | pass |
| `npm run audit:hero-tool-calibration-coverage` | pass |
| `npm run audit:thin-case-handling` | pass |
| `npm run audit:library-ingest-consolidation` | pass |
| `npm run audit:document-ingest-parity` | pass |
| `npm run audit:workbench-bundle` | pass, `511.4 KB gzip` |
| `npm run audit:embedding-dim` | pass |
| `npm run audit:ai-provider-isolation` | pass |
| `npm run audit:model-matrix-coverage` | pass |
| `/api/health/features` direct route smoke | pass, defaults off; env flip enables `cognee`, `postgresKg`, and `agentEngineSubagents` |
| `npm run audit:gate` | pass after iterate-loop recovery |
| `npm run audit:onboarding-gate` | pass |
| `npm run audit:workbench` | pass; redirect-only compatibility shims no longer count as visible app pages |
| `npm run audit:ux-polish` | pass; smoke spec now covers Recipe library and Memo Studio |
| `npm run audit:evidence-drawer` | pass; immediate SAT artifact sources remain visible while deterministic markers stay redacted |
| `npm run audit:graph-viewer` | pass |
| `npm run audit:visualization` | pass |
| `npm run audit:master-charter` | pass after Graphify refresh |
| `npm run test` | pass, 146 files and 573 tests |
| `graphify update .` | pass, rebuilt 5818 nodes, 9917 edges, and 821 communities; HTML skipped because the graph exceeds the 5000-node render limit |

### Postgres KG Live Counts

- Cloud SQL instance discovered: `praxisbytacitus-instance`, `POSTGRES_16`, `us-east4`, `db-f1-micro`, private IP `10.101.0.3`.
- `graph_nodes total`: blocked.
- `graph_nodes real_user_rows`: blocked.
- `graph_edges total`: blocked.
- `graph_embeddings total`: blocked.
- `graph_audit total`: blocked.
- Blocker: local shell has no `psql` and no `cloud-sql-proxy`; instance is private-IP. The attempted `gcloud sql connect ... -- -c` path is not supported by this local `gcloud sql connect` command.

### Bundle Baseline

- Current `/app/workbench/[caseId]` initial client JS raw: `1748.4 KB` across 18 client chunks.
- Current `/app/workbench/[caseId]` initial client JS gzipped: `511.3 KB`.
- Per-chapter chunks: Turbopack chunk filenames are hashed in the route client-reference manifest, so per-chapter attribution was not recoverable from filenames. Static lazy-loading audit confirms chapter islands.
- Chapters lazy-loaded: `6/6` (`ResearchTab`, `MemoStudio`, `DraftTab`, `ACHIndex`, `ToolMarketplace`, `BoardroomIndex`).
- Substrate tabs lazy-loaded: `4/4` (`ContextTab`, `LibraryTab`, `OntologySchemaViewer`, `WorkbenchGraphPanel`).

### Tools Chapter Density

- Runtime path: local production server on `localhost:3032`, demo session cookie, `/app/workbench/syria-2026`, opened the closed `Tools` chapter.
- Container: `[data-testid="tool-marketplace"]`.
- Heading: `Recipe library`.
- Buttons: `51`.
- Links: `1`.
- Selects: `1`.
- Inputs: `1`.
- Role buttons: `0`.
- Total interactive: `54`.

### Prompt-Health Baseline

- Thin synthetic case: `72/red`.
- Thin missing/weak layers: no source/document evidence, thin graph, no retrieved chunks or episodes.
- Rich Syria demo case: `94/yellow`.
- Rich finding: freshness warning, `Situation context has not been refreshed in 6 day(s).`
- Prompt block bytes: thin `3022`, rich `5201`, delta `+2179`.
- Prompt files written for this diagnostic run: `%TEMP%\prompt-thin.txt`, `%TEMP%\prompt-rich.txt`.
- Caveat: the one-shot diagnostic used the same deterministic context-health path and prompt renderer, not live Firestore-backed `buildCalibratedContext`; Firestore Admin was unavailable in the local shell.

### Cognee Copy Inventory

- Files with Cognee/memory strings under `src/components` and `src/app`: `9`.
- Distinct matching lines: `59`.
- Components/routes: `MemoStudio`, `ResearchTab`, `LibraryTab`, `DocumentUploadInline`, `GraphIntelligencePanels`, notification settings, `/api/health`, `/api/health/features`, `/api/memory/[...slug]`.
- `/api/health/features` cache: 60s.
- Cognee flag semantics: enabled only when `COGNEE_ENABLED === 'true'` and `COGNEE_BACKEND_URL` is configured.
- `MemoryPanel.tsx` and `src/lib/memory/client.ts` removed.
- `audit:cognee-ui-honesty`: pass.

### Marketplace Deterministic Output

- `audit:no-deterministic-tool-output-in-ui`: pass.
- Non-SAT recipes now stage hero tool context instead of presenting deterministic foundation runs as AI-backed output.
- `rg 'deterministic-foundation|foundation-run|marketplace-foundation-v1' src/components src/app -n`: `0` locations.

### Surface Registry Orphans

- `audit:surface-registry-coherence`: pass.
- Counts: product surfaces `8`, tabs `4`, chapters `7`, visible hero tools `12`.
- In product surfaces but unreachable: `[]`.
- Reachable but not in product surfaces: `['ontology', 'memos', 'ach']`.
- Allowed non-product registry surfaces: `ontology` tab, `memos` chapter, `ach` chapter.

### Hygiene Baseline

- `background_jobs` client read path is user-scoped via `where('uid', '==', uid)` in `useBackgroundJobs`; admin/operator and job-service paths use Admin SDK or backend service credentials.
- `MemoryPanel.tsx`: absent.
- `src/lib/memory/client.ts`: absent.
- Forbidden legacy model string grep: `0` matches in `src/` and `backend/`.
- Secret marker grep: no committed API secrets; matches are env/config diagnostics only.
- Dated TODO sweep: `0` matches for `TODO(20xx)` in `src/` and `backend/`.
- Lint baseline before the focused cleanup: `98` problems (`2` errors, `96` warnings); after the two focused registry fixes: `96` problems (`0` errors, `96` warnings). No broad `--fix` was run.

## Pre-existing Audit Failures Surfaced This Session

| audit | failure | session of fix |
|---|---|---|
| audit:ux-polish | Workbench smoke spec missing `tool-marketplace` and `Memo Studio` coverage. | fixed in `13_ITERATE_LOOP` |
| audit:workbench | Visible app route count included redirect-only compatibility shims. | fixed in `13_ITERATE_LOOP` |
| audit:evidence-drawer | Immediate SAT run artifact sources were redacted too aggressively for the evidence audit. | fixed in `13_ITERATE_LOOP` |
| audit:graph-viewer / audit:visualization | Static audits expected the old direct graph viewer import path instead of the lazy `WorkbenchGraphPanel` route. | fixed in `13_ITERATE_LOOP` |
| audit:master-charter | Graphify outputs were stale against the current codebase. | fixed in `13_ITERATE_LOOP` |
| npm test | withCalibration unit fixtures lagged current `withContextAware` and onboarding profile contracts. | fixed in `13_ITERATE_LOOP` |

## Per-Prompt Notes

### 01_DIAGNOSTICS

- Completed: 2026-05-08.
- Commits: `c16dcd7`, plus baseline hardening already present in `879871a`.
- Diagnostic output: captured gate composition, Cloud SQL reachability, bundle size, Tools density, prompt-health deltas, Cognee copy inventory, marketplace deterministic strings, surface registry coherence, and hygiene baselines.
- Issues encountered: live Cloud SQL row counts blocked by private IP plus missing local `psql`/Cloud SQL Proxy.

### 02_MARKETPLACE_HONESTY

- Completed: 2026-05-08.
- Commit: `c2d2b6f`.
- Stage targets populated: `53` non-SAT recipes staged into hero tools.
- Hero staging behavior: non-SAT marketplace recipes stage context instead of firing a marketplace POST; SAT recipes retain their existing routing.
- audit:no-deterministic-tool-output-in-ui: pass.

### 03_CALIBRATION_INVARIANT

- Completed: 2026-05-08.
- Commit: `cbca72e`.
- Tier field on visible hero tools: yes.
- audit:hero-tool-calibration-coverage: pass for 12 visible hero tools.
- Doc updated: yes, `docs/CONTEXT_INJECTION.md` now states the calibrated-ai hero route contract instead of overclaiming every authenticated AI request.

### 04_COGNEE_UI_HONESTY

- Completed: 2026-05-08.
- Commit: `ac4683f`.
- `/api/health/features` endpoint live: yes, with 60s cache semantics.
- Components gated: Research, Library, upload, Memo Studio, graph intelligence, notifications, and new-situation copy.
- MemoryPanel deleted: yes; `src/lib/memory/client.ts` deleted; boundary files remain.
- audit:cognee-ui-honesty: pass.

### 05_CHAPTER_CODE_SPLIT

- Completed: 2026-05-08.
- Commit: `1e4b651`.
- Chapters lazy: `6/6`.
- Substrate tabs lazy: `4/4`.
- Bundle gzipped result: `514 KB` against a `520 KB` budget in the latest gate.
- audit:workbench-bundle: pass.

### 06_LIBRARY_INGEST_CONSOLIDATION

- Completed: 2026-05-08 as a static implementation; runtime ingest remains deferred.
- Commit: `44594cd`.
- DocumentUploadInline calls both endpoints: yes.
- Document on a fresh case retrievable by RAG: not runtime-verified yet.
- audit:document-ingest-parity: pass.

### 07_ONBOARDING_GATE

- Completed: 2026-05-08.
- Commits: `b3193c7`, `4b403ee`.
- `/login/callback` redirects incomplete profiles: yes.
- Middleware/proxy enforces incomplete profile routing: yes.
- Cookie includes onboardingComplete resolution: yes, via refreshed signed session claim after completion.
- audit:onboarding-gate: pass.

### 08_THIN_CASE_CALIBRATION

- Completed: 2026-05-08.
- Commit: `8516030`.
- Badge mounted on shared AI generation UI and the direct Executive Intelligence panel.
- Compensation block injected below prompt-health `80`: yes.
- 422 refusal below prompt-health `30`: yes unless `forceRun` is true.
- audit:thin-case-handling: pass.

### 09_EMBEDDING_DIMENSION

- Completed: 2026-05-08.
- Commit: `6ac1bd0`.
- Canonical embedding config created: yes.
- Migration `0012_embedding_dim_alignment.py` created: yes.
- Pre-flight count: blocked until live SQL access is available.
- Migration applied locally: not applied in this session.
- audit:embedding-dim: pass.

### 10_ACO_EXPLAINER

- Completed: 2026-05-08.
- Commit: `4ec44f2`.
- `aco-copy.ts` has 14 entries: yes.
- Overlay mounts on first case open: yes by static audit; manual browser smoke still recommended.
- audit:aco-parity: pass.

### 11_AUDIT_PROMOTION

- Completed: 2026-05-08.
- Commit: `f46c2cf`.
- Audits tagged with tier labels where touched.
- Runtime audits created or promoted: `audit:gate-with-cloud`, `audit:gate-runtime-full`, and runtime-proof variants for KG drift, Cognee, owner scoping, and tool-context isolation.
- audit:gate-with-cloud composition: yes.

### 12_HYGIENE

- Completed: 2026-05-08.
- Commit: `a4add50`.
- `background_jobs` rule tightened: client reads are user-scoped and global reads remain admin/service-only.
- audit:surface-registry-coherence: pass.
- Forbidden model strings: `0`.
- Lint count delta: `98` problems to `96` problems after focused cleanup.

### 13_ITERATE_LOOP

- Completed: 2026-05-08.
- Commit: `a4d2651`.
- Recovery loop result: `npm run audit:gate` passed after fixing the surfaced audit/test drift.
- Graphify refresh: `5818` nodes, `9917` edges, `821` communities; HTML render skipped by Graphify because the graph exceeds the 5000-node render limit.
- Issues encountered: none requiring GC; production browser smoke remains a next-session runtime task.

### STATUS_TEMPLATE

- Completed: 2026-05-08.
- Commit: current status-template pass.
- Template applied: yes; root `STATUS.md` now contains the morning brief, metadata, task table, baselines, pre-existing failures, per-prompt notes, blockers, and next-session notes from `STATUS_TEMPLATE.md`.
- Issues encountered: none.

### V2_00_README

- Completed: 2026-05-08.
- Commit: current V2 README pass.
- Source preserved: `docs/codex-prompts/PRAXIS_V2_00_README.md`.
- Precondition check: satisfied; the night-pack status ledger shows honesty/calibration/Cognee guardrails complete and `npm run audit:gate` passed.
- Session map recorded: Session A multi-tenant foundations, Session B Postgres KG cutover, Session C Cognee plus Agent Engine, Session D observability.
- Next executable file: `A0_MT_DATA_MODEL.md`.
- Issues encountered: none; no production data or Firestore rule changes made in this README pass.

### V2_A0_MT_DATA_MODEL

- Completed: 2026-05-08.
- Commit: current A0 pass.
- Decision doc: `docs/architecture/MULTI_TENANT_MODEL.md`.
- Current-state scan: `collaborators` has no current code hits; `orgId` exists in profile/context/service metadata but is not an access-control model; Firestore situation rules are still owner-only.
- Approval gate: MT-1 through MT-5 are pending GC in `## Approvals Required`.
- Prompt preservation: A0-A3 copied into `docs/codex-prompts/` and registered in `audit:codex-prompts`.
- Issues encountered: A0 explicitly forbids starting A1 before approval, so A1-A3 implementation was not started.

### V2_A4_A5_A6_INTAKE

- Completed: 2026-05-08.
- Commit: current A4-A6 intake pass.
- Prompt preservation: A4-A6 copied into `docs/codex-prompts/` and registered in `audit:codex-prompts`.
- Implementation status: blocked by the same MT approval gate, plus dependencies on A1-A3.
- Operational notes captured: A4 needs `PRAXIS_INVITE_TOKEN_SECRET` and a production email provider decision; A6 needs an audit-action route map before broad code edits.
- Issues encountered: no code implementation started because A0 still blocks A1-A6.

### V2_B0_KG_PREFLIGHT

- Completed: 2026-05-08 as a local blocked preflight.
- Commit: current B0/B1 intake pass.
- Decision doc: `docs/audits/2026-05-08-POSTGRES_KG_PREFLIGHT.md`.
- Connection evidence: `gcloud` sees `praxisbytacitus-instance` at private IP `10.101.0.3`; local `psql` and Cloud SQL Auth Proxy are missing; `gcloud sql connect` fails because Cloud SQL Proxy v2 is not in PATH.
- Counts and latency: not measured; Case 1/2/3 not selected.
- B1 status: blocked until B0 is rerun from Cloud Shell, a VPC-connected host, or a temporary worker in the existing VPC.

### V2_B2_B3_INTAKE

- Completed: 2026-05-08.
- Commit: current B2/B3 intake pass.
- Prompt preservation: B2-B3 copied into `docs/codex-prompts/` and registered in `audit:codex-prompts`.
- B2 status: blocked until B1 has at least 7 clean production days of dual-write, parity drift below 5%, near-empty retry backlog, and acceptable B0 pgvector latency.
- B3 status: blocked until B2 has at least 7 clean production days of Postgres reads, shadow drift below 0.1%, more than 99% Postgres source telemetry, no graph regressions, and explicit GC sign-off.
- Issues encountered: no graph read/write code, Firestore rules, or environment flags changed because the cutover preconditions are not met.

### V2_C0_C1_INTAKE

- Completed: 2026-05-08.
- Commit: current C0/C1 intake pass.
- Prompt preservation: C0-C1 copied into `docs/codex-prompts/` and registered in `audit:codex-prompts`.
- Live service check: `gcloud run services describe praxis-cognee --region=us-east4 --project=praxisbytacitus` returned `Cannot find service [praxis-cognee]`.
- Cloud Run inventory: `praxis-frontend`, `praxis-backend`, two document/situation handlers, `gdelt-poller`, and Dialectica services exist; `praxis-cognee` does not.
- Repo infrastructure check: `infrastructure/cloudrun/praxis-cognee/` is missing.
- C0 status: blocked until the isolated Cognee service is deployed, healthy, and reachable via service-to-service auth.
- C1 status: blocked until C0 smoke test is green and production has `COGNEE_ENABLED=true` plus `COGNEE_BACKEND_URL`.
- Issues encountered: no memory/calibration code changed because wiring recall into calibration before live Cognee would violate the current honesty guardrails.

## Blockers

- Runtime verification still needed for: production workbench first mount, staged recipe navigation, document upload -> retrieval, thin-case prompt-health, and live fresh-account onboarding enforcement.
- Live Cloud SQL row counts remain blocked until `psql`/Cloud SQL Proxy or a VPC-connected shell is available.
- V2 Session B remains risk-gated on live Cloud SQL graph row counts; do not cut over graph reads/writes until `B0_KG_PREFLIGHT.md` is completed.
- V2 Session A implementation is blocked until GC approves or revises MT-1 through MT-5 in `STATUS.md` or `docs/architecture/MULTI_TENANT_MODEL.md`.
- B1 dual-write implementation is blocked until `docs/audits/2026-05-08-POSTGRES_KG_PREFLIGHT.md` has live counts, pgvector latency, schema/index health, selected Case 1/2/3, and GC approval.
- B2/B3 graph cutover work is blocked by the required 7-day verification windows after B1 and B2.
- C0/C1 are blocked until `praxis-cognee` exists as a healthy Cloud Run service with service-to-service auth and production env binding.

## Notes For Next Session

- Start V2 Session A implementation only after approving MT-1 through MT-5; then read `docs/codex-prompts/PRAXIS_V2_A1_ORGID_CONTEXT.md`.
- To unblock B0, run the documented SQL from a VPC-connected Cloud Shell/bastion/worker against `praxisbytacitus:us-east4:praxisbytacitus-instance`.
- To unblock C0, deploy/provision `praxis-cognee`, add monolith `roles/run.invoker`, set `COGNEE_BACKEND_URL`, then run the smoke test before enabling `COGNEE_ENABLED=true`.
- Keep solo-user backwards compatibility as a hard invariant while adding team/org scaffolding.
- Firestore rules changes in V2 Session A require matching tests in `tests/security/firestore-rules.test.ts`.
- Runtime-smoke `08_THIN_CASE_CALIBRATION`: verify a real thin case returns 422, the help panel renders, and `forceRun: true` reaches the model with `<context-quality>` attached.
- Manual-smoke `10_ACO_EXPLAINER`: clear `praxis:aco-overlay-dismissed:<uid>`, open a case, dismiss the primer, refresh, then reopen via Ontology tab.
- Add runtime document ingest parity: upload a file, verify saved document/chunks, backend source receipt, and retrieval.
- Run a browser smoke against `praxis.tacitus.me` after commit/deploy.
