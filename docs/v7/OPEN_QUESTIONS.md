# PRAXIS v7 Open Questions

Status: active

This file records decisions that Codex must not silently answer during v7 implementation.

| # | Question | State | Default If Not Answered | Notes |
|---|---|---|---|---|
| Q1 | Team Cores ship in v7 or v7.1? | open | Schema-only in v7, UI in v7.1 | Do not build Team Core UI until approved. |
| Q2 | Public link sharing in v7? | open | Hidden behind flag, off | Sharing affects auth and trust posture. |
| Q3 | Cognee enabled in production? | open | Off; toggle exists | UI should use context language and disabled-safe states. |
| Q4 | Syria demo seeded on every deploy? | open | Seed once, idempotent | Avoid deploy-time surprise writes. |
| Q5 | MT-1..5 multi-tenant decisions approved? | open | Block Team Core UI until approved | Requires owner-scoping review. |

## Escalation Format

When adding a question, use:

```md
## QN - Short title

**Brief:** <00..04 or roadmap>
**Slice:** <id>
**Question:** <one sentence>
**Options:** A) ... B) ... C) ...
**My default:** <which option Codex recommends>
**Blocking what:** <slices or files blocked>
**State:** open | approved | rejected | deferred
```
