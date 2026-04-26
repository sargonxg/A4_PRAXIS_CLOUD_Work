# Agents

This repository is worked on by both **Claude Code** and **OpenAI Codex** agents.

The single source of truth for repository conventions, architecture, model-string discipline, security boundaries, file structure, key flows, and anti-patterns is **[CLAUDE.md](./CLAUDE.md)**.

Codex agents auto-load this file (`AGENTS.md`); Claude Code auto-loads `CLAUDE.md`. Both should read the same content — keep updates in `CLAUDE.md` only to avoid drift.

## Quick links for any agent before touching code

1. **[CLAUDE.md](./CLAUDE.md)** — full conventions (start here)
2. **[README.md](./README.md)** — project overview, stack, deploy, file map
3. **[docs/CONTINUATION.md](./docs/CONTINUATION.md)** — what the last session did, what's next
4. **[docs/superpowers/specs/2026-04-24-praxis-completion-master-plan.md](./docs/superpowers/specs/2026-04-24-praxis-completion-master-plan.md)** — current Phase A→D master plan
5. **[CHANGELOG.md](./CHANGELOG.md)** — version history

## Verification before declaring "done"

```bash
npx tsc --noEmit
npm run build
node scripts/audit-ai-routes.mjs
npm run audit:gcp
```

Do **not** deploy to `praxis.tacitus.me` until all four pass. See `docs/CONTINUATION.md` for the full deploy sequence.
