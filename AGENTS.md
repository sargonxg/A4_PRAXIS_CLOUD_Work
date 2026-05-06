# Agents

This repository is worked on by Codex, Claude Code, and occasional human
operators. Keep this file short: the canonical engineering guide is
[`CLAUDE.md`](./CLAUDE.md). The architecture entrypoint is
[`ARCHITECTURE.md`](./ARCHITECTURE.md), which links the canonical architecture
bible to the live-app alignment notes.

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

1. [`README.md`](./README.md)
2. [`CLAUDE.md`](./CLAUDE.md)
3. [`AGENTS.md`](./AGENTS.md)
4. [`ARCHITECTURE.md`](./ARCHITECTURE.md)
5. [`docs/architecture/PRAXIS_ARCHITECTURE.md`](./docs/architecture/PRAXIS_ARCHITECTURE.md)
6. [`docs/architecture/PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md`](./docs/architecture/PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md)
7. [`TODO.md`](./TODO.md)
8. [`CHANGELOG.md`](./CHANGELOG.md)
9. [`docs/CONTEXT_INJECTION.md`](./docs/CONTEXT_INJECTION.md)
10. [`docs/OPERATIONAL_SPINE.md`](./docs/OPERATIONAL_SPINE.md)
11. [`docs/CORPUS_ARCHITECTURE.md`](./docs/CORPUS_ARCHITECTURE.md)
12. [`docs/GCP_OPERATIONS.md`](./docs/GCP_OPERATIONS.md)
13. [`docs/COMPLIANCE.md`](./docs/COMPLIANCE.md)
14. [`docs/PRAXIS_TECHNICAL_SPECIFICATION.md`](./docs/PRAXIS_TECHNICAL_SPECIFICATION.md)
15. [`docs/phases/PRAXIS_PHASE_1_FOUNDATION.md`](./docs/phases/PRAXIS_PHASE_1_FOUNDATION.md)
16. [`docs/phases/PRAXIS_PHASE_2_AGENTIC_SPINE.md`](./docs/phases/PRAXIS_PHASE_2_AGENTIC_SPINE.md)
17. [`docs/phases/PRAXIS_PHASE_3_PRODUCT_SURFACE.md`](./docs/phases/PRAXIS_PHASE_3_PRODUCT_SURFACE.md)
18. [`docs/PRAXIS_ARCHITECTURE_AND_AGENT_HANDOFF_2026-05-06.md`](./docs/PRAXIS_ARCHITECTURE_AND_AGENT_HANDOFF_2026-05-06.md)
19. [`docs/PRAXIS_PHASE_SPEC_AUDIT_2026-05-06.md`](./docs/PRAXIS_PHASE_SPEC_AUDIT_2026-05-06.md)

## Validation

Run the narrowest useful tests while developing. Before a push or deploy,
run the full gate unless the user explicitly asks for a smaller checkpoint:

```bash
npx tsc --noEmit
npm run build
npm run lint
npm run audit:architecture-chain
npm run audit:architecture-reference
npm run audit:gcp
node scripts/audit-ai-routes.mjs
npx vitest run
npx tsx scripts/audit-phase3-product-surface.ts
npx tsx scripts/audit-verb-hookup.ts
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
