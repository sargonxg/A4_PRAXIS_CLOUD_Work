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
5. [`docs/product/README.md`](./docs/product/README.md)
6. [`docs/product/PRAXIS_CANONICAL_APP_STRUCTURE.md`](./docs/product/PRAXIS_CANONICAL_APP_STRUCTURE.md)
7. [`docs/product/CONTEXT_CAPSULE_POLICY_RESEARCH_GUIDE.md`](./docs/product/CONTEXT_CAPSULE_POLICY_RESEARCH_GUIDE.md)
8. [`docs/product/TASKLET_STYLE_PRAXIS_AGENT_RUNTIME_PLAN.md`](./docs/product/TASKLET_STYLE_PRAXIS_AGENT_RUNTIME_PLAN.md)
9. [`docs/build/PRAXIS_CONTEXT_CAPSULE_APP_BUILD_LEDGER_2026-05-15.md`](./docs/build/PRAXIS_CONTEXT_CAPSULE_APP_BUILD_LEDGER_2026-05-15.md)
10. [`docs/build/PRAXIS_TASKLET_RUNTIME_AGENT_PROMPTS.md`](./docs/build/PRAXIS_TASKLET_RUNTIME_AGENT_PROMPTS.md)
11. [`docs/product/CONTEXT_CAPSULE_PRODUCT_REBUILD_PLAN.md`](./docs/product/CONTEXT_CAPSULE_PRODUCT_REBUILD_PLAN.md)
12. [`docs/product/TASKLET_RESEARCH_INTAKE_2026-05-15.md`](./docs/product/TASKLET_RESEARCH_INTAKE_2026-05-15.md)
13. [`docs/product/PRAXIS_FOUNDATION_COHERENCE_CHECK_2026-05-15.md`](./docs/product/PRAXIS_FOUNDATION_COHERENCE_CHECK_2026-05-15.md)
14. [`docs/architecture/PRAXIS_ARCHITECTURE.md`](./docs/architecture/PRAXIS_ARCHITECTURE.md)
15. [`docs/architecture/PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md`](./docs/architecture/PRAXIS_ARCHITECTURE_LIVE_APP_ALIGNMENT.md)
16. [`STATUS.md`](./STATUS.md)
17. [`TODO.md`](./TODO.md)
18. [`CHANGELOG.md`](./CHANGELOG.md) — `[Unreleased]` section only

Historical v5 phase prompts remain useful evidence. Consult
[`docs/build/PRAXIS_v5_EXECUTION_LEDGER.md`](./docs/build/PRAXIS_v5_EXECUTION_LEDGER.md)
and related v5 files only when a task explicitly touches older v5 work.

## Operational references (consult when relevant)

- [`docs/CONTEXT_INJECTION.md`](./docs/CONTEXT_INJECTION.md)
- [`docs/OPERATIONAL_SPINE.md`](./docs/OPERATIONAL_SPINE.md)
- [`docs/CORPUS_ARCHITECTURE.md`](./docs/CORPUS_ARCHITECTURE.md)
- [`docs/GCP_OPERATIONS.md`](./docs/GCP_OPERATIONS.md)
- [`docs/COMPLIANCE.md`](./docs/COMPLIANCE.md)
- [`docs/PRAXIS_TECHNICAL_SPECIFICATION.md`](./docs/PRAXIS_TECHNICAL_SPECIFICATION.md)


## v7 Slice Work

The current canonical product/runtime structure is under `docs/product/`.
For historical design-led Ask PRAXIS, mobile-first, tacit-knowledge
simplification work, consult these only when a v7 slice is explicitly assigned:

1. [`docs/v7/README.md`](./docs/v7/README.md)
2. [`docs/v7/STATUS.md`](./docs/v7/STATUS.md)
3. [`docs/v7/AGENTS.md`](./docs/v7/AGENTS.md)
4. [`docs/v7/OPEN_QUESTIONS.md`](./docs/v7/OPEN_QUESTIONS.md)

Do not start a v7 slice that is still marked `proposed` without Giulio's
approval. Use [`docs/v7/SLICE_TEMPLATE.md`](./docs/v7/SLICE_TEMPLATE.md) for
new slices and store slice plans under [`docs/v7/SLICES/`](./docs/v7/SLICES/).

## Validation

Run the narrowest useful tests while developing. Before a push or deploy,
run the full gate unless the user explicitly asks for a smaller checkpoint:

```bash
npx tsc --noEmit
npm run build
npm run lint
npm run audit:repo-shape
npm run audit:gate
npm run audit:architecture-reference
npm run audit:gcp
node scripts/audit-ai-routes.mjs
npx vitest run
```

Lint warnings are currently tracked technical debt; build, typecheck, route
audit, GCP audit, repo-shape audit, and focused tests for touched areas must
pass before a deploy checkpoint.

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
- The full repo graph currently exceeds the 5,000-node HTML visualization guard. Do not resurrect stale `graphify-out/graph.html`; use `graph.json`/`GRAPH_REPORT.md` or generate a narrowed subgraph.
