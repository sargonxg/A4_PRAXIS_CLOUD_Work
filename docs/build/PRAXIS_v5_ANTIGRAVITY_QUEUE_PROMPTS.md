# PRAXIS v5 Antigravity Queue Prompts

Date: 2026-05-10
Repo: `C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work`
Production target: `https://praxis.tacitus.me`

This file is built for Antigravity queueing. The fenced `text` blocks below
are the exact messages to copy into Antigravity.

## Copy/Paste Instructions

1. Open this file in Antigravity.
2. For each queued job, paste `COPY BLOCK MASTER` first.
3. Then paste the numbered `COPY BLOCK` for that job directly below it in the
   same Antigravity message.
4. Copy only the fenced block under each section: start after the opening
   ` ```text ` line and stop before the closing ` ``` ` line.
5. Do not copy the Markdown heading into the prompt unless you want to.
6. Do not queue dependency-blocked phases as active work. Queue them as paused,
   waiting, or manual-next if Antigravity supports that.
7. Phase 0 and Phase 1 must run one after the other.
8. After Phase 1 completes, queue `03`, `04`, and `05` together as the only
   planned parallel batch.
9. Run `06 Wave 2 Integration Gate` after all three Wave 2 lanes are pushed.
10. Run `17 Production Deploy and Live Verification` only after Giulio explicitly
   approves production deployment.

## What To Queue

Copy `MASTER` plus one numbered block for each queued job:

| Queue # | Copy This Block | When To Run | Parallel? |
|---|---|---|---|
| MASTER | `COPY BLOCK MASTER` | Paste before every numbered block | N/A |
| 00 | `COPY BLOCK MASTER` + `00 Preflight Orchestrator` | First | No |
| 01 | `COPY BLOCK MASTER` + `01 Phase 0` | After 00 | No |
| 02 | `COPY BLOCK MASTER` + `02 Phase 1` | After 01 is pushed | No |
| 03 | `COPY BLOCK MASTER` + `03 Wave 2 Lane A` | After 02 is pushed | Yes, with 04 and 05 |
| 04 | `COPY BLOCK MASTER` + `04 Wave 2 Lane B` | After 02 is pushed | Yes, with 03 and 05 |
| 05 | `COPY BLOCK MASTER` + `05 Wave 2 Lane C` | After 02 is pushed | Yes, with 03 and 04 |
| 06 | `COPY BLOCK MASTER` + `06 Wave 2 Integration Gate` | After 03, 04, and 05 are pushed | No |
| 07 | `COPY BLOCK MASTER` + `07 Phase 4A` | After 06 | No |
| 08 | `COPY BLOCK MASTER` + `08 Phase 4B` | After Phase 3 from lane C is complete | No |
| 09 | `COPY BLOCK MASTER` + `09 Phase 4C` | After 07 | No |
| 10 | `COPY BLOCK MASTER` + `10 Phase 4D` | After 09 | No |
| 11 | `COPY BLOCK MASTER` + `11 Phase 4E` | After 07 and drafting prerequisites are clear | No |
| 12 | `COPY BLOCK MASTER` + `12 Phase 5 Methods` | After 09 | Usually one method group at a time |
| 13 | `COPY BLOCK MASTER` + `13 Phase 6 Drafting` | After 11 and needed methods | No |
| 14 | `COPY BLOCK MASTER` + `14 Phase 7 Demo Content` | After Waves 1-3 app work is complete | No |
| 15 | `COPY BLOCK MASTER` + `15 Phase 8 Landing` | After 14 | No |
| 16 | `COPY BLOCK MASTER` + `16 Phase 9 Polish and Ship` | After 15 | No |
| 17 | `COPY BLOCK MASTER` + `17 Production Deploy and Live Verification` | After 16 and explicit deploy approval | No |
| 18 | `COPY BLOCK MASTER` + `18 Final Product QA and Red-Team Review` | After live deployment or final staging build | No |

## Live Queue Status

Last updated: 2026-05-11 by Codex

Use this table to see what has already been completed in this checkout and what
still needs to be prompted or run next. The copy blocks below remain the source
prompts; this status table is the operational tracker.

| Queue # | Status | Commit / Evidence | Next Action |
|---|---|---|---|
| 00 | complete | Preflight represented in Phase 0/1 ledger entries | No action unless cloud credentials drift. |
| 01 | complete | `483d3605`, `df69de86` | Done. |
| 02 | complete | `924ed579`, `79cbec0b` | Done. |
| 03 | complete | `d9f7d64d`; Lane A validation: typecheck, build, lint, full audit gate, vitest, browser smoke, graphify | Done; continue with 04. |
| 04 | complete | `7422b0aa`; Phase 2B validation: typecheck, build, lint, full audit gate, document audits, focused Python tests, vitest | Done. |
| 05 | complete | `9e4d58bc`, `638c94d8`; Lane C validation: typecheck, build, lint, full audit gate, research/user-model audits, provider audits, focused Python tests, vitest | Done. |
| 06 | complete | `b6a23d86`, `9f7f0d4b`; integration validation: lint, build/typecheck, vitest, full audit gate, browser smoke, graphify | Done. |
| 07 | complete | `330b1bbd`, `3f467af1`; Phase 4A validation: lint, typecheck, build, route/UI audits, vitest, browser smoke, graphify | Done. |
| 08 | complete | `8e5df782`, `e74792b8`; Phase 4B validation: build/typecheck/lint, user-model and owner-scope audits, vitest, browser smoke, graphify | Done. |
| 09 | complete | `04e703d0`, `7fa55185`; Phase 4C validation: typecheck, lint, build, method/tool audits, route audit, vitest, browser smoke, graphify | Done. |
| 10 | complete | `c4938c99`, `995e5e8e`; Phase 4D validation: typecheck, lint, build, Ask/UI/provider audits, route audit, vitest, browser smoke, graphify | Done. |
| 11 | complete | `54d46851`, `b40cb735`; Phase 4E validation: typecheck, lint, build, route audit, drafting-template audit, vitest, browser smoke, graphify | Done. |
| 12 | complete | `cca0a32e`, `951ae357`; Phase 5 validation: typecheck, lint, build, method/tool audits, vitest, browser smoke, graphify | Done. |
| 13 | complete | `c781887a`; Phase 6 validation: typecheck, lint, build, drafting/export/provider audits, AI route audit, full Vitest, browser smoke, graphify | Done. |
| 14 | complete | `ec88a6e4`, `18bff42d`; validation: demo seed/verify scripts, focused Vitest, typecheck, lint, build, demo/onboarding/stage/jargon audits, GCP/Firebase review, graphify | Done. |
| 15 | complete | `b7ae568c`, `4c4ee7a0`; validation: typecheck, lint, build, landing/legal/demo/experience/jargon audits, full Vitest, browser smoke, graphify | Done. |
| 16 | in-progress | `da561346`, `82d3de84`; graph polish checkpoint validation: typecheck, scoped lint, build, landing/demo/jargon audits, browser smoke, graphify | Continue remaining Phase 9 ship work: checkout/pricing wiring, wider route polish, persona suites, canary/ship prep. |
| 17 | manual-approval-only | pending | Requires Giulio's explicit production deploy approval. |
| 18 | blocked | pending | Run after live deployment or final staging build. |

## Recommended Antigravity Setup

Create the remaining queue like this:

- Completed in this checkout: `00` through `15`.
- Active in progress: `16 Phase 9 Polish and Ship`.
- Completed Phase 9 sub-checkpoint on 2026-05-11: landing and signed-out demo graph visualization polish, with local build/browser evidence. Remaining Phase 9 ship items are still open until pricing/checkout, broader route polish, persona suites, and canary preparation are complete.
- Sequential paused ship work after `16`: production deploy remains manual approval only.
- Final manual approval steps: `17`, then `18`.

Use separate queued agents only when the table says parallel-safe. If multiple
agents are active, each agent must own a disjoint file area and update the
ledger before touching code.

## COPY BLOCK MASTER - Paste Before Every Numbered Block

```text
Universal PRAXIS v5 rules for this queued job:

Workspace:
C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work

This repository is shared by Codex, Claude Code, Antigravity agents, and human
operators. Preserve unrelated uncommitted work. Never reset, checkout, or
overwrite another agent's edits.

Before editing:
git pull origin main
git status --short --branch
git log --oneline -5
npm install

If the tree is dirty, inspect the changes before editing. Do not continue if
the dirty files overlap your assigned phase in a way that cannot be reconciled
safely.

Read first:
1. AGENTS.md
2. CLAUDE.md
3. docs/build/PRAXIS_v5_EXECUTION_LEDGER.md
4. docs/build/ANTIGRAVITY_V5_HANDOFF.md
5. docs/build/PRAXIS_v5_BUILD_01_AGENT_OPERATING_GUIDE.md
6. The assigned phase prompt in docs/build/PRAXIS_v5_BUILD_02_BACKEND_PHASES_0-3.md or docs/build/PRAXIS_v5_BUILD_03_FRONTEND_AND_SHIP.md

Non-negotiables:
- Do not run git add . Stage explicit files only.
- Commit and push to main only for coherent validated checkpoints.
- Do not run mutating gcloud, firebase deploy, gcloud run deploy, or terraform
  apply unless Giulio explicitly authorizes that exact deploy step.
- Do not hardcode secrets. Do not print secrets.
- Do not bypass withCalibration, owner scoping, ContextProvider boundaries, or
  the two-phase commit protocol.
- Do not touch security-boundary files unless the assigned prompt explicitly
  requires it and Giulio has approved it:
  - src/lib/firebase/admin.ts
  - src/lib/api/with-auth.ts
  - src/middleware.ts
  - firestore.rules
  - storage.rules
  - src/lib/auth/cookie-signer.ts
  - src/lib/firebase/config.ts
- After code changes, run graphify update . when practical. If skipped, record
  why in docs/build/PRAXIS_v5_EXECUTION_LEDGER.md.
- Browser verification is required for user-facing surfaces.
- Production-readiness means local checks plus live checks on
  https://praxis.tacitus.me, not just a green build.

Commit protocol:
1. Update docs/build/PRAXIS_v5_EXECUTION_LEDGER.md with status, validation,
   commit, push, blockers, and notes for the next agent.
2. Run the assigned verification commands.
3. Run git diff --check and git diff --cached --check.
4. Stage explicit intended files only.
5. Commit only if validation is green or expected-red behavior is explicitly
   documented by the phase prompt.
6. Before push: git fetch origin main; git pull --rebase origin main.
7. Push to origin main only after a clean rebase and clean status.

If validation fails, do not push broken code. Record the blocker in the ledger
and stop with a concise blocker report.
```

## Universal Rules For Every Prompt

If Antigravity does not support combining two copied blocks into one queued
message, manually paste `COPY BLOCK MASTER` first and the numbered block below
it in the same message. The bullets below are kept for quick scanning:

- Preserve unrelated uncommitted work. Never reset, checkout, or overwrite
  another agent's edits.
- Do not run `git add .`. Stage explicit files only.
- Commit and push to `main` only for coherent validated checkpoints.
- Do not run mutating `gcloud`, `firebase deploy`, `gcloud run deploy`, or
  `terraform apply` unless Giulio explicitly authorizes that exact deploy step.
- Do not hardcode secrets. Do not print secrets.
- Do not bypass `withCalibration`, owner scoping, ContextProvider boundaries,
  or the two-phase commit protocol.
- Do not touch security-boundary files unless the assigned prompt explicitly
  requires it and Giulio has approved it:
  - `src/lib/firebase/admin.ts`
  - `src/lib/api/with-auth.ts`
  - `src/middleware.ts`
  - `firestore.rules`
  - `storage.rules`
  - `src/lib/auth/cookie-signer.ts`
  - `src/lib/firebase/config.ts`
- After code changes, run `graphify update .` when practical. If skipped,
  record why in the ledger.
- Browser verification is required for user-facing surfaces.
- Production-readiness means local checks plus live checks on
  `https://praxis.tacitus.me`, not just a green build.

---

## COPY BLOCK 00 - Preflight Orchestrator

```text
You are the PRAXIS v5 preflight orchestrator.

Workspace:
C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work

Goal:
Prepare the shared checkout for the v5 MVP build. Do not implement a product
phase yet. Verify the repo, cloud/Firebase baseline, local build baseline,
ledger, and queue readiness. Update docs/build/PRAXIS_v5_EXECUTION_LEDGER.md
with the current preflight result.

Read first:
1. AGENTS.md
2. CLAUDE.md
3. docs/build/PRAXIS_v5_EXECUTION_LEDGER.md
4. docs/build/ANTIGRAVITY_V5_HANDOFF.md
5. docs/build/PRAXIS_v5_BUILD_01_AGENT_OPERATING_GUIDE.md
6. docs/build/PRAXIS_v5_BUILD_02_BACKEND_PHASES_0-3.md phase headings only
7. docs/build/PRAXIS_v5_BUILD_03_FRONTEND_AND_SHIP.md phase headings only

Run:
git pull origin main
git status --short --branch
git log --oneline -5
npm install
npm run auth:doctor
npm run audit:gcp
npm run audit:gcp-production-posture
npm run typecheck
npm run build
npm run lint
node scripts/audit-ai-routes.mjs
npm run audit:repo-shape
npx vitest run

Also inspect without printing secrets:
- .firebaserc
- firebase.json
- presence of .env.local, backend/.env, backend/firebase-service-account.json
- gcloud active account/project
- Firebase active project

Expected known risks from prior preflight:
- Application Default Credentials may need browser reauthentication.
- Scheduler jobs may be paused.
- Firestore PITR/delete protection may be disabled.
- Terraform state bucket may be unreadable to the current user.
- npm audit may report dependency vulnerabilities.

If these still appear, record them as setup warnings, not automatic blockers,
unless they block the phase queue.

Deliverable:
- Update docs/build/PRAXIS_v5_EXECUTION_LEDGER.md with a "Preflight" entry.
- Do not change product code.
- Commit and push docs-only preflight updates only if the ledger changed and
  the tree contains only intended docs edits.

Stop condition:
If git status is dirty with unknown changes, inspect and record them. Do not
overwrite them. If the dirty changes are not yours and are broad, stop and ask
Giulio how to coordinate with Claude Code.
```

---

## COPY BLOCK 01 - Phase 0 - Vision Adopt, Personas, ADRs, Audit Stubs

```text
You are implementing PRAXIS v5 Phase 0 only.

Workspace:
C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work

Before editing:
git pull origin main
git status --short --branch
git log --oneline -5
npm install

If the worktree is dirty, inspect it and preserve unrelated work.

Read first:
1. AGENTS.md
2. CLAUDE.md
3. docs/build/PRAXIS_v5_EXECUTION_LEDGER.md
4. docs/build/PRAXIS_v5_BUILD_01_AGENT_OPERATING_GUIDE.md
5. docs/build/PRAXIS_v5_BUILD_02_BACKEND_PHASES_0-3.md, Prompt 0.A
6. README.md
7. ARCHITECTURE.md
8. docs/architecture/PRAXIS_ARCHITECTURE.md
9. docs/architecture/PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md
10. docs/v7/STATUS.md
11. STATUS.md, TODO.md, BLOCKERS.md, CHANGELOG.md

Goal:
Complete Prompt 0.A exactly: adopt the v4/v5 vision direction, lock the
three MVP personas, add the four ADRs at Proposed status, align handoff docs,
trim TODO into v5 shape, add the v5 audit stubs, and mark Phase 0 status in
the execution ledger.

Important:
- Do not start Phase 1.
- Keep this docs/audit-stub oriented.
- Do not modify security-boundary files.
- If Prompt 0.A refers to unavailable docs or commands, record the mismatch in
  the ledger and make the closest repo-consistent update. Do not invent hidden
  source material.

Expected deliverables:
- ARCHITECTURE.md references v4/v5 vision files as canonical direction.
- AGENTS.md and CLAUDE.md handoff stays aligned with docs/build.
- ADRs 0037-0040 exist in docs/adr with Proposed status.
- ADR-0038 includes Persona Decision with the three MVP personas.
- docs/v7/STATUS.md maps Slice 1 to v5 Phase 1 where appropriate.
- TODO.md is trimmed and archived content is preserved under docs/_archive.
- 8 v5 audit stubs exist and are wired to audit:v5-readiness, but not into
  audit:gate yet.
- STATUS.md includes v5 MVP phase plan.
- docs/build/PRAXIS_v5_EXECUTION_LEDGER.md has a Phase 0 checkpoint.

Verification:
npm run lint
npm run typecheck
npm run build
npx vitest run
npm run audit:gate
npm run audit:v5-readiness
git diff --check
git diff --cached --check

Expected nuance:
audit:v5-readiness may be red if the new stubs intentionally fail. Record that
as expected only if Prompt 0.A explicitly calls for failing stubs and all other
gates are green.

Commit:
Stage explicit Phase 0 files only. Commit:
chore(v5-phase-0): adopt vision and readiness stubs

Before push:
git fetch origin main
git pull --rebase origin main
git push origin main

If validation fails, do not push. Update the ledger with blockers and stop.
```

---

## COPY BLOCK 02 - Phase 1 - Ontology Layer and Work Ontologies

```text
You are implementing PRAXIS v5 Phase 1 only.

Workspace:
C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work

Prerequisite:
Phase 0 must be complete, committed, pushed, and marked complete in
docs/build/PRAXIS_v5_EXECUTION_LEDGER.md. If not, stop.

Before editing:
git pull origin main
git status --short --branch
git log --oneline -5
npm install

Read first:
1. docs/build/PRAXIS_v5_EXECUTION_LEDGER.md
2. docs/build/PRAXIS_v5_BUILD_01_AGENT_OPERATING_GUIDE.md
3. docs/build/PRAXIS_v5_BUILD_02_BACKEND_PHASES_0-3.md, Prompt 1.A
4. docs/architecture/PRAXIS_ARCHITECTURE.md
5. docs/architecture/PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md
6. docs/architecture/ONTOLOGY_SYSTEM.md
7. backend/services/ontology_system.py
8. backend/data/ontologies/specializations/
9. docs/adr/0038-*.md

Goal:
Complete Prompt 1.A: surface the existing domain ontologies, author the 3 MVP
work ontologies, add tacitus-ontology package/repo scaffolding only as allowed
by the repo, and wire audits/tests for Phase 1.

Do not:
- Start Wave 2.
- Mutate production infrastructure.
- Invent new MVP personas or ontologies beyond the prompt.
- Rewrite existing ontology specs unnecessarily.

Implementation expectations:
- Prefer repo patterns and existing ontology services.
- Keep ontology data typed and parseable.
- Use structured YAML/Pydantic/TypeScript types instead of ad hoc strings.
- MVP active work ontologies:
  - Foreign Policy Research
  - Domestic Policy Analysis
  - Corporate Strategic Analysis
- MVP active domain ontologies:
  - Conflict
  - Mediation
  - Humanitarian
- Deferred ontologies must be visible as deferred, not deleted.

Verification:
npm run lint
npm run typecheck
npm run build
npx vitest run
pytest backend/ -q
npm run audit:ontology
npm run audit:ontology-mapping
npm run audit:ontology-system
npm run audit:work-ontology-coverage
npm run audit:llm-pattern-coverage
npm run audit:architecture-reference
npm run audit:repo-shape
node scripts/audit-ai-routes.mjs
graphify update .
git diff --check
git diff --cached --check

If pytest or graphify is unavailable, record exact failure and continue only if
all relevant JS/build/audit gates pass and the failure is environmental.

Commit:
feat(v5-phase-1): surface ontologies and add work ontology layer

Push only after validation and ledger update.
```

---

## COPY BLOCK 03 - Wave 2 Lane A - Context Shell, Source Tier, Episodes

```text
You are Wave 2 Lane A for PRAXIS v5.

Workspace:
C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work

Parallel-safe ownership:
- Phase 2A Context page shell + 8-panel sidebar
- Phase 2D Source Tier system + badges + audit
- Phase 2E Episode + Timeline module

Do not own:
- Phase 2B document pipeline internals
- Phase 2C research pipeline internals
- Phase 3 user-model internals

Prerequisite:
Phase 1 complete and pushed. If not, stop.

Before editing:
git pull origin main
git status --short --branch
git log --oneline -5
npm install

Read:
1. docs/build/PRAXIS_v5_EXECUTION_LEDGER.md
2. docs/build/PRAXIS_v5_BUILD_01_AGENT_OPERATING_GUIDE.md
3. docs/build/PRAXIS_v5_BUILD_02_BACKEND_PHASES_0-3.md:
   - Prompt 2A.A
   - Prompt 2D.A
   - Prompt 2E.A
4. Existing context/workbench/situation components and routes.
5. Existing source/document metadata types.
6. Existing graph/timeline components.

Goal:
Implement Lane A in coherent sub-checkpoints:
1. Phase 2A Context shell and 8 panels.
2. Phase 2D Source Tier model and audit.
3. Phase 2E Episode/Timeline model and UI integration.

Coordination:
- Update the ledger before starting each sub-phase.
- If another agent has touched shared files, reconcile before editing.
- For shared route/type files, make minimal, typed integration changes.

Verification after each sub-phase:
npm run lint
npm run typecheck
npm run build
node scripts/audit-ai-routes.mjs
npm run audit:routes
npm run audit:no-internal-jargon-ui
npm run audit:experience-map-coherence
npm run audit:source-tier-discipline
npm run audit:episode-bi-temporal-coverage
npx vitest run
graphify update .
git diff --check
git diff --cached --check

Browser smoke:
- Start dev server if needed.
- Verify /contexts loads.
- Verify /contexts/[caseId] shell renders without console errors.
- Verify sidebar panels show empty states or real data without crashing.
- Verify source tier badges render.
- Verify timeline strand/empty state renders.

Commit:
Prefer separate commits if clean:
feat(v5-2a): add context shell and panels
feat(v5-2d): add source tier discipline
feat(v5-2e): add episode timeline module

Push only after validation and ledger update.
```

---

## COPY BLOCK 04 - Wave 2 Lane B - Document Pipeline

```text
You are Wave 2 Lane B for PRAXIS v5.

Workspace:
C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work

Ownership:
Phase 2B document pipeline with Docling, GLiNER, Gemini extraction, upload
flow integration, provenance, tests, and document-pipeline audit.

Prerequisite:
Phase 1 complete and pushed. If not, stop.

Before editing:
git pull origin main
git status --short --branch
git log --oneline -5
npm install

Read:
1. docs/build/PRAXIS_v5_EXECUTION_LEDGER.md
2. docs/build/PRAXIS_v5_BUILD_01_AGENT_OPERATING_GUIDE.md
3. docs/build/PRAXIS_v5_BUILD_02_BACKEND_PHASES_0-3.md, Prompt 2B.A
4. Existing document upload/extraction routes.
5. Existing backend graphify_tacitus/document extraction code.
6. Existing Firebase/Storage access patterns.

Goal:
Implement the Phase 2B document pipeline without touching unrelated surface
work. Keep provenance, owner scoping, source tiers, and two-phase commit rules
intact.

Do not:
- Change security-boundary files without explicit approval.
- Add new Firestore collections without rules/index coverage.
- Bypass existing upload auth.
- Commit service-account files or secrets.
- Re-enable deferred v1.5 systems unless the prompt explicitly requires them.

Verification:
npm run lint
npm run typecheck
npm run build
npx vitest run
pytest backend/ -q
npm run audit:document-pipeline-shape
npm run audit:document-ingest-parity
npm run audit:library-ingest-consolidation
npm run audit:source-tier-discipline
node scripts/audit-ai-routes.mjs
graphify update .
git diff --check
git diff --cached --check

Browser/API smoke:
- Upload or simulate a small PDF/text document in local dev.
- Confirm parser path returns structured extraction or a clear fallback.
- Confirm provenance and owner scope are preserved.
- Confirm failure state is visible and honest.

Commit:
feat(v5-2b): add document extraction pipeline

Push only after validation and ledger update.
```

---

## COPY BLOCK 05 - Wave 2 Lane C - Research Pipeline and User Models

```text
You are Wave 2 Lane C for PRAXIS v5.

Workspace:
C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work

Ownership:
- Phase 2C research pipeline: Google Grounded Search + Wikidata SPARQL.
- Phase 3 User Models: model schema, 3 seeded personas, active-model/capture loop.

Prerequisite:
Phase 1 complete and pushed. If not, stop.

Before editing:
git pull origin main
git status --short --branch
git log --oneline -5
npm install

Read:
1. docs/build/PRAXIS_v5_EXECUTION_LEDGER.md
2. docs/build/PRAXIS_v5_BUILD_01_AGENT_OPERATING_GUIDE.md
3. docs/build/PRAXIS_v5_BUILD_02_BACKEND_PHASES_0-3.md:
   - Prompt 2C.A
   - Prompt 3.A
4. Existing deep research and grounded-search routes.
5. Existing user/profile/preferences types and Firestore access.
6. MODEL_MATRIX and provider isolation docs/audits.

Goal:
Implement research pipeline and user models in two coherent checkpoints.

Important:
- Keep Google Grounded Search and Wikidata as MVP sources.
- Do not re-enable Firecrawl, Parallel AI, ACLED, Cognee, Graphiti, or CozoDB.
- Keep all model calls through provider abstractions.
- Keep user models owner-scoped.
- Public seeded models are read-only; user forks are editable.

Verification:
npm run lint
npm run typecheck
npm run build
npx vitest run
npm run audit:research-pipeline-shape
npm run audit:user-model-versioning
npm run audit:ai-provider-isolation
npm run audit:ai-provider-vertex-default
npm run audit:model-matrix-coverage
npm run audit:owner-scoping
node scripts/audit-ai-routes.mjs
graphify update .
git diff --check
git diff --cached --check

Browser/API smoke:
- Research endpoint returns sourced result or clear unavailable state.
- User model seeds are visible to app code.
- User can fork/edit/set active model locally.
- Capture loop does not leak cross-user data.

Commits:
feat(v5-2c): add grounded research pipeline
feat(v5-3): add user models and persona seeds

Push only after validation and ledger update.
```

---

## COPY BLOCK 06 - Wave 2 Integration Gate

```text
You are the Wave 2 integration gate for PRAXIS v5.

Workspace:
C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work

Goal:
After Wave 2 lanes have pushed, pull latest main and verify that Phases 2A,
2B, 2C, 2D, 2E, and 3 integrate as one app. Fix only integration defects.
Do not add new product scope.

Before editing:
git pull origin main
git status --short --branch
git log --oneline -5
npm install

Read:
1. docs/build/PRAXIS_v5_EXECUTION_LEDGER.md
2. Lane completion notes for 2A/2B/2C/2D/2E/3
3. Changed route/type/audit files from the last several commits

Run full integration checks:
npm run lint
npm run typecheck
npm run build
npx vitest run
pytest backend/ -q
npm run audit:routes
npm run audit:repo-shape
npm run audit:architecture-reference
npm run audit:architecture-chain
npm run audit:source-tier-discipline
npm run audit:research-pipeline-shape
npm run audit:document-pipeline-shape
npm run audit:work-ontology-coverage
npm run audit:episode-bi-temporal-coverage
npm run audit:user-model-versioning
node scripts/audit-ai-routes.mjs
graphify update .

Browser smoke:
- /contexts
- /contexts/[caseId]
- document upload/empty state
- source tier badges
- research action
- user model selection/fork
- timeline panel

Deliverable:
- Update ledger with Wave 2 integration status.
- If fixes are needed, keep them minimal and commit:
  fix(v5-wave-2): integrate context research document and user model flows

Push only after green validation.
```

---

## COPY BLOCK 07 - Phase 4A - Contexts Surface

```text
You are implementing PRAXIS v5 Phase 4A only.

Workspace:
C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work

Prerequisite:
Phase 1 complete. Wave 2 integration should be green or ledger must clearly
explain which backend data is not ready yet.

Read:
1. docs/build/PRAXIS_v5_EXECUTION_LEDGER.md
2. docs/build/PRAXIS_v5_BUILD_01_AGENT_OPERATING_GUIDE.md
3. docs/build/PRAXIS_v5_BUILD_03_FRONTEND_AND_SHIP.md, Phase 4A
4. Existing workbench/context/situation components.

Goal:
Build the unified Contexts surface at /contexts and /contexts/[caseId] with
the 8-panel sidebar. Use existing workbench components where possible.

Design standard:
Quiet, serious operational workbench. No marketing hero inside the app. Dense
but readable. Stable responsive layout. No decorative cards inside cards.

Verification:
npm run lint
npm run typecheck
npm run build
npm run audit:routes
npm run audit:no-internal-jargon-ui
npm run audit:experience-map-coherence
npx vitest run
graphify update .

Browser verification:
- /contexts desktop and mobile
- /contexts/[caseId] desktop and mobile
- 8 panels render with empty or real state
- no console errors
- no text overlap

Commit:
feat(v5-4a): add contexts surface

Push only after validation and ledger update.
```

---

## COPY BLOCK 08 - Phase 4B - User Models Surface

```text
You are implementing PRAXIS v5 Phase 4B only.

Workspace:
C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work

Prerequisite:
Phase 3 user model types/seeds complete and pushed.

Read:
1. docs/build/PRAXIS_v5_EXECUTION_LEDGER.md
2. docs/build/PRAXIS_v5_BUILD_03_FRONTEND_AND_SHIP.md, Phase 4B
3. User model schema/seeds from Phase 3
4. Existing settings/profile/user preferences UI

Goal:
Build /users and /users/[modelId] for public seeded user models plus private
fork/edit/set-active behavior.

Constraints:
- Public seeded models are read-only.
- Forks are owner-scoped.
- Do not build compare-user-models; deferred.

Verification:
npm run lint
npm run typecheck
npm run build
npm run audit:user-model-versioning
npm run audit:owner-scoping
npx vitest run
graphify update .

Browser smoke:
- /users loads.
- Public library shows 3 personas.
- Fork model.
- Edit private fork.
- Set active model.
- Header/app state reflects active model.

Commit:
feat(v5-4b): add user models surface

Push only after validation and ledger update.
```

---

## COPY BLOCK 09 - Phase 4C - Methods Marketplace

```text
You are implementing PRAXIS v5 Phase 4C only.

Workspace:
C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work

Prerequisite:
Phase 4A contexts surface complete.

Read:
1. docs/build/PRAXIS_v5_EXECUTION_LEDGER.md
2. docs/build/PRAXIS_v5_BUILD_03_FRONTEND_AND_SHIP.md, Phase 4C
3. Existing tools registry and generated tool docs
4. Existing context-aware tool audits

Goal:
Build the Methods marketplace at /methods with the MVP method set and
suggestion engine. Consolidate visible methods without deleting legacy tool
capability.

Important:
- Do not expose all 52 tools as the MVP surface.
- Do not rename deep internals broadly unless required.
- Keep method/tool contracts auditable.
- Keep UI copy user-facing; avoid internal jargon.

Verification:
npm run lint
npm run typecheck
npm run build
npm run audit:tool-contracts
npm run audit:tool-contract-v2
npm run audit:tool-context-isolation
npm run audit:tool-marketplace
npm run audit:no-internal-jargon-ui
npx vitest run
graphify update .

Browser smoke:
- /methods loads.
- MVP categories and methods render.
- Method suggestion behaves with empty and populated context.
- Method run entry points are honest if backend is not yet implemented.

Commit:
feat(v5-4c): add methods marketplace

Push only after validation and ledger update.
```

---

## COPY BLOCK 10 - Phase 4D - Ask Homepage

```text
You are implementing PRAXIS v5 Phase 4D only.

Workspace:
C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work

Prerequisite:
Methods marketplace exists. Runtime dependencies are recorded in the ledger.

Read:
1. docs/build/PRAXIS_v5_EXECUTION_LEDGER.md
2. docs/build/PRAXIS_v5_BUILD_03_FRONTEND_AND_SHIP.md, Phase 4D
3. Existing Ask PRAXIS dashboard/app shell files
4. Existing AI chat/ask-praxis routes

Goal:
Build the new Ask homepage at /app with intent classifier and transparent
agent loop. Make this the first authenticated wow surface without pretending
deferred systems are live.

Design:
The first screen should be a working product surface, not a landing page.
Keep it efficient, polished, and serious.

Verification:
npm run lint
npm run typecheck
npm run build
npm run audit:ask-praxis-primary
npm run audit:experience-map-coherence
npm run audit:no-internal-jargon-ui
npm run audit:ai-provider-isolation
node scripts/audit-ai-routes.mjs
npx vitest run
graphify update .

Browser smoke:
- /app unauth/auth behavior.
- Ask input works or returns honest fallback.
- Suggested next actions route correctly.
- Transparent agent loop states render without overlap.
- Desktop/mobile screenshots checked.

Commit:
feat(v5-4d): add ask homepage

Push only after validation and ledger update.
```

---

## COPY BLOCK 11 - Phase 4E - Drafting Studio Shell

```text
You are implementing PRAXIS v5 Phase 4E only.

Workspace:
C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work

Prerequisite:
Context surface and core app shell are stable.

Read:
1. docs/build/PRAXIS_v5_EXECUTION_LEDGER.md
2. docs/build/PRAXIS_v5_BUILD_03_FRONTEND_AND_SHIP.md, Phase 4E
3. Existing reports/memos/export code
4. Existing work-products routes

Goal:
Build Drafting Studio shell at /draft and /draft/[draftId]. Keep templates
or AI actions as placeholders if Phase 6 owns them.

Verification:
npm run lint
npm run typecheck
npm run build
npm run audit:routes
npm run audit:drafting-templates-present
npx vitest run
graphify update .

Browser smoke:
- /draft loads.
- /draft/new path handles missing context gracefully.
- /draft/[draftId] shell loads for test data or clean empty state.
- Export controls are visible but honest if not wired yet.

Commit:
feat(v5-4e): add drafting studio shell

Push only after validation and ledger update.
```

---

## COPY BLOCK 12 - Phase 5 - MVP Methods

```text
You are implementing PRAXIS v5 Phase 5.

Workspace:
C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work

Prerequisite:
Phase 4C complete and pushed.

Read:
1. docs/build/PRAXIS_v5_EXECUTION_LEDGER.md
2. docs/build/PRAXIS_v5_BUILD_03_FRONTEND_AND_SHIP.md, Phase 5
3. Current method/tool registry
4. Method skills under skills/ where relevant
5. ContextProvider and calibration middleware

Goal:
Implement the 10 MVP Methods using the Phase 5 template. Work method by method
or in small groups. Do not expose or rewrite all legacy tools.

For each method:
- Define method contract.
- Connect to ContextSnapshot.
- Use provider abstractions for AI.
- Persist tool runs/results with owner scoping.
- Add tests.
- Add audit coverage.
- Add honest UI states.

Verification after each method group:
npm run lint
npm run typecheck
npm run build
npm run audit:tool-contracts
npm run audit:tool-contract-v2
npm run audit:tool-context-isolation
npm run audit:tool-canary-executable
npm run audit:tool-semantic-canaries
npm run audit:tool-marketplace
node scripts/audit-ai-routes.mjs
npx vitest run
graphify update .

Browser smoke:
- Run each implemented method from a context.
- Confirm loading/success/failure states.
- Confirm citations/provenance render where applicable.
- Confirm no internal costs are exposed.

Commit:
Use small commits, for example:
feat(v5-5): implement actor and source methods
feat(v5-5): implement risk and scenario methods
feat(v5-5): implement memo support methods

Push validated checkpoints only.
```

---

## COPY BLOCK 13 - Phase 6 - Drafting Templates and AI Actions

```text
You are implementing PRAXIS v5 Phase 6.

Workspace:
C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work

Prerequisite:
Drafting shell complete. Required Methods and Memo Drafter dependency status
must be clear in the ledger.

Read:
1. docs/build/PRAXIS_v5_EXECUTION_LEDGER.md
2. docs/build/PRAXIS_v5_BUILD_03_FRONTEND_AND_SHIP.md, Phase 6
3. Existing memo/report/export code
4. Existing work-products DOCX import/export code
5. Memo Drafter/output refiner agent docs if present

Goal:
Implement the five MVP drafting templates and section-level AI actions.
Make generated output visibly grounded in context and source provenance.

Constraints:
- Do not claim autonomous drafting is production-live unless runtime proves it.
- Do not expose raw model prompts or internal costs.
- Keep section actions scoped to owner/context.

Verification:
npm run lint
npm run typecheck
npm run build
npm run audit:drafting-templates-present
npm run audit:export-coverage
npm run audit:ai-provider-isolation
node scripts/audit-ai-routes.mjs
npx vitest run
graphify update .

Browser smoke:
- Create a draft from each template.
- Edit sections.
- Run section-level AI action.
- Export where supported.
- Confirm citations/provenance/fallbacks.

Commit:
feat(v5-6): add drafting templates and section actions

Push only after validation and ledger update.
```

---

## COPY BLOCK 14 - Phase 7 - Demo Content and Wow Paths

```text
You are implementing PRAXIS v5 Phase 7.

Workspace:
C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work

Prerequisite:
Waves 1-3 complete and pushed. App surfaces and core methods must work.

Read:
1. docs/build/PRAXIS_v5_EXECUTION_LEDGER.md
2. docs/build/PRAXIS_v5_BUILD_03_FRONTEND_AND_SHIP.md, Phase 7
3. Persona and demo context specs from File 1
4. Existing demo/syria-case/demo-mode code
5. Firebase seed scripts and rules/indexes

Goal:
Seed the three MVP demo Contexts and persona paths:
- Foreign Policy Analyst: Indo-Pacific Strategic Competition 2026
- Domestic Policy Analyst: AI Regulation 2026 - US Federal & State Landscape
- Corporate Strategic Analyst: Food & Beverage Regulatory & Sustainability Outlook 2026

Make each path produce a 5-minute wow arc with honest cached/demo data,
provenance, and clear fallbacks.

Important:
- Do not fabricate live capabilities.
- Do not add legally risky data sources.
- Demo data must be labeled/cached honestly.
- Writes must be owner/demo scoped.

Verification:
npm run lint
npm run typecheck
npm run build
npm run audit:demo-claim
npm run audit:onboarding-gate
npm run audit:stage-target-coverage
npm run audit:no-internal-jargon-ui
npx vitest run
graphify update .

Seed/smoke:
- Run seed scripts in a non-destructive way.
- Verify all three demo contexts load.
- Verify Ask, Methods, Sources, Timeline, Graph, Drafts paths for each.
- Verify unauthenticated/public demo behavior if applicable.

Browser:
Capture desktop and mobile evidence for all three demo paths.

Commit:
feat(v5-7): seed demo contexts and persona wow paths

Push only after validation and ledger update.
```

---

## COPY BLOCK 15 - Phase 8 - Public Landing Page

```text
You are implementing PRAXIS v5 Phase 8.

Workspace:
C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work

Prerequisite:
Demo content and app surfaces complete enough to support public claims.

Read:
1. docs/build/PRAXIS_v5_EXECUTION_LEDGER.md
2. docs/build/PRAXIS_v5_BUILD_03_FRONTEND_AND_SHIP.md, Phase 8
3. Existing landing components
4. docs/architecture and live-app alignment docs
5. Current production health notes

Goal:
Rebuild the public landing page at / for the PRAXIS v5 wow MVP. The public
page must explain the product through the three buyer/persona demo arcs and
route users into the working demo/app.

Design:
- First viewport must signal PRAXIS clearly.
- Use actual product/demo visuals or generated bitmap assets if needed.
- No generic SaaS fluff.
- Keep claims aligned with live functionality.
- Make the next section visible from the hero on desktop and mobile.
- No decorative gradient/orb-heavy design.

Verification:
npm run lint
npm run typecheck
npm run build
npm run audit:landing
npm run audit:no-internal-jargon-ui
npm run audit:demo-claim
npm run audit:experience-map-coherence
npx vitest run
graphify update .

Browser verification:
- / desktop
- / mobile
- hero and next section visible
- demo CTAs route correctly
- no console errors
- no text overlap
- screenshots recorded in ledger

Commit:
feat(v5-8): rebuild public landing page

Push only after validation and ledger update.
```

---

## COPY BLOCK 16 - Phase 9 - Polish and Ship

```text
You are implementing PRAXIS v5 Phase 9.

Workspace:
C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work

Prerequisite:
Phases 0-8 complete, pushed, and marked complete in the ledger.

Read:
1. docs/build/PRAXIS_v5_EXECUTION_LEDGER.md
2. docs/build/PRAXIS_v5_BUILD_03_FRONTEND_AND_SHIP.md, Phase 9
3. STATUS.md
4. TODO.md
5. BLOCKERS.md
6. CHANGELOG.md
7. Production health/runbooks

Goal:
Polish the MVP, close obvious UX gaps, verify pricing/Stripe if in scope,
complete persona suites, and prepare the ship checkpoint.

Do not:
- Add broad new scope.
- Hide known blockers.
- Overstate production capability.
- Deploy until deployment is explicitly authorized.

Full local gate:
npm run typecheck
npm run build
npm run lint
npm run audit:repo-shape
npm run audit:gate
npm run audit:architecture-reference
npm run audit:gcp
node scripts/audit-ai-routes.mjs
npx vitest run

Also run every v5 audit added during the build:
npm run audit:v5-readiness
npm run audit:llm-pattern-coverage
npm run audit:source-tier-discipline
npm run audit:research-pipeline-shape
npm run audit:document-pipeline-shape
npm run audit:work-ontology-coverage
npm run audit:episode-bi-temporal-coverage
npm run audit:user-model-versioning
npm run audit:drafting-templates-present

Browser full story:
- Public landing
- Login/auth flow
- /app Ask homepage
- /contexts
- Each of the three demo contexts
- /users
- /methods
- /draft
- Settings/system-health
- Legal pages

Deliverable:
- Update ledger with final pre-deploy readiness.
- Update STATUS/TODO/CHANGELOG as needed.
- Commit:
  chore(v5-9): polish and prepare MVP ship gate

Push only after green validation.
```

---

## COPY BLOCK 17 - Production Deploy and Live Verification

```text
You are the PRAXIS v5 production deployment and live verification agent.

Workspace:
C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work

Prerequisite:
Phase 9 complete, pushed to main, and Giulio has explicitly authorized
production deployment/verification for praxis.tacitus.me.

First:
git pull origin main
git status --short --branch
git log --oneline -5
npm install

Read:
1. docs/build/PRAXIS_v5_EXECUTION_LEDGER.md
2. docs/runbooks/ and docs/GCP_OPERATIONS.md where relevant
3. cloudbuild.frontend.yaml
4. cloudbuild.yaml
5. package.json deployment scripts

Hard rule:
Do not run mutating deployment commands unless Giulio's current instruction
explicitly authorizes production deployment. If deployment is not authorized,
perform read-only verification only and stop with exact commands Giulio can
approve.

Pre-deploy checks:
npm run auth:doctor
npm run audit:gcp
npm run audit:gcp-production-posture
npm run typecheck
npm run build
npm run lint
npm run audit:gate
npx vitest run

Deployment path:
Use the repo-approved deployment path. Prefer main-branch/Cloud Build flow.
If local command is explicitly approved and matches repo scripts, use:
npm run deploy:frontend:cloud

Do not use firebase deploy, gcloud run deploy, or terraform apply unless a
specific runbook and Giulio's explicit approval say so.

Post-deploy live checks:
- Confirm latest Cloud Build succeeded.
- Confirm Cloud Run service revision is ready.
- GET https://praxis.tacitus.me/api/health
- GET https://praxis.tacitus.me/
- Browser verify:
  - landing page
  - login/demo entry
  - /app
  - /contexts
  - each demo context
  - /users
  - /methods
  - /draft
- Check browser console for errors.
- Confirm backend remains private if intended.
- Confirm Firebase auth probe still works.
- Confirm production app does not show internal cost values.

Record in ledger:
- Deployment command or external deployment ID.
- Cloud Build ID.
- Cloud Run revision.
- Production health response summary.
- Browser verification summary.
- Known residual risks.

Commit only if docs/ledger/status changed:
chore(v5): record production deployment evidence

Push after validation.
```

---

## COPY BLOCK 18 - Final Product QA and Red-Team Review

```text
You are the final PRAXIS v5 product QA and red-team review agent.

Workspace:
C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work

Goal:
Review the shipped MVP as a buyer would experience it. Find broken flows,
overclaims, security/auth mistakes, missing provenance, bad empty states, bad
mobile layout, or anything that prevents a "wow MVP" reaction.

Read:
1. docs/build/PRAXIS_v5_EXECUTION_LEDGER.md
2. STATUS.md
3. TODO.md
4. CHANGELOG.md
5. docs/architecture/PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md
6. docs/build/PRAXIS_v5_BUILD_01_AGENT_OPERATING_GUIDE.md

Run read-only first:
git pull origin main
git status --short --branch
npm install
npm run typecheck
npm run build
npm run lint
npm run audit:gate
npm run audit:gcp
npx vitest run

Browser QA on production:
https://praxis.tacitus.me

Personas:
1. Foreign Policy Analyst
2. Domestic Policy Analyst
3. Corporate Strategic Analyst

For each persona, test:
- First landing impression
- Demo entry
- Ask homepage
- Context page
- Sources/provenance
- Methods
- Draft creation
- Export or fallback
- Mobile layout
- Failure/empty states

Review criteria:
- Is the product understandable in 60 seconds?
- Is there a credible wow moment in 5 minutes?
- Are claims backed by live functionality?
- Is every AI answer grounded or honest about missing context?
- Are owner-scoped/private paths protected?
- Does the UI avoid internal jargon?
- Are deferred systems clearly not claimed as live?
- Does production health pass?

Deliverable:
Create or update docs/audits/<date>-v5-final-product-qa.md with:
- Severity-ranked findings.
- Exact URL/path.
- Screenshot references if available.
- Reproduction steps.
- Recommended fix.
- Whether it blocks launch.

If fixes are small and safe, implement them in a separate commit:
fix(v5-ship): resolve final QA blockers

If fixes are broad, do not start them. Record the blocker list and stop.
```

---

## COPY BLOCK Emergency - Blocker Handoff

Use this when an agent hits a serious blocker and needs to hand off cleanly.

```text
You are handling a PRAXIS v5 blocker handoff.

Workspace:
C:\Users\giuli\ANTIGRAVITY\PRAXISMAY2026\A4_PRAXIS_CLOUD_Work

Do not continue implementation. Produce a precise blocker report and preserve
the worktree.

Run:
git status --short --branch
git diff --stat
git diff --check

Update docs/build/PRAXIS_v5_EXECUTION_LEDGER.md with:
- Phase/lane
- Blocker summary
- Exact command/error
- Files changed
- Whether changes are safe to keep
- Suggested next action

If there are useful partial changes, leave them unstaged unless Giulio asks for
a WIP commit. Do not push broken code.
```

---

## One-Line Prompts For Giulio

If you want to queue quickly, use these one-liners and attach the relevant full
prompt above:

- `Run 00 Preflight Orchestrator. Do not implement product code.`
- `Run 01 Phase 0. Commit and push only if validated.`
- `Run 02 Phase 1. Commit and push only if validated.`
- `Run 03 Wave 2 Lane A. Own only 2A/2D/2E.`
- `Run 04 Wave 2 Lane B. Own only 2B.`
- `Run 05 Wave 2 Lane C. Own only 2C/3.`
- `Run 06 Wave 2 Integration Gate. Fix only integration defects.`
- `Run 07 Phase 4A.`
- `Run 08 Phase 4B.`
- `Run 09 Phase 4C.`
- `Run 10 Phase 4D.`
- `Run 11 Phase 4E.`
- `Run 12 Phase 5. Implement MVP methods in validated checkpoints.`
- `Run 13 Phase 6.`
- `Run 14 Phase 7.`
- `Run 15 Phase 8.`
- `Run 16 Phase 9.`
- `Run 17 Production Deploy and Live Verification after explicit deploy approval.`
- `Run 18 Final Product QA and Red-Team Review.`
