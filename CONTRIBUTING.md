# Contributing to PRAXIS

PRAXIS is a proprietary TACITUS product. External contributions are not
accepted without a signed agreement; reach out to legal@tacitus.me first.

## Working on the codebase

Before you touch anything, read these in order:

1. `README.md`
2. `CLAUDE.md` — collaboration rules for human + AI agents
3. `AGENTS.md` — hard rules, validation gate, deploy procedure
4. `ARCHITECTURE.md`
5. `SECURITY.md` — must-read for any change touching auth, secrets, or rules

## Local quickstart

```bash
git clone https://github.com/sargonxg/A4_PRAXIS_CLOUD_Work.git
cd A4_PRAXIS_CLOUD_Work
npm install
npm run dev
```

Backend + Neo4j + FalkorDB:

```bash
docker-compose up
```

## Validation gate (run before every PR)

```bash
npx tsc --noEmit
npm run lint
npm run build
npx vitest run
cd backend && pytest -q
```

## Commit style

Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`). One concern per commit.
Sign commits with the `Co-Authored-By:` trailer when authored with an AI agent.
