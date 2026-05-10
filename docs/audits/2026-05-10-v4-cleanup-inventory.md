# V4 Cleanup Pass — Phase A Inventory (read-only)

**Date:** 2026-05-10
**Branch:** `claude/review-praxis-setup-0GOaI`
**Scope:** Read-only audit. No moves, no deletes. This document is the punch list that Phases B–G act on.

## Adapted vision basis

The cleanup brief referenced three "v4 vision files" that do not exist in this repo:
`docs/architecture/PRAXIS_VISION_v4_01_VISION.md`, `_02_ARCHITECTURE.md`,
`_03_BUILD.md`. The de-facto current vision used as the cleanup anchor:

1. `docs/architecture/PRAXIS_ARCHITECTURE.md` — invariant bible
2. `docs/architecture/PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md` — what's shipped
3. `docs/architecture/PRAXIS_SIMPLIFIED_CONTEXT_CORE_MODEL_2026-05-08.md` — current product model (Home, Ask PRAXIS, Sources, Situation Model, Outputs, Advanced)
4. `docs/v7/00_VISION_AND_OPERATING_PRINCIPLES.md` + `docs/v7/STATUS.md` — v7 design-led simplification wave (Slices 1–9, all `proposed`)
5. `docs/roadmap/PRAXIS_DESIGN_LED_AGENTIC_APP_PLAN_2026-05-08.md` and siblings

The "v4 module" terminology in the brief (M1 Ontology, M2 Context, M3 User Model,
M4 Methods, M5 Episode/Timeline, M6 Ask/Drafting, M7 Subagents, M8 Polish) is
treated as a forward-looking renaming of the existing v7 slice work + the
simplified context core capabilities. Where the brief said "Contexts," repo
language is **Situations**. Where it said "Methods," repo has **Tools** /
**Marketplace**. Where it said "Drafts," repo has **Memo Studio** /
**Briefing Studio**. Phase D scaffolds are renamed accordingly.

## Pre-existing audits this references

A 2026-05-08 codebase audit already produced cleanup verdicts:

- `docs/audits/2026-05-08-CODEBASE_AUDIT/07-cleanup-plan.md`
- `docs/audits/2026-05-08-CODEBASE_AUDIT/10-cleanup-execution.md`
- `docs/audits/2026-05-08-REPO_PURPOSE_AUDIT/review-candidates.csv`

Phase B/C should reconcile against those before archiving anything.

---

## 1. `src/app/` route inventory

### Pages — KEEP

| Path | Verdict | Rationale |
|---|---|---|
| `(landing)/` | KEEP | Public landing |
| `(auth)/login`, `(auth)/login/callback` | KEEP | Auth flow |
| `legal/{data-retention,privacy,security,terms}` | KEEP | Required pages |
| `pricing`, `privacy`, `terms`, `waitlist` | KEEP | Public pages |
| `onboarding/` | KEEP | First-login wizard |
| `app/admin/*` (advisor-feed, advisors, diagnostics, domains, operator-console, users) | KEEP | Admin surface |
| `app/settings/*` (api-keys, graph-backend, model-preferences, notifications, personas, preferences, profile, system-health) | KEEP | Settings surface |
| `app/profile` | KEEP | Settings adjacent |
| `app/dashboard` | KEEP | Active home; the simplified-context-core "Home" target |
| `demo/syria-2024`, `demo/settings` | KEEP | Demo flow |

### Pages — COLLAPSE / REVIEW (carry into v4 phases, do not touch in cleanup)

| Path | Verdict | Notes |
|---|---|---|
| `app/cases/` | REVIEW-LATER | Likely target of Situations consolidation; check if any tabs/components still needed by workbench. **Do not retire blindly** — backend `/api/v1/pipeline/*` and Firestore situation/case schema link here. |
| `app/situations/`, `app/situations/new` | KEEP | This is the canonical Situation entry point per the simplified context-core model. Brief said collapse; **repo says keep.** |
| `app/syria-case/` | REVIEW-LATER | Demo-adjacent; verify whether it shadows `/demo/syria-2024`. Strong candidate for retirement *if* fully duplicated. |
| `app/workbench/[caseId]/` (incl. `/ach`, `/boardroom`) | KEEP | Active workbench surface. Bible labels this preserved; do not refactor. |
| `app/tools/`, `app/tools/archive` | KEEP | Tools surface (Marketplace). Brief proposed rename to `/methods`; **defer rename indefinitely** — `tools` is the repo language. |

### Pages — RETIRE candidates (none confirmed in Phase A)

No page directories are confirmed dead. Reversibility-cheap default: keep all.

### New v4 destinations to scaffold (Phase D, READMEs only)

The brief asked for `/contexts`, `/users`, `/methods`, `/draft`. Adapted to repo
language:

- `src/app/app/situations/README.md` — note that Situations IS the "Contexts" surface in the simplified model; future expansion under Slice 5 (`docs/v7/STATUS.md`).
- `src/app/app/tools/README.md` — note that Tools = Methods marketplace; v7 Slice 4/8 will add Skills routing.
- `src/app/app/outputs/` (new dir) + `README.md` — v7 Slice 7 destination for Outputs (memos, briefings, exports).
- `src/app/app/sources/` (new dir) + `README.md` — v7 Slice 6 destination for Sources surface.
- `src/lib/episodes/README.md` — v4 future home for Episode + Timeline module.
- `src/lib/user-models/README.md` — v4 future home for first-class versioned User Models.
- `src/lib/sources/README.md` — already exists (verify), v7 Slice 6 home.
- `backend/data/ontologies/work/README.md` — placeholder for work-ontology templates (UN DPPA, Foreign ministry, Mediation NGO, Think tank, Sanctions desk, Humanitarian, Foreign correspondent, Academic).

---

## 2. `src/app/api/` inventory (143 route dirs)

A full route-by-route review is out of scope for one Phase A pass. Heuristic
verdicts:

### KEEP — clearly active

- `auth/*`, `account`, `health/*`, `cron/*`, `credits/*`, `notifications/*`
- `ai/*` (78 AI routes — all considered active until per-route audit)
- `admin/*` (mirrors admin pages)
- `boardroom/*`, `dialectica/*`, `sats/*`, `assistant/*`, `advisors/*`
- `documents/*`, `sources/*`, `entities/*`, `graph/*`, `data/*`, `intelligence/*`
- `situations/*`, `cases/*`, `reports/*`, `memos`, `work-products/*`, `export`
- `onboarding/*`, `profile/*`, `preferences`, `settings/*`
- `polar/*` (billing), `email/*`, `promo/*`, `waitlist`, `telemetry/*`
- `tools/*`, `tool-data`, `tool-feedback`, `tool-status`, `capabilities`
- `backend/*` (proxy to FastAPI), `memory/*` (Cognee proxy)
- `artifacts/*`, `annotations`, `calendar/*`, `research`, `context/*`

### REVIEW-LATER (cannot determine without per-route grep)

- `situations/[id]/syria-extract`, `syria-ingest`, `syria-promote` — Syria-specific endpoints. Possibly active demo, possibly dead. Phase C: grep referenced from `/app/syria-case` only?
- `cases/scaffold`, `cases/scaffold/audit` — case-scaffolding workflow, likely active.
- `situations/copy-from-demo` — demo-handoff, likely active.

No routes flagged for retirement in Phase A.

---

## 3. `src/components/` directories (37 top-level)

```
advisory, app, assistant, boardroom, briefing, conflict-graph, dashboard,
demo, desk, documents, domain, editor, evidence, graph, landing, media,
memo, negotiation, onboarding, ontology, personas, praxis, reports,
risk-monitor, sats, settings, shared, situations, sources, syria,
timeline, tools, tour, ui, visualizations, workbench
```

All 37 directories: **KEEP — review-later**. The 2026-05-08 codebase audit
(`03-dead-code/`) likely already enumerated component-level orphans; reconcile
in Phase C against that list rather than re-grepping in Phase A.

---

## 4. `docs/` archival candidates

### Archive under `docs/_archive/2026-05-pre-v4/`

Listed by parent directory. Total ≈ 100+ files.

**Whole subdirectories — strong archive candidates:**

- `docs/codex-prompts/` (53 files: PRAXIS_CODEX_*, PRAXIS_V2_*, PRAXIS_MAY_*, TABS_BUILD_GUIDE, CHAPTERS_BUILD_GUIDE, WORKSPACE_RETHINK) — all historical session prompts.
- `docs/superpowers/specs/` (8 files dated 2026-04-18 → 2026-04-28) — historical design specs, mostly delivered.
- `docs/specs/2026-04-26-improvements/`, `docs/specs/2026-04-27-admin-console-v2/`, `docs/specs/2026-04-27-langgraph-runtime/` — historical specs.
- `docs/phases/PRAXIS_PHASE_{1,2,3}_*.md` — superseded by simplified context core + v7.
- `docs/audits/2026-05-06-audit-branch-archive/` — already an archive; move into `_archive/`.
- `docs/audits/2026-05-08-V2_*.md` (≈ 11 files) — v2 session intakes/decisions; historical.
- `docs/audits/2026-05-08-CODEBASE_AUDIT/` — KEEP (recent and referenced for Phase B/C).
- `docs/audits/2026-05-08-REPO_PURPOSE_AUDIT/` — KEEP (referenced for Phase C).

**Whole subdirectories — KEEP:**

- `docs/architecture/` (full)
- `docs/adr/` (full)
- `docs/runbooks/` (full)
- `docs/v7/` (full — active slice work)
- `docs/roadmap/` (full — active vision)
- `docs/personas/`, `docs/contributing/`, `docs/launch/`, `docs/operational/` — recent and referenced.
- `docs/tools/` — KEEP (generated tool docs registry).
- `docs/backlog/` — KEEP (live ledger).
- `docs/implementation/` — KEEP (active impl notes).

**Top-level `docs/*.md` — KEEP all 8** (all are referenced from `AGENTS.md`):
COMPLIANCE.md, CONTEXT_INJECTION.md, CORPUS_ARCHITECTURE.md, GCP_OPERATIONS.md, OPERATIONAL_SPINE.md, PRAXIS_ARCHITECTURE_AND_AGENT_HANDOFF_2026-05-06.md, PRAXIS_PHASE_SPEC_AUDIT_2026-05-06.md, PRAXIS_TECHNICAL_SPECIFICATION.md.

The handoff/phase-spec-audit pair (dated 2026-05-06) are about to be superseded
by the v4 cleanup outcome itself — flag for Phase B re-evaluation, not yet
archive.

---

## 5. Orphan `scripts/` (not referenced from `package.json`)

Confirmed orphans (7):

```
bench-gliner-cost-reduction.py        # one-shot cost benchmark
migrate-bitemporal.ts                  # one-shot migration
migrate-documents-to-sources.ts        # one-shot migration
migrate-tool-outputs-to-tools.ts       # one-shot migration
migrate-truth-layers.ts                # one-shot migration
seed-domains.ts                        # referenced from CLAUDE.md text — verify
smoke-extraction-pipeline.py           # local smoke test
```

Phase C verdicts:

- `seed-domains.ts` — KEEP and add to `package.json` as `seed:domains` (CLAUDE.md tells users to run it via `npx tsx`, so it's documented).
- The four `migrate-*.ts` — archive under `scripts/_archive/` (one-shot migrations preserved for historical reference).
- `bench-gliner-cost-reduction.py`, `smoke-extraction-pipeline.py` — archive.

---

## 6. Root `*.md` files (14 present, all on the KEEP list)

```
AGENTS.md, ARCHITECTURE.md, BLOCKERS.md, BUILD_LOG.md, CHANGELOG.md,
CLAUDE.md, DEPLOYMENT.md, DESIGN.md, PURPOSE_AUDIT_REPORT.md, README.md,
SECURITY.md, STATUS.md, TESTING.md, TODO.md
```

All match the brief's allowlist. No root MDs to archive.

`PURPOSE_AUDIT_REPORT.md` is on the KEEP list per brief but is also a 2026-05-08
artifact — flag for Phase B: confirm it's still useful or archive into
`docs/audits/`.

---

## 7. `skills/tools/` orphans

`skills/tools/` contains 57 `<id>/SKILL.md` directories. The tool registry source
of truth is `src/lib/constants/tool-registry.ts` (not a `src/lib/tools/registry/`
directory as the brief assumed — that path doesn't exist).

`audit:tool-skills-present` already enforces presence. Phase C action: run that
audit, archive any SKILL.md whose ID is no longer in the registry. Most likely
zero orphans because the audit gate is green.

`skills/subagents/` (6 dirs): memo-drafter, context-preparer, red-team-analyst,
moderator, source-augmenter, output-refiner. All KEEP — these are the subagent
definitions referenced in the architecture bible.

`skills/templates/` — KEEP.

---

## 8. Test files

`tests/` top-level dirs: `advisor, api, assistant, context, e2e, firebase,
fixtures, integration, migrations, onboarding, profile, services, tools, types,
unit`. All KEEP.

Phase C action: after any code archival, run `npm run test` and remove tests
that target archived files. Default to KEEP — reversibility cheap.

---

## 9. `src/lib/services/` (16 files)

```
analyst-memory.ts                situation-initializer.ts
canonical-precheck.ts            sources-preference.ts
conflict-service.ts              syria-demo-initializer.ts
email-service.ts                 tool-data-service.ts
entity-enrichment.ts             ⋯
entity-extraction.ts
export-engine.ts
feedback-service.ts
global-entity-index.ts
graph-populate.ts
nordalia-initializer.ts
pii-scrub.ts
```

Phase C: per-file import grep. The architecture bible suggests several were
deleted by P2B already — this directory may still hold orphans. Default KEEP
until grep'd.

---

## 10. Demo cached responses

`src/lib/demo/cached-responses.ts` (single file, not a directory of fixtures).
Phase C: verify it's referenced from at least one demo page; otherwise archive.
Quick grep confirms `cached-responses` is imported from demo paths — KEEP.

---

## 11. Contradictions found

These are the highest-priority items for Phase B (doc consolidation). Each is a
concrete contradiction between docs or between docs and code.

### 11.1 The "forbidden model strings" instruction is wrong

The cleanup brief flagged `gemini-2.0-*`, `gemini-2.5-*`, and
`gemini-3-pro-preview` as forbidden. **`gemini-2.5-*` is the current canonical
model family in this repo:**

- `src/lib/ai/MODEL_MATRIX.json`: every entry uses `gemini-2.5-flash` / `gemini-2.5-pro`.
- `src/lib/ai/providers.ts:38–39`: comment states "Vertex model lifecycle page lists gemini-2.5-pro and gemini-2.5-flash as latest stable model IDs. The previous Gemini 3 preview was withdrawn."
- `backend/ai/providers.py:10–11`: same.
- `BLOCKERS.md` (2026-05-07 entry "Gemini 3-only prompt conflicts with current model guard") explicitly records this conflict and recommends *not* flipping to Gemini 3 until Vertex availability is verified.
- `CLAUDE.md` "Model String Discipline" + "AI Model Tiers" sections list `gemini-3-flash-preview` and `gemini-3.1-pro-preview` as canonical. **CLAUDE.md is stale relative to the code.**

**Action (Phase B):** update `CLAUDE.md` to say `gemini-2.5-*` is the current
canon and Gemini 3 is gated behind `PRAXIS_ALLOW_GEMINI3_TARGETS=1`. Forbid
`gemini-2.0-*` and `gemini-3-pro-preview` only. Do **not** modify
`MODEL_MATRIX.json`, `providers.ts`, or `backend/ai/providers.py` — they are
production-correct.

Per-file scan summary (25 hits, all on `gemini-2.5-*` and all legitimate):

```
backend/.env.example:24,25         # canonical defaults
backend/ai/providers.py:10,11      # canonical
src/lib/ai/MODEL_MATRIX.json       # canonical (12 hits)
src/lib/ai/providers.ts:38,39,91,98,215,216  # canonical + comments
src/lib/billing/stripe-meters.ts:41          # docstring example
src/components/praxis/output-provenance-panel.tsx:34  # JSDoc example
src/lib/constants/tool-registry.ts:213,433,521  # methodology copy in 3 tool descriptions — OK to keep, OK to update
```

### 11.2 "Forbidden ACLED references" — already clean

`rg -i acled` against `src/ backend/ scripts/ tests/ cloud_functions/` returns
**0 hits**. Production code is already ACLED-free. Mention in `docs/` is
historical context. **No action needed in Phase C item 5.**

### 11.3 Three competing "current direction" docs

Active vision docs that overlap:

- `docs/architecture/PRAXIS_ARCHITECTURE.md` (the bible)
- `docs/architecture/PRAXIS_SIMPLIFIED_CONTEXT_CORE_MODEL_2026-05-08.md`
- `docs/v7/00_VISION_AND_OPERATING_PRINCIPLES.md` + STATUS.md
- `docs/roadmap/PRAXIS_DESIGN_LED_AGENTIC_APP_PLAN_2026-05-08.md`
- `docs/roadmap/PRAXIS_AGENTIC_MOBILE_FIRST_UX_PLAN_2026-05-08.md`
- `docs/roadmap/PRAXIS_TACIT_KNOWLEDGE_UX_REORGANIZATION_PLAN_2026-05-08.md`

These are all dated within a 3-day window (2026-05-08) and largely say the same
thing in different shapes. **Action (Phase B):** keep the bible + simplified
context core + v7 STATUS as the trinity; demote the roadmap trio to "input
material" with a header note pointing forward to the simplified context core
doc.

### 11.4 `AGENTS.md` "Read Before Code" list is bloated

`AGENTS.md` lists 19 mandatory pre-read files including 6 dated codex/handoff
docs that are historical. The brief asked for the first 8 to be:

```
README.md, CLAUDE.md, AGENTS.md, ARCHITECTURE.md,
docs/architecture/PRAXIS_ARCHITECTURE.md,
docs/architecture/PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md,
+ three v4 vision files
```

Adapted (Phase B) to: trim to README, CLAUDE, AGENTS, ARCHITECTURE, the bible,
the live alignment, the simplified context core, v7 STATUS, then STATUS.md /
TODO.md / CHANGELOG `[Unreleased]`. Demote everything else to a "Historical
references" section.

### 11.5 v7 Slice 1 still `proposed`

`docs/v7/STATUS.md` says all 9 slices are `proposed` and Slice 1 has not been
approved by Giulio. The brief assumes v4 starts after this cleanup. **Action
(Phase B):** clarify in v7 STATUS that Slice 1 is the entry point and its
acceptance criteria are unblocking; or supersede with v4 Phase 1 once the
"v4 vision files" actually exist.

### 11.6 References to retired packs / sessions

`STATUS.md`, `BLOCKERS.md`, and `CHANGELOG.md` reference Pack 14, Pack 22, V2
Session A/B/C/D, "night-pack baselines" — historical session machinery. These
should be condensed in Phase B; `STATUS.md` should become a present-tense
description of where the repo is, not a session log.

### 11.7 Brief used "v4" terminology that doesn't match the repo

| Brief term | Repo term | Action |
|---|---|---|
| Contexts | Situations | Use Situations everywhere in scaffolds/ADRs |
| Methods | Tools / Marketplace | Keep Tools; do not rename |
| Drafts / Drafting Studio | Memo Studio / Briefing Studio | Keep existing names |
| Episode + Timeline module | already partially in `src/lib/episodes/` if exists, else scaffold | Verify in Phase D |
| User Models (versioned) | AnalystProfile + profile_versions Firestore subcollection (lives) | Verify before scaffolding new module |

### 11.8 `BLOCKERS.md` notification entry contradicts shipped state

`BLOCKERS.md` (2026-05-07 first entry) implies notification external delivery is
not provider-backed. Cross-check against `CHANGELOG.md` `[Unreleased]` and
`STATUS.md` before Phase B trim — may already be resolved.

---

## 12. Suggested phase sequencing for B–G

**B (doc archive):** Move `docs/codex-prompts/`, `docs/superpowers/specs/`,
`docs/specs/2026-04-*/`, `docs/phases/`, half of `docs/audits/2026-05-08-V2_*`
into `docs/_archive/2026-05-pre-v4/`. Trim `AGENTS.md` handoff list. Update
`CLAUDE.md` "Model String Discipline" to match `MODEL_MATRIX.json` reality. Trim
`TODO.md` and `BLOCKERS.md` aggressively. ~1 day.

**C (dead code):** Per-file grep for `src/lib/services/` orphans, `skills/tools/`
orphans, archive 6 of 7 orphan scripts, run `audit:gate`. Skip the
forbidden-model-string and ACLED removal items — already clean / not actually
forbidden. ~1 day.

**D (scaffolds):** Create README placeholders only. Adapt names to repo
language (Situations not Contexts, Tools not Methods). ~2 hours.

**E (audit stubs):** Add the 8 v4-readiness audit stubs. Wire `audit:v4-readiness`
script. ~2 hours.

**F (ADRs):** Write the 4 ADRs at Proposed status, citing the simplified
context core + v7 docs (since the v4 vision files don't exist). ~3 hours.

**G (verify):** Run `audit:gate` end-to-end, write completion doc. ~half day.

Total realistic effort: **3–4 calendar days** (down from the brief's 5–8),
because much of the brief's heavy lifting is already done by the
2026-05-08 codebase audit.

---

## 13. Hard "do-not-touch" boundaries reconfirmed

Per `CLAUDE.md` "Security Boundaries" and the cleanup brief constraints, no
phase touches:

- `src/lib/firebase/admin.ts`, `config.ts`
- `src/lib/api/with-auth.ts`
- `src/middleware.ts`, `src/proxy.ts`
- `firestore.rules`, `storage.rules`
- `src/lib/auth/cookie-signer.ts`
- The 57 entries under `skills/tools/` (without registry verification)
- The 6 subagent definitions under `skills/subagents/` and `backend/agents/`
- Cognee disabled-first posture
- The 12-entry tool-marketplace hero loop
- Anything that requires `gcloud` or `terraform apply`

---

## 14. Branch + commit plan

Working branch: **`claude/review-praxis-setup-0GOaI`** (per system handoff).

Phase A commit: this file only, message:

```
docs(audits): add v4 cleanup pass Phase A inventory

Read-only inventory of routes, components, lib, scripts, docs, and known
contradictions. Establishes the punch list for Phases B–G.

Adapts the v4 cleanup brief to the actual repo state: uses simplified
context core + v7 docs as the de-facto vision basis since the three
PRAXIS_VISION_v4_*.md files do not exist; corrects the "forbidden model
strings" instruction (gemini-2.5-* is canonical, not deprecated);
confirms ACLED is already clean in code; preserves the existing
Situations/Tools/Memo Studio repo language instead of renaming to
Contexts/Methods/Drafts.
```

Subsequent phases get their own commits. PRs are deferred — open them only on
Giulio's go-ahead.
