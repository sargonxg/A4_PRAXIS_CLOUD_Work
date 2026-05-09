# PRAXIS v7 Execution Todo

This is the working queue from verification pass #1. It is deliberately
skeptical: an item is not done until code, UX, audit, and production evidence
all line up.

Build-loop source of truth: `docs/v7/build/03_BUILD_LOOP.md` is installed and
guarded by `audit:v7-build-loop`. Use the A-G loop order unless `STATUS.md`
or a verification finding forces a regression fix first.

## P0 - Make v7 safe to start

1. Restore bootstrap gate health without weakening audits.
   - Fix `AGENTS.md` so it preserves the current architecture-reference markers.
   - Keep the new v7 constitution, but also reference `PRAXIS_ARCHITECTURE.md`, `PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md`, and `audit:architecture-reference`.
   - Re-run `npm run audit:architecture-reference` and then `npm run audit:gate`.

2. Install the v7 operational packet at its final repo paths.
   - Add `docs/v7/INDEX.md`. **Done locally.**
   - Add `docs/v7/prompts/BOOTSTRAP.md`, `VERIFY.md`, and `ADVANCE.md`. **Done locally.**
   - Keep `docs/v7/PROMPTS.md` as the shorter prompt library.
   - Add or later wire `audit:v7-index-current`. **Done locally and wired into `audit:gate`.**

3. Resolve the branch/doc state before feature work.
   - Current branch is `v7/bootstrap-current-state-audit`.
   - It has uncommitted docs-only changes plus this verification log.
   - Do not begin Slice 1 until the bootstrap PR is green or explicitly abandoned.

## P1 - Foundations slice

1. Add migrations.
   - `0019_cores_baseline.py`: `cores`, `core_grants`, `core_audit`.
   - `0020_cores_linkage.py`: nullable `core_id` linkage columns on existing tables.
   - Real `downgrade()` functions.
   - Status: **implemented locally**; `py_compile` clean.
   - Remaining: test upgrade and downgrade on ephemeral Postgres. Local blocker: Docker is not installed in this shell.

2. Add core schemas.
   - TypeScript/Zod under `src/lib/cores/types/`.
   - Pydantic mirrors under `backend/services/cores/types/`.
   - Cover all eight core kinds: praxis, user, team, situation, source, document, graph, output.
   - Status: **implemented locally** with focused Vitest coverage and parity audit.

3. Add feature flags.
   - `NEXT_PUBLIC_PRAXIS_V7=false` in frontend config/runtime.
   - `PRAXIS_V7_BACKEND=false` in backend settings.
   - Both must flip off -> on -> off without errors.
   - Status: **implemented locally**; `next build` and backend `py_compile` are clean. Runtime on/off smoke is still pending.

4. Add guard audits.
   - `audit:cores-schema`.
   - `audit:cores-types-parity`.
   - `audit:cores-owner-scoping`.
   - Wire to `audit:gate` only when assertions are real enough to catch drift.
   - Status: **implemented locally** and wired into `audit:gate` plus `audit:architecture-chain`; all three pass.

## P2 - Four-surface UX shell

0. Keep the v7 product map executable.
   - `src/lib/product/experience-map.ts` maps the current app into Home, Ask, Cores Library, and Outputs. **Done locally.**
   - `src/lib/agentic-workflows/registry.ts` declares the first agentic workflows. **Done locally.**
   - `audit:experience-map-coherence` verifies route coverage and workflow contracts. **Hardened locally.**
   - Focused unit tests cover the four primary surfaces, compatibility routes, and founder-priority workflows. **Done locally.**

1. Build the flagged v7 shell, not a replacement-by-stealth.
   - Header: logo, current Situation pill, Cmd-K Ask hint, user menu.
   - Sidebar/mobile primary: Home, Ask, Cores, Outputs.
   - Cores panel: last 5-10 cores as attachable handles.
   - Right rail: only Home and Ask by default.
   - Current status: dashboard command shell preview and mobile four-surface nav exist behind `praxisV7`; build and flag-on Playwright smoke pass. Full header/sidebar/right-rail replacement is still pending.

1a. Make Home real enough to guide a user.
   - Active Situation card.
   - Ask PRAXIS primary action.
   - Context-core readiness chips.
   - Next actions.
   - Cores/Outputs/Workbench links.
   - Current status: `/app/home` now renders an Ask-first `V7HomeSurface` behind the v7 flag, following `docs/v7/build/01_THE_NEW_FACE.md` Loop 1 and `docs/v7/build/02_CORES_INLINE.md` Loop 1: My Core and Case Core chips open `V7CoreDrawer`, the focused multiline Ask bar hands off to `/app/ask/[threadId]`, Cmd/Ctrl-K opens the command affordance, and starter skills/missing-context rail stay visible. It is covered by `audit:v7-shell-skeleton`, `audit:v7-inline-cores`, `audit:v7-build-loop`, and Playwright smoke. Orchestrator-backed next actions and Lighthouse pass are still pending.

2. Add v7 routes behind the flag.
   - `/app/home`.
   - `/app/ask` and `/app/ask/[threadId]`.
   - `/app/cores` and `/app/cores/[id]`.
   - `/app/outputs`.
   - Compatibility routes `/app/situation`, `/app/sources`, and `/app/advanced` render into Cores during migration.
   - Current status: four thin v7 destination routes plus `/app/ask/[threadId]` and compatibility route shells exist and are proxy-guarded behind `praxisV7`; deep route-specific functionality is still pending. Verified locally with `npm run build` and `tests/e2e/v7-shell-smoke.spec.ts`.

3. Keep the current shell alive until cutover.
   - Legacy routes redirect only after their v7 replacements work.
   - `/app/legacy/*` must exist for one release cycle before removal.
   - Current status: current shell remains untouched; no cutover redirects added.

4. Add UX audits.
   - `audit:v7-ia`.
   - `audit:v7-redirects`.
   - `audit:ask-shape`.
   - `audit:landing-five-sections`.
   - `audit:cores-sidebar-present`.
   - Current status: `audit:v7-shell-skeleton` added for the initial flagged shell preview; deeper IA audits remain pending.

## P3 - Ask PRAXIS as the front door

1. Build the Ask endpoint and thread persistence.
   - `backend/routers/ask.py`.
   - `ask_threads`, `ask_messages`, `ask_message_citations`.
   - Owner-scoped reads and writes.
   - Streaming response contract.
   - Current status: `0022_ask_threads` plus TS/Pydantic Ask contracts and `audit:ask-thread-substrate` exist locally. `backend/routers/ask.py`, authenticated `/api/backend/ask/run`, and the v7 Ask runtime panel now persist thread/message receipts, routing, core snapshots, execution metadata, and core citations. Streaming is still pending.

2. Wire Ask to cores and calibration.
   - User Core always attached.
   - Situation Core attached by default for case-bound questions.
   - Optional cores attach/detach.
   - `withCalibration` remains the prompt boundary.
   - Current status: `backend/services/cores/resolver.py` resolves implicit User/Situation Cores plus explicit attachments into a persisted `coreContext` snapshot with ontology binding, health, and advisories. `backend/services/ask/executor.py` now consumes that snapshot for direct-answer prompts and can call Vertex/Gemini when `PRAXIS_V7_ASK_AI_ENABLED=true`; the Ask UI now shows My Core and Case Core drawer chips while folding sources/documents/graph/outputs into the Case Core. Skill/subagent executors remain pending.

3. Build the routing layer.
   - Direct answer.
   - Run skill.
   - Run subagent plan.
   - Clarify.
   - Log intent, top 3 skills, chosen action, and user override.
   - Current status: `backend/services/ask/router.py` now classifies direct answers, staged skills, subagent plans, and clarifications; `/ask/run` persists the chosen route plus top candidate skill IDs on the assistant receipt and `/app/ask` displays the routing decision. Direct-answer execution and the first three read-only skill executions run from Context Cores behind a backend AI flag; subagent execution and explicit user override capture are still pending.

4. Make it feel simple.
   - One natural language box.
   - Three suggested questions.
   - Three likely skills.
   - Clear "I do not have enough context" state with a next action.
   - Current status: `/app/ask` renders `V7AskSurface` behind the v7 flag, with mode pills, attached-core chips, suggested skills, persisted Ask runtime receipts, visible routing, Context Core health, and core citations. The legacy `ChatInterface` remains visible as a compatibility path until streaming and skill/subagent execution land.

## P4 - Cores Library actually creates context

1. Situation Core panel.
   - Overview frame: four fields from today, editable.
   - Actors and Stakeholders.
   - Timeline and Events.
   - Graph and Ontology.
   - Hypotheses and Gaps.
   - Current status: `/app/cores` now renders `V7CoresSurface` behind the v7 flag. It wraps the current workbench as the live source of truth, explains the seven-chapter spine in plain language, exposes only My Core and Case Core as first-class user concepts, calls the owner-scoped `/api/backend/cores` read path, and links to existing Source, Document, Graph, Ontology, Analyst Skills, ACH, Boardroom, and Settings panels. User Core inline hydration and autosave are implemented through `GET/PATCH /cores/me`; Situation Core mutation/create/fork/share remains pending.

2. Source + Document Core panel.
   - Library with source receipts.
   - Inbox with upload/extract/index status.
   - Coverage gaps by actor/event/claim.
   - Source Scout as a Library action, not a standalone top-level surface.
   - Current status: `V7SourceDocumentCorePanel` now renders inside `/app/cores`. It shows active Situation source receipts, document/upload posture, extraction/index steps, actor/event/claim coverage gaps, and Source Scout/Add source actions. It links to the existing live workbench; runtime ingest/indexing unification is still pending.

3. Cognee stays optional and honest.
   - Disabled mode must still complete source/document/core flow.
   - Enabled mode adds recall as candidate citations, capped and never auto-promoted.

## P5 - Outputs and Analyst Skills produce real value

1. Rename Tools/Marketplace to Analyst Skills in the v7 UI.
   - Keep all 57 skill IDs.
   - Add manifest `category` and `ontology_compat`.
   - Group by practice category.
   - Structural/no-AI tier remains explicit.
   - Current status: Cores Library now renders `V7AnalystSkillsPanel` from the consolidated capability ledger, grouped as Structure, Research, Analysis, and Production. Structural capabilities are labeled `Structural - no AI`; remaining consolidated skills are labeled `Calibrated AI`. `v7-skill-manifest.ts` now derives category and ontology compatibility for every registered tool; hand-curated launch review remains pending.

2. Make skills usable through Ask.
   - Slash command.
   - Drag skill to Ask.
   - Auto-routing.
   - Manual override.
   - Current status: skills can be staged into `/app/ask?skill=<id>` from the panel, and Ask now shows suggested skills, a staged skill card, and an input/output contract. Persisted Ask routing/execution is not implemented yet.

3. Outputs surface.
   - My outputs.
   - New output wizard.
   - Policy memo, Decision brief, Talking points, Handover, Board pack, Custom.
   - Provenance integrity score on every output.
   - Export MD/DOCX/PDF.
   - Current status: `/app/outputs` now renders `V7OutputsSurface` behind the v7 flag. It presents Handover, Decision brief, Policy memo, and Talking points templates, shows My outputs buckets, explains provenance before final polish, and links to existing Ask/editor/export entry points. Runtime Output Core persistence, final export gating, and real PDF/DOCX e2e remain pending.

4. Policy Product.
   - Sit-rep pattern first.
   - Internal-only in v7.
   - Manual generation, review, export.

## P6 - Production proof

1. Fix production verification access.
   - `gcloud` auth must pass non-interactive read-only Cloud Run describes.
   - `/api/health/features` should return expected feature JSON or be intentionally removed from live claims.
   - `monitoring/v7_dashboard.json` must exist before any STATUS entry claims dashboard traffic.

2. Add deployment evidence.
   - Cloud Run revision names.
   - Feature flag values.
   - v7 dashboard live traffic.
   - Five consecutive smoke checks before cutover.

3. Add a real test-user flow.
   - Sign in.
   - Home loads.
   - Ask answers with citations.
   - Save as memo.
   - Export.
   - Repeat on mobile width.

## P7 - Beauty and "wow" polish

1. Simplify what the user sees.
   - First screen: active Situation, Ask bar, Next actions.
   - No list of 57 tools in the first-run path.
   - No "which surface do I choose?" moment.

2. Make context visible but not technical.
   - Cores appear as plain chips: My Core and Case Core. Sources, documents, graph, and outputs live inside the Case Core drawer.
   - Hover explains what context is being used.
   - Thin context produces a helpful next step, not a dead error.
   - Current status: the user-facing chip model has been simplified per `02_CORES_INLINE.md`: only My Core and Case Core are first-class. Sources, documents, graph, and outputs now appear as Case Core drawer tabs instead of separate attached-core chips. Hover/flyout and real attach/detach remain pending.

3. Make outputs investor-demo ready.
   - Every generated paragraph has citations or an explicit uncertainty note.
   - Export looks professional.
   - Provenance score is visible and understandable.
   - Mobile can ask, read, approve, and export without desktop-only controls.

4. Keep specialist power without clutter.
   - ACH, Boardroom, GraphOps, Sanctions, Diagnostics live in Cores Library specialist panels.
   - Ask can invoke them when relevant.
   - Specialist panels are searchable and explainable, not a dumping ground.

## P8 - Brief completion matrix

Use this section to prevent drift between the five v7 briefs and the actual
app. A row is complete only when the route, API, data persistence, audit, and
user-visible behavior all work.

1. Brief 00 - vision and operating principles.
   - [x] Four surfaces are documented: Home, Ask, Cores Library, Outputs.
   - [x] Eight Context Core kinds are documented and now represented in TS/Pydantic schemas.
   - [ ] User-facing product language consistently sells the simple promise: "Ask PRAXIS, preserve the desk, produce cited outputs."
   - [ ] Legacy chapter/tool density is hidden behind Cores Library specialist panels or invoked through Ask, not exposed as the first-run default.
   - [ ] Every surface uses plain language for cores: Me, Team, Situation, Sources, Documents, Graph, Outputs.

2. Brief 01 - frontend and UX.
   - [ ] Flagged v7 shell exists with mobile-first navigation.
   - [ ] Home destination opens to active Situation, Ask bar, next actions, and recent outputs.
   - [ ] Ask destination can attach/detach cores and show citations.
   - [x] Cores Library explains stakeholders, stakes, episodes, hypotheses, tried-and-failed, open threads, and counsel without technical jargon.
   - [x] Cores Library Source/Document panels show receipts, extraction status, coverage gaps, and source actions.
   - [ ] Outputs destination creates memo/brief/handover artifacts with export and provenance score. Current flagged preview explains templates and provenance, but runtime Output Core writes are still pending.
   - [x] Cores Library contains Analyst Skills, Graph, Ontology, ACH, Boardroom, admin diagnostics, and legacy power surfaces.
   - [ ] Mobile smoke covers Ask, Cores read, Source add, Output export, and specialist search.

3. Brief 02 - backend, database, deployment.
   - [x] `0019_cores_baseline` exists for `cores`, `core_grants`, `core_audit`.
   - [x] `0020_cores_linkage` exists for nullable core linkage.
   - [ ] `0021` backfill is designed and explicitly approved before prod.
   - [x] `0022` Ask threads/messages/citations exists and is owner-scoped.
   - [ ] Core and Ask routers exist only after flags and owner scoping are green. Current status: Ask router exists behind the authenticated backend proxy and owner-scoped tenant session; Core read router now exists for list/detail, while Core mutations remain pending.
   - [ ] Production flags, Cloud Run revisions, monitoring dashboard, and smoke tests are verified with working GCP auth.
   - [ ] Ephemeral Postgres migration upgrade/downgrade is part of CI.

4. Brief 03 - Context Cores and dynamic ontologies.
   - [x] Eight core kinds exist in TS/Pydantic contracts.
   - [x] Situation Core can describe local ontology extensions without adding primitives.
   - [ ] Core inheritance and attached-core resolution are implemented and audited. Current status: attached-core resolution, owner-scoped Core list/detail reads, and User Core inline hydrate/update via `GET/PATCH /cores/me` are implemented; Situation Core create/fork/share/grants remain pending.
   - [ ] Dynamic ontology binding is implemented as per-situation overlays, not primitive drift.
   - [ ] Cognee remains optional and never auto-promotes low-confidence memory into canonical ACO rows.
   - [ ] Ask PRAXIS retrieval uses User Core + Situation Core by default and can attach Source/Document/Graph/Output cores. Current status: backend core resolution now materializes implicit and explicit core attachments into an Ask `coreContext` snapshot, and direct-answer execution consumes it behind `PRAXIS_V7_ASK_AI_ENABLED`; Source/Document/Graph retrieval and Cognee recall still need to be added.

5. Brief 04 - Analyst Skills, policy products, outputs.
   - [x] Tools are presented as Analyst Skills in v7, grouped by user task instead of marketplace sprawl.
   - [ ] Ask can suggest, stage, and run a skill with visible input/output contract. Current status: suggest, stage, contract, thread persistence receipt, inspectable routing, direct-answer core execution, and first read-only skill execution for `research-sources`, `actors-stakeholders`, and `briefing-studio` are implemented locally; broader calibrated skill-run execution is pending.
   - [x] Structural/no-AI skills stay explicitly labeled.
   - [x] Every registered tool has v7 category and ontology compatibility metadata through the derived skill manifest.
   - [ ] Handover, briefing updater, assumption auditor, source checker, red team, stakeholder probe, episode closer, and consistency checker are first-class core verbs.
   - [ ] Every generated output has citations or explicit uncertainty notes.
   - [ ] Exported outputs look investor-demo ready on PDF/DOCX and retain numbered footnotes.

6. Investor-demo gate.
   - [ ] Brand new user lands in a guided, not empty, experience.
   - [ ] "Ask PRAXIS" produces a useful cited answer on a thin case and suggests the next context-building step.
   - [ ] A senior analyst handover scenario can be demoed in under five minutes.
   - [ ] The app explains tacit policy knowledge through the product flow, not a documentation detour.
   - [ ] No user-visible claim promises live Cognee, Agent Engine, team sharing, or production analytics unless the live path is verified.
