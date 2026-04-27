# Agents

This repository is worked on by Codex, Claude Code, and occasional human
operators. Keep this file short: the canonical engineering guide is
[`CLAUDE.md`](./CLAUDE.md), and the current handoff is
[`docs/CONTINUATION.md`](./docs/CONTINUATION.md).

## Start Every Session

```bash
git pull origin main
git status
git log --oneline -5
npm install
```

If the tree is dirty, inspect it before editing. Do not overwrite uncommitted
work unless Giulio explicitly asks.

## Read Before Code

1. [`CLAUDE.md`](./CLAUDE.md)
2. [`README.md`](./README.md)
3. [`CHANGELOG.md`](./CHANGELOG.md)
4. [`docs/ROUND_6_READINESS_2026-04-27.md`](./docs/ROUND_6_READINESS_2026-04-27.md)
5. [`docs/CODEX_HANDOFF_2026-04-27.md`](./docs/CODEX_HANDOFF_2026-04-27.md)
6. [`docs/CONTINUATION.md`](./docs/CONTINUATION.md)
7. [`docs/OPERATIONAL_SPINE.md`](./docs/OPERATIONAL_SPINE.md)
8. [`docs/CONTEXT_INJECTION.md`](./docs/CONTEXT_INJECTION.md)
9. [`docs/SPRINT_EXECUTION_PLAN_2026-04-25.md`](./docs/SPRINT_EXECUTION_PLAN_2026-04-25.md)
10. [`docs/CLAUDE_TANDEM_PROMPTS_2026-04-25.md`](./docs/CLAUDE_TANDEM_PROMPTS_2026-04-25.md)

## Validation

Run the narrowest useful tests while developing. Before a push or deploy,
run the full gate unless the user explicitly asks for a smaller checkpoint:

```bash
npx tsc --noEmit
npm run build
npm run lint
npm run audit:gcp
node scripts/audit-ai-routes.mjs
npx vitest run
```

Lint warnings are currently tracked technical debt; build, typecheck, route
audit, GCP audit, and tests must pass.

## Hard Rules

- Do not hardcode secrets.
- Do not expose internal credit costs in user-facing UI.
- Do not bypass `withCalibration` on AI routes unless explicitly documented
  as exempt.
- Do not add Firestore collections or client query patterns without matching
  rules and indexes.
- Do not deploy or push from a stale clone. Fetch first and preserve newer
  `main` history.
- Keep public source/vendor claims aligned with the current stack:
  Google Cloud/Firebase/Vertex AI, GDELT, UCDP, ReliefWeb, HDX, UN News,
  World Bank, and grounded Google Search.
- Commit coherent checkpoints and push to `main` after validation when
  credentials are available.

