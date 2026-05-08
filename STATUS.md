# PRAXIS Codex Night Pack - STATUS

> Morning brief for the 2026-05-08 night-pack pass. This file is intentionally candid: the session resumed with marketplace, calibration, and Cognee honesty changes already present in the dirty tree, so the clean diagnostic baseline requested by `01_DIAGNOSTICS` is not available from this checkpoint.

## Morning Brief

- Prompts completed: `02_MARKETPLACE_HONESTY`, `03_CALIBRATION_INVARIANT`, `04_COGNEE_UI_HONESTY`, `05_CHAPTER_CODE_SPLIT`, `06_LIBRARY_INGEST_CONSOLIDATION` static implementation, `07_ONBOARDING_GATE`, `12_HYGIENE` low-risk items.
- Prompts deferred: `08_THIN_CASE_CALIBRATION` (requires prompt-health runtime contract), `10_ACO_EXPLAINER` (product UI work still pending), `11_AUDIT_PROMOTION` full runtime tagging (only new gates were wired), Cloud SQL live diagnostics from `01` (not run in this local pass).
- Pre-existing audit failures surfaced: none from the focused audits run in this pass.
- Measured deltas:
  - Workbench root JS gzipped: no clean pre-change baseline captured; current built workbench initial client JS is `511.1 KB gzip`, guarded by `audit:workbench-bundle` at `520 KB`.
  - Tools chapter density: not re-counted after this pass; recipe library is closed on first mount because `DEFAULT_OPEN_CHAPTERS` is now `['research', 'memos']`.
  - Prompt-health on thin case: not run; deferred to `08_THIN_CASE_CALIBRATION`.
- Next-session priorities: thin-case calibration contract, ACO explainer, runtime document ingest parity, production smoke on `praxis.tacitus.me`.
- Blockers requiring GC: none for the low-risk code changes here; production deployment/commit approval remains separate.

---

## Session Metadata

- Started: 2026-05-08T00:27:51-04:00 checkpoint.
- Branch: `main`
- Last commit at start: `46d8cf1`
- Last commit at end: pending after current `07_ONBOARDING_GATE` commit.
- Total commits this session: `1` completed, one pending in this pass.
- Remote: `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`

## Tasks

| File | Status | Notes |
|---|---|---|
| 01_DIAGNOSTICS | partial | Repo/branch/build/audit composition inspected. Cloud SQL live counts and clean pre-change baselines were not available because the worktree already contained uncommitted fixes. |
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

`audit:gate` currently includes 68 `npm run audit:*` commands. New gates added in this pass:

| audit | status | tier | notes |
|---|---|---|---|
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

### Postgres KG Live Counts

Blocked/not run in this pass. No Cloud SQL mutation or live production query was performed.

### Bundle Baseline

- Pre-change root JS gzipped: not captured from a clean build.
- Current `/app/workbench/[caseId]` initial client JS gzipped: `511.1 KB`.
- Chapters lazy-loaded: `6/6` (`ResearchTab`, `MemoStudio`, `DraftTab`, `ACHIndex`, `ToolMarketplace`, `BoardroomIndex`).
- Substrate tabs lazy-loaded: `4/4` (`ContextTab`, `LibraryTab`, `OntologySchemaViewer`, `WorkbenchGraphPanel`).

### Marketplace Deterministic Output

- `audit:no-deterministic-tool-output-in-ui`: pass.
- Non-SAT recipes now stage hero tool context instead of presenting deterministic foundation runs as AI-backed output.

### Cognee Copy Inventory

- `/api/health/features` cache: 60s.
- Cognee flag semantics: enabled only when `COGNEE_ENABLED === 'true'` and `COGNEE_BACKEND_URL` is configured.
- `MemoryPanel.tsx` and `src/lib/memory/client.ts` removed.
- `audit:cognee-ui-honesty`: pass.

### Surface Registry Orphans

- `audit:surface-registry-coherence`: pass.
- Allowed non-product registry surfaces: `ontology` tab, `memos` chapter, `ach` chapter.

## Pre-existing Audit Failures Surfaced This Session

| audit | failure | session of fix |
|---|---|---|
| none | none from focused checks | n/a |

## Blockers

- Runtime verification still needed for: production workbench first mount, staged recipe navigation, document upload -> retrieval, thin-case prompt-health, and live fresh-account onboarding enforcement.
- Live Cloud SQL counts and production observability were not pulled in this pass.

## Notes For Next Session

- Implement `08_THIN_CASE_CALIBRATION`: prompt-health score, visible badge, compensation block for thin cases, and refusal below the agreed threshold.
- Implement `10_ACO_EXPLAINER`: plain-language 14-entity explainer surfaced inside the app, not just landing/docs.
- Add runtime document ingest parity: upload a file, verify saved document/chunks, backend source receipt, and retrieval.
- Run a browser smoke against `praxis.tacitus.me` after commit/deploy.
