# PRAXIS v7 · STATUS

> **Path:** `docs/v7/STATUS.md`
> The single source of truth for "where are we?". Updated after every PR merge.
> Codex reads this first, every session.

**Last updated:** 2026-05-09 by Codex
**Current focus:** Block 6 Vertex / AI isolation cleared the v7 model-literal drift by centralizing User Core model defaults in `src/lib/ai/model-matrix.ts` and updating the stale v7/workbench guardrails that blocked the full gate. The seven-loop sequence in `03_BUILD_LOOP.md` is canonical; none of Loops A-G are shipped to `main` yet. Production is coherently legacy (`NEXT_PUBLIC_PRAXIS_V7` and `PRAXIS_V7_BACKEND` absent/off); the stacked v7 branch now has a green `npm run audit:gate` as of 2026-05-09.
**Production state:** legacy shell live; v7 not canaried.

---

## Build loops A-G (canonical)

| Loop | Scope | State | Evidence | Next action |
|---|---|---|---|---|
| A | Foundations | in-progress | PR #8 open; `0019`/`0020`, core types, and core audits exist on v7 branches. Block 5 hardens grants so v7 cannot persist public/link grants and adds a focused owner-scoping contract test. Block 6 clears provider-isolation drift and restores a green full audit gate. Ephemeral/production Postgres proof is still missing. | Install/provide Cloud SQL Proxy + ephemeral Postgres path, then rerun migration and production owner-scoping proof. |
| B | The new homepage | in-progress | Block 2 branch makes `/app/home` generic by default, adds seeded example migration `0023`, captures desktop/mobile screenshots, and adds `audit:v7-home-shape`; PR pending. | Review/merge Block 2, then run Block 3 for the first-class Cores picker. |
| C | The new Ask surface | in-progress | PR #9 open; `/app/ask/[threadId]` and backend Ask router exist, but gate is red and production flag is off. | Fix #11 before runtime acceptance can be trusted. |
| D | The new landing | proposed | `03_BUILD_LOOP.md` defines the five-section landing loop; production landing is still legacy/current public site. | Start after B/C or as an independent landing PR. |
| E | User Core inline | in-progress | PR #9 open; User Core drawer/editor code exists locally, but not shipped and gate is red. | Fix #11, then verify Loop E acceptance. |
| F | Situation Core inline | in-progress | PR #9 open; Situation create/fork/share paths are described as local/unmerged. | Verify after Loop E. |
| G | Cores rail + share | in-progress | Block 3 branch adds shared searchable picker on Home/Ask, grouped core kinds, mobile sheet, attach/detach, ordered chips, and `audit:cores-picker-coverage`; Block 5 tightens core grants/owner-scoping contracts and verifies Home -> picker -> build core -> Ask handoff screenshots. PRs pending. | Review/merge Blocks 3 and 5, then run Block 4 Ask routing once Cores DB/read path is trustworthy. |

States: `proposed | in-progress | shipped | reverted`.

## Slices

| # | Slice | Brief | State | PR | Notes |
|---|---|---|---|---|---|
| 0 | Foundations: cores schema + flag | 02, 03 | in-progress | — | migrations/types/flags/audits implemented locally; build/lint/tests/gate-through-cloud pass; ephemeral Postgres blocked by missing Docker; full gate blocked at `audit:gcp` reauth |
| 1 | Foundations: experience map + workflow registry | 01, 02, 03 | in-progress | — | implemented locally; hardened audit and focused tests pass; waits on Slice 00 merge/checkpoint |
| 2 | App shell skeleton (v7 IA) | 01 | in-progress | — | flagged dashboard shell, four primary surface routes, compatibility route shells, and mobile nav implemented locally; build and v7 Playwright smoke pass after four-surface consolidation |
| 3 | Home destination | 01 | in-progress | — | real flagged `/app/home` preview implemented locally; Ask persistence and orchestrator-backed next actions still pending |
| 4 | Ask thread substrate | 01, 02, 04 | in-progress | — | schema/types/audit and flagged `/app/ask` surface implemented locally; runtime persistence/router still pending |
| 5 | Cores Library destination | 01, 03 | in-progress | — | real flagged `/app/cores` surface implemented locally; source/document ingestion consolidation and inline specialist wrappers still pending |
| 6 | Source/Document Core consolidation | 01, 03 | in-progress | — | Source/Document Core panel implemented locally inside Cores; runtime ingest/indexing unification still pending |
| 7 | Outputs destination | 01, 04 | in-progress | — | real flagged `/app/outputs` surface implemented locally; Output Core persistence and export e2e still pending |
| 8 | Analyst Skills + routing | 04 | in-progress | — | Analyst Skills panel implemented locally inside Cores; Ask shows suggested skills, staged skill cards, and input/output contracts; runtime Ask execution still pending |
| 9 | v7 skill manifest | 04 | in-progress | — | derived manifest implemented and verified locally for all 55 registered tools; hand-curated top-skill ontology review still pending |
| 10 | Ask runtime persistence seam | 01, 02, 04 | in-progress | — | FastAPI Ask router, authenticated proxy path, and v7 Ask runtime panel implemented locally; calibrated generation and skill-run execution still use the existing chat path |
| 11 | Ask routing layer | 01, 02, 04 | in-progress | — | inspectable routing service implemented locally for direct answers, staged skills, subagent plans, clarification receipts, and top candidate skill IDs; execution still remains on existing chat path |
| 12 | Ask core resolution | 01, 02, 03 | in-progress | — | resolver implemented locally for implicit User/Situation Cores, explicit attachments, ontology binding, context health, core audit attach rows, and visible Ask core-context receipts |
| 13 | Ask direct answer execution | 01, 02, 03, 04 | in-progress | — | direct-answer executor implemented locally from resolved Context Cores; Vertex calls are gated by `PRAXIS_V7_ASK_AI_ENABLED`, and skill/subagent execution remains pending |
| 14 | Cores read API | 01, 02, 03 | in-progress | — | owner-scoped Core list/detail API, authenticated proxy path, local fallback, materialized-core UI panel, and audit implemented locally |
| 15 | Ask core skill execution | 01, 02, 03, 04 | in-progress | — | first read-only consolidated skills execute from resolved Context Cores: research-sources, actors-stakeholders, briefing-studio |
| 16 | Cutover | all | proposed | — | depends on 0–15 |

States: `proposed | in-progress | shipped | reverted`.

---

## Production checklist (for slice 15)

- [ ] All slices 0–15 shipped + audits green for 7 days.
- [ ] `monitoring/v7_dashboard.json` deployed and showing real traffic.
- [ ] Migrations 0019–0022 applied to prod.
- [ ] Cognee toggle tested in `disabled` and `postgres-kuzu` modes.
- [ ] Smoke tests in Cloud Build green for 5 consecutive deploys.
- [ ] Canary 5% → 25% → 100% by uid hash, each step held 24h with no regression.
- [ ] Legacy shell reachable at `/app/legacy/*` for one full release cycle.

---

## Open questions (mirrored from `OPEN_QUESTIONS.md`)

| # | Question | State | Default if not answered |
|---|---|---|---|
| Q1 | Team Cores ship in v7 or v7.1? | open | schema-only in v7, UI in v7.1 |
| Q2 | Public link sharing in v7? | open | hidden behind flag, off |
| Q3 | Cognee enabled in prod? | open | off; toggle exists |
| Q4 | Which seeded examples ship in the shared library? | open | seed 6-10 diverse examples idempotently; Syria is one option, never the default |
| Q5 | MT-1..5 multi-tenant decisions APPROVED? | open | block Team Core UI until approved |

---

## Recent decisions (mirrored from `DECISION_LOG.md`)

[Append-only. Newest first. One paragraph each.]

- **YYYY-MM-DD — [Codex] —** [decision summary] (PR #NNNN, ADR `docs/adr/NNNN-title.md`).

---

## Known issues / flakies

[Things that are red but not blocking, with owner and ETA. If this list
gets longer than 5, stop new work and burn it down.]

- `audit:gate` fails at `audit:gcp` in this local shell because `gcloud` and ADC require browser reauthentication. Owner: GC/Codex once credentials are refreshed. Workaround: run `npm run auth:doctor` and the printed `gcloud auth login --update-adc` / ADC commands.
- Slice 00 foundation implementation is local and unmerged: `0019`/`0020`, core TS/Python schemas, v7 flags, and core audits now exist. Ephemeral Postgres migration verification is blocked because Docker is not installed in this shell. Full `audit:gate` passes through local/static audits and tests, then fails at `audit:gcp` because `gcloud` requires browser reauthentication. Owner: Codex/GC.
- Slice 01 experience map implementation is local and unmerged: the four-surface map and agentic workflow registry exist; `audit:experience-map-coherence`, `audit:simplified-capability-ledger`, and focused unit tests pass after the four-surface consolidation. Owner: Codex.
- Slice 02 app shell skeleton is local and unmerged: `/api/health/features` exposes `praxisV7`, the client feature boundary normalizes it, the dashboard can show `V7CommandShell`, and `/app/home`, `/app/ask`, `/app/cores`, and `/app/outputs` render behind the flag. `/app/situation`, `/app/sources`, and `/app/advanced` remain compatibility routes into Cores. `npm run build` and `PRAXIS_V7_BACKEND=true` Playwright smoke pass. Owner: Codex.
- Slice 03 Home surface preview is local and unmerged: `/app/home` renders `V7HomeSurface` with active Situation, Ask CTA, core-readiness chips, next actions, and Cores/Outputs links behind the v7 flag. Owner: Codex.
- Slice 04 Ask thread substrate is local and unmerged: `0022_ask_threads`, TS/Pydantic Ask types, `audit:ask-thread-substrate`, and `V7AskSurface` exist. Runtime persistence into the new tables is not yet implemented. Owner: Codex.
- Slice 05 Cores Library surface is local and unmerged: `/app/cores` renders `V7CoresSurface`; `/app/situation`, `/app/sources`, and `/app/advanced` render entry-specific Cores views; `audit:v7-cores-surface` is wired into the gate. Source/document ingestion consolidation, inline specialist wrappers, and runtime Core persistence remain pending. Owner: Codex.
- Slice 06 Source/Document Core panel is local and unmerged: Cores Library now shows source receipts, upload/extraction/index posture, coverage gaps, and Source Scout as an in-context action through `V7SourceDocumentCorePanel`; `audit:v7-source-document-core-panel` is wired into the gate. Runtime ingest/indexing unification remains pending. Owner: Codex.
- Slice 07 Outputs surface is local and unmerged: `/app/outputs` renders `V7OutputsSurface` with output templates, output buckets, provenance posture, and existing Ask/editor/export entry points; `audit:v7-outputs-surface` is wired into the gate. Output Core persistence and export e2e remain pending. Owner: Codex.
- Slice 08 Analyst Skills panel is local and unmerged: Cores Library now renders `V7AnalystSkillsPanel`, grouping the consolidated capability ledger as Structure, Research, Analysis, and Production skills, with structural/no-AI posture labels and Stage in Ask links. `/app/ask?skill=<id>` now shows a staged skill card, and Ask shows suggested skills plus an input/output contract before the chat. Runtime skill execution from Ask remains pending. Owner: Codex.
- Slice 09 v7 skill manifest is local and unmerged: `src/lib/tools/v7-skill-manifest.ts` derives v7 `skillCategory`, `ontologyCompat`, structural posture, and v7 visibility for every registered tool; `audit:v7-skill-manifest` is wired into the gate and passes for all 55 registered tools. Hand-curated launch review for the top visible skills remains pending. Owner: Codex.
- Slice 10 Ask runtime persistence seam is local and unmerged: `backend/routers/ask.py` persists owner-scoped Ask threads/messages through `tenant_session`, `/api/backend/ask/run` is allowlisted through the authenticated Next proxy, and `/app/ask` renders `V7AskRuntimePanel` with honest copy that calibrated generation still uses the existing chat path. `audit:v7-ask-runtime` is wired into the gate. Owner: Codex.
- Slice 11 Ask routing layer is local and unmerged: `backend/services/ask/router.py` classifies Ask turns into `direct_answer`, `run_skill`, `run_subagent_plan`, or `clarify`, persists the routing receipt and top candidate skill IDs on `ask_messages`, returns them from `/ask/run`, and shows them in `/app/ask`. `audit:v7-ask-routing-layer` is wired into the gate. Owner: Codex.
- Slice 12 Ask core resolution is local and unmerged: `backend/services/cores/resolver.py` resolves implicit User/Situation Cores plus explicit attachments, persists a `coreContext` snapshot on Ask threads/messages, writes `core_audit` attach rows, and shows context health/advisories in `/app/ask`. `audit:v7-ask-core-resolution` is wired into the gate. Owner: Codex.
- Slice 13 Ask direct answer execution is local and unmerged: `backend/services/ask/executor.py` builds direct-answer prompts from resolved Context Cores, persists assistant execution metadata and core citations, and can call Vertex/Gemini when `PRAXIS_V7_ASK_AI_ENABLED=true`. Skill and subagent actions still return staged execution receipts. `audit:v7-ask-direct-execution` is wired into the gate. Owner: Codex.
- Slice 14 Cores read API is local and unmerged: `backend/routers/cores.py` exposes owner-scoped `GET /cores` and `GET /cores/{id}`, the authenticated Next proxy allowlists `/api/backend/cores`, `/app/cores` shows a materialized-core panel with fallback posture, and `audit:v7-cores-api` is wired into the gate. Core mutations and backfill remain pending. Owner: Codex.
- Slice 15 Ask core skill execution is local and unmerged: `backend/services/ask/executor.py` now executes `research-sources`, `actors-stakeholders`, and `briefing-studio` from the resolved `coreContext`, with Vertex/Gemini calls gated by `PRAXIS_V7_ASK_AI_ENABLED` and deterministic core-grounded previews when disabled. Unsupported tools and subagent plans still return staged receipts. `audit:v7-ask-skill-execution` is wired into the gate. Owner: Codex.
- New Face Loop 1 is local and unmerged: `docs/v7/build/01_THE_NEW_FACE.md` is installed and corrected to require a generic empty home by default. Block 2 now implements and verifies that branch state: workspace name, User Core only, "No Situation selected", disabled Ask copy, four greyed-out tools, seeded examples CTA, mobile empty state, and Lighthouse performance 86. Owner: Codex.
- Cores Inline Loops 1-3 are local and unmerged: `docs/v7/build/02_CORES_INLINE.md` is installed and corrected to make multi-select core attachment canonical. Block 3 adds the shared first-class picker for Home/Ask with grouped core kinds, live search, mobile sheet, attach/detach, reorder controls, and DnD handler coverage. Block 5 hardens `core_grants` to schema-disallow public/link grants in v7, adds focused owner-scoping contract tests, adds a build-core picker menu, and verifies that Home carries selected cores into Ask. Block 6 keeps User Core model defaults in the audited AI model boundary so inline Cores do not duplicate provider literals in UI files. `audit:v7-inline-cores`, `audit:cores-picker-coverage`, and `audit:cores-grants-coverage` are wired into `audit:gate`. Production lazy backfill and Cloud SQL proof remain pending. Owner: Codex.
- Block 5 production SQL inspection is blocked in this shell: Cloud SQL instance `praxisbytacitus-instance` is private-IP-only, `cloud-sql-proxy`, `psql`, and Docker are not installed locally, and `gcloud sql connect` fails before opening a session. Owner: Codex/GC to install proxy or provide a production-safe SQL inspection path.
- Build Loop playbook is local and unmerged: `docs/v7/build/03_BUILD_LOOP.md` is installed, listed in `docs/v7/INDEX.md`, and `audit:v7-build-loop` is wired into `audit:gate` to keep the A-G loop sequence, ADVANCE/VERIFY prompt rhythm, Vertex-only routing, drawer-first cores, anchor-core model, non-negotiables, and ledger references from drifting. Owner: Codex.
- Production v7 verification is incomplete: Cloud Run revisions and `monitoring/v7_dashboard.json` were not verified in this shell. Owner: Codex after GCP auth is repaired.

---

## Next session prompt (Codex copy-pastes this into chat)

```
Read docs/v7/STATUS.md, then docs/v7/<the brief that owns the current focus>.
Resume the current slice. Follow AGENTS.md §1 (session ritual) and §4
(self-review). Ship to main behind flags. Update STATUS.md when done.
```
