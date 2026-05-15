# PRAXIS by TACITUS — v5.0 Build Pack
# File 1 of 3 — Agent Operating Guide

**Date:** 2026-05-10 · **Status:** Authoritative for the MVP build
**Read alongside:** File 2 (Build Prompts — Backend) · File 3 (Build Prompts — Frontend & Ship)
**Vision references:** PRAXIS_VISION_v4_01_VISION.md · PRAXIS_VISION_v4_02_ARCHITECTURE.md · PRAXIS_VISION_v4_03_BUILD.md

This file is the always-read context for every coding agent (Antigravity, Claude Code, Codex) on this project. Every paste-ready prompt in Files 2 and 3 references this file by section. Read it once, keep it open in a tab, refer back to it when in doubt.

---

## 1. What you are building

A working MVP of PRAXIS — a vertical AI workbench for policy, conflict, mediation, and political work — shippable in 6-8 weeks of focused multi-agent build, on top of the existing repo at `praxis.tacitus.me` (project `praxisbytacitus`, region `us-central1`).

The MVP demonstrates three distinct buyer markets through three personas:

1. **Foreign Policy Analyst** with demo Context **"Indo-Pacific Strategic Competition 2026"** (think tanks, foreign correspondents, government-affairs, foreign ministries).
2. **Domestic Policy Analyst** with demo Context **"AI Regulation 2026 — US Federal & State Landscape"** (domestic think tanks, advocacy, legislative staff, civic-tech).
3. **Corporate Strategic Analyst** (Public Affairs + Sustainability) with demo Context **"Food & Beverage Regulatory & Sustainability Outlook 2026"** (multinationals, F&B, sustainability consultancies, government-affairs firms).

The product must produce a "this is great" reaction within 5 minutes of a new visitor landing on the public site. The first WOW arc is specified in `PRAXIS_VISION_v4_01_VISION.md` — keep it as your north star.

The MVP scope is ruthlessly cut. Not everything in the v4 vision ships in MVP. The cuts are:
- 3 domain ontologies (Conflict, Mediation, Humanitarian) of 13 — others to v1.5
- 3 work ontologies (Foreign Policy Research, Domestic Policy Analysis, Corporate Strategic Analysis) of 8 — others to v1.5
- 10 Methods (the Top 10) of 52 — others retained but not surfaced
- 5 Drafting templates of 14 — others to v1.5
- 2 subagents on Vertex Agent Engine (Memo Drafter, Output Refiner) of 7 — others to v1.5
- 1 canonical graph with Evidence + Analytical layers of 7 — full federation to v1.5
- Cognee disabled, Graphiti deferred, CozoDB deferred, Firecrawl deferred, Parallel AI deferred — all to v1.5
- Research pipeline simplified to Google Grounded Search + Wikidata SPARQL — Firecrawl + Parallel AI to v1.5
- Compare User Models surface — to v1.5
- Mobile shell — responsive web in MVP, dedicated mobile to v1.5

Everything cut from MVP is documented in v4 File 3 §1 with a rationale.

---

## 2. The 9 phases at a glance

| Phase | Goal | Sequential / Parallel | Wave | Estimated effort |
|---|---|---|---|---|
| **Phase 0** | Vision adopt + persona addendum + 4 ADRs | sequential | 1 | 1-2 days |
| **Phase 1** | Ontology layer surfacing + 3 work ontologies + tacitus-ontology MIT package | sequential | 1 | 3-5 days |
| **Phase 2A** | Context page shell + 8-panel sidebar | parallel | 2 | 1 week |
| **Phase 2B** | Document pipeline (Docling + GLiNER + Gemini extraction) | parallel | 2 | 1 week |
| **Phase 2C** | Research pipeline (Google Grounded + Wikidata) | parallel | 2 | 1 week |
| **Phase 2D** | Source Tier system + audit | parallel | 2 | 3 days |
| **Phase 2E** | Episode + Timeline module | parallel | 2 | 4 days |
| **Phase 3** | User Models module + 3 seeded personas + capture loop | parallel | 2 | 1 week |
| **Phase 4** | Methods marketplace + Top 10 Methods | parallel | 3 | 2 weeks |
| **Phase 5** | Ask homepage + Public landing | sequential | 4 | 1 week |
| **Phase 6** | Drafting Studio + 5 templates | sequential | 4 | 1.5 weeks |
| **Phase 7** | Subagent runtime on Vertex Agent Engine | parallel | 3 | 1 week |
| **Phase 8** | Demo seeding (3 Contexts) + Polish + Ship | sequential | 5 | 1.5 weeks |

**Total:** ~6-8 weeks single builder, ~5-6 weeks with three-agent parallelism (Antigravity).

The wave structure is the Antigravity multi-agent strategy. Within a wave, agents run in parallel; between waves, they run sequentially. Phase 0 must complete before Phase 1; Phase 1 must complete before Wave 2 (Phases 2A-E + 3); Wave 2 must complete before Wave 3 (Phases 4 + 7); Wave 3 must complete before Wave 4 (Phases 5 + 6); Wave 4 must complete before Wave 5 (Phase 8).

---

## 3. Read order — what every agent reads first

Before executing any phase prompt, the coding agent reads these files in order:

1. `README.md`
2. `CLAUDE.md`
3. `AGENTS.md`
4. `ARCHITECTURE.md`
5. `docs/architecture/PRAXIS_ARCHITECTURE.md` (the architecture bible — the source of all invariants)
6. `docs/architecture/PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md` (what's actually shipped vs. spec)
7. `docs/architecture/PRAXIS_VISION_v4_01_VISION.md` (the user-facing product)
8. `docs/architecture/PRAXIS_VISION_v4_02_ARCHITECTURE.md` (the technical spine)
9. `docs/architecture/PRAXIS_VISION_v4_03_BUILD.md` (the modular build plan)
10. `docs/build/PRAXIS_v5_BUILD_01_AGENT_OPERATING_GUIDE.md` (this file)
11. `docs/build/PRAXIS_v5_BUILD_02_BACKEND_PHASES_0-3.md` or `_03_FRONTEND_PHASES_4-8.md` (the file containing the current phase's prompt)
12. `STATUS.md`, `TODO.md`, `BLOCKERS.md`, `CHANGELOG.md` (last 30 days)
13. The relevant ADR(s) for the current phase
14. The skill files referenced by the current phase: `/mnt/skills/user/praxis-conventions/SKILL.md`, plus phase-specific skills

The agent does NOT read the codex cleanup prompt unless explicitly asked — that's the precondition, assumed complete.

---

## 4. Repo conventions

### 4.1 File structure (where new things go)

```
src/
  app/                              Next.js App Router routes
    (landing)/                      public landing
    (auth)/                         auth-gated layouts
    app/                            authenticated home (Ask bar)
    contexts/                       Context list + [id] page (NEW in v5)
    users/                          User Model library (NEW in v5)
    methods/                        Methods marketplace (RENAMED from /tools)
    draft/                          Drafting Studio (NEW in v5)
    settings/                       preferences, billing
    admin/                          owner-only diagnostics
    api/                            route handlers (BFF, AI, auth)
    legal/                          privacy, terms, security, retention
  components/
    ui/                             primitives (button, dialog, dropdown)
    contexts/                       Context-page panels (NEW in v5)
    users/                          User Model editor + library (NEW)
    methods/                        Methods marketplace cards (RENAMED)
    draft/                          Drafting Studio components (NEW)
    landing/                        public landing components (NEW)
  lib/
    ai/                             MODEL_MATRIX.json, providers, ask
    contexts/                       Context-type system (extended in v5)
    knowledge/                      Knowledge access (canonical graph reads)
    research/                       Research pipeline orchestration (NEW)
    sources/                        Source Tier system (NEW)
    user-models/                    User Model module (NEW in v5)
    episodes/                       Episode + Timeline module (NEW)
    methods/                        Method marketplace logic (renamed from tools)
    memo/                           Drafting Studio templates + logic
    firewall/                       Symbolic firewall
    firebase/                       Firestore access (admin.ts is locked)
  middleware.ts                     LOCKED — security boundary
backend/
  agents/                           7 subagent definitions (MVP deploys 2)
    memo_drafter/
    output_refiner/
    context_preparer/                deferred to v1.5 deploy
    source_augmenter/                deferred to v1.5 deploy
    red_team/                        deferred
    analyst_persona/                 deferred
    moderator/                       deferred
    deploy.py                        Vertex Agent Engine deployment script
  data/
    ontologies/
      specializations/               domain ontologies (3 active in MVP)
      work/                          work ontologies (3 in MVP — NEW directory)
  routers/                           FastAPI routers
  services/
    ontology_system.py
    docling_parser.py                NEW for v5
    google_grounded_search.py        NEW for v5
    wikidata_sparql.py               NEW for v5
    research/                        Research pipeline services (NEW)
  graphify_tacitus/                  Document extraction
  ai/
    MODEL_MATRIX.json                single source of model strings
    providers.py                     only place LLM SDKs are imported
cloud_functions/
  on_document_uploaded/              Document pipeline trigger
docs/
  architecture/                      vision files (read-only after Phase 0)
  adr/                               Architecture Decision Records
  audits/                            audit reports
  build/                             this build pack
  runbooks/                          operations
  v7/                                v7 brief (Slice 1 supersedes)
scripts/                             audit scripts (audit:* in package.json)
skills/                              SKILL.md files for tools (== Methods)
tests/
cloudbuild.yaml                      Cloud Build config
firestore.rules                      LOCKED — security boundary
storage.rules                        LOCKED — security boundary
```

### 4.2 The five non-negotiables (every PR honors these)

**(N1) Owner scoping.** Three independent enforcement points: TypeScript/mypy types require `ownerUid` on every model; Firestore rules check at the database layer; Postgres CHECK constraints validate. A new feature that bypasses any one of these fails review and gets reverted. Use `withCalibration` and `withContextAware` middlewares — they handle owner scoping correctly. Never read directly from `getFirestoreAdmin()` in a route handler.

**(N2) Model boundary.** All model strings live in `src/lib/ai/MODEL_MATRIX.json`. No LLM SDK is imported anywhere except `src/lib/ai/providers.ts` (TypeScript) and `backend/ai/providers.py` (Python). Use `getProModel()`, `callProModel()`, `getModel('balanced')` etc. Forbidden model strings: `gemini-2.0-*`, `gemini-2.5-*` (except `gemini-2.5-flash-lite` which stays as `cheap_classify`), `gemini-3-pro-preview`. The audit `audit:ai-provider-isolation` enforces this.

**(N3) Context boundary.** Methods read context only through `ContextProvider`. They never reach into stores directly. Method handlers receive a `ContextSnapshot` (User × Workspace × Case × Conversation) prepared by middleware; they never construct one themselves. The audit `audit:tool-context-isolation` enforces this.

**(N4) Two-phase commit.** Cross-store operations (Firestore + Postgres + Cloud Storage) go through the two-phase commit protocol: write to Firestore as `staged`, write to Postgres / Cloud Storage, write back to Firestore as `committed`. Never write to two stores without the protocol. The pattern is in `src/lib/firebase/two-phase-commit.ts`.

**(N5) Bi-temporal validity.** Every node and edge in graph operations carries `valid_from`, `valid_to`, `asserted_from`, `asserted_to`. Defaults: `asserted_from = now()` at insert; `valid_from` defaults to the document publication date when extracted, otherwise null with explicit caller acknowledgment. The audit `audit:bi-temporal-coverage` enforces this.

### 4.3 The do-not-touch list (security boundary — founder approval required)

Never modify these files without Giulio's explicit approval. If a phase prompt seems to require it, STOP and surface to Giulio:

- `src/lib/firebase/admin.ts` — Firebase admin SDK initialization
- `src/lib/api/with-auth.ts` — auth wrapper for route handlers
- `src/middleware.ts` — Next.js middleware (auth, rate-limiting)
- `firestore.rules` — Firestore security rules
- `storage.rules` — Cloud Storage security rules
- `src/lib/auth/cookie-signer.ts` — session cookie signer
- `src/lib/firebase/config.ts` — Firebase web config (has tracked hardcoded fallbacks; P6B item, not part of this build)

You may modify `firestore.rules` ONLY when adding new collections under existing patterns (e.g., `users/{uid}/user-models/{modelId}/*` is fine to add). You may NOT change existing rules or add cross-user rules.

### 4.4 The eight forbidden actions

Coding agents must never:

1. Run `terraform apply` or any `gcloud` mutating command. Infrastructure changes go through Cloud Build pipelines triggered by main-branch merges.
2. Run `firebase deploy` or `gcloud run deploy` from a development environment.
3. Commit secrets, API keys, or credentials to the repo. All secrets live in Secret Manager.
4. Bypass the audit gate (`npm run audit:gate`). Red audit means stop, not workaround.
5. Touch code paths inside `_archive/` directories. They are intentionally outside the active surface.
6. Re-enable Cognee in production. It stays `COGNEE_ENABLED=false` until the v1.5 hardening runbook is verified.
7. Re-enable ACLED. SaaS redistribution licensing risk — do not reverse without legal sign-off.
8. Change canonical model strings in `MODEL_MATRIX.json`. New task kinds require an ADR.

### 4.5 Where new things go

- A new route → `src/app/<route>/` with a `page.tsx` and any layout files
- A new API route → `src/app/api/<route>/route.ts`
- A new component → `src/components/<area>/<Component>.tsx`
- A new shared lib → `src/lib/<area>/<file>.ts`
- A new Method (tool) → `src/lib/tools/registry/<category>.<id>.ts` + `skills/tools/<id>/SKILL.md`
- A new Postgres migration → `backend/migrations/<NNNN>_<name>.py`
- A new ontology → `backend/data/ontologies/{specializations,work}/<id>.{yaml,owl,py}`
- A new subagent → `backend/agents/<agent_id>/`
- A new audit script → `scripts/audit-<name>.ts`
- A new ADR → `docs/adr/<NNNN>-<slug>.md`
- A new vision file → `docs/architecture/<file>.md` (with founder approval)
- A new runbook → `docs/runbooks/<file>.md`

---

## 5. The standard prompt frame

Every paste-ready prompt in Files 2 and 3 follows this frame. Agents internalize it; it's the contract.

```
=== PHASE [X] — [TITLE] ===

READ FIRST (in order):
1. [vision files]
2. [skill files]
3. [phase-relevant code or docs]

GOAL:
[1-3 sentences describing what this phase ships]

DELIVERABLES:
- [bullet list of every file to create/modify, by path]
- [bullet list of every audit script to add or update]
- [bullet list of every test to add]
- [bullet list of every ADR or doc to update]

DO NOT TOUCH:
- [security boundary files — always include the do-not-touch list]
- [phase-specific don't-touch — e.g., "do not touch the 7 subagents in Phase 4"]

DO NOT INVENT:
- [things to avoid — e.g., "do not introduce a new editor library; use Lexical"]

CONSTRAINTS:
- [file paths, naming, architectural commitments]

VERIFICATION (run all before opening PR):
  npm run audit:gate
  npm run typecheck
  npm run lint
  npm run test
  cd backend && pytest tests/ -v && mypy --strict
  npm run build
  [phase-specific audits]
  [phase-specific manual smoke checks]

PR TITLE: [Conventional Commits formatted]
PR BODY: [body template referencing ADR, vision file, audit results]
COMMIT MESSAGE: [Conventional Commits with vision-file reference]

ROLLBACK: [if everything goes wrong — usually `git restore --staged . && git checkout .`]
```

A good prompt in this frame is paste-ready into Antigravity / Claude Code / Codex without further context. The agent reads the prompt, executes the deliverables, runs verification, opens the PR.

---

## 6. The audit gate

`npm run audit:gate` runs the full chain. Green means mergeable. Red means stop.

**The MVP audit chain:**

```
# Foundations
npm run typecheck                      # tsc --noEmit
npm run lint                           # ESLint
npm run test                           # Vitest unit tests
pytest backend/ -q                     # Python tests
mypy backend/ --strict                 # Python type check

# Architecture invariants (must all return zero diff)
npm run audit:routes                   # canonical route map
npm run audit:ontology-mapping         # every subtype maps to a primitive
npm run audit:ontology-versions        # version monotonicity
npm run audit:context-types-parity     # TS/Pydantic byte parity
npm run audit:tool-contract-v2         # every Method conforms
npm run audit:tool-skills-present      # every Method has SKILL.md
npm run audit:tool-context-isolation   # no direct store access from Methods
npm run audit:tool-suggestion-eval     # recall@3 ≥ 80%
npm run audit:ai-provider-isolation    # no model-string leaks
npm run audit:ai-provider-vertex-default
npm run audit:llm-pattern-coverage     # NEW in v5 — L1-L12 only
npm run audit:source-tier-discipline   # NEW — every source has a tier
npm run audit:research-pipeline-shape  # NEW — pipeline conforms
npm run audit:document-pipeline-shape  # NEW — pipeline conforms
npm run audit:work-ontology-coverage   # NEW — every Context has a work ontology
npm run audit:user-model-versioning    # NEW — append-only behavior
npm run audit:drafting-templates-present  # NEW — 5 templates registered
npm run audit:firewall-coverage        # every write through firewall
npm run audit:bi-temporal-coverage
npm run audit:owner-scoping
npm run audit:cognee                   # SDK isolation, disabled-first
npm run audit:embedding-dim            # 768-dim only
npm run audit:legal-pages-present
npm run audit:type-safety
npm run audit:test-coverage
npm run audit:security                 # npm audit, pip-audit, gitleaks

# Persona suites — production bar
npm run test:e2e:personas              # 2 suites in MVP (Diplomat-IndoPacific,
                                       # Researcher-AIRegulation), 10 consecutive
                                       # green runs before main merge

# Performance budgets
npm run lh:ci                          # Lighthouse on public landing
```

Each audit script is in `scripts/audit-*.ts` and registered in `package.json` under `scripts.audit:*`. New audits added in this build are stubbed during Phase 0; they fail noisily ("v5 Phase X deliverable") until the corresponding phase ships and implements them.

---

## 7. PR conventions

**Branch naming:** `mvp/<phase>/<short-description>`. Examples: `mvp/phase-0/vision-adopt`, `mvp/phase-2a/context-page-shell`, `mvp/phase-4-method-1/deep-research-agent`.

**Commit messages:** Conventional Commits. Reference vision file sections in body.

```
feat(M2): Context page 8-panel sidebar (v5 Phase 2A)

Implements the 8-panel sidebar architecture per PRAXIS_VISION_v4_01_VISION.md
§4. Migrates workbench tabs into the new shell. References ADR-0038.

Audits: green
Tests: green (47 new unit tests, 3 new e2e)
```

**PR title:** Same format as commit. Example: `feat(M2): Context page 8-panel sidebar (v5 Phase 2A)`.

**PR body template:**

```markdown
## Phase
v5 Phase 2A — Context page shell

## Vision references
- PRAXIS_VISION_v4_01_VISION.md §4 (Context Management surface)
- PRAXIS_VISION_v4_02_ARCHITECTURE.md §3.3 (Work ontology integration)

## Deliverables
- [x] /contexts route with list view
- [x] /contexts/[id] route with 8-panel sidebar
- [x] All 8 panels render (Frame, Sources, Extraction, Work Process, Timeline, Graph, Drafts, Methods used)
- [x] Tab persistence via search params
- [x] 47 unit tests, 3 e2e tests

## Audits
- audit:gate: green
- audit:routes: green
- audit:context-types-parity: green
- audit:work-ontology-coverage: STUB (Phase 1 prerequisite)

## Smoke
- npm run dev → /contexts/syria-2026 → all 8 tabs load → no console errors

## ADR references
- ADR-0038 (two-context product model)

## Rollback
- git revert <merge-commit>
```

**Conventional commit prefixes used:**
- `feat:` — new feature
- `fix:` — bug fix
- `chore:` — non-functional changes (deps, configs)
- `refactor:` — code restructuring without behavior change
- `docs:` — documentation
- `test:` — tests
- `perf:` — performance improvement
- `build:` — build system / CI changes

**One PR per phase.** Smaller phases get one PR; larger phases (Phase 2, Phase 4) split into sub-phase PRs. Sub-phase PRs target a feature branch (e.g., `mvp/phase-2/main`) which then merges to `main` once all sub-phases are green.

---

## 8. The Antigravity multi-agent strategy

Antigravity runs multiple coding agents concurrently. The wave structure exploits this.

**Wave 1 — Sequential (Phase 0 + Phase 1):**

A single agent runs Phase 0 (vision adopt, persona addendum, ADRs, audit stubs). When Phase 0's PR merges, the same agent (or a fresh one) runs Phase 1 (ontology surfacing, work ontology authoring, tacitus-ontology MIT package). When Phase 1's PR merges, Wave 2 unlocks.

**Wave 2 — Three parallel agents (Phases 2A-E + 3):**

- **Agent A (Frontend):** Phase 2A (Context page shell + 8-panel sidebar) → Phase 2D (Source Tier UI) → Phase 2E (Episode + Timeline UI).
- **Agent B (Backend Document):** Phase 2B (Document pipeline with Docling + GLiNER + Gemini extraction).
- **Agent C (Backend Research + User Models):** Phase 2C (Research pipeline) → Phase 3 (User Models module).

The three agents work on separate file paths (no merge conflicts). Each opens its own PR. PRs merge into `mvp/wave-2/main` and are squashed into `main` together when all three audits pass.

**Wave 3 — Two parallel agents (Phases 4 + 7):**

- **Agent A:** Phase 4 (Methods marketplace + Top 10 Methods, sub-phased into Phase 4A through 4E).
- **Agent B:** Phase 7 (Subagent runtime — deploy Memo Drafter + Output Refiner to Vertex Agent Engine).

Phase 4 takes ~2 weeks; Phase 7 takes ~1 week. Phase 7 finishes first, agent B becomes available to help with Phase 4 sub-phases.

**Wave 4 — Sequential (Phases 5 → 6):**

Phase 5 (Ask homepage + Public landing) requires the Methods marketplace and Subagent runtime to be in place; runs after Wave 3. Phase 6 (Drafting Studio) requires Phase 5's transparent agent loop and the Memo Drafter subagent; runs after Phase 5.

**Wave 5 — Sequential (Phase 8):**

Demo seeding for the three demo Contexts (Indo-Pacific, AI Regulation, F&B Sustainability), polish, persona suites in CI, canary deploy. Single agent.

### 8.1 Conflict resolution between parallel agents

When two parallel agents touch the same file, the second to commit rebases on the first. If a logical conflict arises (e.g., both agents add a field to the same type), the agents coordinate via:

1. PR comments noting the conflict.
2. The user (Giulio) arbitrates if the agents can't resolve.
3. Worst case: one agent's PR holds; the other rebases.

**Owned file paths per agent (Wave 2):**

| File path | Owned by |
|---|---|
| `src/app/contexts/**` | Agent A (Frontend) |
| `src/components/contexts/**` | Agent A |
| `src/lib/sources/**` | Agent A (UI) + Agent B (backend write) |
| `src/lib/episodes/**` | Agent A |
| `cloud_functions/on_document_uploaded/**` | Agent B (Document) |
| `backend/services/docling_parser.py` | Agent B |
| `backend/graphify_tacitus/**` | Agent B |
| `src/lib/research/**` | Agent C (Research) |
| `backend/services/research/**` | Agent C |
| `backend/services/google_grounded_search.py` | Agent C |
| `backend/services/wikidata_sparql.py` | Agent C |
| `src/app/users/**` | Agent C (User Models — second half of agent C's work) |
| `src/lib/user-models/**` | Agent C |
| `src/components/users/**` | Agent C |

Shared file paths that need coordinated edits (announce in chat before editing):
- `src/types/context.ts` — every agent extending `UserContext`, `WorkspaceContext`, `CaseContext`
- `backend/types/context.py` — Pydantic mirror of above
- `src/lib/ai/MODEL_MATRIX.json` — adding a new task kind
- `package.json` — adding new audit scripts
- `firestore.rules` — adding new collection rules

Type extensions in `src/types/context.ts` and `backend/types/context.py` must be byte-parity; update both in the same commit. The audit `audit:context-types-parity` catches drift.

---

## 9. Pre-flight and post-flight checklists

### 9.1 Pre-flight (before starting any phase)

- [ ] Read the Read Order in §3.
- [ ] Confirmed which phase you're on. Check it's not in `mvp/phase-X-skipped.md` (skipped phases retired).
- [ ] Pulled latest from `main`. Branched from `main` with the right name per §7.
- [ ] Verified the prerequisite phases are merged. Phase 1 requires Phase 0; Wave 2 requires Phase 1; etc.
- [ ] `npm install`, `pip install -r backend/requirements.txt` ran clean.
- [ ] `npm run audit:gate` ran clean on `main` (if it's red on main, don't start).
- [ ] `npm run dev` starts cleanly. `localhost:3000` loads.
- [ ] You have the relevant skill files open: `/mnt/skills/user/praxis-conventions/SKILL.md`.

### 9.2 Post-flight (before opening PR)

- [ ] All deliverables in the prompt are complete.
- [ ] All audits in §6 pass.
- [ ] All new tests pass; existing tests still pass.
- [ ] `npm run build` succeeds.
- [ ] `npm run dev` runs without console errors on the affected routes.
- [ ] If the phase touched Postgres: migration applied locally and tested with `pytest backend/tests/test_migration_<NNNN>.py`.
- [ ] If the phase touched Firestore: rules updated if necessary; emulator test passes.
- [ ] If the phase touched Vertex Agent Engine: deploy script tested in staging (not prod).
- [ ] PR body filled out per §7 template. ADRs referenced. Vision sections referenced.
- [ ] Branch pushed; PR opened. Self-review done before requesting Giulio's review.
- [ ] Slack / chat: post a one-line summary in the build channel.

### 9.3 Post-merge (after PR merges to main)

- [ ] Verify the merge triggered Cloud Build successfully.
- [ ] Verify the canary revision deploys cleanly (5% traffic).
- [ ] Watch error rate for 30 minutes. If clean, promote to 100%.
- [ ] Update `STATUS.md` with phase completion. Update `CHANGELOG.md [Unreleased]`.
- [ ] Close the phase in `TODO.md`.
- [ ] If the phase shipped a new audit: add it to `audit:gate` (not just registered, but in the chain).

---

## 10. When in doubt — escalation rules

Coding agents are decisive but not reckless. Apply these rules in order:

**Rule 1 — Read more.** If the answer is in the vision files, the architecture bible, or the existing code, find it. 80% of doubt is "I haven't read enough yet."

**Rule 2 — Default to KEEP, not delete.** If unsure whether code/file is dead, archive it under `_archive/`. Reversibility is cheap; wrong delete is expensive.

**Rule 3 — Default to typed, not loose.** If a new field could be `any` or `string | undefined`, make it typed. The audit chain catches loose types eventually; better to be tight up front.

**Rule 4 — Default to MVP scope.** If a feature seems valuable but isn't in the phase's deliverables list, defer it. Add a TODO comment with `// MVP-defer: <reason> (v1.5 or v2)`. The MVP ships in 6-8 weeks; everything not on the path defers.

**Rule 5 — When the prompt seems to require touching a do-not-touch file, STOP.** Surface to Giulio in a PR draft or chat. Do not edit security boundaries.

**Rule 6 — When the audit gate goes red and you can't fix in 30 minutes, STOP.** Don't workaround. Open a draft PR with the failure trace and ask.

**Rule 7 — When adding a new architectural pattern or new dependency, open an ADR first.** Don't add a new database, new ontology category, new model task kind, new framework, or new top-level route without an ADR signed by Giulio.

**Rule 8 — When in genuine doubt about a design choice, decide in favor of the simpler option for MVP.** Document the deferred complexity in a TODO comment. Ship the simple version first.

---

## 11. The MVP definition of done

The MVP ships when ALL of the following are true:

- [ ] All 9 phases completed.
- [ ] `npm run audit:gate` passes on `main` for 7 consecutive days.
- [ ] Two persona suites (Diplomat-IndoPacific, Researcher-AIRegulation) pass for 10 consecutive runs.
- [ ] The public landing at `praxis.tacitus.me` loads in <1.5s on Lighthouse mobile (4G simulated).
- [ ] The first WOW journey (`PRAXIS_VISION_v4_01_VISION.md` §9) executes end-to-end on production.
- [ ] All three demo Contexts (Indo-Pacific, AI Regulation, F&B Sustainability) are seeded with real sources, and Ask + Methods + Drafting work against each.
- [ ] All three User Models (Foreign Policy Analyst, Domestic Policy Analyst, Corporate Strategic Analyst) are seeded and forkable.
- [ ] All Top 10 Methods are surfaced and runnable.
- [ ] All 5 Drafting templates produce real DOCX output.
- [ ] Stripe checkout works end-to-end for Solo and Team plans.
- [ ] Magic-link login via Firebase Auth works.
- [ ] SOC 2 Type 1 audit kickoff scheduled.
- [ ] Sentry + Cloud Logging dashboards are live and clean.
- [ ] First three friendly customers have signed up and produced at least one real draft each.

When this list is fully checked, the MVP is shippable.

---

## 12. Existing assets — respect what's there

The repo has accumulated significant infrastructure. The MVP build leans on it heavily. Coding agents respect these existing assets and do not reinvent them.

| Asset | What it is | Usage in MVP |
|---|---|---|
| `src/lib/tools/registry/` | 52 existing tools | retag into AI/Research/Deterministic; keep all; surface 10 in MVP |
| `src/lib/contexts/` | UserContext / WorkspaceContext / CaseContext / ConversationContext | extend with new fields; do not rewrite |
| `src/lib/firewall/` | Symbolic firewall (structural validation) | use as-is for all graph writes |
| `src/lib/firebase/two-phase-commit.ts` | Two-phase commit protocol | use for cross-store ops |
| `src/lib/ai/MODEL_MATRIX.json` | Model task-kind matrix | extend if new task kind needed (with ADR); keep as single source |
| `src/lib/ai/providers.ts` | LLM SDK isolation | only place SDKs imported; wrap new models here |
| `backend/agents/` | 7 subagent definitions (LangGraph) | deploy 2 in MVP; the other 5 stay as code, deferred deployment |
| `backend/services/ontology_system.py` | Ontology resolver | extend with work-ontology resolution; don't rewrite |
| `backend/data/ontologies/specializations/` | 13 domain ontology specs | 3 active in MVP (Conflict, Mediation, Humanitarian); others stay as code, hidden in UI |
| `backend/graphify_tacitus/` | Document extraction pipeline | use as the L2 typed extraction layer |
| `cloud_functions/on_document_uploaded/` | Document pipeline trigger | extend with GLiNER and Docling; don't rewrite |
| `src/components/ui/` | UI primitives (button, dialog, etc.) | use; don't reinvent |
| `src/components/cytoscape/` | Graph visualization wrapper | use for the Graph panel |
| `src/components/lexical/` | Drafting editor wrapper | use for Drafting Studio |
| `src/lib/memo/templates/` | Memo template registry | extend with 5 MVP templates; don't rewrite |
| `src/lib/firebase/admin.ts` | Firebase admin (LOCKED) | DO NOT TOUCH |
| `firestore.rules` | Firestore security rules | extend ONLY for new collection patterns; never change existing |
| `storage.rules` | Cloud Storage security rules | LOCKED for MVP |
| `cloudbuild.yaml` | Cloud Build pipeline | extend if new build step needed; coordinate with Giulio |
| `terraform/` | GCP infrastructure as code | LOCKED — agents do not run terraform |
| `scripts/audit-*.ts` | Audit scripts (~30 active) | extend with new audits; never delete |
| `tests/e2e/personas/` | Persona test suites | extend with 2 MVP persona suites |
| `docs/runbooks/` | Operations runbooks | reference; extend if new runbook needed |

---

## 13. Files in this build pack

You are reading **File 1 of 3** — the Agent Operating Guide.

**File 2 of 3** — `PRAXIS_v5_BUILD_02_BACKEND_PHASES_0-3.md` — contains paste-ready prompts for:
- Phase 0: Vision adopt + persona addendum + 4 ADRs
- Phase 1: Ontology layer surfacing + 3 work ontologies + tacitus-ontology MIT publication
- Phase 2: Context module (5 sub-phases — page shell, Document pipeline, Research pipeline, Source Tiers, Episodes)
- Phase 3: User Models module + 3 seeded personas + capture loop

**File 3 of 3** — `PRAXIS_v5_BUILD_03_FRONTEND_PHASES_4-8.md` — contains paste-ready prompts for:
- Phase 4: Methods marketplace + Top 10 Methods (5 sub-phases)
- Phase 5: Ask homepage + Public landing
- Phase 6: Drafting Studio + 5 templates
- Phase 7: Subagent runtime on Vertex Agent Engine
- Phase 8: Demo seeding (3 Contexts) + Polish + Persona suites + Ship

Each prompt in Files 2 and 3 follows the standard frame in §5 of this file. Read this file once, keep it open, refer back when in doubt.

---

## 14. The closing thought

PRAXIS as the operating environment for high-stakes policy reasoning is technically ambitious and operationally tractable. The discipline that makes it tractable is everywhere visible in this guide: every phase has an audit gate, every change goes through an ADR, every Method declares its L-pattern, every source carries a tier, every node carries a `valid_from`, every model string lives in one file, every owner has three independent enforcement points.

The discipline is not overhead. It is the moat. It is what lets a small team (or a team of agents) ship a defense-grade vertical AI workbench in 6-8 weeks. It is what lets Antigravity run three coding agents in parallel without merge conflicts becoming the bottleneck. It is what lets a procurement officer say *yes* the moment they audit the architecture.

Three personas. Three demo Contexts. Three work ontologies. Top 10 Methods. Five Drafting templates. Two subagents on Vertex Agent Engine. One canonical graph. One Drafting Studio. One bar above two pickers. One ontology layer underneath. The simplicity is the product. The discipline is the moat.

Read the right files. Run the right audits. Ship the right phase. Trust the chain.

Build it. Ship it. Watch it compound.

---

*End of File 1 of 3. Open File 2 — Backend Phases 0-3 — for Phase 0 prompts.*
