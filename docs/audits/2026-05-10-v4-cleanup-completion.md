# V4 Cleanup Pass — Completion Summary

**Date:** 2026-05-10
**Branch:** `claude/review-praxis-setup-0GOaI`
**Commits:** Phase A → G inclusive
**Inventory:** `docs/audits/2026-05-10-v4-cleanup-inventory.md`

## What changed

### Archived (preserved, not deleted)

Under `docs/_archive/2026-05-pre-v4/`:

- `codex-prompts/` — 53 historical Codex session prompts (PRAXIS_CODEX_*, PRAXIS_V2_*, PRAXIS_MAY_*, build guides, WORKSPACE_RETHINK).
- `superpowers/specs/` — 8 historical 2026-04 design specs.
- `specs/` — 3 historical 2026-04 spec packs (improvements, admin-console-v2, langgraph-runtime).
- `phases/` — 3 superseded PRAXIS_PHASE_{1,2,3} foundation docs.
- `audits/` — 11 V2 / Z session intakes + the 2026-05-06 audit-branch archive.
- `TODO_pre_v4.md` — the old 833-line session-log TODO.

Under `scripts/_archive/`:

- 4 one-shot migration scripts (`migrate-bitemporal`, `migrate-documents-to-sources`, `migrate-tool-outputs-to-tools`, `migrate-truth-layers`).
- 2 local benchmarks (`bench-gliner-cost-reduction.py`, `smoke-extraction-pipeline.py`).

Under `tests/_archive/migrations/`:

- `migrate-tool-outputs.test.ts` — covers an archived script, no longer applicable.

### Updated

- `CLAUDE.md` — agent handoff trimmed to canonical trinity + v7 STATUS; "Model String Discipline" corrected (`gemini-2.5-*` is current canon, not deprecated); "AI Model Tiers" table updated to Gemini 2.5; new "Pre-merge optional: v4-readiness stubs" section.
- `AGENTS.md` — Read Before Code list trimmed to 11 entries; operational and historical references demoted into separate sections.
- `ARCHITECTURE.md` — points to canonical trinity (bible, live alignment, simplified context core) plus v7 STATUS; references the cleanup inventory + this completion doc.
- `TODO.md` — replaced with a thin pointer to v7 SLICES, the 4 v4 ADRs awaiting sign-off, and standing rules. Repo-shape and architecture-reference markers preserved.
- `BLOCKERS.md` — removed the obsolete "Gemini-3 prompt vs current model guard" entry. Three live blockers remain (notification provider sends, Cognee live SDK, deep pre-ship live checks).
- `docs/v7/STATUS.md` — notes the 2026-05-10 cleanup pass and points to this doc.
- `tsconfig.json` — excludes `**/_archive/**` from typecheck.
- `package.json` — registers `seed:domains` and 8 new v4-readiness audit scripts plus the `audit:v4-readiness` aggregator.

### Created

#### Phase D scaffolds (READMEs only, no implementation)

- `src/lib/episodes/README.md` — Episode + Timeline destination.
- `src/lib/user-models/README.md` — versioned User Models destination.
- `src/lib/research/README.md` — Research Pipeline destination.
- `src/lib/knowledge/README.md` — clarifies SKC as canonical substrate.
- `backend/data/ontologies/work/README.md` — placeholder for 8 work-ontology templates.

#### Phase E audit stubs (all failing on purpose)

- `scripts/audit-llm-pattern-coverage.ts` — M1 Ontology
- `scripts/audit-work-ontology-coverage.ts` — M1 Ontology
- `scripts/audit-source-tier-discipline.ts` — M2 Context
- `scripts/audit-research-pipeline-shape.ts` — M2 Context
- `scripts/audit-document-pipeline-shape.ts` — M2 Context
- `scripts/audit-user-model-versioning.ts` — M3 User Model
- `scripts/audit-episode-bi-temporal-coverage.ts` — M5 Episode + Timeline
- `scripts/audit-drafting-templates-present.ts` — M6 Ask + Drafting

Aggregator: `npm run audit:v4-readiness`.

#### Phase F ADRs (Proposed — awaiting Giulio sign-off)

- `docs/adr/0050-user-models-as-first-class-versioned-artifacts.md`
- `docs/adr/0051-two-context-product-model-on-dual-ontology-layer.md`
- `docs/adr/0052-seven-logical-graphs-one-user-facing-graph.md`
- `docs/adr/0053-twelve-named-llm-graph-interaction-patterns.md`

ADR numbers chosen to follow the existing sequence (next free was 0050). The
brief asked for 0037–0040; those numbers are already taken.

## Validation gate

| Audit | Result |
|---|---|
| `npx tsc --noEmit` | **Pass** |
| `npm run audit:repo-shape` | **Pass** (warning on graphify built-at-commit drift, pre-existing) |
| `npm run audit:architecture-reference` | **Pass** |
| `npm run audit:architecture-chain` | **Pass** (47 §19 npm scripts accounted for) |
| `npm run audit:routes` | **Pass** (66 AI routes calibrated, 5 exempt) |
| `npm run audit:simplified-capability-ledger` | **Pass** |
| `npm run audit:v4-readiness` | **All 8 stubs fail noisily** (intended) |
| `npm run build` | **Not run** (CI/Cloud Build is the authoritative builder; local build pass not required for a cleanup pass that only adds READMEs and audit stubs) |
| `npm run audit:gate` | **Not run** in full (60+ audits, ~10 min, requires `gcloud` for `audit:gcp`) |

## What was *not* done from the original brief, and why

1. **Forbidden model string scrubbing.** The brief listed `gemini-2.5-*` as
   forbidden. Phase A established that `gemini-2.5-*` is the current canon.
   CLAUDE.md was corrected; `MODEL_MATRIX.json` and `providers.ts` were left
   alone.
2. **ACLED reference removal.** Already clean (zero hits in production code).
3. **Route renames `/tools` → `/methods`, `/cases` → `/contexts`.** Repo
   already speaks Situations / Tools / Memo Studio. Route renames were
   deferred indefinitely; no migration logic needed.
4. **`/contexts/[id]` 8-sidebar-panel scaffold.** Cannot ship without an
   active v7 slice; deferred until Slice 1 sign-off.
5. **301 redirects in middleware.** Out of scope — the security boundary
   forbids touching `src/middleware.ts` without explicit approval.
6. **`pytest backend/`, `mypy --strict`.** Backend test suite not run in this
   pass; cleanup did not change backend code.

## What remains for Giulio

1. Review and sign off (or send back for revision) on the four v4 ADRs:
   - 0050 — User Models as first-class versioned artifacts.
   - 0051 — Two-context product model on dual-ontology layer.
   - 0052 — Seven logical graphs, one user-facing graph.
   - 0053 — Twelve named LLM-graph interaction patterns.
2. Approve `docs/v7/SLICES/01_foundations_experience_map.md` to move from `proposed` → `in-progress`.
3. Confirm whether v4 starts inside the v7 slice frame or supersedes it. If
   the latter, the next agent should rename v7 STATUS to v4 STATUS and
   close v7 slices as superseded.

## Branch commit history

```
d3cc56e docs(adr): add four v4 ADRs at Proposed status (Phase F)
087088f chore(v4): add 8 v4-readiness audit stubs (Phase E)
bf2b55e chore(v4): scaffold v4 destination directories with READMEs (Phase D)
6733369 chore(v4): archive 6 orphan scripts and register seed:domains (Phase C)
7ada2c2 chore(v4): archive pre-v4 docs and trim agent handoff (Phase B)
4ed1263 docs(audits): add v4 cleanup pass Phase A inventory
```

(Phase G commit appended on completion of this doc.)

## Next session prompt

```
Read README.md, CLAUDE.md, AGENTS.md, ARCHITECTURE.md, then the
canonical trinity:
  docs/architecture/PRAXIS_ARCHITECTURE.md
  docs/architecture/PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md
  docs/architecture/PRAXIS_SIMPLIFIED_CONTEXT_CORE_MODEL_2026-05-08.md
plus docs/v7/STATUS.md, STATUS.md, TODO.md, CHANGELOG.md [Unreleased],
the four v4 ADRs (0050-0053), and the cleanup completion doc at
docs/audits/2026-05-10-v4-cleanup-completion.md.

If the four v4 ADRs are still Proposed, stop and ask Giulio before
implementing v4 Phase 1. If they are Accepted, pick the M1 ontology
deliverables (L1-L12 fixed names, work-ontology templates) and ship
behind a feature flag with audit:v4-readiness stubs flipped to
real implementations as each module lands.

Do not touch the security boundaries listed in CLAUDE.md.
Do not flip the model matrix to Gemini 3 without setting
PRAXIS_ALLOW_GEMINI3_TARGETS=1 first.
Cognee remains disabled-first.
```
