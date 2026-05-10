# PRAXIS v5 Execution Ledger

Date opened: 2026-05-10
Status: Wave 2 Lane B validated locally; Lane C is next

This ledger is the working control file for the v5 build pack. It turns the
three prompt files into explicit checkpoints so Codex, Claude Code,
Antigravity, and human operators can coordinate without losing phase status.

## Source Pack

- `docs/build/PRAXIS_v5_BUILD_01_AGENT_OPERATING_GUIDE.md`
- `docs/build/PRAXIS_v5_BUILD_02_BACKEND_PHASES_0-3.md`
- `docs/build/PRAXIS_v5_BUILD_03_FRONTEND_AND_SHIP.md`

Treat File 1 as the always-read operating guide. Treat Files 2 and 3 as the
phase prompts. If a prompt conflicts with current repo security boundaries,
stop and record the conflict here before editing.

## Current Pre-Flight

- Repo: `C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work`
- Remote: `https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git`
- Branch policy: work on current `main` unless Giulio requests a branch.
- Shared worktree: Codex and Claude Code may be active at the same time.
- Last checked baseline, 2026-05-10:
  - `npm install` passed.
  - `npm run typecheck` passed.
  - `npm run build` passed.
  - `npm run lint` passed with warnings only.
  - `node scripts/audit-ai-routes.mjs` passed.
  - `npm run audit:repo-shape` passed with stale graphify warning.
  - `npm run audit:gcp` passed.
  - `npm run audit:gcp-production-posture` had zero hard failures and three soft warnings.
  - `npx vitest run` passed: 577 tests.

Known setup warnings:

- Application Default Credentials need browser reauthentication before Vertex
  or Google SDK parity work: run `gcloud auth application-default login --project=praxisbytacitus`.
- Cloud Scheduler jobs are paused.
- Firestore delete protection and point-in-time recovery are disabled.
- Current user cannot verify `gs://praxis-terraform-state`.
- `npm audit` reports dependency vulnerabilities; do not auto-force fixes during
  a phase unless the phase explicitly owns dependency remediation.

## Execution Rules

1. Start every work session with `git pull origin main`, `git status`,
   `git log --oneline -5`, and `npm install`.
2. If the tree is dirty, inspect changes and identify which are yours before
   editing or committing.
3. Run one prompt or one clearly bounded sub-prompt at a time. Do not mix phases
   unless the build pack explicitly marks them parallel-safe and the write sets
   are disjoint.
4. Before editing a phase, paste or reference the exact phase prompt in the
   working issue/chat and mark the phase `in-progress` below.
5. Keep commits coherent. Stage only files changed for the completed phase or
   sub-phase.
6. Before committing to `main`, fetch first and rerun the phase verification
   gates plus the repo gates that are relevant to the touched files.
7. If validation fails, do not commit unless Giulio explicitly asks for a WIP
   checkpoint. Record the failure and next action here.
8. After code changes, run `graphify update .` before the final checkpoint when
   practical. If graphify is unavailable or too slow, record that exception.
9. Do not run mutating `gcloud`, `firebase deploy`, `gcloud run deploy`, or
   `terraform apply` from the local machine unless Giulio explicitly approves.
10. Push to `main` only after validation, a fresh fetch, and a clean staged diff.

## Phase Queue

| Phase | Prompt Source | Dependency | Status | Owner | Commit |
|---|---|---|---|---|---|
| 0 | File 2 Prompt 0.A | v4 cleanup merged | complete | Codex | `483d3605` |
| 1 | File 2 Prompt 1.A | Phase 0 merged | complete | Codex | `924ed579` |
| 2A | File 2 Prompt 2A.A | Phase 1 merged | complete | Codex | `d9f7d64d` |
| 2B | File 2 Prompt 2B.A | Phase 1 merged | complete-local | Codex | pending |
| 2C | File 2 Prompt 2C.A | Phase 1 merged | not-started | unassigned | pending |
| 2D | File 2 Prompt 2D.A | Phase 1 merged | complete | Codex | `d9f7d64d` |
| 2E | File 2 Prompt 2E.A | Phase 1 merged | complete | Codex | `d9f7d64d` |
| 3 | File 2 Prompt 3.A | Phase 1 merged | not-started | unassigned | pending |
| 4A | File 3 Phase 4A | Phase 1 plus compatible 2/3 surfaces | not-started | unassigned | pending |
| 4B | File 3 Phase 4B | Phase 3 types/seeds | not-started | unassigned | pending |
| 4C | File 3 Phase 4C | Phase 4A foundation | not-started | unassigned | pending |
| 4D | File 3 Phase 4D | Methods and runtime prerequisites | not-started | unassigned | pending |
| 4E | File 3 Phase 4E | Drafting prerequisites | not-started | unassigned | pending |
| 5 | File 3 Phase 5 | Phase 4C | not-started | unassigned | pending |
| 6 | File 3 Phase 6 | Drafting shell and templates | not-started | unassigned | pending |
| 7 | File 3 Phase 7 | Waves 1-3 complete | not-started | unassigned | pending |
| 8 | File 3 Phase 8 | Demo content and app surfaces | not-started | unassigned | pending |
| 9 | File 3 Phase 9 | All MVP phases complete | not-started | unassigned | pending |

## Checkpoint Template

Use this entry format after each phase or sub-phase:

```md
### YYYY-MM-DD - Phase X - <short name>

- Owner:
- Prompt source:
- Scope completed:
- Files changed:
- Validation run:
- Validation result:
- Commit:
- Push:
- Open blockers:
- Notes for next agent:
```

## First Recommended Command

Start with Phase 0 only:

```text
Run Phase 0 from docs/build/PRAXIS_v5_BUILD_02_BACKEND_PHASES_0-3.md.
Follow docs/build/PRAXIS_v5_BUILD_01_AGENT_OPERATING_GUIDE.md and update
docs/build/PRAXIS_v5_EXECUTION_LEDGER.md as the phase control file.
Commit and push to main only if validation passes and the worktree contains
only the intended Phase 0 changes.
```

## Checkpoints

### 2026-05-10 - Phase 0 - Vision Adopt And Readiness Stubs

- Owner: Codex
- Prompt source: `docs/build/PRAXIS_v5_BUILD_02_BACKEND_PHASES_0-3.md` Prompt 0.A
- Scope completed: implemented locally and gate-repaired for commit
- Files changed: architecture vision docs, ADRs, startup docs, TODO/STATUS, package audit stubs, execution ledger, restored audit-required historical prompt/evidence artifacts, restored audit-required workbench/landing/cost fixtures, docs lint script
- Validation run:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`
  - `npx vitest run`
  - `npm run test`
  - `pytest backend/ -q`
  - `npm run audit:gate`
  - `npm run audit:v5-readiness`
  - `npm run docs:lint`
  - `git diff --check`
- Validation result: pass with expected/environment exceptions
  - PASS: `npm run lint` completed with existing warning debt only.
  - PASS: `npm run typecheck`.
  - PASS: `npm run build`.
  - PASS: `npx vitest run` / `npm run test` completed 148 test files and 577 tests.
  - PASS: `npm run audit:gate` after restoring active-audit required files.
  - PASS: `npm run docs:lint`; this repo now has a dependency-free docs sanity script because markdownlint/Vale/Lychee are not installed in the current toolchain.
  - PASS: `graphify update .`.
  - PASS: `git diff --check`.
  - EXPECTED RED: `npm run audit:v5-readiness` fails on `audit:llm-pattern-coverage`, as Prompt 0.A requires failing stubs that are not yet in `audit:gate`.
  - ENVIRONMENT: `pytest backend/ -q` cannot collect in the active Python environment because backend dependencies/import path are unavailable (`fastapi`, `pydantic_settings`, `psycopg`, `psycopg_pool`, `google`, and `agents` import errors). No Phase 0 backend product code depends on this.
  - REPAIRED: `npm run audit:gate` previously failed because v4 cleanup removed active-audit required artifacts. Restored required `docs/codex-prompts/`, `docs/audits/2026-05-08-V2-PROMPT-PACK-COMPLETION.md`, `src/lib/cases/user-cases/loader.ts`, `src/components/landing/_archive/`, and `scripts/bench-gliner-cost-reduction.py`.
  - SKIPPED: `git diff --cached --check` because nothing was staged after validation failed.
- Commit: `483d3605` (`chore(v5-phase-0): adopt vision and readiness stubs`)
- Push: pushed to `origin/main`
- Open blockers:
  - The standalone `PRAXIS_VISION_v4_*` files referenced by Prompt 0.A were absent at phase start; repo-local canonical files were created from the authoritative v5 build pack.
  - Existing historical ADRs already used numeric prefixes `0037`, `0038`, and `0040`; the requested v5 ADR filenames were added without renaming existing ADRs.
  - `npm run audit:v5-readiness` is expected-red because Phase 0 intentionally creates failing stubs for later phases.
  - Backend Python verification requires environment setup before `pytest backend/ -q` can collect.
  - `npm run audit:gcp-production-posture` has zero hard failures and three soft warnings: uploads bucket public-access prevention is inherited, Terraform state bucket is not readable by the active user, and Cloud Armor exists as a warning-level check.
- Notes for next agent: Do not start Phase 1 until this checkpoint is committed and pushed to `main`. Phase 1 should replace the expected-red `audit:llm-pattern-coverage` v5 stub and continue the v5 readiness chain.

### 2026-05-10 - Phase 1 - Ontology Surfacing And Work Ontologies

- Owner: Codex
- Prompt source: `docs/build/PRAXIS_v5_BUILD_02_BACKEND_PHASES_0-3.md` Prompt 1.A
- Scope completed:
  - Added `/ontologies` and `/ontologies/[id]` for domain and work ontology browsing.
  - Added three MVP work ontology YAML specs, Pydantic mirrors, and extraction prompt templates under `backend/data/ontologies/work/`.
  - Extended `backend/services/ontology_system.py` with work ontology resolution and demo Context domain-stack mapping notes.
  - Replaced Phase 1 audit stubs for `audit:llm-pattern-coverage` and `audit:work-ontology-coverage`; wired both into `audit:gate`.
  - Updated architecture docs to distinguish domain ontologies from work ontologies.
- Files changed: ontology routes, ontology metadata, backend work ontology specs, Phase 1 audits, package audit gate, architecture docs, graphify output, execution ledger
- Validation run:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`
  - `npm run audit:gate`
  - `npm run audit:llm-pattern-coverage`
  - `npm run audit:work-ontology-coverage`
  - `npm run audit:ontology-mapping`
  - `npm run audit:ontology-system`
  - `npm run audit:ontology-versions`
  - `graphify update .`
  - `npm run audit:gate`
  - Browser smoke on `http://localhost:3020/ontologies`, `/ontologies/conflict`, and `/ontologies/foreign-policy-research`
- Validation result: pass with documented exceptions
  - PASS: `npm run audit:gate` with the two Phase 1 audits included.
  - PASS: `npm run build`; routes `/ontologies` and `/ontologies/[id]` render in the build output.
  - PASS: Browser smoke for ontology list and detail routes with no console errors.
  - PASS: `npm run audit:v5-readiness` now advances through `audit:llm-pattern-coverage`; it expectedly stops at the Phase 2D `audit:source-tier-discipline` stub.
  - ENVIRONMENT: `pytest backend/ -q` remains unavailable in the active Python environment because backend dependencies/import path are not installed.
- Commit: `924ed579` (`feat(v5-phase-1): surface ontologies and add work ontology layer`)
- Push: pushed to `origin/main`
- Open blockers:
  - Prompt 1.A references 13 domain ontology specializations; the repo currently contains 10 OWL specializations. The app surfaces the actual 10 and keeps non-MVP domains visible through the existing TypeScript ontology registry.
  - `tacitus-ontology` separate GitHub repository publication is not performed here; the queue prompt says Giulio owns repo creation. Current work keeps the package-ready work ontology specs in-repo.
- Notes for next agent: Wave 2 can start only after this checkpoint is committed and pushed. Phase 2D owns replacing `audit:source-tier-discipline`; Phase 2B owns document pipeline stubs; Phase 2C owns research pipeline stubs.

### 2026-05-10 - Wave 2 Lane A - Context Shell, Source Tiers, Episode Timeline

- Owner: Codex
- Prompt source: `docs/build/PRAXIS_v5_BUILD_02_BACKEND_PHASES_0-3.md` Prompts 2A.A, 2D.A, and 2E.A
- Scope completed:
  - Added `/contexts` and `/contexts/[caseId]` as the unified Context workspace entry points.
  - Added the eight-panel Context shell: Frame, Sources, Extraction Lenses, Work Process, Timeline, Graph, Drafts, and Methods Used.
  - Added a client-side new Context wizard shell with honest auth/persistence fallback copy.
  - Added a typed T0-T7 Source Tier model, UI badge, backend type mirror, and additive migration scaffold for existing chunk tables.
  - Added Context Episode typing, provider state, backend type mirror, episode-state migration scaffold, and owner/case/time scoped query helpers.
  - Replaced the Phase 2D and Phase 2E failing audit stubs and wired both audits into `audit:gate`.
  - Updated `graphify-out/` with `graphify update .`.
- Files changed: Context routes and panel components, source tier library/badge/types/migration/audit, episode provider/types/migration/scoping/audit, package audit gate, queue status doc, graphify output
- Validation run:
  - `npm run typecheck`
  - `npm run build`
  - `npm run lint`
  - `node scripts/audit-ai-routes.mjs`
  - `npm run audit:routes`
  - `npm run audit:no-internal-jargon-ui`
  - `npm run audit:experience-map-coherence`
  - `npm run audit:source-tier-discipline`
  - `npm run audit:episode-bi-temporal-coverage`
  - `npm run audit:repo-shape`
  - `npx vitest run`
  - `graphify update .`
  - Browser smoke on `http://localhost:3021/contexts`, `/contexts/syria-2026`, `/contexts/syria-2026?panel=sources`, and `/contexts/syria-2026?panel=timeline` at desktop and 390px mobile widths
- Validation result: pass with documented exceptions
  - PASS: typecheck, build, route audits, focused Lane A audits, repo-shape audit, and 577 Vitest tests.
  - PASS: lint completed with existing warning debt only.
  - PASS: browser smoke rendered the Context list, eight-panel shell, Source Tier badges, and Timeline strands without console errors.
  - PASS: full `npm run audit:gate` passed with the longer timeout, including GCP checks. `audit:gcp-production-posture` still reports three soft warnings and zero hard failures.
  - SCOPE NOTE: Phase 2B still owns document pipeline internals; Phase 2C still owns research pipeline internals and Phase 3 user models. The Source panel therefore uses existing example-case source metadata plus honest Phase 2B placeholder copy.
- Commit: `d9f7d64d` (`feat(v5-2a): add context shell source tiers and timeline`)
- Push: pending
- Open blockers:
  - Lane B document pipeline remains not-started.
  - Lane C research pipeline and user models remain not-started.
  - Full Wave 2 integration gate is blocked until Lanes A, B, and C are pushed.
- Notes for next agent: Continue with Queue 04 / Wave 2 Lane B unless another active agent already owns it. Preserve unrelated untracked `.playwright-cli/` and `docs/audits/2026-05-10-v5-final-product-qa.md` unless Giulio assigns them.

### 2026-05-10 - Wave 2 Lane B - Document Pipeline

- Owner: Codex
- Prompt source: `docs/build/PRAXIS_v5_BUILD_02_BACKEND_PHASES_0-3.md` Prompt 2B.A
- Scope completed:
  - Added dependency-optional `backend/services/docling_parser.py` with a parsed-document contract, byte-span metadata, HTML/TXT support, and Docling fallback behavior for local environments.
  - Added `backend/services/gliner_pre_pass.py` for GLiNER L1 candidate spans with deterministic regex fallback when the model dependency is not installed.
  - Added `backend/services/wikidata_resolver.py` with known QID fixtures, normalization, rate-limited SPARQL lookup, and cache protocol.
  - Added `backend/graphify_tacitus/extraction.py` as the v5 GLiNER L1 plus Gemini L2 orchestration layer.
  - Refactored `cloud_functions/on_document_uploaded/main.py` into an auditable 12-step document pipeline contract.
  - Updated `/api/documents/upload` so PDF/DOCX uploads no longer use inline `pdf-parse` or `mammoth`; they are stored and marked `processing` for structured Docling extraction.
  - Replaced `audit:document-pipeline-shape` and wired it into `audit:gate`.
  - Added focused Python tests and a deterministic GLiNER cost benchmark.
- Files changed: document upload route, cloud document trigger, backend document services, graphify extraction adapter, document pipeline audit, focused backend tests, package audit gate, queue status docs
- Validation run:
  - `npm run typecheck`
  - `npm run build`
  - `npm run lint`
  - `node scripts/audit-ai-routes.mjs`
  - `npx vitest run`
  - `npm run audit:document-pipeline-shape`
  - `npm run audit:document-ingest-parity`
  - `npm run audit:library-ingest-consolidation`
  - `npm run audit:source-tier-discipline`
  - `pytest backend/tests/test_docling_parser.py backend/tests/test_gliner_pre_pass.py backend/tests/test_wikidata_resolver.py backend/tests/test_document_pipeline_e2e.py -q`
  - `pytest backend/ -q`
  - `graphify update .`
  - `npm run audit:gate`
- Validation result: pass with documented environment exception
  - PASS: typecheck, build, document audits, route audit, 577 Vitest tests, the four focused Phase 2B Python test files, graphify update, and full `npm run audit:gate`.
  - PASS: lint completed with existing warning debt only.
  - ENVIRONMENT: full `pytest backend/ -q` still cannot collect in the active Python environment because backend dependencies/import path are unavailable (`agents`, `fastapi`, `pydantic_settings`, `psycopg`, `psycopg_pool`, and `google` import errors). This matches the Phase 0/1 environment limitation.
- Commit: pending
- Push: pending
- Open blockers:
  - Runtime deployment of the Cloud Function/worker path was not performed; deploy remains manual-approval-only.
  - Local environment does not include Docling/GLiNER model dependencies, so focused tests exercise the production contract and deterministic fallback rather than live model inference.
  - Lane C research pipeline and user models remain not-started.
- Notes for next agent: Continue with Queue 05 / Wave 2 Lane C after this checkpoint is committed and pushed. Do not run production deploy commands.
