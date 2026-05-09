# Bootstrap Prompt

> **Path:** `docs/v7/prompts/BOOTSTRAP.md`
> Use this prompt **once**, the very first session Codex works on v7.
> The body below is paste-ready into a Codex session.

```
You are Codex working on https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.
Target branch: main. Production target: praxis.tacitus.me (GCP project
praxisbytacitus, region us-central1).

This is session 1 of the PRAXIS v7 simplification rewrite. Your job in THIS
session is NOT to write feature code. Your job is to:
  (a) ingest the v7 plan,
  (b) audit the current repo state against that plan,
  (c) set up the operational scaffolding,
  (d) propose Slice 1 in detail,
  (e) STOP for my approval.

DO NOT begin Slice 1 implementation in this session.

==== INPUTS ====

Read in this order, fully:
  - AGENTS.md (root, your contract for every session)
  - docs/v7/INDEX.md
  - docs/v7/00_VISION_AND_OPERATING_PRINCIPLES.md
  - docs/v7/01_FRONTEND_AND_UX.md
  - docs/v7/02_BACKEND_DATABASE_AND_DEPLOYMENT.md
  - docs/v7/03_CONTEXT_CORES_AND_DYNAMIC_ONTOLOGIES.md
  - docs/v7/04_ANALYST_SKILLS_POLICY_PRODUCT_AND_OUTPUTS.md
  - docs/v7/STATUS.md
  - docs/v7/SLICE_TEMPLATE.md
  - docs/v7/PROMPTS.md

==== STEP 1: READ THE REPO ====

Build a real model of current state. Read at minimum:
  - README.md, ARCHITECTURE.md, DEPLOYMENT.md, BLOCKERS.md, CHANGELOG.md,
    SECURITY.md, TESTING.md, root STATUS.md
  - package.json, backend/pyproject.toml, docker-compose.yml,
    cloudbuild.yaml, cloudbuild.frontend.yaml, firestore.rules
  - src/app/ (route tree only)
  - src/components/app/app-shell.tsx, app-sidebar.tsx, header.tsx,
    floating-praxis.tsx
  - src/chapters/registry.ts, src/tabs/registry.ts
  - src/lib/ontology/ (registry.ts + types.ts)
  - src/lib/context/
  - backend/main.py and every file in backend/routers/
  - last 5 migrations in backend/migrations/versions/
  - backend/services/cognee_memory.py
  - skills/tools/ (enumerate IDs and categories)
  - skills/subagents/ (enumerate)
  - scripts/audit-* (titles + run-target lines; deep-read any audit named
    in the briefs)
  - docs/architecture/PRAXIS_ARCHITECTURE.md, PRAXIS_ONE_PAGE.md,
    MULTI_TENANT_MODEL.md, COGNEE_MEMORY_LAYER.md, POSTGRES_SCHEMA.md,
    ONTOLOGY_SYSTEM.md, MODEL_SELECTION.md, KG_BACKEND.md
  - docs/CONTEXT_INJECTION.md

Run the gate so you know what's currently green:
    npx tsc --noEmit
    npm run lint
    npm run audit:gate

==== STEP 2: PRODUCE docs/v7/CURRENT_STATE.md ====

The verified-facts version of the repo, not a paraphrase of the briefs.
Contains:
  1. Current shipped IA (every top-level route, one-line description).
  2. Audit posture (table: audit name → green / red / flaky / missing →
     related brief).
  3. Data layer (which migrations applied, owner_uid coverage).
  4. Cognee posture (flag, routes touching it).
  5. Vertex posture (where AI calls happen, isolation audit state).
  6. Contradictions between briefs and code, with paths cited. For each:
     "Brief is wrong" / "Code is wrong" / "Both partially right" + proposed
     resolution as a comment, not a code change.
  7. Risks for Slice 1.

==== STEP 3: PRODUCE docs/v7/OPEN_QUESTIONS.md AND docs/v7/DECISION_LOG.md ====

OPEN_QUESTIONS.md: mirror the 5 questions from STATUS.md plus any new ones
from CURRENT_STATE.md §6. Use this row shape:

    ### Q<N> — <one-line question>
    Raised: YYYY-MM-DD by [GC | Codex]
    Brief: <00..04 + section>
    Default if not answered: <safe default>
    Blocks: <slice IDs>
    State: open | answered | deferred

DECISION_LOG.md: header + column legend, empty body.

==== STEP 4: PROPOSE SLICE 1 ====

Create docs/v7/SLICES/01_foundations.md by filling SLICE_TEMPLATE.md.
Foundations is brief 01 §10 row 1.

In scope:
  - Migration 0019_cores_baseline (cores, core_grants, core_audit per
    brief 02 §2). Reversible. Tested on ephemeral Postgres.
  - Migration 0020_cores_linkage (nullable core_id columns). Reversible.
  - Skip 0021 backfill and 0022 ask_threads — propose them as Slice 1b
    and Slice 1c.
  - TypeScript types under src/lib/cores/types/ for all 8 core kinds.
    Pydantic mirrors under backend/services/cores/types/. Schema only.
    No endpoints. No UI.
  - Feature flag NEXT_PUBLIC_PRAXIS_V7 in next.config.ts and PRAXIS_V7_BACKEND
    in backend/config.py. Both default false.
  - Stub audits (pass on empty contracts; real assertions in later slices):
        audit:cores-schema
        audit:cores-types-parity
        audit:cores-owner-scoping
  - Wire into scripts/audit-architecture-chain.ts.

Out of scope (state explicitly):
  - UI surfaces, /app/v7/* routes, router exposure of cores.py or ask.py,
    prod backfill, Cognee changes, model changes.

Acceptance criteria: per AGENTS.md §4 plus migrations apply + downgrade
clean, type-parity audit green, existing audits still green, flag flips
cleanly.

Rollback: drop migrations via downgrade; remove src/lib/cores/types/ and
backend/services/cores/types/; revert flag additions.

==== STEP 5: OPEN ONE PR ====

Title: "v7: bootstrap (briefs, scaffolding, current-state audit, slice 1
proposal)"

Files in this PR:
  - docs/v7/CURRENT_STATE.md (new)
  - docs/v7/OPEN_QUESTIONS.md (new)
  - docs/v7/DECISION_LOG.md (new)
  - docs/v7/SLICES/01_foundations.md (new)
  - root CHANGELOG.md (one line)

Use the PR body template from AGENTS.md §9.

==== STEP 6: COMMENT AND STOP ====

Post one PR comment:
  1. Three sentences summarizing the most important findings in
     CURRENT_STATE.md.
  2. Any blocker or contradiction needing my decision before Slice 1.
  3. Proposed go/no-go date for Slice 1.

Then STOP. Wait for me to merge and reply "go on Slice 1".

==== HARD RULES ====

  - You will NOT modify any code outside docs/v7/* and CHANGELOG.md.
  - You will NOT modify audit scripts beyond proposing the three stubs in
    the slice file (you don't add them this session — slice 1 does).
  - You will NOT silently align briefs to code or vice versa. Conflicts
    go in CURRENT_STATE.md.
  - You will run the gate before pushing. If anything is red that was
    green, fix or revert. A red gate never lands.

If you cannot complete safely, post a comment with what blocked and stop.
Silence is worse than a question.
```
