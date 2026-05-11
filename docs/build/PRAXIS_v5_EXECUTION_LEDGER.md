# PRAXIS v5 Execution Ledger

Date opened: 2026-05-10
Status: Queue 16 / Phase 9 Polish and Ship is next after Phase 8 checkpoint push

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

- Application Default Credentials are present and quota-aligned to
  `praxisbytacitus` as of 2026-05-11.
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
| 2B | File 2 Prompt 2B.A | Phase 1 merged | complete | Codex | `7422b0aa` |
| 2C | File 2 Prompt 2C.A | Phase 1 merged | complete | Codex | `9e4d58bc` |
| 2D | File 2 Prompt 2D.A | Phase 1 merged | complete | Codex | `d9f7d64d` |
| 2E | File 2 Prompt 2E.A | Phase 1 merged | complete | Codex | `d9f7d64d` |
| 3 | File 2 Prompt 3.A | Phase 1 merged | complete-core | Codex | `9e4d58bc` |
| 4A | File 3 Phase 4A | Phase 1 plus compatible 2/3 surfaces | complete | Codex | `330b1bbd` |
| 4B | File 3 Phase 4B | Phase 3 types/seeds | complete | Codex | `8e5df782`, `e74792b8` |
| 4C | File 3 Phase 4C | Phase 4A foundation | complete | Codex | `04e703d0`, `7fa55185` |
| 4D | File 3 Phase 4D | Methods and runtime prerequisites | complete | Codex | `c4938c99`, `995e5e8e` |
| 4E | File 3 Phase 4E | Drafting prerequisites | complete | Codex | `54d46851`, `b40cb735` |
| 5 | File 3 Phase 5 | Phase 4C | complete | Codex | `cca0a32e`, `951ae357` |
| 6 | File 3 Phase 6 | Drafting shell and templates | complete | Codex | `c781887a` |
| 7 | File 3 Phase 7 | Waves 1-3 complete | complete | Codex | `ec88a6e4` |
| 8 | File 3 Phase 8 | Demo content and app surfaces | complete | Codex | `b7ae568c` |
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
- Push: pushed to `origin/main`
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
- Commit: `7422b0aa` (`feat(v5-2b): add document extraction pipeline`)
- Push: pushed to `origin/main`
- Open blockers:
  - Runtime deployment of the Cloud Function/worker path was not performed; deploy remains manual-approval-only.
  - Local environment does not include Docling/GLiNER model dependencies, so focused tests exercise the production contract and deterministic fallback rather than live model inference.
  - Lane C research pipeline and user models remain not-started.
- Notes for next agent: Continue with Queue 05 / Wave 2 Lane C after this checkpoint is committed and pushed. Do not run production deploy commands.

### 2026-05-10 - Wave 2 Lane C - Research Pipeline And User Models

- Owner: Codex
- Prompt source: `docs/build/PRAXIS_v5_BUILD_02_BACKEND_PHASES_0-3.md` Prompts 2C.A and 3.A
- Scope completed:
  - Added a Google Grounded Search service contract with a T5 fallback result and optional provider abstraction hook.
  - Added a Wikidata SPARQL service with actor disambiguation, entity facts, related entities, known-QID fixtures, rate limiting, and dependency-light tests.
  - Added the Source Augmenter state machine with ordered R1-R13 research-pipeline markers.
  - Added `/api/research/run` as an owner-scoped SSE route that returns transparent local fallback events when live grounding is unavailable.
  - Added TypeScript research client and method registry entries for deep research, Wikidata SPARQL, and Google Grounded Search.
  - Added three public seeded user models, owner-scoped fork helpers, active model ContextSnapshot fields, capture-loop helpers, Python mirror types, and migration scaffold.
  - Replaced the Phase 2C and Phase 3 audit stubs and wired both into `audit:gate`.
- Files changed: research backend services/router/state machine, research API route/client/methods/skills, user-model types/seeds/store/capture loop, context typing/injection, audits, package gate, focused tests, graphify output, queue status docs
- Validation run:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`
  - `node scripts/audit-ai-routes.mjs`
  - `npm run audit:research-pipeline-shape`
  - `npm run audit:user-model-versioning`
  - `npm run audit:ai-provider-isolation`
  - `npm run audit:ai-provider-vertex-default`
  - `npm run audit:model-matrix-coverage`
  - `npm run audit:owner-scoping`
  - `pytest backend/tests/test_google_grounded_search.py backend/tests/test_wikidata_sparql.py backend/tests/test_research_pipeline_e2e.py backend/tests/test_user_models_e2e.py -q`
  - `pytest backend/ -q`
  - `npx vitest run`
  - `graphify update .`
  - `npm run audit:gate`
  - `git diff --check`
  - Local API smoke against `http://127.0.0.1:3024/api/research/run`
- Validation result: pass with documented environment/auth exceptions
  - PASS: lint completed with existing warning debt only.
  - PASS: typecheck, build, AI route audit, focused Lane C audits, provider audits, model-matrix audit, owner-scoping audit, 580 Vitest tests, focused Lane C Python tests, graphify update, and full `npm run audit:gate`.
  - PASS: local API smoke proved unauthenticated `/api/research/run` returns `401`, preserving the owner-scoped auth boundary.
  - ENVIRONMENT: full `pytest backend/ -q` still cannot collect in the active Python environment because backend dependencies/import path are unavailable (`agents`, `fastapi`, `pydantic_settings`, `psycopg`, `psycopg_pool`, and `google` import errors). Focused Lane C backend tests pass.
  - SCOPE NOTE: `/users` and `/users/[modelId]` UI are still Phase 4B. This checkpoint completes the Phase 3 schema/seeds/fork/capture/context core required for that surface.
- Commit: `9e4d58bc` (`feat(v5-2c): add grounded research pipeline and user models`)
- Push: pushed to `origin/main`
- Open blockers:
  - Live Google grounding depends on configured provider/runtime credentials; the local route emits transparent fallback events rather than claiming live grounded execution.
  - Full backend pytest remains blocked by the local Python dependency environment.
  - Wave 2 integration gate is now unblocked and in progress.
- Notes for next agent: After this checkpoint is pushed, run Queue 06 / Wave 2 Integration Gate. Preserve unrelated untracked `.playwright-cli/` and `docs/audits/2026-05-10-v5-final-product-qa.md` unless Giulio explicitly assigns them.

### 2026-05-10 - Wave 2 Integration Gate - Phases 2A-2E And 3

- Owner: Codex
- Prompt source: `docs/build/PRAXIS_v5_ANTIGRAVITY_QUEUE_PROMPTS.md` Copy Block 06
- Scope completed:
  - Pulled latest `main` after Lane C landed and verified Wave 2 lanes 2A, 2B, 2C, 2D, 2E, and Phase 3 core integrate in one app.
  - Confirmed Context routes, source tier panel, timeline panel, methods panel, drafts panel, research API auth boundary, and mobile Context shell load together.
  - No integration code fixes were required.
  - Refreshed graphify after the Lane C docs commits so the master-charter and repo-shape gates agree with the current commit graph.
- Files changed: queue tracker, execution ledger, graphify output
- Validation run:
  - `git pull origin main`
  - `git status --short --branch`
  - `git log --oneline -5`
  - `npm install`
  - `npm run lint`
  - `npm run build`
  - `npm run typecheck`
  - `npx vitest run`
  - `pytest backend/ -q`
  - `npm run audit:routes`
  - `npm run audit:research-pipeline-shape`
  - `npm run audit:document-pipeline-shape`
  - `npm run audit:user-model-versioning`
  - `graphify update .`
  - `npm run audit:master-charter`
  - `npm run audit:gate`
  - Production-mode local browser smoke on `http://127.0.0.1:3026`
- Validation result: pass with documented environment exceptions
  - PASS: lint completed with existing warning debt only.
  - PASS: build and typecheck after clearing stale generated `.next/dev` types and rerunning sequentially.
  - PASS: 580 Vitest tests.
  - PASS: focused Wave 2 audits and full `npm run audit:gate`, including GCP checks.
  - PASS: browser smoke loaded `/contexts`, `/contexts/syria-2026`, `?panel=sources`, `?panel=timeline`, `?panel=methods`, `?panel=drafts`, and the mobile Context shell with no production-mode console errors.
  - PASS: unauthenticated POST to `/api/research/run` returned `401`, preserving the research API owner-scoped auth boundary.
  - ENVIRONMENT: full `pytest backend/ -q` still cannot collect in the active Python environment because backend dependencies/import path are unavailable (`agents`, `fastapi`, `pydantic_settings`, `psycopg`, `psycopg_pool`, and `google` import errors). This is unchanged from Phases 0-2C.
  - NOTE: running `build` and `typecheck` concurrently once produced malformed generated `.next/dev/types`; generated cache was removed and sequential rerun passed.
- Commit: `b6a23d86` (`docs(v5): record wave 2 integration gate`)
- Push: pushed to `origin/main`
- Open blockers:
  - Phase 4A frontend build can begin.
  - Full backend pytest still needs a properly provisioned Python/backend environment.
  - Production deploy remains manual-approval-only.
- Notes for next agent: Continue with Queue 07 / Phase 4A. Do not start production deployment. Preserve unrelated untracked `.playwright-cli/` and `docs/audits/2026-05-10-v5-final-product-qa.md`.

### 2026-05-10 - Phase 4A - Contexts Surface

- Owner: Codex
- Prompt source: `docs/build/PRAXIS_v5_BUILD_03_FRONTEND_AND_SHIP.md` Phase 4A
- Scope completed:
  - Kept the existing `/contexts` and `/contexts/[caseId]` Context shell as the Phase 4A baseline.
  - Added the expected `CreateContextWizard` client component with a four-step modal flow for name, domain ontology, work ontology, and initial four-field frame.
  - Updated `/contexts` cards with ontology stack badges and visible Context Health status.
  - Added detail-page breadcrumbs, active panel title, and work episode selector above the eight-panel content.
  - Verified all eight sidebar panels render: Frame, Sources, Extraction Lenses, Work Process, Timeline, Graph, Drafts, and Methods Used.
- Files changed: Context routes, Context wizard components, graphify output, queue tracker, execution ledger
- Validation run:
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`
  - `npm run audit:routes`
  - `npm run audit:no-internal-jargon-ui`
  - `npm run audit:experience-map-coherence`
  - `npx vitest run`
  - `graphify update .`
  - `git diff --check`
  - Production-mode local browser smoke on `http://127.0.0.1:3027`
- Validation result: pass
  - PASS: lint completed with existing warning debt only.
  - PASS: typecheck, build, route audit, no-internal-jargon audit, experience-map audit, 580 Vitest tests, graphify update, and diff check.
  - PASS: browser smoke loaded `/contexts` desktop/mobile, opened the create wizard, and loaded `/contexts/syria-2026` desktop/mobile plus all eight panel URLs with no console errors.
  - SCOPE NOTE: authenticated persistence for new Context creation remains honest placeholder behavior until the owner-scoped Firestore creation path is assigned. The UI does not claim it created a persisted Context.
- Commit: `330b1bbd` (`feat(v5-4a): add contexts surface`)
- Push: pushed to `origin/main`
- Open blockers:
  - Phase 4B `/users` surface is next now that Phase 3 user-model core exists.
  - The three final buyer demo Contexts are still Phase 7; current Context list uses the available example cases.
- Notes for next agent: Continue with Queue 08 / Phase 4B after this checkpoint is committed and pushed. Preserve unrelated untracked `.playwright-cli/` and `docs/audits/2026-05-10-v5-final-product-qa.md`.

### 2026-05-10 - Phase 4B - User Models Surface

- Owner: Codex
- Prompt source: `docs/build/PRAXIS_v5_BUILD_03_FRONTEND_AND_SHIP.md` Phase 4B
- Scope completed:
  - Added `/users` with My Models and Public Library sections.
  - Added cards for the three public seeded user models with Use, Fork, and Open actions.
  - Added `/users/[modelId]` structured editor with Identity, Mandate, Methodology, Style, Standing Assumptions, Prohibited Frames, Sources, and Audience Defaults tabs.
  - Added typed `src/lib/users/api.ts` helpers for public reads, owner-scoped current paths, local private forks, save, and active model selection.
  - Kept public seeds read-only; editing requires a private fork.
- Files changed: user-model routes, user-model UI components, local owner-scoped API helpers, graphify output, queue tracker, execution ledger
- Validation run:
  - `npm run build`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run audit:user-model-versioning`
  - `npm run audit:owner-scoping`
  - `npm run audit:routes`
  - `npx vitest run`
  - `graphify update .`
  - `git diff --check`
  - Production-mode local browser smoke on `http://127.0.0.1:3028`
- Validation result: pass
  - PASS: build, typecheck, route audit, user-model audit, owner-scoping audit, 580 Vitest tests, graphify update, and diff check.
  - PASS: lint completed with existing warning debt plus two new React-effect warnings from hydration-safe localStorage loading in the user-model client components.
  - PASS: browser smoke loaded `/users`, forked the Foreign Policy Analyst seed, opened the private editor, edited and saved Mandate, set active model, verified the public editor is read-only, and loaded mobile `/users` with no console errors.
  - SCOPE NOTE: the current MVP uses local browser persistence for unauthenticated smoke testing and exposes the owner-scoped Firestore current path. Production Firestore writes remain a follow-on integration point; public UI copy is honest and does not claim remote sync.
- Commit: `8e5df782` (`feat(v5-4b): add user models surface`)
- Push: pushed to `origin/main`
- Open blockers:
  - Header-wide active model picker integration remains minimal; the `/users` surface displays and updates the active model locally.
  - Firestore-backed private model CRUD should replace local persistence when auth-backed user-model APIs are assigned.
- Notes for next agent: Continue with Queue 09 / Phase 4C after this checkpoint is committed and pushed.

### 2026-05-10 - Phase 4C - Methods Marketplace

- Owner: Codex
- Prompt source: `docs/build/PRAXIS_v5_BUILD_03_FRONTEND_AND_SHIP.md` Phase 4C
- Scope completed:
  - Added `/methods` as the focused MVP Methods marketplace with AI, Research, and Deterministic filters.
  - Surfaced the 10 MVP methods only: Position-vs-Interest Decoder, Scenario Projector, Analysis of Competing Hypotheses, Memo Drafter, Frame & Narrative Analyzer, Contradiction Finder, Grounded Research, Stakeholder Power-Interest Map, Coalition Detector, and Commitment Tracker.
  - Added a 3-method suggestion strip that responds to search and active-context state without exposing the wider 57-tool catalog as the default surface.
  - Added `/methods/[methodId]` detail pages with method contract, required context, endpoint mapping, and honest runtime-readiness states.
  - Preserved the existing audited tool marketplace and marked the remaining specialist catalog as deferred rather than deleting it.
- Files changed: methods catalog, method marketplace UI components, `/methods` routes, graphify output, generated tool-contract audit evidence, queue tracker, execution ledger
- Validation run:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - `npm run audit:tool-contracts`
  - `npm run audit:tool-contract-v2`
  - `npm run audit:tool-marketplace`
  - `npm run audit:tool-context-isolation`
  - `npm run audit:no-internal-jargon-ui`
  - `npm run audit:tool-skills-present`
  - `npm run audit:tool-suggestion-eval`
  - `node scripts/audit-ai-routes.mjs`
  - `npx vitest run --pool=threads`
  - `graphify update .`
  - Production-mode local browser smoke on `http://127.0.0.1:3031`
- Validation result: pass
  - PASS: typecheck, build, method/tool audits, route audit, no-internal-jargon audit, tool skills, tool suggestions, 580 Vitest tests with `--pool=threads`, and graphify update.
  - PASS: lint completed with existing warning debt only.
  - PASS: browser smoke loaded `/methods` desktop/mobile, verified category filters, suggestion strip, active-context suggestion state, `/methods/contradiction-finder`, and run-readiness state with no console errors.
  - ENVIRONMENT: the first default `npx vitest run` attempt had 551 passing tests but reported worker startup timeouts for 15 workers. Rerunning with `--pool=threads` produced the clean 149-file / 580-test pass.
  - SCOPE NOTE: Phase 4C exposes honest runtime entry points and context requirements. Phase 5 still owns implementing the full ten-method execution layer; this checkpoint does not claim every method has production runtime.
- Commit: `04e703d0` (`feat(v5-4c): add methods marketplace`)
- Push: pushed to `origin/main`
- Open blockers:
  - Phase 4D Ask homepage is next and depends on this Methods surface.
  - Full executable method runtime remains Phase 5.
- Notes for next agent: Continue with Queue 10 / Phase 4D after this checkpoint is committed and pushed. Preserve unrelated untracked `.playwright-cli/` and `docs/audits/2026-05-10-v5-final-product-qa.md`.

### 2026-05-10 - Phase 4D - Ask Homepage

- Owner: Codex
- Prompt source: `docs/build/PRAXIS_v5_BUILD_03_FRONTEND_AND_SHIP.md` Phase 4D
- Scope completed:
  - Replaced `/app` redirect with the authenticated Ask homepage.
  - Added the two required pickers: active User Model and active Context.
  - Added six Ask modes: Quick, Deep, Research, Memo, Scenario, and Auto.
  - Added deterministic intent classification, slash-command parsing, plan preview, confirmation, transparent response preview, file/source routing states, and capture-loop review actions.
  - Routed Drafts to the existing workbench memo chapter until `/draft` lands in Phase 4E, preventing a broken `/draft` prefetch before that phase exists.
  - Kept runtime copy honest: Phase 4D previews the plan and review flow without claiming every deeper method has production execution yet.
- Files changed: `/app` route, Ask homepage components, intent classifier, slash-command parser, graphify output, queue tracker, execution ledger
- Validation run:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - `npm run audit:ask-praxis-primary`
  - `npm run audit:experience-map-coherence`
  - `npm run audit:no-internal-jargon-ui`
  - `npm run audit:ai-provider-isolation`
  - `node scripts/audit-ai-routes.mjs`
  - `npx vitest run --pool=threads`
  - `graphify update .`
  - Production-mode local browser smoke on `http://127.0.0.1:3032`
- Validation result: pass
  - PASS: typecheck, build, ask-primary audit, experience-map audit, no-internal-jargon audit, AI provider isolation audit, route audit, 580 Vitest tests with `--pool=threads`, and graphify update.
  - PASS: lint completed with existing warning debt only.
  - PASS: browser smoke confirmed unauthenticated `/app` redirects to `/login?redirect=%2Fapp`, demo session reaches `/app`, Research mode preview works, plan confirmation shows answer preview, capture loop marks a standing assumption for review, source URL routing message renders, utility links avoid 404s, and desktop/mobile had no console errors.
  - ENVIRONMENT: local browser auth smoke required `COOKIE_SIGNING_SECRET=local-smoke-secret` for the production-mode server because signed session cookies are required.
  - ENVIRONMENT: one Vitest invocation timed out without results; rerunning with the same `--pool=threads` mode and a longer timeout produced the clean 149-file / 580-test pass.
- Commit: `c4938c99` (`feat(v5-4d): add ask homepage`)
- Push: pushed to `origin/main`
- Open blockers:
  - Phase 4E still owns `/draft` and `/draft/[draftId]`; Phase 4D links to the existing workbench memo chapter until that route exists.
  - Full runtime execution for all ten Methods remains Phase 5.
- Notes for next agent: Continue with Queue 11 / Phase 4E after this checkpoint is committed and pushed. Preserve unrelated untracked `.playwright-cli/` and `docs/audits/2026-05-10-v5-final-product-qa.md`.

### 2026-05-10 - Phase 4E - Drafting Studio Shell

- Owner: Codex
- Prompt source: `docs/build/PRAXIS_v5_BUILD_03_FRONTEND_AND_SHIP.md` Phase 4E
- Scope completed:
  - Added `/draft` as the Drafting Studio inbox with search, template filter, status filter, demo draft cards, and "New draft" entry.
  - Added `/draft/[draftId]` composition shell with template picker, work-episode picker, export controls, editable section blocks, and a right-side context panel.
  - Added typed Phase 4E draft shell data and five MVP drafting template registrations: UN 1-pager, Country card, Talking points, Mediation brief, and Corporate risk brief.
  - Kept AI generation, section-level actions, signed export artifacts, and final template generation honest as Phase 6 work.
  - Updated the Ask homepage Drafts utility link to route to `/draft` now that the canonical surface exists.
  - Replaced the failing drafting-template audit stub with a route/component/template audit for the Phase 4E shell.
- Files changed: `/draft` routes, draft shell components, draft template shell data, drafting-template audit, Ask homepage link, graphify output, queue tracker, execution ledger
- Validation run:
  - `npm run typecheck`
  - `npm run audit:drafting-templates-present`
  - `npm run lint`
  - `npm run build`
  - `npm run audit:routes`
  - `npx vitest run --pool=threads`
  - `graphify update .`
  - Production-mode local browser smoke on `http://localhost:3034`
- Validation result: pass
  - PASS: typecheck and `audit:drafting-templates-present`.
  - PASS: lint completed with existing warning debt only.
  - PASS: build; Next output includes `/draft` and `/draft/[draftId]`.
  - PASS: route audit and 149-file / 580-test Vitest run with `--pool=threads`.
  - PASS: graphify update.
  - PASS: browser smoke loaded `/draft`, `/draft/new?caseId=syria-2026&template=un-one-pager`, `/draft/demo-brief`, mobile `/draft`, and mobile `/draft/demo-brief` with no console errors.
  - ENVIRONMENT: `next start` still logs the repo's standalone-output warning but served the production build successfully for smoke verification.
  - ENVIRONMENT: Vitest was run with `--pool=threads` because the default worker pool has timed out on this Windows checkout during prior v5 queue runs.
- Commit: `54d46851` (`feat(v5-4e): add drafting studio shell`)
- Push: pushed to `origin/main`
- Open blockers:
  - Phase 6 still owns generated drafting templates, section-level AI actions, inline citation drag/drop, and signed export artifact behavior.
  - Phase 4E uses local typed shell/demo data and does not add Firestore draft CRUD or new security-boundary rules.
- Notes for next agent: After this checkpoint is committed and pushed, continue with Queue 12 / Phase 5 Methods. Preserve unrelated untracked `.playwright-cli/` and `docs/audits/2026-05-10-v5-final-product-qa.md`.

### 2026-05-10 - Phase 5 - MVP Methods Runtime

- Owner: Codex
- Prompt source: `docs/build/PRAXIS_v5_BUILD_03_FRONTEND_AND_SHIP.md` Phase 5
- Scope completed:
  - Added a Phase 5 MVP Method runtime layer for all 10 Methods with runtime IDs, L-pattern declarations, ontology requirements, composition, output schema validation, citations, gaps, next actions, and owner-scoped artifact posture.
  - Added `/api/methods/[methodId]/run`, using `withAuth`, `buildContextSnapshot`, existing ContextProvider isolation, and existing `toolRunArtifacts` persistence for non-demo users.
  - Updated the `/methods/[methodId]` run panel to execute methods, render findings, show provenance chips, and display persistence scope.
  - Added 10 canonical Method SKILL.md files and role-affinity mappings for the three MVP personas.
  - Extended tool-contract-v2 and tool-skills audits to cover the MVP Method layer.
  - Added a Phase 5 canary test that runs all 10 MVP Methods against a ContextSnapshot and validates output schema.
- Files changed: method catalog/runtime, method run API, method UI run view, Method skills, role affinity, tool audits, Phase 5 test, generated tool-contract audit evidence, graphify output, queue tracker, execution ledger
- Validation run:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - `npm run audit:tool-contracts`
  - `npm run audit:tool-contract-v2`
  - `npm run audit:tool-context-isolation`
  - `npm run audit:tool-canary-executable`
  - `npm run audit:tool-semantic-canaries`
  - `npm run audit:tool-marketplace`
  - `npm run audit:tool-skills-present`
  - `node scripts/audit-ai-routes.mjs`
  - `npx vitest run --pool=threads`
  - `graphify update .`
  - Production-mode local browser smoke on `http://localhost:3036`
- Validation result: pass
  - PASS: typecheck, build, route audit, tool contract audits, context isolation, canary executable audit, semantic canaries, marketplace audit, skills audit, full 150-file / 582-test Vitest run, and graphify update.
  - PASS: lint completed with existing warning debt only.
  - PASS: browser smoke loaded `/methods/contradiction-finder`, set a signed demo session, entered `syria-2026`, ran readiness, executed `/api/methods/contradiction-finder/run`, rendered findings/provenance/persistence, and reported zero console warnings/errors.
  - ENVIRONMENT: `next start` logs the repo's standalone-output warning but served the production build successfully for smoke verification.
  - ENVIRONMENT: Vitest was run with `--pool=threads`, consistent with the Windows-stable mode used in prior v5 checkpoints.
- Commit: `cca0a32e` (`feat(v5-5): implement MVP method runtime`)
- Push: pushed to `origin/main`
- Open blockers:
  - Phase 5 provides a deterministic/foundation runtime over the existing marketplace and research primitives. It does not claim every method is model-backed in production.
  - Live source depth for Deep Research still depends on provider credentials and the Phase 2C research pipeline availability.
  - Phase 6 still owns final drafting templates and section-level AI actions.
- Notes for next agent: After this checkpoint is committed and pushed, continue with Queue 13 / Phase 6 Drafting. Preserve unrelated untracked `.playwright-cli/` and `docs/audits/2026-05-10-v5-final-product-qa.md`.

### 2026-05-11 - Phase 6 - Drafting Templates And Section Actions

- Owner: Codex
- Prompt source: `docs/build/PRAXIS_v5_BUILD_03_FRONTEND_AND_SHIP.md` Phase 6
- Scope completed:
  - Replaced Phase 4E placeholder drafting templates with the five MVP Phase 6 templates: UN 1-pager, Country card, Talking points, Mediation brief, and Executive summary.
  - Added structured section metadata with header/footer, required flags, max lengths, and citation policy.
  - Added section-level AI action UI for Tighten, Rewrite, Add citation, Add scenario, and Continue.
  - Added inline citation chips and visible source/provenance posture in the editor.
  - Added authenticated draft auto-fill and refine API routes with review-required/two-phase-commit response posture.
  - Added static memo template block scaffolding under `src/lib/memo/templates/`.
  - Updated the drafting audit and added focused Phase 6 Vitest coverage.
- Files changed: draft template API, Drafting Studio components, draft auto-fill/refine API routes, memo template scaffolding, drafting-template audit, Phase 6 tests, graphify output, queue tracker, execution ledger
- Validation run:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - `npm run audit:drafting-templates-present`
  - `npm run audit:export-coverage`
  - `npm run audit:ai-provider-isolation`
  - `node scripts/audit-ai-routes.mjs`
  - `npx vitest run --pool=threads`
  - `graphify update .`
  - Production-mode local browser smoke on `http://localhost:3096`
- Validation result: pass
  - PASS: typecheck, build, drafting-template audit, export coverage audit, AI provider isolation audit, AI route audit, full 151-file / 584-test Vitest run, and graphify update.
  - PASS: lint completed with existing warning debt only.
  - PASS: browser smoke loaded `/draft/new` for all five templates, auto-filled each template, ran `/api/draft/new/auto-fill`, ran `/api/draft/new/refine?action=tighten`, verified 200 responses, checked zero browser console warnings/errors, and captured desktop/mobile screenshots at `output/playwright/phase6-draft-desktop.png` and `output/playwright/phase6-draft-mobile.png`.
  - ENVIRONMENT: `next start` logs the repo's standalone-output warning but served the production build successfully for smoke verification.
  - ENVIRONMENT: local browser auth smoke used a signed demo cookie with `COOKIE_SIGNING_SECRET=local-smoke-secret` because draft action APIs use `withAuth`.
  - ENVIRONMENT: Vitest was run with `--pool=threads`, consistent with the Windows-stable mode used in prior v5 checkpoints.
- Commit: `c781887a`
- Push: pushed to `origin/main` through tracker commit `00d5474f`
- Open blockers:
  - Section actions currently return deterministic review-required proposals rather than claiming fully autonomous production drafting.
  - Signed export artifact production behavior remains covered by existing export surfaces and later ship verification.
- Notes for next agent: After this checkpoint is committed and pushed, continue with Queue 14 / Phase 7 Demo Content. Preserve unrelated untracked `.playwright-cli/` and `docs/audits/2026-05-10-v5-final-product-qa.md`.

### 2026-05-11 - Phase 7 - Demo Content And Persona Wow Paths

- Owner: Codex
- Prompt source: `docs/build/PRAXIS_v5_BUILD_03_FRONTEND_AND_SHIP.md` Phase 7
- Scope completed:
  - Added three v5 demo Context modules: Indo-Pacific Strategic Competition 2026, AI Regulation 2026 - US Federal and State Landscape, and Food and Beverage Regulatory and Sustainability Outlook 2026.
  - Added 90 public source receipts across the three Contexts, with tiered source metadata and graph paths.
  - Added 24 situation episodes, 9 work episodes, graph counts, and 9 cached demo responses with 200ms display targets.
  - Wired v5 demo Contexts into the existing case registry so `/contexts` and `/contexts/[caseId]` can render them.
  - Added public `/demo/[contextId]` cached demo route for the three demo Contexts.
  - Added non-destructive `scripts/seed-demos/*` scripts and `npm run scripts:seed-demos` / `npm run scripts:verify-demos`.
  - Reused the three public user model seeds required by the demo paths: foreign policy analyst, domestic policy analyst, and corporate strategic analyst.
  - Completed a GCP/Firebase cleanup review and corrected local `gcloud`/ADC project alignment to `praxisbytacitus`.
- Files changed: v5 demo Context data, case registry, Context panel episode source, demo route, seed/verify scripts, Phase 7 test, package scripts, GCP/Firebase audit doc, queue tracker, execution ledger, graphify output
- Validation run:
  - `npm run scripts:verify-demos`
  - `npm run scripts:seed-demos`
  - `npx vitest run tests/demo/phase7-demo-contexts.test.ts --pool=threads`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - `npm run audit:demo-claim`
  - `npm run audit:onboarding-gate`
  - `npm run audit:stage-target-coverage`
  - `npm run audit:no-internal-jargon-ui`
  - `npm run auth:doctor`
  - `npm run audit:gcp`
  - `firebase firestore:indexes --project praxisbytacitus`
  - `firebase deploy --only firestore:rules,firestore:indexes,storage --project praxisbytacitus --dry-run`
  - `graphify update .`
- Validation result: pass
  - PASS: demo verify/seed scripts, focused Phase 7 Vitest, typecheck, build, demo-claim audit, onboarding gate, stage-target coverage, no-internal-jargon audit, auth doctor, GCP audit, Firestore index read, Firebase rules/index/storage dry run, and graphify update.
  - PASS: lint completed with existing warning debt only.
  - PASS: `npm run audit:gcp` reported 0 hard failures and 0 soft warnings after local `gcloud` and ADC quota project were aligned to `praxisbytacitus`.
  - SCOPE NOTE: seed scripts are intentionally non-destructive local bundle/verification scripts. They do not write Firestore or Storage without an explicit production data-seeding runbook.
- Commit: `ec88a6e4`
- Push: pushed to `origin/main` through tracker commit `18bff42d`
- Open blockers:
  - Phase 8 still owns landing-page polish and public narrative integration.
  - Production deploy remains manual-approval-only.
  - Artifact Registry retention cleanup, Dialectica runtime consolidation, and Cloud SQL split decisions are documented in `docs/audits/2026-05-11-GCP_FIREBASE_CLEANUP_REVIEW.md` but were not executed because they require telemetry or explicit retirement confirmation.
- Notes for next agent: After this checkpoint is committed and pushed, continue with Queue 15 / Phase 8 Landing. Preserve unrelated untracked `.playwright-cli/`, `docs/audits/2026-05-10-v5-final-product-qa.md`, and Phase 6 server logs unless Giulio explicitly asks to clean scratch output.

### 2026-05-11 - Phase 8 - Public Landing Page Rebuild

- Owner: Codex
- Prompt source: `docs/build/PRAXIS_v5_BUILD_03_FRONTEND_AND_SHIP.md` Phase 8
- Scope completed:
  - Rebuilt `/` around the v5 public demo: first viewport now leads with PRAXIS by TACITUS, persona picker, context picker, cached answer bar, and no signup wall.
  - Added selectable demo paths for Indo-Pacific, AI Regulation, and Food & Beverage Sustainability with cached answers and routes into `/demo/[contextId]`, Methods, and Drafting.
  - Added "Two contexts, one engine", 10-method grid, drafting comparison, pricing CTA, trust strip, and footer links.
  - Added optional GA4 script loading through `NEXT_PUBLIC_GA_MEASUREMENT_ID` / `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` and client events for demo question, method click, and signup/pricing click.
  - Added `/docs` as a simple public starting point so the landing footer does not route to a missing docs page.
  - Updated the proxy so `/demo`, `/demo/syria-2024`, and `/demo/[contextId]` are public read-only routes instead of redirecting signed-out users to login.
  - Updated landing/legal/jargon audits to match the Phase 8 demo-first surface.
  - Stored the provided Neon API token as Secret Manager secret `praxis-neon-api-key`; PRAXIS remains on Cloud SQL Postgres unless a later migration decision changes it.
- Files changed: landing page/layout, Phase 8 landing component, docs route, proxy, landing/legal/jargon audits, env examples, GCP/Firebase audit doc, graphify output, queue tracker, execution ledger
- Validation run:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run build`
  - `npm run audit:landing`
  - `npm run audit:no-internal-jargon-ui`
  - `npm run audit:demo-claim`
  - `npm run audit:experience-map-coherence`
  - `npm run audit:legal-pages-present`
  - `npx vitest run --pool=threads`
  - `graphify update .`
  - Production-mode local browser smoke on `http://127.0.0.1:3108`
- Validation result: pass
  - PASS: typecheck, build, landing audit, no-internal-jargon audit, demo-claim audit, experience-map audit, legal pages audit, full 152-file / 587-test Vitest run, and graphify update.
  - PASS: lint completed with existing warning debt only.
  - PASS: browser smoke loaded `/` desktop/mobile, verified first viewport and next section are visible, switched the Context picker to AI Regulation, clicked "Run cached answer", confirmed signed-out navigation to `/demo/ai-regulation-2026`, and recorded zero browser console warnings/errors.
  - Screenshots captured: `output/playwright/phase8-landing-desktop.png` and `output/playwright/phase8-landing-mobile.png`.
  - ENVIRONMENT: `next start` logs the repo's standalone-output warning but served the production build successfully for smoke verification.
  - SCOPE NOTE: Lighthouse CI and magic-link email delivery are not currently wired as local scripts in this repo; Phase 8 validated with build, static audits, full Vitest, and Playwright browser smoke.
- Commit: `b7ae568c`
- Push: pushed to `origin/main` through tracker commit `4c4ee7a0`
- Open blockers:
  - Phase 9 still owns final polish, pricing/checkout, mobile-wide route polish, persona suites, and ship/canary tasks.
  - Production deploy remains manual-approval-only.
  - Neon token is stored for future administration only; the active Postgres path is still Cloud SQL Postgres.
- Notes for next agent: After this checkpoint is committed and pushed, continue with Queue 16 / Phase 9 Polish and Ship. Preserve unrelated untracked `.playwright-cli/`, `docs/audits/2026-05-10-v5-final-product-qa.md`, Phase 6 server logs, and Phase 8 browser artifacts unless Giulio explicitly asks to clean scratch output.
