# PRAXIS Codex Night Pack - STATUS

> Morning brief for the 2026-05-08 night-pack pass. This file is intentionally candid: the session resumed with marketplace, calibration, and Cognee honesty changes already present in the dirty tree, so the clean diagnostic baseline requested by `01_DIAGNOSTICS` is not available from this checkpoint.

## Morning Brief

- Prompts completed: `01_DIAGNOSTICS`, `02_MARKETPLACE_HONESTY`, `03_CALIBRATION_INVARIANT`, `04_COGNEE_UI_HONESTY`, `05_CHAPTER_CODE_SPLIT`, `06_LIBRARY_INGEST_CONSOLIDATION` static implementation, `07_ONBOARDING_GATE`, `12_HYGIENE` low-risk items.
- Prompts deferred: `08_THIN_CASE_CALIBRATION` (requires prompt-health runtime contract), `10_ACO_EXPLAINER` (product UI work still pending), `11_AUDIT_PROMOTION` full runtime tagging (only new gates were wired), Cloud SQL live row counts from `01` (blocked by private IP plus missing local `psql`/Cloud SQL Proxy).
- Pre-existing audit failures surfaced: none from the focused audits run in this pass.
- Measured deltas:
  - Workbench root JS gzipped: current built workbench initial client JS is `511.3 KB gzip`, guarded by `audit:workbench-bundle` at `520 KB`.
  - Tools chapter density: live demo DOM count is 54 interactive controls after opening the closed Recipe library.
  - Prompt-health: thin synthetic case `72/red`, rich Syria demo `94/yellow`, prompt block delta `+2179` bytes for rich.
- Next-session priorities: thin-case calibration contract, ACO explainer, runtime document ingest parity, production smoke on `praxis.tacitus.me`.
- Blockers requiring GC: none for the low-risk code changes here; production deployment/commit approval remains separate.

---

## Session Metadata

- Started: 2026-05-08T00:27:51-04:00 checkpoint.
- Branch: `main`
- Last commit at start: `46d8cf1`
- Last commit at end: `b3193c7`
- Total commits this session: `2`
- Remote: `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`

## Tasks

| File | Status | Notes |
|---|---|---|
| 01_DIAGNOSTICS | done | Gate attempted and stopped at `audit:ux-polish`; Cloud SQL instance discovered but live counts blocked by missing local `psql`/Cloud SQL Proxy and private IP; bundle, DOM density, prompt-health, Cognee copy, marketplace strings, and surface registry measured. |
| 02_MARKETPLACE_HONESTY | done | Tools chapter is a Recipe library; non-SAT recipes stage hero-tool context; deterministic foundation strings are redacted from UI; audit wired. |
| 03_CALIBRATION_INVARIANT | done | Visible hero tools are tiered; deterministic structural tools are labeled; calibrated AI hero routes are audited for `withCalibration`; docs updated. |
| 04_COGNEE_UI_HONESTY | done | `/api/health/features` exposes server-derived flags; Cognee/memory UI copy is gated or neutralized; user-facing memory panel/client removed. |
| 05_CHAPTER_CODE_SPLIT | done | Six heavy chapters and four substrate tabs are dynamic islands with skeletons; bundle audit wired into gate. |
| 06_LIBRARY_INGEST_CONSOLIDATION | partial | Upload UI now saves through `/api/documents/upload` before attempting backend Library ingest; static audit added. Runtime RAG retrieval verification not run. |
| 07_ONBOARDING_GATE | done | Shared onboarding helper added; calibrated routes import it; post-login redirect and Next proxy route incomplete profiles to `/onboarding`; completion refreshes signed session claim; workbench banner added; audit wired. |
| 08_THIN_CASE_CALIBRATION | deferred | No thin-case prompt-health scoring or 422 contract added yet. |
| 09_EMBEDDING_DIMENSION | partial | Existing `audit:embedding-dim` passes for 768-dim Vertex text embeddings; no migration touched. |
| 10_ACO_EXPLAINER | deferred | Needs in-app first-run ACO explainer. |
| 11_AUDIT_PROMOTION | partial | New audits wired into `audit:gate`; full runtime audit taxonomy still pending. |
| 12_HYGIENE | done | `background_jobs` global reads now admin-only; surface registry coherence audit added; forbidden legacy model string grep returned 0. |

Status legend: `not_started`, `in_progress`, `partial`, `done`, `deferred`, `blocked`.

## Baselines And Checks

### audit:gate composition

`audit:gate` currently includes 69 `npm run audit:*` commands. Full gate baseline attempted on 2026-05-08 and stopped at `audit:ux-polish`.

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
| audit:ux-polish | fail | static-marker | `tests/e2e/app-usability-smoke.spec.ts` missing `tool-marketplace` and `Memo Studio` coverage. Gate stopped here. |
| audit:no-deterministic-tool-output-in-ui | pass | static-marker | Prevents `deterministic-foundation`, `foundation-run`, and `marketplace-foundation-v1` from visible UI. |
| audit:hero-tool-calibration-coverage | pass | static-marker | Checked 12 visible hero tools. |
| audit:cognee-ui-honesty | pass | static-marker | Verifies Cognee/memory copy is not exposed by default-disabled UI. |
| audit:surface-registry-coherence | pass | static-marker | Ensures product surfaces are reachable through tabs or chapters. |
| audit:workbench-bundle | pass | build-output | Measured current workbench initial client JS at `511.1 KB gzip`. |
| audit:library-ingest-consolidation | pass | static-marker | Ensures upload UI calls both document save and backend ingest paths. |

### Verification Commands Run

| command | result |
|---|---|
| `npm run typecheck` | pass |
| `npm run build` | pass |
| `npm run audit:surface-registry-coherence` | pass |
| `npm run audit:workspace-tabs-chapters` | pass |
| `npm run audit:no-deterministic-tool-output-in-ui` | pass |
| `npm run audit:cognee-ui-honesty` | pass |
| `npm run audit:hero-tool-calibration-coverage` | pass |
| `npm run audit:library-ingest-consolidation` | pass |
| `npm run audit:workbench-bundle` | pass, `511.1 KB gzip` |
| `npm run audit:embedding-dim` | pass |
| `npm run audit:ai-provider-isolation` | pass |
| `npm run audit:model-matrix-coverage` | pass |
| `npm run audit:onboarding-gate` | pass |
| `npm run audit:gate` | fail at `audit:ux-polish` |

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
- Counts: product surfaces `8`, tabs `4`, chapters `7`.
- In product surfaces but unreachable: `[]`.
- Reachable but not in product surfaces: `['ontology', 'memos', 'ach']`.
- Allowed non-product registry surfaces: `ontology` tab, `memos` chapter, `ach` chapter.

## Pre-existing Audit Failures Surfaced This Session

| audit | failure | session of fix |
|---|---|---|
| audit:ux-polish | Workbench smoke spec missing `tool-marketplace` and `Memo Studio` coverage. | next diagnostics/fix pass |

## Blockers

- Runtime verification still needed for: production workbench first mount, staged recipe navigation, document upload -> retrieval, thin-case prompt-health, and live fresh-account onboarding enforcement.
- Live Cloud SQL row counts remain blocked until `psql`/Cloud SQL Proxy or a VPC-connected shell is available.

## Notes For Next Session

- Implement `08_THIN_CASE_CALIBRATION`: prompt-health score, visible badge, compensation block for thin cases, and refusal below the agreed threshold.
- Implement `10_ACO_EXPLAINER`: plain-language 14-entity explainer surfaced inside the app, not just landing/docs.
- Add runtime document ingest parity: upload a file, verify saved document/chunks, backend source receipt, and retrieval.
- Run a browser smoke against `praxis.tacitus.me` after commit/deploy.
