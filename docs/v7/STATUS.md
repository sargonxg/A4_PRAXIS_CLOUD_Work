# PRAXIS v7 · STATUS

> **Path:** `docs/v7/STATUS.md`
> The single source of truth for "where are we?". Updated after every PR merge.
> Codex reads this first, every session.

**Last updated:** 2026-05-10
**Current focus:** Slice 1 remains proposed pending Giulio approval. Repo doc tree was cleaned on 2026-05-10 (historical specs, codex prompts, V2/Z session intakes, and phase-foundation docs removed; agent handoff lists trimmed).
**Production state:** legacy shell live; v7 design-led Ask PRAXIS shell not yet implemented.

---

## Slices

| # | Slice | Brief | State | PR | Notes |
|---|---|---|---|---|---|
| 1 | Foundations: cores schema + flag | 02, 03 | proposed | — | — |
| 2 | App shell skeleton (v7 IA) | 01 | proposed | — | depends on 1 |
| 3 | Home destination | 01 | proposed | — | depends on 2 |
| 4 | Ask end-to-end | 01, 02, 04 | proposed | — | depends on 3 |
| 5 | Situation destination | 01, 03 | proposed | — | depends on 2 |
| 6 | Sources destination | 01, 03 | proposed | — | depends on 2 |
| 7 | Outputs destination | 01, 04 | proposed | — | depends on 2 |
| 8 | Analyst Skills + routing | 04 | proposed | — | depends on 4 |
| 9 | Cutover | all | proposed | — | depends on 1–8 |

States: `proposed | in-progress | shipped | reverted`.

---

## Production checklist (for slice 9)

- [ ] All slices 1–8 shipped + audits green for 7 days.
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

- **2026-05-08 — Codex —** Installed the v7 operating packet under `docs/v7/` rather than replacing root `AGENTS.md`. The packet governs future v7 slices after Giulio approves a slice to move from `proposed` to `in-progress`.

---

## Known issues / flakies

No known v7-specific flakies yet. Existing repo-wide audit/build posture remains governed by root docs and `package.json`.

---

## Next session prompt (Codex copy-pastes this into chat)

```
Read root AGENTS.md and docs/v7/AGENTS.md, then docs/v7/STATUS.md,
docs/v7/OPEN_QUESTIONS.md, and the approved slice under docs/v7/SLICES/.
If Slice 1 is still proposed, stop and ask Giulio before implementation.
Follow docs/v7/AGENTS.md session ritual and self-review. Ship to main behind
flags only after approval. Update STATUS.md and DECISION_LOG.md when done.
```
