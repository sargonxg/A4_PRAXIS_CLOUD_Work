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
3. [`TODO.md`](./TODO.md)
4. [`docs/PRAXIS_SUPERPLAN_2026-04-29.md`](./docs/PRAXIS_SUPERPLAN_2026-04-29.md)
5. [`CHANGELOG.md`](./CHANGELOG.md)
6. [`docs/ROUND_6_READINESS_2026-04-27.md`](./docs/ROUND_6_READINESS_2026-04-27.md)
7. [`docs/DEEP_RESEARCH_ACTION_PLAN_2026-04-27.md`](./docs/DEEP_RESEARCH_ACTION_PLAN_2026-04-27.md)
8. [`docs/LANGGRAPH_CLOUDSQL_CHECKPOINTING.md`](./docs/LANGGRAPH_CLOUDSQL_CHECKPOINTING.md)
9. [`docs/CODEX_HANDOFF_2026-04-27.md`](./docs/CODEX_HANDOFF_2026-04-27.md)
10. [`docs/CONTINUATION.md`](./docs/CONTINUATION.md)
11. [`docs/OPERATIONAL_SPINE.md`](./docs/OPERATIONAL_SPINE.md)
12. [`docs/CONTEXT_INJECTION.md`](./docs/CONTEXT_INJECTION.md)
13. [`docs/SPRINT_EXECUTION_PLAN_2026-04-25.md`](./docs/SPRINT_EXECUTION_PLAN_2026-04-25.md)
14. [`docs/CLAUDE_TANDEM_PROMPTS_2026-04-25.md`](./docs/CLAUDE_TANDEM_PROMPTS_2026-04-25.md)

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

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)
