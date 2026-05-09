# PRAXIS v7 · STATUS

> **Path:** `docs/v7/STATUS.md`
> The single source of truth for "where are we?". Updated after every PR merge.
> Codex reads this first, every session.

**Last updated:** 2026-05-09 by Codex
**Current focus:** Loop A - Foundations. The Build Loop in `docs/v7/build/03_BUILD_LOOP.md` is now the canonical v7 sequence. The older slice ledger is preserved below only for traceability.
**Production state:** legacy shell live; v7 not canaried.

---

## Canonical Loops

The canonical sequence is `A -> B -> C -> D -> E -> F -> G` from
`docs/v7/build/03_BUILD_LOOP.md`. A loop is not `shipped` until its PR is
merged to `main` and its acceptance checks are green. Local implementation
from the superseded slice plan is useful evidence, not shipped status.

| Loop | Name | Brief | State | PR | Acceptance posture |
|---|---|---|---|---|---|
| A | Foundations | 02, 03 | in-review | pending | `0019`/`0020`, TS/Pydantic core schemas, v7 flags, and core audits exist locally. Static audits, typecheck, lint, build, flag-on build, and full Vitest pass. `audit:gate` reaches the cloud posture check and then fails because gcloud cannot refresh tokens non-interactively. Ephemeral Postgres upgrade/downgrade remains unverified locally because Docker/psql are not installed; CI/prod migration proof is required before marking shipped. |
| B | The new homepage | 01 | proposed | - | Begins after Loop A PR is merged or explicitly approved to parallelize. |
| C | The new Ask surface | 01, 02, 04 | proposed | - | Begins after Loop B shell/handoff is reviewed, unless owner explicitly scopes a backend-only preparatory PR. |
| D | The new landing | 01 | proposed | - | Not started under the canonical loop plan. |
| E | User Core inline | 02, 03 | proposed | - | Starts only after Loop A foundations are merged. |
| F | Situation Core inline | 02, 03 | proposed | - | Starts after Loop E; depends on Core API and inline drawer acceptance. |
| G | Cores rail + share | 02, 03 | proposed | - | Starts after Loop F; includes drag/drop, grants, default attachments, and recipient proof. |

States: `proposed | in-progress | in-review | shipped | blocked | reverted`.

## Superseded Slice Ledger

The rows below are retained for traceability only. They are superseded by
Loops A-G and must not be used as the canonical execution sequence.

| # | Slice | Brief | State | PR | Notes |
|---|---|---|---|---|---|
| 0 | Foundations: cores schema + flag | 02, 03 | superseded by Loop A | — | migrations/types/flags/audits implemented locally; now reviewed under Loop A |
| 1 | Foundations: experience map + workflow registry | 01, 02, 03 | superseded by Loop B | — | four-surface/product registry work maps to Loop B/C support |
| 2 | App shell skeleton (v7 IA) | 01 | superseded by Loop B | — | shell and route work maps to Loop B |
| 3 | Home destination | 01 | superseded by Loop B | — | `/app/home` preview maps to Loop B |
| 4 | Ask thread substrate | 01, 02, 04 | superseded by Loop C | — | Ask schema/types map to Loop C |
| 5 | Cores Library destination | 01, 03 | superseded by Loops E-G | — | Cores Library surface maps to the inline Core loops |
| 6 | Source/Document Core consolidation | 01, 03 | superseded by Loops E-G | — | source/document panels remain supporting detail inside Case Core |
| 7 | Outputs destination | 01, 04 | superseded by Loop C | — | output promotion/export work maps to Loop C and post-loop cutover |
| 8 | Analyst Skills + routing | 04 | superseded by Loop C | — | Ask routing and skill suggestion work maps to Loop C |
| 9 | v7 skill manifest | 04 | superseded by Loop C | — | skill metadata supports Loop C |
| 10 | Ask runtime persistence seam | 01, 02, 04 | superseded by Loop C | — | Ask persistence maps to Loop C |
| 11 | Ask routing layer | 01, 02, 04 | superseded by Loop C | — | routing maps to Loop C |
| 12 | Ask core resolution | 01, 02, 03 | superseded by Loop C | — | core resolution maps to Loop C |
| 13 | Ask direct answer execution | 01, 02, 03, 04 | superseded by Loop C | — | direct answer execution maps to Loop C |
| 14 | Cores read API | 01, 02, 03 | superseded by Loop A/E/F/G | — | read API supports Loop A foundation and inline loops |
| 15 | Ask core skill execution | 01, 02, 03, 04 | superseded by Loop C | — | first read-only skill execution maps to Loop C |
| 16 | Cutover | all | superseded by post-G | — | cutover starts only after Loops A-G ship |

---

## Production checklist (after Loop G)

- [ ] All Loops A-G shipped + audits green for 7 days.
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
| Q4 | Syria demo seeded on every deploy? | open | seed once, idempotent |
| Q5 | MT-1..5 multi-tenant decisions APPROVED? | open | block Team Core UI until approved |

---

## Recent decisions (mirrored from `DECISION_LOG.md`)

[Append-only. Newest first. One paragraph each.]

- **2026-05-09 — Codex —** `docs/v7/build/03_BUILD_LOOP.md` is the canonical v7 execution order. The older slice ledger is retained below as traceability only, and Loop A is reviewed as a foundations-only branch with later Home/Ask/Core UI work deferred to Loops B-G.

---

## Known issues / flakies

[Things that are red but not blocking, with owner and ETA. If this list
gets longer than 5, stop new work and burn it down.]

- `audit:gate` fails at `audit:gcp` in this local shell because `gcloud` and ADC require browser reauthentication. Owner: GC/Codex once credentials are refreshed. Workaround: run `npm run auth:doctor` and the printed `gcloud auth login --update-adc` / ADC commands.
- Loop A ephemeral Postgres migration upgrade/downgrade is not locally verified because this shell has no Docker or `psql`. Owner: Codex/CI. Required before Loop A can move from `in-review` to `shipped`.
- Alembic currently reports more than one migration head in this repo family. Owner: Codex/DB reviewer before production migration. Loop A adds `0020_cores_linkage` on the `0019` chain but does not resolve the pre-existing branch.
- Production v7 verification is incomplete: Cloud Run revisions and `monitoring/v7_dashboard.json` were not verified in this shell. Owner: Codex after GCP auth is repaired.

---

## Next session prompt (Codex copy-pastes this into chat)

```
Read docs/v7/STATUS.md, then docs/v7/<the brief that owns the current focus>.
Resume the current slice. Follow AGENTS.md §1 (session ritual) and §4
(self-review). Ship to main behind flags. Update STATUS.md when done.
```
