# Improvement Specs — 2026-04-26 Round 3

Drop-in specs for the seven improvements from
`docs/IMPROVEMENT_15_2026-04-26.md` items #9–15 that were intentionally
deferred from round 3 code work but are fully specified so a fresh
agent can pick one up and ship in a day.

| # | Spec | Owner | Brick | Effort |
|---|---|---|---|---|
| 9 | [`09-onboarding-rationale.md`](./09-onboarding-rationale.md) | Codex (Workspace Personalization) | NEW BRICK 39 | ~1d |
| 10 | [`10-document-ai.md`](./10-document-ai.md) | Codex (ops) | BIG #31 | ~2d |
| 11 | [`11-cloud-translation.md`](./11-cloud-translation.md) | Codex / Claude | BIG #32 | ~2d |
| 12 | [`12-brainstorming-cloud-tasks.md`](./12-brainstorming-cloud-tasks.md) | Codex (backend + ops) | BIG #18 | ~3d |
| 13 | [`13-changed-since.md`](./13-changed-since.md) | Codex (Workspace Personalization) | NEW BRICK 40 | ~1d |
| 14 | [`14-briefing-versioning.md`](./14-briefing-versioning.md) | Claude (UX) | BIG #9 | ~2d |
| 15 | [`15-domain-overrides.md`](./15-domain-overrides.md) | Claude (Tools) | BIG #6 | ~1d |

Read order: README first, then any spec relevant to the lane you are
about to ship. Every spec follows the same shape:

1. Problem statement (2 sentences).
2. Persona impact (named).
3. Files involved (paths + new vs edit).
4. Schema / interface contracts (where applicable).
5. Implementation order (numbered steps).
6. Definition of done.
7. Validation gate.
8. Risks / open questions.

When a spec is implemented, mark its row `🟢 done` in
`docs/TODO_BOARD_2026-04-26.md` and append the brick id + commit SHA
to the bottom of this README's table.
